import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FaHome, FaChartBar, FaShoppingCart, FaComments, FaCalendarAlt,
  FaLayerGroup, FaCircle, FaBoxOpen, FaExternalLinkAlt, FaChevronDown,
  FaPlus, FaProjectDiagram, FaRunning, FaSignOutAlt, FaUserTie, FaTasks, FaListAlt, FaHistory
} from 'react-icons/fa';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../features/Login';
import { useNavigate } from 'react-router-dom';
import './theme.css';

const items = [
  { icon: <FaHome />, label: 'Modern', to: '/home', badge: 'New', active: true },
  { icon: <FaChartBar />, label: 'Analytical', to: '/analytical' },
  { icon: <FaShoppingCart />, label: 'eCommerce', to: '/ecommerce' },
  { icon: <FaComments />, label: 'Chat', to: '/chat' },
  { icon: <FaCalendarAlt />, label: 'Calendar', to: '/calendar' },
  { icon: <FaLayerGroup />, label: 'Menu Level', to: '#', hasDropdown: true },
  { icon: <FaCircle />, label: 'Salma', to: '#', disabled: true },
  { icon: <FaBoxOpen />, label: 'Chip', to: '#', badge: 6 },
  { icon: <FaBoxOpen />, label: 'Outline', to: '#', badge: 'outlined', outlined: true },
  { icon: <FaExternalLinkAlt />, label: 'External Link', to: 'https://example.com', external: true },
];

