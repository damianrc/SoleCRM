import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import './App.css';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register.js';
import Protected from './components/Protected';
import ContactsPage from './components/ContactsPage';
import TasksPage from './components/TasksPage';
import ContactDetailPage from './components/ContactDetailPage';
import UserSettings from './components/UserSettings';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';

// Optimized QueryClient configuration for TanStack Query v5
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: (failureCount, error) => {
        // Don't retry on 401/403 errors
        if (error?.status === 401 || error?.status === 403) return false;
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
      onError: (error) => {
        console.error('Mutation error:', error);
      },
    },
  },
});

// Make queryClient globally accessible for logout function
window.queryClient = queryClient;

const App = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });

  // Save sidebar state to localStorage whenever it changes
  React.useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="app-container" style={{ height: '100vh' }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard/:userId/*" element={
              <>
                <TopBar isCollapsed={isSidebarCollapsed} />
                <Sidebar 
                  isCollapsed={isSidebarCollapsed} 
                  onToggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
                />
                                <div 
                  className={`main-content${isSidebarCollapsed ? ' sidebar-collapsed' : ''}`}
                  style={{
                    marginLeft: isSidebarCollapsed ? '64px' : '260px',
                    marginTop: '50px', // Account for top bar height
                    height: 'calc(100vh - 50px)', // Fixed height
                    overflowY: 'auto', // Allow vertical scrolling
                    overflowX: 'hidden', // Prevent horizontal scroll
                    transition: 'margin-left 0.3s ease'
                  }}
                >
                  <Routes>
                    <Route path="/" element={<ContactsPage />} />
                    <Route path="/contacts" element={<ContactsPage />} />
                    <Route path="/contacts/:id" element={<ContactDetailPage />} />
                    <Route path="/tasks" element={<TasksPage />} />
                    <Route path="/settings" element={<UserSettings />} />
                  </Routes>
                </div>
              </>
            } />
            <Route path="/protected/*" element={<Protected />} /> {/* Legacy route for compatibility */}
          </Routes>
        </div>
      </Router>
      {/* React Query DevTools - only in development */}
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
};

export default App;