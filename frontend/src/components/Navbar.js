import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import logo from '../logo.png';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
      }
    };
    fetchUserData();
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const getInitial = () => {
    if (userData?.firstName) {
      return userData.firstName[0].toUpperCase();
    }
    return user?.email[0].toUpperCase() || '?';
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img src={logo} alt="Task Guru Logo" className="h-8 w-8 mr-2" />
            <span className="text-2xl font-bold text-blue-600">TaskGuru</span>
          </Link>

          {/* User/account dropdown or icon here */}
          
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
              Home
            </Link>
            {user && (
              <>
                <Link to="/post-task" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                  Post a Task
                </Link>
                <Link to="/browse" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                  Browse Tasks
                </Link>
              </>
            )}
            <Link to="/about" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
              About
            </Link>
            <Link to="/contact" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
              Contact
            </Link>
          </div>

          {/* Auth Section */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-blue-600 font-medium rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center">
                    {getInitial()}
                  </div>
                  <svg
                    className={`w-4 h-4 transition-transform ${showUserMenu ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showUserMenu && (
  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
    <Link
      to={userData?.role === 'admin' ? '/admin-dashboard' : '/dashboard'}
      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
      onClick={() => setShowUserMenu(false)}
    >
      Dashboard
    </Link>
    <Link
      to="/profile"
      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
      onClick={() => setShowUserMenu(false)}
    >
      Profile
    </Link>
    <button
      onClick={() => {
        handleLogout();
        setShowUserMenu(false);
      }}
      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
    >
      Log out
    </button>
  </div>
)}
              </div>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="px-4 py-2 text-blue-600 font-medium rounded-lg border border-blue-600 hover:bg-blue-50 transition-colors"
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-md"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}