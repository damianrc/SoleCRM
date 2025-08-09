import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, ChevronDown, LogOut } from 'lucide-react';
import { getUserData, getUserId, getAuthHeaders, logout, authenticatedFetch } from '../utils/auth';
import { generateInitials, getDisplayName } from '../utils/userUtils';
import '../styles/layout/TopBar.css';

/**
 * TopBar Component
 * 
 * A persistent top navigation bar with:
 * - User display name
 * - Profile icon with user initials
 * - Dropdown menu with settings option
 */
const TopBar = ({ isCollapsed }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const userId = getUserId();

  // Fetch user data from server on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await authenticatedFetch('/api/users/profile');
        if (response.ok) {
          const data = await response.json();
          console.log('TopBar - Fetched user data from server:', data.user);
          setUserData(data.user);
        } else {
          console.error('TopBar - Failed to fetch user data:', response.status);
          // Fallback to localStorage data if server request fails
          const user = getUserData();
          setUserData(user);
        }
      } catch (error) {
        console.error('TopBar - Error fetching user data:', error);
        // Fallback to localStorage data if server request fails
        const user = getUserData();
        setUserData(user);
      }
    };

    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSettingsClick = () => {
    setIsDropdownOpen(false);
    navigate(`/dashboard/${userId}/settings`);
  };

  const handleLogoutClick = async () => {
    setIsDropdownOpen(false);
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, navigate to login
      navigate('/login');
    }
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  if (!userData) {
    return null; // Don't render if no user data
  }

  const initials = generateInitials(userData);
  const displayName = getDisplayName(userData);
  const jobTitle = userData.jobTitle;

  return (
    <div className={`topbar${isCollapsed ? ' sidebar-collapsed' : ''}`}>
      <div className="topbar-content">
        <div className="topbar-spacer"></div>
        <div className="topbar-user-section" ref={dropdownRef}>
          <div className="user-info" onClick={toggleDropdown} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <div className="user-avatar" style={{ marginRight: '10px' }}>
              {userData.profileImage ? (
                <img 
                  src={userData.profileImage} 
                  alt="Profile" 
                  className="profile-image"
                />
              ) : (
                <span className="user-avatar-initials">{initials}</span>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <span className="user-name" style={{ fontFamily: 'var(--font-family-base)', fontSize: 'var(--font-size-base)', color: 'var(--color-primary-text)', fontWeight: 'var(--font-weight-medium)', lineHeight: 1 }}>{displayName}</span>
              {jobTitle && (
                <span
                  className="user-job-title"
                  style={{
                    fontFamily: 'var(--font-family-base)',
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--color-secondary-text)',
                    fontWeight: 'var(--font-weight-normal)',
                    marginTop: '2px',
                    lineHeight: 1
                  }}
                >
                  {jobTitle}
                </span>
              )}
            </div>
            <ChevronDown 
              className={`dropdown-arrow ${isDropdownOpen ? 'open' : ''}`} 
              size={16} 
              style={{ marginLeft: 8 }}
            />
          </div>
          
          {isDropdownOpen && (
            <div className="user-dropdown">
              <button 
                className="dropdown-item"
                onClick={handleSettingsClick}
              >
                <Settings size={16} />
                <span>Settings</span>
              </button>
              <button 
                className="dropdown-item"
                onClick={handleLogoutClick}
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopBar;
