import mongoose from 'mongoose';

export const appearanceDefaults = {
  scheme: 'light', accent: 'wedding', font: 'serif', fontSize: 'normal', base: 'neutral', radius: '1', navigation: 'navbar', container: 'default', navbarBehavior: 'default', navigationStyle: 'attached', offcanvasStyle: 'attached'
};
export const appearanceOptions = {
  scheme: ['auto', 'light', 'dark', 'dark-nav', 'colored'],
  accent: ['wedding', 'blue', 'azure', 'indigo', 'purple', 'pink', 'red', 'orange', 'yellow', 'lime', 'green', 'teal', 'cyan', 'white'],
  font: ['sans-serif', 'serif', 'monospace', 'comic', 'playfair', 'lora', 'baskerville', 'montserrat', 'poppins', 'nunito', 'cinzel', 'marcellus', 'great-vibes', 'parisienne'],
  fontSize: ['small', 'normal', 'large', 'extra-large'],
  base: ['slate', 'gray', 'zinc', 'neutral', 'stone'],
  radius: ['0', '0.5', '1', '1.5', '2'],
  navigation: ['navbar', 'sidebar'],
  container: ['default', 'fluid', 'boxed'],
  navbarBehavior: ['default', 'sticky'],
  navigationStyle: ['attached', 'floating'],
  offcanvasStyle: ['attached', 'floating']
};
const fields = Object.fromEntries(Object.entries(appearanceOptions).map(([name, options]) => [name, { type: String, enum: options, default: appearanceDefaults[name] }]));
const schema = new mongoose.Schema({ singleton: { type: String, default: 'default', unique: true }, ...fields }, { timestamps: true, collection: 'appearance_settings' });
export default mongoose.model('AppearanceSettings', schema);
