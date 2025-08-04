import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../features/Login';
import { FaUser, FaEnvelope, FaPhone, FaSignOutAlt, FaUserTie, FaUserCog, FaUsers, FaUserAlt } from 'react-icons/fa';
import './theme.css';

function ProfileBox() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.login.user);
  const theme = useSelector((state) => state.theme.mode);

  // Choose icon based on role
  let roleIcon = <FaUser />;
  if (user?.role === 'admin') roleIcon = <FaUserTie />;
  else if (user?.role === 'project_manager') roleIcon = <FaUserCog />;
  else if (user?.role === 'team_lead') roleIcon = <FaUsers />;
  else if (user?.role === 'developer') roleIcon = <FaUserAlt />;

  return (
    <div
      className="position-absolute end-0 mt-3 me-2 border shadow-lg rounded-3 p-3 profile-box themed-card"
      style={{
        transition: 'all 0.3s',
        minWidth: 260,
        maxWidth: 280
      }}
    >
      {/* Header */}
      <div className="d-flex align-items-center mb-2">
        <div
          className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2"
          style={{ width: 32, height: 32, fontSize: 16 }}
        >
          {roleIcon}
        </div>
        <div>
          <h6 className="fw-bold mb-0" style={{ lineHeight: 1, fontSize: '0.95rem' }}>{user?.username || 'User'}</h6>
          <small className="text-muted" style={{ fontSize: '0.75rem' }}>Active</small>
        </div>
      </div>

      <hr className="my-2" />

      {/* User Info */}
      <div className="mb-2">
        <div className="d-flex align-items-center mb-2">
          <FaEnvelope className="me-2 text-muted" style={{ fontSize: '0.8rem' }} />
          <div>
            <small className="d-block text-muted fw-bold" style={{ fontSize: '0.7rem' }}>Email</small>
            <div className="text-muted" style={{ lineHeight: 1.1, fontSize: '0.8rem' }}>{user?.email || 'N/A'}</div>
          </div>
        </div>

        <div className="d-flex align-items-center">
          <span className="me-2 text-muted" style={{ fontSize: '0.8rem' }}>{roleIcon}</span>
          <div>
            <small className="d-block text-muted fw-bold" style={{ fontSize: '0.7rem' }}>Role</small>
            <span
              style={{
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
                marginTop: 2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                display: 'block',
                maxWidth: '100%',
              }}
            >
              {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : ''}
            </span>
          </div>
        </div>
      </div>

      <hr className="my-2" />

      {/* Logout Button */}
      <button
        className="btn btn-outline-danger w-100 d-flex align-items-center justify-content-center"
        style={{ padding: '4px 0', fontSize: '0.85rem' }}
        onClick={() => dispatch(logout())}
      >
        <FaSignOutAlt className="me-2" style={{ fontSize: '0.8rem' }} />
        Logout
      </button>
    </div>
  );
}

export default ProfileBox;
