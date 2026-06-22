'use client';

import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Bot, CheckCircle2, Loader2, Send, Sparkles, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/utils/cn';
import { getAiAssistantCopy } from './aiAssistantConfig';
import { aiService } from '@/services/ai.service';
import { getErrorMessage } from '@/services/api';
import type { AiChatMessage, AiPageContextPayload, AiProposal } from '@/types';
import { invalidateAfterProjectCreate, invalidateAfterTaskChange, invalidateAfterWorkspaceCreate } from '@/lib/queryInvalidation';

interface AiAssistantBladeProps {
  open: boolean;
  onClose: () => void;
  context: AiPageContextPayload;
  workspaceName?: string;
  projectName?: string;
}

const EXIT_MS = 280;

function renderInlineBold(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, index) =>
    index % 2 === 1 ? (
      <strong key={index} className="font-semibold text-indigo-700 dark:text-indigo-300">
        {part}
      </strong>
    ) : (
      <span key={index}>{part}</span>
    )
  );
}

function ProposalSummary({ proposal }: { proposal: AiProposal }) {
  if (proposal.action === 'create_plan') {
    const tasks = proposal.tasks?.length
      ? proposal.tasks
      : proposal.task
        ? [proposal.task]
        : [];

    return (
      <div className="space-y-3 text-sm text-slate-700 dark:text-slate-200">
        {proposal.workspace && (
          <div>
            <p className="font-medium text-green-800 dark:text-green-200">Workspace</p>
            <p>{proposal.workspace.name}</p>
            {proposal.workspace.description && (
              <p className="text-slate-500">{proposal.workspace.description}</p>
            )}
          </div>
        )}
        {proposal.project && (
          <div>
            <p className="font-medium text-green-800 dark:text-green-200">Project</p>
            <p>{proposal.project.name}</p>
            {proposal.project.description && (
              <p className="text-slate-500">{proposal.project.description}</p>
            )}
          </div>
        )}
        {tasks.length > 0 && (
          <div>
            <p className="font-medium text-green-800 dark:text-green-200">
              Tasks ({tasks.length})
            </p>
            <ul className="mt-1 list-inside list-disc space-y-1">
              {tasks.map((t, i) => (
                <li key={i}>
                  {t.title}
                  {t.assigneeName ? ` — ${t.assigneeName}` : ''}
                  {t.priority ? ` (${t.priority})` : ''}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  if (proposal.action === 'create_workspace' && proposal.workspace) {
    return (
      <div className="space-y-1 text-sm text-slate-700 dark:text-slate-200">
        <p>
          <span className="font-medium">Workspace:</span> {proposal.workspace.name}
        </p>
        {proposal.workspace.description && (
          <p className="text-slate-500">{proposal.workspace.description}</p>
        )}
      </div>
    );
  }

  if (proposal.action === 'create_project' && proposal.project) {
    return (
      <div className="space-y-1 text-sm text-slate-700 dark:text-slate-200">
        <p>
          <span className="font-medium">Project:</span> {proposal.project.name}
        </p>
        {proposal.project.description && (
          <p className="text-slate-500">{proposal.project.description}</p>
        )}
      </div>
    );
  }

  if (proposal.action === 'update_tasks' && proposal.taskUpdates?.length) {
    return (
      <div className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
        <p className="font-medium text-green-800 dark:text-green-200">
          Update tasks ({proposal.taskUpdates.length})
        </p>
        <ul className="mt-1 list-inside list-disc space-y-2">
          {proposal.taskUpdates.map((u, i) => (
            <li key={i}>
              <span className="font-medium">{u.taskTitle}</span>
              {u.clearAssignee ? ' → (unassign)' : u.assigneeName ? ` → ${u.assigneeName}` : ''}
              {u.status ? `, ${u.status}` : ''}
              {u.priority ? `, ${u.priority} priority` : ''}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (proposal.action === 'update_task' && proposal.task) {
    const t = proposal.task;
    return (
      <div className="space-y-1 text-sm text-slate-700 dark:text-slate-200">
        <p className="font-medium text-green-800 dark:text-green-200">Update task</p>
        {proposal.taskTitle && (
          <p>
            <span className="font-medium">Task:</span> {proposal.taskTitle}
          </p>
        )}
        {t.title && (
          <p>
            <span className="font-medium">Title:</span> {t.title}
          </p>
        )}
        {t.description !== undefined && (
          <p>
            <span className="font-medium">Description:</span> {t.description || '(cleared)'}
          </p>
        )}
        {t.status && (
          <p>
            <span className="font-medium">Status:</span> {t.status}
          </p>
        )}
        {t.priority && (
          <p>
            <span className="font-medium">Priority:</span> {t.priority}
          </p>
        )}
        {t.assigneeName && (
          <p>
            <span className="font-medium">Assignee:</span> {t.assigneeName}
          </p>
        )}
        {t.clearAssignee && (
          <p>
            <span className="font-medium">Assignee:</span> (remove)
          </p>
        )}
      </div>
    );
  }

  if (proposal.action === 'create_task' && proposal.task) {
    return (
      <div className="space-y-1 text-sm text-slate-700 dark:text-slate-200">
        <p>
          <span className="font-medium">Task:</span> {proposal.task.title}
        </p>
        {proposal.task.description && (
          <p className="text-slate-500">{proposal.task.description}</p>
        )}
        {proposal.task.priority && (
          <p>
            <span className="font-medium">Priority:</span> {proposal.task.priority}
          </p>
        )}
        {proposal.task.assigneeName && (
          <p>
            <span className="font-medium">Assignee:</span> {proposal.task.assigneeName}
          </p>
        )}
      </div>
    );
  }

  return null;
}

export function AiAssistantBlade({
  open,
  onClose,
  context,
  workspaceName,
  projectName,
}: AiAssistantBladeProps) {
  const router = useRouter();
  const qc = useQueryClient();
  const [mounted, setMounted] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [proposal, setProposal] = useState<AiProposal | null>(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const copy = getAiAssistantCopy(context, { workspaceName, projectName });

  useEffect(() => {
    if (open) {
      setMounted(true);
      setIsClosing(false);
      document.body.style.overflow = 'hidden';
      return;
    }

    if (mounted) {
      setIsClosing(true);
      const timer = window.setTimeout(() => {
        setMounted(false);
        setIsClosing(false);
      }, EXIT_MS);
      document.body.style.overflow = '';
      return () => window.clearTimeout(timer);
    }

    document.body.style.overflow = '';
  }, [open, mounted]);

  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    if (!mounted || isClosing) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mounted, isClosing, onClose]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, proposal, loading]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const nextMessages: AiChatMessage[] = [...messages, { role: 'user', content: text }];
    setMessages(nextMessages);
    setInput('');
    setProposal(null);
    setLoading(true);

    try {
      const res = await aiService.chat({ messages: nextMessages, context });
      const result = res.data.data!;
      setMessages((prev) => [...prev, { role: 'assistant', content: result.message }]);
      if (result.status === 'ready' && result.proposal) {
        setProposal(result.proposal);
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!proposal || applying) return;
    setApplying(true);
    try {
      const res = await aiService.apply(proposal);
      const created = res.data.data!;
      toast.success(res.data.message || 'Created successfully');

      if (created.type === 'plan') {
        await invalidateAfterWorkspaceCreate(qc);
        if (created.projectId) {
          await invalidateAfterProjectCreate(qc, created.workspaceId);
        }
        if (created.taskIds.length > 0 && created.projectId) {
          await invalidateAfterTaskChange(qc, {
            projectId: created.projectId,
            workspaceId: created.workspaceId,
          });
        }
        const lastTaskId = created.taskIds[created.taskIds.length - 1];
        if (lastTaskId) {
          router.push(`/tasks/${lastTaskId}`);
        } else if (created.projectId) {
          router.push(`/projects/${created.projectId}`);
        } else {
          router.push(`/workspaces/${created.workspaceId}`);
        }
      } else if (created.type === 'workspace') {
        await invalidateAfterWorkspaceCreate(qc);
        router.push(`/workspaces/${created.entity._id}`);
      } else if (created.type === 'project' && created.workspaceId) {
        await invalidateAfterProjectCreate(qc, created.workspaceId);
        router.push(`/projects/${created.entity._id}`);
      } else if (created.type === 'tasks_updated') {
        await invalidateAfterTaskChange(qc, {
          projectId: created.projectId,
          workspaceId: created.workspaceId,
        });
        router.refresh();
      } else if (created.type === 'task_updated') {
        await invalidateAfterTaskChange(qc, {
          projectId: created.projectId,
          workspaceId: created.workspaceId,
          taskId: created.entity._id,
        });
        router.refresh();
      } else if (created.type === 'task' && created.projectId && created.workspaceId) {
        await invalidateAfterTaskChange(qc, {
          projectId: created.projectId,
          workspaceId: created.workspaceId,
        });
        router.push(`/tasks/${created.entity._id}`);
      }

      setMessages([]);
      setProposal(null);
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setApplying(false);
    }
  };

  if (!mounted) return null;

  const showContent = open && !isClosing;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close AI assistant"
        className={cn(
          'absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]',
          isClosing ? 'ai-blade-backdrop-exit' : 'ai-blade-backdrop-enter'
        )}
        onClick={onClose}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-assistant-title"
        className={cn(
          'relative flex h-full w-full max-w-md flex-col border-l border-indigo-100 bg-white shadow-2xl dark:border-indigo-900/40 dark:bg-slate-950',
          isClosing ? 'ai-blade-panel-exit' : 'ai-blade-panel-enter'
        )}
      >
        <header className="border-b border-slate-200 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 px-5 py-4 text-white dark:border-slate-800">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm',
                  showContent && 'ai-blade-bot-pop'
                )}
              >
                <Sparkles className={cn('h-5 w-5', showContent && 'ai-blade-sparkle')} />
              </div>
              <div>
                <h2 id="ai-assistant-title" className="text-lg font-semibold">
                  {copy.title}
                </h2>
                <p className="text-sm text-indigo-100">{copy.subtitle}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-white/90 transition hover:bg-white/15 active:scale-95"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div
          ref={scrollRef}
          className="flex flex-1 flex-col overflow-y-auto bg-gradient-to-b from-slate-50 to-white px-4 py-5 dark:from-slate-900 dark:to-slate-950"
        >
          {messages.length === 0 ? (
            <div className="flex gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md">
                <Bot className="h-4 w-4" />
              </div>
              <div className="max-w-[85%] space-y-3">
                <div className="rounded-2xl rounded-tl-md border border-indigo-100 bg-white px-4 py-3 text-sm leading-relaxed text-slate-700 shadow-sm dark:border-indigo-900/30 dark:bg-slate-900 dark:text-slate-200">
                  {renderInlineBold(copy.greeting)}
                </div>
                <div className="rounded-2xl rounded-tl-md border border-violet-100 bg-violet-50/80 px-4 py-3 text-sm leading-relaxed text-violet-900 dark:border-violet-900/30 dark:bg-violet-950/40 dark:text-violet-100">
                  {copy.hint}
                </div>
                <ul className="space-y-1.5 rounded-xl border border-indigo-100 bg-indigo-50/50 px-3 py-2.5 dark:border-indigo-900/30 dark:bg-indigo-950/30">
                  {copy.capabilities.map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-2 text-xs font-medium text-indigo-800 dark:text-indigo-200"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-indigo-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn('flex gap-3', msg.role === 'user' && 'flex-row-reverse')}
                >
                  <div
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white shadow-sm',
                      msg.role === 'user'
                        ? 'bg-slate-600'
                        : 'bg-gradient-to-br from-indigo-500 to-violet-600'
                    )}
                  >
                    {msg.role === 'user' ? (
                      <span className="text-xs font-semibold">You</span>
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </div>
                  <div
                    className={cn(
                      'max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm',
                      msg.role === 'user'
                        ? 'rounded-tr-md bg-indigo-600 text-white'
                        : 'rounded-tl-md border border-indigo-100 bg-white text-slate-700 dark:border-indigo-900/30 dark:bg-slate-900 dark:text-slate-200'
                    )}
                  >
                    {msg.role === 'assistant' ? (
                      <span className="whitespace-pre-wrap">{renderInlineBold(msg.content)}</span>
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Thinking…
                </div>
              )}
            </div>
          )}

          {proposal && (
            <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-900/40 dark:bg-green-950/30">
              <p className="mb-2 text-sm font-semibold text-green-800 dark:text-green-200">
                {proposal.action === 'update_task' || proposal.action === 'update_tasks'
                  ? 'Ready to save'
                  : 'Ready to create'}
              </p>
              <ProposalSummary proposal={proposal} />
              <button
                type="button"
                onClick={handleApply}
                disabled={applying}
                className="mt-3 w-full rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700 disabled:opacity-60"
              >
                {applying
                  ? proposal.action === 'update_task' || proposal.action === 'update_tasks'
                    ? 'Saving…'
                    : 'Creating…'
                  : proposal.action === 'update_task' || proposal.action === 'update_tasks'
                    ? 'Confirm & save'
                    : 'Confirm & create'}
              </button>
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-end gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-900">
            <textarea
              rows={3}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void handleSend();
                }
              }}
              placeholder={copy.placeholder}
              disabled={loading}
              className="min-h-[72px] flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none disabled:cursor-not-allowed dark:text-slate-200 dark:placeholder:text-slate-500"
            />
            <button
              type="button"
              onClick={() => void handleSend()}
              disabled={loading || !input.trim()}
              aria-label="Send message"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white transition hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
