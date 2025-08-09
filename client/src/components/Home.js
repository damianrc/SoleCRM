import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/pages/Home.css';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <div className="home-content">
        <div className="logo-section">
          <div className="logo">SC</div>
        </div>
        
        <h1>SoleCRM</h1>
        <p className="subtitle">Professional Customer Relationship Management</p>
        <p>Streamline your business relationships, manage contacts, track tasks, and grow your business with our comprehensive CRM solution.</p>
        
        <div className="home-actions">
          <button 
            className="btn-primary"
            onClick={() => navigate('/login')}
          >
            Sign In
          </button>
          <button 
            className="btn-outline"
            onClick={() => navigate('/register')}
          >
            Get Started
          </button>
        </div>

        <div className="features">
          <h3>Why Choose SoleCRM?</h3>
          <div className="features-grid">
            <div className="feature-item">
              <div className="feature-icon">👥</div>
              <div className="feature-text">Contact Management</div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">📋</div>
              <div className="feature-text">Task Tracking</div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">📊</div>
              <div className="feature-text">Analytics & Reports</div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🔒</div>
              <div className="feature-text">Secure & Reliable</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;