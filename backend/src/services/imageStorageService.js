import { randomUUID } from 'node:crypto';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { env } from '../config/env.js';
import StoredImage from '../models/StoredImage.js';
import Godparent from '../models/Godparent.js';
import GiftProduct from '../models/GiftProduct.js';
import StoreCategory from '../models/StoreCategory.js';
import InvitationCardSettings from '../models/InvitationCardSettings.js';

export const imageCategories = {
  avatar: { prefix: 'outros', width: 400, height: 400, maxBytes: 5 * 1024 * 1024 },
  guest: { prefix: 'convidados', width: 1200, height: 1200, maxBytes: 5 * 1024 * 1024 },
  godparent: { prefix: 'padrinhos', width: 1200, height: 1200, maxBytes: 5 * 1024 * 1024 },
  gift: { prefix: 'produtos', width: 1200, height: 1200, maxBytes: 5 * 1024 * 1024 },
  storeCategory: { prefix: 'categorias', width: 800, height: 800, maxBytes: 5 * 1024 * 1024 },
  invitationCard: { prefix: 'convite', width: 1600, height: 1600, maxBytes: 5 * 1024 * 1024 },
  gallery: { prefix: 'galeria', width: 1920, height: 1920, maxBytes: 10 * 1024 * 1024 },
  banner: { prefix: 'banners', width: 1920, height: 1080, maxBytes: 5 * 1024 * 1024 },
  other: { prefix: 'outros', width: 1200, height: 1200, maxBytes: 5 * 1024 * 1024 }
};

let client;
function storage() {
  const { accountId, accessKeyId, secretAccessKey, bucket, endpoint } = env.r2;
  if (!bucket || !accessKeyId || !secretAccessKey || (!endpoint && !accountId)) {
    const error = new Error('Armazenamento de imagens não configurado.'); error.status = 503; throw error;
  }
  if (!client) client = new S3Client({ region: 'auto', endpoint: endpoint || `https://${accountId}.r2.cloudflarestorage.com`, credentials: { accessKeyId, secretAccessKey }, forcePathStyle: true });
  return client;
}

export function getImageUrl(image) { return `/api/images/${image._id}`; }
export async function getImage(id) { return StoredImage.findById(id); }

export async function processImage(buffer, category, declaredType, filename = '') {
  const spec = imageCategories[category];
  if (!spec) { const error = new Error('Categoria de imagem inválida.'); error.status = 422; throw error; }
  if (!buffer?.length || buffer.length > spec.maxBytes) { const error = new Error('Imagem vazia ou acima do limite permitido.'); error.status = 413; throw error; }
  const signatures = {
    jpeg: buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff,
    png: buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
    webp: buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP'
  };
  const detected = Object.keys(signatures).find(type => signatures[type]);
  const expected = { 'image/jpeg': 'jpeg', 'image/png': 'png', 'image/webp': 'webp' }[declaredType];
  const extension = filename.split('.').pop()?.toLowerCase();
  if (!detected || detected !== expected || (extension && !({ jpeg: ['jpg', 'jpeg'], png: ['png'], webp: ['webp'] }[detected].includes(extension)))) {
    const error = new Error('Formato ou conteúdo da imagem inválido.'); error.status = 422; throw error;
  }
  try {
    const input = sharp(buffer, { failOn: 'error', limitInputPixels: 40_000_000 });
    const metadata = await input.metadata();
    if (metadata.format !== detected || !metadata.width || !metadata.height || metadata.width > 10000 || metadata.height > 10000) throw new Error('Dimensões inválidas.');
    const output = await input.rotate().resize(spec.width, spec.height, { fit: 'inside', withoutEnlargement: true }).webp({ quality: env.r2.quality }).toBuffer({ resolveWithObject: true });
    return { buffer: output.data, width: output.info.width, height: output.info.height };
  } catch {
    const error = new Error('Imagem corrompida, grande demais ou não processável.'); error.status = 422; throw error;
  }
}

export async function uploadImage(buffer, { category, filename, mimeType }) {
  const processed = await processImage(buffer, category, mimeType, filename);
  const objectKey = `${imageCategories[category].prefix}/${randomUUID()}.webp`;
  const r2 = storage();
  const image = await StoredImage.create({ entityType: category, objectKey, originalFilename: String(filename || 'imagem').replace(/[\x00-\x1f/\\]/g, '').slice(0, 180), mimeType: 'image/webp', fileSize: processed.buffer.length, width: processed.width, height: processed.height });
  try {
    await r2.send(new PutObjectCommand({ Bucket: env.r2.bucket, Key: objectKey, Body: processed.buffer, ContentType: 'image/webp', CacheControl: 'public, max-age=31536000, immutable' }));
    return image;
  } catch (error) {
    try { await r2.send(new DeleteObjectCommand({ Bucket: env.r2.bucket, Key: objectKey })); await StoredImage.deleteOne({ _id: image._id }); } catch (cleanupError) { console.error('Falha ao limpar upload incompleto:', cleanupError); }
    throw error;
  }
}

export async function deleteImage(image) {
  for (const key of new Set([image.objectKey, image.pendingObjectKey, ...image.staleObjectKeys].filter(Boolean))) await storageDeleteKey(key);
  await StoredImage.deleteOne({ _id: image._id });
}

