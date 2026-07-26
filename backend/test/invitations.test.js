import test from 'node:test'; import assert from 'node:assert/strict'; import request from 'supertest'; import app from '../src/app.js';
test('health endpoint', async()=>{const r=await request(app).get('/api/health');assert.equal(r.status,200);assert.equal(r.body.success,true);});
test('cadastro sem nome é rejeitado', async()=>{const r=await request(app).post('/api/invitations').send({description:'x'});assert.equal(r.status,422);assert.equal(r.body.success,false);});
test('id inválido retorna 400', async()=>{const r=await request(app).get('/api/invitations/not-an-id');assert.equal(r.status,400);});
