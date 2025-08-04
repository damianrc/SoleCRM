import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, ChevronDown, LogOut } from 'lucide-react';
import { getUserData, getUserId, getAuthHeaders, logout } from '../utils/auth';
import { generateInitials, getDisplayName } from '../utils/userUtils';
import './TopBar.css';

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
        const response = await fetch('http://localhost:4000/api/users/profile', {
          headers: getAuthHeaders()
        });

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

  return (
    <div className={`topbar${isCollapsed ? ' sidebar-collapsed' : ''}`}>
      <div className="topbar-content">
        <div className="topbar-spacer"></div>
        
        <div className="topbar-user-section" ref={dropdownRef}>
          <div className="user-info" onClick={toggleDropdown}>
            <span className="user-name">{displayName}</span>
            <div className="user-avatar">
              {userData.profileImage ? (
                <img 
                  src={userData.profileImage} 
                  alt="Profile" 
                  className="profile-image"
                />
              ) : (
                initials
              )}
            </div>
            <ChevronDown 
              className={`dropdown-arrow ${isDropdownOpen ? 'open' : ''}`} 
              size={16} 
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
