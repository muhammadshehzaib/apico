import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.util';

export const optionalAuthenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided — continue as guest
      req.user = undefined;
      next();
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
    // Invalid token — continue as guest
    req.user = undefined;
    next();
  }
};
