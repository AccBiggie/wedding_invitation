import mongoose from 'mongoose'; import app from './app.js'; import { env } from './config/env.js'; import { seedAdmin } from './config/seedAdmin.js';
import { cleanupPendingImages } from './controllers/imageController.js';
import { syncInvitationStatuses } from './models/Invitation.js';
mongoose.connect(env.mongoUri).then(seedAdmin).then(() => {
  syncInvitationStatuses().then(count => { if (count) console.log(`Status de ${count} convite(s) recalculado(s).`); }).catch(error => console.error('Falha ao recalcular o status dos convites:', error));
  app.listen(env.port, () => console.log(`API em http://localhost:${env.port}`));
  const cleanup = () => cleanupPendingImages().catch(error => console.error('Falha na limpeza de imagens pendentes:', error));
  void cleanup();
  setInterval(cleanup, 60 * 60 * 1000).unref();
}).catch(err => { console.error('MongoDB:', err.message); process.exit(1); });
