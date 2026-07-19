import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { sendBadRequest } from '../utils/response.utils';

// ============================================================
// Request Validation Middleware
// ============================================================
// Usage: router.post('/route', [validationChains...], validate, handler)
// The validation chains run first (via Express array spreading),
// then `validate` checks their results and sends a 400 or calls next().

export function validate(req: Request, res: Response, next: NextFunction): void {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const firstError = errors.array()[0];
    sendBadRequest(res, firstError.msg, JSON.stringify(errors.array()));
    return;
  }
  next();
}
