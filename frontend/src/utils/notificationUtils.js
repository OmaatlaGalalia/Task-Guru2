import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../firebase';

const functions = getFunctions(app);

// Send notification to a specific user
export const sendNotification = async (userId, notification) => {
  try {
    const sendNotificationFn = httpsCallable(functions, 'sendNotification');
    const result = await sendNotificationFn({ userId, notification });
    return result.data;
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
};

// Send notification to multiple users
export const sendBulkNotifications = async (userIds, notification) => {
  try {
    const sendBulkNotificationsFn = httpsCallable(functions, 'sendBulkNotifications');
    const result = await sendBulkNotificationsFn({ userIds, notification });
    return result.data;
  } catch (error) {
    console.error('Error sending bulk notifications:', error);
    throw error;
  }
};

// Create a notification object
export const createNotification = (title, body, data = {}) => ({
  title,
  body,
  data: {
    ...data,
    timestamp: new Date().toISOString()
  }
});
