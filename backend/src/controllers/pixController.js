import crypto from 'node:crypto';
import QRCode from 'qrcode';
import { generateStaticBrCode, projectReceiverName, projectCity } from '@thiagoprazeres/pix-static-brcode';
import PixSettings from '../models/PixSettings.js';
import { validPixKey, validatePixSettings } from '../validators/pixValidator.js';

const ok = (res, data, message) => res.json({ success: true, ...(message && { message }), data });
const fail = (res, status, message, errors) => res.status(status).json({ success: false, message, ...(errors && { errors }) });

export async function getSettings(req, res, next) {
  try { ok(res, await PixSettings.findOne({ singleton: 'default' })); } catch (error) { next(error); }
}

export async function saveSettings(req, res, next) {
  try {
    const { errors, data } = validatePixSettings(req.body);
    if (Object.keys(errors).length) return fail(res, 422, 'Os dados informados sao invalidos.', errors);
    if (data.keyType === 'cpf' || data.keyType === 'cnpj') data.pixKey = data.pixKey.replace(/\D/g, '');
    if (data.keyType === 'email') data.pixKey = data.pixKey.toLowerCase();
    const settings = await PixSettings.findOneAndUpdate({ singleton: 'default' }, { $set: data }, { upsert: true, new: true, runValidators: true });
    ok(res, settings, 'Configuracao PIX salva com sucesso.');
  } catch (error) { next(error); }
}

export async function getPublicStatus(req, res, next) {
  try { ok(res, { active: Boolean(await PixSettings.exists({ singleton: 'default', active: true })) }); } catch (error) { next(error); }
}

export async function generate(req, res, next) {
  try {
    const amount = Number(req.body.amount);
    if (!Number.isFinite(amount) || amount <= 0 || amount > 1000000 || Math.abs(Math.round(amount * 100) - amount * 100) > 1e-7) return fail(res, 422, 'Informe um valor valido entre R$ 0,01 e R$ 1.000.000,00.');
    const settings = await PixSettings.findOne({ singleton: 'default', active: true });
    if (!settings || !validPixKey(settings.keyType, settings.pixKey) || !settings.receiverName.trim() || !settings.receiverCity.trim()) return fail(res, 422, 'Configuracao PIX indisponivel.');
    const payload = generateStaticBrCode({
      pixKey: settings.pixKey,
      receiverName: projectReceiverName(settings.receiverName),
      receiverCity: projectCity(settings.receiverCity),
      description: settings.description || undefined,
      referenceLabel: crypto.randomBytes(10).toString('hex').toUpperCase(),
      amount
    });
    const qrCode = await QRCode.toDataURL(payload, { errorCorrectionLevel: 'M', width: 320, margin: 2 });
    ok(res, { amount, payload, qrCode });
  } catch (error) { next(error); }
}
