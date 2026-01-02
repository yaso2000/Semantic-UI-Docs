import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface NotificationContextType {
  unreadMessages: number;
  refreshUnreadCount: () => Promise<void>;
  markMessagesRead: (senderId: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType>({
  unreadMessages: 0,
  refreshUnreadCount: async () => {},
  markMessagesRead: async () => {},
});

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [unreadMessages, setUnreadMessages] = useState(0);

  const refreshUnreadCount = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${API_URL}/api/messages/unread-count`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setUnreadMessages(data.unread_count);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, []);

  const markMessagesRead = useCallback(async (senderId: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      await fetch(`${API_URL}/api/messages/mark-read/${senderId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      // Refresh the count
      await refreshUnreadCount();
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, [refreshUnreadCount]);

  useEffect(() => {
    // Initial fetch
    refreshUnreadCount();

    // Poll every 30 seconds
    const interval = setInterval(refreshUnreadCount, 30000);

    return () => clearInterval(interval);
  }, [refreshUnreadCount]);

  return (
    <NotificationContext.Provider value={{ unreadMessages, refreshUnreadCount, markMessagesRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
