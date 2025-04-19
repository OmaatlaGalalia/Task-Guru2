import React, { useState } from 'react';
import { FiSearch, FiFilter, FiMapPin, FiDollarSign, FiClock } from 'react-icons/fi';

const BrowseTasks = () => {
  // State for filters and search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [showFilters, setShowFilters] = useState(false);

  // Mock data - replace with API call later
  
  const [tasks] = useState([
    {
      id: 1,
      title: 'Furniture Assembly',
      description: 'Help assembling furniture from Game or HomeCorp (wardrobe and table)',
      category: 'Assembly',
      price: 400, 
      location: 'Gaborone, Main Mall',
      posted: '2 hours ago',
      urgent: true,
      images: ['furniture.jpg']
    },
    {
      id: 2,
      title: 'Math Tutoring',
      description: 'Form 4 mathematics help for BGCSE, 2 hours weekly',
      category: 'Tutoring',
      price: 200, 
      location: 'Gaborone, Block 8',
      posted: '1 day ago',
      urgent: false
    },
    {
      id: 3,
      title: 'Bathroom Plumbing Repair',
      description: 'Fix leaking tap and blocked shower in Tlokweng house',
      category: 'Plumbing',
      price: 600, 
      location: 'Tlokweng',
      posted: '3 hours ago',
      urgent: true,
      images: ['bathroom.jpg']
    },
    {
      id: 4,
      title: 'House Deep Cleaning',
      description: 'Full cleaning before landlord inspection (2-bedroom house)',
      category: 'Cleaning',
      price: 450, 
      location: 'Francistown, Aerodrome',
      posted: '1 day ago',
      urgent: false
    },
    {
      id: 5,
      title: 'Moving Assistance',
      description: 'Help carrying boxes from flat to bakkie in Mogoditshane',
      category: 'Moving',
      price: 300,  
      location: 'Mogoditshane',
      posted: '5 hours ago',
      urgent: false,
      images: ['moving.jpg']
    },
    {
      id: 6,
      title: 'Guitar Lessons',
      description: 'Beginner lessons for traditional Setswana music',
      category: 'Music',
      price: 175,  
      location: 'Gaborone, Broadhurst',
      posted: '2 days ago',
      urgent: false
    },
    {
      id: 7,
      title: 'Emergency Electrical Repair',
      description: 'Power outlet not working in home office (need ASAP)',
      category: 'Electrical',
      price: 750, 
      location: 'Gaborone, Phakalane',
      posted: '1 hour ago',
      urgent: true,
      images: ['electrical.jpg']
    },
    {
      id: 8,
      title: 'Yard Cleanup',
      description: 'Remove weeds and trim bushes in small yard',
      category: 'Gardening',
      price: 250, 
      location: 'Maun',
      posted: '3 days ago',
      urgent: false
    },
    {
      id: 9,
      title: 'Computer Setup',
      description: 'Help install Windows and transfer files from old laptop',
      category: 'Tech',
      price: 225,
      location: 'Gaborone, Riverwalk',
      posted: '1 day ago',
      urgent: false
    },
    {
      id: 10,
      title: 'House Painting',
      description: 'Paint living room (paint and brushes provided)',
      category: 'Painting',
      price: 375, 
      location: 'Gaborone, BBS Mall Area',
      posted: '4 hours ago',
      urgent: false,
      images: ['painting.jpg']
    },
    {
      id: 11,
      title: 'Pet Sitting',
      description: 'Feed and walk my dog for 2 days while I travel',
      category: 'Pets',
      price: 125, 
      location: 'Kasane',
      posted: '2 days ago',
      urgent: false
    },
    {
      id: 12,
      title: 'Setswana Language Tutor',
      description: 'Practice conversational Setswana for foreigners',
      category: 'Language',
      price: 150, 
      location: 'Gaborone, UB Campus',
      posted: '1 week ago',
      urgent: false
    }
  ]);

 
  const categories = ['All', 'Cleaning', 'Repairs', 'Assembly', 'Tutoring', 'Moving', 'Other'];

  // Filter tasks based on search
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         task.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || task.category === selectedCategory;
    const matchesPrice = task.price >= priceRange[0] && task.price <= priceRange[1];
    
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
        {filteredTasks.length > 0 ? (
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
                    <FiDollarSign className="mr-1" />BWP{task.price}
                  </span>
                  <span className="inline-flex items-center text-sm text-gray-500">
                    <FiClock className="mr-1" /> {task.posted}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <button
                    type="button"
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                  >
                    View Details
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Apply Now
                  </button>
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