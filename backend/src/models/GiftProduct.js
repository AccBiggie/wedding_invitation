import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, trim: true, maxlength: 1000, default: '' },
  price: { type: Number, required: true, min: 0.01 },
  image: { type: String, trim: true, default: '' },
  category: { type: String, trim: true, maxlength: 80, default: '' },
  active: { type: Boolean, default: true },
  order: { type: Number, min: 0, default: 0 }
}, { timestamps: true, collection: 'gift_products' });

schema.index({ active: 1, order: 1 });
export default mongoose.model('GiftProduct', schema);
