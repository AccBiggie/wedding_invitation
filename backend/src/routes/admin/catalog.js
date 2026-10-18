import { Router } from 'express';
import { godparents, gifts, storeCategories } from '../../controllers/catalogController.js';

export function catalogRouter(controller) {
  const router = Router();
  router.get('/', controller.list);
  router.get('/:id', controller.getById);
  router.post('/', controller.create);
  router.put('/:id', controller.update);
  router.delete('/:id', controller.remove);
  return router;
}

export const godparentsRouter = catalogRouter(godparents);
export const giftsRouter = catalogRouter(gifts);
export const storeCategoriesRouter = catalogRouter(storeCategories);
