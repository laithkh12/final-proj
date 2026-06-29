import { Project, Task, TeamMember, Workspace, WorkspaceMember } from '../models';
import { logActivity } from './activity.service';
import { assertCanCreateInWorkspace } from './aiContext.service';
import {
  seedDefaultTeamMembers,
  assertAssigneeInWorkspace,
} from './teamMember.service';
import { resolveProjectColor } from '../utils/projectColor';
import { normalizeAiProposal } from '../utils/sanitizeAiProposal';
import type {
  AiApplyPlanResult,
  AiApplyTasksUpdateResult,
  AiProposal,
  AiProposalTask,
  AiProposalTaskUpdate,
} from '../types/ai';
import { TASK_PRIORITIES, TASK_STATUSES } from '../constants';
import { ApiError } from '../utils/ApiError';

const slugify = (name: string): string =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') +
  '-' +
  Date.now().toString(36);

function assertProposalAction(
  proposal: AiProposal,
  expected: AiProposal['action']
): void {
  if (proposal.action !== expected) {
    throw new ApiError(400, `Expected action ${expected}`);
  }
}

async function resolveAssigneeId(
  workspaceId: string,
  task: AiProposalTask
): Promise<string | undefined> {
  if (task.assigneeId) {
    await assertAssigneeInWorkspace(task.assigneeId, workspaceId);
    return task.assigneeId;
  }

  if (!task.assigneeName?.trim()) return undefined;

  const members = await TeamMember.find({ workspace: workspaceId });
  const search = task.assigneeName.toLowerCase().trim();
  const match =
    members.find((m) => m.name.toLowerCase() === search) ||
    members.find((m) => m.name.toLowerCase().includes(search)) ||
    members.find((m) => search.includes(m.name.split(' ')[0]?.toLowerCase() ?? '')) ||
    members.find((m) => m.role.toLowerCase().includes(search));

  return match?._id.toString();
}

function buildTaskFields(
  task: AiProposalTask,
  projectId: unknown,
  workspaceId: unknown,
  userId: string,
  assigneeId?: string
): Record<string, unknown> {
  const fields: Record<string, unknown> = {
    title: task.title!.trim(),
    description: task.description?.trim() || '',
    project: projectId,
    workspace: workspaceId,
    createdBy: userId,
  };

  if (task.priority) {
    if (!TASK_PRIORITIES.includes(task.priority)) {
      throw new ApiError(400, 'Invalid task priority');
    }
    fields.priority = task.priority;
  }

  if (task.status) {
    if (!TASK_STATUSES.includes(task.status)) {
      throw new ApiError(400, 'Invalid task status');
    }
    fields.status = task.status;
  }

  if (assigneeId) fields.assignee = assigneeId;
  if (task.dueDate) fields.dueDate = new Date(task.dueDate);

  return fields;
}

function buildTaskUpdateFields(task: AiProposalTask): Record<string, unknown> {
  const fields: Record<string, unknown> = {};

  if (task.title !== undefined) {
    if (!task.title.trim()) throw new ApiError(400, 'Task title cannot be empty');
    fields.title = task.title.trim();
  }
  if (task.description !== undefined) fields.description = task.description.trim();
  if (task.priority) {
    if (!TASK_PRIORITIES.includes(task.priority)) {
      throw new ApiError(400, 'Invalid task priority');
    }
    fields.priority = task.priority;
  }
  if (task.status) {
    if (!TASK_STATUSES.includes(task.status)) {
      throw new ApiError(400, 'Invalid task status');
    }
    fields.status = task.status;
  }
  if (task.dueDate) fields.dueDate = new Date(task.dueDate);

  return fields;
}

export async function applyAiProposal(userId: string, proposal: AiProposal) {
  if (proposal.action === 'create_plan') {
    return applyCreatePlan(userId, proposal);
  }

  switch (proposal.action) {
    case 'create_workspace':
      return applyCreateWorkspace(userId, proposal);
    case 'create_project':
      return applyCreateProject(userId, proposal);
    case 'create_task':
      return applyCreateTask(userId, proposal);
    case 'update_task':
      return applyUpdateTask(userId, proposal);
    case 'update_tasks':
      return applyUpdateTasks(userId, proposal);
    default:
      throw new ApiError(400, 'Unsupported action');
  }
}

async function applyCreateWorkspace(userId: string, proposal: AiProposal) {
  assertProposalAction(proposal, 'create_workspace');
  const { workspace } = proposal;
  if (!workspace?.name?.trim()) {
    throw new ApiError(400, 'Workspace name is required');
  }

  const created = await Workspace.create({
    name: workspace.name.trim(),
    description: workspace.description?.trim() || '',
    slug: slugify(workspace.name),
    owner: userId,
  });

  await WorkspaceMember.create({
    workspace: created._id,
    user: userId,
    role: 'owner',
    invitedBy: userId,
  });

  await seedDefaultTeamMembers(created._id);

  await logActivity({
    workspaceId: created._id,
    userId,
    type: 'workspace_created',
    message: `Created workspace "${created.name}"`,
    entityType: 'workspace',
    entityId: created._id,
  });

  return { type: 'workspace' as const, entity: created };
}

