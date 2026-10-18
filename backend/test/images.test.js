import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import request from 'supertest';
import mongoose from 'mongoose';
import { randomBytes } from 'node:crypto';
import { Readable } from 'node:stream';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import app from '../src/app.js';
import { processImage, uploadImage } from '../src/services/imageStorageService.js';
import { env } from '../src/config/env.js';
import { signToken } from '../src/controllers/authController.js';
import StoredImage from '../src/models/StoredImage.js';

const filename = { jpeg: 'foto.jpg', png: 'foto.png', webp: 'foto.webp' };
const mime = { jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };

for (const format of ['jpeg', 'png', 'webp']) {
  test(`processa ${format}, redimensiona e remove metadados`, async () => {
    const buffer = await sharp({ create: { width: 1500, height: 900, channels: 4, background: { r: 10, g: 100, b: 200, alpha: 0.6 } } }).toFormat(format).toBuffer();
    const result = await processImage(buffer, 'godparent', mime[format], filename[format]);
    const info = await sharp(result.buffer).metadata();
    assert.equal(info.format, 'webp');
    assert.equal(info.width, 1200);
    assert.equal(info.height, 720);
    assert.equal(info.exif, undefined);
    assert.ok(result.buffer.length < buffer.length || format === 'webp');
  });
}

test('rejeita arquivo vazio, formato falso, imagem corrompida e dimensões excessivas', async () => {
  await assert.rejects(processImage(Buffer.alloc(0), 'gift', 'image/png', 'x.png'), { status: 413 });
  const png = await sharp({ create: { width: 5, height: 5, channels: 3, background: 'red' } }).png().toBuffer();
  await assert.rejects(processImage(png, 'gift', 'image/jpeg', 'x.jpg'), { status: 422 });
  await assert.rejects(processImage(png.subarray(0, 16), 'gift', 'image/png', 'x.png'), { status: 422 });
  await assert.rejects(processImage(Buffer.alloc(5 * 1024 * 1024 + 1), 'gift', 'image/png', 'x.png'), { status: 413 });
  const hugeHeader = Buffer.from(png);
  hugeHeader.writeUInt32BE(12000, 16);
  await assert.rejects(processImage(hugeHeader, 'gift', 'image/png', 'x.png'), { status: 422 });
});

test('upload administrativo exige autenticação, categoria e configuração R2', async () => {
  const buffer = await sharp({ create: { width: 5, height: 5, channels: 3, background: 'blue' } }).png().toBuffer();
  assert.equal((await request(app).post('/api/images').set('Content-Type', 'image/png').send(buffer)).status, 401);
  const token = 'Bearer ' + signToken({ _id: 'test-admin', name: 'Admin', email: 'admin@test.local', role: 'admin' });
  assert.equal((await request(app).post('/api/images').set('Authorization', token).set('Content-Type', 'application/octet-stream').send(buffer)).status, 415);
  assert.equal((await request(app).post('/api/images').set('Authorization', token).set('Content-Type', 'image/png').set('X-Image-Category', 'gift').set('X-Original-Filename', 'foto.png').send(Buffer.concat([buffer, Buffer.alloc(5 * 1024 * 1024)]))).status, 413);
  await assert.rejects(uploadImage(buffer, { category: 'gift', filename: 'x.png', mimeType: 'image/png' }), { status: 503 });
});

