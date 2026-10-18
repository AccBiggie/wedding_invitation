import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  entityType: { type: String, required: true, enum: ['godparent', 'gift', 'storeCategory', 'guest', 'gallery', 'banner', 'avatar', 'other'] },
  entityId: { type: mongoose.Schema.Types.ObjectId, default: null },
  objectKey: { type: String, required: true, unique: true },
  pendingObjectKey: { type: String, default: '' },
  staleObjectKeys: { type: [String], default: [] },
  originalFilename: { type: String, required: true },
  mimeType: { type: String, required: true, default: 'image/webp' },
  fileSize: { type: Number, required: true },
  width: { type: Number, required: true },
  height: { type: Number, required: true }
}, { timestamps: true, collection: 'stored_images' });
schema.index({ entityType: 1, entityId: 1 });
schema.index({ entityId: 1, createdAt: 1 });
export default mongoose.model('StoredImage', schema);
