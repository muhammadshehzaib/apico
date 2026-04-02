import { Router } from 'express';
import multer from 'multer';
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
  searchController,
  updateTagsController,
  reorderRequestsController,
} from '../controllers/request.controller';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const router = Router({ mergeParams: true });

router.post('/execute', optionalAuthenticate, upload.any(), executeController);

router.get('/share/:token', getSharedController);

router.use(authenticate);

router.get('/search', searchController);
router.patch('/reorder', reorderRequestsController);
router.post('/:collectionId/requests', saveController);
router.get('/:collectionId/requests', getAllController);
router.put('/:id', updateController);
router.put('/:id/tags', updateTagsController);
router.delete('/:id', deleteController);
router.post('/:id/share', shareController);

export default router;
