'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Plus, Users } from 'lucide-react';
import { workspaceService } from '@/services/workspace.service';
import { getErrorMessage } from '@/services/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { CardSkeleton } from '@/components/ui/Skeleton';

export default function WorkspacesPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const { data: workspaces, isLoading } = useQuery({
    queryKey: ['workspaces'],
    queryFn: async () => {
      const res = await workspaceService.list();
      return res.data.data!;
    },
  });

  const createMutation = useMutation({
    mutationFn: () => workspaceService.create({ name, description }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workspaces'] });
      toast.success('Workspace created');
      setOpen(false);
      setName('');
      setDescription('');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Workspaces</h1>
          <p className="text-slate-500">Manage your teams and projects</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> New workspace
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : workspaces?.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workspaces.map((ws) => (
            <Link
              key={ws._id}
              href={`/workspaces/${ws._id}`}
              className="rounded-xl border border-slate-200 bg-white p-6 transition hover:border-indigo-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
            >
              <Users className="mb-3 h-8 w-8 text-indigo-600" />
              <h3 className="font-semibold text-slate-900 dark:text-white">{ws.name}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-slate-500">{ws.description || 'No description'}</p>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title="No workspaces yet"
          description="Create your first workspace to start collaborating with your team."
          action={<Button onClick={() => setOpen(true)}>Create workspace</Button>}
        />
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Create workspace">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate();
          }}
          className="space-y-4"
        >
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
          <Button type="submit" loading={createMutation.isPending} className="w-full">
            Create
          </Button>
        </form>
      </Modal>
    </div>
  );
}
