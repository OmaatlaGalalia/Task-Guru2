import React, { useState, useEffect } from 'react';
import { doc, getDoc, collection, query, where, onSnapshot, orderBy, deleteDoc, updateDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export default function ClientDashboard() {
  // ...existing code...

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
    try {
      // Update task with tasker information
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, {
        status: 'assigned',
        taskerId: application.taskerId,
        taskerName: application.taskerName,
        taskerEmail: application.taskerEmail,
        updatedAt: serverTimestamp()
      });

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
        <h1 className="text-2xl font-bold text-gray-800">
          Welcome back, {userData?.firstName || 'Client'}!
        </h1>
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
          <div className="space-y-4">
            {postedTasks.map(task => (
              <div key={task.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-lg text-gray-800">{task.title}</h3>
                    <p className="text-gray-600 mt-1">{task.description}</p>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm text-gray-500">
                        <span className="font-medium">Category:</span> {task.category}
                      </p>
                      <p className="text-sm text-gray-500">
                        <span className="font-medium">Budget:</span> BWP {task.budget}
                      </p>
                      <p className="text-sm text-gray-500">
                        <span className="font-medium">Location:</span> {task.location}
                      </p>
                      <p className="text-sm text-gray-500">
                        <span className="font-medium">Deadline:</span> {new Date(task.deadline).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-500">
                        <span className="font-medium">Posted:</span> {task.createdAt?.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm capitalize ${getStatusColor(task.status)}`}>
                    {task.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="mt-4 pt-4 border-t">
                  {task.status === 'open' && (
                    <div className="flex justify-between items-center">
                      <div className="flex gap-4">
  <Link
    to={`/edit-task/${task.id}`}
    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
  >
    Edit Task
  </Link>
  <button
    onClick={() => handleDeleteTask(task.id)}
    className="text-red-600 hover:text-red-700 text-sm font-medium"
  >
    Delete Task
  </button>
</div>
                      {applications[task.id]?.length > 0 && (
                        <span className="text-sm text-blue-600">
                          {applications[task.id].length} application(s)
                        </span>
                      )}
                    </div>
                  )}
                  
                  {/* Show applications if task is open */}
                  {task.status === 'open' && applications[task.id]?.length > 0 && (
                    <div className="mt-4 space-y-4">
                      <h4 className="text-sm font-medium text-gray-700">Applications:</h4>
                      {applications[task.id].map(application => (
                        <div key={application.id} className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-gray-800">{application.taskerName}</p>
                              <p className="text-sm text-gray-600">{application.taskerEmail}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                Applied: {application.createdAt?.toLocaleDateString()}
                              </p>
                            </div>
                            {application.status === 'pending' && (
                              <button
                                onClick={() => handleAcceptApplication(task.id, application)}
                                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                              >
                                Accept
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Show assigned tasker if task is assigned */}
                  {task.taskerId && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Assigned to:</span> {task.taskerName}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Email:</span> {task.taskerEmail}
                      </p>
                      {/* Completion and Cancellation Actions */}
                      {['assigned', 'in_progress'].includes(task.status) && (
                        <div className="flex gap-4 mt-2">
                          <button
                            onClick={() => handleMarkCompleted(task.id)}
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                            disabled={task.status === 'completed' || task.status === 'cancelled'}
                          >
                            Mark as Completed
                          </button>
                          <button
                            onClick={() => handleCancelTask(task.id)}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
                            disabled={task.status === 'completed' || task.status === 'cancelled'}
                          >
                            Cancel Task
                          </button>
                        </div>
                      )}
                      {task.status === 'completed' && (
                        <p className="mt-2 text-green-700 font-semibold">Task Completed</p>
                      )}
                      {task.status === 'cancelled' && (
                        <p className="mt-2 text-red-700 font-semibold">Task Cancelled</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
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
