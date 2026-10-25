import { Router } from 'express'; import { confirmLimit, publicReadLimit } from '../../middlewares/rateLimits.js'; import * as c from '../../controllers/invitationController.js';
const r=Router(); r.get('/code/:code',publicReadLimit,c.publicGetByCode); r.get('/:id/:name',publicReadLimit,c.publicGet); r.post('/:id/confirm',confirmLimit,c.confirm); export default r;
