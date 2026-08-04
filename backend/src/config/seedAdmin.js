import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { env } from './env.js';

export async function seedAdmin() {
  if (!env.adminPassword) return console.warn('ADMIN_PASSWORD nao definido: usuario admin padrao nao foi criado.');
  if (await User.exists({ email: env.adminEmail })) return;
  await User.create({ name: 'Administrador', email: env.adminEmail, passwordHash: await bcrypt.hash(env.adminPassword, 10), role: 'admin' });
  console.log(`Usuario admin padrao criado: ${env.adminEmail}`);
}
