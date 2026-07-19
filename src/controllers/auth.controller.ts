import { Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { authService, generateTokensForUser } from '../services/auth.service';
import { sendSuccess, sendCreated, sendError } from '../utils/response.utils';
import { IUser } from '../models/User.model';
import { env } from '../config/env';

// ============================================================
// Auth Controller
// ============================================================

export const registerValidation = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Invalid email address'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and number'),
];

export const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Invalid email address'),
  body('password').notEmpty().withMessage('Password is required'),
];

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await authService.registerUser(req.body);
    sendCreated(res, result, 'Account created successfully');
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await authService.loginUser(req.body);
    sendSuccess(res, result, 'Login successful');
  } catch (error) {
    next(error);
  }
}

// POST /api/auth/demo-login
export async function demoLogin(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await authService.demoLogin();
    sendSuccess(res, result, 'Demo login successful');
  } catch (error) {
    next(error);
  }
}

// POST /api/auth/forgot-password
export async function forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email } = req.body;
    if (!email) {
      sendError(res, 'Email is required', 400);
      return;
    }
    await authService.forgotPassword(email);
    // Always return success (prevents email enumeration)
    sendSuccess(res, {}, 'If that email exists, a reset link has been sent.');
  } catch (error) {
    next(error);
  }
}

export function googleAuth(_req: Request, res: Response): void {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    sendError(res, 'Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.', 503);
    return;
  }
}

export async function googleCallback(req: Request, res: Response): Promise<void> {
  try {
    const user = req.user as IUser;
    const result = await generateTokensForUser(user);
    const redirectUrl = `${env.FRONTEND_URL}/auth/callback?token=${result.accessToken}&refresh=${result.refreshToken}`;
    res.redirect(redirectUrl);
  } catch (_error) {
    const errorUrl = `${env.FRONTEND_URL}/login?error=oauth_failed`;
    res.redirect(errorUrl);
  }
}

export function getMe(req: Request, res: Response): void {
  sendSuccess(res, { user: req.user }, 'User profile retrieved');
}

export async function updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, avatar, bio } = req.body;
    const user = req.user!;

    if (name) user.name = name;
    if (avatar) user.avatar = avatar;
    if (bio !== undefined) (user as IUser & { bio?: string }).bio = bio;
    await user.save();

    sendSuccess(res, { user }, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
}
