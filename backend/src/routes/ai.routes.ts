import { Router } from 'express';
import * as aiController from '../controllers/ai.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authenticatedRateLimiter } from '../middleware/rateLimit.middleware';
import { sanitizeAiProposalBody } from '../middleware/sanitizeAiProposal.middleware';
import { validate } from '../middleware/validate.middleware';
import { aiApplyValidator, aiChatValidator } from '../validators/ai.validator';

const router = Router();

router.use(authenticate);
router.use(authenticatedRateLimiter);

/**
 * @openapi
 * /api/ai/chat:
 *   post:
 *     tags: [AI]
 *     summary: Chat with TeamFlow AI planner
 */
router.post('/chat', validate(aiChatValidator), aiController.postChat);

/**
 * @openapi
 * /api/ai/apply:
 *   post:
 *     tags: [AI]
 *     summary: Create workspace, project, or task from AI proposal
 */
router.post('/apply', sanitizeAiProposalBody, validate(aiApplyValidator), aiController.postApply);

export default router;
