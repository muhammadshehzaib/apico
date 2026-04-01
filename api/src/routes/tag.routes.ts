import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  createTagController,
  deleteTagController,
  getTagsController,
  updateTagController,
} from '../controllers/tag.controller';

const router = Router({ mergeParams: true });

router.use(authenticate);

router.get('/', getTagsController);
router.post('/', createTagController);
router.put('/:id', updateTagController);
router.delete('/:id', deleteTagController);

export default router;
