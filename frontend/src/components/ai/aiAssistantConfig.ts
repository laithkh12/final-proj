import type { AiPageContext, AiPageContextPayload } from '@/types';

export interface AiAssistantCopy {
  title: string;
  subtitle: string;
  greeting: string;
  hint: string;
  placeholder: string;
  capabilities: string[];
}

export function buildAiContext(page: AiPageContext, ids?: {
  workspaceId?: string;
  projectId?: string;
  taskId?: string;
}): AiPageContextPayload {
  return {
    page,
    workspaceId: ids?.workspaceId,
    projectId: ids?.projectId,
    taskId: ids?.taskId,
  };
}

export function getAiAssistantCopy(
  context: AiPageContextPayload,
  names?: { workspaceName?: string; projectName?: string }
): AiAssistantCopy {
  const base = {
    title: 'TeamFlow AI',
    subtitle: 'Your planning copilot',
  };

  switch (context.page) {
    case 'workspace':
      return {
        ...base,
        greeting: names?.workspaceName
          ? `Hi! I can help you add a **project** to **${names.workspaceName}** or plan tasks.`
          : "Hi! I can help you add a **project** to this workspace.",
        hint: 'Tell me the project name and any details. I will ask for anything else I need before creating it.',
        placeholder: 'e.g. Add a Backend API project with a short description…',
        capabilities: [
          'Create projects in this workspace',
          'Generate tasks with priorities',
          'Suggest assignees from your team roster',
        ],
      };
    case 'project':
      return {
        ...base,
        greeting: names?.projectName
          ? `Hi! I can **create tasks** or **update tasks by title** in **${names.projectName}**.`
          : 'Hi! I can create tasks or update existing ones by title in this project.',
        hint: 'Say the task title and what to change — e.g. update "API auth" to High priority and assign Bob. If two tasks share a title, I will ask which one.',
        placeholder: 'e.g. Set "first task without description" to Urgent and assign Alice…',
        capabilities: [
          'Create new tasks',
          'Update tasks by title (priority, status, assignee)',
          'Suggest assignees from your team roster',
        ],
      };
    case 'task':
      return {
        ...base,
        greeting: 'Hi! I can **update this task** or help you create more tasks in the project.',
        hint: 'Try: change priority to High, assign Bob Martinez, rename the task, or mark status as Done.',
        placeholder: 'e.g. Set priority to Urgent and assign Carol Nguyen…',
        capabilities: [
          'Update title, description, status, priority',
          'Reassign to a team member',
          'Create additional tasks in this project',
        ],
      };
    default:
      return {
        ...base,
        greeting:
          "Hi! I'm your TeamFlow AI assistant — ready to help you **plan, organize, and ship** faster.",
        hint: "Describe everything you want in one message — workspace, project, and tasks together. I'll ask only for what's missing, then you review before anything is created.",
        placeholder:
          'e.g. Create a workspace for our capstone, add a Backend API project, and break it into tasks…',
        capabilities: [
          'Create workspaces',
          'Add projects inside a workspace',
          'Generate tasks with priorities',
          'Suggest assignees from your team roster',
        ],
      };
  }
}
