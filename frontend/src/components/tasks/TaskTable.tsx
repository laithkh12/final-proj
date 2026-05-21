'use client';

import { memo, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import type { Task, TaskPriority, TaskStatus } from '@/types';
import { cn } from '@/utils/cn';

const priorityClass: Record<TaskPriority, string> = {
  Low: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
  Medium: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-200',
  High: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-200',
  Urgent: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-200',
};

const statusClass: Record<TaskStatus, string> = {
  Todo: 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600',
  'In Progress':
    'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800',
  Review:
    'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800',
  Done: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-200 dark:border-green-800',
};

const optionClass = 'bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100';

interface TaskTableProps {
  tasks: Task[];
  onStatusChange?: (id: string, status: TaskStatus) => void;
}

function TaskTableComponent({ tasks, onStatusChange }: TaskTableProps) {
  const handleChange = useCallback(
    (id: string, status: TaskStatus) => onStatusChange?.(id, status),
    [onStatusChange]
  );

  const rows = useMemo(() => tasks, [tasks]);

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="bg-slate-50 dark:bg-slate-900">
          <tr>
            <th className="px-4 py-3 font-medium">Title</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Priority</th>
            <th className="px-4 py-3 font-medium">Assignee</th>
            <th className="px-4 py-3 font-medium">Due</th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-slate-950">
          {rows.map((task) => (
            <tr key={task._id} className="border-t border-slate-100 dark:border-slate-800">
              <td className="px-4 py-3">
                <Link href={`/tasks/${task._id}`} className="font-medium text-indigo-600 hover:underline">
                  {task.title}
                </Link>
              </td>
              <td className="px-4 py-3">
                {onStatusChange ? (
                  <select
                    value={task.status}
                    onChange={(e) => handleChange(task._id, e.target.value as TaskStatus)}
                    className={cn(
                      'cursor-pointer rounded border px-2 py-1 text-xs',
                      statusClass[task.status]
                    )}
                  >
                    {(['Todo', 'In Progress', 'Review', 'Done'] as TaskStatus[]).map((s) => (
                      <option key={s} value={s} className={optionClass}>
                        {s}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className={cn('rounded px-2 py-1 text-xs', statusClass[task.status])}>{task.status}</span>
                )}
              </td>
              <td className="px-4 py-3">
                <span className={cn('rounded px-2 py-1 text-xs', priorityClass[task.priority])}>
                  {task.priority}
                </span>
              </td>
              <td className="px-4 py-3 text-slate-500">
                {typeof task.assignee === 'object' && task.assignee ? task.assignee.name : '—'}
              </td>
              <td className="px-4 py-3 text-slate-500">
                {task.dueDate ? format(new Date(task.dueDate), 'MMM d, yyyy') : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const TaskTable = memo(TaskTableComponent);
