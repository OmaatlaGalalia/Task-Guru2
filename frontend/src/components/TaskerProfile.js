import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import Reviews from './Reviews';
import ReviewForm from './ReviewForm';
import Modal from './Modal';
import { useAuth } from '../context/AuthContext';
import { FiMail, FiPhone, FiMapPin, FiStar, FiCheckCircle, FiClock, FiDollarSign } from 'react-icons/fi';


export default function TaskerProfile() {
  const { taskerId } = useParams();
  const [tasker, setTasker] = useState(null);
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    averageRating: 0,
    onTimeCompletion: 0,
    totalEarnings: 0,
    monthlyEarnings: 0,
    activeTasks: 0,
    postedTasks: 0,
    openTasks: 0
  });
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isTaskerProfile, setIsTaskerProfile] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const { user } = useAuth();

  const fetchReviews = useCallback(async () => {
    try {
      const reviewsQuery = query(
        collection(db, 'reviews'),
        where('taskerId', '==', taskerId),
        orderBy('createdAt', 'desc')
      );
      const reviewsSnap = await getDocs(reviewsQuery);
      const reviewsData = reviewsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setReviews(reviewsData);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  }, [taskerId]);

  useEffect(() => {
    const fetchTaskerProfile = async () => {
      try {
        // Fetch tasker's basic information
        const userQuery = query(collection(db, 'users'), where('uid', '==', taskerId));
        const userSnap = await getDocs(userQuery);
        
        if (!userSnap.empty) {
          setTasker(userSnap.docs[0].data());
        }

        // Fetch tasks based on role
        let tasksQuery;
        const userRole = userSnap.docs[0].data().role;
        setIsTaskerProfile(userRole === 'tasker');
        if (userRole === 'tasker') {
          // For taskers, get tasks they're assigned to
          tasksQuery = query(
            collection(db, 'tasks'),
            where('taskerId', '==', taskerId),
            orderBy('createdAt', 'desc')
          );
        } else {
          // For clients, get tasks they've posted
          tasksQuery = query(
            collection(db, 'tasks'),
            where('clientId', '==', taskerId),
            orderBy('createdAt', 'desc')
          );
        }
        
        const tasksSnap = await getDocs(tasksQuery);
        const tasks = tasksSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        if (userRole === 'tasker') {
          // Calculate tasker stats
          const completedTasks = tasks.filter(task => task.status === 'completed');
          const activeTasks = tasks.filter(task => task.status === 'in_progress');
          
          // Calculate earnings
          const totalEarnings = completedTasks
            .reduce((sum, task) => sum + (task.payment || 0), 0);

          const thisMonth = new Date().getMonth();
          const thisYear = new Date().getFullYear();
          const monthlyEarnings = completedTasks
            .filter(task => {
              const taskDate = task.completedAt ? new Date(task.completedAt) : null;
              return taskDate &&
                     taskDate.getMonth() === thisMonth &&
                     taskDate.getFullYear() === thisYear;
            })
            .reduce((sum, task) => sum + (task.payment || 0), 0);

          // Calculate average rating
          const ratings = completedTasks.map(task => task.rating).filter(Boolean);
          const averageRating = ratings.length > 0
            ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
            : 0;

          setStats({
            totalTasks: tasks.length,
            completedTasks: completedTasks.length,
            activeTasks: activeTasks.length,
            totalEarnings,
            monthlyEarnings,
            averageRating
          });
        } else {
          // Calculate client stats
          const openTasks = tasks.filter(task => task.status === 'open');
          const activeTasks = tasks.filter(task => task.status === 'in_progress');
          const completedTasks = tasks.filter(task => task.status === 'completed');

          setStats({
            postedTasks: tasks.length,
            openTasks: openTasks.length,
            activeTasks: activeTasks.length,
            completedTasks: completedTasks.length
          });
        }

        // Set recent tasks
        setRecentTasks(tasks.slice(0, 5));
      } catch (error) {
        console.error('Error fetching tasker profile:', error);
      } finally {
        setLoading(false);
      }
    };

    if (taskerId) {
      fetchTaskerProfile();
      fetchReviews();
    }
  }, [taskerId, fetchReviews]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="animate-pulse flex space-x-4">
            <div className="rounded-full bg-gray-200 h-12 w-12"></div>
            <div className="flex-1 space-y-4 py-1">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!tasker) {
    return (
      <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900">Tasker not found</h2>
          <p className="mt-2 text-gray-600">The tasker profile you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Profile Header */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="relative h-32 bg-blue-600">
            <div className="absolute -bottom-12 left-8">
              <img
                src={tasker.photoURL || '/default-avatar.png'}
                alt={`${tasker.firstName} ${tasker.lastName}`}
                className="w-24 h-24 rounded-full border-4 border-white bg-white object-cover"
              />
            </div>
          </div>
          <div className="pt-16 pb-6 px-8">
            <h1 className="text-2xl font-bold text-gray-900">
              {tasker.firstName} {tasker.lastName}
            </h1>
            <div className="mt-2 flex items-center text-gray-600">
              <FiMapPin className="mr-2" />
              <span>{tasker.location || 'Location not specified'}</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {isTaskerProfile ? (
            // Tasker Stats
            <>
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <FiCheckCircle className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Tasks</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats.totalTasks}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <FiStar className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Average Rating</dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {stats.averageRating.toFixed(1)} / 5.0
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <FiClock className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Active Tasks</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats.activeTasks}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <FiDollarSign className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Monthly Earnings</dt>
                        <dd className="text-lg font-medium text-gray-900">BWP {stats.monthlyEarnings}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            // Client Stats
            <>
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <FiCheckCircle className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Posted Tasks</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats.postedTasks}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <FiClock className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Open Tasks</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats.openTasks}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <FiClock className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Active Tasks</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats.activeTasks}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <FiCheckCircle className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Completed Tasks</dt>
                        <dd className="text-lg font-medium text-gray-900">{stats.completedTasks}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Professional Information */}
        <div className="mt-6 bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Professional Information</h3>
            
            {tasker.education && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Education</h4>
                <p className="text-gray-600 whitespace-pre-line">{tasker.education}</p>
              </div>
            )}

            {tasker.qualifications && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Qualifications & Certifications</h4>
                <p className="text-gray-600 whitespace-pre-line">{tasker.qualifications}</p>
              </div>
            )}

            {tasker.skills && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Skills</h4>
                <p className="text-gray-600 whitespace-pre-line">{tasker.skills}</p>
              </div>
            )}

            {tasker.experience && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Work Experience</h4>
                <p className="text-gray-600 whitespace-pre-line">{tasker.experience}</p>
              </div>
            )}

            {tasker.languages && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Languages</h4>
                <p className="text-gray-600">{tasker.languages}</p>
              </div>
            )}
          </div>
        </div>

        {/* Availability & Service Areas */}
        <div className="mt-6 bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Availability & Coverage</h3>
            
            {tasker.availability && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Availability</h4>
                <p className="text-gray-600">{tasker.availability}</p>
              </div>
            )}

            {tasker.serviceAreas && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Service Areas</h4>
                <p className="text-gray-600">{tasker.serviceAreas}</p>
              </div>
            )}
          </div>
        </div>

        {/* Contact Information */}
        <div className="mt-6 bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Contact Information</h3>
            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="flex items-center text-gray-600">
                <FiMail className="mr-2" />
                <span>{tasker.email}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <FiPhone className="mr-2" />
                <span>{tasker.phone || 'Phone not provided'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="mt-6 bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Tasks</h3>
            <div className="mt-5">
              {recentTasks.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {recentTasks.map((task) => (
                    <li key={task.id} className="py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">{task.title}</h4>
                          <p className="mt-1 text-sm text-gray-500">
                            {task.description.length > 100
                              ? `${task.description.substring(0, 100)}...`
                              : task.description}
                          </p>
                        </div>
                        <div className="ml-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              task.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {task.status}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No recent tasks found.</p>
              )}
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Reviews and Feedback</h2>
            {isTaskerProfile && user?.uid !== taskerId && (
              <button
                onClick={() => setIsReviewModalOpen(true)}
                className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
              >
                Leave a Review
              </button>
            )}
          </div>
          <Reviews reviews={reviews} />
        </div>

        {/* Review Modal */}
        <Modal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          title="Leave a Review"
        >
          <ReviewForm
            taskerId={taskerId}
            onReviewSubmitted={() => {
              fetchReviews(); // Refresh the reviews list
              setIsReviewModalOpen(false);
            }}
            onClose={() => setIsReviewModalOpen(false)}
          />
        </Modal>
      </div>
    </div>
  );
}