export async function storageDeleteKey(key) { await storage().send(new DeleteObjectCommand({ Bucket: env.r2.bucket, Key: key })); }

export async function replaceImage(image, buffer, mimeType, filename) {
  const processed = await processImage(buffer, image.entityType, mimeType, filename);
  const objectKey = `${imageCategories[image.entityType].prefix}/${randomUUID()}.webp`;
  const r2 = storage();
  const oldKey = image.objectKey;
  image.pendingObjectKey = objectKey;
  await image.save();
  try {
    await r2.send(new PutObjectCommand({ Bucket: env.r2.bucket, Key: objectKey, Body: processed.buffer, ContentType: 'image/webp', CacheControl: 'public, max-age=31536000, immutable' }));
    image.objectKey = objectKey;
    image.pendingObjectKey = '';
    image.staleObjectKeys.push(oldKey);
    image.originalFilename = String(filename || 'imagem').replace(/[\x00-\x1f/\\]/g, '').slice(0, 180);
    image.fileSize = processed.buffer.length; image.width = processed.width; image.height = processed.height;
    await image.save();
  } catch (error) {
    try { await r2.send(new DeleteObjectCommand({ Bucket: env.r2.bucket, Key: objectKey })); await StoredImage.updateOne({ _id: image._id, pendingObjectKey: objectKey }, { $set: { pendingObjectKey: '' } }); } catch (cleanupError) { console.error('Falha ao limpar substituição:', cleanupError); }
    throw error;
  }
  try { await r2.send(new DeleteObjectCommand({ Bucket: env.r2.bucket, Key: oldKey })); await StoredImage.updateOne({ _id: image._id }, { $pull: { staleObjectKeys: oldKey } }); } catch (error) { console.error('Falha ao limpar imagem substituída:', error); }
  return image;
}

export async function openImage(image) { return storage().send(new GetObjectCommand({ Bucket: env.r2.bucket, Key: image.objectKey })); }

// Miniaturas para fotos exibidas bem menores que o original (ex.: porta-retratos dos padrinhos).
// Reduzir 1200px para ~100px no navegador borra a foto; aqui a reducao usa Lanczos e um leve
// sharpen. Larguras fixas para ninguem forcar processamento arbitrario; cache em memoria pequeno.
export const thumbnailWidths = [480];
const thumbnailCache = new Map();
const THUMBNAIL_CACHE_LIMIT = 200;
export async function thumbnail(image, width) {
  const key = `${image._id}:${image.updatedAt?.getTime?.() || 0}:${width}`;
  const cached = thumbnailCache.get(key);
  if (cached) { thumbnailCache.delete(key); thumbnailCache.set(key, cached); return cached; }
  const chunks = [];
  for await (const chunk of (await openImage(image)).Body) chunks.push(chunk);
  const buffer = await sharp(Buffer.concat(chunks)).resize(width, width, { fit: 'inside', withoutEnlargement: true }).sharpen({ sigma: 0.5 }).webp({ quality: 85 }).toBuffer();
  thumbnailCache.set(key, buffer);
  if (thumbnailCache.size > THUMBNAIL_CACHE_LIMIT) thumbnailCache.delete(thumbnailCache.keys().next().value);
  return buffer;
}

export function imageIds(values) {
  return [...new Set(values.map(value => /^\/api\/images\/([a-f\d]{24})$/i.exec(value)?.[1]).filter(Boolean))];
}

export async function validateImageReferences(values, entityType, entityId = null) {
  const ids = imageIds(values);
  if (!ids.length) return true;
  const images = await StoredImage.find({ _id: { $in: ids } });
  return images.length === ids.length && images.every(image => image.entityType === entityType && (!image.entityId || String(image.entityId) === String(entityId)));
}

export async function bindImages(values, entityType, entityId) {
  const ids = imageIds(values);
  if (!ids.length) return;
  await StoredImage.updateMany({ _id: { $in: ids }, entityType, entityId: null }, { $set: { entityId } });
  if (await StoredImage.countDocuments({ _id: { $in: ids }, entityType, entityId }) !== ids.length) throw new Error('Falha ao vincular imagens ao cadastro.');
}

export async function releaseImages(values, entityType, entityId) {
  const ids = imageIds(values);
  if (ids.length) await StoredImage.updateMany({ _id: { $in: ids }, entityType, entityId }, { $set: { entityId: null } });
}

export async function removeUnusedImages(values) {
  for (const id of imageIds(values)) {
    const image = await getImage(id);
    if (!image) continue;
    const url = getImageUrl(image);
    const [godparent, gift, category, card] = await Promise.all([Godparent.exists({ $or: [{ image: url }, { images: url }] }), GiftProduct.exists({ $or: [{ image: url }, { images: url }] }), StoreCategory.exists({ image: url }), InvitationCardSettings.exists({ photo: url })]);
    if (!godparent && !gift && !category && !card) {
      try { await deleteImage(image); } catch (error) {
        console.error('Falha ao remover imagem não utilizada:', error);
        try { await StoredImage.updateOne({ _id: image._id }, { $set: { entityId: null } }); } catch (cleanupError) { console.error('Falha ao marcar imagem para limpeza:', cleanupError); }
      }
    }
  }
}
