import { create } from 'zustand';
import type { Project, Workspace } from '@/types';

interface WorkspaceState {
  activeWorkspace: Workspace | null;
  activeProject: Project | null;
  setActiveWorkspace: (ws: Workspace | null) => void;
  setActiveProject: (project: Project | null) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  activeWorkspace: null,
  activeProject: null,
  setActiveWorkspace: (activeWorkspace) => set({ activeWorkspace }),
  setActiveProject: (activeProject) => set({ activeProject }),
}));
