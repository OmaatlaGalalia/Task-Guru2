import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

export default function TaskForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    budget: '',
    location: '',
    deadline: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    'Home Cleaning',
    'Plumbing',
    'Electrical',
    'Moving Help',
    'Tutoring',
    'Other'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = {};
    
    if (!formData.title.trim()) validationErrors.title = 'Required';
    if (!formData.description.trim()) validationErrors.description = 'Required';
    if (!formData.category) validationErrors.category = 'Required';
    if (!formData.budget) validationErrors.budget = 'Required';
    if (!formData.location.trim()) validationErrors.location = 'Required';
    if (!formData.deadline) validationErrors.deadline = 'Required';
    
    if (Object.keys(validationErrors).length === 0) {
      try {
        setIsSubmitting(true);
        setErrors({});
        
        // Check if we have the necessary user data
        if (!user || !user.uid) {
          throw new Error('User not authenticated. Please log in again.');
        }

        if (user.role !== 'client') {
          throw new Error('Only clients can post tasks.');
        }

        // Add task to Firestore
        const taskData = {
          title: formData.title.trim(),
          description: formData.description.trim(),
          category: formData.category,
          budget: Number(formData.budget),
          location: formData.location.trim(),
          deadline: formData.deadline,
          clientId: user.uid,
          clientEmail: user.email,
          clientName: user.firstName && user.lastName 
            ? `${user.firstName} ${user.lastName}`
            : user.email,
          status: 'open',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };

        console.log('Submitting task data:', taskData); // Debug log

        try {
          const docRef = await addDoc(collection(db, 'tasks'), taskData);
          console.log('Task posted with ID:', docRef.id);
          navigate('/dashboard');
        } catch (firestoreError) {
          console.error('Firestore error:', firestoreError);
          if (firestoreError.code === 'permission-denied') {
            throw new Error('You do not have permission to post tasks. Please make sure you are logged in as a client.');
          }
          throw firestoreError;
        }
      } catch (error) {
        console.error('Error posting task:', error);
        setErrors({ 
          submit: error.message || 'Failed to post task. Please try again.' 
        });
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setErrors(validationErrors);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-6">Post a New Task</h1>
      {errors.submit && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {errors.submit}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Task Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className={`mt-1 block w-full border ${errors.title ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
          />
          {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            name="description"
            rows={4}
            value={formData.description}
            onChange={handleChange}
            className={`mt-1 block w-full border ${errors.description ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
          />
          {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className={`mt-1 block w-full border ${errors.category ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Budget (BWP)</label>
            <input
              type="number"
              name="budget"
              value={formData.budget}
              onChange={handleChange}
              min="1"
              className={`mt-1 block w-full border ${errors.budget ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
            />
            {errors.budget && <p className="mt-1 text-sm text-red-600">{errors.budget}</p>}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Location</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className={`mt-1 block w-full border ${errors.location ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
            />
            {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Deadline</label>
            <input
              type="date"
              name="deadline"
              value={formData.deadline}
              onChange={handleChange}
              min={new Date().toISOString().split('T')[0]}
              className={`mt-1 block w-full border ${errors.deadline ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
            />
            {errors.deadline && <p className="mt-1 text-sm text-red-600">{errors.deadline}</p>}
          </div>
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`${
              isSubmitting ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
            } text-white py-2 px-6 rounded-md flex items-center`}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Posting...
              </>
            ) : (
              'Post Task'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}