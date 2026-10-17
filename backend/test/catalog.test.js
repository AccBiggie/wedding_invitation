import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import request from 'supertest';
import { isValidBrCode, parseStaticBrCode } from '@thiagoprazeres/pix-static-brcode';
import app from '../src/app.js';
import { signToken } from '../src/controllers/authController.js';
import { validPixKey } from '../src/validators/pixValidator.js';

const bearer = 'Bearer ' + signToken({ _id: 'test-admin', name: 'Administrador', email: 'admin@test.local', role: 'admin' });
const connection = process.env.TEST_MONGO_URI;
before(async () => { if (connection) await mongoose.connect(connection + 'wedding_task_' + crypto.randomBytes(5).toString('hex')); });
after(async () => { if (connection) { await mongoose.connection.dropDatabase(); await mongoose.disconnect(); } });

test('validacao da chave PIX cobre CPF, CNPJ, email, telefone e EVP', () => {
  assert.equal(validPixKey('cpf', '529.982.247-25'), true);
  assert.equal(validPixKey('cpf', '111.111.111-11'), false);
  assert.equal(validPixKey('cnpj', '11.222.333/0001-81'), true);
  assert.equal(validPixKey('email', 'teste@example.com'), true);
  assert.equal(validPixKey('phone', '+5511999999999'), true);
  assert.equal(validPixKey('random', '123e4567-e89b-42d3-a456-426614174000'), true);
});

test('CRUD de padrinhos valida, filtra e pagina', { skip: !connection }, async () => {
  const base = '/api/godparents';
  assert.equal((await request(app).get(base)).status, 401);
  assert.equal((await request(app).post(base).set('Authorization', bearer).send({ name: '' })).status, 422);
  const created = await request(app).post(base).set('Authorization', bearer).send({ name: 'Ana', role: 'bridesmaid', order: 2, active: true });
  assert.equal(created.status, 200); const id = created.body.data._id;
  const withCouple = await request(app).put(base + '/' + id).set('Authorization', bearer).send({ partnerName: 'Ricardo', cardRole: 'Padrinhos da noiva', image: '/padrinhos/ana-ricardo.jpg' });
  assert.equal(withCouple.status, 200);
  assert.equal(withCouple.body.data.partnerName, 'Ricardo');
  assert.equal((await request(app).put(base + '/' + id).set('Authorization', bearer).send({ partnerName: 'a'.repeat(121) })).status, 422);
  const list = await request(app).get(base + '?name=Ana&role=bridesmaid&active=true&page=1&limit=1').set('Authorization', bearer);
  assert.equal(list.body.data.pagination.total, 1); assert.equal(list.body.data.data[0]._id, id);
  const publicList = await request(app).get('/api/public/godparents');
  assert.equal(publicList.body.data[0].partnerName, 'Ricardo');
  assert.equal(publicList.body.data[0].cardRole, 'Padrinhos da noiva');
  assert.equal(publicList.body.data[0].image, '/padrinhos/ana-ricardo.jpg');
  assert.equal((await request(app).get(base + '/' + id).set('Authorization', bearer)).body.data.name, 'Ana');
  const updated = await request(app).put(base + '/' + id).set('Authorization', bearer).send({ active: false, order: 3 });
  assert.equal(updated.body.data.active, false);
  assert.equal((await request(app).delete(base + '/' + id).set('Authorization', bearer)).status, 200);
  assert.equal((await request(app).get(base + '/' + id).set('Authorization', bearer)).status, 404);
});

test('CRUD de presentes rejeita preco invalido e preserva filtros', { skip: !connection }, async () => {
  const base = '/api/gift-products';
  for (const price of [0, -1, 'NaN', 'Infinity']) assert.equal((await request(app).post(base).set('Authorization', bearer).send({ name: 'Panela', price })).status, 422);
  const created = await request(app).post(base).set('Authorization', bearer).send({ name: 'Panela', price: 150.29, category: 'Cozinha', order: 1 });
  assert.equal(created.status, 200); const id = created.body.data._id;
  const list = await request(app).get(base + '?name=Pan&category=Cozinha&minPrice=100&maxPrice=200&page=1&limit=1').set('Authorization', bearer);
  assert.equal(list.body.data.pagination.total, 1);
  assert.equal((await request(app).get(base + '/' + id).set('Authorization', bearer)).status, 200);
  assert.equal((await request(app).put(base + '/' + id).set('Authorization', bearer).send({ price: 200 })).body.data.price, 200);
  assert.equal((await request(app).delete(base + '/' + id).set('Authorization', bearer)).status, 200);
});

test('PIX gera BR Code com valor, chave e CRC validos', { skip: !connection }, async () => {
  assert.equal((await request(app).post('/api/pix/generate').send({ amount: 100 })).status, 422);
  assert.equal((await request(app).put('/api/pix/settings').set('Authorization', bearer).send({ keyType: 'email', pixKey: 'invalida', receiverName: 'Ana', receiverCity: 'Sao Paulo', active: true })).status, 422);
  const settings = await request(app).put('/api/pix/settings').set('Authorization', bearer).send({ keyType: 'email', pixKey: 'ana@example.com', receiverName: 'Ana Silva', receiverCity: 'Sao Paulo', active: true });
  assert.equal(settings.status, 200);
  for (const amount of [0, -1, 'NaN', 'Infinity']) assert.equal((await request(app).post('/api/pix/generate').send({ amount })).status, 422);
  const result = await request(app).post('/api/pix/generate').send({ amount: 150.29 });
  assert.equal(result.status, 200); assert.equal(isValidBrCode(result.body.data.payload), true);
  assert.equal(parseStaticBrCode(result.body.data.payload).amount, 150.29);
  assert.equal(parseStaticBrCode(result.body.data.payload).pixKey, 'ana@example.com');
  assert.match(result.body.data.qrCode, /^data:image\/png;base64,/);
});

test('convite publico continua confirmando convidados individualmente', { skip: !connection }, async () => {
  const created = await request(app).post('/api/invitations').set('Authorization', bearer).send({ name: 'Ana; Bruno', type: 'in_person' });
  assert.equal(created.status, 200);
  const item = created.body.data;
  const publicUrl = `/api/public/invitations/${item._id}/ana-bruno?token=${item.publicToken}`;
  const publicItem = await request(app).get(publicUrl);
  assert.equal(publicItem.status, 200);
  const guestId = publicItem.body.data.guests[0]._id;
  const confirmed = await request(app).post(`/api/public/invitations/${item._id}/confirm`).send({ guestIds: [guestId] });
  assert.equal(confirmed.status, 200);
  assert.equal(confirmed.body.data.guests[0].confirmed, true);
  assert.equal(confirmed.body.data.guests[1].confirmed, false);
  assert.equal((await request(app).get(`/api/invitations/${item._id}`).set('Authorization', bearer)).body.data.guests[0].confirmedAt !== null, true);
});
