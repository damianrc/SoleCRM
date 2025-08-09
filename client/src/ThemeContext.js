import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext({
  theme: 'light',
  setTheme: () => {},
  loading: true,
});

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState('light');
  const [loading, setLoading] = useState(true);
  // Use 'accessToken' instead of 'token'
  const [token, setToken] = useState(() => localStorage.getItem('accessToken'));

  // Listen for token changes (e.g., login/logout in another tab or after login)
  useEffect(() => {
    const onStorage = () => {
      setToken(localStorage.getItem('accessToken'));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Also update token if it changes in this tab
  useEffect(() => {
    const interval = setInterval(() => {
      const currentToken = localStorage.getItem('accessToken');
      setToken(prev => (prev !== currentToken ? currentToken : prev));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    console.log('ThemeProvider mounted or token changed');
    if (!token) {
      setThemeState('light');
      document.body.setAttribute('data-theme', 'light');
      setLoading(false);
      return;
    }
    const fetchTheme = async () => {
      console.log('Fetching theme...');
      try {
        const res = await fetch('/api/users/theme', {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        if (!res.ok) throw new Error('Failed to fetch theme');
        const data = await res.json();
        console.log('Fetched theme from backend:', data.theme);
        setThemeState(data.theme || 'light');
        document.body.setAttribute('data-theme', data.theme || 'light');
      } catch (err) {
        setThemeState('light');
        document.body.setAttribute('data-theme', 'light');
      } finally {
        setLoading(false);
      }
    };
    fetchTheme();
  }, [token]);

  const setTheme = async (newTheme) => {
    setThemeState(newTheme);
    document.body.setAttribute('data-theme', newTheme);
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    try {
      await fetch('/api/users/theme', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ theme: newTheme })
      });
    } catch (err) {
      // Optionally handle error
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, loading }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
