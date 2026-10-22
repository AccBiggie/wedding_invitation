import InvitationCardSettings from '../models/InvitationCardSettings.js';
import { wedding } from '../config/wedding.js';
import { env } from '../config/env.js';
import { bindImages, imageIds, removeUnusedImages, validateImageReferences } from '../services/imageStorageService.js';

const EDITABLE = ['siteUrl', 'greeting', 'intro', 'place', 'address', 'qrText', 'photo'];
const LIMITS = { siteUrl: 200, greeting: 60, intro: 400, place: 120, address: 160, qrText: 120, photo: 300 };

export const cardDefaults = () => ({
  siteUrl: new URL(env.frontendUrl).origin,
  greeting: 'Querido(a)',
  intro: 'Com a bênção de Deus e de nossos pais, convidamos você para celebrar conosco o nosso casamento.',
  place: wedding.ceremony.name,
  address: wedding.ceremony.lines.join(' · '),
  qrText: 'Aponte a câmera para confirmar sua presença',
  photo: wedding.photo
});

// Dados fixos do casamento (config/wedding.js), somados ao que o painel edita.
const fixed = () => {
  const [ano, mes, dia] = wedding.datetime.slice(0, 10).split('-').map(Number);
  return { bride: wedding.couple[0], groom: wedding.couple[1], date: { dia, mes, ano }, time: wedding.time[0] };
};

export async function loadCard() {
  const stored = await InvitationCardSettings.findOne({ singleton: 'default' }).lean();
  const defaults = cardDefaults();
  return { ...fixed(), ...Object.fromEntries(EDITABLE.map(key => [key, stored?.[key] || defaults[key]])) };
}

export async function getCard(req, res, next) {
  try { res.json({ success: true, data: await loadCard() }); } catch (error) { next(error); }
}

export async function saveCard(req, res, next) {
  try {
    const errors = {}, data = {};
    for (const key of EDITABLE) {
      const value = req.body[key];
      if (typeof value !== 'string') { errors[key] = ['Campo obrigatório.']; continue; }
      data[key] = value.trim();
      if (data[key].length > LIMITS[key]) errors[key] = [`Use no máximo ${LIMITS[key]} caracteres.`];
    }
    if (!errors.siteUrl) {
      try {
        const url = new URL(data.siteUrl);
        if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
        data.siteUrl = url.origin;
      } catch { errors.siteUrl = ['Informe o endereço do site, como https://seu-site.com.br.']; }
    }
    if (!errors.photo && data.photo && data.photo !== wedding.photo && !imageIds([data.photo]).length) errors.photo = ['Envie a foto pelo campo de upload.'];
    if (Object.keys(errors).length) return res.status(422).json({ success: false, message: 'Os dados informados são inválidos.', errors });

    const current = await InvitationCardSettings.findOneAndUpdate({ singleton: 'default' }, { $setOnInsert: { singleton: 'default' } }, { upsert: true, new: true });
    if (!await validateImageReferences([data.photo], 'invitationCard', current._id)) return res.status(422).json({ success: false, message: 'Os dados informados são inválidos.', errors: { photo: ['Imagem inválida.'] } });
    const previous = current.photo;
    Object.assign(current, data);
    await current.save();
    await bindImages([data.photo], 'invitationCard', current._id);
    if (previous && previous !== data.photo) await removeUnusedImages([previous]);
    res.json({ success: true, message: 'Configurações do convite salvas.', data: await loadCard() });
  } catch (error) { next(error); }
}
