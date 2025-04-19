import React, { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

function TaskList() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTasks = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);

      // Query for tasks that are 'open' and not created by the current user
      const tasksQuery = query(
        collection(db, 'tasks'),
        where('status', '==', 'open')
      );

      const querySnapshot = await getDocs(tasksQuery);
      const tasksData = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate()?.toLocaleDateString() || 'Unknown date'
        }))
        .filter(task => task.clientId !== user?.uid); // Exclude user's own tasks

      setTasks(tasksData);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError('Failed to load tasks. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleApply = async (taskId) => {
    if (!user) {
      setError('Please log in to apply for tasks');
      return;
    }

    if (user.role !== 'tasker') {
      setError('Only taskers can apply for tasks');
      return;
    }

    try {
      // Create application in applications collection
      await addDoc(collection(db, 'applications'), {
        taskId,
        taskerId: user.uid,
        taskerName: user.firstName && user.lastName 
          ? `${user.firstName} ${user.lastName}`
          : user.email,
        taskerEmail: user.email,
        status: 'pending',
        createdAt: serverTimestamp()
      });

      // Update task status to indicate it has applications
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, {
        hasApplications: true,
        updatedAt: serverTimestamp()
      });

      // Refresh the task list
      await fetchTasks();
    } catch (err) {
      console.error('Error applying for task:', err);
      setError('Failed to apply for task. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-600 bg-red-50 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-800">Available Tasks</h2>
        <button
          onClick={fetchTasks}
          className="px-4 py-2 text-sm text-blue-600 hover:text-blue-700"
        >
          Refresh
        </button>
      </div>

      {tasks.length === 0 ? (
        <p className="text-gray-600 text-center py-8">
          No tasks available at the moment.
        </p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-800">{task.title}</h3>
                <span className="px-2 py-1 text-sm rounded-full bg-green-100 text-green-800">
                  ${task.budget}
                </span>
              </div>
              
              <p className="text-gray-600 mb-4 line-clamp-3">{task.description}</p>
              
              <div className="space-y-2 text-sm text-gray-500 mb-4">
                <p> {task.location}</p>
                <p> Due: {new Date(task.deadline).toLocaleDateString()}</p>
                <p> {task.category}</p>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                <span className="text-sm text-gray-500">
                  Posted: {task.createdAt}
                </span>
                <button
                  onClick={() => handleApply(task.id)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TaskList;