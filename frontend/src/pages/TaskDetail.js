import React from 'react';
import { Link, useParams } from 'react-router-dom';

export default function TaskDetail() {
  const { id } = useParams();
  
  // Mock data - replace with API call later
  const task = {
    id: 1,
    title: 'Fix leaking kitchen faucet',
    description: 'The faucet in my kitchen has been leaking for a week. Need someone to diagnose and fix the issue. I have basic tools available but may need you to bring specialized plumbing tools.',
    category: 'Plumbing',
    budget: 50,
    location: 'Downtown, 5th Avenue',
    posted: 'March 26, 2023',
    deadline: 'ASAP',
    postedBy: 'Sarah J.'
  };

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
              Budget: BWP{task.budget}
            </span>
          </div>
        </div>

        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-2">Task Details</h2>
              <p className="text-gray-700">{task.description}</p>
            </div>

            <div className="sm:border-l sm:border-gray-200 sm:pl-6">
              <h2 className="text-lg font-medium text-gray-900 mb-2">Task Information</h2>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Location</dt>
                  <dd className="mt-1 text-sm text-gray-900">{task.location}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Posted</dt>
                  <dd className="mt-1 text-sm text-gray-900">{task.posted}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Deadline</dt>
                  <dd className="mt-1 text-sm text-gray-900">{task.deadline}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Posted By</dt>
                  <dd className="mt-1 text-sm text-gray-900">{task.postedBy}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 px-4 py-4 sm:px-6 flex justify-end">
          <button
            type="button"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Apply for Task
          </button>
        </div>
      </div>
    </div>
  );
}