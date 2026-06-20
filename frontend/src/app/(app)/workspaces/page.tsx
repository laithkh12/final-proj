"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import toast from "react-hot-toast";
import { Plus, Copy, Trash2, Users } from "lucide-react";
import { workspaceService } from "@/services/workspace.service";
import { getErrorMessage } from "@/services/api";
import type { Workspace } from "@/types";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { invalidateAfterWorkspaceCreate } from "@/lib/queryInvalidation";
import { canSaveDuplicateTitle } from "@/utils/duplicate";

function isWorkspaceOwner(ws: Workspace, userId?: string) {
  if (!userId) return false;
  if (typeof ws.owner === "object" && ws.owner !== null) {
    return ws.owner._id === userId;
  }
  return ws.owner === userId;
}

export default function WorkspacesPage() {
  const qc = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [workspaceToDelete, setWorkspaceToDelete] = useState<Workspace | null>(
    null,
  );
  const [workspaceToDuplicate, setWorkspaceToDuplicate] =
    useState<Workspace | null>(null);
  const [dupName, setDupName] = useState("");
  const [dupDescription, setDupDescription] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const { data: workspaces, isLoading } = useQuery({
    queryKey: ["workspaces"],
    queryFn: async () => {
      const res = await workspaceService.list();
      return res.data.data!;
    },
  });

  const createMutation = useMutation({
    mutationFn: () => workspaceService.create({ name, description }),
    onSuccess: () => {
      void invalidateAfterWorkspaceCreate(qc);
      toast.success("Workspace created");
      setOpen(false);
      setName("");
      setDescription("");
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const deleteWorkspace = useMutation({
    mutationFn: (id: string) => workspaceService.remove(id),
    onSuccess: () => {
      void invalidateAfterWorkspaceCreate(qc);
      toast.success("Workspace deleted");
      setDeleteOpen(false);
      setWorkspaceToDelete(null);
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const openDeleteModal = (ws: Workspace) => {
    setWorkspaceToDelete(ws);
    setDeleteOpen(true);
  };

  const openDuplicateModal = (ws: Workspace) => {
    setWorkspaceToDuplicate(ws);
    setDupName(ws.name);
    setDupDescription(ws.description || "");
    setDuplicateOpen(true);
  };

  const duplicateWorkspace = useMutation({
    mutationFn: () =>
      workspaceService.create({
        name: dupName.trim(),
        description: dupDescription.trim(),
      }),
    onSuccess: () => {
      void invalidateAfterWorkspaceCreate(qc);
      toast.success("Workspace duplicated");
      setDuplicateOpen(false);
      setWorkspaceToDuplicate(null);
      setDupName("");
      setDupDescription("");
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const canSaveWorkspaceDuplicate =
    workspaceToDuplicate &&
    canSaveDuplicateTitle(workspaceToDuplicate.name, dupName);

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
          {workspaces.map((ws) => {
            const canDelete = isWorkspaceOwner(ws, currentUser?._id);
            return (
              <div
                key={ws._id}
                className="group relative rounded-xl border border-slate-200 bg-white transition hover:border-indigo-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
              >
                <Link href={`/workspaces/${ws._id}`} className="block p-6">
                  <Users className="mb-3 h-8 w-8 text-indigo-600" />
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    {ws.name}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                    {ws.description || "No description"}
                  </p>
                </Link>
                <div className="absolute right-3 top-3 flex gap-1">
                  <button
                    type="button"
                    aria-label={`Duplicate ${ws.name}`}
                    onClick={() => openDuplicateModal(ws)}
                    className="rounded-lg p-2 text-slate-400 transition hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/30 dark:hover:text-indigo-400"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  {canDelete && (
                    <button
                      type="button"
                      aria-label={`Delete ${ws.name}`}
                      onClick={() => openDeleteModal(ws)}
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title="No workspaces yet"
          description="Create your first workspace to start collaborating with your team."
          action={
            <Button onClick={() => setOpen(true)}>Create workspace</Button>
          }
        />
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Create workspace"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate();
          }}
          className="space-y-4"
        >
          <Input
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Button
            type="submit"
            loading={createMutation.isPending}
            className="w-full"
          >
            Create
          </Button>
        </form>
      </Modal>

      <Modal
        open={duplicateOpen}
        onClose={() => {
          setDuplicateOpen(false);
          setWorkspaceToDuplicate(null);
        }}
        title="Duplicate workspace"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!canSaveWorkspaceDuplicate) return;
            duplicateWorkspace.mutate();
          }}
          className="space-y-4"
        >
          <Input
            label="Name"
            value={dupName}
            onChange={(e) => setDupName(e.target.value)}
            required
          />
          <Input
            label="Description"
            value={dupDescription}
            onChange={(e) => setDupDescription(e.target.value)}
          />
          {!canSaveWorkspaceDuplicate && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Change the name to enable saving.
            </p>
          )}
          <Button
            type="submit"
            loading={duplicateWorkspace.isPending}
            disabled={!canSaveWorkspaceDuplicate}
            className="w-full"
          >
            Duplicate workspace
          </Button>
        </form>
      </Modal>

      <Modal
        open={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setWorkspaceToDelete(null);
        }}
        title="Delete workspace"
      >
        <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
          Are you sure you want to delete{" "}
          <strong>{workspaceToDelete?.name}</strong>? This will permanently
          remove all projects, tasks, and activity in this workspace.
        </p>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              setDeleteOpen(false);
              setWorkspaceToDelete(null);
            }}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={deleteWorkspace.isPending}
            onClick={() =>
              workspaceToDelete && deleteWorkspace.mutate(workspaceToDelete._id)
            }
            className="flex-1"
          >
            Delete workspace
          </Button>
        </div>
      </Modal>
    </div>
  );
}
