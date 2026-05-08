import { Router } from 'express';
import {
  registerController,
  loginController,
  refreshController,
  logoutController,
} from '../controllers/auth.controller';
import { authLimiter } from '../middleware/rateLimiter.middleware';

const router = Router();

router.post('/register', authLimiter, registerController);
router.post('/login', authLimiter, loginController);
router.post('/refresh', refreshController);
router.post('/logout', logoutController);

export default router;
