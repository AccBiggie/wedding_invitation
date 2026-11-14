import crypto from 'node:crypto';
import mongoose from 'mongoose';
import Invitation, { GUEST_CATEGORIES, GUEST_RESPONSES, INVITATION_STATUSES, guestResponse, invitationStatus } from '../models/Invitation.js';
import { defaultDeadline, validateInvitation } from '../validators/invitationValidator.js';
import { escapeRegex } from '../validators/catalogValidator.js';

const ok = (res, data, message) => res.json({ success: true, ...(message && { message }), data });
const fail = (res, status, message, errors) => res.status(status).json({ success: false, message, ...(errors && { errors }) });
const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const guestNames = name => name.split(';').map(value => value.trim()).filter(Boolean);
const guestView = invitation => invitation.guests?.length ? invitation.guests : guestNames(invitation.name).map(name => ({ name, confirmed: false, confirmedAt: null }));

// Sem 0/O, 1/I/L: o codigo pode ser digitado a partir do convite impresso.
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const newCode = () => Array.from({ length: 10 }, () => CODE_ALPHABET[crypto.randomInt(CODE_ALPHABET.length)]).join('');
const isDuplicate = error => error?.code === 11000;
// Comparacao de tamanho constante: nao revela por tempo de resposta quantos caracteres bateram.
function sameSecret(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || !a || !b) return false;
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

// Confirmar presenca exige a mesma prova usada para abrir o convite: o codigo do link
// impresso (QR) ou o token do link antigo. So o id (um ObjectId, parcialmente previsivel)
// deixaria qualquer pessoa marcar e desmarcar convidados de outros convites.
export const mayConfirm = (item, req) =>
  sameSecret(typeof req.body?.code === 'string' ? req.body.code.trim().toUpperCase() : '', item.code) ||
  sameSecret(typeof req.query?.token === 'string' ? req.query.token : '', item.publicToken);

// Convite sem data propria mostra a data padrao: o convidado sempre ve ate quando confirmar.
const publicView = item => ({ _id: item._id, name: item.name, status: item.status, confirmedAt: item.confirmedAt, confirmationDeadline: item.confirmationDeadline || defaultDeadline(), guests: item.guests.map(guest => ({ _id: guest._id, name: guest.name, response: guestResponse(guest), confirmed: guestResponse(guest) === 'yes' })) });

async function assignCode(id) {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const item = await Invitation.findOneAndUpdate({ _id: id, code: { $in: [null, ''] } }, { $set: { code: newCode() } }, { new: true });
      return item || Invitation.findById(id);
    } catch (error) { if (!isDuplicate(error)) throw error; }
  }
  throw new Error('Nao foi possivel gerar o codigo do convite.');
}

function idOrFail(id, res) {
  if (!mongoose.isValidObjectId(id)) { fail(res, 400, 'Identificador invalido.'); return false; }
  return true;
}

async function ensureGuests(invitation) {
  if (invitation.guests?.length) return invitation;
  invitation.guests = guestNames(invitation.name).map(name => ({ name }));
  await invitation.save();
  return invitation;
}

// Troca a lista de pessoas mantendo a confirmacao de quem continua no convite (pelo _id).
function syncGuests(invitation, guests) {
  const oldGuests = new Map((invitation.guests || []).map(guest => [String(guest._id), guest]));
  const used = new Set();
  invitation.guests = guests.map(({ _id, name, category }) => {
    const old = _id && !used.has(_id) ? oldGuests.get(_id) : null;
    if (!old) return { name, category };
    used.add(_id);
    return { _id: old._id, name, category, response: old.response, respondedAt: old.respondedAt, confirmed: old.confirmed, confirmedAt: old.confirmedAt };
  });
  invitation.name = guests.map(guest => guest.name).join('; ');
}

// Status e data de confirmacao do convite seguem as respostas das pessoas.
function applyStatus(item) {
  item.status = invitationStatus(item);
  const dates = item.guests.filter(guest => guestResponse(guest) === 'yes').map(guest => guest.confirmedAt).filter(Boolean).sort((a, b) => a - b);
  item.confirmedAt = dates[0] || null;
}

// Primeira abertura do link: o convite deixa de ser "Nao visualizado".
async function markViewed(item) {
  if (item.viewedAt) return;
  item.viewedAt = new Date();
  applyStatus(item);
  await item.save();
}

