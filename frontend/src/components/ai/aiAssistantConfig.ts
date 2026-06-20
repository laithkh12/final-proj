export type AiAssistantContext = 'dashboard';

export interface AiAssistantCopy {
  title: string;
  subtitle: string;
  greeting: string;
  hint: string;
  placeholder: string;
  capabilities: string[];
}

export function getAiAssistantCopy(): AiAssistantCopy {
  return {
    title: 'TeamFlow AI',
    subtitle: 'Your planning copilot',
    greeting:
      "Hi! I'm your TeamFlow AI assistant — ready to help you **plan, organize, and ship** faster.",
    hint: "Describe what you want to accomplish in plain language. I'll help you generate workspaces, projects, and tasks — complete with priorities and assignees — then you can review everything before it's created.",
    placeholder:
      'e.g. Create a workspace for our capstone, add a Backend API project, and break it into tasks with assignees…',
    capabilities: [
      'Create workspaces',
      'Add projects inside a workspace',
      'Generate tasks with priorities',
      'Suggest assignees from your team roster',
    ],
  };
}
