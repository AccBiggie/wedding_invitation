import { Router } from 'express'; import * as c from '../../controllers/weddingController.js';
const r=Router(); r.get('/',c.listAllMessages); r.delete('/:id',c.removeMessage); export default r;
