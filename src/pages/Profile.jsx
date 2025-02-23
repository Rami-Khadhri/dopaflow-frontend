import React, { useState, useEffect } from 'react';
import { FaUser, FaEnvelope, FaLock, FaShieldAlt, FaHistory } from 'react-icons/fa';
import { QRCodeSVG } from 'qrcode.react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const OtpInput = ({ value, onChange, numInputs = 6 }) => {
  const inputRefs = React.useRef([]);

  const digits = Array.from({ length: numInputs }, (_, i) => value[i] || '');

  const handleChange = (e, i) => {
    const val = e.target.value;
    if (/^\d*$/.test(val)) {
      let newDigits = [...digits];
      newDigits[i] = val.slice(-1);
      const newOtp = newDigits.join('');
      onChange(newOtp);
      if (val && i < numInputs - 1) {
        inputRefs.current[i + 1].focus();
      }
    }
  };

  const handleKeyDown = (e, i) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      inputRefs.current[i - 1].focus();
    }
  };

  return (
    <div className="flex space-x-2">
      {Array.from({ length: numInputs }).map((_, i) => (
        <input
          key={i}
          ref={el => inputRefs.current[i] = el}
          type="text"
          inputMode="numeric"
          maxLength={1}
          className="w-12 h-12 text-center border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-150"
          value={digits[i]}
          onChange={(e) => handleChange(e, i)}
          onKeyDown={(e) => handleKeyDown(e, i)}
        />
      ))}
    </div>
  );
};

