import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 255 },
  email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true, maxlength: 255 },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['admin'], default: 'admin' }
}, { timestamps: true, collection: 'users' });

export default mongoose.model('User', schema);
