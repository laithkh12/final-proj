import { Project, Task, TeamMember, Workspace } from '../models';
import { ensureDefaultTeamMembers, DEFAULT_TEAM_MEMBERS } from './teamMember.service';
import {
  assertWorkspaceMember,
  getMembership,
  getUserWorkspaceIds,
} from './workspaceAccess.service';
import type {
  AiContextProject,
  AiContextSnapshot,
  AiContextTaskRef,
  AiContextTeamMember,
  AiContextWorkspace,
  AiPageContextPayload,
} from '../types/ai';
import { ApiError } from '../utils/ApiError';

export async function buildAiContext(
  userId: string,
  payload: AiPageContextPayload
): Promise<AiContextSnapshot> {
  const workspaceIds = await getUserWorkspaceIds(userId);
  const workspaces = await Workspace.find({ _id: { $in: workspaceIds } })
    .select('name description')
    .sort({ updatedAt: -1 });

  const workspaceList: AiContextWorkspace[] = await Promise.all(
    workspaces.map(async (ws) => {
      const membership = await getMembership(ws._id.toString(), userId);
      return {
        id: ws._id.toString(),
        name: ws.name,
        description: ws.description || '',
        role: membership?.role ?? 'member',
      };
    })
  );

  let resolvedWorkspaceId = payload.workspaceId;
  let resolvedProjectId = payload.projectId;

  if (payload.page === 'workspace' && payload.workspaceId) {
    await assertWorkspaceMember(payload.workspaceId, userId);
    resolvedWorkspaceId = payload.workspaceId;
  }

  if (payload.page === 'project' && payload.projectId) {
    const project = await Project.findById(payload.projectId).select('name workspace');
    if (!project) throw new ApiError(404, 'Project not found');
    await assertWorkspaceMember(project.workspace.toString(), userId);
    resolvedWorkspaceId = project.workspace.toString();
    resolvedProjectId = project._id.toString();
  }

  if (payload.page === 'task' && payload.taskId) {
    const task = await Task.findById(payload.taskId).select('title project workspace');
    if (!task) throw new ApiError(404, 'Task not found');
    await assertWorkspaceMember(task.workspace.toString(), userId);
    resolvedWorkspaceId = task.workspace.toString();
    resolvedProjectId = task.project.toString();
  }

  let projects: AiContextProject[] = [];
  if (resolvedWorkspaceId) {
    await assertWorkspaceMember(resolvedWorkspaceId, userId);
    const projectDocs = await Project.find({ workspace: resolvedWorkspaceId })
      .select('name workspace')
      .sort({ updatedAt: -1 });
    projects = projectDocs.map((p) => ({
      id: p._id.toString(),
      name: p.name,
      workspaceId: p.workspace.toString(),
    }));
  } else {
    const allProjects = await Project.find({ workspace: { $in: workspaceIds } })
      .select('name workspace')
      .sort({ updatedAt: -1 })
      .limit(50);
    projects = allProjects.map((p) => ({
      id: p._id.toString(),
      name: p.name,
      workspaceId: p.workspace.toString(),
    }));
  }

  let teamMembers: AiContextTeamMember[] = [];
  if (resolvedWorkspaceId) {
    await ensureDefaultTeamMembers(resolvedWorkspaceId);
    const members = await TeamMember.find({ workspace: resolvedWorkspaceId })
      .select('name role')
      .sort({ name: 1 });
    teamMembers = members.map((m) => ({
      id: m._id.toString(),
      name: m.name,
      role: m.role,
    }));
  } else {
    // New workspaces get this roster on creation — show it so AI can suggest assignees
    teamMembers = DEFAULT_TEAM_MEMBERS.map((m, index) => ({
      id: `default-roster-${index}`,
      name: m.name,
      role: m.role,
      isDefaultRoster: true,
    }));
  }

  const snapshot: AiContextSnapshot = {
    page: payload.page,
    workspaces: workspaceList,
    projects,
    projectTasks: [],
    teamMembers,
  };

  if (resolvedProjectId && resolvedWorkspaceId) {
    await assertWorkspaceMember(resolvedWorkspaceId, userId);
    const taskDocs = await Task.find({ project: resolvedProjectId })
      .select('title status priority')
      .sort({ updatedAt: -1 })
      .limit(100);
    snapshot.projectTasks = taskDocs.map(
      (t): AiContextTaskRef => ({
        id: t._id.toString(),
        title: t.title,
        status: t.status,
        priority: t.priority,
      })
    );
  }

  if (resolvedWorkspaceId) {
    const ws = workspaceList.find((w) => w.id === resolvedWorkspaceId);
    if (ws) {
      snapshot.workspace = { id: ws.id, name: ws.name };
    } else {
      const wsDoc = await Workspace.findById(resolvedWorkspaceId).select('name');
      if (wsDoc) {
        snapshot.workspace = { id: wsDoc._id.toString(), name: wsDoc.name };
      }
    }
  }

  if (resolvedProjectId) {
    const proj = projects.find((p) => p.id === resolvedProjectId);
    if (proj) {
      snapshot.project = {
        id: proj.id,
        name: proj.name,
        workspaceId: proj.workspaceId,
      };
    }
  }

  if (payload.page === 'task' && payload.taskId) {
    const task = await Task.findById(payload.taskId)
      .populate('assignee', 'name')
      .select('title description status priority project workspace dueDate');
    if (task) {
      const assignee =
        task.assignee &&
        typeof task.assignee === 'object' &&
        'name' in task.assignee
          ? (task.assignee as { name: string }).name
          : undefined;

      snapshot.task = {
        id: task._id.toString(),
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        projectId: task.project.toString(),
        workspaceId: task.workspace.toString(),
        assigneeName: assignee,
        dueDate: task.dueDate ? task.dueDate.toISOString() : undefined,
      };
    }
  }

  return snapshot;
}

export async function assertCanCreateInWorkspace(
  workspaceId: string,
  userId: string
): Promise<void> {
  await assertWorkspaceMember(workspaceId, userId);
}
