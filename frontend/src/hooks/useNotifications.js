import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import NotificationService from '../services/NotificationService';
import { app } from '../firebase';

const notificationService = new NotificationService(app);

export const useNotifications = () => {
  const { user } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check if notifications are enabled
  useEffect(() => {
    if (user?.notificationsEnabled) {
      setNotificationsEnabled(true);
    }
    setLoading(false);
  }, [user]);

  // Enable notifications
  const enableNotifications = useCallback(async () => {
    if (!user) return;
    
    try {
      await notificationService.requestPermission(user.uid);
      setNotificationsEnabled(true);
    } catch (error) {
      console.error('Error enabling notifications:', error);
      throw error;
    }
  }, [user]);

  // Disable notifications
  const disableNotifications = useCallback(async () => {
    if (!user) return;
    
    try {
      await notificationService.disableNotifications(user.uid);
      setNotificationsEnabled(false);
    } catch (error) {
      console.error('Error disabling notifications:', error);
      throw error;
    }
  }, [user]);

  // Listen for notifications when enabled
  useEffect(() => {
    if (!user || !notificationsEnabled) return;

    const unsubscribe = notificationService.onMessageReceived((payload) => {
      // Handle notification payload
      console.log('Received notification:', payload);
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user, notificationsEnabled]);

  return {
    notificationsEnabled,
    enableNotifications,
    disableNotifications,
    loading
  };
};
