import React, { useState, useEffect } from 'react';
import { FaLock, FaUser, FaCheck, FaExclamationCircle, FaTimes } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import logo_dopaflow from '../images/logo_simple_dopaflow.png';
import logo_authenticator from '../images/google_authenticator_logo.png';

// Message Display Component
const MessageDisplay = ({ message, type, onClose }) => {
  if (!message) return null;

  const bgColor = type === 'success' ? 'bg-green-100 border-green-500 text-green-700' : 'bg-red-100 border-red-500 text-red-700';

  return (
    <div className={`fixed top-5 left-1/2 transform -translate-x-1/2 mt-5 p-4 ${bgColor} border-l-4 rounded-xl shadow-lg flex items-center justify-between animate-slideIn max-w-3xl w-full z-[1000]`}>
      <div className="flex items-center">
        {type === 'success' ? <FaCheck className="text-xl mr-3" /> : <FaExclamationCircle className="text-xl mr-3" />}
        <span className="text-base">{message}</span>
      </div>
      <button
        onClick={onClose}
        className="p-1 hover:bg-opacity-20 rounded-xl transition-colors duration-200"
      >
        <FaTimes className="w-4 h-4" />
      </button>
    </div>
  );
};

// Error Boundary Component
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-red-600 text-center p-4">
          Something went wrong: {this.state.error?.message || 'Unknown error'}
        </div>
      );
    }
    return this.props.children;
  }
}

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
    <div className="flex space-x-3">
      {Array.from({ length: numInputs }).map((_, i) => (
        <input
          key={i}
          ref={(el) => (inputRefs.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          className="w-14 h-14 text-center text-lg font-semibold border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-300 bg-gray-50 shadow-sm"
          value={digits[i]}
          onChange={(e) => handleChange(e, i)}
          onKeyDown={(e) => handleKeyDown(e, i)}
        />
      ))}
    </div>
  );
};

