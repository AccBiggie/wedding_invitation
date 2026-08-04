import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { env } from '../config/env.js';

const ok = (res, data, message) => res.json({ success: true, ...(message && { message }), data });
const fail = (res, status, message, errors) => res.status(status).json({ success: false, message, ...(errors && { errors }) });
const userView = user => ({ id: String(user._id), name: user.name, email: user.email, role: user.role });
// Hash descartavel: comparar sempre algo valido evita revelar por tempo de resposta quais e-mails existem.
const dummyHash = bcrypt.hashSync('senha-inexistente-para-comparacao', 10);

export const signToken = user => jwt.sign({ sub: String(user._id), name: user.name, email: user.email, role: user.role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

export async function login(req, res, next) {
  try {
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    const errors = {};
    if (!email) errors.email = ['O e-mail e obrigatorio.'];
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = ['Informe um e-mail valido.'];
    if (!password) errors.password = ['A senha e obrigatoria.'];
    if (Object.keys(errors).length) return fail(res, 422, 'Os dados informados sao invalidos.', errors);
    const user = await User.findOne({ email });
    const matches = await bcrypt.compare(password, user?.passwordHash || dummyHash);
    if (!user || !matches) return fail(res, 401, 'E-mail ou senha invalidos.');
    const accessToken = signToken(user);
    ok(res, { accessToken, tokenType: 'Bearer', expiresIn: jwt.decode(accessToken).exp - Math.floor(Date.now() / 1000), user: userView(user) }, 'Login realizado com sucesso.');
  } catch (error) { next(error); }
}

export function me(req, res) { ok(res, req.user); }
