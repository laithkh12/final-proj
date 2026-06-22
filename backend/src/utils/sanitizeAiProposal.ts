import { TASK_PRIORITIES, TASK_STATUSES } from '../constants';
import type { AiProposal, AiProposalTask, AiProposalTaskUpdate } from '../types/ai';

const MONGO_ID = /^[a-f\d]{24}$/i;

function normalizePriority(value: string): (typeof TASK_PRIORITIES)[number] | undefined {
  return TASK_PRIORITIES.find((p) => p.toLowerCase() === value.toLowerCase());
}

function normalizeStatus(value: string): (typeof TASK_STATUSES)[number] | undefined {
  return TASK_STATUSES.find((s) => s.toLowerCase() === value.toLowerCase());
}

function sanitizeTaskFields(task: AiProposalTask): void {
  if (task.priority) {
    const normalized = normalizePriority(String(task.priority));
    if (normalized) task.priority = normalized;
    else delete task.priority;
  }
  if (task.status) {
    const normalized = normalizeStatus(String(task.status));
    if (normalized) task.status = normalized;
    else delete task.status;
  }
  if (task.assigneeId && !MONGO_ID.test(task.assigneeId)) {
    delete task.assigneeId;
  }
}

function sanitizeTaskUpdate(item: AiProposalTaskUpdate): void {
  sanitizeTaskFields(item);
}

/** Normalize AI proposal fields before express-validator and apply logic. */
export function sanitizeAiProposal(proposal: AiProposal): void {
  if (proposal.task) sanitizeTaskFields(proposal.task);
  proposal.tasks?.forEach(sanitizeTaskFields);
  proposal.taskUpdates?.forEach(sanitizeTaskUpdate);
}
