import React, { useState, useEffect, createContext, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toggleTheme, closeSettings, toggleSettings } from '../features/Login';
import { FaBell, FaQuestionCircle, FaCog, FaMoon, FaSun, FaSearch } from 'react-icons/fa';
import Profile from './Profile';
import NotificationDropdown from './NotificationDropdown';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './theme.css';

// Settings Component
function SettingsBox() {
  const theme = useSelector((state) => state.theme.mode);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  return (
    <div className="position-absolute end-0 mt-3 me-2 border shadow-lg rounded-3 p-3 settings-box themed-card"
      style={{
        width: '280px',
        zIndex: 1000,
        top: 'calc(100% + 10px)',
        transition: 'background 0.3s, color 0.3s, border-color 0.3s',
      }}
    >
      {/* Header */}
      <div className="d-flex align-items-center mb-1" style={{gap: '8px'}}>
        <div className="rounded-circle d-flex align-items-center justify-content-center me-2"
          style={{ width: '32px', height: '32px', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '1.1rem' }}>
          <FaCog />
        </div>
        <div>
          <h6 className="fw-bold mb-0" style={{ color: 'var(--text-primary)', fontSize: '1rem' }}>Settings</h6>
          <small className="text-muted" style={{fontSize: '0.75rem'}}>Manage your preferences</small>
        </div>
      </div>
      <hr className="my-2" style={{ borderColor: 'var(--border-primary)', margin: '6px 0' }} />
      {/* Dark/Light Switch */}
      <div className="d-flex align-items-center justify-content-between mb-1">
        <span className="fw-medium" style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>Theme</span>
        <button
          className="btn btn-outline-secondary d-flex align-items-center px-2 py-1"
          style={{
            borderRadius: '2em',
            minWidth: 48,
            background: 'var(--bg-secondary)',
            color: theme === 'dark' ? '#ffd700' : '#6c5ce7',
            border: '1px solid var(--border-primary)',
            transition: 'all 0.2s',
            fontSize: '0.95rem',
            height: '32px',
            fontWeight: '600',
          }}
          onClick={() => dispatch(toggleTheme())}
          onMouseEnter={e => {
            e.target.style.background = 'var(--bg-tertiary)';
            e.target.style.borderColor = 'var(--border-secondary)';
            e.target.style.color = theme === 'dark' ? '#ffed4e' : '#8b7cf6';
          }}
          onMouseLeave={e => {
            e.target.style.background = 'var(--bg-secondary)';
            e.target.style.borderColor = 'var(--border-primary)';
            e.target.style.color = theme === 'dark' ? '#ffd700' : '#6c5ce7';
          }}
        >
          {theme === 'dark' ? <FaSun className="me-1" /> : <FaMoon className="me-1" />} {theme === 'dark' ? 'Light' : 'Dark'}
        </button>
      </div>
    </div>
  );
}

// Create a context for global search
export const ProjectSearchContext = createContext({ search: '', setSearch: () => {} });

