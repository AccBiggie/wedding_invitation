import mongoose from 'mongoose';
import Godparent from '../models/Godparent.js';
import GiftProduct from '../models/GiftProduct.js';
import StoreCategory from '../models/StoreCategory.js';
import { escapeRegex, slugify, validObjectId, validateGodparent, validateGift, validateStoreCategory } from '../validators/catalogValidator.js';
import { validateImageReferences, bindImages, releaseImages, removeUnusedImages } from '../services/imageStorageService.js';

const ok = (res, data, message) => res.json({ success: true, ...(message && { message }), data });
const fail = (res, status, message, errors) => res.status(status).json({ success: false, message, ...(errors && { errors }) });
const pageParams = (query, fallback, max) => {
  const rawPage = Number(query.page); const rawLimit = Number(query.limit);
  return { page: Number.isSafeInteger(rawPage) && rawPage > 0 ? rawPage : 1, limit: Number.isSafeInteger(rawLimit) && rawLimit > 0 ? Math.min(max, rawLimit) : fallback };
};

// CRUD generico dos cadastros do catalogo. entityType liga o cadastro a categoria
// de imagem do R2 (StoredImage.entityType). hooks opcionais:
//   filter(query, mongoQuery)       filtros extras da listagem
//   prepare(data, current)          regras assincronas antes de salvar; devolve erros por campo
//   present(items, { single })      objetos enviados ao painel (ex.: anexa a categoria)
//   beforeRemove(item)              devolve { status, message } para bloquear a exclusao
function resource(Model, validate, fields, entityType, hooks = {}) {
  const references = item => Model === Godparent ? [item.image, ...(item.images || [])] : [item.image];
  const present = async (items, options = {}) => hooks.present ? hooks.present(items, options) : items;
  const presentOne = async (item, options = {}) => (await present([item], { ...options, single: true }))[0];
  const prepare = async (data, current) => {
    const errors = hooks.prepare ? await hooks.prepare(data, current) : null;
    return errors && Object.keys(errors).length ? errors : null;
  };
  // Indice unico (slug da categoria) violado por cadastro simultaneo.
  const duplicate = (res, error) => error?.code === 11000 ? fail(res, 409, 'Já existe um cadastro com esses dados.') : null;
  return {
    async list(req, res, next) {
      try {
        const { page, limit } = pageParams(req.query, 20, 100);
        const sortBy = fields.includes(req.query.sortBy) ? req.query.sortBy : 'order';
        const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;
        const query = {};
        if (typeof req.query.name === 'string' && req.query.name.trim()) query.name = { $regex: escapeRegex(req.query.name.trim().slice(0, 120)), $options: 'i' };
        if (req.query.active === 'true' || req.query.active === 'false') query.active = req.query.active === 'true';
        hooks.filter?.(req.query, query);
        const [data, total] = await Promise.all([
          Model.find(query).sort({ [sortBy]: sortOrder, _id: 1 }).skip((page - 1) * limit).limit(limit),
          Model.countDocuments(query)
        ]);
        ok(res, { data: await present(data), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
      } catch (error) { next(error); }
    },
    async getById(req, res, next) {
      try {
        if (!mongoose.isValidObjectId(req.params.id)) return fail(res, 400, 'Identificador invalido.');
        const item = await Model.findById(req.params.id);
        if (!item) return fail(res, 404, 'Registro nao encontrado.');
        ok(res, await presentOne(item));
      } catch (error) { next(error); }
    },
    async create(req, res, next) {
      try {
        const { errors, data } = validate(req.body);
        if (Object.keys(errors).length) return fail(res, 422, 'Os dados informados sao invalidos.', errors);
        const ruleErrors = await prepare(data, null);
        if (ruleErrors) return fail(res, 422, 'Os dados informados sao invalidos.', ruleErrors);
        if (!await validateImageReferences(references(data), entityType)) return fail(res, 422, 'Imagem inválida ou vinculada a outro cadastro.');
        const item = await Model.create(data);
        try { await bindImages(references(item), entityType, item._id); }
        catch (error) { await Model.deleteOne({ _id: item._id }); await releaseImages(references(item), entityType, item._id); throw error; }
        ok(res, await presentOne(item), 'Registro criado com sucesso.');
      } catch (error) { if (!duplicate(res, error)) next(error); }
    },
    async update(req, res, next) {
      try {
        if (!mongoose.isValidObjectId(req.params.id)) return fail(res, 400, 'Identificador invalido.');
        const item = await Model.findById(req.params.id);
        if (!item) return fail(res, 404, 'Registro nao encontrado.');
        const { errors, data } = validate({ ...item.toObject(), ...req.body });
        if (Object.keys(errors).length) return fail(res, 422, 'Os dados informados sao invalidos.', errors);
        const ruleErrors = await prepare(data, item);
        if (ruleErrors) return fail(res, 422, 'Os dados informados sao invalidos.', ruleErrors);
        if (!await validateImageReferences(references(data), entityType, item._id)) return fail(res, 422, 'Imagem inválida ou vinculada a outro cadastro.');
        const oldImages = references(item);
        const previous = item.toObject();
        Object.assign(item, data);
        await item.save();
        try { await bindImages(references(item), entityType, item._id); }
        catch (error) { Object.assign(item, previous); await item.save(); await releaseImages(references(data).filter(value => !oldImages.includes(value)), entityType, item._id); throw error; }
        await removeUnusedImages(oldImages.filter(value => !references(item).includes(value)));
        ok(res, await presentOne(item), 'Registro atualizado com sucesso.');
      } catch (error) { if (!duplicate(res, error)) next(error); }
    },
    async remove(req, res, next) {
      try {
        if (!mongoose.isValidObjectId(req.params.id)) return fail(res, 400, 'Identificador invalido.');
        const item = await Model.findById(req.params.id);
        if (!item) return fail(res, 404, 'Registro nao encontrado.');
        const blocked = await hooks.beforeRemove?.(item);
        if (blocked) return res.status(blocked.status).json({ success: false, message: blocked.message, data: blocked.data });
        await Model.deleteOne({ _id: item._id });
        await removeUnusedImages(references(item));
        ok(res, null, 'Registro excluido com sucesso.');
      } catch (error) { next(error); }
    }
  };
}

// Quantidade de produtos por categoria, para a listagem e a exclusao de categorias.
async function productCounts(ids) {
  const rows = await GiftProduct.aggregate([{ $match: { categoryId: { $in: ids } } }, { $group: { _id: '$categoryId', total: { $sum: 1 } } }]);
  return new Map(rows.map(row => [String(row._id), row.total]));
}

// Slug unico: "panelas", "panelas-2", "panelas-3"... ignorando a propria categoria.
async function uniqueSlug(name, currentId) {
  const base = slugify(name) || 'categoria';
  for (let suffix = 1; ; suffix += 1) {
    const slug = suffix === 1 ? base : `${base.slice(0, 80)}-${suffix}`;
    if (!await StoreCategory.exists({ slug, ...(currentId && { _id: { $ne: currentId } }) })) return slug;
  }
}

export const godparents = resource(Godparent, validateGodparent, ['order', 'name', 'role', 'active', 'createdAt'], 'godparent', {
  filter(params, query) { if (['groomsman', 'bridesmaid', 'mother', 'father', 'other'].includes(params.role)) query.role = params.role; }
});

export const gifts = resource(GiftProduct, validateGift, ['order', 'name', 'price', 'active', 'createdAt'], 'gift', {
  filter(params, query) {
    // categoryId=none lista os produtos antigos ainda sem categoria.
    if (params.categoryId === 'none') query.categoryId = null;
    else if (validObjectId(params.categoryId)) query.categoryId = params.categoryId;
    const min = Number(params.minPrice); const max = Number(params.maxPrice);
    if (params.minPrice !== undefined && Number.isFinite(min) && min >= 0) query.price = { ...query.price, $gte: min };
    if (params.maxPrice !== undefined && Number.isFinite(max) && max >= 0) query.price = { ...query.price, $lte: max };
  },
  async prepare(data, current) {
    const category = await StoreCategory.findById(data.categoryId).select('active');
    if (!category) return { categoryId: ['Categoria não encontrada.'] };
    // Produto ja ligado a uma categoria desativada continua editavel; novos vinculos nao.
    if (!category.active && String(current?.categoryId) !== String(data.categoryId)) return { categoryId: ['Esta categoria está inativa. Escolha uma categoria ativa.'] };
    return null;
  },
  async present(items, { single }) {
    const ids = [...new Set(items.map(item => item.categoryId).filter(Boolean).map(String))];
    const categories = new Map((await StoreCategory.find({ _id: { $in: ids } }).select('name slug active')).map(category => [String(category._id), category]));
    return items.map(item => {
      const { category: legacyCategory, ...product } = item.toObject();
      const category = categories.get(String(item.categoryId));
      return { ...product, category: category ? { _id: category._id, name: category.name, slug: category.slug, active: category.active } : null, ...(single && !item.categoryId && typeof legacyCategory === 'string' && legacyCategory && { legacyCategory }) };
    });
  }
});

export const storeCategories = resource(StoreCategory, validateStoreCategory, ['order', 'name', 'active', 'createdAt'], 'storeCategory', {
  async prepare(data, current) {
    data.slug = current && current.name === data.name && current.slug ? current.slug : await uniqueSlug(data.name, current?._id);
    return null;
  },
  async present(items) {
    const counts = await productCounts(items.map(item => item._id));
    return items.map(item => ({ ...item.toObject(), productCount: counts.get(String(item._id)) || 0 }));
  },
  async beforeRemove(item) {
    const productCount = await GiftProduct.countDocuments({ categoryId: item._id });
    if (productCount) return { status: 409, message: 'Não é possível excluir esta categoria enquanto houver produtos vinculados a ela.', data: { productCount } };
  }
});

export async function publicGodparents(req, res, next) {
  try { ok(res, await Godparent.find({ active: true }).sort({ order: 1, name: 1 }).limit(200).select('name partnerName role cardRole description image images')); } catch (error) { next(error); }
}
// Carrossel "Lista de presentes": produtos ativos, menos os de categoria desativada.
// Produtos antigos sem categoria continuam aparecendo ate serem migrados.
export async function publicGifts(req, res, next) {
  try {
    const active = await StoreCategory.find({ active: true }).distinct('_id');
    ok(res, await GiftProduct.find({ active: true, $or: [{ categoryId: null }, { categoryId: { $in: active } }] }).sort({ order: 1, name: 1 }).limit(200).select('name description price image'));
  } catch (error) { next(error); }
}
export async function publicStoreCategories(req, res, next) {
  try { ok(res, await StoreCategory.find({ active: true }).sort({ order: 1, name: 1 }).limit(100).select('name slug description image')); } catch (error) { next(error); }
}
// Pagina /lista-na-loja/:slug: categoria ativa + seus produtos ativos, paginados.
export async function publicStoreCategory(req, res, next) {
  try {
    const slug = String(req.params.slug).toLowerCase();
    const category = /^[a-z0-9-]{1,90}$/.test(slug) && await StoreCategory.findOne({ slug, active: true }).select('name slug description image');
    if (!category) return fail(res, 404, 'Categoria não encontrada.');
    const { page, limit } = pageParams(req.query, 12, 48);
    const query = { categoryId: category._id, active: true };
    const [products, total] = await Promise.all([
      GiftProduct.find(query).sort({ order: 1, name: 1, _id: 1 }).skip((page - 1) * limit).limit(limit).select('name description price image'),
      GiftProduct.countDocuments(query)
    ]);
    ok(res, { category, products, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
}
