import { Router } from 'express'; import rateLimit from 'express-rate-limit'; import * as c from '../../controllers/weddingController.js';
const r=Router(); const limiter=rateLimit({windowMs:15*60*1000,max:100}); const postLimiter=rateLimit({windowMs:60*60*1000,max:10,message:{success:false,message:'Muitos recados enviados. Tente novamente mais tarde.'}});
r.get('/wedding',limiter,c.getWedding); r.get('/messages',limiter,c.listMessages); r.post('/messages',postLimiter,c.createMessage); export default r;
