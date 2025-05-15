import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, updateDoc, deleteDoc, getDoc, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTasks: 0,
    activeTasks: 0,
    totalTaskers: 0,
    totalClients: 0
  });
  const [allUsers, setAllUsers] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Pagination state
  const [usersPage, setUsersPage] = useState(1);
  const [tasksPage, setTasksPage] = useState(1);
  const [usersPerPage] = useState(10);
  const [tasksPerPage] = useState(10);

  // Fetch data from Firestore
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        // Fetch users
        const usersQuery = query(collection(db, 'users'));
        const userSnapshot = await getDocs(usersQuery);
        const users = userSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Fetch tasks
        const tasksQuery = query(collection(db, 'tasks'));
        const taskSnapshot = await getDocs(tasksQuery);
        const tasks = taskSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Store all users and tasks for pagination
        setAllUsers(users.sort((a, b) => {
          return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
        }));

        setAllTasks(tasks.sort((a, b) => {
          return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
        }));

        setLoading(false);
      } catch (error) {
        console.error('Error fetching admin data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);
  
  // Update stats whenever allUsers or allTasks change
  useEffect(() => {
    if (allUsers.length > 0 || allTasks.length > 0) {
      setStats({
        totalUsers: allUsers.length,
        totalTasks: allTasks.length,
        activeTasks: allTasks.filter(task => task.status === 'active').length,
        totalTaskers: allUsers.filter(user => user.role === 'tasker').length,
        totalClients: allUsers.filter(user => user.role === 'client').length
      });
    }
  }, [allUsers, allTasks]);

  const handleUserStatusUpdate = async (userId, isActive) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        isActive: isActive
      });
      // Update local state
      setAllUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId ? { ...user, isActive } : user
        )
      );
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Filtered user list
  const filteredUsers = allUsers.filter(user => {
    const search = userSearch.toLowerCase();
    const matchesSearch =
      user.displayName?.toLowerCase().includes(search) ||
      user.email?.toLowerCase().includes(search) ||
      user.firstName?.toLowerCase().includes(search) ||
      user.lastName?.toLowerCase().includes(search) ||
      user.role?.toLowerCase().includes(search);
    const matchesRole = selectedRole ? user.role === selectedRole : true;
    return matchesSearch && matchesRole;
  });
  
  // Get current users for pagination
  const indexOfLastUser = usersPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalUserPages = Math.ceil(filteredUsers.length / usersPerPage);
  
  // Get current tasks for pagination
  const indexOfLastTask = tasksPage * tasksPerPage;
  const indexOfFirstTask = indexOfLastTask - tasksPerPage;
  const currentTasks = allTasks.slice(indexOfFirstTask, indexOfLastTask);
  const totalTaskPages = Math.ceil(allTasks.length / tasksPerPage);

  // Delete user logic
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    setDeleting(true);
    try {
      // First, get the user to ensure we have all their data
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }
      
      const userData = userDoc.data();
      
      // 1. Update the user document with a special flag that prevents login
      await updateDoc(userRef, {
        isDeleted: true,
        isActive: false,
        email: `deleted-${userId}@deleted.com`, // Change email to prevent login
        password: Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2), // Random password
        deletedAt: new Date()
      });
      
      // 2. Delete all user-related data (tasks, applications, etc.)
      // Get user's tasks
      if (userData.role === 'client') {
        const tasksQuery = query(collection(db, 'tasks'), where('clientId', '==', userId));
        const taskSnapshot = await getDocs(tasksQuery);
        
        // Delete each task
        const taskDeletions = taskSnapshot.docs.map(taskDoc => 
          deleteDoc(doc(db, 'tasks', taskDoc.id))
        );
        await Promise.all(taskDeletions);
      }
      
      // Get user's applications if they're a tasker
      if (userData.role === 'tasker') {
        const applicationsQuery = query(collection(db, 'applications'), where('taskerId', '==', userId));
        const appSnapshot = await getDocs(applicationsQuery);
        
        // Delete each application
        const appDeletions = appSnapshot.docs.map(appDoc => 
          deleteDoc(doc(db, 'applications', appDoc.id))
        );
        await Promise.all(appDeletions);
      }
      
      // 3. Finally, update local state to remove the deleted user from the UI
      setAllUsers(prev => prev.filter(u => u.id !== userId));
      setShowUserModal(false);
      alert('User deleted successfully and all their data has been removed');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user: ' + error.message);
    } finally {
      setDeleting(false);
    }
  };
  
  // Pagination controls
  const Pagination = ({ currentPage, totalPages, setPage }) => {
    return (
      <div className="flex justify-center mt-4">
        <button
          onClick={() => setPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 mx-1 rounded bg-gray-200 disabled:opacity-50"
        >
          Previous
        </button>
        <span className="px-3 py-1 mx-1">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages || totalPages === 0}
          className="px-3 py-1 mx-1 rounded bg-gray-200 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* User Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-800 text-2xl" onClick={() => setShowUserModal(false)}>&times;</button>
            <h2 className="text-xl font-bold mb-2">User Details</h2>
            <div className="mb-2"><strong>Name:</strong> {selectedUser.firstName} {selectedUser.lastName}</div>
            <div className="mb-2"><strong>Email:</strong> {selectedUser.email}</div>
            <div className="mb-2"><strong>Role:</strong> {selectedUser.role}</div>
            <div className="mb-2"><strong>Status:</strong> {selectedUser.isActive ? 'Active' : 'Inactive'}</div>
            <div className="mb-2"><strong>Created:</strong> {new Date(selectedUser.createdAt).toLocaleString()}</div>
            <div className="mb-4"><strong>UID:</strong> {selectedUser.uid}</div>
            <button
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 mr-2"
              disabled={deleting}
              onClick={() => handleDeleteUser(selectedUser.id)}
            >
              {deleting ? 'Deleting...' : 'Delete User'}
            </button>
            <button className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400" onClick={() => setShowUserModal(false)}>Close</button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Monitor and manage the platform's activities
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-wrap gap-4 items-center mb-4">
        <input
          className="border rounded px-3 py-2 outline-none"
          placeholder="Search by name, email, or role..."
          value={userSearch}
          onChange={e => setUserSearch(e.target.value)}
        />
        <select
          className="border rounded px-3 py-2 outline-none"
          value={selectedRole}
          onChange={e => setSelectedRole(e.target.value)}
        >
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="tasker">Tasker</option>
          <option value="client">Client</option>
        </select>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Total Users</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.totalUsers}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-800 mb-2">Active Tasks</h3>
          <p className="text-3xl font-bold text-green-600">{stats.activeTasks}</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-purple-800 mb-2">Total Tasks</h3>
          <p className="text-3xl font-bold text-purple-600">{stats.totalTasks}</p>
        </div>
        <div className="bg-yellow-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Taskers</h3>
          <p className="text-3xl font-bold text-yellow-600">{stats.totalTaskers}</p>
        </div>
        <div className="bg-pink-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-pink-800 mb-2">Clients</h3>
          <p className="text-3xl font-bold text-pink-600">{stats.totalClients}</p>
        </div>
      </div>

      {/* All Users with Pagination */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">All Users</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentUsers.map(user => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.role === 'tasker' ? 'bg-green-100 text-green-800' : 
                      user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.createdAt?.seconds ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-2">
                    <button
                      onClick={() => handleUserStatusUpdate(user.id, !user.isActive)}
                      className={`px-3 py-1 rounded-md ${
                        user.isActive
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {user.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => { setSelectedUser(user); setShowUserModal(true); }}
                      className="px-3 py-1 rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination for Users */}
        <Pagination 
          currentPage={usersPage} 
          totalPages={totalUserPages} 
          setPage={setUsersPage} 
        />
      </div>

      {/* All Tasks with Pagination */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">All Tasks</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Task
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Budget
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentTasks.map(task => (
                <tr key={task.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{task.title}</div>
                    <div className="text-sm text-gray-500">{task.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {task.clientEmail}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      task.status === 'active' ? 'bg-green-100 text-green-800' :
                      task.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {task.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {task.createdAt?.seconds ? new Date(task.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    BWP{task.budget}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination for Tasks */}
        <Pagination 
          currentPage={tasksPage} 
          totalPages={totalTaskPages} 
          setPage={setTasksPage} 
        />
      </div>
    </div>
  );
}
