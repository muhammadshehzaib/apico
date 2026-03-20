import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  getAllController,
  deleteController,
  clearController,
} from '../controllers/history.controller';

const router = Router();

router.use(authenticate);

router.get('/', getAllController);
router.delete('/:id', deleteController);
router.delete('/', clearController);

export default router;
