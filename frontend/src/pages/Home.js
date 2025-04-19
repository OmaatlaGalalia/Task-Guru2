import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Get More Done with <span className="text-blue-600">TaskGuru</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              Hire trusted professionals for all your home and office tasks
            </p>
            <div className="flex justify-center space-x-4">
              <Link
                to="/post-task"
                className="px-8 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-lg transform hover:scale-105"
              >
                Post a Task
              </Link>
              <Link
                to="/browse"
                className="px-8 py-3 bg-white text-blue-600 font-bold rounded-lg border border-blue-600 hover:bg-blue-50 transition-colors shadow-md"
              >
                Browse Tasks
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Popular Services</h2>
            <p className="mt-2 text-lg text-gray-600">Find help for any task you need</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {[
              { name: 'Home Cleaning', icon: '🧹', bg: 'bg-blue-100' },
              { name: 'Plumbing', icon: '🚰', bg: 'bg-green-100' },
              { name: 'Electrical', icon: '💡', bg: 'bg-yellow-100' },
              { name: 'Moving Help', icon: '📦', bg: 'bg-purple-100' },
              { name: 'Tutoring', icon: '📚', bg: 'bg-red-100' },
              { name: 'Other Tasks', icon: '✨', bg: 'bg-pink-100' },
            ].map((service, index) => (
              <div 
                key={index} 
                className={`${service.bg} p-6 rounded-xl text-center transition-all hover:shadow-lg hover:-translate-y-1 cursor-pointer`}
              >
                <span className="text-4xl mb-3 block">{service.icon}</span>
                <h3 className="font-semibold text-gray-800">{service.name}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">How It Works</h2>
            <p className="mt-2 text-lg text-gray-600">Simple steps to get your tasks done</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Post a Task',
                description: 'Describe what you need done in just a few clicks',
                icon: '📝',
                color: 'text-blue-600'
              },
              {
                title: 'Get Bids',
                description: 'Receive quotes from qualified taskers',
                icon: '💰',
                color: 'text-green-600'
              },
              {
                title: 'Choose a Tasker',
                description: 'Select the best professional for your job',
                icon: '👍',
                color: 'text-purple-600'
              },
            ].map((step, index) => (
              <div key={index} className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className={`text-5xl mb-6 ${step.color}`}>{step.icon}</div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">TaskGuru</h3>
              <p className="text-gray-400">Making your life easier, one task at a time.</p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><Link to="/about" className="text-gray-400 hover:text-white">About Us</Link></li>
                <li><Link to="/careers" className="text-gray-400 hover:text-white">Careers</Link></li>
                <li><Link to="/press" className="text-gray-400 hover:text-white">Press</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Support</h4>
              <ul className="space-y-2">
                <li><Link to="/help" className="text-gray-400 hover:text-white">Help Center</Link></li>
                <li><Link to="/safety" className="text-gray-400 hover:text-white">Safety</Link></li>
                <li><Link to="/contact" className="text-gray-400 hover:text-white">Contact Us</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><Link to="/privacy" className="text-gray-400 hover:text-white">Privacy Policy</Link></li>
                <li><Link to="/terms" className="text-gray-400 hover:text-white">Terms of Service</Link></li>
                <li><Link to="/cookie" className="text-gray-400 hover:text-white">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>© {new Date().getFullYear()} TaskGuru. All rights reserved by Sir Omaatla Galalia.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}