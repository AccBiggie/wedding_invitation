// Em producao nao ha segredo padrao: sem JWT_SECRET forte o servidor nao sobe.
if (process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)) {
  throw new Error('JWT_SECRET ausente ou curto demais (minimo 32 caracteres) em producao.');
}

export const env = {
  port: Number(process.env.PORT || 3000),
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/wedding_invitations',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-apenas-para-desenvolvimento',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  adminEmail: (process.env.ADMIN_EMAIL || 'accbiggie@gmail.com').toLowerCase(),
  adminPassword: process.env.ADMIN_PASSWORD || '',
  r2: {
    accountId: process.env.R2_ACCOUNT_ID || '',
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    bucket: process.env.R2_BUCKET || '',
    endpoint: process.env.R2_ENDPOINT || '',
    publicBaseUrl: process.env.R2_PUBLIC_BASE_URL || '',
    quality: Math.min(95, Math.max(50, Number(process.env.IMAGE_WEBP_QUALITY) || 80))
  }
};
