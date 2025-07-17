import React, { useEffect, useState, useRef } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

import Login from './components/Login';
import Signup from './components/Signup';
import Terms from './components/Terms';
import Profile from './components/Profile';
import UserProjects from './components/UserProjects';
import Home from './components/Home';
import ProjectSelection from './components/ProjectSelection';
import Navbar from './components/Navbar';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const timeoutRef = useRef(null);

  const handleLogout = () => {
    sessionStorage.removeItem('loggedInUser');
    setIsAuthenticated(false);
    setUser(null);
    clearTimeout(timeoutRef.current);
  };

  const startInactivityTimer = () => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      if (isAuthenticated) {
        alert('You have been logged out due to inactivity.');
        handleLogout();
      }
    }, 10 * 60 * 1000); // 10 minutes
  };

  useEffect(() => {
    const savedUser = sessionStorage.getItem('loggedInUser');
    if (savedUser) {
      setIsAuthenticated(true);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    startInactivityTimer();

    const events = ['mousemove', 'keydown', 'scroll', 'click'];
    events.forEach(event => window.addEventListener(event, startInactivityTimer));

    return () => {
      clearTimeout(timeoutRef.current);
      events.forEach(event => window.removeEventListener(event, startInactivityTimer));
    };
  }, [isAuthenticated]);

  const handleLogin = (userData) => {
    sessionStorage.setItem('loggedInUser', JSON.stringify(userData));
    setIsAuthenticated(true);
    setUser(userData);
  };

  return (
    <BrowserRouter>
        <Navbar isAuthenticated={isAuthenticated} handleLogout={handleLogout} />
          {loading ? (
            <p>Loading...</p>
          ) : (
            <Routes>
              <Route path="/" element={<Navigate to={isAuthenticated ? '/home' : '/login'} replace />} />
              <Route path="/login" element={<Login onLogin={handleLogin} />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/home" element={isAuthenticated ? <Home /> : <Navigate to="/login" replace />} />
              <Route path="/user-projects" element={isAuthenticated ? <UserProjects data={user} /> : <Navigate to="/login" replace />} />
              <Route path="/profile" element={isAuthenticated ? <Profile /> : <Navigate to="/login" replace />} />
              <Route path="/create-project" element={isAuthenticated ? <ProjectSelection user={user} /> : <Navigate to="/login" replace />} />
              <Route path="*" element={<h2>404 - Page Not Found</h2>} />
            </Routes>
          )}
    </BrowserRouter>
  );
}

export default App;

