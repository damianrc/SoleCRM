import React from 'react';

const ThemeSettings = ({ theme, setTheme, themeLoading, themeError }) => {
  return (
    <div className="card mb-4">
      <div className="card-body d-flex align-items-center justify-content-between">
        <span className="fw-bold">Dark Mode</span>
        <div className="form-check form-switch">
          <input
            className="form-check-input"
            type="checkbox"
            id="themeSwitch"
            checked={theme === 'dark'}
            onChange={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            disabled={themeLoading}
          />
          <label className="form-check-label" htmlFor="themeSwitch">
            {themeLoading ? 'Loading...' : (theme === 'dark' ? 'Dark' : 'Light')}
          </label>
          {themeError && <span className="text-danger ms-2 small">{themeError}</span>}
        </div>
      </div>
    </div>
  );
};

export default ThemeSettings;
