import React from 'react';
import { Link } from 'react-router-dom';
import teamMembers from '../data/team'; // We'll create this next

export default function About() {
  return (
    <div className="bg-gray-50">
      {/* Hero Section */}
      <div className="bg-blue-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">About TaskGuru</h1>
          <p className="text-xl max-w-3xl mx-auto">
            Revolutionizing the way you get tasks done by connecting you with trusted professionals
          </p>
        </div>
      </div>

      {/* Our Story */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Story</h2>
          <div className="h-1 w-20 bg-blue-600 mx-auto"></div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h3 className="text-2xl font-semibold text-gray-800 mb-4">How We Started</h3>
            <p className="text-gray-600 mb-4">
              Founded in 2023, TaskGuru began with a simple idea: to make task completion effortless. 
              Our founders noticed how difficult it was to find reliable help for everyday tasks, 
              from home repairs to personal assistance.
            </p>
            <p className="text-gray-600">
              What started as a small local service has grown into a nationwide platform connecting 
              thousands of users with skilled professionals.
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md">
            <img 
              src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
              alt="Team working" 
              className="rounded-lg w-full h-auto"
            />
          </div>
        </div>
      </section>

      {/* Mission & Values */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Mission & Values</h2>
            <div className="h-1 w-20 bg-blue-600 mx-auto"></div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Empowerment",
                icon: "💪",
                description: "We empower both task posters and taskers to take control of their work and lives."
              },
              {
                title: "Trust",
                icon: "🤝",
                description: "Verified professionals and transparent reviews build a trusted community."
              },
              {
                title: "Innovation",
                icon: "🚀",
                description: "Constantly improving our platform to deliver exceptional experiences."
              }
            ].map((value, index) => (
              <div key={index} className="bg-gray-50 p-6 rounded-xl text-center hover:shadow-md transition-shadow">
                <div className="text-4xl mb-4">{value.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Meet Our Team</h2>
          <div className="h-1 w-20 bg-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
            The passionate people behind TaskGuru's success
          </p>
        </div>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {teamMembers.map((member, index) => (
            <div key={index} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <img 
                src={member.image} 
                alt={member.name} 
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-800">{member.name}</h3>
                <p className="text-blue-600 mb-2">{member.role}</p>
                <p className="text-gray-600 text-sm">{member.bio}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Ready to get started?</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Join thousands of satisfied users and professionals on TaskGuru today
          </p>
          <div className="flex justify-center space-x-4">
            <Link
              to="/register"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition"
            >
              Sign Up Now
            </Link>
            <Link
              to="/contact"
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-bold border border-blue-600 hover:bg-blue-50 transition"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}