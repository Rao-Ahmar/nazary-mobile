import { create } from 'zustand';
import type { AppNotification } from '../types';
import { notificationsApi } from '../api/notifications';

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
  fcmToken: string | null;
  isLoading: boolean;
  currentPage: number;
  totalPages: number;

  fetchNotifications: (page?: number) => Promise<void>;
  markAsRead: (id: string) => void;
  markAllRead: () => void;
  setFcmToken: (token: string) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  fcmToken: null,
  isLoading: false,
  currentPage: 1,
  totalPages: 1,

  fetchNotifications: async (page = 1) => {
    set({ isLoading: true });
    try {
      const response = await notificationsApi.getAll(page);
      const resData = response.data as any;
      const items: AppNotification[] = resData?.data ?? resData ?? [];
      const meta = resData?.meta ?? {};

      set({
        notifications: page === 1 ? items : [...get().notifications, ...items],
        unreadCount: meta.unreadCount ?? items.filter((n: AppNotification) => !n.read).length,
        currentPage: meta.currentPage ?? page,
        totalPages: meta.totalPages ?? 1,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  markAsRead: (id) => {
    notificationsApi.markRead(id).catch(() => {});
    set((state) => {
      const notifications = state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n,
      );
      return {
        notifications,
        unreadCount: notifications.filter((n) => !n.read).length,
      };
    });
  },

  markAllRead: () => {
    notificationsApi.readAll().catch(() => {});
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }));
  },

  setFcmToken: (token) => set({ fcmToken: token }),
}));
