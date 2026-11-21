import { Router } from 'express';
import { validateIdParam } from '../middlewares/validateIdParam.js';
import productsController from '../controllers/products.controller.js';

const router = Router();

// Valida el formato de :id antes de llegar al controller
router.param('id', validateIdParam);

router.get('/', productsController.getAll);
router.get('/:id', productsController.getById);
router.get('/:id/shipping-cost', productsController.getShippingCost);
router.post('/', productsController.create);
router.put('/:id', productsController.update);
router.delete('/:id', productsController.delete);

export default router;
