import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { adminAuth } from '../middlewares/adminAuth.js';
import * as pix from '../controllers/pixController.js';

const router = Router();
router.get('/settings', adminAuth, pix.getSettings);
router.put('/settings', adminAuth, pix.saveSettings);
router.get('/status', pix.getPublicStatus);
router.post('/generate', rateLimit({ windowMs: 60 * 1000, max: 20 }), pix.generate);
router.get('/qrcode', rateLimit({ windowMs: 60 * 1000, max: 20 }), pix.keyQrCode);
export default router;
