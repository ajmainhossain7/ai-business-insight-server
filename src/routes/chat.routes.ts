import { Router } from 'express';
import { sendMessage, getChatHistory, clearChatHistory, getSuggestedPrompts } from '../controllers/chat.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// GET /api/chat/:reportId/suggested-prompts
router.get('/:reportId/suggested-prompts', getSuggestedPrompts);

// GET /api/chat/:reportId/history
router.get('/:reportId/history', getChatHistory);

// POST /api/chat/:reportId — send message
router.post('/:reportId', sendMessage);

// DELETE /api/chat/:reportId — clear history
router.delete('/:reportId', clearChatHistory);

export default router;
