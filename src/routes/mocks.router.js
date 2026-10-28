import { Router } from 'express';
import mocksController from '../controllers/mocks.controller.js';

const router = Router();

router.get('/users', mocksController.getUsers);
router.get('/couriers', mocksController.getCouriers);
router.get('/orders', mocksController.getOrders);
router.get('/deliveries', mocksController.getDeliveries);
router.get('/scenario', mocksController.getScenario);

router.post('/seed', mocksController.seedUsers);
router.post('/seed/scenario', mocksController.seedScenario);
router.delete('/seed', mocksController.clearSeed);

export default router;
