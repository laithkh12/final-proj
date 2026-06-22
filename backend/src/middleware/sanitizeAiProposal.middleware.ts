import { NextFunction, Request, Response } from 'express';
import type { AiProposal } from '../types/ai';
import { sanitizeAiProposal } from '../utils/sanitizeAiProposal';

export function sanitizeAiProposalBody(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const proposal = req.body?.proposal;
  if (proposal && typeof proposal === 'object') {
    sanitizeAiProposal(proposal as AiProposal);
  }
  next();
}
