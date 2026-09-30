import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middleware/authenticate.js';
import { validateRequest } from '../../middleware/validate-request.js';
import {
  chatWithAI,
  getConversations,
  getConversationById,
  deleteConversation,
  confirmAIAction,
  getAIMemories,
  deleteAIMemory,
  submitAIFeedback,
} from './ai.controller.js';

const router = Router();

const chatSchema = z.object({
  body: z.object({
    message: z.string().min(1, 'Pesan tidak boleh kosong'),
    conversationId: z.string().optional().nullable(),
  }),
});

const confirmActionSchema = z.object({
  body: z.object({
    actionType: z.string().min(1),
    payload: z.any(),
  }),
});

router.use(authenticate);

router.post('/chat', validateRequest(chatSchema), chatWithAI);
router.get('/conversations', getConversations);
router.get('/conversations/:id', getConversationById);
router.delete('/conversations/:id', deleteConversation);
router.post('/actions/confirm', validateRequest(confirmActionSchema), confirmAIAction);
router.get('/memories', getAIMemories);
router.delete('/memories/:id', deleteAIMemory);
router.post('/feedback', submitAIFeedback);

export default router;
