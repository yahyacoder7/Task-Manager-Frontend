import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
import { getItem } from '../utils/storage';
import { BASE_URL } from '../constants/API';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  todoId: number;
  createdAt: string;
}

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  clearNotifications: () => void;
  dismissNotification: (id: string) => void;
  refreshNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  clearNotifications: () => {},
  dismissNotification: () => {},
  refreshNotifications: () => {},
});

let fetchInterval: ReturnType<typeof setInterval> | null = null;

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const appState = useRef(AppState.currentState);
  const isFetching = useRef(false);

  const fetchNotifications = useCallback(async () => {
    if (isFetching.current) return;
    isFetching.current = true;

    try {
      const token = await getItem('userToken');
      if (!token) {
        isFetching.current = false;
        return;
      }

      const response = await fetch(`${BASE_URL}/users/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          console.log('Notifications received:', data.length);
          const newNotifications: AppNotification[] = data.map((n: any, i: number) => ({
            id: `${n.todoId}-${n.createdAt}-${i}-${Date.now()}`,
            title: n.title || 'Task Reminder',
            message: n.message || '',
            todoId: n.todoId,
            createdAt: n.createdAt,
          }));
          setNotifications((prev) => [...newNotifications, ...prev]);
        }
      }
    } catch (err) {
      console.log('Notification fetch error:', err);
    } finally {
      isFetching.current = false;
    }
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('App resumed, fetching notifications...');
        fetchNotifications();
      }
      appState.current = nextAppState;
    });

    return () => subscription.remove();
  }, [fetchNotifications]);

  useEffect(() => {
    console.log('Starting notification polling (every 30s)...');
    fetchNotifications();

    if (fetchInterval) clearInterval(fetchInterval);

    fetchInterval = setInterval(() => {
      if (appState.current === 'active') {
        fetchNotifications();
      }
    }, 30000);

    return () => {
      if (fetchInterval) clearInterval(fetchInterval);
    };
  }, [fetchNotifications]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const refreshNotifications = useCallback(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount: notifications.length,
        clearNotifications,
        dismissNotification,
        refreshNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