async function applyCreateProject(userId: string, proposal: AiProposal) {
  assertProposalAction(proposal, 'create_project');
  const workspaceId = proposal.workspaceId;
  if (!workspaceId) throw new ApiError(400, 'Workspace is required');
  if (!proposal.project?.name?.trim()) {
    throw new ApiError(400, 'Project name is required');
  }

  await assertCanCreateInWorkspace(workspaceId, userId);

  const project = await Project.create({
    name: proposal.project.name.trim(),
    description: proposal.project.description?.trim() || '',
    color: resolveProjectColor(proposal.project.color),
    workspace: workspaceId,
    createdBy: userId,
  });

  await logActivity({
    workspaceId,
    userId,
    type: 'project_created',
    message: `Created project "${project.name}"`,
    entityType: 'project',
    entityId: project._id,
  });

  return { type: 'project' as const, entity: project, workspaceId };
}

async function applyCreateTask(userId: string, proposal: AiProposal) {
  assertProposalAction(proposal, 'create_task');
  const projectId = proposal.projectId;
  if (!projectId) throw new ApiError(400, 'Project is required');
  if (!proposal.task?.title?.trim()) {
    throw new ApiError(400, 'Task title is required');
  }

  const project = await Project.findById(projectId);
  if (!project) throw new ApiError(404, 'Project not found');

  await assertCanCreateInWorkspace(project.workspace.toString(), userId);

  const assigneeId = await resolveAssigneeId(project.workspace.toString(), proposal.task);

  const task = await Task.create(
    buildTaskFields(
      proposal.task,
      project._id,
      project.workspace,
      userId,
      assigneeId
    )
  );

  await logActivity({
    workspaceId: project.workspace,
    userId,
    type: 'task_created',
    message: `Created task "${task.title}"`,
    entityType: 'task',
    entityId: task._id,
  });

  const populated = await task.populate([
    { path: 'assignee', select: 'name email avatar role' },
    { path: 'createdBy', select: 'name email avatar' },
  ]);

  return {
    type: 'task' as const,
    entity: populated,
    workspaceId: project.workspace.toString(),
    projectId: project._id.toString(),
  };
}

function taskUpdateToPatch(update: AiProposalTaskUpdate): AiProposalTask {
  const { taskTitle: _title, taskId: _id, ...patch } = update;
  return patch;
}

function hasTaskUpdateFields(task: AiProposalTask): boolean {
  return Boolean(
    task.title !== undefined ||
      task.description !== undefined ||
      task.priority ||
      task.status ||
      task.assigneeName ||
      task.assigneeId ||
      task.dueDate ||
      task.clearAssignee
  );
}

async function executeTaskUpdate(
  userId: string,
  taskId: string,
  patch: AiProposalTask
) {
  const task = await Task.findById(taskId);
  if (!task) throw new ApiError(404, 'Task not found');

  await assertCanCreateInWorkspace(task.workspace.toString(), userId);

  const updates = buildTaskUpdateFields(patch);
  const clearDueDate = patch.dueDate === null || patch.dueDate === '';
  const clearAssignee = patch.clearAssignee === true;

  if (patch.assigneeName || patch.assigneeId) {
    const assigneeId = await resolveAssigneeId(task.workspace.toString(), patch);
    if (assigneeId) updates.assignee = assigneeId;
  }

  if (Object.keys(updates).length === 0 && !clearAssignee && !clearDueDate) {
    throw new ApiError(400, 'No valid fields to update');
  }

  const updateDoc: Record<string, unknown> = {};
  if (Object.keys(updates).length > 0) updateDoc.$set = updates;

  const unset: Record<string, 1> = {};
  if (clearAssignee) unset.assignee = 1;
  if (clearDueDate) unset.dueDate = 1;
  if (Object.keys(unset).length > 0) updateDoc.$unset = unset;

  const updated = await Task.findByIdAndUpdate(task._id, updateDoc, {
    new: true,
    runValidators: true,
  });
  if (!updated) throw new ApiError(404, 'Task not found');

  await logActivity({
    workspaceId: updated.workspace,
    userId,
    type: 'task_updated',
    message: `Updated task "${updated.title}"`,
    entityType: 'task',
    entityId: updated._id,
  });

  const populated = await updated.populate([
    { path: 'assignee', select: 'name email avatar role' },
    { path: 'createdBy', select: 'name email avatar' },
  ]);

  return {
    entity: populated,
    workspaceId: task.workspace.toString(),
    projectId: task.project.toString(),
  };
}

