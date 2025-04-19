import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Tasks() {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data - replace with API data later
  const tasks = [
    {
      id: 1,
      title: 'Fix leaking kitchen faucet',
      description: 'Need someone to repair a leaky faucet in my apartment kitchen',
      category: 'Plumbing',
      budget: 50,
      location: 'Downtown',
      posted: '2 hours ago'
    },
    {
      id: 2,
      title: 'Math tutoring for high school student',
      description: 'Algebra and geometry help needed twice a week',
      category: 'Tutoring',
      budget: 30,
      location: 'Westside',
      posted: '1 day ago'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4 md:mb-0">Available Tasks</h1>
        
        <div className="w-full md:w-auto flex space-x-4">
          <input
            type="text"
            placeholder="Search tasks..."
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Link
            to="/post-task"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Post a Task
          </Link>
        </div>
      </div>

      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`py-2 px-4 font-medium ${activeTab === 'all' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('all')}
        >
          All Tasks
        </button>
        <button
          className={`py-2 px-4 font-medium ${activeTab === 'nearby' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('nearby')}
        >
          Nearby
        </button>
      </div>

      <div className="grid gap-6">
        {tasks.map((task) => (
          <div key={task.id} className="bg-white shadow overflow-hidden rounded-lg hover:shadow-md transition-shadow">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{task.title}</h3>
                  <p className="mt-1 text-sm text-gray-500">{task.description}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {task.category}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      ${task.budget}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {task.location}
                    </span>
                  </div>
                </div>
                <div className="ml-4 flex-shrink-0">
                  <span className="text-sm text-gray-500">{task.posted}</span>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Link
                  to={`/tasks/${task.id}`}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                >
                  View Details
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}