import React from 'react';
import ReactDOM from 'react-dom/client';

// --- Global Stylesheets ---
// These styles apply to your entire application.
import './index.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/column-borders.css'; // Import column border styling

// --- Root Application Component ---
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <App />
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint.
reportWebVitals();