export default function Sidebar({ collapsed, setSidebarOpen, className }) {
  const location = useLocation();
  const theme = useSelector((state) => state.theme.mode);
  const user = useSelector((state) => state.login.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [hoveredIndex, setHoveredIndex] = React.useState(null);

  // Sidebar buttons based on role
  let sidebarButtons = [];
  if (user?.role === 'admin') {
    sidebarButtons = [
      { icon: <FaUserTie />, label: 'Project Manager', to: '/create-project-manager' },
      { icon: <FaSignOutAlt />, label: 'Logout', action: () => { dispatch(logout()); } },
    ];
  } else if (user?.role === 'project_manager') {
    sidebarButtons = [
      { icon: <FaUserTie />, label: 'Create User', to: '/create-user' },
      { icon: <FaProjectDiagram />, label: 'View Projects', to: '/user-projects' },
      { icon: <FaListAlt />, label: 'Backlog', to: '/backlog' },
      { icon: <FaLayerGroup />, label: 'Sprints', to: '/sprints' },
      { icon: <FaHistory />, label: 'History', to: '/history' },
      { icon: <FaSignOutAlt />, label: 'Logout', action: () => { dispatch(logout()); } },
    ];
  } else if (user?.role === 'team_lead') {
    sidebarButtons = [
      { icon: <FaProjectDiagram />, label: 'View Projects', to: '/user-projects' },
      { icon: <FaLayerGroup />, label: 'Sprints', to: '/sprints' },
      { icon: <FaSignOutAlt />, label: 'Logout', action: () => { dispatch(logout()); } },
    ];
    // Note: Team lead permissions for add/delete sprint/backlog and add task are restricted in the respective pages.
  } else if (user?.role === 'developer') {
    sidebarButtons = [
      { icon: <FaProjectDiagram />, label: 'View Projects', to: '/user-projects' },
      { icon: <FaLayerGroup />, label: 'Sprints', to: '/sprints' },
      { icon: <FaSignOutAlt />, label: 'Logout', action: () => { dispatch(logout()); } },
    ];
  }

  // Add Home button for all roles
  sidebarButtons = [
    { icon: <FaHome />, label: 'Home', to: '/home' },
    ...(sidebarButtons || [])
  ];

  const styles = {
    sidebar: {
        width: collapsed ? '70px' : '250px',
        minWidth: collapsed ? '70px' : '250px',
        backgroundColor: 'var(--sidebar-bg)',
        color: 'var(--sidebar-text)',
        padding: collapsed ? '20px 5px' : '20px 10px',
        height: '100vh',
        overflowY: 'auto',
        boxShadow: 'var(--shadow-light)',
        position: 'fixed',
        top: 42,
        left: 0,
        transition: 'width 0.3s ease, background 0.3s, padding 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1020,
      },
      
    closeBtn: {
      position: 'absolute',
      top: 10,
      right: 10,
      fontSize: 22,
      zIndex: 1050,
      border: 'none',
      background: 'transparent',
      cursor: 'pointer',
      color: theme === 'dark' ? '#f8f9fa' : '#333',
    },
    list: {
      listStyle: 'none',
      padding: 0,
      margin: 0,
    },
    item: (isActive, isDisabled, isHovered) => ({
      display: 'flex',
      alignItems: 'center',
      justifyContent: collapsed ? 'center' : 'flex-start',
      padding: collapsed ? '12px 8px' : '12px 16px',
      borderRadius: 8,
      marginBottom: 8,
      minHeight: 48,
      backgroundColor: isActive
        ? 'var(--sidebar-active-bg)'
        : isHovered
        ? 'var(--sidebar-hover-bg)'
        : 'transparent',
      color: isActive
        ? 'var(--sidebar-active-text)'
        : isDisabled
        ? 'var(--text-muted)'
        : 'var(--sidebar-text)',
      opacity: isDisabled ? 0.5 : 1,
      pointerEvents: isDisabled ? 'none' : 'auto',
      cursor: isDisabled ? 'not-allowed' : 'pointer',
      transition: 'all 0.3s ease',
      border: 'none',
      outline: 'none',
      width: '100%',
      boxShadow: 'none',
    }),
    link: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: collapsed ? 'center' : 'flex-start',
      color: 'inherit',
      textDecoration: 'none',
      width: '100%',
      height: '100%',
      border: 'none',
      outline: 'none',
    },
    label: {
      marginLeft: collapsed ? 0 : 12,
      display: collapsed ? 'none' : 'inline',
      fontSize: '14px',
      fontWeight: '500',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
    badge: (outlined) => ({
      marginLeft: 'auto',
      padding: '2px 6px',
      fontSize: 12,
      borderRadius: 12,
      backgroundColor: outlined ? 'transparent' : (theme === 'dark' ? '#dc3545' : 'red'),
      border: outlined ? `1px solid ${theme === 'dark' ? '#dc3545' : 'red'}` : 'none',
      color: outlined ? (theme === 'dark' ? '#dc3545' : 'red') : '#fff',
      display: collapsed ? 'none' : 'inline-block',
    }),
    dropdownIcon: {
      marginLeft: 'auto',
      fontSize: 12,
      display: collapsed ? 'none' : 'inline',
      color: theme === 'dark' ? '#f8f9fa' : '#333',
    },
    profile: {
      display: collapsed ? 'none' : 'flex',
      alignItems: 'center',
      marginTop: 30,
      padding: 10,
      borderTop: `1px solid ${theme === 'dark' ? '#444' : '#ddd'}`,
    },
    profileImg: {
      width: 40,
      height: 40,
      borderRadius: '50%',
      marginRight: 10,
      border: theme === 'dark' ? '2px solid #444' : 'none',
    },
    profileInfo: {
      display: 'flex',
      flexDirection: 'column',
    },
    profileName: {
      fontWeight: 'bold',
      color: theme === 'dark' ? '#fff' : '#333',
    },
    profileRole: {
      fontSize: 12,
      color: theme === 'dark' ? '#bbb' : 'gray',
    },
  };

  return (
<aside className={`sidebar-wrapper responsive-sidebar ${className || ''}`} style={{ 
  ...styles.sidebar, 
  zIndex: 1020, 
  position: 'fixed', 
  left: 0, 
  top: 42,
}}>
  {/* Sidebar Content: column layout */}
  <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 42px)', width: '100%' }}>
    {/* Scrollable Menu Items */}
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px 8px' }}>
      <ul style={styles.list}>
        {sidebarButtons.map((item, idx) => {
          const isActive = item.to && location.pathname === item.to;
          const isDisabled = false;
          const isHovered = hoveredIndex === idx;
          const content = (
            <>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: collapsed ? 'center' : 'flex-start',
                width: '100%',
                minWidth: collapsed ? 'auto' : '0'
              }}>
                {item.icon}
                {!collapsed && (
                  <span style={{
                    ...styles.label,
                    textAlign: 'left',
                    flex: 1,
                    minWidth: 0,
                  }}>{item.label}</span>
                )}
              </div>
            </>
          );
          // Handler for click on the entire li
          const handleClick = () => {
            if (item.to) {
              navigate(item.to);
            } else if (item.action) {
              item.action();
            }
          };
          return (
            <li
              key={item.label}
              style={styles.item(isActive, isDisabled, isHovered)}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={handleClick}
              tabIndex={0}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleClick(); }}
              role="button"
              aria-disabled={isDisabled}
            >
              <div style={{ 
                ...styles.link, 
                width: '100%', 
                height: '100%',
                padding: 0,
                margin: 0,
                border: 'none',
                outline: 'none'
              }}>
                {content}
              </div>
            </li>
          );
        })}
      </ul>
    </div>

    {/* Non-scrollable Profile Area */}
    <div
      style={{
        textDecoration: 'none',
        color: 'inherit',
        ...styles.profile,
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-primary)',
        padding: collapsed ? '8px' : '16px',
        minHeight: collapsed ? '60px' : '70px',
        display: 'flex',
        alignItems: 'center',
        marginBottom: collapsed ? '20px' : '8%',
        justifyContent: collapsed ? 'center' : 'flex-start',
        cursor: 'pointer',
        width: '100%',
      }}
    >
      <div
        style={{
          width: collapsed ? 36 : 40,
          height: collapsed ? 36 : 40,
          borderRadius: '50%',
          marginRight: collapsed ? 0 : 12,
          marginBottom: 0,
          background: 'var(--btn-primary-bg)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: collapsed ? 16 : 20,
          flexShrink: 0,
          flexGrow: 0,
          border: 'none',
        }}
      >
        {user?.username ? user.username[0].toUpperCase() : 'U'}
      </div>
      {!collapsed && (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          minWidth: 0, 
          maxWidth: 'calc(100% - 60px)',
          flex: 1
        }}>
          <span
            style={{
              fontWeight: 'bold',
              color: 'var(--text-primary)',
              fontSize: 16,
              lineHeight: 1.2,
            }}
          >
            {user?.username || 'User'}
          </span>
          <span
            style={{
              fontSize: 13,
              color: 'var(--text-secondary)',
              marginTop: 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              display: 'block',
              maxWidth: '100%',
              lineHeight: 1.2,
            }}
          >
            {user?.email || ''}
          </span>
          <span
            style={{
              fontSize: 13,
              color: 'var(--text-secondary)',
              marginTop: 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              display: 'block',
              maxWidth: '100%',
              lineHeight: 1.2,
            }}
          >
            {user?.phone || ''}
          </span>
          {user?.role && (
            <span
              style={{
                fontSize: 12,
                color: 'var(--btn-primary-bg)',
                marginTop: 2,
                fontWeight: '500',
              }}
            >
              {user.role}
            </span>
          )}
        </div>
      )}
    </div>
  </div>
</aside>


  );
}
