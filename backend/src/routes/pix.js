import { Router } from 'express';
import { pixLimit } from '../middlewares/rateLimits.js';
import { adminAuth } from '../middlewares/adminAuth.js';
import * as pix from '../controllers/pixController.js';

const router = Router();
router.get('/settings', adminAuth, pix.getSettings);
router.put('/settings', adminAuth, pix.saveSettings);
router.get('/status', pix.getPublicStatus);
router.post('/generate', pixLimit, pix.generate);
router.get('/qrcode', pixLimit, pix.keyQrCode);
export default router;
