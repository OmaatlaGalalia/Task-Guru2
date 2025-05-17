import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, onSnapshot, orderBy } from 'firebase/firestore';
import { FiSearch, FiFilter, FiMapPin, FiClock } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { HiCreditCard } from 'react-icons/hi';

const BrowseTasks = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState(null);
  const [appliedTasks, setAppliedTasks] = useState([]);
  const [error, setError] = useState(null);

  // State for filters and search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [showFilters, setShowFilters] = useState(false);

  // Real-time tasks from Firestore
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Find or create a chat with the poster and navigate to /messages/:chatId
  const getChatKey = (uid1, uid2) => [uid1, uid2].sort().join('_');
  const handleMessagePoster = async (posterUid) => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    try {
      // Create a unique key for this chat combination
      const chatKey = getChatKey(user.uid, posterUid);
      
      // Check if a chat already exists between these users
      const chatQ = query(collection(db, 'chats'), where('chatKey', '==', chatKey));
      const chatSnap = await getDocs(chatQ);
      
      let chatId;
      
      if (!chatSnap.empty) {
        // Chat exists, just navigate to it
        chatId = chatSnap.docs[0].id;
      } else {
        // Need to create a new chat
        // 1. Fetch current user info
        const userDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', user.uid)));
        const currentUser = userDoc.empty ? { displayName: user.email } : userDoc.docs[0].data();
        
        // 2. Fetch poster user info
        const posterDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', posterUid)));
        const posterUser = posterDoc.empty ? { displayName: posterUid } : posterDoc.docs[0].data();
        
        // 3. Create detailed membersInfo for better display
        const membersInfo = [
          {
            uid: user.uid,
            displayName: currentUser.firstName 
              ? `${currentUser.firstName} ${currentUser.lastName || ''}`.trim() 
              : currentUser.displayName || user.email,
            photoURL: currentUser.photoURL || '',
            email: currentUser.email || user.email,
            firstName: currentUser.firstName || '',
            lastName: currentUser.lastName || ''
          },
          {
            uid: posterUid,
            displayName: posterUser.firstName 
              ? `${posterUser.firstName} ${posterUser.lastName || ''}`.trim() 
              : posterUser.displayName || posterUser.email,
            photoURL: posterUser.photoURL || '',
            email: posterUser.email || '',
            firstName: posterUser.firstName || '',
            lastName: posterUser.lastName || ''
          }
        ];
        
        // 4. Create the chat document with all required fields
        const chatDoc = await addDoc(collection(db, 'chats'), {
          members: [user.uid, posterUid].sort(),
          chatKey,
          membersInfo,
          lastMessage: {
            text: '',
            timestamp: serverTimestamp()
          },
          createdAt: serverTimestamp(),
        });
        
        chatId = chatDoc.id;
      }
      
      // Navigate to the chat page
      navigate(`/messages/${chatId}`);
    } catch (error) {
      console.error('Error creating or accessing chat:', error);
      alert('Failed to open chat. Please try again.');
    }
  };



