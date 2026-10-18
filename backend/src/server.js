import mongoose from 'mongoose'; import app from './app.js'; import { env } from './config/env.js'; import { seedAdmin } from './config/seedAdmin.js';
import { cleanupPendingImages } from './controllers/imageController.js';
mongoose.connect(env.mongoUri).then(seedAdmin).then(() => {
  app.listen(env.port, () => console.log(`API em http://localhost:${env.port}`));
  const cleanup = () => cleanupPendingImages().catch(error => console.error('Falha na limpeza de imagens pendentes:', error));
  void cleanup();
  setInterval(cleanup, 60 * 60 * 1000).unref();
}).catch(err => { console.error('MongoDB:', err.message); process.exit(1); });
