import OpenAI from 'openai';
import { env } from '../config/env';
import { buildAiContext } from './aiContext.service';
import type {
  AiChatMessage,
  AiChatResult,
  AiContextSnapshot,
  AiPageContextPayload,
  AiProposal,
  AiProposalTaskUpdate,
} from '../types/ai';
import { ApiError } from '../utils/ApiError';
import { sanitizeAiProposal, normalizeAiProposal } from '../utils/sanitizeAiProposal';

const RESPONSE_SCHEMA = `{
  "message": "string — friendly reply to the user",
  "intent": "create_workspace" | "create_project" | "create_task" | "create_plan" | "update_task" | "update_tasks" | "general",
  "status": "gathering" | "ready",
  "missingFields": ["field labels still needed"],
  "proposal": null | {
    "action": "create_workspace" | "create_project" | "create_task" | "create_plan" | "update_task" | "update_tasks",
    "taskId": "internal — server resolves; do NOT ask the user for this",
    "taskTitle": "for update_task: which task to update, matched by title from PROJECT TASKS list",
    "taskUpdates": [{ "taskTitle": "task name from PROJECT TASKS", "clearAssignee": true, "assigneeName": "...", "priority": "...", "status": "..." }],
    "allProjectTasks": "optional — true when user means ALL tasks in PROJECT TASKS (e.g. unassign all, assign all to David). Server expands; do NOT ask for individual titles",
    "workspaceId": "existing workspace mongo id (optional)",
    "projectId": "existing project mongo id (optional)",
    "workspace": { "name": "string", "description": "optional" },
    "project": { "name": "string", "description": "optional", "color": "optional color NAME like blue, green, purple — never ask user for hex" },
    "task": { "title": "...", "description": "...", "priority": "Low|Medium|High|Urgent", "status": "Todo|In Progress|Review|Done", "assigneeName": "...", "assigneeId": "..." },
    "tasks": [{ "title": "...", "description": "...", "priority": "Low|Medium|High|Urgent", "status": "Todo|In Progress|Review|Done", "assigneeName": "Alice Chen or Bob", "assigneeId": "only if roster known" }]
  }
}`;

