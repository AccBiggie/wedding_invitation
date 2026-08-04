import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  message: { type: String, required: true, trim: true, maxlength: 800 },
  approved: { type: Boolean, default: true }
}, { timestamps: true, collection: 'messages' });

export default mongoose.model('Message', schema);