function Navbar({ onSidebarToggle, sidebarOpen, setSidebarOpen }) {
  const location = useLocation();
  const isAuthenticated = useSelector((state) => state.login.isLoggedIn);
  const [showProfile, setShowProfile] = useState(false);
  const theme = useSelector((state) => state.theme.mode);
  const showSettings = useSelector((state) => state.ui.showSettings);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { search, setSearch } = useContext(ProjectSearchContext);

  // Dynamic search placeholder based on route
  const getSearchPlaceholder = () => {
    const path = location.pathname;
    if (path === '/home') return 'Search everything...';
    if (path === '/create-project-manager') return 'Search project managers...';
    if (path.startsWith('/backlog')) return 'Search backlogs...';
    if (path.startsWith('/sprints')) return 'Search sprints...';
    if (path.startsWith('/tasks')) return 'Search tasks...';
    if (path.startsWith('/history')) return 'Search completed items...';
    if (path.startsWith('/profile')) return 'Search profile...';
    if (path.startsWith('/help')) return 'Search help...';
    if (path.startsWith('/terms')) return 'Search terms...';
    // Add more as needed
    return 'Search projects...';
  };

  // Hide search bar on CreateProject, CreateUser, and other pages (but allow on home)
  const hideSearchBar = () => {
    const path = location.pathname;
    const user = JSON.parse(sessionStorage.getItem('loggedInUser'));
    const isAdmin = user?.role === 'admin';
    
    // Always hide on these pages
    if (path === '/profile' || path === '/help' || path === '/terms') {
      return true;
    }
    
    // For admin users, show search bar on home and create-project-manager pages
    if (isAdmin && (path === '/home' || path === '/create-project-manager')) {
      return false;
    }
    
    // Hide on create-user page for non-admin users
    if (path === '/create-user') {
      return true;
    }
    
    // Show search bar on other pages
    return false;
  };

  // Add this function to close all dropdowns
  const closeDropdowns = () => {
    setShowProfile(false);
    dispatch(closeSettings());
  };

  // Close profile when settings are opened
  useEffect(() => {
    if (showSettings) {
      setShowProfile(false);
    }
  }, [showSettings]);

  // Hover states
  const [hoveredIcon, setHoveredIcon] = useState(null);
  const [hoveredBtn, setHoveredBtn] = useState(null);

  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'search-bar-autofill-style';
  
    const placeholderColor = theme === 'dark' ? '#b5b5b5' : '#6c757d';
    const autofillBg = theme === 'dark' ? '#2c2f36' : '#fff';
    const autofillColor = theme === 'dark' ? '#f8f8f8' : '#212529';
  
    style.innerHTML = `
      .search-input::placeholder {
        color: ${placeholderColor} !important;
        opacity: 1;
      }
  
      input.search-input:-webkit-autofill,
      input.search-input:-webkit-autofill:hover,
      input.search-input:-webkit-autofill:focus,
      input.search-input:-webkit-autofill:active {
        -webkit-box-shadow: 0 0 0 1000px ${autofillBg} inset !important;
        -webkit-text-fill-color: ${autofillColor} !important;
        caret-color: ${autofillColor} !important;
      }
    `;
  
    const old = document.getElementById('search-bar-autofill-style');
    if (old) document.head.removeChild(old);
    document.head.appendChild(style);
  
    return () => {
      const cleanup = document.getElementById('search-bar-autofill-style');
      if (cleanup) document.head.removeChild(cleanup);
    };
  }, [theme]);
  

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.position-relative') && !event.target.closest('.dropdown')) {
        setShowProfile(false);
        dispatch(closeSettings());
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dispatch]);

  // Icon hover style
  const getIconStyle = (iconName) => ({
    color: hoveredIcon === iconName ? '#0d6efd' : '#6c757d',
    transform: hoveredIcon === iconName ? 'scale(1.2)' : 'scale(1)',
    transition: 'transform 0.2s, color 0.2s',
    cursor: 'pointer',
  });

  // Button hover style for buttons except Upgrade
  const getButtonStyle = (btnName) => ({
    transform: hoveredBtn === btnName ? 'scale(1.05)' : 'scale(1)',
    transition: 'transform 0.2s',
  });

  // Don't show full navbar on /login or /signup when not authenticated
  if (!isAuthenticated && (location.pathname === '/login' || location.pathname === '/signup')) {
    return (
      <nav
        className={`navbar navbar-expand-lg border-bottom shadow-sm fixed-top px-3 py-2 ${
          theme === 'dark' ? 'bg-dark text-white' : 'bg-white text-dark'
        }`}
        style={{ marginBottom: 0, zIndex: 1041, width: '100%' }}
      >
        <div className="container-fluid d-flex align-items-center justify-content-between position-relative">
          {/* Logo */}
          <div className="navbar-brand d-flex align-items-center">
            <img
              src="/favicon.png"
              alt="logo"
              width="24"
              height="24"
              className="me-2"
            />
            <strong style={{ color: theme === 'dark' ? 'white' : 'black' }}>TaskMaster</strong>
          </div>
  
          {/* Theme Toggle Switch */}
          <div
  onClick={() => dispatch(toggleTheme())}
  style={{
    cursor: 'pointer',
    width: '70px',
    height: '36px',
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: '30px',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    padding: '0 8px',
    transition: 'background-color 0.3s ease',
  }}
>
  <FaSun
    style={{
      color: '#ffc107',
      fontSize: '18px',
      opacity: theme === 'light' ? 1 : 0.4,
      transition: 'opacity 0.3s ease',
    }}
  />
  <FaMoon
    style={{
      color: '#f8f9fa',
      fontSize: '18px',
      opacity: theme === 'dark' ? 1 : 0.4,
      transition: 'opacity 0.3s ease',
      marginLeft: 'auto',
    }}
  />
  <div
    style={{
      position: 'absolute',
      top: '50%',
      left: theme === 'dark' ? 'calc(100% - 36px)' : '4px',
      transform: 'translateY(-50%)',
      width: '28px',
      height: '28px',
      borderRadius: '50%',
      backgroundColor: theme === 'dark' ? '#ffffff' : '#343a40',
      transition: 'left 0.3s ease, background-color 0.3s ease',
      boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
    }}
  />
</div>
        </div>
      </nav>
    );
  }
  

  return (
    <nav
      className="navbar navbar-expand-lg border-bottom shadow-sm fixed-top px-3 py-2"
      style={{ marginBottom: 0, zIndex: 1041, width: '100%' }}
    >
      <div className="container-fluid position-relative d-flex align-items-center justify-content-between">
        {/* Left Side - Toggle Button and Brand */}
        <div className="d-flex align-items-center" style={{ marginLeft: '-12px' }}>
<button
  className="btn btn-outline-secondary d-flex align-items-center justify-content-center me-2"
  onClick={e => { onSidebarToggle && onSidebarToggle(e); closeDropdowns(); }}
  style={{
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    border: theme === 'dark' ? '1px solid #4a5568' : '1px solid #e2e8f0',
    background: theme === 'dark' ? '#1E1E1E' : '#f8f9fa',
    color: theme === 'dark' ? '#e2e8f0' : '#333',
    transition: 'all 0.3s ease',
    fontSize: '1.1rem',
    padding: '0',
    minWidth: '40px',
    outline: 'none',
    boxShadow: 'none'
  }}
  onMouseEnter={e => {
    e.target.style.background = theme === 'dark' ? '#4a5568' : '#e9ecef';
    e.target.style.borderColor = theme === 'dark' ? '#718096' : '#dee2e6';
    e.target.style.transform = 'scale(1.05)';
    e.target.style.boxShadow = theme === 'dark' ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)';
  }}
  onMouseLeave={e => {
    e.target.style.background = theme === 'dark' ? '#1E1E1E' : '#f8f9fa';
    e.target.style.borderColor = theme === 'dark' ? '#4a5568' : '#e2e8f0';
    e.target.style.transform = 'scale(1)';
    e.target.style.boxShadow = 'none';
  }}
  onFocus={e => {
    e.target.style.background = theme === 'dark' ? '#4a5568' : '#e9ecef';
    e.target.style.borderColor = theme === 'dark' ? '#718096' : '#dee2e6';
  }}
  onBlur={e => {
    e.target.style.background = theme === 'dark' ? '#1E1E1E' : '#f8f9fa';
    e.target.style.borderColor = theme === 'dark' ? '#4a5568' : '#e2e8f0';
  }}
  title="Toggle Sidebar"
