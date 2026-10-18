import mongoose from 'mongoose';

// Categorias da secao "Lista na loja" (Panelas, Loucas, Tacas...). Entidade propria,
// separada dos produtos; no futuro GiftProduct pode referenciar uma categoria pelo _id.
const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  // URL publica: /lista-na-loja/:slug. Gerado a partir do nome pelo controller.
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 90 },
  description: { type: String, required: true, trim: true, maxlength: 500 },
  // Imagem enviada/URL. Opcional quando ha icone; se houver os dois, a imagem prevalece.
  image: { type: String, trim: true, default: '' },
  // Chave de um SVG tematico do frontend (src/assets/category-icons/<icon>.svg).
  icon: { type: String, trim: true, maxlength: 40, default: '' },
  active: { type: Boolean, default: true },
  order: { type: Number, min: 0, default: 0 }
}, { timestamps: true, collection: 'store_categories' });

schema.index({ active: 1, order: 1, name: 1 });
export default mongoose.model('StoreCategory', schema);
