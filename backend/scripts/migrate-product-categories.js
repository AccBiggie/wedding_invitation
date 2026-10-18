// Migra a categoria em texto livre dos produtos (campo antigo `category`) para o
// vinculo com StoreCategory (`categoryId`).
//
//   node scripts/migrate-product-categories.js            simulacao: so mostra o relatorio
//   node scripts/migrate-product-categories.js --apply    grava as alteracoes
//   node scripts/migrate-product-categories.js --apply --active
//                                                         categorias criadas ja nascem ativas
//
// Faca backup antes de usar --apply (ex.: mongodump). O script nao apaga nada:
// - textos que geram o mesmo slug ("Chuteira" e "chuteira") viram uma categoria so;
// - reaproveita a StoreCategory de mesmo slug quando ela ja existe;
// - cria as que faltam INATIVAS por padrao (imagem e descricao provisorias, para revisar
//   no painel antes de aparecerem no site). Produtos de categoria inativa somem das
//   paginas publicas ate a categoria ser ativada; use --active para evitar isso;
// - produtos sem texto de categoria vao para "Outros";
// - o campo antigo `category` fica preservado nos documentos.
import mongoose from 'mongoose';
import { env } from '../src/config/env.js';
import { slugify } from '../src/validators/catalogValidator.js';
import StoreCategory from '../src/models/StoreCategory.js';

const apply = process.argv.includes('--apply');
const activeCreated = process.argv.includes('--active');
const PLACEHOLDER_IMAGE = '/categoria-padrao.png';
const DESCRIPTION = 'Categoria criada pela migração a partir dos produtos existentes. Revise a descrição e a imagem.';

await mongoose.connect(env.mongoUri);
try {
  // Colecao crua: o campo antigo `category` nao existe mais no schema de GiftProduct.
  const products = mongoose.connection.collection('gift_products');
  const pending = await products.find({ $or: [{ categoryId: null }, { categoryId: { $exists: false } }] }, { projection: { name: 1, category: 1 } }).toArray();
  const groups = new Map();
  for (const product of pending) {
    const text = typeof product.category === 'string' && product.category.trim() ? product.category.trim() : 'Outros';
    const slug = slugify(text) || 'outros';
    if (!groups.has(slug)) groups.set(slug, { name: text, products: [] });
    const group = groups.get(slug);
    // Entre "chuteira" e "Chuteira", fica a grafia com inicial maiuscula.
    if (group.name[0] !== group.name[0].toUpperCase() && text[0] === text[0].toUpperCase()) group.name = text;
    group.products.push(product);
  }
  console.log(`${apply ? 'APLICANDO' : 'SIMULAÇÃO (use --apply para gravar)'} — ${pending.length} produto(s) sem categoria vinculada.\n`);
  let order = ((await StoreCategory.findOne().sort({ order: -1 }).select('order'))?.order ?? -1) + 1;
  const report = [];
  for (const [slug, group] of groups) {
    let category = await StoreCategory.findOne({ slug });
    const action = category ? 'existente' : `criar (${activeCreated ? 'ativa' : 'inativa'})`;
    if (!category && apply) category = await StoreCategory.create({ name: group.name.slice(0, 80), slug, description: DESCRIPTION, image: PLACEHOLDER_IMAGE, active: activeCreated, order: order++ });
    if (apply) await products.updateMany({ _id: { $in: group.products.map(product => product._id) } }, { $set: { categoryId: category._id, updatedAt: new Date() } });
    report.push({ categoria: category?.name || group.name, slug, acao: action, produtos: group.products.map(product => product.name).join(', ') });
  }
  if (report.length) console.table(report); else console.log('Nada a migrar.');
  console.log(apply ? '\nMigração concluída. O campo antigo `category` foi preservado.' : '\nNenhuma alteração gravada.');
} finally {
  await mongoose.disconnect();
}