>
  <svg 
    style={{color: theme === 'dark' ? '#e2e8f0' : '#333'}} 
    width="16" 
    height="16" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <line x1="3" y1="12" x2="21" y2="12"></line>
    <line x1="3" y1="18" x2="21" y2="18"></line>
  </svg>
</button>



          {/* Brand - Always Visible */}
          <div className="navbar-brand d-flex align-items-center">
            <img
              src="/favicon.png"
              alt="logo"
              width="24"
              height="24"
              className="me-2"
            />
            <strong style={{ color: 'var(--text-primary)' }}>TaskMaster</strong>
          </div>
        </div>

        {isAuthenticated && (
          <>

            {/* Buttons and Icons */}
            <div className="d-flex align-items-center gap-3">
{/* Search bar with icon on the right */}
{!hideSearchBar() && (
  <div className="position-relative d-none d-md-block me-3" style={{ width: '240px', marginTop: '0.6vh' }}>
    <FaSearch
      style={{
        position: 'absolute',
        top: '50%',
        left: '12px',
        transform: 'translateY(-50%)',
        color: 'var(--text-muted)',
        pointerEvents: 'none',
        fontSize: '14px',
      }}
    />
    <input
      type="search"
      className="form-control search-input themed-input"
      placeholder={getSearchPlaceholder()}
      style={{
        borderRadius: '5px',
        padding: '0.45rem 1rem 0.45rem 2.5rem',
        fontSize: '0.9rem',
        transition: 'all 0.3s ease',
      }}
      value={search}
      onChange={e => setSearch(e.target.value)}
      // onFocus={closeDropdowns} // Remove this line
    />
  </div>
)}

              {/* Icons */}
              <NotificationDropdown 
                userData={JSON.parse(sessionStorage.getItem('loggedInUser'))} 
                onOpen={() => setShowProfile(false)}
              />
              <FaQuestionCircle
                style={getIconStyle('help')}
                onMouseEnter={() => setHoveredIcon('help')}
                onMouseLeave={() => setHoveredIcon(null)}
                title="Help"
                role="button"
                onClick={() => { closeDropdowns(); navigate('/help'); }}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { closeDropdowns(); navigate('/help'); } }}
              />
              {/* Settings Icon */}
              <div className="position-relative d-flex align-items-center">
                <FaCog
                  style={getIconStyle('settings')}
                  onMouseEnter={() => setHoveredIcon('settings')}
                  onMouseLeave={() => setHoveredIcon(null)}
                  title="Settings"
                  onClick={() => {
                    dispatch(toggleSettings());
                    setShowProfile(false); // Always close profile when opening settings
                  }}
                />
                {showSettings && <SettingsBox />}
              </div>

              {/* Profile circle */}
              <div className="position-relative">
                <div
                  className="bg-success text-white rounded-circle d-flex align-items-center justify-content-center fw-bold"
                  style={{
                    width: '35px',
                    height: '35px',
                    cursor: 'pointer',
                    transform: hoveredIcon === 'profile' ? 'scale(1.1)' : 'scale(1)',
                    transition: 'transform 0.2s',
                  }}
                  onClick={() => {
                    setShowProfile((prev) => {
                      // If opening profile, close settings
                      if (!prev) dispatch(closeSettings());
                      return !prev;
                    });
                  }}
                  onMouseEnter={() => setHoveredIcon('profile')}
                  onMouseLeave={() => setHoveredIcon(null)}
                  title="Profile"
                >
                  ML
                </div>

                {showProfile && <Profile />}
              </div>
            </div>
          </>
        )}

      </div>
    </nav>
  );
}

export default Navbar;
