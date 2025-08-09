import React from 'react';
import { NavLink, Routes, Route, useLocation, useNavigate, Navigate, useMatch } from 'react-router-dom';
import { User, Lock, Mail, Moon, ChevronRight } from 'lucide-react';
import ProfileSettings from './ProfileSettings';
import AccountSettings from './AccountSettings';
import ThemeSettings from './ThemeSettings';
import { useUserProfile } from '../hooks/useUserSettings';
import { useTheme } from '../ThemeContext';
import './UserSettings.css';

const UserSettings = () => {
  // Get the base path up to and including '/dashboard/:userId/settings'
  const match = useMatch("/dashboard/:userId/settings/*");
  const basePath = match ? match.pathnameBase : "/settings";
  const location = useLocation();
  const navigate = useNavigate();
  const { data: userProfile, isLoading, error } = useUserProfile();
  const { theme, setTheme, loading: themeLoading } = useTheme();
  const user = userProfile?.user;

  // Sidebar navigation items
  const navItems = [
    { label: 'Profile', icon: <User size={18} />, path: `${basePath}/profile` },
    { label: 'Account Settings', icon: <Lock size={18} />, path: `${basePath}/account-settings` },
    { label: 'Theme', icon: <Moon size={18} />, path: `${basePath}/theme` },
  ];

  React.useEffect(() => {
    // Redirect to /settings/profile if at /settings
    if (location.pathname === '/settings') {
      navigate('/settings/profile', { replace: true });
    }
  }, [location, navigate]);

  return (
    <div className="user-settings-layout">
      <aside className="user-settings-sidebar">
        <nav>
          <ul>
            {navItems.map(item => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  relative="path"
                  className={({ isActive }) =>
                    isActive ? 'sidebar-link active' : 'sidebar-link'
                  }
                >
                  {item.icon}
                  <span className="sidebar-link-label">{item.label}</span>
                  <ChevronRight size={16} className="sidebar-link-chevron" />
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <main className="user-settings-content">
        <div className="user-settings-form-container">
          <Routes>
            <Route index element={<Navigate to="profile" replace />} />
            <Route path="profile" element={<ProfileSettings user={user} />} />
            <Route path="account-settings" element={<AccountSettings user={user} />} />
            <Route path="theme" element={<ThemeSettings theme={theme} setTheme={setTheme} themeLoading={themeLoading} />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default UserSettings;
