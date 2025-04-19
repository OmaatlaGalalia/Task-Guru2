import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { auth } from '../firebase';
import { doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('profile');
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [profileImage, setProfileImage] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Payment methods state
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [newPaymentMethod, setNewPaymentMethod] = useState({
    type: 'credit_card',
    cardNumber: '',
    expiry: '',
    cvv: ''
  });

  // Task history state
  const [taskHistory, setTaskHistory] = useState([]);
  const [completedTasks, setCompletedTasks] = useState(0);
  const [pendingTasks, setPendingTasks] = useState(0);

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [newReview, setNewReview] = useState({
    rating: 5,
    comment: '',
    taskId: ''
  });

  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Initialize Firebase Storage
  const storage = getStorage();

  useEffect(() => {
    let isMounted = true;

    const fetchUserData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          console.error('No authenticated user');
          return;
        }

        const userRef = doc(db, 'users', user.uid);
        let userDoc = await getDoc(userRef);
        
        // Create user document if it doesn't exist
        if (!userDoc.exists()) {
          await setDoc(userRef, {
            name: user.displayName || "New User",
            email: user.email,
            createdAt: new Date().toISOString(),
            userType: "regular",
            profileImage: '',
            phone: '',
            location: '',
            bio: '',
            paymentMethods: []
          });
          userDoc = await getDoc(userRef);
        }
        
        if (userDoc.exists() && isMounted) {
          const data = userDoc.data();
          setUserData(data);
          setFormData({
            name: data.name || '',
            email: data.email || '',
            phone: data.phone || '',
            location: data.location || '',
            bio: data.bio || ''
          });
          setPaymentMethods(data.paymentMethods || []);

          // Fetch task history
          const tasksQuery = query(
            collection(db, 'tasks'),
            where('userId', '==', user.uid)
          );
          const taskSnapshot = await getDocs(tasksQuery);
          const tasks = taskSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          if (isMounted) {
            setTaskHistory(tasks);
            setCompletedTasks(tasks.filter(t => t.status === 'completed').length);
            setPendingTasks(tasks.filter(t => t.status === 'pending').length);
          }

          // Fetch reviews if user is a service provider
          if (data.userType === 'serviceProvider') {
            const reviewsQuery = query(
              collection(db, 'reviews'),
              where('providerId', '==', user.uid)
            );
            const reviewSnapshot = await getDocs(reviewsQuery);
            const reviewsData = reviewSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            if (isMounted) {
              setReviews(reviewsData);
              if (reviewsData.length > 0) {
                const avg = reviewsData.reduce((sum, review) => sum + review.rating, 0) / reviewsData.length;
                setAverageRating(parseFloat(avg.toFixed(1)));
              }
            }
          }

          // Fetch notifications
          const notifQuery = query(
            collection(db, 'notifications'),
            where('userId', '==', user.uid),
            where('read', '==', false)
          );
          const notifSnapshot = await getDocs(notifQuery);
          if (isMounted) {
            setNotifications(notifSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setUnreadCount(notifSnapshot.size);
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchUserData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileRef = ref(storage, `profile-images/${uuidv4()}`);
    
    try {
      setUploadProgress(0);
      const snapshot = await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      const user = auth.currentUser;
      if (!user) {
        console.error('No authenticated user');
        return;
      }

      await updateDoc(doc(db, 'users', user.uid), {
        profileImage: downloadURL
      });
      
      setUserData(prev => ({ ...prev, profileImage: downloadURL }));
      setUploadProgress(100);
    } catch (error) {
      console.error("Error uploading image:", error);
      setUploadProgress(0);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.error('No authenticated user');
        return;
      }

      await updateDoc(doc(db, 'users', user.uid), formData);
      setUserData(prev => ({ ...prev, ...formData }));
      setEditMode(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  const addPaymentMethod = async () => {
    if (!newPaymentMethod.cardNumber || !newPaymentMethod.expiry) return;
    
    const updatedMethods = [...paymentMethods, {
      ...newPaymentMethod,
      id: uuidv4(),
      last4: newPaymentMethod.cardNumber.slice(-4)
    }];

    try {
      const user = auth.currentUser;
      if (!user) {
        console.error('No authenticated user');
        return;
      }

      await updateDoc(doc(db, 'users', user.uid), {
        paymentMethods: updatedMethods
      });
      setPaymentMethods(updatedMethods);
      setNewPaymentMethod({
        type: 'credit_card',
        cardNumber: '',
        expiry: '',
        cvv: ''
      });
    } catch (error) {
      console.error("Error adding payment method:", error);
    }
  };

  const submitReview = async () => {
    if (!newReview.taskId || !newReview.comment) return;
    
    try {
      const user = auth.currentUser;
      if (!user || !userData) {
        console.error('No authenticated user or user data');
        return;
      }

      const task = taskHistory.find(t => t.id === newReview.taskId);
      if (!task) {
        console.error('Task not found');
        return;
      }

      const reviewData = {
        ...newReview,
        providerId: userData.userType === 'serviceProvider' ? user.uid : task.providerId,
        userId: user.uid,
        createdAt: new Date().toISOString(),
        userName: userData.name
      };

      await addDoc(collection(db, 'reviews'), reviewData);
      
      // Refresh reviews
      const reviewsQuery = query(
        collection(db, 'reviews'),
        where('providerId', '==', reviewData.providerId)
      );
      const reviewSnapshot = await getDocs(reviewsQuery);
      const reviewsData = reviewSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReviews(reviewsData);
      
      if (reviewsData.length > 0) {
        const avg = reviewsData.reduce((sum, review) => sum + review.rating, 0) / reviewsData.length;
        setAverageRating(parseFloat(avg.toFixed(1)));
      }

      setNewReview({
        rating: 5,
        comment: '',
        taskId: ''
      });
    } catch (error) {
      console.error("Error submitting review:", error);
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true
      });
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => prev - 1);
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900">No user data found</h3>
          <p className="mt-2 text-gray-500">Please check your login status</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="bg-white shadow rounded-lg p-4">
            <div className="flex flex-col items-center mb-6">
              <div className="relative group">
                {userData.profileImage ? (
                  <img 
                    src={userData.profileImage} 
                    alt="Profile" 
                    className="h-24 w-24 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-24 w-24 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-2xl font-medium text-blue-600">
                      {userData.name ? userData.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'US'}
                    </span>
                  </div>
                )}
                <label className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full cursor-pointer hover:bg-blue-600">
                  <input 
                    type="file" 
                    onChange={handleImageUpload} 
                    className="hidden" 
                    accept="image/*"
                  />
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </label>
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gray-200 h-1">
                    <div 
                      className="bg-blue-500 h-1" 
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                )}
              </div>
              <h2 className="mt-4 font-medium text-center">{userData.name || 'User'}</h2>
              <p className="text-sm text-gray-500 text-center">{userData.email}</p>
              {userData.bio && (
                <p className="text-sm text-gray-600 mt-2 text-center">{userData.bio}</p>
              )}
              {userData.userType === 'serviceProvider' && averageRating > 0 && (
                <div className="flex items-center mt-2">
                  <span className="text-yellow-500">★ {averageRating}</span>
                  <span className="text-xs text-gray-500 ml-1">({reviews.length} reviews)</span>
                </div>
              )}
            </div>

            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${activeTab === 'profile' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                My Profile
              </button>
              <button
                onClick={() => setActiveTab('tasks')}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${activeTab === 'tasks' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                My Tasks
              </button>
              {userData.userType === 'serviceProvider' && (
                <button
                  onClick={() => setActiveTab('reviews')}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${activeTab === 'reviews' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  My Reviews
                </button>
              )}
              <button
                onClick={() => setActiveTab('payments')}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${activeTab === 'payments' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                Payment Methods
              </button>
              <button
                onClick={() => setActiveTab('notifications')}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${activeTab === 'notifications' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                Notifications {unreadCount > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {activeTab === 'profile' && (
            <div className="bg-white shadow rounded-lg p-6">
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900">Profile Information</h3>
                <p className="mt-1 text-sm text-gray-500">Update your personal information</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    disabled={!editMode}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-gray-100"
                    disabled
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    disabled={!editMode}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Location</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    disabled={!editMode}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Bio</label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows="3"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    disabled={!editMode}
                  ></textarea>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  {editMode ? (
                    <>
                      <button
                        onClick={() => setEditMode(false)}
                        className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveProfile}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm text-sm font-medium hover:bg-blue-700"
                      >
                        Save Changes
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setEditMode(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm text-sm font-medium hover:bg-blue-700"
                    >
                      Edit Profile
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">My Tasks</h3>
                <div className="flex space-x-4">
                  <div className="bg-green-50 px-4 py-2 rounded-lg">
                    <p className="text-sm text-green-600">Completed</p>
                    <p className="text-xl font-bold text-green-700">{completedTasks}</p>
                  </div>
                  <div className="bg-yellow-50 px-4 py-2 rounded-lg">
                    <p className="text-sm text-yellow-600">Pending</p>
                    <p className="text-xl font-bold text-yellow-700">{pendingTasks}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {taskHistory.length > 0 ? (
                  taskHistory.map(task => (
                    <div key={task.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{task.title}</h4>
                          <p className="text-sm text-gray-500">
                            {new Date(task.createdAt).toLocaleDateString()} • 
                            <span className={`ml-2 ${task.status === 'completed' ? 'text-green-600' : 'text-yellow-600'}`}>
                              {task.status}
                            </span>
                          </p>
                          <p className="mt-2 text-sm text-gray-700">{task.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${task.budget}</p>
                          {task.status === 'completed' && !task.reviewed && (
                            <button 
                              onClick={() => {
                                setNewReview(prev => ({ ...prev, taskId: task.id }));
                                setActiveTab('reviews');
                              }}
                              className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                            >
                              Leave Review
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No tasks found</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">
                  {userData.userType === 'serviceProvider' ? 'My Reviews' : 'Leave a Review'}
                </h3>
                {userData.userType === 'serviceProvider' && averageRating > 0 && (
                  <div className="flex items-center">
                    <span className="text-2xl font-bold text-yellow-500">★ {averageRating}</span>
                    <span className="text-sm text-gray-500 ml-1">({reviews.length} reviews)</span>
                  </div>
                )}
              </div>

              {userData.userType === 'serviceProvider' ? (
                <div className="space-y-4">
                  {reviews.length > 0 ? (
                    reviews.map(review => (
                      <div key={review.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between">
                          <div>
                            <h4 className="font-medium">{review.userName}</h4>
                            <div className="flex items-center mt-1">
                              {[...Array(5)].map((_, i) => (
                                <span key={i} className={i < review.rating ? 'text-yellow-500' : 'text-gray-300'}>★</span>
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-gray-500">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <p className="mt-2 text-sm text-gray-700">{review.comment}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">No reviews yet</p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Select Task</label>
                    <select
                      value={newReview.taskId}
                      onChange={(e) => setNewReview({...newReview, taskId: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select a completed task</option>
                      {taskHistory
                        .filter(task => task.status === 'completed' && !task.reviewed)
                        .map(task => (
                          <option key={task.id} value={task.id}>
                            {task.title} - {new Date(task.createdAt).toLocaleDateString()}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Rating</label>
                    <div className="flex items-center mt-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewReview({...newReview, rating: star})}
                          className="text-2xl focus:outline-none"
                        >
                          <span className={star <= newReview.rating ? 'text-yellow-500' : 'text-gray-300'}>★</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Review</label>
                    <textarea
                      value={newReview.comment}
                      onChange={(e) => setNewReview({...newReview, comment: e.target.value})}
                      rows="3"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Share your experience..."
                    ></textarea>
                  </div>
                  <button
                    onClick={submitReview}
                    disabled={!newReview.taskId || !newReview.comment}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    Submit Review
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="bg-white shadow rounded-lg p-6">
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900">Payment Methods</h3>
                <p className="mt-1 text-sm text-gray-500">Manage your payment options</p>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-4">
                  {paymentMethods.length > 0 ? (
                    paymentMethods.map((method, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between">
                          <div>
                            <h4 className="font-medium">
                              {method.type === 'credit_card' ? 'Credit Card' : 'Other Payment Method'}
                            </h4>
                            <p className="text-sm text-gray-500">•••• •••• •••• {method.last4}</p>
                            <p className="text-sm text-gray-500">Expires {method.expiry}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">No payment methods added</p>
                  )}
                </div>
                
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-md font-medium mb-4">Add New Payment Method</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Card Number</label>
                      <input
                        type="text"
                        value={newPaymentMethod.cardNumber}
                        onChange={(e) => setNewPaymentMethod({...newPaymentMethod, cardNumber: e.target.value})}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="1234 5678 9012 3456"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Expiry Date</label>
                        <input
                          type="text"
                          value={newPaymentMethod.expiry}
                          onChange={(e) => setNewPaymentMethod({...newPaymentMethod, expiry: e.target.value})}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="MM/YY"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">CVV</label>
                        <input
                          type="text"
                          value={newPaymentMethod.cvv}
                          onChange={(e) => setNewPaymentMethod({...newPaymentMethod, cvv: e.target.value})}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="123"
                        />
                      </div>
                    </div>
                    <button
                      onClick={addPaymentMethod}
                      disabled={!newPaymentMethod.cardNumber || !newPaymentMethod.expiry}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      Add Payment Method
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    {unreadCount} unread
                  </span>
                )}
              </div>

              <div className="space-y-4">
                {notifications.length > 0 ? (
                  notifications.map(notification => (
                    <div 
                      key={notification.id} 
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                      onClick={() => markNotificationAsRead(notification.id)}
                    >
                      <div className="flex justify-between">
                        <h4 className="font-medium">{notification.title}</h4>
                        <span className="text-xs text-gray-500">
                          {new Date(notification.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">{notification.message}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No new notifications</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}