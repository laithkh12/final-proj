import { create } from 'zustand';

export interface AppNotification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface NotificationState {
  notifications: AppNotification[];
  add: (type: AppNotification['type'], message: string) => void;
  remove: (id: string) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  add: (type, message) =>
    set((s) => ({
      notifications: [
        ...s.notifications,
        { id: crypto.randomUUID(), type, message },
      ],
    })),
  remove: (id) =>
    set((s) => ({
      notifications: s.notifications.filter((n) => n.id !== id),
    })),
}));