// Colunas que o painel pode ordenar. Texto ordena em ordem alfabetica do portugues, sem diferenciar
// maiusculas e acentos, e numeros dentro do texto pelo valor (mesa "2" antes de "10").
const SORT_FIELDS = ['side', 'relationship', 'name', 'type', 'table', 'whatsapp', 'description', 'createdAt', 'updatedAt', 'status', 'confirmedAt'];
// Campos guardados como codigo ordenam pelo texto exibido no painel.
const SORT_LABELS = {
  side: { groom: 'Noivo', bride: 'Noiva' },
  relationship: { relative: 'Parente', friends: 'Amigos', family: 'Família', parents: 'Pais', organization: 'Organização' },
  type: { in_person: 'Presencial', virtual: 'Virtual' },
  status: { not_viewed: 'Não visualizado', unconfirmed: 'Não confirmado', partial: 'Confirmado parcial', confirmed: 'Confirmado', declined: 'Não vai' }
};
const sortValue = field => SORT_LABELS[field]
  ? { $switch: { branches: Object.entries(SORT_LABELS[field]).map(([value, label]) => ({ case: { $eq: ['$' + field, value] }, then: label })), default: '' } }
  : '$' + field;

export async function list(req, res, next) {
  try {
    const { name, status, startDate, endDate, type } = req.query;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 20));
    const sortBy = SORT_FIELDS.includes(req.query.sortBy) ? req.query.sortBy : 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const query = {};
    if (name) query.name = { $regex: escapeRegex(String(name)), $options: 'i' };
    if (INVITATION_STATUSES.includes(status)) query.status = status;
    if (['in_person', 'virtual'].includes(type)) query.type = type;
    if (startDate || endDate) { query.createdAt = {}; if (startDate) query.createdAt.$gte = new Date(`${startDate}T00:00:00.000Z`); if (endDate) query.createdAt.$lte = new Date(`${endDate}T23:59:59.999Z`); }

    const [data, total, allInvitations] = await Promise.all([
      // _id desempata: a ordem fica estavel entre as paginas.
      Invitation.aggregate([
        { $match: query },
        { $addFields: { sortValue: sortValue(sortBy) } },
        { $sort: { sortValue: sortOrder, _id: sortOrder } },
        { $skip: (page - 1) * limit }, { $limit: limit },
        { $project: { sortValue: 0 } }
      ]).collation({ locale: 'pt', strength: 1, numericOrdering: true }),
      Invitation.countDocuments(query),
      Invitation.find(query).select('name guests type status')
    ]);
    // categories: pessoas por tipo (homens, mulheres, criancas); "unknown" sao as cadastradas antes do campo.
    const categories = Object.fromEntries([...GUEST_CATEGORIES, 'unknown'].map(category => [category, 0]));
    const summary = allInvitations.reduce((result, invitation) => {
      const guests = guestView(invitation);
      result.people += guests.length;
      result[invitation.type === 'virtual' ? 'virtual' : 'inPerson'] += 1;
      result.statuses[invitation.status] = (result.statuses[invitation.status] || 0) + 1;
      guests.forEach(guest => {
        result.categories[guest.category || 'unknown'] += 1;
        const response = guestResponse(guest);
        if (response === 'yes') result.confirmed += 1;
        else if (response === 'no') result.declined += 1;
        else if (response === 'maybe') result.maybe += 1;
      });
      return result;
    }, { people: 0, confirmed: 0, declined: 0, maybe: 0, inPerson: 0, virtual: 0, categories, statuses: {} });
    // Ainda sem decisao: quem nao respondeu ou respondeu "nao sei".
    summary.unconfirmed = summary.people - summary.confirmed - summary.declined;
    ok(res, { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }, summary: { total, ...summary } });
  } catch (error) { next(error); }
}

// Dia (AAAA-MM-DD) no fuso do casamento, para agrupar convites e confirmacoes por data.
const dayOf = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' });
const countBy = (map, key, amount = 1) => { map[key] = (map[key] || 0) + amount; };

