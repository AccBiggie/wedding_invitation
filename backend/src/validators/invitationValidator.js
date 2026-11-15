import { wedding } from '../config/wedding.js';
import { GUEST_CATEGORIES, INVITATION_RELATIONSHIPS, INVITATION_SIDES } from '../models/Invitation.js';

const MAX_GUESTS = 50;
const MAX_NAMES = 1000;
// Fim do dia em UTC: a data aparece igual para o convidado em qualquer fuso.
export const deadlineDate = value => new Date(`${value}T23:59:59.999Z`);
export const defaultDeadline = () => deadlineDate(wedding.rsvpDeadline);
const brDate = value => value.split('-').reverse().join('/');
const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(deadlineDate(value).getTime()) && deadlineDate(value).toISOString().startsWith(value);
const objectId = value => /^[a-f\d]{24}$/i.test(String(value ?? '')) ? String(value) : undefined;

// Valida o cadastro do convite e devolve os campos ja normalizados.
// partial: na edicao, so valida o que veio no corpo.
export function validateInvitation(body, { partial = false } = {}) {
  const errors = {};
  const fields = {};
  if (!partial || body.guests !== undefined) {
    if (!Array.isArray(body.guests) || !body.guests.length) errors.guests = ['Informe pelo menos um convidado.'];
    else if (body.guests.length > MAX_GUESTS) errors.guests = [`O convite pode ter no máximo ${MAX_GUESTS} convidados.`];
    else {
      const guests = body.guests.map(guest => ({ _id: objectId(guest?._id), name: typeof guest?.name === 'string' ? guest.name.trim() : '', category: guest?.category }));
      if (guests.some(guest => !guest.name || guest.name.length > 120)) errors.guests = ['Informe o nome de cada convidado, com até 120 caracteres.'];
      else if (guests.some(guest => !GUEST_CATEGORIES.includes(guest.category))) errors.guests = ['Selecione o tipo de cada convidado.'];
      else if (guests.map(guest => guest.name).join('; ').length > MAX_NAMES) errors.guests = [`Os nomes juntos devem ter no máximo ${MAX_NAMES} caracteres.`];
      else fields.guests = guests;
    }
  }
  if (!partial || body.side !== undefined) {
    if (!INVITATION_SIDES.includes(body.side)) errors.side = ['Selecione a parte: noivo ou noiva.'];
    else fields.side = body.side;
  }
  if (!partial || body.relationship !== undefined) {
    if (!INVITATION_RELATIONSHIPS.includes(body.relationship)) errors.relationship = ['Selecione o parentesco.'];
    else fields.relationship = body.relationship;
  }
  if (body.table !== undefined) {
    if (typeof body.table !== 'string' || body.table.trim().length > 50) errors.table = ['A mesa deve ter no máximo 50 caracteres.'];
    else fields.table = body.table.trim();
  }
  if (body.whatsapp !== undefined) {
    // Guarda so os digitos: DDD + numero (10 ou 11), com ou sem o 55 do Brasil na frente.
    const digits = typeof body.whatsapp === 'string' ? body.whatsapp.replace(/\D/g, '') : null;
    if (digits === null || (digits && !/^(55)?[1-9]{2}9?\d{8}$/.test(digits))) errors.whatsapp = ['Informe o WhatsApp com DDD, ex.: (44) 99883-3731.'];
    else fields.whatsapp = digits.length > 11 ? digits.slice(2) : digits;
  }
  if (body.description !== undefined) {
    if (typeof body.description !== 'string' || body.description.length > 1000) errors.description = ['A descrição deve ter no máximo 1.000 caracteres.'];
    else fields.description = body.description.trim();
  }
  if (body.type !== undefined) {
    if (!['in_person', 'virtual'].includes(body.type)) errors.type = ['O tipo deve ser presencial ou virtual.'];
    else fields.type = body.type;
  }
  if (body.confirmationDeadline !== undefined) {
    const value = body.confirmationDeadline;
    // Em branco: o convite usa a data padrao (wedding.rsvpDeadline).
    if (value === null || value === '') fields.confirmationDeadline = null;
    else if (!validDate(value)) errors.confirmationDeadline = ['A data limite é inválida.'];
    else if (value > wedding.rsvpDeadline) errors.confirmationDeadline = [`A data limite deve ser até ${brDate(wedding.rsvpDeadline)}.`];
    else fields.confirmationDeadline = deadlineDate(value);
  }
  return { errors, fields };
}
