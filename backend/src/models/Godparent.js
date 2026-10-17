import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  partnerName: { type: String, trim: true, maxlength: 120, default: '' },
  role: { type: String, required: true, enum: ['groomsman', 'bridesmaid', 'mother', 'father', 'other'] },
  cardRole: { type: String, trim: true, maxlength: 120, default: '' },
  phone: { type: String, trim: true, default: '' },
  email: { type: String, trim: true, lowercase: true, default: '' },
  description: { type: String, trim: true, maxlength: 1000, default: '' },
  image: { type: String, trim: true, default: '' },
  order: { type: Number, min: 0, default: 0 },
  active: { type: Boolean, default: true }
}, { timestamps: true, collection: 'godparents' });

schema.index({ active: 1, order: 1 });
export default mongoose.model('Godparent', schema);
