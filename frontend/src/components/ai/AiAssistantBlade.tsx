'use client';

import { useEffect, useState } from 'react';
import { Bot, CheckCircle2, Send, Sparkles, X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { getAiAssistantCopy } from './aiAssistantConfig';

interface AiAssistantBladeProps {
  open: boolean;
  onClose: () => void;
}

const EXIT_MS = 280;

function renderGreeting(text: string) {
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

export function AiAssistantBlade({ open, onClose }: AiAssistantBladeProps) {
  const [mounted, setMounted] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const copy = getAiAssistantCopy();

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

        <div className="flex flex-1 flex-col overflow-hidden bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5">
            <div className="flex gap-3">
              <div
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md',
                  showContent && 'ai-blade-bot-pop'
                )}
              >
                <Bot className="h-4 w-4" />
              </div>
              <div className="max-w-[85%] space-y-3">
                <div
                  className={cn(
                    'rounded-2xl rounded-tl-md border border-indigo-100 bg-white px-4 py-3 text-sm leading-relaxed text-slate-700 shadow-sm dark:border-indigo-900/30 dark:bg-slate-900 dark:text-slate-200',
                    showContent && 'ai-blade-bubble'
                  )}
                  style={showContent ? { animationDelay: '0.18s' } : undefined}
                >
                  {renderGreeting(copy.greeting)}
                </div>
                <div
                  className={cn(
                    'rounded-2xl rounded-tl-md border border-violet-100 bg-violet-50/80 px-4 py-3 text-sm leading-relaxed text-violet-900 dark:border-violet-900/30 dark:bg-violet-950/40 dark:text-violet-100',
                    showContent && 'ai-blade-bubble'
                  )}
                  style={showContent ? { animationDelay: '0.3s' } : undefined}
                >
                  {copy.hint}
                </div>
                <ul
                  className={cn(
                    'space-y-1.5 rounded-xl border border-indigo-100 bg-indigo-50/50 px-3 py-2.5 dark:border-indigo-900/30 dark:bg-indigo-950/30',
                    showContent && 'ai-blade-bubble'
                  )}
                  style={showContent ? { animationDelay: '0.42s' } : undefined}
                >
                  {copy.capabilities.map((item, index) => (
                    <li
                      key={item}
                      className="flex items-center gap-2 text-xs font-medium text-indigo-800 dark:text-indigo-200"
                      style={
                        showContent ? { animationDelay: `${0.48 + index * 0.06}s` } : undefined
                      }
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-indigo-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div
            className={cn(
              'border-t border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950',
              showContent && 'ai-blade-footer-in'
            )}
          >
            <div className="flex items-end gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-900">
              <textarea
                rows={3}
                disabled
                placeholder={copy.placeholder}
                className="min-h-[72px] flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none disabled:cursor-not-allowed dark:text-slate-200 dark:placeholder:text-slate-500"
              />
              <button
                type="button"
                disabled
                aria-label="Send message (coming soon)"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-center text-xs text-slate-400">
              AI generation coming soon — describe your plan here first
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
