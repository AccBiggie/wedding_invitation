import { Router } from 'express'; import * as c from '../../controllers/invitationController.js';
const r=Router(); r.get('/',c.list); r.post('/codes',c.ensureCodes); r.get('/:id',c.getById); r.post('/',c.create); r.put('/:id',c.update); r.delete('/:id',c.remove); export default r;
