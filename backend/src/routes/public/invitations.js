import { Router } from 'express'; import rateLimit from 'express-rate-limit'; import * as c from '../../controllers/invitationController.js';
const r=Router(); const limiter=rateLimit({windowMs:15*60*1000,max:100}); r.get('/:id/:name',limiter,c.publicGet); r.post('/:id/confirm',limiter,c.confirm); export default r;
