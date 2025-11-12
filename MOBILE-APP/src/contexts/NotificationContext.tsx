import React, { createContext, useContext, useState } from 'react';
import { notificationAPI } from '../services/apiService';

type NotificationRecord = any;

interface NotificationContextValue {
  notifications: NotificationRecord[];
  loading: boolean;
  fetchNotifications: (limit?: number, offset?: number) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async (limit = 20, offset = 0) => {
    setLoading(true);
    try {
      const res = await notificationAPI.getNotifications({ limit, offset });
      if (res && (res as any).success) {
        setNotifications((res as any).data || []);
      }
    } catch (err) {
      console.debug('Fetch notifications error', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <NotificationContext.Provider value={{ notifications, loading, fetchNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
};

export default NotificationContext;
