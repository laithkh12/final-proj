'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { cn } from '@/utils/cn';
import { AiAssistantBlade } from './AiAssistantBlade';

interface AiAssistantPanelProps {
  className?: string;
  label?: string;
}

export function AiAssistantPanel({ className, label = 'AI Assist' }: AiAssistantPanelProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-lg border border-indigo-200 bg-gradient-to-r from-indigo-50 to-violet-50 px-4 py-2 text-sm font-medium text-indigo-700 shadow-sm transition hover:from-indigo-100 hover:to-violet-100 hover:shadow dark:border-indigo-800 dark:from-indigo-950/50 dark:to-violet-950/50 dark:text-indigo-300 dark:hover:from-indigo-950 dark:hover:to-violet-950',
          className
        )}
      >
        <Sparkles className="h-4 w-4" />
        {label}
      </button>

      <AiAssistantBlade open={open} onClose={() => setOpen(false)} />
    </>
  );
}
