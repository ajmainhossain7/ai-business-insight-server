import { Router } from 'express';
import authRoutes from './auth.routes';
import datasetRoutes from './dataset.routes';
import reportRoutes from './report.routes';
import chatRoutes from './chat.routes';
import dashboardRoutes from './dashboard.routes';

const router = Router();

// Health check
router.get('/health', (_req, res) => {
  res.json({ success: true, message: 'AI Business Insight API is running', timestamp: new Date() });
});

// Route groups
router.use('/auth', authRoutes);
router.use('/datasets', datasetRoutes);
router.use('/reports', reportRoutes);
router.use('/chat', chatRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
