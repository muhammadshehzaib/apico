import { Request, Response } from 'express';
import { asyncHandler } from '../utils/async.util';
import { success, error } from '../utils/response.util';
import { register, login, refreshAccessToken } from '../services/auth.service';
import { registerSchema, loginSchema, refreshTokenSchema } from '../validations/auth.validation';

export const registerController = asyncHandler(async (req: Request, res: Response) => {
  const body = registerSchema.parse(req.body);

  const result = await register(body.name, body.email, body.password);

  success(res, result, 'User registered successfully', 201);
});

export const loginController = asyncHandler(async (req: Request, res: Response) => {
  const body = loginSchema.parse(req.body);

  const result = await login(body.email, body.password);

  success(res, result, 'Login successful');
});

export const refreshController = asyncHandler(async (req: Request, res: Response) => {
  const body = refreshTokenSchema.parse(req.body);

  const result = await refreshAccessToken(body.refreshToken);

  success(res, result, 'Token refreshed successfully');
});

export const logoutController = asyncHandler(async (req: Request, res: Response) => {
  success(res, null, 'Logout successful');
});
