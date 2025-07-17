import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

function Navbar({ isAuthenticated, handleLogout }) {
  const location = useLocation();

  return (
    <nav
      className="navbar navbar-expand-lg bg-body-tertiary fixed-top"
      style={{
        width: '100vw',
        left: 0,
        backgroundColor: '#f8f9fa',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        zIndex: 9999
      }}
    >
      <div className="container-fluid">
        <Link className="navbar-brand" to={isAuthenticated ? '/home' : '/'}>
          {isAuthenticated ? 'User Portal' : 'Infotech'}
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarSupportedContent"
          aria-controls="navbarSupportedContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarSupportedContent">
          <ul className="navbar-nav ms-auto mb-lg-0 text-end">
            {isAuthenticated ? (
              <>
                <li className="nav-item">
                  <Link 
                    className={`nav-link px-3 py-2 rounded ${location.pathname === '/home' ? 'text-primary fw-bold' : ''}`} 
                    to="/home"
                  >
                    Home
                  </Link>
                </li>
                <li className="nav-item">
                  <Link 
                    className={`nav-link px-3 py-2 rounded ${location.pathname === '/user-projects' ? 'text-primary fw-bold' : ''}`} 
                    to="/user-projects"
                  >
                    Projects
                  </Link>
                </li>
                <li className="nav-item">
                  <Link 
                    className={`nav-link px-3 py-2 rounded ${location.pathname === '/profile' ? 'text-primary fw-bold' : ''}`} 
                    to="/profile"
                  >
                    Profile
                  </Link>
                </li>
                <li className="nav-item">
                  <Link 
                    className={`nav-link px-3 py-2 rounded ${location.pathname === '/create-project' ? 'text-primary fw-bold' : ''}`} 
                    to="/create-project"
                  >
                    Create Project
                  </Link>
                </li>
                <li className="nav-item">
                  <button className="btn btn-outline-success ms-lg-3 mt-2 mt-lg-0 z-index-100 me-3" onClick={handleLogout}>
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <Link 
                    className={`nav-link px-3 py-2 rounded ${location.pathname === '/login' ? 'text-primary fw-bold' : ''}`} 
                    to="/login"
                  >
                    Login
                  </Link>
                </li>
                <li className="nav-item">
                  <Link 
                    className={`nav-link px-3 py-2 rounded ${location.pathname === '/signup' ? 'text-primary fw-bold' : ''}`} 
                    to="/signup"
                  >
                    Signup
                  </Link>
                </li>
                <li className="nav-item">
                  <Link 
                    className={`nav-link px-3 py-2 rounded ${location.pathname === '/terms' ? 'text-primary fw-bold' : ''}`} 
                    to="/terms"
                  >
                    Terms
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
