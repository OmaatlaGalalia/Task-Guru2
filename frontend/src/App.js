import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
// import Tasks from './pages/Tasks'; // Removed missing Tasks import
import TaskDetail from './pages/TaskDetail';
import ClientDashboard from './pages/ClientDashboard';
import TaskerDashboard from './pages/TaskerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import TaskForm from './components/TaskForm';
import About from './pages/About';
import Contact from './pages/Contact';
import BrowseTasks from './pages/BrowseTasks';
import Profile from './pages/Profile';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import CookiePolicy from './pages/CookiePolicy';
import ChatPage from './pages/ChatPage';
import ReviewPage from './pages/ReviewPage';
import PaymentPage from './pages/PaymentPage';

import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';

function App() {
  const DashboardRouter = () => {
    const { user } = useAuth();
    if (!user) return <Navigate to="/login" />;

    switch (user.role) {
      case 'admin':
        return <AdminDashboard />;
      case 'tasker':
        return <TaskerDashboard />;
      default:
        return <ClientDashboard />;
    }
  };

  return (
    <Router>
      <Navbar />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="/cookie-policy" element={<CookiePolicy />} />
        <Route path="/chat/:taskId/:taskerId" element={<ChatPage />} />
        <Route path="/review/:taskId/:taskerId" element={<ReviewPage />} />
        <Route path="/pay/:taskId" element={<PaymentPage />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardRouter />} />
<Route path="/profile" element={<Profile />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/tasks" element={<BrowseTasks />} />
          <Route path="/tasks/:id" element={<TaskDetail />} />
          <Route path="/post-task" element={<TaskForm />} />
          <Route path="/edit-task/:id" element={<TaskForm />} />
          <Route path="/browse" element={<BrowseTasks />} />
        </Route>

        {/* Redirect invalid paths to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

    </Router>
  );
}

export default App;