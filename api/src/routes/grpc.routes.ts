import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.middleware';
import { executeLimiter } from '../middleware/rateLimiter.middleware';
import { asyncHandler } from '../utils/async.util';
import { success } from '../utils/response.util';
import { callGrpc } from '../services/grpc.service';

const schema = z.object({
  target: z.string().min(3).max(255),
  proto: z.string().min(1).max(256_000),
  service: z.string().min(1).max(255),
  method: z.string().min(1).max(255),
  message: z.record(z.unknown()),
  metadata: z.record(z.string()).default({}),
  tls: z.boolean().default(false),
});

const router = Router();
router.post('/call', authenticate, executeLimiter, asyncHandler(async (req, res) => {
  const input = schema.parse(req.body);
  const result = await callGrpc(input);
  success(res, result, 'gRPC call completed');
}));

export default router;
