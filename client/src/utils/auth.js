// Authentication utility functions with refresh token support

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

// Token management with refresh token support
export const setAuthTokens = (tokens) => {
  localStorage.setItem('accessToken', tokens.accessToken);
  localStorage.setItem('refreshToken', tokens.refreshToken);
  localStorage.setItem('tokenExpiry', tokens.accessTokenExpiry);
};

export const getAuthToken = () => {
  return localStorage.getItem('accessToken');
};

export const getRefreshToken = () => {
  return localStorage.getItem('refreshToken');
};

export const removeAuthTokens = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('tokenExpiry');
  localStorage.removeItem('token'); // Legacy token
  localStorage.removeItem('user');
  localStorage.removeItem('userId'); // Legacy key that might be used elsewhere
  localStorage.removeItem('crm_contacts'); // Clear any cached contacts
  
  // Set a logout flag to prevent immediate re-authentication
  localStorage.setItem('logout_in_progress', 'true');
  
  // Clear any other auth-related items
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith('auth_') || key.startsWith('user_') || key.startsWith('token_'))) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));
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

// Authentication headers for API requests
export const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

// Authentication status with token validation
export const isAuthenticated = () => {
  // Check if logout is in progress
  if (localStorage.getItem('logout_in_progress') === 'true') {
    return false;
  }
  
  const token = getAuthToken();
  const refreshToken = getRefreshToken();
  const user = getUserData();
  
  if (!token || !refreshToken || !user) {
    return false;
  }

  // Check if access token is expired (basic check)
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    
    // If access token is expired but we have a refresh token, 
    // we're still considered authenticated (will refresh automatically)
    if (payload.exp < currentTime) {
      return !!refreshToken; // Return true if we have a refresh token
    }
    
    return true;
  } catch (error) {
    // If we can't parse the token but have a refresh token, try to use it
    return !!refreshToken;
  }
};

// Refresh access token using refresh token
export const refreshAccessToken = async () => {
  try {
    const refreshToken = getRefreshToken();
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    
    // Update stored tokens
    setAuthTokens(data);
    setUserData(data.user);
    
    return data.accessToken;
  } catch (error) {
    console.error('Token refresh failed:', error);
    // If refresh fails, clear all tokens and redirect to login
    removeAuthTokens();
    window.location.href = '/login';
    throw error;
  }
};

// API request wrapper with automatic token refresh
export const authenticatedFetch = async (url, options = {}) => {
  let token = getAuthToken();
  
  if (!token) {
    throw new Error('No authentication token available');
  }

  const makeRequest = async (accessToken) => {
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        ...options.headers,
      },
    };

    return fetch(`${API_BASE_URL}${url}`, config);
  };

  let response = await makeRequest(token);

  // If access token is expired, try to refresh it
  if (response.status === 401) {
    try {
      const newToken = await refreshAccessToken();
      response = await makeRequest(newToken);
    } catch (refreshError) {
      // Refresh failed, user needs to login again
      console.error('Token refresh failed:', refreshError);
      removeAuthTokens();
      window.location.href = '/login';
      throw new Error('Authentication required');
    }
  }

  if (response.status === 403) {
    throw new Error('Access denied');
  }

  return response;
};

// Login function with refresh token support
export const login = async (email, password) => {
  try {
    // Clear logout flag when attempting to login
    localStorage.removeItem('logout_in_progress');
    
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

    // Store authentication data with new token structure
    setAuthTokens(data);
    setUserData(data.user);

    return {
      success: true,
      user: data.user,
      tokens: {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken
      }
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

// Register function with token support
export const register = async (email, password, displayName = null) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, displayName }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Registration failed');
    }

    // Store authentication data with new token structure
    setAuthTokens(data);
    setUserData(data.user);

    return {
      success: true,
      user: data.user,
      message: data.message,
      tokens: {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken
      }
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
    removeAuthTokens();
    return {
      success: false,
      error: error.message || 'Token verification failed'
    };
  }
};

// Logout function with refresh token revocation
export const logout = async () => {
  console.log('🔓 Starting logout process...');
  
  const refreshToken = getRefreshToken();
  
  // Clear local authentication data first
  console.log('🗑️ Clearing localStorage...');
  removeAuthTokens();
  
  // Clear React Query cache to prevent data leakage between users
  if (window.queryClient) {
    console.log('🗑️ Clearing React Query cache...');
    window.queryClient.clear();
  }
  
  // Clear all cookies that might contain auth data
  document.cookie.split(";").forEach((c) => {
    const eqPos = c.indexOf("=");
    const name = eqPos > -1 ? c.substr(0, eqPos) : c;
    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
  });
  
  console.log('✅ User logged out and authentication data cleared');
  
  try {
    // Call backend logout endpoint to revoke refresh token
    if (refreshToken) {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });
    }
  } catch (error) {
    // Logout should succeed even if backend call fails
    console.warn('Backend logout call failed (non-critical):', error);
  }
};

// Update user theme
export const updateUserTheme = async (theme) => {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE_URL}/api/users/theme`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ theme }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to update theme');
  }
  // Optionally update user data in localStorage
  const user = getUserData();
  if (user) {
    user.activeTheme = data.theme;
    setUserData(user);
  }
  return data.theme;
};