async function applyUpdateTask(userId: string, proposal: AiProposal) {
  assertProposalAction(proposal, 'update_task');
  normalizeAiProposal(proposal);
  const taskId = proposal.taskId;
  if (!taskId) throw new ApiError(400, 'Task id is required');
  if (!proposal.task || !hasTaskUpdateFields(proposal.task)) {
    throw new ApiError(400, 'No task updates provided');
  }

  const result = await executeTaskUpdate(userId, taskId, proposal.task);

  return {
    type: 'task_updated' as const,
    entity: result.entity,
    workspaceId: result.workspaceId,
    projectId: result.projectId,
  };
}

async function applyUpdateTasks(
  userId: string,
  proposal: AiProposal
): Promise<AiApplyTasksUpdateResult> {
  assertProposalAction(proposal, 'update_tasks');
  const updates = proposal.taskUpdates;
  if (!updates?.length) throw new ApiError(400, 'No task updates provided');

  const results: { _id: string; title: string; workspaceId: string; projectId: string }[] = [];

  for (const item of updates) {
    if (!item.taskId) {
      throw new ApiError(400, `Task id is required for "${item.taskTitle}"`);
    }
    const patch = taskUpdateToPatch(item);
    if (!hasTaskUpdateFields(patch)) {
      throw new ApiError(400, `No fields to update for "${item.taskTitle}"`);
    }

    const result = await executeTaskUpdate(userId, item.taskId, patch);
    results.push({
      _id: result.entity._id.toString(),
      title: result.entity.title,
      workspaceId: result.workspaceId,
      projectId: result.projectId,
    });
  }

  return {
    type: 'tasks_updated',
    workspaceId: results[0].workspaceId,
    projectId: results[0].projectId,
    taskIds: results.map((t) => t._id),
    tasks: results.map((t) => ({ _id: t._id, title: t.title })),
  };
}

async function applyCreatePlan(
  userId: string,
  proposal: AiProposal
): Promise<AiApplyPlanResult> {
  assertProposalAction(proposal, 'create_plan');

  let workspaceId = proposal.workspaceId;
  let createdWorkspace: { _id: string; name: string } | undefined;
  let createdProject: { _id: string; name: string } | undefined;
  let projectId = proposal.projectId;

  if (proposal.workspace?.name?.trim()) {
    const wsResult = await applyCreateWorkspace(userId, {
      action: 'create_workspace',
      workspace: proposal.workspace,
    });
    workspaceId = wsResult.entity._id.toString();
    createdWorkspace = { _id: workspaceId, name: wsResult.entity.name };
  }

  if (!workspaceId) {
    throw new ApiError(400, 'Workspace name or workspaceId is required for this plan');
  }

  await assertCanCreateInWorkspace(workspaceId, userId);

  if (proposal.project?.name?.trim() && !projectId) {
    const proj = await Project.create({
      name: proposal.project.name.trim(),
      description: proposal.project.description?.trim() || '',
      color: resolveProjectColor(proposal.project.color),
      workspace: workspaceId,
      createdBy: userId,
    });

    projectId = proj._id.toString();
    createdProject = { _id: projectId, name: proj.name };

    await logActivity({
      workspaceId,
      userId,
      type: 'project_created',
      message: `Created project "${proj.name}"`,
      entityType: 'project',
      entityId: proj._id,
    });
  }

  const tasksToCreate = proposal.tasks?.length
    ? proposal.tasks
    : proposal.task
      ? [proposal.task]
      : [];

  if (tasksToCreate.length > 0 && !projectId) {
    throw new ApiError(400, 'Project name or projectId is required when creating tasks');
  }

  const createdTasks: { _id: string; title: string }[] = [];

  if (projectId && tasksToCreate.length > 0) {
    const project = await Project.findById(projectId);
    if (!project) throw new ApiError(404, 'Project not found');
    if (project.workspace.toString() !== workspaceId) {
      throw new ApiError(400, 'Project does not belong to the selected workspace');
    }

    for (const taskInput of tasksToCreate) {
      if (!taskInput.title?.trim()) continue;

      const assigneeId = await resolveAssigneeId(workspaceId, taskInput);
      const task = await Task.create(
        buildTaskFields(taskInput, project._id, project.workspace, userId, assigneeId)
      );

      await logActivity({
        workspaceId: project.workspace,
        userId,
        type: 'task_created',
        message: `Created task "${task.title}"`,
        entityType: 'task',
        entityId: task._id,
      });

      createdTasks.push({ _id: task._id.toString(), title: task.title });
    }
  }

  if (!createdWorkspace && !createdProject && createdTasks.length === 0) {
    throw new ApiError(400, 'Plan has nothing to create');
  }

  return {
    type: 'plan',
    workspaceId,
    projectId,
    taskIds: createdTasks.map((t) => t._id),
    workspace: createdWorkspace,
    project: createdProject,
    tasks: createdTasks,
  };
}