function buildSystemPrompt(ctx: AiContextSnapshot): string {
  const lines: string[] = [
    'You are TeamFlow AI, a planning assistant for a team project management app.',
    'Help users create workspaces, projects, and tasks through conversation.',
    'Always respond with valid JSON matching this schema (no markdown fences):',
    RESPONSE_SCHEMA,
    '',
    'RULES:',
    '1. Users may ask to create workspace + project + multiple tasks in ONE message. Use action="create_plan" with workspace, project, and tasks[] filled.',
    '2. Required fields:',
    '   - create_workspace / plan.workspace: name (required), description (optional)',
    '   - create_project / plan.project: workspaceId OR new workspace in same plan, name (required), description (optional)',
    '   - create_task / plan.tasks: projectId OR new project in same plan, title per task (required); include priority, status, assigneeName when the user specifies them',
    '3. NEVER ask the user for hex color codes (#6366f1). Omit project.color or pick a color name (blue, green, purple, orange, red). Default to blue if unsure.',
    '4. If any required field is missing, set status="gathering", list missingFields, and ask in plain language.',
    '5. Only use workspaceId/projectId/assigneeId from the lists below — never invent IDs.',
    '6. ASSIGNEES: Only use names from TEAM MEMBERS below. Valid names are exactly: Alice Chen, Bob Martinez, Carol Nguyen, David Kim (for new workspaces) plus any listed with real ids. NEVER invent names like "Arnb". If user picks an invalid name, set status="gathering" and list valid names in message.',
    '7. When user asks "what names", "who can I assign", or similar — you MUST list every TEAM MEMBER name and role in the message field (numbered list). Never say you loaded data without listing the actual names.',
    '8. For new workspaces in a plan, use assigneeName from the default roster (Alice Chen, Bob Martinez, Carol Nguyen, David Kim). Leave assigneeId empty.',
    '9. For assignees in existing workspaces, set assigneeId from the roster and assigneeName for display.',
    '10. When all required fields are known and assignee names are valid, set status="ready". For multi-entity requests use action="create_plan".',
    '11. UPDATE TASK: Users identify tasks by TITLE only — NEVER ask for task ID. For ONE task use action="update_task" with taskTitle + changed fields in proposal.task (priority, status, title, description, assigneeName, clearAssignee) — do NOT use taskUpdates for update_task. For TWO OR MORE named tasks use action="update_tasks" with taskUpdates[] (one entry per task). When user says "all tasks", "every task", "unassign all", etc. use action="update_tasks" with allProjectTasks=true and the shared change in task (e.g. clearAssignee:true for unassign) — NEVER ask them to list titles when they clearly mean every task in PROJECT TASKS.',
    '11b. CREATE TASK on a project page: set proposal.projectId to CURRENT PROJECT id. CREATE PROJECT on a workspace page: set proposal.workspaceId to CURRENT WORKSPACE id.',
    '12. UNASSIGN: set clearAssignee=true on task or each taskUpdates entry. For all tasks: allProjectTasks=true + task.clearAssignee=true.',
    '13. If multiple PROJECT TASKS share the same title, set status="gathering" and ask which one (list each with status/priority to tell them apart).',
    '14. User must review before creation or update — do not claim you already saved anything.',
    '',
    `PAGE CONTEXT: ${ctx.page}`,
  ];

  if (ctx.workspace) {
    lines.push(`CURRENT WORKSPACE: id=${ctx.workspace.id}, name="${ctx.workspace.name}"`);
  }
  if (ctx.project) {
    lines.push(
      `CURRENT PROJECT: id=${ctx.project.id}, name="${ctx.project.name}", workspaceId=${ctx.project.workspaceId}`
    );
  }
  if (ctx.task) {
    lines.push(
      `CURRENT TASK: id=${ctx.task.id}, title="${ctx.task.title}", status=${ctx.task.status}, priority=${ctx.task.priority}, assignee=${ctx.task.assigneeName ?? 'none'}, description="${ctx.task.description}"`
    );
  }

  if (ctx.page === 'dashboard') {
    lines.push(
      'User opened AI from dashboard — they may create workspace, project, and/or tasks in one plan. Use create_plan when they ask for multiple things at once.'
    );
  } else if (ctx.page === 'workspace') {
    lines.push(
      'User is on a workspace page — default intent is create_project in the current workspace unless they ask for a task.'
    );
  } else if (ctx.page === 'project') {
    lines.push(
      'User is on a project page — default intent is create_task OR update_task/update_tasks by title (from PROJECT TASKS list).'
    );
  } else if (ctx.page === 'task') {
    lines.push(
      'User is on a task page — help UPDATE this task (priority, status, title, assignee) or create another task in the same project.'
    );
  }

  lines.push('', 'USER WORKSPACES (id | name | role):');
  if (ctx.workspaces.length === 0) {
    lines.push('- none');
  } else {
    for (const w of ctx.workspaces) {
      lines.push(`- ${w.id} | ${w.name} | ${w.role}`);
    }
  }

  lines.push('', 'PROJECTS (id | name | workspaceId):');
  if (ctx.projects.length === 0) {
    lines.push('- none in scope');
  } else {
    for (const p of ctx.projects) {
      lines.push(`- ${p.id} | ${p.name} | ${p.workspaceId}`);
    }
  }

  lines.push('', 'PROJECT TASKS (id | title | status | priority) — use titles for updates, never ask user for ids:');
  if (ctx.projectTasks.length === 0) {
    lines.push('- none in current project');
  } else {
    for (const t of ctx.projectTasks) {
      lines.push(`- ${t.id} | ${t.title} | ${t.status} | ${t.priority}`);
    }
  }

  lines.push('', 'TEAM MEMBERS — only these people can be assigned (id | name | role):');
  if (ctx.teamMembers.length === 0) {
    lines.push('- none');
  } else {
    for (const m of ctx.teamMembers) {
      const tag = m.isDefaultRoster ? 'auto-seeded on new workspace' : 'existing';
      lines.push(`- ${m.id} | ${m.name} | ${m.role} (${tag})`);
    }
  }

  return lines.join('\n');
}

function formatRosterList(members: AiContextSnapshot['teamMembers']): string {
  return members
    .map((m, i) => `${i + 1}. ${m.name} — ${m.role}`)
    .join('\n');
}

function userAskedForRoster(messages: AiChatMessage[]): boolean {
  const lastUser = [...messages].reverse().find((m) => m.role === 'user');
  if (!lastUser) return false;
  return /what names|who can|team member|assignee|roster|who (is|are) available|what names we have/i.test(
    lastUser.content
  );
}

function getLastUserText(messages: AiChatMessage[]): string {
  const lastUser = [...messages].reverse().find((m) => m.role === 'user');
  return lastUser?.content.toLowerCase() ?? '';
}