test('upload, vínculo, substituição e exclusão preservam banco e objetos', { skip: !process.env.TEST_MONGO_URI }, async () => {
  const originalSend = S3Client.prototype.send;
  const originalConfig = { ...env.r2 };
  const objects = new Map();
  let failPut = false;
  S3Client.prototype.send = async command => {
    if (command instanceof PutObjectCommand) { if (failPut) throw new Error('R2 indisponível'); objects.set(command.input.Key, command.input.Body); return {}; }
    if (command instanceof DeleteObjectCommand) { objects.delete(command.input.Key); return {}; }
    if (command instanceof GetObjectCommand) { const body = objects.get(command.input.Key); return { ContentLength: body.length, Body: Readable.from(body) }; }
    throw new Error('Comando R2 inesperado');
  };
  Object.assign(env.r2, { bucket: 'test', endpoint: 'https://r2.test', accessKeyId: 'test', secretAccessKey: 'test' });
  const token = 'Bearer ' + signToken({ _id: 'test-admin', name: 'Admin', email: 'admin@test.local', role: 'admin' });
  await mongoose.connect(process.env.TEST_MONGO_URI + 'wedding_images_' + randomBytes(5).toString('hex'));
  try {
    const buffer = await sharp({ create: { width: 20, height: 10, channels: 3, background: 'red' } }).png().toBuffer();
    const uploadResponse = await request(app).post('/api/images').set('Authorization', token).set('Content-Type', 'image/png').set('X-Image-Category', 'gift').set('X-Original-Filename', 'foto.png').send(buffer);
    assert.equal(uploadResponse.status, 201);
    const { id, url } = uploadResponse.body.data;
    assert.equal(objects.size, 1);
    assert.equal((await request(app).get(url)).status, 404);
    const wrongCategory = await request(app).post('/api/godparents').set('Authorization', token).send({ name: 'Ana', role: 'bridesmaid', image: url });
    assert.equal(wrongCategory.status, 422);
    const category = await request(app).post('/api/store-categories').set('Authorization', token).send({ name: 'Cozinha', description: 'Itens', image: '/categorias/cozinha.jpg' });
    const gift = await request(app).post('/api/gift-products').set('Authorization', token).send({ name: 'Produto', price: 10, image: url, categoryId: category.body.data._id });
    assert.equal(gift.status, 200);
    assert.equal(String((await StoredImage.findById(id)).entityId), gift.body.data._id);
    const displayed = await request(app).get(url);
    assert.equal(displayed.status, 200);
    assert.equal(displayed.headers['content-type'], 'image/webp');
    assert.equal((await request(app).delete(url)).status, 401);
    assert.equal((await request(app).delete(url).set('Authorization', token)).status, 409);
    const oldKey = (await StoredImage.findById(id)).objectKey;
    failPut = true;
    assert.equal((await request(app).put(url).set('Authorization', token).set('Content-Type', 'image/png').set('X-Original-Filename', 'falha.png').send(buffer)).status, 500);
    assert.equal((await StoredImage.findById(id)).objectKey, oldKey);
    assert.equal(objects.has(oldKey), true);
    failPut = false;
    const replaced = await request(app).put(url).set('Authorization', token).set('Content-Type', 'image/png').set('X-Original-Filename', 'nova.png').send(buffer);
    assert.equal(replaced.status, 200);
    assert.equal(objects.has(oldKey), false);
    assert.equal(objects.size, 1);
    // A mesma imagem como foto extra da galeria continua referenciada e servida.
    assert.equal((await request(app).put('/api/gift-products/' + gift.body.data._id).set('Authorization', token).send({ image: '/produtos/capa.jpg', images: [url] })).status, 200);
    assert.notEqual(await StoredImage.findById(id), null);
    assert.equal((await request(app).get(url)).status, 200);
    assert.equal((await request(app).delete(url).set('Authorization', token)).status, 409);
    assert.equal((await request(app).put('/api/gift-products/' + gift.body.data._id).set('Authorization', token).send({ image: '', images: [] })).status, 200);
    assert.equal(await StoredImage.findById(id), null);
    assert.equal(objects.size, 0);
    failPut = true;
    const failed = await request(app).post('/api/images').set('Authorization', token).set('Content-Type', 'image/png').set('X-Image-Category', 'gift').set('X-Original-Filename', 'falha.png').send(buffer);
    assert.equal(failed.status, 500);
    assert.equal(await StoredImage.countDocuments(), 0);
  } finally {
    await mongoose.connection.dropDatabase(); await mongoose.disconnect();
    S3Client.prototype.send = originalSend;
    Object.assign(env.r2, originalConfig);
  }
});
