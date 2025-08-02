import React from 'react';
import { Users, CheckCircle, LogOut, PanelLeftOpen, PanelLeftClose } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { removeAuthToken } from '../utils/auth';
import './Sidebar.css';

/**
 * Sidebar Component
 * 
 * HubSpot-style sidebar with the following features:
 * - SoleCRM branding at top (shows "S" when collapsed)
 * - Navigation items with icons
 * - Logout and collapse/expand buttons at bottom
 * - When collapsed, only icons show
 */
const Sidebar = ({ isCollapsed, onToggleCollapse }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    removeAuthToken();
    navigate('/login');
  };

  return (
    <div 
      className={`sidebar${isCollapsed ? ' collapsed' : ''}`}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: isCollapsed ? '64px' : '260px',
        height: '100vh',
        backgroundColor: '#33475b',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 9999
      }}
    >
      {/* Header with SoleCRM branding */}
      <div className="sidebar-header" style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="sidebar-logo" style={{ color: 'white', fontSize: '20px', fontWeight: '600', textAlign: 'center' }}>
          {isCollapsed ? 'S' : 'SoleCRM'}
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav" style={{ flex: 1, padding: '20px 0' }}>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          <li style={{ marginBottom: '8px', padding: '0 12px' }}>
            <button 
              className={`nav-item ${location.pathname.includes('/contacts') ? 'active' : ''}`}
              onClick={() => navigate(`/dashboard/${localStorage.getItem('userId')}/contacts`)}
              title={isCollapsed ? 'Contacts' : ''}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: isCollapsed ? '0' : '12px',
                padding: '12px 16px',
                width: '100%',
                background: location.pathname.includes('/contacts') ? 'rgba(255,255,255,0.15)' : 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.8)',
                cursor: 'pointer',
                borderRadius: '8px',
                transition: 'all 0.2s ease',
                justifyContent: isCollapsed ? 'center' : 'flex-start'
              }}
              onMouseEnter={(e) => {
                if (!location.pathname.includes('/contacts')) {
                  e.target.style.backgroundColor = 'rgba(255,255,255,0.1)';
                  e.target.style.color = 'white';
                }
              }}
              onMouseLeave={(e) => {
                if (!location.pathname.includes('/contacts')) {
                  e.target.style.backgroundColor = 'none';
                  e.target.style.color = 'rgba(255,255,255,0.8)';
                }
              }}
            >
              <Users size={20} style={{ width: '20px', height: '20px', flexShrink: 0 }} />
              {!isCollapsed && <span>Contacts</span>}
            </button>
          </li>
          <li style={{ marginBottom: '8px', padding: '0 12px' }}>
            <button 
              className={`nav-item ${location.pathname.includes('/tasks') ? 'active' : ''}`}
              onClick={() => navigate(`/dashboard/${localStorage.getItem('userId')}/tasks`)}
              title={isCollapsed ? 'Tasks' : ''}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: isCollapsed ? '0' : '12px',
                padding: '12px 16px',
                width: '100%',
                background: location.pathname.includes('/tasks') ? 'rgba(255,255,255,0.15)' : 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.8)',
                cursor: 'pointer',
                borderRadius: '8px',
                transition: 'all 0.2s ease',
                justifyContent: isCollapsed ? 'center' : 'flex-start'
              }}
              onMouseEnter={(e) => {
                if (!location.pathname.includes('/tasks')) {
                  e.target.style.backgroundColor = 'rgba(255,255,255,0.1)';
                  e.target.style.color = 'white';
                }
              }}
              onMouseLeave={(e) => {
                if (!location.pathname.includes('/tasks')) {
                  e.target.style.backgroundColor = 'none';
                  e.target.style.color = 'rgba(255,255,255,0.8)';
                }
              }}
            >
              <CheckCircle size={20} style={{ width: '20px', height: '20px', flexShrink: 0 }} />
              {!isCollapsed && <span>Tasks</span>}
            </button>
          </li>
        </ul>
      </nav>

      {/* Footer with logout and collapse buttons */}
      <div className="sidebar-footer" style={{ padding: '20px 12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="sidebar-footer-content" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {!isCollapsed && (
            <button 
              className="logout-button" 
              onClick={handleLogout}
              title="Logout"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.8)',
                cursor: 'pointer',
                borderRadius: '8px',
                flex: 1,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = 'rgba(255,255,255,0.1)';
                e.target.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'none';
                e.target.style.color = 'rgba(255,255,255,0.8)';
              }}
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          )}
          <button 
            className="collapse-toggle-button"
            onClick={onToggleCollapse}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              padding: '8px',
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.8)',
              cursor: 'pointer',
              borderRadius: '8px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'rgba(255,255,255,0.1)';
              e.target.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'none';
              e.target.style.color = 'rgba(255,255,255,0.8)';
            }}
          >
            {isCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;