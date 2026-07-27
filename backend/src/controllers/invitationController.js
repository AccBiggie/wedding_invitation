import crypto from 'node:crypto';
import mongoose from 'mongoose';
import Invitation from '../models/Invitation.js';

const ok = (res, data, message) => res.json({ success: true, ...(message && { message }), data });
const fail = (res, status, message, errors) => res.status(status).json({ success: false, message, ...(errors && { errors }) });
const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const guestNames = name => name.split(';').map(value => value.trim()).filter(Boolean);
const guestView = invitation => invitation.guests?.length ? invitation.guests : guestNames(invitation.name).map(name => ({ name, confirmed: false, confirmedAt: null }));

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

function syncGuests(invitation, name) {
  const oldGuests = new Map((invitation.guests || []).map(guest => [guest.name.trim().toLowerCase(), guest]));
  invitation.guests = guestNames(name).map(guestName => {
    const old = oldGuests.get(guestName.toLowerCase());
    return old ? { _id: old._id, name: guestName, confirmed: old.confirmed, confirmedAt: old.confirmedAt } : { name: guestName };
  });
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
      Invitation.find(query).select('name guests')
    ]);
    const summary = allInvitations.reduce((result, invitation) => {
      const guests = guestView(invitation);
      result.people += guests.length;
      result.confirmed += guests.filter(guest => guest.confirmed).length;
      return result;
    }, { people: 0, confirmed: 0 });
    summary.unconfirmed = summary.people - summary.confirmed;
    ok(res, { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }, summary: { total, ...summary } });
  } catch (error) { next(error); }
}

export async function getById(req, res, next) {
  try { if (!idOrFail(req.params.id, res)) return; const item = await Invitation.findById(req.params.id); if (!item) return fail(res, 404, 'Convite nao encontrado.'); ok(res, item); } catch (error) { next(error); }
}

export async function create(req, res, next) {
  try {
    const errors = {};
    if (typeof req.body.name !== 'string' || !req.body.name.trim()) errors.name = ['O nome dos convidados e obrigatorio.'];
    if (req.body.description?.length > 1000) errors.description = ['A descricao deve ter no maximo 1.000 caracteres.'];
    if (req.body.type !== undefined && !['in_person', 'virtual'].includes(req.body.type)) errors.type = ['O tipo deve ser in_person ou virtual.'];
    if (Object.keys(errors).length) return fail(res, 422, 'Os dados informados sao invalidos.', errors);
    const name = req.body.name.trim();
    const confirmationDeadline = req.body.confirmationDeadline ? new Date(`${req.body.confirmationDeadline}T23:59:59.999Z`) : null;
    if (confirmationDeadline && Number.isNaN(confirmationDeadline.getTime())) errors.confirmationDeadline = ['A data limite e invalida.'];
    if (Object.keys(errors).length) return fail(res, 422, 'Os dados informados sao invalidos.', errors);
    const item = await Invitation.create({ name, description: (req.body.description || '').trim(), type: req.body.type || 'in_person', confirmationDeadline, guests: guestNames(name).map(guestName => ({ name: guestName })), publicToken: crypto.randomBytes(32).toString('hex') });
    ok(res, item, 'Convite criado com sucesso.');
  } catch (error) { next(error); }
}

export async function update(req, res, next) {
  try {
    if (!idOrFail(req.params.id, res)) return;
    const item = await Invitation.findById(req.params.id);
    if (!item) return fail(res, 404, 'Convite nao encontrado.');
    await ensureGuests(item);
    if (req.body.name !== undefined) { item.name = req.body.name.trim(); syncGuests(item, item.name); }
    if (req.body.description !== undefined) item.description = req.body.description.trim();
    if (req.body.confirmationDeadline !== undefined) {
      const deadline = req.body.confirmationDeadline ? new Date(`${req.body.confirmationDeadline}T23:59:59.999Z`) : null;
      if (deadline && Number.isNaN(deadline.getTime())) return fail(res, 422, 'Os dados informados sao invalidos.', { confirmationDeadline: ['A data limite e invalida.'] });
      item.confirmationDeadline = deadline;
    }
    if (req.body.type !== undefined) { if (!['in_person', 'virtual'].includes(req.body.type)) return fail(res, 422, 'Os dados informados sao invalidos.', { type: ['O tipo deve ser in_person ou virtual.'] }); item.type = req.body.type; }
    const confirmedGuests = item.guests.filter(guest => guest.confirmed);
    item.status = confirmedGuests.length ? 'confirmed' : 'unconfirmed';
    item.confirmedAt = confirmedGuests.length ? confirmedGuests[0].confirmedAt : null;
    await item.save(); ok(res, item, 'Convite atualizado com sucesso.');
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
    ok(res, { _id: item._id, name: item.name, status: item.status, confirmedAt: item.confirmedAt, confirmationDeadline: item.confirmationDeadline, guests: item.guests.map(guest => ({ _id: guest._id, name: guest.name, confirmed: guest.confirmed })) });
  } catch (error) { next(error); }
}

export async function confirm(req, res, next) {
  try {
    if (!idOrFail(req.params.id, res)) return;
    const item = await Invitation.findById(req.params.id);
    if (!item) return fail(res, 404, 'Convite nao encontrado.');
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
    ok(res, { _id: item._id, name: item.name, status: item.status, confirmedAt: item.confirmedAt, confirmationDeadline: item.confirmationDeadline, guests: item.guests.map(guest => ({ _id: guest._id, name: guest.name, confirmed: guest.confirmed })) }, selected.size ? 'Confirmacao atualizada com sucesso!' : 'Nenhuma pessoa foi selecionada.');
  } catch (error) { next(error); }
}
