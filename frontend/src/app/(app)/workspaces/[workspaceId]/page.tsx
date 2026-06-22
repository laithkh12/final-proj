"use client";

import { use, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";
import {
  FolderKanban,
  Pencil,
  Plus,
  Trash2,
  UserPlus,
  UserMinus,
  Copy,
} from "lucide-react";
import { workspaceService } from "@/services/workspace.service";
import { projectService } from "@/services/project.service";
import { getErrorMessage } from "@/services/api";
import type { MemberRole, Project } from "@/types";
import { useAuthStore } from "@/store/authStore";
import { canRemoveMember } from "@/utils/memberAccess";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { invalidateAfterProjectCreate } from "@/lib/queryInvalidation";
import { queryKeys } from "@/lib/queryInvalidation";
import { PageBackLink } from "@/components/layout/PageBackLink";
import { canSaveDuplicateTitle } from "@/utils/duplicate";
import { AiAssistantPanel } from "@/components/ai/AiAssistantPanel";
import { buildAiContext } from "@/components/ai/aiAssistantConfig";

export default function WorkspaceDetailPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = use(params);
  const router = useRouter();
  const qc = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const [projectOpen, setProjectOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [projectDeleteOpen, setProjectDeleteOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [projectDuplicateOpen, setProjectDuplicateOpen] = useState(false);
  const [projectToDuplicate, setProjectToDuplicate] = useState<Project | null>(
    null,
  );
  const [dupProjectName, setDupProjectName] = useState("");
  const [dupProjectDescription, setDupProjectDescription] = useState("");
  const [dupProjectColor, setDupProjectColor] = useState("#6366f1");
  const [removeMemberOpen, setRemoveMemberOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [projectName, setProjectName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["workspace", workspaceId],
    queryFn: async () => {
      const res = await workspaceService.get(workspaceId);
      return res.data.data!;
    },
  });

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ["projects", workspaceId],
    queryFn: async () => {
      const res = await projectService.list(workspaceId);
      return res.data.data!;
    },
  });

  const { data: activity } = useQuery({
    queryKey: ["activity", workspaceId],
    queryFn: async () => {
      const res = await workspaceService.activity(workspaceId, { limit: 10 });
      return res.data.data!;
    },
  });

  const createProject = useMutation({
    mutationFn: () => projectService.create(workspaceId, { name: projectName }),
    onSuccess: () => {
      void invalidateAfterProjectCreate(qc, workspaceId);
      toast.success("Project created");
      setProjectOpen(false);
      setProjectName("");
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const inviteMember = useMutation({
    mutationFn: () =>
      workspaceService.invite(workspaceId, { email: inviteEmail }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workspace", workspaceId] });
      toast.success("Member invited");
      setInviteOpen(false);
      setInviteEmail("");
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const updateWorkspace = useMutation({
    mutationFn: () =>
      workspaceService.update(workspaceId, {
        name: editName,
        description: editDescription,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workspace", workspaceId] });
      qc.invalidateQueries({ queryKey: queryKeys.workspaces });
      toast.success("Workspace updated");
      setEditOpen(false);
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const deleteWorkspace = useMutation({
    mutationFn: () => workspaceService.remove(workspaceId),
    onSuccess: () => {
      void Promise.all([
        qc.invalidateQueries({ queryKey: queryKeys.workspaces }),
        qc.invalidateQueries({ queryKey: queryKeys.dashboard }),
      ]);
      toast.success("Workspace deleted");
      router.push("/workspaces");
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const deleteProjectCard = useMutation({
    mutationFn: (id: string) => projectService.remove(id),
    onSuccess: () => {
      void invalidateAfterProjectCreate(qc, workspaceId);
      toast.success("Project deleted");
      setProjectDeleteOpen(false);
      setProjectToDelete(null);
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const duplicateProjectCard = useMutation({
    mutationFn: () =>
      projectService.create(workspaceId, {
        name: dupProjectName.trim(),
        description: dupProjectDescription.trim(),
        color: dupProjectColor,
      }),
    onSuccess: () => {
      void invalidateAfterProjectCreate(qc, workspaceId);
      toast.success("Project duplicated");
      setProjectDuplicateOpen(false);
      setProjectToDuplicate(null);
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const removeMember = useMutation({
    mutationFn: (userId: string) =>
      workspaceService.removeMember(workspaceId, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workspace", workspaceId] });
      qc.invalidateQueries({ queryKey: ["activity", workspaceId] });
      toast.success("Member removed");
      setRemoveMemberOpen(false);
      setMemberToRemove(null);
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  if (isLoading) return <CardSkeleton />;

  const { workspace, members, stats } = data!;
  const myMembership = members.find((m) => m.user._id === currentUser?._id);
  const myRole = myMembership?.role;
  const isAdmin = myRole === "owner" || myRole === "admin";
  const isOwner =
    myRole === "owner" ||
    (typeof workspace.owner === "object" &&
      workspace.owner._id === currentUser?._id);

  const openEditModal = () => {
    setEditName(workspace.name);
    setEditDescription(workspace.description || "");
    setEditOpen(true);
  };

  const openProjectDuplicateModal = (project: Project) => {
    setProjectToDuplicate(project);
    setDupProjectName(project.name);
    setDupProjectDescription(project.description || "");
    setDupProjectColor(project.color || "#6366f1");
    setProjectDuplicateOpen(true);
  };

  const canSaveProjectDuplicate =
    projectToDuplicate &&
    canSaveDuplicateTitle(projectToDuplicate.name, dupProjectName);

  return (
    <div>
      <PageBackLink href="/workspaces">← Back to workspaces</PageBackLink>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{workspace.name}</h1>
          <p className="text-slate-500">{workspace.description}</p>
          <p className="mt-2 text-sm text-slate-400">
            {stats.projectCount} projects · {stats.taskCount} tasks ·{" "}
            {members.length} members
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isAdmin && (
            <Button variant="secondary" onClick={openEditModal}>
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </Button>
          )}
          {isOwner && (
            <Button variant="danger" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </Button>
          )}
          {isAdmin && (
            <Button variant="secondary" onClick={() => setInviteOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" /> Invite
            </Button>
          )}
          <Button onClick={() => setProjectOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> New project
          </Button>
          <AiAssistantPanel
            label="Plan with AI"
            context={buildAiContext("workspace", { workspaceId })}
            workspaceName={workspace.name}
          />
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
                <div
                  key={p._id}
                  className="group relative rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                  style={{ borderTopColor: p.color, borderTopWidth: 3 }}
                >
                  <Link href={`/projects/${p._id}`} className="block p-5">
                    <FolderKanban
                      className="mb-2 h-5 w-5"
                      style={{ color: p.color }}
                    />
                    <h3 className="font-medium">{p.name}</h3>
                    <p className="text-sm text-slate-500">
                      {p.taskCount ?? 0} tasks
                    </p>
                  </Link>
                  <div className="absolute right-3 top-3 flex gap-1">
                    <button
                      type="button"
                      aria-label={`Duplicate ${p.name}`}
                      onClick={() => openProjectDuplicateModal(p)}
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/30 dark:hover:text-indigo-400"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    {isAdmin && (
                      <button
                        type="button"
                        aria-label={`Delete ${p.name}`}
                        onClick={() => {
                          setProjectToDelete({ id: p._id, name: p.name });
                          setProjectDeleteOpen(true);
                        }}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={FolderKanban}
              title="No projects"
              description="Create a project to start adding tasks."
              action={
                <Button onClick={() => setProjectOpen(true)}>
                  Create project
                </Button>
              }
            />
          )}
        </div>

        <div>
          <h2 className="mb-4 font-semibold">Members</h2>
          <ul className="space-y-2 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            {members.map((m) => {
              const canRemove =
                myRole &&
                canRemoveMember(myRole as MemberRole, m.role) &&
                m.user._id !== currentUser?._id;
              return (
                <li
                  key={m._id}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <span>{m.user.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs dark:bg-slate-800">
                      {m.role}
                    </span>
                    {canRemove && (
                      <button
                        onClick={() => {
                          setMemberToRemove({
                            id: m.user._id,
                            name: m.user.name,
                          });
                          setRemoveMemberOpen(true);
                        }}
                        disabled={removeMember.isPending}
                        className="text-red-500 hover:text-red-700"
                        title="Remove member"
                      >
                        <UserMinus className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          <h2 className="mb-4 mt-6 font-semibold">Activity</h2>
          <ul className="space-y-2 text-sm">
            {activity?.map((log) => (
              <li
                key={log._id}
                className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900"
              >
                <p>{log.message}</p>
                <p className="text-xs text-slate-400">
                  {formatDistanceToNow(new Date(log.createdAt), {
                    addSuffix: true,
                  })}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <Modal
        open={projectOpen}
        onClose={() => setProjectOpen(false)}
        title="New project"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createProject.mutate();
          }}
          className="space-y-4"
        >
          <Input
            label="Project name"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            required
          />
          <Button
            type="submit"
            loading={createProject.isPending}
            className="w-full"
          >
            Create
          </Button>
        </form>
      </Modal>

      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Invite member"
      >
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
          <p className="text-xs text-slate-500">
            User must already have a TeamFlow account.
          </p>
          <Button
            type="submit"
            loading={inviteMember.isPending}
            className="w-full"
          >
            Invite
          </Button>
        </form>
      </Modal>

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit workspace"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateWorkspace.mutate();
          }}
          className="space-y-4"
        >
          <Input
            label="Name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            required
          />
          <Input
            label="Description"
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
          />
          <Button
            type="submit"
            loading={updateWorkspace.isPending}
            className="w-full"
          >
            Save changes
          </Button>
        </form>
      </Modal>

      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete workspace"
      >
        <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
          Are you sure you want to delete <strong>{workspace.name}</strong>?
          This will permanently remove all projects, tasks, and activity in this
          workspace.
        </p>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => setDeleteOpen(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={deleteWorkspace.isPending}
            onClick={() => deleteWorkspace.mutate()}
            className="flex-1"
          >
            Delete workspace
          </Button>
        </div>
      </Modal>

      <Modal
        open={projectDuplicateOpen}
        onClose={() => {
          setProjectDuplicateOpen(false);
          setProjectToDuplicate(null);
        }}
        title="Duplicate project"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!canSaveProjectDuplicate) return;
            duplicateProjectCard.mutate();
          }}
          className="space-y-4"
        >
          <Input
            label="Name"
            value={dupProjectName}
            onChange={(e) => setDupProjectName(e.target.value)}
            required
          />
          <Input
            label="Description"
            value={dupProjectDescription}
            onChange={(e) => setDupProjectDescription(e.target.value)}
          />
          <div>
            <label className="mb-1 block text-sm font-medium">Color</label>
            <input
              type="color"
              value={dupProjectColor}
              onChange={(e) => setDupProjectColor(e.target.value)}
              className="h-10 w-full cursor-pointer rounded-lg border border-slate-300 dark:border-slate-600"
            />
          </div>
          {!canSaveProjectDuplicate && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Change the name to enable saving.
            </p>
          )}
          <Button
            type="submit"
            loading={duplicateProjectCard.isPending}
            disabled={!canSaveProjectDuplicate}
            className="w-full"
          >
            Duplicate project
          </Button>
        </form>
      </Modal>

      <Modal
        open={projectDeleteOpen}
        onClose={() => {
          setProjectDeleteOpen(false);
          setProjectToDelete(null);
        }}
        title="Delete project"
      >
        <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
          Are you sure you want to delete{" "}
          <strong>{projectToDelete?.name}</strong>? All tasks in this project
          will be permanently removed.
        </p>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              setProjectDeleteOpen(false);
              setProjectToDelete(null);
            }}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={deleteProjectCard.isPending}
            onClick={() =>
              projectToDelete && deleteProjectCard.mutate(projectToDelete.id)
            }
            className="flex-1"
          >
            Delete project
          </Button>
        </div>
      </Modal>

      <Modal
        open={removeMemberOpen}
        onClose={() => {
          setRemoveMemberOpen(false);
          setMemberToRemove(null);
        }}
        title="Remove member"
      >
        <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
          Remove <strong>{memberToRemove?.name}</strong> from this workspace?
          They will lose access immediately.
        </p>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              setRemoveMemberOpen(false);
              setMemberToRemove(null);
            }}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={removeMember.isPending}
            onClick={() =>
              memberToRemove && removeMember.mutate(memberToRemove.id)
            }
            className="flex-1"
          >
            Remove member
          </Button>
        </div>
      </Modal>
    </div>
  );
}
