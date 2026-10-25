import { Router } from 'express'; import { messagePostLimit, publicReadLimit } from '../../middlewares/rateLimits.js'; import * as c from '../../controllers/weddingController.js';
const r=Router();
r.get('/wedding',publicReadLimit,c.getWedding); r.get('/messages',publicReadLimit,c.listMessages); r.post('/messages',messagePostLimit,c.createMessage); export default r;
