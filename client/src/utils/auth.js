// Authentication utility functions

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

// Token management
export const setAuthToken = (token) => {
  localStorage.setItem('token', token);
};

export const getAuthToken = () => {
  return localStorage.getItem('token');
};

export const removeAuthToken = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

// User data management
export const setUserData = (user) => {
  localStorage.setItem('user', JSON.stringify(user));
};

export const getUserData = () => {
  const userData = localStorage.getItem('user');
  return userData ? JSON.parse(userData) : null;
};

export const getUserId = () => {
  const user = getUserData();
  return user?.id || null;
};

// Authentication headers
export const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

// Authentication status
export const isAuthenticated = () => {
  const token = getAuthToken();
  const user = getUserData();
  
  if (!token || !user) {
    return false;
  }

  // Check if token is expired (basic check)
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    
    if (payload.exp < currentTime) {
      // Token is expired, clean up
      removeAuthToken();
      return false;
    }
    
    return true;
  } catch (error) {
    // Invalid token format
    removeAuthToken();
    return false;
  }
};

// API request wrapper with authentication
export const authenticatedFetch = async (url, options = {}) => {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('No authentication token available');
  }

  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  };

  const response = await fetch(`${API_BASE_URL}${url}`, config);

  // Handle authentication errors
  if (response.status === 401) {
    // Token is invalid or expired
    removeAuthToken();
    window.location.href = '/login';
    throw new Error('Authentication required');
  }

  if (response.status === 403) {
    throw new Error('Access denied');
  }

  return response;
};

// Login function
export const login = async (email, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }

    // Store authentication data
    setAuthToken(data.token);
    setUserData(data.user);

    return {
      success: true,
      user: data.user,
      token: data.token
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      error: error.message || 'Login failed'
    };
  }
};

// Password validation helper
export const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  
  const errors = [];
  
  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  }
  
  if (!hasUpperCase) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!hasLowerCase) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!hasNumbers) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Email validation helper
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Check authentication status on app load
export const initializeAuth = async () => {
  if (!isAuthenticated()) {
    return { authenticated: false };
  }

  try {
    const result = await verifyToken();
    return {
      authenticated: result.success,
      user: result.user
    };
  } catch (error) {
    return { authenticated: false };
  }
}

// Register function
export const register = async (email, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Registration failed');
    }

    return {
      success: true,
      user: data.user,
      message: data.message
    };
  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      error: error.message || 'Registration failed'
    };
  }
};

// Verify token function
export const verifyToken = async () => {
  try {
    const response = await authenticatedFetch('/api/auth/verify');
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Token verification failed');
    }

    // Update user data if needed
    if (data.user) {
      setUserData(data.user);
    }

    return {
      success: true,
      user: data.user
    };
  } catch (error) {
    console.error('Token verification error:', error);
    removeAuthToken();
    return {
      success: false,
      error: error.message || 'Token verification failed'
    };
  }
};

// Logout function
export const logout = async () => {
  try {
    // Optional: Call backend logout endpoint
    const token = getAuthToken();
    if (token) {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }).catch(() => {
        // Ignore logout errors, still clean up locally
      });
    }
  } catch (error) {
    console.error('Logout error:', error);
  }
};