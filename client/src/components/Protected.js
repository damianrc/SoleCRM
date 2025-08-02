import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { isAuthenticated, getUserId, verifyToken, logout } from '../utils/auth';
import Sidebar from './Sidebar';

const Protected = () => {
  // Initialize sidebar state from localStorage or default to false
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Save sidebar state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(isSidebarCollapsed));
  }, [isSidebarCollapsed]);
  
  useEffect(() => {
    const checkAuthentication = async () => {
      setIsLoading(true);
      setAuthError(null);

      try {
        // First, check if we have valid auth data
        if (!isAuthenticated()) {
          console.log('No valid authentication found, redirecting to login');
          navigate('/login', { replace: true });
          return;
        }

        const userId = getUserId();
        if (!userId) {
          console.log('No user ID found, redirecting to login');
          navigate('/login', { replace: true });
          return;
        }

        // Verify token with backend
        const verificationResult = await verifyToken();
        if (!verificationResult.success) {
          console.log('Token verification failed:', verificationResult.error);
          navigate('/login', { replace: true });
          return;
        }

        // Check URL structure and redirect if needed
        const pathSegments = location.pathname.split('/').filter(Boolean);
        
        // Handle legacy /protected routes
        if (pathSegments[0] === 'protected') {
          const newPath = `/dashboard/${userId}${location.pathname.replace('/protected', '')}`;
          console.log('Redirecting from legacy route to:', newPath);
          navigate(newPath, { replace: true });
          return;
        }

        // Ensure URL matches authenticated user
        if (pathSegments[0] === 'dashboard') {
          const urlUserId = pathSegments[1];
          if (urlUserId && urlUserId !== userId) {
            console.log('URL user ID mismatch, redirecting to correct dashboard');
            const correctedPath = location.pathname.replace(`/dashboard/${urlUserId}`, `/dashboard/${userId}`);
            navigate(correctedPath, { replace: true });
            return;
          }

          // If no specific route, redirect to contacts
          if (pathSegments.length === 2) {
            navigate(`/dashboard/${userId}/contacts`, { replace: true });
            return;
          }
        }

        console.log('Authentication verified successfully');
      } catch (error) {
        console.error('Authentication check error:', error);
        setAuthError('Authentication verification failed. Please try logging in again.');
        // Don't redirect immediately, show error message
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthentication();
  }, [location.pathname, navigate]);

  // Determine current view based on the current route
  const getCurrentView = () => {
    const path = location.pathname;
    if (path.includes('/contacts')) {
      return path.includes('/contacts/') && !path.endsWith('/contacts') ? 'detail' : 'list';
    } else if (path.includes('/tasks')) {
      return 'tasks';
    }
    return 'list'; // default
  };

  const handleToggleCollapse = () => {
    setIsSidebarCollapsed(prev => !prev);
  };

  const handleNavigate = (target) => {
    const userId = getUserId();
    if (!userId) {
      navigate('/login');
      return;
    }

    switch (target) {
      case 'contacts':
        navigate(`/dashboard/${userId}/contacts`);
        break;
      case 'tasks':
        navigate(`/dashboard/${userId}/tasks`);
        break;
      case 'dashboard':
        navigate(`/dashboard/${userId}`);
        break;
      default:
        console.warn('Unknown navigation target:', target);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
      // Force redirect even if logout API call fails
      navigate('/login', { replace: true });
    }
  };

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="auth-loading">
        <div className="loading-spinner"></div>
        <p>Verifying authentication...</p>
        
        <style jsx>{`
          .auth-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            background-color: #f8fafc;
          }
          
          .loading-spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #e2e8f0;
            border-top: 4px solid #3b82f6;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 16px;
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          .auth-loading p {
            color: #64748b;
            font-size: 14px;
          }
        `}</style>
      </div>
    );
  }

  // Show error message if authentication failed
  if (authError) {
    return (
      <div className="auth-error">
        <div className="error-content">
          <h2>Authentication Error</h2>
          <p>{authError}</p>
          <button onClick={() => navigate('/login')} className="retry-button">
            Go to Login
          </button>
        </div>
        
        <style jsx>{`
          .auth-error {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            background-color: #f8fafc;
          }
          
          .error-content {
            text-align: center;
            padding: 32px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            max-width: 400px;
          }
          
          .error-content h2 {
            color: #dc2626;
            margin-bottom: 16px;
          }
          
          .error-content p {
            color: #64748b;
            margin-bottom: 24px;
          }
          
          .retry-button {
            background-color: #3b82f6;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
          }
          
          .retry-button:hover {
            background-color: #2563eb;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar 
        currentView={getCurrentView()}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleCollapse}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      />
      <div className="main-content-area">
        <Outlet />
      </div>

      <style jsx>{`
        .app-layout {
          display: flex;
          height: 100vh;
          background-color: #f8fafc;
        }

        .main-content-area {
          flex: 1;
          overflow-y: auto;
          margin-left: ${isSidebarCollapsed ? '64px' : '260px'};
          transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          min-height: 100vh;
        }

        @media (max-width: 768px) {
          .main-content-area {
            margin-left: 64px;
          }
        }
      `}</style>
    </div>
  );
};

export default Protected;