import { Router } from 'express';
import { validateIdParam } from '../middlewares/validateIdParam.js';
import deliveriesController from '../controllers/deliveries.controller.js';

const router = Router();

// Valida el formato de :id antes de llegar al controller
router.param('id', validateIdParam);

router.get('/', deliveriesController.getAll);
router.get('/:id', deliveriesController.getById);
router.post('/', deliveriesController.create);
router.patch('/:id/status', deliveriesController.updateStatus);
router.patch('/:id/courier', deliveriesController.assignCourier);

export default router;
