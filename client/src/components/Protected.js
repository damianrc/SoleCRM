import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';

const Protected = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Determine current view based on the current route
  const getCurrentView = () => {
    const path = location.pathname;
    if (path.includes('/contacts')) {
      return path.includes('/contacts/') ? 'detail' : 'list';
    } else if (path.includes('/tasks')) {
      return 'tasks';
    }
    return 'list'; // default
  };

  const handleToggleCollapse = () => {
    setIsSidebarCollapsed(prev => !prev);
  };

  const handleNavigate = (target) => {
    if (target === 'contacts') {
      navigate('/protected/contacts');
    } else if (target === 'tasks') {
      navigate('/protected/tasks');
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <Sidebar 
        currentView={getCurrentView()}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleCollapse}
        onNavigate={handleNavigate}
      />
      <div 
        style={{ 
          flexGrow: 1, 
          padding: '0', // Remove padding to eliminate gap
          overflowY: 'auto',
          marginLeft: isSidebarCollapsed ? '64px' : '260px',
          transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <div style={{ 
          padding: '20px', // Add padding back but only to the inner content
          minHeight: '100%'
        }}>
          <Outlet /> {/* This will render the nested routes (ContactsPage, TasksPage, ContactDetailView) */}
        </div>
      </div>
    </div>
  );
};

export default Protected;