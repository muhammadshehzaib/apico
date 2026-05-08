import { Router } from 'express';
import os from 'os';
import { prisma } from '../config/prisma.config';
import authRoutes from './auth.routes';
import workspaceRoutes from './workspace.routes';
import collectionRoutes from './collection.routes';
import requestRoutes from './request.routes';
import historyRoutes from './history.routes';
import environmentRoutes from './environment.routes';
import workspaceInviteRoutes from './workspaceInvite.routes';
import folderRoutes from './folder.routes';
import tagRoutes from './tag.routes';

const router = Router();

router.get('/health', async (req, res) => {
  let dbStatus: 'ok' | 'error' = 'ok';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbStatus = 'error';
  }

  const status = dbStatus === 'ok' ? 200 : 503;
  res.status(status).json({
    success: dbStatus === 'ok',
    data: {
      status: dbStatus === 'ok' ? 'healthy' : 'degraded',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      database: dbStatus,
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(os.totalmem() / 1024 / 1024),
      },
    },
  });
});

router.use('/auth', authRoutes);
router.use('/workspaces', workspaceRoutes);
router.use('/workspaces/:workspaceId/folders', folderRoutes);
router.use('/workspaces/:workspaceId/collections', collectionRoutes);
router.use('/workspaces/:workspaceId/environments', environmentRoutes);
router.use('/workspaces/:workspaceId/tags', tagRoutes);
router.use('/collections', collectionRoutes);
router.use('/requests', requestRoutes);
router.use('/history', historyRoutes);
router.use('/environments', environmentRoutes);
router.use('/workspace-invites', workspaceInviteRoutes);

export default router;
