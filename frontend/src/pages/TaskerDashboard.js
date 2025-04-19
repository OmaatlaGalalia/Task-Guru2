import React, { useState, useEffect } from 'react';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

export default function TaskerDashboard() {
  const { user } = useAuth();
  const [userData, setUserData] = useState(null);
  const [assignedTasks, setAssignedTasks] = useState([]);
  const [earnings, setEarnings] = useState({ total: 0, thisMonth: 0 });
  const [loading, setLoading] = useState(true);

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
        <h1 className="text-2xl font-bold text-gray-800">
          Welcome back, {userData?.firstName || 'Tasker'}!
        </h1>
        <p className="text-gray-600 mt-2">
          Manage your tasks and track your earnings.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-green-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-800 mb-2">Total Earnings</h3>
          <p className="text-3xl font-bold text-green-600">${earnings.total}</p>
          <p className="text-green-600 mt-2">Lifetime earnings</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Monthly Earnings</h3>
          <p className="text-3xl font-bold text-blue-600">${earnings.thisMonth}</p>
          <p className="text-blue-600 mt-2">This month</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-purple-800 mb-2">Active Tasks</h3>
          <p className="text-3xl font-bold text-purple-600">
            {assignedTasks.filter(task => task.status === 'active').length}
          </p>
          <p className="text-purple-600 mt-2">In progress</p>
        </div>
      </div>

      {/* Current Tasks */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Current Tasks</h2>
        {assignedTasks.filter(task => task.status === 'active').length > 0 ? (
          <div className="space-y-4">
            {assignedTasks
              .filter(task => task.status === 'active')
              .map(task => (
                <div key={task.id} className="border-b border-gray-200 pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-800">{task.title}</h3>
                      <p className="text-gray-600 text-sm mt-1">{task.description}</p>
                      <p className="text-gray-500 text-sm mt-2">Payment: ${task.payment}</p>
                    </div>
                    <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
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
