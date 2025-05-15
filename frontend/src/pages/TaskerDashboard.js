import React, { useState, useEffect } from 'react';
import { doc, getDoc, collection, query, where, getDocs, onSnapshot, orderBy, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export default function TaskerDashboard() {
  const { user } = useAuth();
  const [userData, setUserData] = useState(null);
  const [assignedTasks, setAssignedTasks] = useState([]);
  const [earnings, setEarnings] = useState({ total: 0, thisMonth: 0 });
  const [loading, setLoading] = useState(true);
  const [unreadMessages, setUnreadMessages] = useState([]);
  const [acceptedApplications, setAcceptedApplications] = useState([]);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  
  // Function to mark an application as seen
  const markApplicationSeen = async (applicationId) => {
    try {
      const applicationRef = doc(db, 'applications', applicationId);
      await updateDoc(applicationRef, {
        notificationSeen: true
      });
      console.log('Application marked as seen:', applicationId);
      
      // Update the local state to remove this notification
      setAcceptedApplications(prev => prev.filter(app => app.id !== applicationId));
    } catch (error) {
      console.error('Error marking application as seen:', error);
    }
  };
  
  // Function to handle task status update and send notification to client
  const handleUpdateTaskStatus = async (newStatus) => {
    if (!selectedTask) return;
    
    setUpdatingStatus(true);
    setStatusMessage('');
    
    try {
      const taskRef = doc(db, 'tasks', selectedTask.id);
      const taskData = {
        status: newStatus,
        updatedAt: new Date()
      };
      
      // If task is being marked as completed, add completedAt timestamp
      if (newStatus === 'completed') {
        taskData.completedAt = new Date();
      }
      
      // Update task status
      await updateDoc(taskRef, taskData);
      
      // Create notification for the client
      const notificationRef = collection(db, 'notifications');
      await addDoc(notificationRef, {
        userId: selectedTask.clientId,
        taskId: selectedTask.id,
        taskTitle: selectedTask.title,
        message: `Your task '${selectedTask.title}' has been marked as ${newStatus} by the tasker.`,
        type: 'task_status_update',
        status: newStatus,
        createdAt: new Date(),
        read: false
      });
      
      // Update local state
      setAssignedTasks(prev => 
        prev.map(task => 
          task.id === selectedTask.id ? { ...task, status: newStatus } : task
        )
      );
      
      setStatusMessage(`Task status updated to ${newStatus} successfully!`);
      
      // Close modal after a delay
      setTimeout(() => {
        setShowStatusModal(false);
        setSelectedTask(null);
      }, 1500);
    } catch (error) {
      console.error('Error updating task status:', error);
      setStatusMessage(`Error: ${error.message}`);
    } finally {
      setUpdatingStatus(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        // Fetch user data
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }

        // Fetch tasks assigned to the tasker
        const tasksQuery = query(
          collection(db, 'tasks'),
          where('taskerId', '==', user.uid)
        );
        const taskSnapshot = await getDocs(tasksQuery);
        const tasks = taskSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setAssignedTasks(tasks);

        // Calculate earnings
        const totalEarnings = tasks
          .filter(task => task.status === 'completed')
          .reduce((sum, task) => sum + (task.payment || 0), 0);

        const thisMonth = new Date().getMonth();
        const thisYear = new Date().getFullYear();
        const monthlyEarnings = tasks
          .filter(task => {
            const taskDate = task.completedAt ? new Date(task.completedAt) : null;
            return task.status === 'completed' &&
                   taskDate &&
                   taskDate.getMonth() === thisMonth &&
                   taskDate.getFullYear() === thisYear;
          })
          .reduce((sum, task) => sum + (task.payment || 0), 0);

        setEarnings({
          total: totalEarnings,
          thisMonth: monthlyEarnings
        });
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Set up listeners for real-time notifications
    if (user) {
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
        console.log('Tasker unread messages:', filteredMessages);
      });
      
      // Listen for accepted applications
      const applicationsQuery = query(
        collection(db, 'applications'),
        where('taskerId', '==', user.uid),
        where('status', '==', 'accepted'),
        where('notificationSeen', '==', false),
        orderBy('updatedAt', 'desc')
      );
      
      const unsubscribeApplications = onSnapshot(applicationsQuery, async (snapshot) => {
        // Process applications to get details
        const acceptedAppsData = await Promise.all(snapshot.docs.map(async doc => {
          const applicationData = doc.data();
          let clientName = applicationData.clientName;
          let taskTitle = applicationData.taskTitle;
          
          // If client name is missing, try to fetch it
          if (!clientName && applicationData.clientId) {
            try {
              const clientDoc = await getDoc(doc(db, 'users', applicationData.clientId));
              if (clientDoc.exists()) {
                const clientData = clientDoc.data();
                if (clientData.firstName && clientData.lastName) {
                  clientName = `${clientData.firstName} ${clientData.lastName}`;
                } else if (clientData.displayName) {
                  clientName = clientData.displayName;
                } else if (clientData.email) {
                  clientName = clientData.email;
                }
              }
            } catch (error) {
              console.error('Error fetching client details:', error);
            }
          }
          
          // If task title is missing, try to fetch it
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
            id: doc.id,
            type: 'application',
            ...applicationData,
            clientName: clientName || 'A client',
            taskTitle: taskTitle || 'A task',
            updatedAt: applicationData.updatedAt?.toDate() || new Date()
          };
        }));
        
        setAcceptedApplications(acceptedAppsData);
        console.log('Accepted applications:', acceptedAppsData);
      });
      
      return () => {
        unsubscribeMessages();
        unsubscribeApplications();
      };
    }
  }, [user]);

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
        <div className="flex items-start gap-6">
          <div className="relative">
            <img
              src={userData?.photoURL || '/images/default-avatar.svg'}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover border-2 border-blue-500"
              onError={(e) => {
                if (e.target.src !== window.location.origin + '/images/default-avatar.svg') {
                  e.target.src = '/images/default-avatar.svg';
                }
              }}
            />
            <a
              href="/profile"
              className="absolute bottom-0 right-0 bg-blue-600 text-white p-1 rounded-full hover:bg-blue-700 transition-colors"
              title="Edit Profile"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </a>
          </div>
          <div className="flex-1">
            <div className="flex flex-row justify-between items-start w-full">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  Hello, {userData?.firstName || 'Tasker'}!
                </h1>
                <p className="text-gray-600 mt-1">{userData?.bio || 'Add a bio to tell clients about yourself'}</p>
              </div>
              <a
                href="/profile"
                className="ml-8 bg-blue-600 text-white py-2 px-6 rounded hover:bg-blue-700 text-center font-medium transition-colors"
                style={{ minWidth: 140 }}
              >
                Edit Profile
              </a>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <div className="text-sm text-gray-600 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {userData?.address || 'Add your location'}
              </div>
              <div className="text-sm text-gray-600 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {userData?.phone || 'Add your phone number'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications Panel */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Notifications</h2>
        <div className="space-y-3">
          {/* Accepted Applications notifications */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <h3 className="text-blue-800 font-medium mb-2 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Application Updates {acceptedApplications.length > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                  {acceptedApplications.length} new
                </span>
              )}
            </h3>
            {acceptedApplications.length > 0 ? (
              <>
                <ul className="space-y-3">
                  {acceptedApplications.slice(0, 3).map(application => (
                    <li key={application.id} className="bg-white rounded-lg shadow-sm p-3 border-l-4 border-green-500 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium text-green-800">{application.clientName}</span>
                        <span className="text-xs text-gray-500">{application.updatedAt?.toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">
                        Accepted your application for <span className="font-medium">"{application.taskTitle || 'a task'}"</span>
                      </p>
                      <div className="flex justify-end">
                        <Link
                          to={`/task/${application.taskId}`}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center mr-3"
                          onClick={() => markApplicationSeen(application.id)}
                        >
                          View Task
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
                {acceptedApplications.length > 3 && (
                  <div className="mt-3 text-center">
                    <Link to="/applications" className="text-sm text-blue-600 hover:text-blue-800 font-medium inline-flex items-center">
                      View all {acceptedApplications.length} updates
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </Link>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500">No new application updates.</p>
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
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-green-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-800 mb-2">Total Earnings</h3>
          <p className="text-3xl font-bold text-green-600">BWP {earnings.total}</p>
          <p className="text-green-600 mt-2">Lifetime earnings</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Monthly Earnings</h3>
          <p className="text-3xl font-bold text-blue-600">BWP {earnings.thisMonth}</p>
          <p className="text-blue-600 mt-2">This month</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-purple-800 mb-2">Active Tasks</h3>
          <p className="text-3xl font-bold text-purple-600">
            {assignedTasks.filter(task => task.status !== 'completed').length}
          </p>
          <p className="text-purple-600 mt-2">Current/Active</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Completed Tasks</h3>
          <p className="text-3xl font-bold text-gray-700">
            {assignedTasks.filter(task => task.status === 'completed').length}
          </p>
          <p className="text-gray-700 mt-2">Recently Completed</p>
        </div>
      </div>

      {/* Current Tasks */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Current Tasks</h2>
        {assignedTasks.filter(task => task.status === 'active' || task.status === 'assigned').length > 0 ? (
          <div className="space-y-4">
            {assignedTasks
              .filter(task => task.status !== 'completed')
              .map(task => (
                <div key={task.id} className="border-b border-gray-200 pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-800">{task.title}</h3>
                      <p className="text-gray-600 text-sm mt-1">{task.description}</p>
                      <p className="text-gray-500 text-sm mt-2">Payment: BWP {task.payment}</p>
                      <div className="mt-2 flex items-center">
                        <span className="text-sm text-gray-500 mr-2">Status:</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          task.status === 'active' ? 'bg-green-100 text-green-800' : 
                          task.status === 'assigned' ? 'bg-blue-100 text-blue-800' : 
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {task.status === 'active' ? 'In Progress' : 
                           task.status === 'assigned' ? 'Assigned' : task.status}
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        setSelectedTask(task);
                        setShowStatusModal(true);
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Update Status
                    </button>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <p className="text-gray-600">No active tasks. Browse available tasks to get started!</p>
        )}
      </div>

      {/* Recently Completed Tasks */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Recently Completed Tasks</h2>
        {assignedTasks.filter(task => task.status === 'completed').length > 0 ? (
          <div className="space-y-4">
            {assignedTasks
              .filter(task => task.status === 'completed')
              .sort((a, b) => new Date(b.completedAt || b.updatedAt || 0) - new Date(a.completedAt || a.updatedAt || 0))
              .map(task => (
                <div key={task.id} className="border-b border-gray-200 pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-800">{task.title}</h3>
                      <p className="text-gray-600 text-sm mt-1">{task.description}</p>
                      <p className="text-gray-500 text-sm mt-2">Payment: BWP {task.payment}</p>
                      <div className="mt-2 flex items-center">
                        <span className="text-sm text-gray-500 mr-2">Status:</span>
                        <span className="px-2 py-1 text-xs rounded-full bg-gray-200 text-gray-800">Completed</span>
                        {task.completedAt && (
  <span className="ml-4 text-xs text-gray-500">
    Completed: {
      (task.completedAt && typeof task.completedAt === 'object' && typeof task.completedAt.toDate === 'function')
        ? task.completedAt.toDate().toLocaleString()
        : (typeof task.completedAt === 'string' || typeof task.completedAt === 'number')
          ? new Date(task.completedAt).toLocaleString()
          : (task.completedAt instanceof Date)
            ? task.completedAt.toLocaleString()
            : 'Unknown'
    }
  </span>
)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <p className="text-gray-600">No completed tasks yet.</p>
        )}
      </div>

      {/* Status Update Modal */}
      {showStatusModal && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Update Task Status</h3>
            <p className="mb-4">
              Current status: <span className="font-medium">{selectedTask.status}</span>
            </p>
            
            {statusMessage && (
              <div className={`p-3 rounded mb-4 ${
                statusMessage.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
              }`}>
                {statusMessage}
              </div>
            )}
            
            <div className="space-y-3 mb-6">
              <button
                onClick={() => handleUpdateTaskStatus('in_progress')}
                disabled={updatingStatus || selectedTask.status === 'in_progress'}
                className={`w-full py-2 rounded ${
                  selectedTask.status === 'in_progress' 
                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                Mark as In Progress
              </button>
              
              <button
                onClick={() => handleUpdateTaskStatus('completed')}
                disabled={updatingStatus || selectedTask.status === 'completed'}
                className={`w-full py-2 rounded ${
                  selectedTask.status === 'completed' 
                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                Mark as Completed
              </button>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setSelectedTask(null);
                  setStatusMessage('');
                }}
                disabled={updatingStatus}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Available Tasks */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Available Tasks</h2>
          <a
            href="/browse"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            View All
          </a>
        </div>
        <div className="space-y-4">
          <p className="text-gray-600">
            Find new tasks that match your skills and availability.
          </p>
          <button className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Browse Tasks
          </button>
        </div>
      </div>
    </div>
  );
}
