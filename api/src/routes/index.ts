import { Router } from 'express';
import authRoutes from './auth.routes';
import workspaceRoutes from './workspace.routes';
import collectionRoutes from './collection.routes';
import requestRoutes from './request.routes';
import historyRoutes from './history.routes';
import environmentRoutes from './environment.routes';

const router = Router();

// Health check
router.get('/health', (req, res) => {
    res.status(200).json({ success: true, message: 'API is running' });
});

router.use('/auth', authRoutes);
router.use('/workspaces', workspaceRoutes);
router.use('/workspaces/:workspaceId/collections', collectionRoutes);
router.use('/collections', collectionRoutes);
router.use('/requests', requestRoutes);
router.use('/history', historyRoutes);
router.use('/environments', environmentRoutes);

export default router;
