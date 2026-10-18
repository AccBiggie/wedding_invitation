import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, trim: true, maxlength: 1000, default: '' },
  price: { type: Number, required: true, min: 0.01 },
  image: { type: String, trim: true, default: '' },
  // Categoria da "Lista na loja". null so em produtos antigos ainda nao migrados
  // (ver scripts/migrate-product-categories.js); a API exige categoria ao salvar.
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'StoreCategory', default: null },
  active: { type: Boolean, default: true },
  order: { type: Number, min: 0, default: 0 }
}, { timestamps: true, collection: 'gift_products' });

schema.index({ active: 1, order: 1 });
schema.index({ categoryId: 1, active: 1, order: 1 });
export default mongoose.model('GiftProduct', schema);
