import { Router } from 'express';
import {
  generateReport,
  getReports,
  getReport,
  deleteReport,
  getPublicReports,
  getDashboardStats,
} from '../controllers/report.controller';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware';

const router = Router();

// ─── Public routes (no auth required) ────────────────────────────
// GET /api/reports/public
router.get('/public', getPublicReports);

// ─── Protected routes that must come before /:id ─────────────────
// GET /api/reports/stats  — must be registered BEFORE /:id
router.get('/stats', authenticate, getDashboardStats);

// GET /api/reports/generate  — trigger AI analysis (POST, safe anyway)
router.post('/generate', authenticate, generateReport);

// GET /api/reports — current user's reports
router.get('/', authenticate, getReports);

// DELETE /api/reports/:id
router.delete('/:id', authenticate, deleteReport);

// ─── Dynamic route LAST so "stats" and "public" win first ────────
// GET /api/reports/:id — optional auth (owner or public)
router.get('/:id', optionalAuthenticate, getReport);

export default router;
