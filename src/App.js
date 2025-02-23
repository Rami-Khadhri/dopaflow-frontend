import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Contacts from './pages/Contacts';
import Tasks from './pages/Tasks';
import Reports from './pages/Reports';
import ImportExport from './pages/ImportExport';
import Opportunities from './pages/Opportunities';
import Ticket from './pages/Ticket';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import VerifyEmail from './pages/VerifyEmail';
import logo from './images/logodopaflow.png';
import logo2 from './images/logo_simple_dopaflow.png';
import axios from 'axios';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

const getInitials = (name = '') => {
  if (!name) return '';
  const names = name.split(' ');
  return names.map((n) => n.charAt(0)).join('').toUpperCase().slice(0, 2);
};

const getRandomColor = () => {
  const colors = ['#FF6633', '#FFB399', '#FF33FF', '#00B3E6', '#E6B333', '#3366E6'];
  return colors[Math.floor(Math.random() * colors.length)];
};

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

function App() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const fetchUser = async () => {
    try {
      const authHeader = `Bearer ${localStorage.getItem('token')}`;
      const response = await axios.get('http://localhost:8080/api/profile', {
        headers: { Authorization: authHeader },
      });
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchUser();
    }
  }, [isLoggedIn]);

  const initials = user ? getInitials(user.username) : 'AB';
  const bgColor = getRandomColor();

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    window.location.href = '/login';
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Navigation items
  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { to: '/users', label: 'Users', icon: 'people' },
    { to: '/contacts', label: 'Contacts', icon: 'contacts' },
    { to: '/tasks', label: 'Tasks', icon: 'task' },
    { to: '/reports', label: 'Reports', icon: 'analytics' },
    { to: '/import-export', label: 'Import/Export', icon: 'swap_horiz' },
    { to: '/opportunities', label: 'Opportunities', icon: 'trending_up' },
    { to: '/tickets', label: 'Support', icon: 'support' },
  ];

  return (
    <Router>
      <div className="h-screen bg-[#F8F9FA]">
        {!isLoggedIn ? (
          <>
            {/* Public header */}
            <div className="flex justify-between items-center p-4">
              <img
                src={logo}
                alt="Logo"
                className="w-42 h-20 object-contain rounded-lg shadow-md"
              />
<div className="space-x-4">
  <NavLink 
    to="/login" 
    className="relative inline-block text-blue-600 py-2 px-6 rounded-lg font-medium 
    border-2 border-blue-600 overflow-hidden group
    before:content-[''] before:absolute before:inset-0 before:bg-blue-600 
    before:transform before:-translate-x-full hover:before:translate-x-0 
    before:transition-transform before:duration-300
    hover:text-white"
  >
    <span className="relative z-10">Login</span>
  </NavLink>
  <NavLink 
    to="/signup" 
    className="relative inline-block text-green-600 py-2 px-6 rounded-lg font-medium 
    border-2 border-green-600 overflow-hidden group
    before:content-[''] before:absolute before:inset-0 before:bg-green-600 
    before:transform before:-translate-x-full hover:before:translate-x-0 
    before:transition-transform before:duration-300
    hover:text-white"
  >
    <span className="relative z-10">Signup</span>
  </NavLink>
</div>
            </div>

            <Routes>
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
            </Routes>
          </>
        ) : (
          <div className="flex">
            {/* Sidebar */}
            <aside
              className={`fixed h-screen bg-white shadow-xl p-4 flex flex-col transition-all duration-300 ease-in-out ${
                isSidebarOpen ? 'w-64' : 'w-20'
              }`}
            >
              {/* Header */}
              <div className="flex items-left justify-between mb-4">
              <img
  src={isSidebarOpen ? logo : logo2}
  alt="Logo"
  className={`object-contain rounded-lg transition-all duration-300 ${
    isSidebarOpen ? 'w-38 h-16' : 'w-12 h-12'
  }`}
  style={{ marginTop: '5px', marginLeft: '0' }} // Exact pixel positioning
/>
                
<button
  onClick={toggleSidebar}
  className="fixed top-2.5 left-14 flex items-center justify-center w-10 h-10 bg-white border border-gray-200 rounded-full hover:bg-gray-100 hover:shadow-md transition-all duration-200 z-50"
  style={{ top: '25px', left: isSidebarOpen ? '260px' : '90px' }} // Dynamic left positioning relative to viewport
>
  <span className="material-icons-round text-gray-600 text-base">
  {isSidebarOpen ? 'close' : 'menu'}
  </span>
</button>

              </div>
              
              {/* Navigation */}
              <nav className="flex-1 space-y-2 mt-2 overflow-y-auto">
                {navLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className={({ isActive }) =>
                      `flex items-center p-3 rounded-lg transition-colors duration-200 ${
                        isActive ? 'bg-[#0056B3] text-white' : 'hover:bg-[#0056B3]/10 text-[#333]'
                      }`
                    }
                  >
                    <span className="material-icons-round mr-3">{link.icon}</span>
                    {isSidebarOpen && <span>{link.label}</span>}
                  </NavLink>
                ))}

               
              </nav>
              <button
                  onClick={handleLogout}
                  className="flex items-center p-3 rounded-lg hover:bg-[#DC3545]/10 text-[#333] w-full text-left"
                >
                  <span className="material-icons-round mr-3">logout</span>
                  {isSidebarOpen && 'Logout'}
                </button>
                
            </aside>

            {/* Main Content */}
            
            <main
              className={`flex-1 p-8 pt-16 overflow-auto transition-all duration-300 ${
                isSidebarOpen ? 'ml-64' : 'ml-20'
              }`}
            >
              <div className="flex justify-between items-center mb-8">
              <div className="relative" style={{ position: 'absolute', top: '20px', right: '30px' }}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center space-x-2 hover:bg-[#F8F9FA] p-2 rounded-lg"
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: bgColor }}
                    >
                      {getInitials(user?.username)}
                    </div>
                    <span className="text-[#333]">{user ? user.username : 'Loading...'}</span>
                    <span className="material-icons-round text-[#666]">expand_more</span>
                  </button>
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border">
                      <div className="p-4 border-b">
                        <p className="text-sm font-medium text-[#333]">
                          {user ? user.username : 'Loading...'}
                        </p>
                        <p className="text-xs text-[#666]">
                          {user ? user.email : ''}
                        </p>
                      </div>
                      <div className="p-2">
                        <NavLink
                          to="/profile"
                          className="block px-4 py-2 text-[#333] hover:bg-[#F8F9FA] rounded-lg"
                        >
                          Profile
                        </NavLink>
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2  text-[#DC3545] hover:bg-[#DC3545]/10 rounded-lg"
                        >
                          Logout
                        </button>
                      </div>
                      
                    </div>
                  )}
                </div>
              </div>

              <div className="max-w-7xl mx-auto">
                <Routes>
                  <Route path="/verify-email" element={<VerifyEmail />} />
                  <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/" element={<Login />} />
                  <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
                  <Route path="/contacts" element={<ProtectedRoute><Contacts /></ProtectedRoute>} />
                  <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
                  <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
                  <Route path="/import-export" element={<ProtectedRoute><ImportExport /></ProtectedRoute>} />
                  <Route path="/opportunities" element={<ProtectedRoute><Opportunities /></ProtectedRoute>} />
                  <Route path="/tickets" element={<ProtectedRoute><Ticket /></ProtectedRoute>} />
                </Routes>
              </div>
            </main>
          </div>
        )}
      </div>
    </Router>
  );
}

export default App;
