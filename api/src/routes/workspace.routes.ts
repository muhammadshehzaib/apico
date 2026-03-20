import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  createController,
  getAllController,
  getOneController,
  inviteController,
} from '../controllers/workspace.controller';

const router = Router();

router.use(authenticate);

router.post('/', createController);
router.get('/', getAllController);
router.get('/:id', getOneController);
router.post('/:id/invite', inviteController);

export default router;
