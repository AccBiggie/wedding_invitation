import { Router } from 'express';
import express from 'express';
import rateLimit from 'express-rate-limit';
import { adminAuth } from '../middlewares/adminAuth.js';
import * as images from '../controllers/imageController.js';

const router = Router();
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 60, message: { success: false, message: 'Muitos envios de imagem. Tente mais tarde.' } });
const binary = express.raw({ type: ['image/jpeg', 'image/png', 'image/webp'], limit: '10mb' });
const imageType = (req, res, next) => ['image/jpeg', 'image/png', 'image/webp'].includes(req.get('Content-Type')?.split(';')[0]) ? next() : res.status(415).json({ success: false, message: 'Envie uma imagem JPG, PNG ou WebP.' });
router.get('/:id', images.show);
router.post('/', adminAuth, limiter, imageType, binary, images.upload);
router.put('/:id', adminAuth, limiter, imageType, binary, images.replace);
router.delete('/:id', adminAuth, limiter, images.remove);
export default router;
