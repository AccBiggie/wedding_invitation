import crypto from 'node:crypto';
import mongoose from 'mongoose';
import Invitation, { GUEST_CATEGORIES } from '../models/Invitation.js';
import { defaultDeadline, validateInvitation } from '../validators/invitationValidator.js';

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
const publicView = item => ({ _id: item._id, name: item.name, status: item.status, confirmedAt: item.confirmedAt, confirmationDeadline: item.confirmationDeadline || defaultDeadline(), guests: item.guests.map(guest => ({ _id: guest._id, name: guest.name, confirmed: guest.confirmed })) });

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
    return { _id: old._id, name, category, confirmed: old.confirmed, confirmedAt: old.confirmedAt };
  });
  invitation.name = guests.map(guest => guest.name).join('; ');
}

export async function list(req, res, next) {
  try {
    const { name, status, startDate, endDate, type } = req.query;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 20));
    const allowedSort = ['createdAt', 'updatedAt', 'name', 'status'];
    const sortBy = allowedSort.includes(req.query.sortBy) ? req.query.sortBy : 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const query = {};
    if (name) query.name = { $regex: name, $options: 'i' };
    if (['confirmed', 'unconfirmed'].includes(status)) query.status = status;
    if (['in_person', 'virtual'].includes(type)) query.type = type;
    if (startDate || endDate) { query.createdAt = {}; if (startDate) query.createdAt.$gte = new Date(`${startDate}T00:00:00.000Z`); if (endDate) query.createdAt.$lte = new Date(`${endDate}T23:59:59.999Z`); }

    const [data, total, allInvitations] = await Promise.all([
      Invitation.find(query).sort({ [sortBy]: sortOrder }).skip((page - 1) * limit).limit(limit),
      Invitation.countDocuments(query),
      Invitation.find(query).select('name guests type')
    ]);
    // categories: pessoas por tipo (homens, mulheres, criancas); "unknown" sao as cadastradas antes do campo.
    const categories = Object.fromEntries([...GUEST_CATEGORIES, 'unknown'].map(category => [category, 0]));
    const summary = allInvitations.reduce((result, invitation) => {
      const guests = guestView(invitation);
      result.people += guests.length;
      result.confirmed += guests.filter(guest => guest.confirmed).length;
      result[invitation.type === 'virtual' ? 'virtual' : 'inPerson'] += 1;
      guests.forEach(guest => { result.categories[guest.category || 'unknown'] += 1; });
      return result;
    }, { people: 0, confirmed: 0, inPerson: 0, virtual: 0, categories });
    summary.unconfirmed = summary.people - summary.confirmed;
    ok(res, { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }, summary: { total, ...summary } });
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
    const fields = { name: guests.map(guest => guest.name).join('; '), side: data.side, relationship: data.relationship, table: data.table || '', description: data.description || '', type: data.type || 'in_person', confirmationDeadline: data.confirmationDeadline || defaultDeadline(), guests, publicToken: crypto.randomBytes(32).toString('hex') };
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
    const confirmedGuests = item.guests.filter(guest => guest.confirmed);
    item.status = confirmedGuests.length ? 'confirmed' : 'unconfirmed';
    item.confirmedAt = confirmedGuests.length ? confirmedGuests[0].confirmedAt : null;
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
    const selectedIds = Array.isArray(req.body.guestIds) ? req.body.guestIds : item.guests.map(guest => String(guest._id));
    const selected = new Set(selectedIds.map(String));
    const now = new Date();
    item.guests.forEach(guest => {
      if (selected.has(String(guest._id))) {
        if (!guest.confirmed) { guest.confirmed = true; guest.confirmedAt = now; }
      } else {
        guest.confirmed = false;
        guest.confirmedAt = null;
      }
    });
    const confirmedGuests = item.guests.filter(guest => guest.confirmed);
    item.status = confirmedGuests.length ? 'confirmed' : 'unconfirmed';
    item.confirmedAt = confirmedGuests.length ? confirmedGuests[0].confirmedAt : null;
    await item.save();
    ok(res, publicView(item), selected.size ? 'Confirmacao atualizada com sucesso!' : 'Nenhuma pessoa foi selecionada.');
  } catch (error) { next(error); }
}
