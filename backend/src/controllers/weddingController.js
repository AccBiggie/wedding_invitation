import mongoose from 'mongoose';
import Message from '../models/Message.js';
import { wedding } from '../config/wedding.js';

const ok = (res, data, message) => res.json({ success: true, ...(message && { message }), data });
const fail = (res, status, message, errors) => res.status(status).json({ success: false, message, ...(errors && { errors }) });
const messageView = item => ({ _id: item._id, name: item.name, message: item.message, createdAt: item.createdAt });

export function getWedding(req, res) { ok(res, wedding); }

export async function listMessages(req, res, next) {
  try { ok(res, (await Message.find({ approved: true }).sort({ createdAt: -1 }).limit(200)).map(messageView)); } catch (error) { next(error); }
}

export async function createMessage(req, res, next) {
  try {
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    const message = typeof req.body.message === 'string' ? req.body.message.trim() : '';
    const errors = {};
    if (!name) errors.name = ['O seu nome e obrigatorio.'];
    else if (name.length > 120) errors.name = ['O nome deve ter no maximo 120 caracteres.'];
    if (!message) errors.message = ['Escreva o seu recado.'];
    else if (message.length > 800) errors.message = ['O recado deve ter no maximo 800 caracteres.'];
    if (Object.keys(errors).length) return fail(res, 422, 'Os dados informados sao invalidos.', errors);
    ok(res, messageView(await Message.create({ name, message })), 'Recado enviado com sucesso!');
  } catch (error) { next(error); }
}

export async function removeMessage(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return fail(res, 400, 'Identificador invalido.');
    if (!await Message.findByIdAndDelete(req.params.id)) return fail(res, 404, 'Recado nao encontrado.');
    ok(res, null, 'Recado excluido com sucesso.');
  } catch (error) { next(error); }
}

export async function listAllMessages(req, res, next) {
  try { ok(res, await Message.find().sort({ createdAt: -1 })); } catch (error) { next(error); }
}
