import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { FiMapPin, FiClock, FiUser } from 'react-icons/fi';

export default function TaskDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [clientDetails, setClientDetails] = useState(null);
  const [applications, setApplications] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch task data
        const taskDoc = await getDoc(doc(db, 'tasks', id));
        if (!taskDoc.exists()) {
          setError('Task not found');
          setLoading(false);
          return;
        }

        const taskData = { id: taskDoc.id, ...taskDoc.data() };
        setTask(taskData);

        // Fetch client details
        const clientDoc = await getDoc(doc(db, 'users', taskData.clientId));
        if (clientDoc.exists()) {
          setClientDetails(clientDoc.data());
        }

        // If user is logged in, fetch their role and application status
        if (user) {
          // Get user role
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserRole(userDoc.data().role);
          }

          // Get all applications for the task if user is the owner
          if (user.uid === taskData.clientId) {
            const applicationsQuery = query(
              collection(db, 'applications'),
              where('taskId', '==', id)
            );
            const applicationsSnapshot = await getDocs(applicationsQuery);
            setApplications(applicationsSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })));
          } else if (userDoc.data().role === 'tasker') {
            // Check if tasker has already applied
            const applicationsQuery = query(
              collection(db, 'applications'),
              where('taskId', '==', id),
              where('taskerId', '==', user.uid)
            );
            const applicationsSnapshot = await getDocs(applicationsQuery);
            setHasApplied(!applicationsSnapshot.empty);
          }
        }
      } catch (err) {
        console.error('Error fetching task details:', err);
        setError('Failed to load task details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id, user]);

  const handleStatusChange = async (newStatus) => {
    try {
      await updateDoc(doc(db, 'tasks', id), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      setTask(prev => ({ ...prev, status: newStatus }));
      alert(`Task has been ${newStatus}`);
    } catch (err) {
      console.error('Error updating task status:', err);
      alert('Failed to update task status. Please try again.');
    }
  };

  const handleApplicationAction = async (applicationId, status) => {
    try {
      await updateDoc(doc(db, 'applications', applicationId), {
        status,
        updatedAt: serverTimestamp()
      });
      setApplications(prev => prev.map(app => 
        app.id === applicationId ? { ...app, status } : app
      ));
      alert(`Application ${status} successfully`);
    } catch (err) {
      console.error('Error updating application:', err);
      alert('Failed to update application. Please try again.');
    }
  };

  const handleApply = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      // Create application document
      const applicationData = {
        taskId: id,
        taskTitle: task.title,
        taskerId: user.uid,
        taskerName: user.displayName || 'Unknown Tasker',
        clientId: task.clientId,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'applications'), applicationData);
      setHasApplied(true);
      alert('Application submitted successfully!');
    } catch (err) {
      console.error('Error applying for task:', err);
      alert('Failed to submit application. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          {error || 'Task not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link to="/browse" className="text-blue-600 hover:text-blue-800">
          ← Back to all tasks
        </Link>
      </div>

      <div className="bg-white shadow overflow-hidden rounded-lg">
        <div className="px-4 py-5 sm:px-6 bg-gray-50">
          <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {task.category}
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Budget: BWP {task.budget}
            </span>
            {task.urgent && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                Urgent
              </span>
            )}
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              Status: {task.status || 'Open'}
            </span>
          </div>
        </div>

        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-2">Task Details</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{task.description}</p>
            </div>

            <div className="sm:border-l sm:border-gray-200 sm:pl-6">
              <h2 className="text-lg font-medium text-gray-900 mb-2">Task Information</h2>
              <dl className="space-y-4">
                <div className="flex items-center">
                  <dt className="flex items-center text-sm font-medium text-gray-500">
                    <FiMapPin className="mr-2" /> Location
                  </dt>
                  <dd className="ml-2 text-sm text-gray-900">{task.location}</dd>
                </div>
                <div className="flex items-center">
                  <dt className="flex items-center text-sm font-medium text-gray-500">
                    <FiClock className="mr-2" /> Posted
                  </dt>
                  <dd className="ml-2 text-sm text-gray-900">
                    {task.createdAt ? new Date(task.createdAt.toDate()).toLocaleDateString() : 'N/A'}
                  </dd>
                </div>
                <div className="flex items-center">
                  <dt className="flex items-center text-sm font-medium text-gray-500">
                    <FiClock className="mr-2" /> Deadline
                  </dt>
                  <dd className="ml-2 text-sm text-gray-900">{task.deadline || 'Flexible'}</dd>
                </div>
                <div className="flex items-center">
                  <dt className="flex items-center text-sm font-medium text-gray-500">
                    <FiUser className="mr-2" /> Posted By
                  </dt>
                  <dd className="ml-2 text-sm text-gray-900">
                    {clientDetails?.firstName} {clientDetails?.lastName}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 px-4 py-4 sm:px-6">
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-gray-500">
              {task.status === 'open' ? 'This task is open for applications' : `This task is ${task.status}`}
            </div>
            <div className="flex gap-2">
              {userRole === 'tasker' && task.status === 'open' && (
                <button
                  type="button"
                  onClick={handleApply}
                  disabled={hasApplied || loading}
                  className={`px-4 py-2 rounded-md ${hasApplied
                    ? 'bg-green-100 text-green-800 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                >
                  {hasApplied ? 'Applied' : 'Apply for Task'}
                </button>
              )}
              {user && user.uid === task.clientId && (
                <>
                  <button
                    type="button"
                    onClick={() => navigate(`/edit-task/${id}`)}
                    className="px-4 py-2 rounded-md bg-gray-600 text-white hover:bg-gray-700"
                  >
                    Edit Task
                  </button>
                  {task.status === 'open' && (
                    <button
                      type="button"
                      onClick={() => handleStatusChange('closed')}
                      className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
                    >
                      Close Task
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Applications section for task owner */}
          {user && user.uid === task.clientId && applications.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Applications</h3>
              <div className="space-y-4">
                {applications.map((application) => (
                  <div key={application.id} className="bg-white p-4 rounded-lg shadow border">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-medium text-gray-900">{application.taskerName}</h4>
                          <button
                            onClick={() => navigate(`/tasker/${application.taskerId}`)}
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            View Profile
                          </button>
                        </div>
                        <p className="text-sm text-gray-500">Applied: {new Date(application.createdAt.toDate()).toLocaleDateString()}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApplicationAction(application.id, 'accepted')}
                          disabled={application.status !== 'pending'}
                          className={`px-3 py-1 rounded-md text-sm ${application.status === 'accepted' 
                            ? 'bg-green-100 text-green-800' 
                            : application.status === 'pending'
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-gray-100 text-gray-800 cursor-not-allowed'}`}
                        >
                          {application.status === 'accepted' ? 'Accepted' : 'Accept'}
                        </button>
                        {application.status === 'pending' && (
                          <button
                            onClick={() => handleApplicationAction(application.id, 'rejected')}
                            className="px-3 py-1 rounded-md text-sm bg-red-600 text-white hover:bg-red-700"
                          >
                            Reject
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}