function userRequestedAllProjectTasks(messages: AiChatMessage[]): boolean {
  const text = getLastUserText(messages);
  return (
    /\b(all|every|each)\s+(the\s+)?tasks?\b/.test(text) ||
    /\ball\s+of\s+(the\s+)?tasks?\b/.test(text) ||
    /\bunassign\s+all\b/.test(text) ||
    /\bassign\s+all\b/.test(text) ||
    /\bupdate\s+all\s+(the\s+)?tasks?\b/.test(text)
  );
}

function userRequestedUnassign(messages: AiChatMessage[]): boolean {
  const text = getLastUserText(messages);
  return (
    /\bunassign\b/.test(text) ||
    /\bremove\s+(the\s+)?assignee/.test(text) ||
    /\bclear\s+(the\s+)?assignee/.test(text)
  );
}

type BatchTaskPatch = Omit<AiProposalTaskUpdate, 'taskTitle' | 'taskId'>;

function extractBatchUpdatePatch(
  proposal: AiProposal | null,
  messages: AiChatMessage[]
): BatchTaskPatch {
  const patch: BatchTaskPatch = {};

  if (proposal?.taskUpdates?.length === 1) {
    const { taskTitle: _t, taskId: _id, ...rest } = proposal.taskUpdates[0];
    Object.assign(patch, rest);
  } else if (proposal?.task) {
    Object.assign(patch, proposal.task);
  }

  if (userRequestedUnassign(messages)) {
    patch.clearAssignee = true;
    delete patch.assigneeName;
    delete patch.assigneeId;
  }

  return patch;
}

function hasBatchUpdatePatch(patch: BatchTaskPatch): boolean {
  return Boolean(
    patch.title !== undefined ||
      patch.description !== undefined ||
      patch.priority ||
      patch.status ||
      patch.assigneeName ||
      patch.assigneeId ||
      patch.dueDate ||
      patch.clearAssignee
  );
}

function expandAllProjectTasks(
  proposal: AiProposal | null,
  ctx: AiContextSnapshot,
  messages: AiChatMessage[]
): { proposal: AiProposal; message: string } | null {
  const wantsAll =
    proposal?.allProjectTasks === true || userRequestedAllProjectTasks(messages);
  if (!wantsAll || ctx.projectTasks.length === 0) return null;

  const patch = extractBatchUpdatePatch(proposal, messages);
  if (!hasBatchUpdatePatch(patch)) return null;

  const count = ctx.projectTasks.length;
  const expanded: AiProposal = {
    action: 'update_tasks',
    workspaceId: proposal?.workspaceId ?? ctx.project?.workspaceId ?? ctx.workspace?.id,
    projectId: proposal?.projectId ?? ctx.project?.id,
    taskUpdates: ctx.projectTasks.map((t) => ({
      taskTitle: t.title,
      taskId: t.id,
      ...patch,
    })),
  };

  let actionDesc = 'update';
  if (patch.clearAssignee) actionDesc = 'unassign';
  else if (patch.assigneeName) actionDesc = `assign to ${patch.assigneeName}`;

  return {
    proposal: expanded,
    message: `I'll ${actionDesc} all ${count} task${count === 1 ? '' : 's'} in this project. Review below and confirm.`,
  };
}

function enrichProposalFromContext(proposal: AiProposal, ctx: AiContextSnapshot): void {
  if (proposal.action === 'create_task' && !proposal.projectId) {
    proposal.projectId = ctx.project?.id ?? ctx.task?.projectId;
  }
  if (proposal.action === 'create_project' && !proposal.workspaceId && ctx.workspace?.id) {
    proposal.workspaceId = ctx.workspace.id;
  }
}

function collectProposalTasks(proposal: AiProposal) {
  if (proposal.action === 'update_tasks' && proposal.taskUpdates?.length) {
    return proposal.taskUpdates;
  }
  if (proposal.action === 'update_task' && proposal.task) {
    return [proposal.task];
  }
  if (proposal.tasks?.length) return proposal.tasks;
  if (proposal.task) return [proposal.task];
  return [];
}

function matchRosterName(
  assigneeName: string,
  roster: AiContextSnapshot['teamMembers']
): string | null {
  const search = assigneeName.toLowerCase().trim();
  const exact = roster.find((m) => m.name.toLowerCase() === search);
  if (exact) return exact.name;

  const partial = roster.find(
    (m) =>
      m.name.toLowerCase().includes(search) ||
      search.includes(m.name.split(' ')[0]?.toLowerCase() ?? '')
  );
  return partial?.name ?? null;
}

