import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  createFolderController,
  getFoldersController,
  updateFolderController,
  deleteFolderController,
  reorderFoldersController,
} from '../controllers/folder.controller';

const router = Router({ mergeParams: true });

router.use(authenticate);

router.post('/', createFolderController);
router.get('/', getFoldersController);
router.patch('/reorder', reorderFoldersController);
router.put('/:id', updateFolderController);
router.delete('/:id', deleteFolderController);

export default router;
