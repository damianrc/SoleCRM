import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css'; // Import the new CSS file

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <div className="home-content">
        <h1>Welcome to the SoleCRM</h1>
        <p>This is the home page of the application.</p>
        <button onClick={() => navigate('/login')}>Go to Login</button>
      </div>
    </div>
  );
};

export default Home;