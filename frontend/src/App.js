import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [showRegister, setShowRegister] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUserProfile(token);
    }
  }, []);

  const fetchUserProfile = async (token) => {
    try {
      const response = await fetch('/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem('token');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      localStorage.removeItem('token');
    }
  };

  const handleLogin = (userData, token) => {
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('token', token);
  };

  const handleLogout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('token');
  };

  const toggleAuthMode = () => {
    setShowRegister(!showRegister);
  };

  if (!isAuthenticated) {
    return (
      <div className="container">
        <div className="auth-container">
          <h1 className="text-center mb-4">FocusTrack</h1>
          <p className="text-center text-muted mb-4">
            A Pomodoro-based task tracker to boost your productivity
          </p>
          
          {showRegister ? (
            <Register onLogin={handleLogin} onToggleMode={toggleAuthMode} />
          ) : (
            <Login onLogin={handleLogin} onToggleMode={toggleAuthMode} />
          )}
        </div>
      </div>
    );
  }

  return (
    <Dashboard user={user} onLogout={handleLogout} />
  );
}

export default App; 