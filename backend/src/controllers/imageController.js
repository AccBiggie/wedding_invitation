import mongoose from 'mongoose';
import { imageCategories, uploadImage, getImage, getImageUrl, openImage, deleteImage, replaceImage, storageDeleteKey } from '../services/imageStorageService.js';
import Godparent from '../models/Godparent.js';
import GiftProduct from '../models/GiftProduct.js';
import StoreCategory from '../models/StoreCategory.js';
import StoredImage from '../models/StoredImage.js';
import { env } from '../config/env.js';

const view = image => ({ id: String(image._id), url: getImageUrl(image), entityType: image.entityType, entityId: image.entityId, filename: image.originalFilename, mimeType: image.mimeType, fileSize: image.fileSize, width: image.width, height: image.height });
const bad = (res, status, message) => res.status(status).json({ success: false, message });
const isReferenced = async image => {
  const url = getImageUrl(image);
  return Boolean(await Promise.all([
    Godparent.exists({ $or: [{ image: url }, { images: url }] }),
    GiftProduct.exists({ image: url }),
    StoreCategory.exists({ image: url })
  ]).then(results => results.some(Boolean)));
};

export async function upload(req, res, next) {
  try {
    const category = req.get('X-Image-Category');
    if (!imageCategories[category]) return bad(res, 422, 'Categoria de imagem inválida.');
    let filename;
    try { filename = decodeURIComponent(req.get('X-Original-Filename') || 'imagem'); } catch { return bad(res, 422, 'Nome de arquivo inválido.'); }
    const image = await uploadImage(req.body, { category, filename, mimeType: req.get('Content-Type') });
    res.status(201).json({ success: true, data: view(image) });
    void cleanupPendingImages().catch(error => console.error('Falha na limpeza de imagens pendentes:', error));
  } catch (error) { next(error); }
}

export async function show(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return bad(res, 400, 'Identificador inválido.');
    const image = await getImage(req.params.id);
    if (!image || !image.entityId || !['godparent', 'gift', 'storeCategory'].includes(image.entityType) || !await isReferenced(image)) return bad(res, 404, 'Imagem não encontrada.');
    if (env.r2.publicBaseUrl) {
      const base = new URL(env.r2.publicBaseUrl);
      if (base.protocol !== 'https:' || base.hostname.endsWith('.r2.dev')) return bad(res, 503, 'Domínio público de imagens inválido.');
      const target = `${base.href.replace(/\/$/, '')}/${image.objectKey.split('/').map(encodeURIComponent).join('/')}`;
      res.set('Cache-Control', 'no-store');
      return res.redirect(302, target);
    }
    const object = await openImage(image);
    res.set({ 'Content-Type': image.mimeType, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    if (object.ContentLength) res.set('Content-Length', String(object.ContentLength));
    object.Body.on('error', next).pipe(res);
  } catch (error) { next(error); }
}

export async function remove(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return bad(res, 400, 'Identificador inválido.');
    const image = await getImage(req.params.id);
    if (!image) return bad(res, 404, 'Imagem não encontrada.');
    if (await isReferenced(image)) return bad(res, 409, 'Remova a imagem do cadastro antes de excluí-la.');
    await deleteImage(image);
    res.json({ success: true, data: null });
  } catch (error) { next(error); }
}

export async function replace(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return bad(res, 400, 'Identificador inválido.');
    const image = await getImage(req.params.id);
    if (!image) return bad(res, 404, 'Imagem não encontrada.');
    let filename;
    try { filename = decodeURIComponent(req.get('X-Original-Filename') || 'imagem'); } catch { return bad(res, 422, 'Nome de arquivo inválido.'); }
    const updated = await replaceImage(image, req.body, req.get('Content-Type'), filename);
    res.json({ success: true, data: view(updated) });
  } catch (error) { next(error); }
}

export async function cleanupPendingImages() {
  const cutoff = new Date(Date.now() - 15 * 60 * 1000);
  const leftovers = await StoredImage.find({ $or: [{ pendingObjectKey: { $type: 'string', $ne: '' }, updatedAt: { $lt: cutoff } }, { 'staleObjectKeys.0': { $exists: true } }] }).limit(20);
  for (const image of leftovers) {
    if (image.pendingObjectKey && image.updatedAt < cutoff) {
      try { await storageDeleteKey(image.pendingObjectKey); await StoredImage.updateOne({ _id: image._id, pendingObjectKey: image.pendingObjectKey }, { $set: { pendingObjectKey: '' } }); } catch (error) { console.error('Falha ao limpar substituição pendente:', error); }
    }
    for (const key of image.staleObjectKeys) {
      try { await storageDeleteKey(key); await StoredImage.updateOne({ _id: image._id }, { $pull: { staleObjectKeys: key } }); } catch (error) { console.error('Falha ao limpar versão antiga:', error); }
    }
  }
  const stale = await StoredImage.find({ entityId: null, createdAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } }).limit(20);
  for (const image of stale) {
    try { if (!await isReferenced(image)) await deleteImage(image); } catch (error) { console.error('Falha ao limpar imagem pendente:', error); }
  }
}
