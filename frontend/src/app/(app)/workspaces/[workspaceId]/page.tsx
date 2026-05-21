'use client';

import { use, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { FolderKanban, Plus, UserPlus } from 'lucide-react';
import { workspaceService } from '@/services/workspace.service';
import { projectService } from '@/services/project.service';
import { getErrorMessage } from '@/services/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { invalidateAfterProjectCreate } from '@/lib/queryInvalidation';

export default function WorkspaceDetailPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = use(params);
  const qc = useQueryClient();
  const [projectOpen, setProjectOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['workspace', workspaceId],
    queryFn: async () => {
      const res = await workspaceService.get(workspaceId);
      return res.data.data!;
    },
  });

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['projects', workspaceId],
    queryFn: async () => {
      const res = await projectService.list(workspaceId);
      return res.data.data!;
    },
  });

  const { data: activity } = useQuery({
    queryKey: ['activity', workspaceId],
    queryFn: async () => {
      const res = await workspaceService.activity(workspaceId, { limit: 10 });
      return res.data.data!;
    },
  });

  const createProject = useMutation({
    mutationFn: () => projectService.create(workspaceId, { name: projectName }),
    onSuccess: () => {
      void invalidateAfterProjectCreate(qc, workspaceId);
      toast.success('Project created');
      setProjectOpen(false);
      setProjectName('');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const inviteMember = useMutation({
    mutationFn: () => workspaceService.invite(workspaceId, { email: inviteEmail }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workspace', workspaceId] });
      toast.success('Member invited');
      setInviteOpen(false);
      setInviteEmail('');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  if (isLoading) return <CardSkeleton />;

  const { workspace, members, stats } = data!;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{workspace.name}</h1>
          <p className="text-slate-500">{workspace.description}</p>
          <p className="mt-2 text-sm text-slate-400">
            {stats.projectCount} projects · {stats.taskCount} tasks · {members.length} members
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setInviteOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" /> Invite
          </Button>
          <Button onClick={() => setProjectOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> New project
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mb-4 font-semibold">Projects</h2>
          {projectsLoading ? (
            <CardSkeleton />
          ) : projects?.length ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {projects.map((p) => (
                <Link
                  key={p._id}
                  href={`/projects/${p._id}`}
                  className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
                  style={{ borderTopColor: p.color, borderTopWidth: 3 }}
                >
                  <FolderKanban className="mb-2 h-5 w-5" style={{ color: p.color }} />
                  <h3 className="font-medium">{p.name}</h3>
                  <p className="text-sm text-slate-500">{p.taskCount ?? 0} tasks</p>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={FolderKanban}
              title="No projects"
              description="Create a project to start adding tasks."
              action={<Button onClick={() => setProjectOpen(true)}>Create project</Button>}
            />
          )}
        </div>

        <div>
          <h2 className="mb-4 font-semibold">Members</h2>
          <ul className="space-y-2 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            {members.map((m) => (
              <li key={m._id} className="flex items-center justify-between text-sm">
                <span>{typeof m.user === 'object' ? m.user.name : 'Member'}</span>
                <span className="rounded bg-slate-100 px-2 py-0.5 text-xs dark:bg-slate-800">{m.role}</span>
              </li>
            ))}
          </ul>

          <h2 className="mb-4 mt-6 font-semibold">Activity</h2>
          <ul className="space-y-2 text-sm">
            {activity?.map((log) => (
              <li key={log._id} className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900">
                <p>{log.message}</p>
                <p className="text-xs text-slate-400">
                  {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <Modal open={projectOpen} onClose={() => setProjectOpen(false)} title="New project">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createProject.mutate();
          }}
          className="space-y-4"
        >
          <Input label="Project name" value={projectName} onChange={(e) => setProjectName(e.target.value)} required />
          <Button type="submit" loading={createProject.isPending} className="w-full">
            Create
          </Button>
        </form>
      </Modal>

      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite member">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            inviteMember.mutate();
          }}
          className="space-y-4"
        >
          <Input
            label="Email"
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            required
          />
          <p className="text-xs text-slate-500">User must already have a TeamFlow account.</p>
          <Button type="submit" loading={inviteMember.isPending} className="w-full">
            Invite
          </Button>
        </form>
      </Modal>
    </div>
  );
}
