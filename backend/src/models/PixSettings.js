import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  singleton: { type: String, default: 'default', unique: true },
  keyType: { type: String, required: true, enum: ['cpf', 'cnpj', 'email', 'phone', 'random'] },
  pixKey: { type: String, required: true, trim: true },
  receiverName: { type: String, required: true, trim: true },
  receiverCity: { type: String, required: true, trim: true },
  description: { type: String, trim: true, default: '' },
  active: { type: Boolean, default: true }
}, { timestamps: true, collection: 'pix_settings' });

export default mongoose.model('PixSettings', schema);
