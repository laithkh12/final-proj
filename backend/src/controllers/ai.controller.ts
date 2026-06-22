import { Request, Response } from 'express';
import { applyAiProposal } from '../services/aiApply.service';
import { chatWithAi } from '../services/ai.service';
import type { AiChatMessage, AiPageContextPayload, AiProposal } from '../types/ai';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';

export const postChat = asyncHandler(async (req: Request, res: Response) => {
  const { messages, context } = req.body as {
    messages: AiChatMessage[];
    context: AiPageContextPayload;
  };

  const result = await chatWithAi(req.user!.userId, messages, context);
  sendSuccess(res, result, 200, 'AI response generated');
});

export const postApply = asyncHandler(async (req: Request, res: Response) => {
  const { proposal } = req.body as { proposal: AiProposal };
  const created = await applyAiProposal(req.user!.userId, proposal);
  sendSuccess(res, created, 201, 'Created successfully');
});
