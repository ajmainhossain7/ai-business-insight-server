import { Router } from 'express';
import { getDashboardStats } from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// GET /api/dashboard/stats
router.get('/stats', getDashboardStats);

export default router;
