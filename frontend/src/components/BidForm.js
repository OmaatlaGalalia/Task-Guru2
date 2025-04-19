import React, { useState } from 'react';
import { useParams } from 'react-router-dom';

export default function BidForm() {
  const { taskId } = useParams();
  const [formData, setFormData] = useState({
    amount: '',
    estimatedTime: '',
    message: ''
  });
  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = {};
    
    if (!formData.amount) validationErrors.amount = 'Required';
    if (!formData.estimatedTime) validationErrors.estimatedTime = 'Required';
    if (!formData.message) validationErrors.message = 'Required';
    
    if (Object.keys(validationErrors).length === 0) {
      console.log('Submitting bid:', { taskId, ...formData });
      // API call would go here
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
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Submit Your Bid</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Bid Amount ($)</label>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            className={`mt-1 block w-full border ${errors.amount ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
          />
          {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount}</p>}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Estimated Time</label>
          <select
            name="estimatedTime"
            value={formData.estimatedTime}
            onChange={handleChange}
            className={`mt-1 block w-full border ${errors.estimatedTime ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
          >
            <option value="">Select duration</option>
            <option value="1 hour">1 hour</option>
            <option value="2-4 hours">2-4 hours</option>
            <option value="Half day">Half day</option>
            <option value="Full day">Full day</option>
          </select>
          {errors.estimatedTime && <p className="mt-1 text-sm text-red-600">{errors.estimatedTime}</p>}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Message to Client</label>
          <textarea
            name="message"
            rows={4}
            value={formData.message}
            onChange={handleChange}
            className={`mt-1 block w-full border ${errors.message ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
          />
          {errors.message && <p className="mt-1 text-sm text-red-600">{errors.message}</p>}
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
          >
            Submit Bid
          </button>
        </div>
      </form>
    </div>
  );
}