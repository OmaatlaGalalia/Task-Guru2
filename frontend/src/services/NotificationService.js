import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';

class NotificationService {
  constructor(firebaseApp) {
    this.messaging = getMessaging(firebaseApp);
    this.db = getFirestore(firebaseApp);
  }

  async requestPermission(userId) {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        // Get FCM token
        const token = await getToken(this.messaging, {
          vapidKey: process.env.REACT_APP_FIREBASE_VAPID_KEY
        });

        // Save token to user's document in Firestore
        await updateDoc(doc(this.db, 'users', userId), {
          fcmToken: token,
          notificationsEnabled: true
        });

        return token;
      }
      
      throw new Error('Notification permission denied');
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      throw error;
    }
  }

  onMessageReceived(callback) {
    return onMessage(this.messaging, (payload) => {
      // Create and show notification
      if (Notification.permission === 'granted') {
        const { title, body, icon } = payload.notification;
        
        new Notification(title, {
          body,
          icon: icon || '/logo192.png',
          badge: '/logo192.png',
          vibrate: [100, 50, 100]
        });
      }

      // Call the callback with the payload
      if (callback) {
        callback(payload);
      }
    });
  }

  async disableNotifications(userId) {
    try {
      await updateDoc(doc(this.db, 'users', userId), {
        notificationsEnabled: false,
        fcmToken: null
      });
    } catch (error) {
      console.error('Error disabling notifications:', error);
      throw error;
    }
  }
}

export default NotificationService;