// Numeros do dashboard: todos os convites, sem filtro. Pessoas contam pela resposta de cada uma.
export async function stats(req, res, next) {
  try {
    const invitations = await Invitation.find().select('name side relationship table type status guests createdAt').lean();
    const result = {
      invitations: { total: invitations.length, byType: {}, byStatus: Object.fromEntries(INVITATION_STATUSES.map(status => [status, 0])), bySide: {}, byRelationship: {} },
      people: {
        total: 0, byResponse: { yes: 0, no: 0, maybe: 0, none: 0 },
        byCategory: Object.fromEntries([...GUEST_CATEGORIES, 'unknown'].map(category => [category, { total: 0, yes: 0 }])),
        bySide: {}, byRelationship: {}
      },
      tables: [],
      timeline: { invited: {}, confirmed: {} }
    };
    const tables = new Map();
    for (const invitation of invitations) {
      const guests = guestView(invitation);
      const yes = guests.filter(guest => guestResponse(guest) === 'yes').length;
      const side = invitation.side || 'none';
      const relationship = invitation.relationship || 'none';
      countBy(result.invitations.byType, invitation.type || 'in_person');
      countBy(result.invitations.byStatus, invitation.status || 'not_viewed');
      countBy(result.invitations.bySide, side);
      countBy(result.invitations.byRelationship, relationship);
      for (const [map, key] of [[result.people.bySide, side], [result.people.byRelationship, relationship]]) {
        map[key] = map[key] || { total: 0, yes: 0 };
        map[key].total += guests.length;
        map[key].yes += yes;
      }
      const table = (invitation.table || '').trim();
      const row = tables.get(table) || { table, invitations: 0, people: 0, yes: 0 };
      row.invitations += 1; row.people += guests.length; row.yes += yes;
      tables.set(table, row);
      if (invitation.createdAt) countBy(result.timeline.invited, dayOf.format(invitation.createdAt), guests.length);
      result.people.total += guests.length;
      for (const guest of guests) {
        const response = guestResponse(guest);
        result.people.byResponse[response || 'none'] += 1;
        const category = result.people.byCategory[guest.category] ? guest.category : 'unknown';
        result.people.byCategory[category].total += 1;
        if (response === 'yes') {
          result.people.byCategory[category].yes += 1;
          if (guest.confirmedAt) countBy(result.timeline.confirmed, dayOf.format(guest.confirmedAt));
        }
      }
    }
    // Mesas em ordem natural ("2" antes de "10"); convites sem mesa por ultimo, com table vazio.
    result.tables = [...tables.values()].sort((a, b) => !a.table ? 1 : !b.table ? -1 : a.table.localeCompare(b.table, 'pt', { numeric: true, sensitivity: 'base' }));
    ok(res, result);
  } catch (error) { next(error); }
}

export async function getById(req, res, next) {
  try { if (!idOrFail(req.params.id, res)) return; const item = await Invitation.findById(req.params.id); if (!item) return fail(res, 404, 'Convite nao encontrado.'); ok(res, item); } catch (error) { next(error); }
}

export async function create(req, res, next) {
  try {
    const { errors, fields: data } = validateInvitation(req.body);
    if (Object.keys(errors).length) return fail(res, 422, 'Os dados informados sao invalidos.', errors);
    const guests = data.guests.map(({ name, category }) => ({ name, category }));
    const fields = { name: guests.map(guest => guest.name).join('; '), side: data.side, relationship: data.relationship, table: data.table || '', whatsapp: data.whatsapp || '', description: data.description || '', type: data.type || 'in_person', confirmationDeadline: data.confirmationDeadline || defaultDeadline(), guests, publicToken: crypto.randomBytes(32).toString('hex') };
    let item;
    for (let attempt = 0; !item; attempt++) {
      try { item = await Invitation.create({ ...fields, code: newCode() }); } catch (error) { if (!isDuplicate(error) || attempt >= 4) throw error; }
    }
    ok(res, item, 'Convite criado com sucesso.');
  } catch (error) { next(error); }
}

export async function update(req, res, next) {
  try {
    if (!idOrFail(req.params.id, res)) return;
    const { errors, fields } = validateInvitation(req.body, { partial: true });
    if (Object.keys(errors).length) return fail(res, 422, 'Os dados informados sao invalidos.', errors);
    const item = await Invitation.findById(req.params.id);
    if (!item) return fail(res, 404, 'Convite nao encontrado.');
    await ensureGuests(item);
    if (fields.guests) syncGuests(item, fields.guests);
    if (fields.description !== undefined) item.description = fields.description;
    if (fields.confirmationDeadline !== undefined) item.confirmationDeadline = fields.confirmationDeadline || defaultDeadline();
    if (fields.type) item.type = fields.type;
    if (fields.side) item.side = fields.side;
    if (fields.relationship) item.relationship = fields.relationship;
    if (fields.table !== undefined) item.table = fields.table;
    if (fields.whatsapp !== undefined) item.whatsapp = fields.whatsapp;
    applyStatus(item);
    await item.save(); ok(res, item, 'Convite atualizado com sucesso.');
  } catch (error) { next(error); }
}

