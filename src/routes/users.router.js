import { Router } from 'express';
import { validateIdParam } from '../middlewares/validateIdParam.js';
import usersController from '../controllers/users.controller.js';

const router = Router();

// Valida el formato de :id antes de llegar al controller
router.param('id', validateIdParam);

router.get('/', usersController.getAll);
router.get('/:id', usersController.getById);
router.post('/', usersController.create);
router.put('/:id', usersController.update);
router.delete('/:id', usersController.delete);

export default router;