// Fetch user role and applied tasks
  useEffect(() => {
    if (!user) return;

    const fetchUserData = async () => {
      try {
        // Get user role
        const userDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', user.uid)));
        if (!userDoc.empty) {
          setUserRole(userDoc.docs[0].data().role);
        } else {
          console.warn('User document not found for uid:', user.uid);
          // Set default role to viewer if no role is found
          setUserRole('viewer');
        }

        try {
          // Get user's applications in a separate try-catch block
          const applicationsQuery = query(collection(db, 'applications'), where('taskerId', '==', user.uid));
          const applicationsSnapshot = await getDocs(applicationsQuery);
          const appliedTaskIds = applicationsSnapshot.docs.map(doc => doc.data().taskId);
          setAppliedTasks(appliedTaskIds);
        } catch (appErr) {
          console.error('Error fetching applications:', appErr);
          // Don't fail completely if only applications fetch fails
          setAppliedTasks([]);
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        if (err.code === 'permission-denied') {
          // Handle permission error gracefully
          setUserRole('viewer');
          setError('Some features may be limited. Please ensure your account is properly set up.');
        } else {
          setError('Failed to load user data. Please try refreshing the page.');
        }
      }
    };

    fetchUserData();
  }, [user]);

  useEffect(() => {
    const q = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTasks(fetchedTasks);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

 
  const handleApply = async (task) => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      // Get user's details from Firestore
      const userDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', user.uid)));
      const userData = userDoc.docs[0].data();
      
      // Create tasker name from first and last name
      const taskerName = userData.firstName && userData.lastName
        ? `${userData.firstName} ${userData.lastName}`
        : userData.firstName || user.email;

      // Create application document
      const applicationData = {
        taskId: task.id,
        taskTitle: task.title,
        taskerId: user.uid,
        taskerName: taskerName,
        clientId: task.clientId,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'applications'), applicationData);

      // Update local state
      setAppliedTasks(prev => [...prev, task.id]);

      // Show success message
      alert('Application submitted successfully!');
    } catch (err) {
      console.error('Error applying for task:', err);
      setError('Failed to submit application. Please try again.');
    }
  };

  // Show error message if any
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      </div>
    );
  }

  const categories = ['All', 'Cleaning', 'Repairs', 'Assembly', 'Tutoring', 'Moving', 'Other'];

  // Filter tasks based on search
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         task.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || task.category === selectedCategory;
    const matchesPrice = (task.budget ?? 0) >= priceRange[0] && (task.budget ?? 0) <= priceRange[1];
    
    return matchesSearch && matchesCategory && matchesPrice;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Search and Filter Bar */}
      <div className="mb-8 bg-white p-4 rounded-lg shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search tasks..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filter Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FiFilter className="mr-2" />
            Filters
          </button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              {/* Price Range Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price Range</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    className="block w-1/2 pl-3 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Min"
                    value={priceRange[0]}
                    onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="number"
                    className="block w-1/2 pl-3 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Max"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 1000])}
                  />
                </div>
              </div>

              {/* Additional Filters  */}
              <div className="flex items-end">
                <button className="text-sm text-blue-600 hover:text-blue-800">
                  Reset Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tasks Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full text-center py-12">
            <h3 className="text-lg font-medium text-gray-900">Loading tasks...</h3>
          </div>
        ) : filteredTasks.length > 0 ? (
          filteredTasks.map(task => (
            <div key={task.id} className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
              {/* Task Header */}
              <div className={`px-4 py-3 ${task.urgent ? 'bg-red-100' : 'bg-gray-50'} flex justify-between items-center`}>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${task.urgent ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                  {task.category}
                </span>
                {task.urgent && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                    Urgent
                  </span>
                )}
              </div>

              {/* Task Content */}
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">{task.title}</h3>
                <p className="text-gray-600 mb-4">{task.description}</p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="inline-flex items-center text-sm text-gray-500">
                    <FiMapPin className="mr-1" /> {task.location}
                  </span>
                  <span className="inline-flex items-center text-sm text-gray-500">
                    <HiCreditCard className="mr-1" />BWP {task.budget}
                  </span>
                  <span className="inline-flex items-center text-sm text-gray-500">
                    <FiClock className="mr-1" /> {task.posted}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <button
                    onClick={() => navigate(`/tasks/${task.id}`)}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                  >
                    View Details
                  </button>
                  {user && user.uid !== task.clientId && (
                    <button
                      onClick={() => handleMessagePoster(task.clientId)}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 ml-2"
                    >
                      Message Poster
                    </button>
                  )}
                  {userRole === 'tasker' && !appliedTasks.includes(task.id) && task.status === 'open' && (
                    <button
                      onClick={() => handleApply(task)}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      disabled={loading}
                    >
                      {loading ? 'Applying...' : 'Apply Now'}
                    </button>
                  )}
                  {appliedTasks.includes(task.id) && (
                    <span className="text-sm text-green-600 font-medium">Applied</span>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <h3 className="text-lg font-medium text-gray-900">No tasks found</h3>
            <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {filteredTasks.length > 0 && (
        <div className="mt-8 flex justify-between items-center">
          <button className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            Previous
          </button>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-center">
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                {[1, 2, 3, 4, 5].map((page) => (
                  <button
                    key={page}
                    type="button"
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${page === 1 ? 'z-10 bg-blue-50 border-blue-500 text-blue-600' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}`}
                  >
                    {page}
                  </button>
                ))}
              </nav>
            </div>
          </div>
          <button className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default BrowseTasks;