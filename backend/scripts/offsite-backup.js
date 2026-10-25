// Copia os backups diarios do banco (gerados pelo servico "backup" em /backups) para um
// bucket do Cloudflare R2 so de backups, fora da VPS. Roda em loop no servico
// "backup-offsite" do docker-compose.prod.yml:
//   - a cada 6 h envia o backup mais recente, se ainda nao estiver no bucket;
//   - apaga do bucket os backups com mais de 30 dias.
// Sem BACKUP_R2_BUCKET e as credenciais, fica desligado (so avisa e espera).
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { S3Client, HeadObjectCommand, PutObjectCommand, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3';

const DIR = '/backups';
const PREFIX = 'mongodb/';
const EVERY_MS = 6 * 60 * 60 * 1000;
const KEEP_DAYS = 30;
const { BACKUP_R2_ACCOUNT_ID: account, BACKUP_R2_ENDPOINT: endpoint, BACKUP_R2_ACCESS_KEY_ID: accessKeyId, BACKUP_R2_SECRET_ACCESS_KEY: secretAccessKey, BACKUP_R2_BUCKET: bucket } = process.env;

const log = message => console.log(`${new Date().toISOString()} ${message}`);
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

if (!bucket || !accessKeyId || !secretAccessKey || (!endpoint && !account)) {
  log('Copia externa desligada: defina BACKUP_R2_BUCKET e as credenciais BACKUP_R2_* no .env.');
  // Um timer mantem o processo vivo (uma promise pendente sozinha faria o Node encerrar).
  for (;;) await sleep(EVERY_MS);
}

const s3 = new S3Client({ region: 'auto', endpoint: endpoint || `https://${account}.r2.cloudflarestorage.com`, credentials: { accessKeyId, secretAccessKey }, forcePathStyle: true });

async function exists(key) {
  try { await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key })); return true; }
  catch (error) { if (error.$metadata?.httpStatusCode === 404 || error.name === 'NotFound') return false; throw error; }
}

async function uploadLatest() {
  const files = (await readdir(DIR)).filter(name => /^wedding-\d{4}-\d{2}-\d{2}\.archive\.gz$/.test(name)).sort();
  const latest = files.at(-1);
  if (!latest) return log('Nenhum backup local ainda.');
  const key = PREFIX + latest;
  if (await exists(key)) return log(`${latest} ja esta no bucket.`);
  const body = await readFile(join(DIR, latest));
  await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: 'application/gzip' }));
  log(`${latest} enviado (${(body.length / 1024).toFixed(1)} KB).`);
}

async function pruneOld() {
  const cutoff = Date.now() - KEEP_DAYS * 24 * 60 * 60 * 1000;
  const list = await s3.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: PREFIX }));
  const old = (list.Contents || []).filter(item => item.LastModified && item.LastModified.getTime() < cutoff);
  if (!old.length) return;
  await s3.send(new DeleteObjectsCommand({ Bucket: bucket, Delete: { Objects: old.map(item => ({ Key: item.Key })) } }));
  log(`${old.length} backup(s) com mais de ${KEEP_DAYS} dias removido(s) do bucket.`);
}

for (;;) {
  try { await uploadLatest(); await pruneOld(); }
  catch (error) { log(`Falha na copia externa: ${error.name} ${error.message}`); }
  await sleep(EVERY_MS);
}
