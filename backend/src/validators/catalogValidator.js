export const text = (value, max) => typeof value === 'string' ? value.trim().slice(0, max + 1) : '';
export const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export const validOrder = value => Number.isSafeInteger(Number(value)) && Number(value) >= 0;
export const validBoolean = value => typeof value === 'boolean';
// "Mesa e Banho" -> "mesa-e-banho"; "Eletrodomésticos" -> "eletrodomesticos".
export const slugify = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
const objectId = value => value === null || value === undefined || value === '' ? null : String(value);
export const validObjectId = value => /^[a-f\d]{24}$/i.test(value);
export const validImage = value => !value || /^https?:\/\/[^\s]+$/i.test(value) || /^\/[a-zA-Z0-9/_-]+\.(png|jpe?g|webp)$/i.test(value) || /^\/api\/images\/[a-f\d]{24}$/i.test(value);
const validGodparentImage = value => {
  if (!value) return true;
  if (value.length <= 2048 && validImage(value)) return true;
  const match = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  if (!match || value.length > 700000) return false;
  const bytes = Buffer.from(match[2], 'base64');
  if (!bytes.length || bytes.length > 512 * 1024) return false;
  if (match[1] === 'jpeg') return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (match[1] === 'png') return bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  return bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
};

export function validateGodparent(body) {
  const errors = {};
  const name = text(body.name, 120);
  if (!name || name.length > 120) errors.name = ['Informe um nome de ate 120 caracteres.'];
  const partnerName = text(body.partnerName, 120);
  if (partnerName.length > 120) errors.partnerName = ['Informe um segundo nome de ate 120 caracteres.'];
  if (!['groomsman', 'bridesmaid', 'mother', 'father', 'other'].includes(body.role)) errors.role = ['Selecione uma funcao valida.'];
  const cardRole = text(body.cardRole, 120);
  if (cardRole.length > 120) errors.cardRole = ['Informe uma legenda de ate 120 caracteres.'];
  const email = text(body.email, 254);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = ['Informe um e-mail valido.'];
  const phone = text(body.phone, 30);
  if (phone && !/^[+\d()\s-]{8,30}$/.test(phone)) errors.phone = ['Informe um telefone valido.'];
  const description = text(body.description, 1000);
  if (description.length > 1000) errors.description = ['Descricao muito longa.'];
  const image = typeof body.image === 'string' ? body.image.trim() : '';
  if (!validGodparentImage(image)) errors.image = ['Informe uma URL ou imagem JPG, PNG ou WebP de até 512 KB.'];
  const images = Array.isArray(body.images) ? body.images.map(value => typeof value === 'string' ? value.trim() : value) : [];
  if (body.images !== undefined && (!Array.isArray(body.images) || images.length > (image ? 1 : 2) || images.some(value => typeof value !== 'string' || !value || value.length > 200000 || !validGodparentImage(value)))) errors.images = ['Informe no máximo duas fotos válidas.'];
  if (!validOrder(body.order ?? 0)) errors.order = ['A ordem deve ser um inteiro nao negativo.'];
  if (body.active !== undefined && !validBoolean(body.active)) errors.active = ['Status invalido.'];
  return { errors, data: { name, partnerName, role: body.role, cardRole, phone, email: email.toLowerCase(), description, image: image || images[0] || '', images: image ? images : images.slice(1), order: Number(body.order ?? 0), active: body.active ?? true } };
}

export function validateStoreCategory(body) {
  const errors = {};
  const name = text(body.name, 80);
  if (!name || name.length > 80) errors.name = ['Informe um nome de ate 80 caracteres.'];
  const description = text(body.description, 500);
  if (!description || description.length > 500) errors.description = ['Informe uma descricao de ate 500 caracteres.'];
  const image = text(body.image, 2048);
  if (!image || !validImage(image)) errors.image = ['Envie uma imagem ou informe uma URL de imagem valida.'];
  if (!validOrder(body.order ?? 0)) errors.order = ['A ordem deve ser um inteiro nao negativo.'];
  if (body.active !== undefined && !validBoolean(body.active)) errors.active = ['Status invalido.'];
  return { errors, data: { name, description, image, order: Number(body.order ?? 0), active: body.active ?? true } };
}

export function validateGift(body) {
  const errors = {};
  const name = text(body.name, 120);
  if (!name || name.length > 120) errors.name = ['Informe um nome de ate 120 caracteres.'];
  const price = Number(body.price);
  if (!Number.isFinite(price) || price <= 0 || price > 1000000 || Math.abs(Math.round(price * 100) - price * 100) > 1e-7) errors.price = ['Informe um valor entre R$ 0,01 e R$ 1.000.000,00.'];
  const description = text(body.description, 1000);
  if (description.length > 1000) errors.description = ['Descricao muito longa.'];
  const categoryId = objectId(body.categoryId);
  if (!categoryId || !validObjectId(categoryId)) errors.categoryId = ['Selecione uma categoria.'];
  const image = text(body.image, 2048);
  if (!validImage(image)) errors.image = ['Informe uma URL de imagem valida.'];
  if (!validOrder(body.order ?? 0)) errors.order = ['A ordem deve ser um inteiro nao negativo.'];
  if (body.active !== undefined && !validBoolean(body.active)) errors.active = ['Status invalido.'];
  return { errors, data: { name, description, price, categoryId, image, order: Number(body.order ?? 0), active: body.active ?? true } };
}
