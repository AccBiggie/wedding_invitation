import { text } from './catalogValidator.js';

function validTaxId(value, size) {
  const digits = value.replace(/\D/g, '');
  if (digits.length !== size || /^(\d)\1+$/.test(digits)) return false;
  const base = size === 11 ? 9 : 12;
  const check = length => {
    const weights = size === 11 ? (length === 9 ? [10, 9, 8, 7, 6, 5, 4, 3, 2] : [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]) : (length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
    let sum = 0;
    for (let i = 0; i < length; i++) sum += Number(digits[i]) * weights[i];
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };
  return Number(digits[base]) === check(base) && Number(digits[base + 1]) === check(base + 1);
}

export function validPixKey(type, value) {
  if (type === 'email') return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 77;
  if (type === 'phone') return /^\+55\d{10,11}$/.test(value);
  if (type === 'random') return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  if (type === 'cpf') return validTaxId(value, 11);
  if (type === 'cnpj') return validTaxId(value, 14);
  return false;
}

export function validatePixSettings(body) {
  const keyType = body.keyType;
  const pixKey = text(body.pixKey, 77);
  const receiverName = text(body.receiverName, 100);
  const receiverCity = text(body.receiverCity, 100);
  const description = text(body.description, 72);
  const errors = {};
  if (!validPixKey(keyType, pixKey)) errors.pixKey = ['Informe uma chave PIX valida para o tipo selecionado.'];
  if (!receiverName || receiverName.length > 100) errors.receiverName = ['Informe o nome do recebedor.'];
  if (!receiverCity || receiverCity.length > 100) errors.receiverCity = ['Informe a cidade do recebedor.'];
  if (description.length > 72) errors.description = ['Descricao muito longa.'];
  if (typeof body.active !== 'boolean') errors.active = ['Status invalido.'];
  return { errors, data: { keyType, pixKey, receiverName, receiverCity, description, active: body.active } };
}
