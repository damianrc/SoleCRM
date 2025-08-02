import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { login, isAuthenticated, validateEmail, getUserId } from '../utils/auth';
import './Login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // Check for registration success message
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      if (location.state?.email) {
        setFormData(prev => ({ ...prev, email: location.state.email }));
      }
      // Clear the location state
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated()) {
      const userId = getUserId();
      if (userId) {
        navigate(`/dashboard/${userId}`, { replace: true });
      }
    }
  }, [navigate]);

  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear field-specific error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Clear general error
    if (generalError) {
      setGeneralError('');
    }

    // Clear success message
    if (successMessage) {
      setSuccessMessage('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setGeneralError('');

    try {
      console.log('Attempting login for:', formData.email);
      
      const result = await login(formData.email.trim(), formData.password);

      if (result.success) {
        console.log('Login successful for user:', result.user.id);
        
        // Navigate to dashboard
        navigate(`/dashboard/${result.user.id}`, { replace: true });
      } else {
        console.log('Login failed:', result.error);
        
        // Handle specific error codes
        switch (result.error) {
          case 'Invalid email or password':
            setGeneralError('The email or password you entered is incorrect. Please try again.');
            break;
          case 'Too many authentication attempts, please try again later.':
            setGeneralError('Too many login attempts. Please wait a few minutes before trying again.');
            break;
          default:
            setGeneralError(result.error || 'Login failed. Please try again.');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      setGeneralError('Connection error. Please check your internet connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-wrapper">
        <div className="login-form-container">
          <div className="login-header">
            <h1>Welcome Back</h1>
            <p>Sign in to your SoleCRM account</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form" noValidate>
            {successMessage && (
              <div className="success-banner">
                <span className="success-icon">✅</span>
                {successMessage}
              </div>
            )}
            
            {generalError && (
              <div className="error-banner">
                <span className="error-icon">⚠️</span>
                {generalError}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={errors.email ? 'error' : ''}
                disabled={isLoading}
                autoComplete="email"
                placeholder="Enter your email"
              />
              {errors.email && <span className="error-text">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={errors.password ? 'error' : ''}
                disabled={isLoading}
                autoComplete="current-password"
                placeholder="Enter your password"
              />
              {errors.password && <span className="error-text">{errors.password}</span>}
            </div>

            <button 
              type="submit" 
              className="login-button"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="login-footer">
            <p>
              Don't have an account? {' '}
              <Link to="/register" className="register-link">
                Create one here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;