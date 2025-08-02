import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register, isAuthenticated, validateEmail, validatePassword, getUserId } from '../utils/auth';
import './Register.css';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

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
    } else {
      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.isValid) {
        newErrors.password = passwordValidation.errors[0]; // Show first error
      }
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setGeneralError('');

    try {
      console.log('Attempting registration for:', formData.email);
      
      const result = await register(formData.email.trim(), formData.password);

      if (result.success) {
        console.log('Registration successful:', result.user);
        setSuccess(true);
        
        // Redirect to login after a short delay
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              message: 'Registration successful! Please sign in with your new account.',
              email: formData.email 
            }
          });
        }, 2000);
      } else {
        console.log('Registration failed:', result.error);
        
        // Handle specific error codes
        switch (result.error) {
          case 'User already exists':
            setGeneralError('An account with this email already exists. Please use a different email or sign in.');
            break;
          case 'Invalid email format':
            setErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
            break;
          default:
            setGeneralError(result.error || 'Registration failed. Please try again.');
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      setGeneralError('Connection error. Please check your internet connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Show success message
  if (success) {
    return (
      <div className="register-container">
        <div className="register-wrapper">
          <div className="register-form-container">
            <div className="success-message">
              <div className="success-icon">✅</div>
              <h2>Registration Successful!</h2>
              <p>Your account has been created successfully.</p>
              <p>Redirecting you to the login page...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="register-container">
      <div className="register-wrapper">
        <div className="register-form-container">
          <div className="register-header">
            <h1>Create Your Account</h1>
            <p>Join SoleCRM and start managing your business relationships</p>
          </div>

          <form onSubmit={handleSubmit} className="register-form" noValidate>
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
                placeholder="Enter your email address"
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
                autoComplete="new-password"
                placeholder="Create a strong password"
              />
              {errors.password && <span className="error-text">{errors.password}</span>}
              {!errors.password && formData.password && (
                <div className="password-requirements">
                  <small>Password must contain:</small>
                  <ul>
                    <li className={formData.password.length >= 8 ? 'valid' : ''}>
                      At least 8 characters
                    </li>
                    <li className={/[A-Z]/.test(formData.password) ? 'valid' : ''}>
                      One uppercase letter
                    </li>
                    <li className={/[a-z]/.test(formData.password) ? 'valid' : ''}>
                      One lowercase letter
                    </li>
                    <li className={/\d/.test(formData.password) ? 'valid' : ''}>
                      One number
                    </li>
                  </ul>
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className={errors.confirmPassword ? 'error' : ''}
                disabled={isLoading}
                autoComplete="new-password"
                placeholder="Confirm your password"
              />
              {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
            </div>

            <button 
              type="submit" 
              className="register-button"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="register-footer">
            <p>
              Already have an account? {' '}
              <Link to="/login" className="login-link">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
