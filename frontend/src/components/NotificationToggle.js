import React from 'react';
import { useNotifications } from '../hooks/useNotifications';

const NotificationToggle = () => {
  const { notificationsEnabled, enableNotifications, disableNotifications, loading } = useNotifications();

  const handleToggle = async () => {
    try {
      if (notificationsEnabled) {
        await disableNotifications();
      } else {
        await enableNotifications();
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
      // You might want to show an error message to the user here
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow">
      <div>
        <h3 className="text-lg font-medium">Push Notifications</h3>
        <p className="text-gray-500">
          {notificationsEnabled 
            ? 'You will receive notifications about new tasks and messages' 
            : 'Enable notifications to stay updated'}
        </p>
      </div>
      <button
        onClick={handleToggle}
        className={`
          relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
          transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          ${notificationsEnabled ? 'bg-blue-600' : 'bg-gray-200'}
        `}
        role="switch"
        aria-checked={notificationsEnabled}
      >
        <span
          className={`
            pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 
            transition duration-200 ease-in-out
            ${notificationsEnabled ? 'translate-x-5' : 'translate-x-0'}
          `}
        />
      </button>
    </div>
  );
};

export default NotificationToggle;