// Garante o codigo dos convites que vao ser impressos (os criados antes do campo existir).
export async function ensureCodes(req, res, next) {
  try {
    const ids = Array.isArray(req.body.ids) ? [...new Set(req.body.ids.map(String))] : [];
    if (!ids.length || ids.length > 500 || !ids.every(id => mongoose.isValidObjectId(id))) return fail(res, 422, 'Informe os convites.');
    const items = await Invitation.find({ _id: { $in: ids } }).select('code');
    const codes = {};
    for (const item of items) codes[item._id] = item.code || (await assignCode(item._id)).code;
    ok(res, codes);
  } catch (error) { next(error); }
}

export async function remove(req, res, next) {
  try { if (!idOrFail(req.params.id, res)) return; const item = await Invitation.findByIdAndDelete(req.params.id); if (!item) return fail(res, 404, 'Convite nao encontrado.'); ok(res, null, 'Convite excluido com sucesso.'); } catch (error) { next(error); }
}

export async function publicGet(req, res, next) {
  try {
    if (!idOrFail(req.params.id, res)) return;
    const item = await Invitation.findById(req.params.id).select('-__v');
    if (!item || normalize(item.name) !== decodeURIComponent(req.params.name) || req.query.token !== item.publicToken) return fail(res, 404, 'Convite nao encontrado.');
    await ensureGuests(item);
    await markViewed(item);
    ok(res, publicView(item));
  } catch (error) { next(error); }
}

export async function publicGetByCode(req, res, next) {
  try {
    const code = String(req.params.code || '').toUpperCase();
    if (!/^[A-Z0-9]{8,32}$/.test(code)) return fail(res, 404, 'Convite nao encontrado.');
    const item = await Invitation.findOne({ code });
    if (!item) return fail(res, 404, 'Convite nao encontrado.');
    await ensureGuests(item);
    await markViewed(item);
    ok(res, publicView(item));
  } catch (error) { next(error); }
}

export async function confirm(req, res, next) {
  try {
    if (!idOrFail(req.params.id, res)) return;
    // Sem prova nenhuma nem chega a consultar o banco.
    if (!req.body?.code && !req.query?.token) return fail(res, 404, 'Convite nao encontrado.');
    const item = await Invitation.findById(req.params.id);
    // Mesma resposta para convite inexistente e para prova errada: nao confirma se o id existe.
    if (!item || !mayConfirm(item, req)) return fail(res, 404, 'Convite nao encontrado.');
    await ensureGuests(item);
    // responses: { [guestId]: 'yes' | 'no' | 'maybe' | null }. guestIds (formato antigo): marcados = sim, demais sem resposta.
    const legacyIds = Array.isArray(req.body?.guestIds) ? req.body.guestIds.map(String) : [];
    const responses = req.body?.responses && typeof req.body.responses === 'object' && !Array.isArray(req.body.responses)
      ? req.body.responses
      : Object.fromEntries(item.guests.map(guest => [String(guest._id), legacyIds.includes(String(guest._id)) ? 'yes' : null]));
    const now = new Date();
    item.guests.forEach(guest => {
      const id = String(guest._id);
      if (!Object.hasOwn(responses, id)) return;
      const response = GUEST_RESPONSES.includes(responses[id]) ? responses[id] : null;
      if (response === guestResponse(guest)) return;
      if (response === 'yes' && !guest.confirmed) guest.confirmedAt = now;
      if (response !== 'yes') guest.confirmedAt = null;
      guest.response = response;
      guest.respondedAt = response ? now : null;
      guest.confirmed = response === 'yes';
    });
    if (!item.viewedAt) item.viewedAt = now;
    applyStatus(item);
    await item.save();
    ok(res, publicView(item), 'Resposta registrada com sucesso!');
  } catch (error) { next(error); }
}
