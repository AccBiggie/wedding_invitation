import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 255 },
  description: { type: String, trim: true, maxlength: 1000, default: '' },
  type: { type: String, enum: ['in_person', 'virtual'], required: true, default: 'in_person' },
  status: { type: String, enum: ['unconfirmed', 'confirmed'], default: 'unconfirmed' },
  confirmedAt: { type: Date, default: null },
  publicToken: { type: String, required: true, unique: true, index: true }
}, { timestamps: true, collection: 'invitations' });

export default mongoose.model('Invitation', schema);
