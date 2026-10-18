import mongoose from 'mongoose';
import Godparent from '../models/Godparent.js';
import GiftProduct from '../models/GiftProduct.js';
import { escapeRegex, validateGodparent, validateGift } from '../validators/catalogValidator.js';
import { validateImageReferences, bindImages, releaseImages, removeUnusedImages } from '../services/imageStorageService.js';

const ok = (res, data, message) => res.json({ success: true, ...(message && { message }), data });
const fail = (res, status, message, errors) => res.status(status).json({ success: false, message, ...(errors && { errors }) });

function resource(Model, validate, fields) {
  const entityType = Model === Godparent ? 'godparent' : 'gift';
  const references = item => Model === Godparent ? [item.image, ...(item.images || [])] : [item.image];
  return {
    async list(req, res, next) {
      try {
        const rawPage = Number(req.query.page); const rawLimit = Number(req.query.limit);
        const page = Number.isSafeInteger(rawPage) && rawPage > 0 ? rawPage : 1;
        const limit = Number.isSafeInteger(rawLimit) && rawLimit > 0 ? Math.min(100, rawLimit) : 20;
        const sortBy = fields.includes(req.query.sortBy) ? req.query.sortBy : 'order';
        const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;
        const query = {};
        if (typeof req.query.name === 'string' && req.query.name.trim()) query.name = { $regex: escapeRegex(req.query.name.trim().slice(0, 120)), $options: 'i' };
        if (req.query.active === 'true' || req.query.active === 'false') query.active = req.query.active === 'true';
        if (Model === Godparent && ['groomsman', 'bridesmaid', 'mother', 'father', 'other'].includes(req.query.role)) query.role = req.query.role;
        if (Model === GiftProduct) {
          if (typeof req.query.category === 'string' && req.query.category.trim()) query.category = { $regex: escapeRegex(req.query.category.trim().slice(0, 80)), $options: 'i' };
          const min = Number(req.query.minPrice); const max = Number(req.query.maxPrice);
          if (req.query.minPrice !== undefined && Number.isFinite(min) && min >= 0) query.price = { ...query.price, $gte: min };
          if (req.query.maxPrice !== undefined && Number.isFinite(max) && max >= 0) query.price = { ...query.price, $lte: max };
        }
        const [data, total] = await Promise.all([
          Model.find(query).sort({ [sortBy]: sortOrder, _id: 1 }).skip((page - 1) * limit).limit(limit),
          Model.countDocuments(query)
        ]);
        ok(res, { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
      } catch (error) { next(error); }
    },
    async getById(req, res, next) {
      try {
        if (!mongoose.isValidObjectId(req.params.id)) return fail(res, 400, 'Identificador invalido.');
        const item = await Model.findById(req.params.id);
        if (!item) return fail(res, 404, 'Registro nao encontrado.');
        ok(res, item);
      } catch (error) { next(error); }
    },
    async create(req, res, next) {
      try {
        const { errors, data } = validate(req.body);
        if (Object.keys(errors).length) return fail(res, 422, 'Os dados informados sao invalidos.', errors);
        if (!await validateImageReferences(references(data), entityType)) return fail(res, 422, 'Imagem inválida ou vinculada a outro cadastro.');
        const item = await Model.create(data);
        try { await bindImages(references(item), entityType, item._id); }
        catch (error) { await Model.deleteOne({ _id: item._id }); await releaseImages(references(item), entityType, item._id); throw error; }
        ok(res, item, 'Registro criado com sucesso.');
      } catch (error) { next(error); }
    },
    async update(req, res, next) {
      try {
        if (!mongoose.isValidObjectId(req.params.id)) return fail(res, 400, 'Identificador invalido.');
        const item = await Model.findById(req.params.id);
        if (!item) return fail(res, 404, 'Registro nao encontrado.');
        const { errors, data } = validate({ ...item.toObject(), ...req.body });
        if (Object.keys(errors).length) return fail(res, 422, 'Os dados informados sao invalidos.', errors);
        if (!await validateImageReferences(references(data), entityType, item._id)) return fail(res, 422, 'Imagem inválida ou vinculada a outro cadastro.');
        const oldImages = references(item);
        const previous = item.toObject();
        Object.assign(item, data);
        await item.save();
        try { await bindImages(references(item), entityType, item._id); }
        catch (error) { Object.assign(item, previous); await item.save(); await releaseImages(references(data).filter(value => !oldImages.includes(value)), entityType, item._id); throw error; }
        await removeUnusedImages(oldImages.filter(value => !references(item).includes(value)));
        ok(res, item, 'Registro atualizado com sucesso.');
      } catch (error) { next(error); }
    },
    async remove(req, res, next) {
      try {
        if (!mongoose.isValidObjectId(req.params.id)) return fail(res, 400, 'Identificador invalido.');
        const item = await Model.findByIdAndDelete(req.params.id);
        if (!item) return fail(res, 404, 'Registro nao encontrado.');
        await removeUnusedImages(references(item));
        ok(res, null, 'Registro excluido com sucesso.');
      } catch (error) { next(error); }
    }
  };
}

export const godparents = resource(Godparent, validateGodparent, ['order', 'name', 'role', 'active', 'createdAt']);
export const gifts = resource(GiftProduct, validateGift, ['order', 'name', 'category', 'price', 'active', 'createdAt']);

export async function publicGodparents(req, res, next) {
  try { ok(res, await Godparent.find({ active: true }).sort({ order: 1, name: 1 }).limit(200).select('name partnerName role cardRole description image images')); } catch (error) { next(error); }
}
export async function publicGifts(req, res, next) {
  try { ok(res, await GiftProduct.find({ active: true }).sort({ order: 1, name: 1 }).limit(200).select('name description price image category')); } catch (error) { next(error); }
}
