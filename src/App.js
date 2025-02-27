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
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import logo from './images/logodopaflow.png';
import logo2 from './images/logo_simple_dopaflow.png';
import axios from 'axios';

// Component to refresh data on mount, only if no error
const RefreshOnMount = ({ fetchData, hasError }) => {
  const [hasFetched, setHasFetched] = useState(false); // Track if we've fetched once

  useEffect(() => {
    if (!hasError && !hasFetched) { // Only fetch if no error and not yet fetched
      fetchData().then(() => setHasFetched(true)).catch(() => setHasFetched(true)); // Mark as fetched even on error
    }
  }, [fetchData, hasError, hasFetched]);

  return null;
};

const getInitials = (name = '') => {
  if (!name) return '??';
  const names = name.split(' ');
  return names.map((n) => n.charAt(0)).join('').toUpperCase().slice(0, 2);
};

const getRandomColor = () => {
  const colors = ['#FF6633', '#FFB399', '#FF33FF', '#00B3E6', '#E6B333', '#3366E6'];
  return colors[Math.floor(Math.random() * colors.length)];
};

const ProtectedRoute = ({ children, allowedRoles = ['SuperAdmin', 'Admin'], fetchUser }) => {
  const token = localStorage.getItem('token');
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null); // Track errors locally

  const fetchUserData = async () => {
    if (token) {
      try {
        const response = await axios.get('http://localhost:8080/api/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const photoUrl = response.data.profilePhotoUrl
          ? `http://localhost:8080${response.data.profilePhotoUrl}`
          : '';
        setUser({ ...response.data, profilePhotoUrl: photoUrl });
        setError(null); // Clear error on success
        return true; // Indicate success
      } catch (error) {
        console.error('Failed to fetch user data in ProtectedRoute:', error);
        setError('Failed to load user data');
        throw error; // Propagate error to RefreshOnMount
      }
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [token]);

  if (!token) return <Navigate to="/login" />;
  if (!user && !error) return <div className="flex items-center justify-center h-screen">Loading...</div>;

  if (user && ['/users', '/dashboard'].includes(window.location.pathname) && !allowedRoles.includes(user.role)) {
    return <Navigate to="/contacts" />;
  }

  return (
    <>
      <RefreshOnMount fetchData={fetchUserData} hasError={!!error} />
      {error && <div className="text-red-600 text-center p-4">{error}</div>}
      {children}
    </>
  );
};

function App() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [error, setError] = useState(null); // App-level error state

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8080/api/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const photoUrl = response.data.profilePhotoUrl
        ? `http://localhost:8080${response.data.profilePhotoUrl}`
        : '';
      setUser({ ...response.data, profilePhotoUrl: photoUrl });
      setError(null); // Clear error on success
      return true;
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      setError('Failed to fetch user data');
      setIsLoggedIn(false);
      localStorage.removeItem('token');
      throw error;
    }
  };

  useEffect(() => {
    if (isLoggedIn) fetchUser();
  }, [isLoggedIn]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setUser(null);
    setError(null);
    window.location.href = '/login';
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const navLinks = user ? [
    ...(user.role === 'User' ? [] : [{ to: '/dashboard', label: 'Dashboard', icon: 'dashboard' }]),
    ...(user.role === 'User' ? [] : [{ to: '/users', label: 'Users', icon: 'people' }]),
    { to: '/contacts', label: 'Contacts', icon: 'contacts' },
    { to: '/tasks', label: 'Tasks', icon: 'task' },
    { to: '/reports', label: 'Reports', icon: 'analytics' },
    { to: '/import-export', label: 'Import/Export', icon: 'swap_horiz' },
    { to: '/opportunities', label: 'Opportunities', icon: 'trending_up' },
    { to: '/tickets', label: 'Support', icon: 'support' },
  ] : [];

  return (
    <Router>
      <div className="h-screen ">
        {!isLoggedIn ? (
          <>
            <div className="flex justify-between items-center p-4">
              <img src={logo} alt="Logo" className="w-42 h-20 object-contain rounded-lg shadow-md" />
              <div className="space-x-4">
                <NavLink to="/login" className="relative inline-block text-blue-600 py-2 px-6 rounded-lg font-medium border-2 border-blue-600 overflow-hidden group before:content-[''] before:absolute before:inset-0 before:bg-blue-600 before:transform before:-translate-x-full hover:before:translate-x-0 before:transition-transform before:duration-300 hover:text-white">
                  <span className="relative z-10">Login</span>
                </NavLink>
                <NavLink to="/signup" className="relative inline-block text-green-600 py-2 px-6 rounded-lg font-medium border-2 border-green-600 overflow-hidden group before:content-[''] before:absolute before:inset-0 before:bg-green-600 before:transform before:-translate-x-full hover:before:translate-x-0 before:transition-transform before:duration-300 hover:text-white">
                  <span className="relative z-10">Signup</span>
                </NavLink>
              </div>
            </div>
            <Routes>
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} />} />
              <Route path="/" element={<Login setIsLoggedIn={setIsLoggedIn} />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
            </Routes>
          </>
        ) : (
          <div className="flex">
            <aside className={`fixed h-screen bg-white shadow-xl p-4 flex flex-col transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
              <div className="flex items-left justify-between mb-4">
                <img src={isSidebarOpen ? logo : logo2} alt="Logo" className={`object-contain rounded-lg transition-all duration-300 ${isSidebarOpen ? 'w-38 h-16' : 'w-12 h-12'}`} style={{ marginTop: '5px', marginLeft: '0' }} />
                <button onClick={toggleSidebar} className="fixed top-2.5 left-14 flex items-center justify-center w-10 h-10 bg-white border border-gray-200 rounded-full hover:bg-gray-100 hover:shadow-md transition-all duration-200 z-50" style={{ top: '25px', left: isSidebarOpen ? '260px' : '90px' }}>
                  <span className="material-icons-round text-gray-600 text-base">{isSidebarOpen ? 'close' : 'menu'}</span>
                </button>
              </div>
              <nav className="flex-1 space-y-2 mt-2 overflow-y-auto">
                {navLinks.map(link => (
                  <NavLink key={link.to} to={link.to} className={({ isActive }) => `flex items-center p-3 rounded-lg transition-colors duration-200 ${isActive ? 'bg-[#0056B3] text-white' : 'hover:bg-[#0056B3]/10 text-[#333]'}`}>
                    <span className="material-icons-round mr-3">{link.icon}</span>
                    {isSidebarOpen && <span>{link.label}</span>}
                  </NavLink>
                ))}
              </nav>
              <button onClick={handleLogout} className="flex items-center p-3 rounded-lg hover:bg-[#DC3545]/10 text-[#333] w-full text-left">
                <span className="material-icons-round mr-3">logout</span>
                {isSidebarOpen && 'Logout'}
              </button>
            </aside>
            <main className={`flex-1 p-8 pt-16 overflow-auto transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
              {error && <div className="text-red-600 text-center p-4 mb-4">{error}</div>}
              <div className="flex justify-between items-center mb-8">
                <div className="relative" style={{ position: 'absolute', top: '20px', right: '30px' }}>
                  <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center space-x-2 hover:bg-gray-100 p-2 rounded-lg transition-colors duration-200">
                    {user?.profilePhotoUrl && (
                      <img
                        src={user.profilePhotoUrl}
                        alt="Profile"
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    )}
                    {!user?.profilePhotoUrl && (
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: getRandomColor() }}
                      >
                        {getInitials(user?.username)}
                      </div>
                    )}
                    <span className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-800 truncate max-w-[100px]">
                        {user ? user.username : 'Loading...'}
                      </span>
                    </span>
                    <span className="material-icons-round text-gray-500">expand_more</span>
                  </button>
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 z-40">
                      <div className="p-4 border-b border-gray-100">
                        <div className="flex items-center space-x-2 mb-1">
                          {!user?.profilePhotoUrl && (
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                              style={{ backgroundColor: getRandomColor() }}
                            >
                              {getInitials(user?.username)}
                            </div>
                          )}
                          <div>
                            <span className="text-sm font-medium text-gray-800 truncate">{user ? user.username : 'Loading...'}</span>
                            <span className={`px-2 py-1 ml-5 rounded-full text-xs font-medium ${
                              user.role === 'SuperAdmin' ? 'bg-purple-100 text-purple-800' :
                              user.role === 'Admin' ? 'bg-blue-100 text-blue-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {user.role}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500">{user ? user.email : ''}</p>
                      </div>
                      <div className="p-2">
                        <NavLink to="/profile" className="block px-4 py-2 text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200">Profile</NavLink>
                        <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors duration-200">Logout</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="max-w-7xl mx-auto">
                <Routes>
                  <Route path="/verify-email" element={<VerifyEmail />} />
                  <Route path="/profile" element={<ProtectedRoute fetchUser={fetchUser}><Profile setUser={setUser} /></ProtectedRoute>} />
                  <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['SuperAdmin', 'Admin']} fetchUser={fetchUser}><Dashboard /></ProtectedRoute>} />
                  <Route path="/" element={<Login setIsLoggedIn={setIsLoggedIn} />} />
                  <Route path="/users" element={<ProtectedRoute allowedRoles={['SuperAdmin', 'Admin']} fetchUser={fetchUser}><Users /></ProtectedRoute>} />
                  <Route path="/contacts" element={<ProtectedRoute fetchUser={fetchUser}><Contacts /></ProtectedRoute>} />
                  <Route path="/tasks" element={<ProtectedRoute fetchUser={fetchUser}><Tasks /></ProtectedRoute>} />
                  <Route path="/reports" element={<ProtectedRoute fetchUser={fetchUser}><Reports /></ProtectedRoute>} />
                  <Route path="/import-export" element={<ProtectedRoute fetchUser={fetchUser}><ImportExport /></ProtectedRoute>} />
                  <Route path="/opportunities" element={<ProtectedRoute fetchUser={fetchUser}><Opportunities /></ProtectedRoute>} />
                  <Route path="/tickets" element={<ProtectedRoute fetchUser={fetchUser}><Ticket /></ProtectedRoute>} />
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