import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { optionalAuthenticate } from '../middleware/optionalAuth.middleware';
import {
  executeController,
  saveController,
  getAllController,
  updateController,
  deleteController,
  shareController,
  getSharedController,
} from '../controllers/request.controller';

const router = Router({ mergeParams: true });

router.post('/execute', optionalAuthenticate, executeController);

router.get('/share/:token', getSharedController);

router.use(authenticate);

router.post('/:collectionId/requests', saveController);
router.get('/:collectionId/requests', getAllController);
router.put('/:id', updateController);
router.delete('/:id', deleteController);
router.post('/:id/share', shareController);

export default router;
