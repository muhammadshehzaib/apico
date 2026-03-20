import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.util';
import { error } from '../utils/response.util';

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      error(res, 'Missing or invalid authorization header', 401);
      return;
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);

    req.user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
    };

    next();
  } catch (err) {
    error(res, 'Invalid or expired token', 401);
  }
};
