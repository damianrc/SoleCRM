import React from 'react';
import { Users, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import './Sidebar.css'; // Add this line to import your CSS

/**
 * Sidebar Component
 * 
 * This component renders the navigation sidebar for the CRM application.
 * It includes navigation items and the ability to collapse/expand the sidebar.
 * 
 * Props:
 * - currentView: The currently active view ('list', 'detail', or 'tasks')
 * - isCollapsed: Boolean indicating if sidebar is collapsed
 * - onToggleCollapse: Function to toggle sidebar collapse state
 * - onNavigate: Function called when a navigation item is clicked
 */
const Sidebar = ({ 
  currentView, 
  isCollapsed, 
  onToggleCollapse, 
  onNavigate 
}) => {
  /**
   * Handle navigation item clicks
   * @param {string} target - The target view to navigate to
   */
  const handleNavigation = (target) => {
    onNavigate(target);
  };

  return (
    <div className={`sidebar${isCollapsed ? ' collapsed' : ''}`}>
      {/* Sidebar Header - Contains app name only */}
      <div className="sidebar-header">
        <h2>SoleCRM</h2>
      </div>

      {/* Navigation Menu */}
      <nav className="sidebar-nav">
        <ul>
          {/* Contacts Navigation Item */}
          <li 
            onClick={() => handleNavigation('contacts')}
            className={`nav-item ${
              currentView === 'list' || currentView === 'detail' ? 'active' : ''
            }`}
            title="View all contacts"
          >
            <Users size={18} />
            <span className="nav-text">Contacts</span>
          </li>

          {/* Tasks Navigation Item */}
          <li 
            onClick={() => handleNavigation('tasks')}
            className={`nav-item ${currentView === 'tasks' ? 'active' : ''}`}
            title="View all tasks"
          >
            <CheckCircle size={18} />
            <span className="nav-text">Tasks</span>
          </li>
        </ul>
      </nav>

      {/* Sidebar Footer - Contains collapse toggle button */}
      <div className="sidebar-footer">
        <button 
          onClick={onToggleCollapse} 
          className="sidebar-toggle"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {/* Show different icons based on collapse state */}
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;