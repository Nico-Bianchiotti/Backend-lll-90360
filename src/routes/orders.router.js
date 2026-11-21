import { Router } from 'express';
import { validateIdParam } from '../middlewares/validateIdParam.js';
import ordersController from '../controllers/orders.controller.js';

const router = Router();

// Valida el formato de :id antes de llegar al controller
router.param('id', validateIdParam);

router.get('/', ordersController.getAll);
router.get('/:id', ordersController.getById);
router.post('/', ordersController.create);
router.patch('/:id/status', ordersController.updateStatus);

export default router;
