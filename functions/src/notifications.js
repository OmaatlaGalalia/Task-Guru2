const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Send notification to a single user
exports.sendNotification = functions.https.onCall(async (data, context) => {
  // Check if the user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'You must be authenticated to send notifications.'
    );
  }

  const { userId, notification } = data;

  try {
    // Get the user's FCM token
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    const fcmToken = userDoc.data()?.fcmToken;

    if (!fcmToken) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'User has not enabled notifications.'
      );
    }

    // Send the notification
    await admin.messaging().send({
      token: fcmToken,
      notification: {
        title: notification.title,
        body: notification.body
      },
      data: notification.data
    });

    // Save notification to Firestore
    await admin.firestore().collection('notifications').add({
      userId,
      ...notification,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      read: false
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending notification:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Send notifications to multiple users
exports.sendBulkNotifications = functions.https.onCall(async (data, context) => {
  // Check if the user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'You must be authenticated to send notifications.'
    );
  }

  const { userIds, notification } = data;

  try {
    // Get FCM tokens for all users
    const usersSnapshot = await admin.firestore()
      .collection('users')
      .where('uid', 'in', userIds)
      .get();

    const tokens = [];
    const notifications = [];

    usersSnapshot.forEach(doc => {
      const fcmToken = doc.data()?.fcmToken;
      if (fcmToken) {
        tokens.push(fcmToken);
        notifications.push({
          userId: doc.id,
          ...notification,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          read: false
        });
      }
    });

    if (tokens.length === 0) {
      return { success: true, sent: 0 };
    }

    // Send notifications
    const response = await admin.messaging().sendMulticast({
      tokens,
      notification: {
        title: notification.title,
        body: notification.body
      },
      data: notification.data
    });

    // Save notifications to Firestore
    await Promise.all(
      notifications.map(notif =>
        admin.firestore().collection('notifications').add(notif)
      )
    );

    return {
      success: true,
      sent: response.successCount,
      failed: response.failureCount
    };
  } catch (error) {
    console.error('Error sending bulk notifications:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Trigger notification when a new message is created
exports.onNewMessage = functions.firestore
  .document('messages/{messageId}')
  .onCreate(async (snap, context) => {
    const message = snap.data();
    const recipientId = message.recipientId;

    try {
      // Get recipient's FCM token
      const recipientDoc = await admin.firestore()
        .collection('users')
        .doc(recipientId)
        .get();

      const fcmToken = recipientDoc.data()?.fcmToken;
      if (!fcmToken) return;

      // Get sender's name
      const senderDoc = await admin.firestore()
        .collection('users')
        .doc(message.senderId)
        .get();

      const senderName = senderDoc.data()?.displayName || 'Someone';

      // Send notification
      await admin.messaging().send({
        token: fcmToken,
        notification: {
          title: 'New Message',
          body: `${senderName} sent you a message`
        },
        data: {
          type: 'message',
          messageId: context.params.messageId,
          senderId: message.senderId
        }
      });
    } catch (error) {
      console.error('Error sending message notification:', error);
    }
  });
