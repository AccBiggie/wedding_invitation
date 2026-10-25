import rateLimit from 'express-rate-limit';

// Limites por IP. As leituras publicas tem folga larga: no casamento, muitos celulares saem
// pelo mesmo IP (CGNAT das operadoras). O que grava dados continua com limite apertado.
const MIN = 60 * 1000;
const tooMany = message => ({ success: false, message });

export const publicReadLimit = rateLimit({ windowMs: 15 * MIN, limit: 2000, standardHeaders: 'draft-7', legacyHeaders: false, message: tooMany('Muitas requisições. Tente novamente em instantes.') });
export const confirmLimit = rateLimit({ windowMs: 15 * MIN, limit: 60, standardHeaders: 'draft-7', legacyHeaders: false, message: tooMany('Muitas tentativas de confirmação. Tente novamente em alguns minutos.') });
export const messagePostLimit = rateLimit({ windowMs: 60 * MIN, limit: 40, standardHeaders: 'draft-7', legacyHeaders: false, message: tooMany('Muitos recados enviados. Tente novamente mais tarde.') });
export const pixLimit = rateLimit({ windowMs: MIN, limit: 60, standardHeaders: 'draft-7', legacyHeaders: false, message: tooMany('Muitas solicitações de PIX. Tente novamente em instantes.') });
