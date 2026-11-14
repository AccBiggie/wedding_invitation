import mongoose from 'mongoose';

// Tipo de cada pessoa do convite, para contar homens, mulheres e criancas por idade.
// Convidados cadastrados antes do campo existir ficam com null ate serem editados.
export const GUEST_CATEGORIES = ['man', 'woman', 'girl_0_5', 'boy_0_5', 'girl_6_10', 'boy_6_10', 'over_10'];
// Lado do casal que convida e parentesco do convite (convites antigos ficam com null).
export const INVITATION_SIDES = ['groom', 'bride'];
export const INVITATION_RELATIONSHIPS = ['relative', 'friends', 'family', 'parents', 'organization'];
// Resposta de cada pessoa no link do convite: vai, nao vai, nao sabe (null = ainda nao respondeu).
export const GUEST_RESPONSES = ['yes', 'no', 'maybe'];
// Status do convite, calculado pelas respostas (invitationStatus).
export const INVITATION_STATUSES = ['not_viewed', 'unconfirmed', 'partial', 'confirmed', 'declined'];

// Convidados confirmados antes do campo response existir contam como "sim".
export const guestResponse = guest => guest.response || (guest.confirmed ? 'yes' : null);

// Nao visualizado: o link nunca foi aberto. Nao confirmado: abriu e ninguem disse sim.
// Confirmado parcial: alguem disse sim, mas nao todos. Confirmado: todos sim. Nao vai: todos nao.
export function invitationStatus(invitation) {
  const responses = (invitation.guests || []).map(guestResponse);
  if (responses.length && responses.every(response => response === 'yes')) return 'confirmed';
  if (responses.includes('yes')) return 'partial';
  if (responses.length && responses.every(response => response === 'no')) return 'declined';
  return invitation.viewedAt || responses.some(Boolean) ? 'unconfirmed' : 'not_viewed';
}

const guestSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 255 },
  category: { type: String, enum: [...GUEST_CATEGORIES, null], default: null },
  response: { type: String, enum: [...GUEST_RESPONSES, null], default: null },
  respondedAt: { type: Date, default: null },
  // confirmed/confirmedAt acompanham response === 'yes' (contagens e data de confirmacao).
  confirmed: { type: Boolean, default: false },
  confirmedAt: { type: Date, default: null }
}, { _id: true });

const schema = new mongoose.Schema({
  // Nomes das pessoas juntos por "; " (usado na listagem, na impressao e no link antigo).
  name: { type: String, required: true, trim: true, maxlength: 1000 },
  description: { type: String, trim: true, maxlength: 1000, default: '' },
  type: { type: String, enum: ['in_person', 'virtual'], required: true, default: 'in_person' },
  side: { type: String, enum: [...INVITATION_SIDES, null], default: null },
  relationship: { type: String, enum: [...INVITATION_RELATIONSHIPS, null], default: null },
  // Mesa da festa: texto livre ("12", "Mesa dos noivos", "A3").
  table: { type: String, trim: true, maxlength: 50, default: '' },
  // WhatsApp de contato do convite, so os digitos com DDD (ex.: 44998833731).
  whatsapp: { type: String, trim: true, maxlength: 13, default: '' },
  status: { type: String, enum: INVITATION_STATUSES, default: 'not_viewed' },
  // Primeira vez que o link (ou o QR code) foi aberto.
  viewedAt: { type: Date, default: null },
  confirmedAt: { type: Date, default: null },
  confirmationDeadline: { type: Date, default: null },
  guests: { type: [guestSchema], default: [] },
  publicToken: { type: String, required: true, unique: true, index: true },
  // Codigo curto do link impresso (/convite/<code>); gerado uma vez e nunca alterado.
  code: { type: String, unique: true, sparse: true }
}, { timestamps: true, collection: 'invitations' });

const Invitation = mongoose.model('Invitation', schema);
export default Invitation;

// Recalcula o status salvo de todos os convites (ex.: os gravados com o status antigo). Roda na subida da API.
export async function syncInvitationStatuses() {
  const updates = [];
  for await (const item of Invitation.find().select('status viewedAt guests').lean()) {
    const status = invitationStatus(item);
    if (status !== item.status) updates.push({ updateOne: { filter: { _id: item._id }, update: { $set: { status } } } });
  }
  if (updates.length) await Invitation.bulkWrite(updates);
  return updates.length;
}
