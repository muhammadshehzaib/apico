import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  createController,
  getAllController,
  getOneController,
  updateController,
  deleteController,
  bulkUpdateVariablesController,
} from '../controllers/environment.controller';

const router = Router({ mergeParams: true });

router.use(authenticate);

router.post('/', createController);
router.get('/', getAllController);
router.get('/:id', getOneController);
router.put('/:id', updateController);
router.delete('/:id', deleteController);
router.put('/:id/variables', bulkUpdateVariablesController);

export default router;
