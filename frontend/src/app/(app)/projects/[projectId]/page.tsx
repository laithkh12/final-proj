'use client';

import dynamic from 'next/dynamic';
import { use, useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { projectService } from '@/services/project.service';
import { taskService } from '@/services/task.service';
import { getErrorMessage } from '@/services/api';
import { useDebounce } from '@/hooks/useDebounce';
import type { TaskPriority, TaskStatus } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { CheckSquare } from 'lucide-react';
import { selectClass, selectOptionClass } from '@/utils/cn';
import { invalidateAfterTaskChange, invalidateAfterProjectCreate, queryKeys } from '@/lib/queryInvalidation';

const TaskTable = dynamic(
  () => import('@/components/tasks/TaskTable').then((m) => m.TaskTable),
  { loading: () => <CardSkeleton />, ssr: false }
);

const STATUSES: TaskStatus[] = ['Todo', 'In Progress', 'Review', 'Done'];
const PRIORITIES: TaskPriority[] = ['Low', 'Medium', 'High', 'Urgent'];

export default function ProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const router = useRouter();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | ''>('');
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editColor, setEditColor] = useState('#6366f1');
  const debouncedSearch = useDebounce(search);

  const queryParams = useMemo(
    () => ({
      page,
      limit: 10,
      ...(debouncedSearch && { search: debouncedSearch }),
      ...(statusFilter && { status: statusFilter }),
      ...(priorityFilter && { priority: priorityFilter }),
    }),
    [page, debouncedSearch, statusFilter, priorityFilter]
  );

  const { data: projectData } = useQuery({
    queryKey: queryKeys.projectDetail(projectId),
    queryFn: async () => {
      const res = await projectService.get(projectId);
      return res.data.data!;
    },
  });

  const { data: tasksData, isLoading } = useQuery({
    queryKey: ['tasks', projectId, queryParams],
    queryFn: async () => {
      const res = await taskService.list(projectId, queryParams);
      return { tasks: res.data.data!, meta: res.data.meta };
    },
  });

  const workspaceId = projectData?.project?.workspace;
  const isAdmin = projectData?.myRole === 'owner' || projectData?.myRole === 'admin';

  const createTask = useMutation({
    mutationFn: () => taskService.create(projectId, { title, description, priority }),
    onSuccess: () => {
      if (workspaceId) {
        void invalidateAfterTaskChange(qc, { projectId, workspaceId });
      } else {
        qc.invalidateQueries({ queryKey: ['tasks', projectId] });
        qc.invalidateQueries({ queryKey: ['dashboard'] });
      }
      toast.success('Task created');
      setOpen(false);
      setTitle('');
      setDescription('');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) =>
      taskService.update(id, { status }),
    onSuccess: (_data, { id }) => {
      if (workspaceId) {
        void invalidateAfterTaskChange(qc, { projectId, workspaceId, taskId: id });
      } else {
        qc.invalidateQueries({ queryKey: ['tasks', projectId] });
      }
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const updateProject = useMutation({
    mutationFn: () =>
      projectService.update(projectId, {
        name: editName,
        description: editDescription,
        color: editColor,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.project(projectId) });
      if (workspaceId) {
        qc.invalidateQueries({ queryKey: queryKeys.projects(workspaceId) });
      }
      toast.success('Project updated');
      setEditOpen(false);
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const deleteProject = useMutation({
    mutationFn: () => projectService.remove(projectId),
    onSuccess: () => {
      if (workspaceId) {
        void invalidateAfterProjectCreate(qc, workspaceId);
      }
      toast.success('Project deleted');
      router.push(workspaceId ? `/workspaces/${workspaceId}` : '/workspaces');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const handleStatusChange = useCallback(
    (id: string, status: TaskStatus) => updateStatus.mutate({ id, status }),
    [updateStatus]
  );

  const project = projectData?.project;
  const meta = tasksData?.meta;

  const openEditModal = () => {
    if (!project) return;
    setEditName(project.name);
    setEditDescription(project.description || '');
    setEditColor(project.color || '#6366f1');
    setEditOpen(true);
  };

  return (
    <div>
      <div className="mb-2 text-sm text-slate-500">
        <Link href={`/workspaces/${project?.workspace}`} className="hover:text-indigo-600">
          ← Back to workspace
        </Link>
      </div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: project?.color }}>
            {project?.name}
          </h1>
          <p className="text-slate-500">{project?.description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isAdmin && (
            <Button variant="secondary" onClick={openEditModal}>
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </Button>
          )}
          {isAdmin && (
            <Button variant="danger" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </Button>
          )}
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> New task
          </Button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search tasks..."
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as TaskStatus | '');
            setPage(1);
          }}
          className={selectClass}
        >
          <option value="" className={selectOptionClass}>
            All statuses
          </option>
          {STATUSES.map((s) => (
            <option key={s} value={s} className={selectOptionClass}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => {
            setPriorityFilter(e.target.value as TaskPriority | '');
            setPage(1);
          }}
          className={selectClass}
        >
          <option value="" className={selectOptionClass}>
            All priorities
          </option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p} className={selectOptionClass}>
              {p}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <CardSkeleton />
      ) : tasksData?.tasks?.length ? (
        <>
          <TaskTable tasks={tasksData.tasks} onStatusChange={handleStatusChange} />
          {meta && meta.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <span className="text-sm text-slate-500">
                Page {meta.page} of {meta.totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      ) : (
        <EmptyState
          icon={CheckSquare}
          title="No tasks"
          description="Create your first task for this project."
          action={<Button onClick={() => setOpen(true)}>Create task</Button>}
        />
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="New task">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createTask.mutate();
          }}
          className="space-y-4"
        >
          <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <div>
            <label className="mb-1 block text-sm font-medium">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Optional details..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className={selectClass}
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" loading={createTask.isPending} className="w-full">
            Create
          </Button>
        </form>
      </Modal>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit project">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateProject.mutate();
          }}
          className="space-y-4"
        >
          <Input label="Name" value={editName} onChange={(e) => setEditName(e.target.value)} required />
          <Input
            label="Description"
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
          />
          <div>
            <label className="mb-1 block text-sm font-medium">Color</label>
            <input
              type="color"
              value={editColor}
              onChange={(e) => setEditColor(e.target.value)}
              className="h-10 w-full cursor-pointer rounded-lg border border-slate-300 dark:border-slate-600"
            />
          </div>
          <Button type="submit" loading={updateProject.isPending} className="w-full">
            Save changes
          </Button>
        </form>
      </Modal>

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete project">
        <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
          Are you sure you want to delete <strong>{project?.name}</strong>? All tasks in this project will be
          permanently removed.
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setDeleteOpen(false)} className="flex-1">
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={deleteProject.isPending}
            onClick={() => deleteProject.mutate()}
            className="flex-1"
          >
            Delete project
          </Button>
        </div>
      </Modal>
    </div>
  );
}
