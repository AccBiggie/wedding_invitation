import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function adminAuth(req, res, next) {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (!/^Bearer$/i.test(scheme || '') || !token) return res.status(401).json({ success: false, message: 'Autenticacao necessaria.' });
  try {
    const payload = jwt.verify(token, env.jwtSecret);
    req.user = { id: payload.sub, name: payload.name, email: payload.email, role: payload.role };
    next();
  } catch { res.status(401).json({ success: false, message: 'Sessao expirada ou invalida. Faca login novamente.' }); }
}
