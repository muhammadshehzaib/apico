import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  createController,
  getAllController,
  updateController,
  deleteController,
} from '../controllers/collection.controller';

const router = Router({ mergeParams: true });

router.use(authenticate);

router.post('/', createController);
router.get('/', getAllController);
router.put('/:id', updateController);
router.delete('/:id', deleteController);

export default router;
