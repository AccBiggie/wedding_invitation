import mongoose from 'mongoose';

export const appearanceDefaults = {
  scheme: 'light', accent: 'wedding', customAccent: '#1f4536', font: 'serif', fontSize: 'normal', base: 'neutral', radius: '1', navigation: 'navbar', container: 'default', navbarBehavior: 'default', navigationStyle: 'attached', offcanvasStyle: 'attached', branches: 'on'
};
export const appearanceOptions = {
  scheme: ['auto', 'light', 'dark', 'dark-nav', 'colored'],
  accent: ['wedding', 'blue', 'azure', 'indigo', 'purple', 'pink', 'red', 'orange', 'yellow', 'lime', 'green', 'teal', 'cyan', 'white', 'custom'],
  font: ['sans-serif', 'serif', 'monospace', 'comic', 'playfair', 'lora', 'baskerville', 'montserrat', 'poppins', 'nunito', 'cinzel', 'marcellus', 'great-vibes', 'parisienne'],
  fontSize: ['small', 'normal', 'large', 'extra-large'],
  base: ['slate', 'gray', 'zinc', 'neutral', 'stone'],
  radius: ['0', '0.5', '1', '1.5', '2'],
  navigation: ['navbar', 'sidebar'],
  container: ['default', 'fluid', 'boxed'],
  navbarBehavior: ['default', 'sticky'],
  navigationStyle: ['attached', 'floating'],
  offcanvasStyle: ['attached', 'floating'],
  // Ramos procedurais das colunas laterais da landing: 'off' nao os desenha.
  branches: ['on', 'off']
};
const fields = Object.fromEntries(Object.entries(appearanceOptions).map(([name, options]) => [name, { type: String, enum: options, default: appearanceDefaults[name] }]));
const schema = new mongoose.Schema({ singleton: { type: String, default: 'default', unique: true }, ...fields, customAccent: { type: String, default: appearanceDefaults.customAccent, match: /^#[0-9a-fA-F]{6}$/ } }, { timestamps: true, collection: 'appearance_settings' });
export default mongoose.model('AppearanceSettings', schema);
