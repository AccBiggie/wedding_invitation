import mongoose from 'mongoose';

// Tipo de cada pessoa do convite, para contar homens, mulheres e criancas por idade.
// Convidados cadastrados antes do campo existir ficam com null ate serem editados.
export const GUEST_CATEGORIES = ['man', 'woman', 'girl_0_5', 'boy_0_5', 'girl_6_10', 'boy_6_10', 'over_10'];
// Lado do casal que convida e parentesco do convite (convites antigos ficam com null).
export const INVITATION_SIDES = ['groom', 'bride'];
export const INVITATION_RELATIONSHIPS = ['relative', 'friends', 'family', 'parents', 'organization'];

const guestSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 255 },
  category: { type: String, enum: [...GUEST_CATEGORIES, null], default: null },
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
  status: { type: String, enum: ['unconfirmed', 'confirmed'], default: 'unconfirmed' },
  confirmedAt: { type: Date, default: null },
  confirmationDeadline: { type: Date, default: null },
  guests: { type: [guestSchema], default: [] },
  publicToken: { type: String, required: true, unique: true, index: true },
  // Codigo curto do link impresso (/convite/<code>); gerado uma vez e nunca alterado.
  code: { type: String, unique: true, sparse: true }
}, { timestamps: true, collection: 'invitations' });

export default mongoose.model('Invitation', schema);
