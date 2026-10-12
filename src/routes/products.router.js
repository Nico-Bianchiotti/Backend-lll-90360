import { Router } from 'express';
import productsController from '../controllers/products.controller.js';

const router = Router();

router.get('/', productsController.getAll);
router.get('/:id', productsController.getById);
router.get('/:id/shipping-cost', productsController.getShippingCost);
router.post('/', productsController.create);
router.put('/:id', productsController.update);
router.delete('/:id', productsController.delete);

export default router;
