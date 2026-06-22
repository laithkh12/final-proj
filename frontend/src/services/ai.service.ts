import { api } from './api';
import type {
  AiApplyResult,
  AiChatMessage,
  AiChatResult,
  AiPageContextPayload,
  AiProposal,
  ApiResponse,
} from '@/types';

export const aiService = {
  chat: (data: { messages: AiChatMessage[]; context: AiPageContextPayload }) =>
    api.post<ApiResponse<AiChatResult>>('/ai/chat', data),

  apply: (proposal: AiProposal) =>
    api.post<ApiResponse<AiApplyResult>>('/ai/apply', { proposal }),
};
