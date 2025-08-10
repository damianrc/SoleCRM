import React from 'react';
import { Users, CheckCircle, PanelLeftOpen, PanelLeftClose, Home, Store, Banknote, Binoculars } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getUserId } from '../utils/auth.js';

import '../styles/layout/Sidebar.css';
import logosmall from '../assets/logosmall.png';

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
  const userId = getUserId(); // Get userId properly

  return (
    <div 
      className={`sidebar${isCollapsed ? ' collapsed' : ''}`}
    >

      {/* Header with SoleCRM branding (logo) */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <img src={logosmall} alt="SoleCRM Logo" className="sidebar-logo-img" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <ul>
          <li>
            <button 
              className={`nav-item${location.pathname.includes('/contacts') ? ' active' : ''}`}
              onClick={() => navigate(`/dashboard/${userId}/contacts`)}
              title={isCollapsed ? 'Contacts' : ''}
            >
              <Users className="sidebar-icon" size={20} />
              {!isCollapsed && <span>Contacts</span>}
            </button>
          </li>
          {/* Tasks page is intentionally blank for now, but navigation is kept for consistency */}
          <li>
            <button 
              className={`nav-item${location.pathname.includes('/tasks') ? ' active' : ''}`}
              onClick={() => navigate(`/dashboard/${userId}/tasks`)}
              title={isCollapsed ? 'Tasks' : ''}
            >
              <CheckCircle className="sidebar-icon" size={20} />
              {!isCollapsed && <span>Tasks</span>}
            </button>
          </li>
            <li>
              <button
                className={`nav-item${location.pathname.includes('/listings') ? ' active' : ''}`}
                onClick={() => navigate(`/dashboard/${userId}/listings`)}
                title={isCollapsed ? 'Listings' : ''}
              >
                <Home className="sidebar-icon" size={20} />
                {!isCollapsed && <span>Listings</span>}
              </button>
            </li>
            <li>
              <button
                className={`nav-item${location.pathname.includes('/deals') ? ' active' : ''}`}
                onClick={() => navigate(`/dashboard/${userId}/deals`)}
                title={isCollapsed ? 'Deals' : ''}
              >
                <Banknote className="sidebar-icon" size={20} />
                {!isCollapsed && <span>Deals</span>}
              </button>
            </li>
            <li>
              <button
                className={`nav-item${location.pathname.includes('/market-stock') ? ' active' : ''}`}
                onClick={() => navigate(`/dashboard/${userId}/market-stock`)}
                title={isCollapsed ? 'Market Stock' : ''}
              >
                <Binoculars className="sidebar-icon" size={20} />
                {!isCollapsed && <span>Market Stock</span>}
              </button>
            </li>
        </ul>
      </nav>

      {/* Footer with collapse button */}
      <div className="sidebar-footer">
        <div className="sidebar-footer-content">
          <button 
            className="collapse-toggle-button"
            onClick={onToggleCollapse}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;