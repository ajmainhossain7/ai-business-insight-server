import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import passport from 'passport';
import path from 'path';

import { env } from './config/env';
import { configurePassport } from './config/passport';
import routes from './routes';
import { globalErrorHandler, notFoundHandler } from './middleware/error.middleware';
import { logger } from './utils/logger.utils';

// ============================================================
// Express Application Setup
// ============================================================

const app: Application = express();

// ── Security ─────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// ── CORS ──────────────────────────────────────────────────────
app.use(cors({
  origin: [env.FRONTEND_URL, 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// ── Rate Limiting ─────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Stricter rate limit for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { success: false, message: 'Too many auth attempts, please try again later.' },
});
app.use('/api/auth', authLimiter);

// ── Body Parsing ──────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Compression ───────────────────────────────────────────────
app.use(compression());

// ── Logging ───────────────────────────────────────────────────
if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));
}

// ── Passport ──────────────────────────────────────────────────
configurePassport();
app.use(passport.initialize());

// ── Static Files (uploads preview) ───────────────────────────
app.use('/uploads', express.static(path.join(process.cwd(), env.UPLOAD_DIR)));

// ── API Routes ────────────────────────────────────────────────
app.use('/api', routes);

// ── 404 Handler ───────────────────────────────────────────────
app.use(notFoundHandler);

// ── Global Error Handler ──────────────────────────────────────
app.use(globalErrorHandler);

export default app;
