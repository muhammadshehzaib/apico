import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  createController,
  getAllController,
  updateController,
  deleteController,
  shareCollectionController,
  getSharedCollectionController,
  reorderCollectionsController,
} from '../controllers/collection.controller';

const router = Router({ mergeParams: true });

// Public share route
router.get('/share/:token', getSharedCollectionController);

router.use(authenticate);

router.post('/', createController);
router.get('/', getAllController);
router.patch('/reorder', reorderCollectionsController);
router.put('/:id', updateController);
router.delete('/:id', deleteController);
router.post('/:id/share', shareCollectionController);

export default router;
