import React, { useState, useEffect } from 'react';
import { doc, getDoc, collection, query, where, onSnapshot, orderBy, deleteDoc, updateDoc, serverTimestamp, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export default function ClientDashboard() {
  const [currentPage, setCurrentPage] = useState(1);
  const [tasksPerPage] = useState(3);
  const [unreadMessages, setUnreadMessages] = useState([]);

  // Mark task as completed
  const handleMarkCompleted = async (taskId) => {
    if (!window.confirm('Mark this task as completed?')) return;
    try {
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, {
        status: 'completed',
        updatedAt: serverTimestamp(),
      });
      setError(null);
    } catch (err) {
      console.error('Error marking task as completed:', err);
      setError('Failed to mark task as completed. Please try again.');
    }
  };

  // Cancel task
  const handleCancelTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to cancel this task?')) return;
    try {
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, {
        status: 'cancelled',
        updatedAt: serverTimestamp(),
      });
      setError(null);
    } catch (err) {
      console.error('Error cancelling task:', err);
      setError('Failed to cancel task. Please try again.');
    }
  };

  const { user } = useAuth();
  const [userData, setUserData] = useState(null);
  const [postedTasks, setPostedTasks] = useState([]);
  const [applications, setApplications] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profileImageError, setProfileImageError] = useState(false);

  // Listen for new applications
  // Listen for new applications and messages
  useEffect(() => {
    if (!user) return;

    // Listen for new applications
    const applicationsQuery = query(
      collection(db, 'applications'),
      where('clientId', '==', user.uid),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeApplications = onSnapshot(applicationsQuery, async (snapshot) => {
      // Process applications and fetch tasker details if needed
      const notificationsWithDetails = await Promise.all(snapshot.docs.map(async applicationDoc => {
        const applicationData = applicationDoc.data();
        let taskerName = applicationData.taskerName;
        
        // If tasker name is missing, try to fetch it from the users collection
        if (!taskerName && applicationData.taskerId) {
          try {
            // Get the tasker document
            const taskerDoc = await getDoc(doc(db, 'users', applicationData.taskerId));
            
            if (taskerDoc.exists()) {
              const taskerData = taskerDoc.data();
              
              // Use the most specific name available
              if (taskerData.firstName && taskerData.lastName) {
                taskerName = `${taskerData.firstName} ${taskerData.lastName}`;
              } else if (taskerData.displayName) {
                taskerName = taskerData.displayName;
              } else if (taskerData.email) {
                taskerName = taskerData.email;
              }
              
              // Update the application with the tasker name for future reference
              // This ensures the name is available without needing to look it up again
              await updateDoc(applicationDoc.ref, {
                taskerName: taskerName
              });
            }
          } catch (error) {
            console.error('Error fetching tasker details:', error);
          }
        }
        
        // Get task title if not already included
        let taskTitle = applicationData.taskTitle;
        if (!taskTitle && applicationData.taskId) {
          try {
            const taskDoc = await getDoc(doc(db, 'tasks', applicationData.taskId));
            if (taskDoc.exists()) {
              taskTitle = taskDoc.data().title;
            }
          } catch (error) {
            console.error('Error fetching task details:', error);
          }
        }
        
        return {
          id: applicationDoc.id,
          type: 'application',
          ...applicationData,
          taskerName: taskerName || 'Unknown Tasker', // Fallback if still no name
          taskTitle: taskTitle || 'Your task',        // Fallback if still no title
          createdAt: applicationData.createdAt?.toDate()
        };
      }));
      
      setNotifications(notificationsWithDetails);
      console.log('Applications with details:', notificationsWithDetails); // Debug log
    });
    
    // Listen for chats with unread messages
    const chatsQuery = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid),
      orderBy('updatedAt', 'desc')
    );
    
    const unsubscribeMessages = onSnapshot(chatsQuery, async (snapshot) => {
      // Process chats to get unread message information
      const unreadMessagesData = await Promise.all(snapshot.docs.map(async chatDoc => {
        const chatData = chatDoc.data();
        const chatId = chatDoc.id;
        
        // Skip chats with no unread messages
        if (!chatData.unreadCount || chatData.unreadCount <= 0) {
          return null;
        }
        
        // Get the other user's information
        const otherUserId = chatData.participants.find(id => id !== user.uid);
        let senderName = 'Someone';
        
        if (otherUserId) {
          try {
            const userDoc = await getDoc(doc(db, 'users', otherUserId));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              if (userData.firstName && userData.lastName) {
                senderName = `${userData.firstName} ${userData.lastName}`;
              } else if (userData.displayName) {
                senderName = userData.displayName;
              } else if (userData.email) {
                senderName = userData.email;
              }
            }
          } catch (error) {
            console.error('Error fetching sender details:', error);
          }
        }
        
        // Get the last message text
        const lastMessage = chatData.lastMessage || {};
        
        return {
          id: chatId,
          type: 'message',
          senderId: otherUserId,
          senderName,
          text: lastMessage.text || 'New message',
          unreadCount: chatData.unreadCount,
          createdAt: chatData.updatedAt?.toDate() || new Date(),
          taskId: chatData.taskId // Include task ID if available
        };
      }));
      
      // Filter out null values (chats with no unread messages)
      const filteredMessages = unreadMessagesData.filter(message => message !== null);
      
      setUnreadMessages(filteredMessages);
      console.log('Unread messages:', filteredMessages); // Debug log
    });

    return () => {
      unsubscribeApplications();
      unsubscribeMessages();
    };
  }, [user]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        // Fetch user data
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }

        // Set up real-time listener for tasks
        const tasksQuery = query(
          collection(db, 'tasks'),
          where('clientId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );

        // Set up real-time listener for tasks
        const unsubscribeTasks = onSnapshot(tasksQuery, async (snapshot) => {
          const tasks = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate()
          }));
          setPostedTasks(tasks);

          // Fetch applications for each task
          const applicationsMap = {};
          for (const task of tasks) {
            try {
              const applicationsQuery = query(
                collection(db, 'applications'),
                where('taskId', '==', task.id),
                orderBy('createdAt', 'desc')
              );
              const applicationsSnapshot = await getDocs(applicationsQuery);
              applicationsMap[task.id] = applicationsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate()
              }));
            } catch (appErr) {
              // If fetching applications fails (e.g., permissions), skip this task's applications
              console.warn('Skipping applications for task', task.id, appErr);
              applicationsMap[task.id] = [];
            }
          }
          setApplications(applicationsMap);
          
          setLoading(false);
        }, (error) => {
          // Only set error if the entire onSnapshot fails
          console.error('Error fetching tasks:', error);
          setError('Failed to load tasks. Please try again.');
          setLoading(false);
        });

        // Cleanup subscription on unmount
        return () => unsubscribeTasks();
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      return;
    }

    try {
      // Delete all applications for this task FIRST
      const applicationsQuery = query(
        collection(db, 'applications'),
        where('taskId', '==', taskId)
      );
      const applicationsSnapshot = await getDocs(applicationsQuery);
      const deletePromises = applicationsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      // Then delete the task itself
      await deleteDoc(doc(db, 'tasks', taskId));
      // Optimistically remove the task and its applications from state
      setPostedTasks(prev => prev.filter(task => task.id !== taskId));
      setApplications(prev => {
        const newApps = { ...prev };
        delete newApps[taskId];
        return newApps;
      });
      setError(null); // Clear error after successful delete
    } catch (err) {
      console.error('Error deleting task:', err);
      setError('Failed to delete task. Please try again.');
    }
  };

  const handleAcceptApplication = async (taskId, application) => {
    if (!window.confirm('Accept this application?')) return;

    let taskerData = null;
    try {
      // Get tasker's full details
      const taskerDoc = await getDoc(doc(db, 'users', application.taskerId));
      if (!taskerDoc.exists()) {
        throw new Error('Tasker not found');
      }
      taskerData = taskerDoc.data();
      console.log('Tasker data:', taskerData); // Debug log

      // Update application status
      const applicationRef = doc(db, 'applications', application.id);
      await updateDoc(applicationRef, {
        status: 'accepted',
        updatedAt: serverTimestamp()
      });

      // Update task status and assign tasker
      const taskRef = doc(db, 'tasks', taskId);
      // Compose tasker name from profile
      let taskerName = 'Unknown Tasker';
      if (taskerData.firstName && taskerData.lastName) {
        taskerName = `${taskerData.firstName} ${taskerData.lastName}`;
      } else if (taskerData.displayName) {
        taskerName = taskerData.displayName;
      } else if (taskerData.email) {
        taskerName = taskerData.email;
      }
      const updateTaskerData = {
        status: 'assigned',
        taskerId: application.taskerId,
        taskerName,
        updatedAt: serverTimestamp()
      };
      if (taskerData.email) {
        updateTaskerData.taskerEmail = taskerData.email;
      }
      await updateDoc(taskRef, updateTaskerData);

      // Reject other applications for this task
      const otherApplicationsQuery = query(
        collection(db, 'applications'),
        where('taskId', '==', taskId),
        where('status', '==', 'pending')
      );
      
      const otherApplications = await getDocs(otherApplicationsQuery);
      const batch = writeBatch(db);
      
      otherApplications.docs.forEach(doc => {
        if (doc.id !== application.id) {
          batch.update(doc.ref, { 
            status: 'rejected',
            updatedAt: serverTimestamp()
          });
        }
      });
      
      await batch.commit();

      setError(null);
      alert('Tasker assigned successfully!');
    } catch (err) {
      console.error('Error accepting application:', err);
      setError('Failed to accept application: ' + err.message);
    }
    try {
      // Update task with tasker information
      const taskRef = doc(db, 'tasks', taskId);
      // Compose tasker name from profile
      let taskerName = 'Unknown Tasker';
      if (taskerData && taskerData.firstName && taskerData.lastName) {
        taskerName = `${taskerData.firstName} ${taskerData.lastName}`;
      } else if (taskerData && taskerData.displayName) {
        taskerName = taskerData.displayName;
      } else if (taskerData && taskerData.email) {
        taskerName = taskerData.email;
      }
      const updateTaskData = {
        status: 'assigned',
        taskerId: application.taskerId,
        taskerName,
        updatedAt: serverTimestamp()
      };
      if (taskerData && taskerData.email) {
        updateTaskData.taskerEmail = taskerData.email;
      }
      await updateDoc(taskRef, updateTaskData);

      // Update application status
      const applicationRef = doc(db, 'applications', application.id);
      await updateDoc(applicationRef, {
        status: 'accepted',
        updatedAt: serverTimestamp()
      });

      // Update other applications as rejected
      const otherApplicationsQuery = query(
        collection(db, 'applications'),
        where('taskId', '==', taskId),
        where('id', '!=', application.id)
      );
      const otherApplicationsSnapshot = await getDocs(otherApplicationsQuery);
      const updatePromises = otherApplicationsSnapshot.docs.map(doc =>
        updateDoc(doc.ref, {
          status: 'rejected',
          updatedAt: serverTimestamp()
        })
      );
      await Promise.all(updatePromises);
    } catch (err) {
      console.error('Error accepting application:', err);
      setError('Failed to accept application. Please try again.');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return 'bg-yellow-100 text-yellow-800';
      case 'assigned':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center gap-4 mb-2">
          <div className="relative">
            <img
              src={profileImageError ? '/images/default-avatar.svg' : (userData?.photoURL || '/images/default-avatar.svg')}
              alt="Profile"
              className="w-16 h-16 rounded-full object-cover border"
              style={{ marginRight: '1rem' }}
              onError={(e) => {
                console.log('Dashboard image error. URL:', userData?.photoURL);
                setProfileImageError(true);
                e.target.src = '/images/default-avatar.svg';
              }}
            />
            <a
              href="/profile"
              className="absolute bottom-0 right-0 bg-blue-600 text-white p-1 rounded-full hover:bg-blue-700 transition-colors"
              title="Edit Profile"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </a>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">
            Hello, {userData?.firstName || 'Client'}!
          </h1>
          <button
            onClick={() => window.location.href = '/profile'}
            className="ml-auto px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Edit Profile
          </button>
        </div>
        <p className="text-gray-600 mt-2">
          Manage your tasks and find the perfect tasker for your needs.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Post a New Task</h3>
          <p className="text-blue-600 mb-4">Create a new task and find taskers.</p>
          <Link
            to="/post-task"
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Post Task
          </Link>
        </div>
        <div className="bg-green-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-800 mb-2">Active Tasks</h3>
          <p className="text-green-600 mb-4">
            {postedTasks.filter(task => ['open', 'assigned', 'in_progress'].includes(task.status)).length} tasks in progress
          </p>
        </div>
        <div className="bg-purple-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-purple-800 mb-2">Completed Tasks</h3>
          <p className="text-purple-600 mb-4">
            {postedTasks.filter(task => task.status === 'completed').length} tasks completed
          </p>
        </div>
      </div>

      {/* Notifications Panel - Always displayed */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Notifications</h2>
        <div className="space-y-3">
          {/* Application notifications */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <h3 className="text-blue-800 font-medium mb-2 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Applications {notifications.length > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                  {notifications.length} new
                </span>
              )}
            </h3>
            {notifications.length > 0 ? (
              <>
                <ul className="space-y-3">
                  {notifications.slice(0, 3).map(notification => (
                    <li key={notification.id} className="bg-white rounded-lg shadow-sm p-3 border-l-4 border-blue-500 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium text-blue-800">{notification.taskerName}</span>
                        <span className="text-xs text-gray-500">{notification.createdAt?.toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">
                        Applied to <span className="font-medium">"{notification.taskTitle || 'Your task'}"</span>
                      </p>
                      <div className="flex justify-end">
                        <Link
                          to={`/task/${notification.taskId}`}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center mr-3"
                        >
                          View Task
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </Link>
                        <Link
                          to={`/applications/${notification.id}`}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                        >
                          Review
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
                {notifications.length > 3 && (
                  <div className="mt-3 text-center">
                    <Link to="/applications" className="text-sm text-blue-600 hover:text-blue-800 font-medium inline-flex items-center">
                      View all {notifications.length} applications
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </Link>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500">No new applications at the moment.</p>
                <Link to="/applications" className="text-sm text-blue-600 hover:text-blue-800 font-medium mt-2 inline-block">
                  View all applications
                </Link>
              </div>
            )}
          </div>
          
          {/* Message notifications */}
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <h3 className="text-green-800 font-medium mb-2 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              Messages {unreadMessages.length > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                  {unreadMessages.length} new
                </span>
              )}
            </h3>
            {unreadMessages.length > 0 ? (
              <>
                <ul className="space-y-3">
                  {unreadMessages.slice(0, 3).map(message => (
                    <li key={message.id} className="bg-white rounded-lg shadow-sm p-3 border-l-4 border-green-500 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium text-green-800">{message.senderName || 'Someone'}</span>
                        <span className="text-xs text-gray-500">{message.createdAt?.toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2 line-clamp-2">{message.text}</p>
                      <div className="flex justify-between items-center">
                        {message.unreadCount > 1 && (
                          <span className="text-xs text-gray-500">{message.unreadCount} unread messages</span>
                        )}
                        <Link
                          to={`/messages/${message.id}`}
                          className="text-green-600 hover:text-green-800 text-sm font-medium flex items-center"
                        >
                          Read
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
                {unreadMessages.length > 3 && (
                  <div className="mt-3 text-center">
                    <Link to="/messages" className="text-sm text-green-600 hover:text-green-800 font-medium inline-flex items-center">
                      View all {unreadMessages.length} messages
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </Link>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500">No unread messages at the moment.</p>
                <Link to="/messages" className="text-sm text-green-600 hover:text-green-800 font-medium mt-2 inline-block">
                  View all messages
                </Link>
              </div>
            )}
          </div>
          
          {/* Link to all messages */}
          <div className="text-right mt-2">
            <Link
              to="/messages"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              View all messages →
            </Link>
          </div>
        </div>
      </div>
      
      {/* Tasks List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Your Tasks</h2>
          <Link
            to="/post-task"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            + New Task
          </Link>
        </div>

        {postedTasks.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Task
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Applications
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {/* Get current tasks for pagination */}
                  {postedTasks
                    .slice((currentPage - 1) * tasksPerPage, currentPage * tasksPerPage)
                    .map((task) => (
                      <tr key={task.id} className="hover:bg-gray-50">
                    {/* Task Column - Title and Description */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <div className="text-sm font-medium text-gray-900">{task.title}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs" title={task.description}>
                          {task.description.length > 50 ? `${task.description.substring(0, 50)}...` : task.description}
                        </div>
                      </div>
                    </td>
                    
                    {/* Details Column - Category, Budget, Location, Deadline */}
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">
                        <div><span className="font-medium">Category:</span> {task.category}</div>
                        <div><span className="font-medium">Budget:</span> BWP {task.budget}</div>
                        <div><span className="font-medium">Location:</span> {task.location}</div>
                        <div><span className="font-medium">Deadline:</span> {new Date(task.deadline).toLocaleDateString()}</div>
                        <div><span className="font-medium">Posted:</span> {task.createdAt?.toLocaleDateString()}</div>
                      </div>
                    </td>
                    
                    {/* Status Column */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-sm capitalize ${getStatusColor(task.status)}`}>
                        {task.status.replace('_', ' ')}
                      </span>
                      {task.taskerId && (
                        <div className="mt-2 text-xs text-gray-500">
                          <div>Assigned to: {task.taskerName}</div>
                          <div>Email: {task.taskerEmail}</div>
                        </div>
                      )}
                    </td>

                    {/* Applications Column */}
                    <td className="px-6 py-4">
                      {/* New application notifications */}
                      {notifications.filter(n => n.taskId === task.id).length > 0 && (
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                          <h4 className="text-blue-800 font-medium mb-2 text-sm">New Applications ({notifications.filter(n => n.taskId === task.id).length})</h4>
                          {notifications
                            .filter(n => n.taskId === task.id)
                            .map(notification => (
                              <div key={notification.id} className="flex items-center justify-between py-2 border-b border-blue-100 last:border-0">
                                <div>
                                  <p className="text-sm text-blue-900">
                                    <span className="font-medium">{notification.taskerName}</span>
                                  </p>
                                  <p className="text-xs text-blue-700">
                                    {notification.createdAt?.toLocaleString()}
                                  </p>
                                </div>
                                <button
                                  onClick={() => handleAcceptApplication(task.id, notification)}
                                  className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                                >
                                  Accept
                                </button>
                              </div>
                            ))
                          }
                        </div>
                      )}

                      {/* Regular applications */}
                      {task.status === 'open' && (
                        <div>
                          <h4 className="font-medium text-gray-700 text-sm">Applications ({applications[task.id]?.length || 0})</h4>
                          {applications[task.id]?.length > 0 ? (
                            <div className="mt-2 space-y-2">
                              {applications[task.id].map(application => (
                                <div key={application.id} className="text-sm p-2 border rounded bg-gray-50">
                                  <p><span className="font-medium">Tasker:</span> {application.taskerName}</p>
                                  <p><span className="font-medium">Email:</span> {application.taskerEmail}</p>
                                  {application.message && (
                                    <p><span className="font-medium">Message:</span> {application.message}</p>
                                  )}
                                  <div className="mt-2 flex justify-end">
                                    <button
                                      onClick={() => handleAcceptApplication(task.id, application)}
                                      className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                                    >
                                      Assign Tasker
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">No applications yet</p>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Actions Column */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex flex-col space-y-2">
                        {/* Actions for open tasks */}
                        {task.status === 'open' && (
                          <>
                            <Link
                              to={`/edit-task/${task.id}`}
                              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                            >
                              Edit Task
                            </Link>
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                            >
                              Delete
                            </button>
                            <button
                              onClick={() => handleCancelTask(task.id)}
                              className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
                            >
                              Cancel
                            </button>
                          </>
                        )}

                        {/* Actions for assigned/in-progress tasks */}
                        {['assigned', 'in_progress'].includes(task.status) && (
                          <>
                            <button
                              onClick={() => handleMarkCompleted(task.id)}
                              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                            >
                              Mark Completed
                            </button>
                            <button
                              onClick={() => handleCancelTask(task.id)}
                              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                            >
                              Cancel Task
                            </button>
                            {task.taskerId && (
                              <Link
                                to={`/chat/${task.id}/${task.taskerId}`}
                                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                              >
                                Message Tasker
                              </Link>
                            )}
                          </>
                        )}

                        {/* Actions for completed tasks */}
                        {task.status === 'completed' && (
                          <>
                            <p className="text-green-700 font-semibold">Task Completed</p>
                            {task.paymentStatus !== 'paid' && (
                              <Link
                                to={`/pay/${task.id}`}
                                className="px-3 py-1 bg-blue-700 text-white text-sm rounded hover:bg-blue-800 transition-colors"
                              >
                                Pay Now
                              </Link>
                            )}
                            <Link
                              to={`/review/${task.id}/${task.taskerId}`}
                              className="px-3 py-1 bg-yellow-500 text-white text-sm rounded hover:bg-yellow-600 transition-colors"
                            >
                              Leave Review
                            </Link>
                          </>
                        )}

                        {/* Status for cancelled tasks */}
                        {task.status === 'cancelled' && (
                          <p className="text-red-700 font-semibold">Task Cancelled</p>
                        )}
                      </div>
                    </td>
                  </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Controls */}
            <div className="flex justify-between items-center mt-6">
              <div className="text-sm text-gray-500">
                Showing {Math.min((currentPage - 1) * tasksPerPage + 1, postedTasks.length)} to {Math.min(currentPage * tasksPerPage, postedTasks.length)} of {postedTasks.length} tasks
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border rounded bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(postedTasks.length / tasksPerPage)))}
                  disabled={currentPage >= Math.ceil(postedTasks.length / tasksPerPage)}
                  className="px-4 py-2 border rounded bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks yet</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new task.</p>
            <div className="mt-6">
              <Link
                to="/post-task"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                + New Task
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
