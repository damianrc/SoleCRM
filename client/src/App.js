import BlankPage from './components/BlankPage';
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import './App.css';
import './styles/themes.css';
import './styles/typography.css';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register.js';
import Protected from './components/Protected';
import ContactsPage from './components/ContactsPage';
// ...existing code...
import ContactDetailPage from './components/ContactDetailPage';
import UserSettings from './components/UserSettings';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import { ThemeProvider, useTheme } from './ThemeContext';

// Blank placeholder components for new sidebar routes
const ListingsPage = () => <div style={{padding: 32}}><h2>Listings</h2><p>This is a blank Listings page.</p></div>;
const DealsPage = () => <div style={{padding: 32}}><h2>Deals</h2><p>This is a blank Deals page.</p></div>;
const MarketStockPage = () => <div style={{padding: 32}}><h2>Market Stock</h2><p>This is a blank Market Stock page.</p></div>;

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

const AppContent = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });

  // Save sidebar state to localStorage whenever it changes
  React.useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  const { loading } = useTheme();
  if (loading) {
    return <div style={{height: '100vh', background: 'var(--background-color)'}}></div>;
  }

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
                    marginTop: '50px',
                    height: 'calc(100vh - 50px)',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    transition: 'margin-left 0.3s ease'
                  }}
                >
                  <Routes>
                    <Route path="/" element={<ContactsPage />} />
                    <Route path="/contacts" element={<ContactsPage />} />
                    <Route path="/contacts/:id" element={<ContactDetailPage />} />
                    <Route path="/tasks" element={<BlankPage />} />
                    <Route path="/settings/*" element={<UserSettings />} />
                    <Route path="/listings" element={<ListingsPage />} />
                    <Route path="/deals" element={<DealsPage />} />
                    <Route path="/market-stock" element={<MarketStockPage />} />
                  </Routes>
                </div>
              </>
            } />
            <Route path="/protected/*" element={<Protected />} />
          </Routes>
        </div>
      </Router>
      {/* React Query DevTools - only in development */}
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
};

const App = () => (
  <ThemeProvider>
    <AppContent />
  </ThemeProvider>
);

export default App;