function matchTasksByTitle(
  title: string,
  projectTasks: AiContextSnapshot['projectTasks']
): AiContextSnapshot['projectTasks'] {
  const search = title.toLowerCase().trim();
  const exact = projectTasks.filter((t) => t.title.toLowerCase() === search);
  if (exact.length > 0) return exact;

  return projectTasks.filter(
    (t) =>
      t.title.toLowerCase().includes(search) || search.includes(t.title.toLowerCase())
  );
}

function formatTaskPickList(tasks: AiContextSnapshot['projectTasks']): string {
  return tasks
    .map((t, i) => `${i + 1}. "${t.title}" — ${t.status}, ${t.priority} priority`)
    .join('\n');
}

type TaskResolveResult =
  | { ok: true; taskId: string; taskTitle: string }
  | { ok: false; message: string; missingFields: string[] };

function resolveUpdateTaskTarget(
  proposal: AiProposal,
  ctx: AiContextSnapshot
): TaskResolveResult {
  const projectTasks = ctx.projectTasks;

  if (proposal.taskId) {
    const found = projectTasks.find((t) => t.id === proposal.taskId);
    if (found) {
      return { ok: true, taskId: found.id, taskTitle: found.title };
    }
  }

  const titleQuery = proposal.taskTitle?.trim();
  if (titleQuery) {
    const matches = matchTasksByTitle(titleQuery, projectTasks);
    if (matches.length === 1) {
      return { ok: true, taskId: matches[0].id, taskTitle: matches[0].title };
    }
    if (matches.length > 1) {
      return {
        ok: false,
        message: `Multiple tasks match "${titleQuery}". Which one do you mean?\n\n${formatTaskPickList(matches)}`,
        missingFields: ['taskTitle'],
      };
    }
    return {
      ok: false,
      message: `No task titled "${titleQuery}" in this project. Pick from:\n\n${formatTaskPickList(projectTasks)}`,
      missingFields: ['taskTitle'],
    };
  }

  if (ctx.task) {
    return { ok: true, taskId: ctx.task.id, taskTitle: ctx.task.title };
  }

  if (projectTasks.length === 0) {
    return {
      ok: false,
      message: 'Which task should I update? This project has no tasks yet.',
      missingFields: ['taskTitle'],
    };
  }

  return {
    ok: false,
    message: `Which task should I update? Refer to it by title, for example:\n\n${formatTaskPickList(projectTasks.slice(0, 10))}`,
    missingFields: ['taskTitle'],
  };
}