const Profile = () => {
  const [profile, setProfile] = useState({
    username: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
    twoFactorEnabled: false,
    lastLogin: null,
    loginHistory: []
  });
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No authentication token found');
        const response = await api.get('/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfile({
          username: response.data.username,
          email: response.data.email,
          currentPassword: '',
          newPassword: '',
          confirmNewPassword: '',
          twoFactorEnabled: response.data.twoFactorEnabled,
          lastLogin: response.data.lastLogin,
          loginHistory: response.data.loginHistory || []
        });
      } catch (err) {
        setError(err.response?.data?.message || err.message);
        navigate('/login');
      }
    };
    fetchProfile();
  }, [navigate]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (profile.newPassword && profile.newPassword !== profile.confirmNewPassword) {
      setError('New passwords do not match');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      const payload = {
        username: profile.username,
        currentPassword: profile.currentPassword || undefined,
        newPassword: profile.newPassword || undefined,
        twoFactorEnabled: profile.twoFactorEnabled,
      };
      const response = await api.put('/profile/update', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile((prev) => ({
        ...prev,
        ...response.data,
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      }));
      setMessage('Profile updated successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed');
    }
  };

  const handleEnable2FA = async () => {
    setError('');
    setMessage('');
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      const response = await api.post('/auth/2fa/enable', {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setQrCodeUrl(response.data.qrUrl);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to enable 2FA');
    }
  };

  const handleVerify2FA = async () => {
    setError('');
    setMessage('');
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      const response = await api.post('/auth/2fa/verify', { code: otp }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile((prev) => ({ ...prev, twoFactorEnabled: true }));
      setMessage(response.data.message || '2FA enabled successfully');
      setQrCodeUrl('');
      setOtp('');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid 2FA code');
    }
  };

  const handleDisable2FA = async () => {
    setError('');
    setMessage('');
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
      const payload = { ...profile, twoFactorEnabled: false };
      await api.put('/profile/update', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile((prev) => ({ ...prev, twoFactorEnabled: false }));
      setMessage('2FA disabled successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to disable 2FA');
    }
  };

  const lastLoginInfo = profile.loginHistory.length > 0 
    ? profile.loginHistory[profile.loginHistory.length - 1] 
    : null;

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-4">
      {/* User Info Section */}
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md mb-6">
        <h1 className="text-2xl font-bold text-[#333] mb-6 text-center">User Information</h1>
        {error && <p className="text-sm text-red-500 mb-4 text-center">{error}</p>}
        {message && <p className="text-sm text-green-600 mb-4 text-center">{message}</p>}
        
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#666] mb-1">Username</label>
            <div className="relative">
              <input
                type="text"
                value={profile.username}
                onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                className="w-full px-4 py-2 pl-10 border rounded-lg focus:ring-2 focus:ring-[#0056B3]"
                required
              />
              <FaUser className="absolute left-3 top-3 text-[#666]" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#666] mb-1">Email</label>
            <div className="relative">
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full px-4 py-2 pl-10 border rounded-lg bg-gray-100"
              />
              <FaEnvelope className="absolute left-3 top-3 text-[#666]" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#666] mb-1">Current Password</label>
            <div className="relative">
              <input
                type="password"
                value={profile.currentPassword}
                onChange={(e) => setProfile({ ...profile, currentPassword: e.target.value })}
                className="w-full px-4 py-2 pl-10 border rounded-lg focus:ring-2 focus:ring-[#0056B3]"
              />
              <FaLock className="absolute left-3 top-3 text-[#666]" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#666] mb-1">New Password</label>
            <div className="relative">
              <input
                type="password"
                value={profile.newPassword}
                onChange={(e) => setProfile({ ...profile, newPassword: e.target.value })}
                className="w-full px-4 py-2 pl-10 border rounded-lg focus:ring-2 focus:ring-[#0056B3]"
              />
              <FaLock className="absolute left-3 top-3 text-[#666]" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#666] mb-1">Confirm New Password</label>
            <div className="relative">
              <input
                type="password"
                value={profile.confirmNewPassword}
                onChange={(e) => setProfile({ ...profile, confirmNewPassword: e.target.value })}
                className="w-full px-4 py-2 pl-10 border rounded-lg focus:ring-2 focus:ring-[#0056B3]"
              />
              <FaLock className="absolute left-3 top-3 text-[#666]" />
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-[#0056B3] text-white px-6 py-2 rounded-lg hover:bg-[#004499] transition duration-200"
          >
            Save Changes
          </button>
        </form>
      </div>

      {/* Security Information Section */}
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md mb-6 border-l-4 border-[#0056B3]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <FaShieldAlt className="text-[#0056B3] text-2xl mr-2" />
            <h2 className="text-xl font-bold text-[#333]">Security Information</h2>
          </div>
          <button
  onClick={() => setShowHistoryModal(true)}
  className="flex items-center bg-[#0056B3] text-white px-3 py-1.5 rounded-md hover:bg-[#004499] transition duration-200 text-sm shadow-md"
>
  <FaHistory className="mr-1 text-base" />
  View History
</button>

        </div>
        <div className="bg-gray-50 p-4 rounded-lg shadow-inner">
          <div className="space-y-3 text-sm text-[#666]">
            <div className="flex justify-between items-center">
              <span className="font-medium">Last Activity:</span>
              <span className="text-[#333]">
                {lastLoginInfo ? new Date(lastLoginInfo.loginTime).toLocaleString() : 'Never'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">IP Address:</span>
              <span className="text-[#333]">{lastLoginInfo ? lastLoginInfo.ipAddress : 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Location:</span>
              <span className="text-[#333]">{lastLoginInfo ? lastLoginInfo.location : 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Device:</span>
              <span className="text-[#333] truncate max-w-[200px]">
                {lastLoginInfo && lastLoginInfo.deviceInfo 
                  ? lastLoginInfo.deviceInfo.substring(0, 30) + (lastLoginInfo.deviceInfo.length > 30 ? '...' : '') 
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Login History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-[#333]">Login History</h3>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-[#666] hover:text-[#333] text-2xl"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              {profile.loginHistory.length > 0 ? (
                profile.loginHistory.slice().reverse().map((login, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:shadow-md transition duration-200"
                  >
                    <p className="text-sm text-[#666]">
                      <span className="font-medium">Time:</span>{' '}
                      {new Date(login.loginTime).toLocaleString()}
                    </p>
                    <p className="text-sm text-[#666]">
                      <span className="font-medium">IP Address:</span> {login.ipAddress}
                    </p>
                    <p className="text-sm text-[#666]">
                      <span className="font-medium">Location:</span> {login.location || 'Unknown'}
                    </p>
                    <p className="text-sm text-[#666] truncate">
                      <span className="font-medium">Device:</span>{' '}
                      {login.deviceInfo ? login.deviceInfo.substring(0, 50) + (login.deviceInfo.length > 50 ? '...' : '') : 'N/A'}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[#666] text-center">No login history available.</p>
              )}
            </div>
            <button
              onClick={() => setShowHistoryModal(false)}
              className="w-full mt-4 bg-[#0056B3] text-white px-6 py-2 rounded-lg hover:bg-[#004499] transition duration-200"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* 2FA Settings Section */}
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md transition-all duration-300 ease-in-out">
        <h2 className="text-xl font-bold text-[#333] mb-4 text-center">2FA Settings</h2>
        {profile.twoFactorEnabled ? (
          <button
            onClick={handleDisable2FA}
            className="w-full bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-all duration-200"
          >
            Disable 2FA
          </button>
        ) : qrCodeUrl ? (
          <div className="flex flex-col items-center transition-all duration-300 ease-in-out">
            <div className="mb-4">
              <QRCodeSVG value={qrCodeUrl} size={128} className="transition-all duration-300 ease-in-out" />
            </div>
            <p className="mb-4 text-center text-sm text-gray-600">
              Enter the 6-digit code from your authenticator app
            </p>
            <OtpInput value={otp} onChange={setOtp} numInputs={6} />
            <button
              onClick={handleVerify2FA}
              className="w-full mt-4 bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-all duration-200"
            >
              Verify
            </button>
          </div>
        ) : (
          <button
            onClick={handleEnable2FA}
            className="w-full bg-[#0056B3] text-white px-6 py-2 rounded-lg hover:bg-[#004499] transition-all duration-200"
          >
            Enable 2FA
          </button>
        )}
      </div>
    </div>
  );
};

export default Profile;