import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  singleton: { type: String, default: 'default', unique: true },
  siteUrl: { type: String, trim: true, maxlength: 200, default: '' },
  greeting: { type: String, trim: true, maxlength: 60 },
  intro: { type: String, trim: true, maxlength: 400 },
  place: { type: String, trim: true, maxlength: 120 },
  address: { type: String, trim: true, maxlength: 160 },
  qrText: { type: String, trim: true, maxlength: 120 },
  photo: { type: String, trim: true, maxlength: 300 },
  // Modelo usado na impressao e no convite online (link e QR code).
  layout: { type: String, enum: ['igreja', '5', '9', '10'] }
}, { timestamps: true, collection: 'invitation_card_settings' });

export default mongoose.model('InvitationCardSettings', schema);
