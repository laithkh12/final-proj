"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { MessageSquare, Trash2 } from "lucide-react";
import { taskService } from "@/services/task.service";
import { commentService } from "@/services/comment.service";
import { workspaceService } from "@/services/workspace.service";
import { getErrorMessage } from "@/services/api";
import type { TaskPriority, TaskStatus } from "@/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { useAuthStore } from "@/store/authStore";
import { cn, selectClass, selectOptionClass } from "@/utils/cn";
import { invalidateAfterTaskChange } from "@/lib/queryInvalidation";
import { PageBackLink } from "@/components/layout/PageBackLink";
import { AiAssistantPanel } from "@/components/ai/AiAssistantPanel";
import { buildAiContext } from "@/components/ai/aiAssistantConfig";

const STATUSES: TaskStatus[] = ["Todo", "In Progress", "Review", "Done"];
const PRIORITIES: TaskPriority[] = ["Low", "Medium", "High", "Urgent"];

interface TaskDraft {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: string;
  dueDate: string;
}

export default function TaskDetailPage({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const { taskId } = use(params);
  const router = useRouter();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [comment, setComment] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [draft, setDraft] = useState<TaskDraft>({
    title: "",
    description: "",
    status: "Todo",
    priority: "Medium",
    assignee: "",
    dueDate: "",
  });

  const { data: taskData, isLoading } = useQuery({
    queryKey: ["task", taskId],
    queryFn: async () => {
      const res = await taskService.get(taskId);
      return res.data.data!;
    },
  });

  const task = taskData?.task;
  const isAdmin = taskData?.myRole === "owner" || taskData?.myRole === "admin";

  const workspaceId = task
    ? typeof task.workspace === "object" &&
      task.workspace !== null &&
      "_id" in task.workspace
      ? (task.workspace as { _id: string })._id
      : String(task.workspace)
    : "";

  const { data: teamMembers, isLoading: teamMembersLoading } = useQuery({
    queryKey: ["team-members", workspaceId],
    queryFn: async () => {
      const res = await workspaceService.teamMembers(workspaceId);
      return res.data.data!;
    },
    enabled: !!workspaceId,
  });

  const { data: comments } = useQuery({
    queryKey: ["comments", taskId],
    queryFn: async () => {
      const res = await commentService.list(taskId);
      return res.data.data!;
    },
  });

  useEffect(() => {
    if (!task) return;

    const assigneeId =
      typeof task.assignee === "object" &&
      task.assignee !== null &&
      "_id" in task.assignee
        ? (task.assignee as { _id: string })._id
        : task.assignee || "";

    setDraft({
      title: task.title,
      description: task.description || "",
      status: task.status,
      priority: task.priority,
      assignee: assigneeId,
      dueDate: task.dueDate ? task.dueDate.split("T")[0] : "",
    });
  }, [task]);

  const updateTask = useMutation({
    mutationFn: (data: import("@/services/task.service").TaskUpdatePayload) =>
      taskService.update(taskId, data),
    onSuccess: () => {
      if (task) {
        const projectId =
          typeof task.project === "object" &&
          task.project !== null &&
          "_id" in task.project
            ? (task.project as { _id: string })._id
            : String(task.project);
        void invalidateAfterTaskChange(qc, {
          projectId,
          workspaceId: task.workspace,
          taskId,
        });
      } else {
        qc.invalidateQueries({ queryKey: ["task", taskId] });
      }
      toast.success("Task updated");
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const deleteTask = useMutation({
    mutationFn: () => taskService.remove(taskId),
    onSuccess: () => {
      if (task) {
        const projectId =
          typeof task.project === "object" &&
          task.project !== null &&
          "_id" in task.project
            ? (task.project as { _id: string })._id
            : String(task.project);
        void invalidateAfterTaskChange(qc, {
          projectId,
          workspaceId: task.workspace,
        });
        toast.success("Task deleted");
        router.push(`/projects/${projectId}`);
      }
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const addComment = useMutation({
    mutationFn: () => commentService.create(taskId, comment),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comments", taskId] });
      setComment("");
      toast.success("Comment added");
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const deleteComment = useMutation({
    mutationFn: (id: string) => commentService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["comments", taskId] }),
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const isDirty = useMemo(() => {
    if (!task) return false;

    const assigneeId =
      typeof task.assignee === "object" &&
      task.assignee !== null &&
      "_id" in task.assignee
        ? (task.assignee as { _id: string })._id
        : task.assignee || "";
    const dueDate = task.dueDate ? task.dueDate.split("T")[0] : "";

    return (
      draft.title !== task.title ||
      draft.description !== (task.description || "") ||
      draft.status !== task.status ||
      draft.priority !== task.priority ||
      draft.assignee !== assigneeId ||
      draft.dueDate !== dueDate
    );
  }, [draft, task]);

  const handleSave = () => {
    updateTask.mutate({
      title: draft.title,
      description: draft.description,
      status: draft.status,
      priority: draft.priority,
      assignee: draft.assignee || null,
      dueDate: draft.dueDate ? `${draft.dueDate}T12:00:00.000Z` : null,
    });
  };

  if (isLoading) return <CardSkeleton />;
  if (!task) return <p>Task not found</p>;

  const projectId =
    typeof task.project === "object" &&
    task.project !== null &&
    "_id" in task.project
      ? (task.project as { _id: string })._id
      : String(task.project);

  const members = teamMembers ?? [];

  return (
    <div className="max-w-3xl">
      <PageBackLink href="/projects">← Back to projects</PageBackLink>
      <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
          <AiAssistantPanel
            label="Plan with AI"
            context={buildAiContext("task", { taskId })}
            projectName={
              task?.project && typeof task.project === "object"
                ? (task.project as { name?: string }).name
                : undefined
            }
          />
          {isDirty && (
            <Button onClick={handleSave} loading={updateTask.isPending}>
              Save changes
            </Button>
          )}
          {isAdmin && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete task
            </Button>
          )}
      </div>

      <div className="mt-4 space-y-4">
        <Input
          label="Title"
          value={draft.title}
          onChange={(e) =>
            setDraft((prev) => ({ ...prev, title: e.target.value }))
          }
          required
        />
        <div>
          <label className="mb-1 block text-sm font-medium">Description</label>
          <textarea
            value={draft.description}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, description: e.target.value }))
            }
            rows={4}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium">Status</label>
          <select
            value={draft.status}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                status: e.target.value as TaskStatus,
              }))
            }
            className={cn(selectClass, "mt-1 w-full")}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s} className={selectOptionClass}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Priority</label>
          <select
            value={draft.priority}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                priority: e.target.value as TaskPriority,
              }))
            }
            className={cn(selectClass, "mt-1 w-full")}
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p} className={selectOptionClass}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Assignee</label>
          <select
            value={draft.assignee}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, assignee: e.target.value }))
            }
            className={cn(selectClass, "mt-1 w-full")}
          >
            <option value="" className={selectOptionClass}>
              Unassigned
            </option>
            {teamMembersLoading ? (
              <option disabled className={selectOptionClass}>
                Loading...
              </option>
            ) : members.length === 0 ? (
              <option disabled className={selectOptionClass}>
                No team members
              </option>
            ) : (
              members.map((m) => (
                <option key={m._id} value={m._id} className={selectOptionClass}>
                  {m.name}
                </option>
              ))
            )}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Due date</label>
          <input
            type="date"
            value={draft.dueDate}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, dueDate: e.target.value }))
            }
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>
        <div className="text-sm text-slate-500 sm:col-span-2">
          <p>Created {format(new Date(task.createdAt), "PPp")}</p>
          <p>Updated {format(new Date(task.updatedAt), "PPp")}</p>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="mb-4 flex items-center gap-2 font-semibold">
          <MessageSquare className="h-5 w-5" /> Comments (
          {comments?.length || 0})
        </h2>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (comment.trim()) addComment.mutate();
          }}
          className="mb-6 flex gap-2"
        >
          <Input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1"
          />
          <Button type="submit" loading={addComment.isPending}>
            Post
          </Button>
        </form>

        <ul className="space-y-4">
          {comments?.map((c) => (
            <li
              key={c._id}
              className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-sm">{c.author?.name}</p>
                  <p className="mt-1 text-slate-700 dark:text-slate-300">
                    {c.content}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {format(new Date(c.createdAt), "PPp")}
                  </p>
                </div>
                {c.author?._id === user?._id && (
                  <button
                    onClick={() => deleteComment.mutate(c._id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete task"
      >
        <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
          Are you sure you want to delete <strong>{task.title}</strong>? This
          action cannot be undone.
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
            loading={deleteTask.isPending}
            onClick={() => deleteTask.mutate()}
            className="flex-1"
          >
            Delete task
          </Button>
        </div>
      </Modal>
    </div>
  );
}
