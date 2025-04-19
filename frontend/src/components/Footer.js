import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-gray-100 border-t mt-12">
      <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col md:flex-row justify-between items-center text-sm text-gray-600">
        <div className="mb-2 md:mb-0">&copy; {new Date().getFullYear()} Task Guru. All rights reserved.</div>
        <div className="flex space-x-4">
          <Link to="/privacy-policy" className="hover:underline">Privacy Policy</Link>
          <span>|</span>
          <Link to="/terms-of-service" className="hover:underline">Terms of Service</Link>
          <span>|</span>
          <Link to="/cookie-policy" className="hover:underline">Cookie Policy</Link>
        </div>
      </div>
    </footer>
  );
}