function enrichAndValidateResult(
  result: AiChatResult,
  messages: AiChatMessage[],
  ctx: AiContextSnapshot
): AiChatResult {
  const roster = ctx.teamMembers;
  let { message, status, proposal, missingFields } = result;

  if (userAskedForRoster(messages) && roster.length > 0) {
    const rosterInMessage = roster.some((m) => message.includes(m.name));
    if (!rosterInMessage) {
      message = `${message.trim()}\n\nAvailable assignees:\n${formatRosterList(roster)}`;
    }
  }

  const expandedAll = expandAllProjectTasks(proposal, ctx, messages);
  if (expandedAll) {
    proposal = expandedAll.proposal;
    message = expandedAll.message;
    status = 'ready';
    missingFields = missingFields.filter(
      (f) => f !== 'taskTitle' && f !== 'taskUpdates' && f !== 'task.assigneeName'
    );
  }

  if (proposal) {
    normalizeAiProposal(proposal);
    enrichProposalFromContext(proposal, ctx);
  }

  if (status !== 'ready' || !proposal) {
    if (userRequestedAllProjectTasks(messages) && ctx.projectTasks.length === 0) {
      return {
        ...result,
        message: ctx.project
          ? 'There are no tasks in this project yet.'
          : 'Open a project page so I know which tasks you mean.',
        status: 'gathering',
        proposal: null,
        missingFields,
      };
    }
    return { ...result, message, status, proposal, missingFields };
  }

  if (proposal.action === 'create_task' && !proposal.projectId) {
    return {
      ...result,
      message: 'Open a project page so I know where to create this task.',
      status: 'gathering',
      proposal: null,
      missingFields: [...missingFields, 'projectId'],
    };
  }

  if (proposal.action === 'create_project' && !proposal.workspaceId) {
    return {
      ...result,
      message: 'Open a workspace page so I know where to create this project.',
      status: 'gathering',
      proposal: null,
      missingFields: [...missingFields, 'workspaceId'],
    };
  }

  if (proposal.action === 'update_task') {
    const resolved = resolveUpdateTaskTarget(proposal, ctx);
    if (!resolved.ok) {
      return {
        ...result,
        message: resolved.message,
        status: 'gathering',
        proposal: null,
        missingFields: [...missingFields, ...resolved.missingFields],
      };
    }
    proposal.taskId = resolved.taskId;
    proposal.taskTitle = resolved.taskTitle;
  }

  if (proposal.action === 'update_tasks') {
    const updates = proposal.taskUpdates;
    if (!updates?.length) {
      return {
        ...result,
        message: 'Which tasks should I update? Refer to each by title.',
        status: 'gathering',
        proposal: null,
        missingFields: [...missingFields, 'taskUpdates'],
      };
    }

    for (const item of updates) {
      const resolved = resolveUpdateTaskTarget(
        { ...proposal, taskTitle: item.taskTitle, taskId: item.taskId },
        ctx
      );
      if (!resolved.ok) {
        return {
          ...result,
          message: resolved.message,
          status: 'gathering',
          proposal: null,
          missingFields: [...missingFields, ...resolved.missingFields],
        };
      }
      item.taskId = resolved.taskId;
      item.taskTitle = resolved.taskTitle;
    }
  }

  const tasks = collectProposalTasks(proposal);
  const invalidAssignees: string[] = [];

  for (const task of tasks) {
    if (!task.assigneeName?.trim()) continue;
    const matched = matchRosterName(task.assigneeName, roster);
    if (!matched) {
      invalidAssignees.push(task.assigneeName);
    } else {
      task.assigneeName = matched;
      const member = roster.find((m) => m.name === matched);
      if (member && !member.isDefaultRoster) {
        task.assigneeId = member.id;
      } else {
        delete task.assigneeId;
      }
    }
  }

  if (invalidAssignees.length > 0) {
    const unique = [...new Set(invalidAssignees)];
    return {
      ...result,
      message: `"${unique.join('", "')}" is not on the team roster. Pick from:\n\n${formatRosterList(roster)}`,
      status: 'gathering',
      proposal: null,
      missingFields: [...missingFields, 'task.assigneeName'],
    };
  }

  sanitizeAiProposal(proposal);

  return { ...result, message, proposal };
}

function parseAiResult(raw: string): AiChatResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new ApiError(502, 'AI returned invalid JSON');
  }

  const obj = parsed as Record<string, unknown>;
  const message = typeof obj.message === 'string' ? obj.message : 'I could not process that request.';
  const intent = isIntent(obj.intent) ? obj.intent : 'general';
  const status = obj.status === 'ready' ? 'ready' : 'gathering';
  const missingFields = Array.isArray(obj.missingFields)
    ? obj.missingFields.filter((f): f is string => typeof f === 'string')
    : [];

  let proposal: AiProposal | null = null;
  if (obj.proposal && typeof obj.proposal === 'object' && obj.proposal !== null) {
    proposal = obj.proposal as AiProposal;
  }

  if (status === 'ready' && !proposal) {
    return { message, intent, status: 'gathering', missingFields, proposal: null };
  }

  return { message, intent, status, missingFields, proposal };
}

function isIntent(value: unknown): value is AiChatResult['intent'] {
  return (
    value === 'create_workspace' ||
    value === 'create_project' ||
    value === 'create_task' ||
    value === 'create_plan' ||
    value === 'update_task' ||
    value === 'update_tasks' ||
    value === 'general'
  );
}

function getOpenAIClient(): OpenAI {
  if (!env.openaiApiKey) {
    throw new ApiError(503, 'AI is not configured. Set OPENAI_API_KEY on the server.');
  }
  return new OpenAI({ apiKey: env.openaiApiKey });
}

export async function chatWithAi(
  userId: string,
  messages: AiChatMessage[],
  context: AiPageContextPayload
): Promise<AiChatResult> {
  const snapshot = await buildAiContext(userId, context);
  const client = getOpenAIClient();

  const openAiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: buildSystemPrompt(snapshot) },
    ...messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  ];

  const completion = await client.chat.completions.create({
    model: env.openaiModel,
    messages: openAiMessages,
    response_format: { type: 'json_object' },
    temperature: 0.4,
    max_tokens: 2000,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new ApiError(502, 'Empty response from AI');
  }

  return enrichAndValidateResult(parseAiResult(content), messages, snapshot);
}