const Login = ({ setIsLoggedIn }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('error');
  const [show2FA, setShow2FA] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [failed2FAAttempts, setFailed2FAAttempts] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    console.log('Login component mounted, checking URL params');
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('suspended') === 'true') {
      console.log('Suspended param detected, setting message');
      setMessage('Account suspended due to multiple failed 2FA attempts. Contact an admin.');
      setMessageType('error');
      setShow2FA(false);
    }
  }, []);

  useEffect(() => {
    console.log('Setting visibility timeout');
    setTimeout(() => {
      console.log('Setting isVisible to true');
      setIsVisible(true);
    }, 100);
  }, []);

  const clearMessage = () => {
    console.log('Clearing message');
    setMessage('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (isSubmitting) {
      console.log('Login submission blocked, already submitting');
      return;
    }
    setIsSubmitting(true);
    console.log('Handling login with email:', email);
    setMessage('');
    setFailed2FAAttempts(0);

    try {
      console.log('Sending /auth/login request');
      const response = await api.post('/auth/login', { email, password });
      console.log('Login response received:', response.data);
      const data = response.data;

      if (data.requires2FA) {
        console.log('2FA required, switching to 2FA view');
        setShow2FA(true);
        setTempToken(data.tempToken);
      } else if (data.token) {
        console.log('Login successful, setting token and navigating');
        localStorage.setItem('token', data.token);
        setIsLoggedIn(true);
        setMessage('Login successful!');
        setMessageType('success');
        setTimeout(() => {
          console.log('Navigating to /profile after login success');
          navigate('/profile');
        }, 3000);
      } else {
        console.log('Unexpected login response');
        setMessage('Unexpected login response');
        setMessageType('error');
      }
    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = err.response?.data?.message || 'Login failed';
      console.log('Setting error message:', errorMessage);
      setMessage(errorMessage);
      setMessageType('error');
    } finally {
      console.log('Resetting isSubmitting');
      setIsSubmitting(false);
    }
  };

  const handleVerify2FA = async (code) => {
    if (isSubmitting) {
      console.log('2FA submission blocked, already submitting');
      return;
    }
    setIsSubmitting(true);
    console.log(`Attempting 2FA verification, attempt ${failed2FAAttempts + 1}, code: ${code}`);
    setMessage('');

    try {
      console.log('Sending /auth/verify-2fa request');
      const response = await api.post(
        '/auth/verify-2fa',
        { code: parseInt(code) },
        { headers: { Authorization: `Bearer ${tempToken}` } }
      );
      console.log('2FA verification successful:', response.data);
      localStorage.setItem('token', response.data.token);
      setIsLoggedIn(true);
      setMessage('2FA verification successful!');
      setMessageType('success');
      setTimeout(() => {
        console.log('Navigating to /profile after 2FA success');
        navigate('/profile');
      }, 3000);
    } catch (err) {
      console.error('2FA verification failed:', err);
      const newAttempts = failed2FAAttempts + 1;
      setFailed2FAAttempts(newAttempts);
      console.log(`Failed 2FA attempt ${newAttempts}`);

      if (newAttempts < 3) {
        const errorMessage = `Invalid 2FA code. ${3 - newAttempts} attempts remaining`;
        console.log('Setting error message:', errorMessage);
        setMessage(errorMessage);
        setMessageType('error');
        setOtp('');
      } else {
        try {
          console.log('Attempting to suspend account');
          const suspendResponse = await api.post('/users/suspend-self', {}, {
            headers: { Authorization: `Bearer ${tempToken}` }
          });
          console.log('Account suspended successfully:', suspendResponse.data);
          setMessage('Account suspended due to multiple failed 2FA attempts. Contact an admin.');
          setMessageType('error');
          setShow2FA(false);
          setOtp('');
          setTempToken('');
          setTimeout(() => {
            console.log('Navigating to /login?suspended=true after suspension');
            navigate('/login?suspended=true', { replace: true });
          }, 3000);
        } catch (suspendErr) {
          console.error('Account suspension failed:', suspendErr);
          const errorMessage = 'Failed to suspend account. Please contact support.';
          console.log('Setting error message:', errorMessage);
          setMessage(errorMessage);
          setMessageType('error');
          setOtp('');
        }
      }
    } finally {
      console.log('Resetting isSubmitting');
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (otp.length === 6 && !isNaN(otp) && !isSubmitting) {
      console.log('Auto-verifying 6-digit OTP:', otp);
      handleVerify2FA(otp);
    }
  }, [otp, isSubmitting]);

  const handleSubmit2FA = (e) => {
    e.preventDefault();
    if (otp.length === 6 && !isNaN(otp) && !isSubmitting) {
      console.log('Manual 2FA verification triggered');
      handleVerify2FA(otp);
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-teal-100 via-blue-200 to-indigo-300 flex items-center justify-center p-4">
        <MessageDisplay message={message} type={messageType} onClose={clearMessage} />
        <div
          className={`bg-white rounded-2xl shadow-2xl p-10 w-full max-w-md transform transition-all duration-1000 ease-out ${
            isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
        >
          <div className="flex justify-center mb-3">
            <img src={logo_dopaflow} alt="Dopaflow Logo" className="h-12" />
          </div>

          <h1 className="text-3xl font-bold text-gray-800 mb-4 text-center">
            {show2FA ? 'Two-Factor Authentication' : 'Welcome Back'}
          </h1>

          {!show2FA ? (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 pl-12 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-300 bg-gray-50 shadow-sm"
                    placeholder="Your email"
                    required
                    disabled={isSubmitting}
                  />
                  <FaUser className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pl-12 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-300 bg-gray-50 shadow-sm"
                    placeholder="Your password"
                    required
                    disabled={isSubmitting}
                  />
                  <FaLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="text-sm text-teal-600 hover:underline transition-all duration-300"
                  disabled={isSubmitting}
                >
                  Forgot Password?
                </button>
              </div>
              <button
                type="submit"
                className={`w-full bg-gradient-to-r from-teal-500 to-blue-600 text-white px-6 py-3 rounded-xl hover:from-teal-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-md ${
                  isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Logging in...' : 'Login'}
              </button>
              <p className="text-sm text-gray-600 text-center mt-4">
                No account?{' '}
                <Link
                  to="/signup"
                  className="text-teal-600 hover:underline font-semibold"
                >
                  Sign up
                </Link>
              </p>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-center items-center space-x-4 mb-6">
                <img src={logo_dopaflow} alt="Dopaflow Logo" className="h-12" />
                <span className="text-gray-400 text-2xl">↔</span>
                <img
                  src={logo_authenticator}
                  alt="Google Authenticator Logo"
                  className="w-12 h-12"
                />
              </div>
              <p className="text-center text-sm text-gray-600">
                Enter the 6-digit code from your Google Authenticator app
              </p>
              <div className="flex justify-center">
                <OtpInput value={otp} onChange={setOtp} numInputs={6} />
              </div>
              <button
                type="button"
                disabled={otp.length < 6 || isSubmitting}
                onClick={handleSubmit2FA}
                className={`w-full px-6 py-3 rounded-xl transition-all transform hover:scale-105 shadow-md ${
                  otp.length < 6 || isSubmitting
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-teal-500 to-blue-600 text-white hover:from-teal-600 hover:to-blue-700'
                }`}
              >
                {isSubmitting ? 'Verifying...' : 'Verify'}
              </button>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default Login;