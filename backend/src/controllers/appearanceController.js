import AppearanceSettings, { appearanceDefaults, appearanceOptions } from '../models/AppearanceSettings.js';

export async function getAppearance(req, res, next) {
  try {
    const stored = await AppearanceSettings.findOne({ singleton: 'default' }).lean();
    res.json({ success: true, data: { ...appearanceDefaults, ...Object.fromEntries(Object.keys(appearanceDefaults).map(key => [key, stored?.[key] ?? appearanceDefaults[key]])) } });
  } catch (error) { next(error); }
}

export async function saveAppearance(req, res, next) {
  try {
    const errors = {};
    for (const [key, options] of Object.entries(appearanceOptions)) {
      if (!options.includes(req.body[key])) errors[key] = ['Selecione uma opcao valida.'];
    }
    if (Object.keys(errors).length) return res.status(422).json({ success: false, message: 'Os dados informados sao invalidos.', errors });
    const data = Object.fromEntries(Object.keys(appearanceOptions).map(key => [key, req.body[key]]));
    await AppearanceSettings.findOneAndUpdate({ singleton: 'default' }, { $set: data }, { upsert: true, runValidators: true });
    res.json({ success: true, data });
  } catch (error) { next(error); }
}
