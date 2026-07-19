import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.utils';
import { sendUnauthorized, sendForbidden } from '../utils/response.utils';
import { UserModel } from '../models/User.model';
import { logger } from '../utils/logger.utils';

// ============================================================
// JWT Authentication Middleware
// ============================================================

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      sendUnauthorized(res, 'No authentication token provided');
      return;
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      sendUnauthorized(res, 'Invalid token format');
      return;
    }

    const decoded = verifyAccessToken(token);
    const user = await UserModel.findById(decoded.userId).select('-password');

    if (!user) {
      sendUnauthorized(res, 'User not found');
      return;
    }

    req.user = user;
    req.userId = user._id.toString();
    next();
  } catch (error) {
    logger.debug('Auth middleware error:', error);
    sendUnauthorized(res, 'Invalid or expired token');
  }
}

// ============================================================
// Role Authorization Middleware
// ============================================================

export function authorize(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendUnauthorized(res);
      return;
    }

    if (!roles.includes(req.user.role)) {
      sendForbidden(res, 'You do not have permission to perform this action');
      return;
    }

    next();
  };
}

// ============================================================
// Optional Auth — attaches user if token present, never blocks
// ============================================================

export async function optionalAuthenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (token) {
        const decoded = verifyAccessToken(token);
        const user = await UserModel.findById(decoded.userId).select('-password');
        if (user) {
          req.user = user;
          req.userId = user._id.toString();
        }
      }
    }
  } catch {
    // silently ignore — optional auth never blocks
  }
  next();
}
