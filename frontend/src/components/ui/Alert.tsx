import { AlertCircle, CheckCircle, Info } from 'lucide-react';
import { cn } from '@/utils/cn';

export function Alert({
  type = 'error',
  message,
  className,
}: {
  type?: 'error' | 'success' | 'info';
  message: string;
  className?: string;
}) {
  const styles = {
    error: 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/50 dark:text-red-200 dark:border-red-900',
    success: 'bg-green-50 text-green-800 border-green-200 dark:bg-green-950/50 dark:text-green-200',
    info: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/50 dark:text-blue-200',
  };
  const Icon = type === 'success' ? CheckCircle : type === 'info' ? Info : AlertCircle;

  return (
    <div className={cn('flex items-center gap-2 rounded-lg border px-4 py-3 text-sm', styles[type], className)}>
      <Icon className="h-4 w-4 shrink-0" />
      {message}
    </div>
  );
}
