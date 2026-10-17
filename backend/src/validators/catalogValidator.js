export const text = (value, max) => typeof value === 'string' ? value.trim().slice(0, max + 1) : '';
export const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export const validOrder = value => Number.isSafeInteger(Number(value)) && Number(value) >= 0;
export const validBoolean = value => typeof value === 'boolean';
export const validImage = value => !value || /^https?:\/\/[^\s]+$/i.test(value) || /^\/[a-zA-Z0-9/_-]+\.(png|jpe?g|webp)$/i.test(value);

export function validateGodparent(body) {
  const errors = {};
  const name = text(body.name, 120);
  if (!name || name.length > 120) errors.name = ['Informe um nome de ate 120 caracteres.'];
  if (!['groomsman', 'bridesmaid', 'mother', 'father', 'other'].includes(body.role)) errors.role = ['Selecione uma funcao valida.'];
  const email = text(body.email, 254);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = ['Informe um e-mail valido.'];
  const phone = text(body.phone, 30);
  if (phone && !/^[+\d()\s-]{8,30}$/.test(phone)) errors.phone = ['Informe um telefone valido.'];
  const description = text(body.description, 1000);
  if (description.length > 1000) errors.description = ['Descricao muito longa.'];
  const image = text(body.image, 2048);
  if (!validImage(image)) errors.image = ['Informe uma URL de imagem valida.'];
  if (!validOrder(body.order ?? 0)) errors.order = ['A ordem deve ser um inteiro nao negativo.'];
  if (body.active !== undefined && !validBoolean(body.active)) errors.active = ['Status invalido.'];
  return { errors, data: { name, role: body.role, phone, email: email.toLowerCase(), description, image, order: Number(body.order ?? 0), active: body.active ?? true } };
}

export function validateGift(body) {
  const errors = {};
  const name = text(body.name, 120);
  if (!name || name.length > 120) errors.name = ['Informe um nome de ate 120 caracteres.'];
  const price = Number(body.price);
  if (!Number.isFinite(price) || price <= 0 || price > 1000000 || Math.abs(Math.round(price * 100) - price * 100) > 1e-7) errors.price = ['Informe um valor entre R$ 0,01 e R$ 1.000.000,00.'];
  const description = text(body.description, 1000);
  if (description.length > 1000) errors.description = ['Descricao muito longa.'];
  const category = text(body.category, 80);
  if (category.length > 80) errors.category = ['Categoria muito longa.'];
  const image = text(body.image, 2048);
  if (!validImage(image)) errors.image = ['Informe uma URL de imagem valida.'];
  if (!validOrder(body.order ?? 0)) errors.order = ['A ordem deve ser um inteiro nao negativo.'];
  if (body.active !== undefined && !validBoolean(body.active)) errors.active = ['Status invalido.'];
  return { errors, data: { name, description, price, category, image, order: Number(body.order ?? 0), active: body.active ?? true } };
}
