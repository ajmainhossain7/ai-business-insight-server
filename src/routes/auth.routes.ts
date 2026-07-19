import { Router } from 'express';
import passport from 'passport';
import {
  register,
  login,
  demoLogin,
  forgotPassword,
  googleCallback,
  getMe,
  updateProfile,
  registerValidation,
  loginValidation,
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

const router = Router();

// POST /api/auth/register
router.post('/register', registerValidation, validate, register);

// POST /api/auth/login
router.post('/login', loginValidation, validate, login);

// POST /api/auth/demo-login
router.post('/demo-login', demoLogin);

// POST /api/auth/forgot-password
router.post('/forgot-password', forgotPassword);

// GET /api/auth/google — start OAuth flow
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// GET /api/auth/google/callback — OAuth redirect
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login?error=oauth_failed' }),
  googleCallback
);

// GET /api/auth/me — authenticated profile
router.get('/me', authenticate, getMe);

// PATCH /api/auth/profile — update profile
router.patch('/profile', authenticate, updateProfile);

export default router;
