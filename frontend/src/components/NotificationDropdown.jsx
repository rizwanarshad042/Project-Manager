import React, { useState, useEffect } from 'react';
import { FaBell, FaCheck, FaTimes } from 'react-icons/fa';
import { useSelector, useDispatch } from 'react-redux';
import { closeSettings } from '../features/Login';
import toast from 'react-hot-toast';

function NotificationDropdown({ userData, onOpen }) {
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hoveredIcon, setHoveredIcon] = useState(null);
  const theme = useSelector((state) => state.theme.mode);
  const showSettings = useSelector((state) => state.ui.showSettings);
  const dispatch = useDispatch();

  useEffect(() => {
    if (userData?.role === 'project_manager') {
      fetchNotifications();
    }
  }, [userData]);

  // Close notification dropdown when settings are opened
  useEffect(() => {
    if (showSettings) {
      setShowDropdown(false);
    }
  }, [showSettings]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest('.dropdown')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const fetchNotifications = async () => {
    const token = JSON.parse(sessionStorage.getItem('loggedInUser'))?.token;
    if (!token) return;

    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/sprint-approvals', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Notifications data received:', data);
        setNotifications(data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (sprintId) => {
    const token = JSON.parse(sessionStorage.getItem('loggedInUser'))?.token;
    if (!token) return;

    try {
      const response = await fetch(`http://localhost:3001/api/sprint-approvals/${sprintId}/approve`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success('Sprint edit approved successfully!');
        fetchNotifications(); // Refresh notifications
      } else {
        const error = await response.json();
        console.error('Approval error:', error);
        toast.error(error.message || 'Failed to approve sprint edit');
      }
    } catch (error) {
      console.error('Error approving sprint edit:', error);
      toast.error('Failed to approve sprint edit');
    }
  };

  const handleReject = async (sprintId) => {
    const token = JSON.parse(sessionStorage.getItem('loggedInUser'))?.token;
    if (!token) return;

    try {
      const response = await fetch(`http://localhost:3001/api/sprint-approvals/${sprintId}/reject`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success('Sprint edit rejected');
        fetchNotifications(); // Refresh notifications
      } else {
        const error = await response.json();
        console.error('Rejection error:', error);
        toast.error(error.message || 'Failed to reject sprint edit');
      }
    } catch (error) {
      console.error('Error rejecting sprint edit:', error);
      toast.error('Failed to reject sprint edit');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  if (userData?.role !== 'project_manager') {
    return null;
  }

  return (
    <div className="dropdown" style={{ position: 'relative' }}>
      <FaBell
        style={{
          cursor: 'pointer',
          fontSize: '18px',
          color: hoveredIcon === 'bell' ? '#0d6efd' : '#6c757d',
          transform: hoveredIcon === 'bell' ? 'scale(1.2)' : 'scale(1)',
          transition: 'transform 0.2s, color 0.2s',
          marginTop: '-3px', // Move the bell icon up
        }}
        onMouseEnter={() => setHoveredIcon('bell')}
        onMouseLeave={() => setHoveredIcon(null)}
        onClick={() => {
          setShowDropdown(!showDropdown);
          // Close settings and profile when opening notifications
          if (!showDropdown) {
            dispatch(closeSettings());
            if (onOpen) onOpen(); // Close profile dropdown
          }
        }}
        title="Notifications"
      />
      {notifications.length > 0 && (
        <span 
          className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
          style={{
            fontSize: '0.7rem',
            padding: '0.25rem 0.5rem',
            transform: 'translate(-50%, -50%)',
            zIndex: 1000
          }}
        >
          {notifications.length}
        </span>
      )}

      {showDropdown && (
        <div 
          className="dropdown-menu show themed-card position-absolute end-0 mt-3 me-2 border profile-box"
          style={{ 
            width: 'min(400px, calc(100vw - 2rem))', 
            maxHeight: '500px', 
            overflowY: 'auto',
            backgroundColor: 'var(--card-bg)',
            color: 'var(--text-primary)',
            border: '1px solid var(--card-border)',
            boxShadow: 'var(--card-shadow)',
            zIndex: 1000,
            position: 'absolute',
            right: '0',
            top: 'calc(100% + 8px)',
            borderRadius: '12px',
            minWidth: '300px',
            maxWidth: '400px',
            transition: 'all 0.3s ease',
            padding: '0', // Remove all padding from container
          }}
        >
          {/* Sprint Approval Requests header always at the top */}
          <div className="dropdown-header d-flex justify-content-between align-items-center" style={{
            borderBottom: '1px solid var(--border-primary)',
            padding: '0.75rem 1rem 0.5rem 1rem', // Reduce bottom padding
            backgroundColor: 'var(--bg-secondary)',
            borderTopLeftRadius: '12px',
            borderTopRightRadius: '12px',
            marginTop: '0px',
            marginBottom: '0px', // Remove bottom margin
            borderTop: 'none', // Remove top border to eliminate gap
          }}>
            <h6 className="mb-0" style={{ color: 'var(--text-primary)' }}>Sprint Approval Requests</h6>
            <button
              className="btn btn-sm"
              style={{
                backgroundColor: 'var(--btn-secondary-bg)',
                color: 'var(--btn-secondary-text)',
                border: '1px solid var(--border-primary)',
                fontSize: '0.8rem',
                padding: '0.25rem 0.5rem',
                borderRadius: '6px',
                transition: 'all 0.2s ease'
              }}
              onClick={fetchNotifications}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
          {/* Notification list or empty message below header */}
          {notifications.length === 0 ? (
            <div className="dropdown-item text-muted" style={{
              color: 'var(--text-muted)',
              padding: '1rem',
              textAlign: 'center'
            }}>
              No pending approvals
            </div>
          ) : (
            notifications.map((notification, index) => {
              // Handle approval_data which might already be an object or a JSON string
              let approvalData = {};
              if (notification.approval_data) {
                console.log('Raw approval_data:', notification.approval_data, 'Type:', typeof notification.approval_data);
                if (typeof notification.approval_data === 'string') {
                  try {
                    approvalData = JSON.parse(notification.approval_data);
                  } catch (error) {
                    console.error('Error parsing approval_data:', error);
                    approvalData = {};
                  }
                } else if (typeof notification.approval_data === 'object') {
                  approvalData = notification.approval_data;
                }
              }
              
                             return (
                 <div key={notification.sprint_id} className="dropdown-item border-bottom" style={{
                   backgroundColor: 'var(--card-bg)',
                   color: 'var(--text-primary)',
                   borderBottom: '1px solid var(--border-primary)',
                   padding: '1rem',
                   transition: 'background-color 0.2s ease'
                 }}>
                   <div className="d-flex justify-content-between align-items-start mb-2">
                                         <div>
                       <strong style={{ color: 'var(--text-primary)' }}>{notification.project_name}</strong>
                       <br />
                       <small style={{ color: 'var(--text-muted)' }}>
                         Requested by: {notification.requested_by_name} ({notification.requested_by_email})
                       </small>
                       <br />
                       <small style={{ color: 'var(--text-muted)' }}>
                         {formatDate(approvalData.requested_at)}
                       </small>
                     </div>
                                         <div className="btn-group btn-group-sm">
                       <button
                         className="btn btn-sm"
                         style={{
                           backgroundColor: 'var(--btn-success-bg)',
                           color: 'var(--btn-success-text)',
                           border: 'none',
                           padding: '0.25rem 0.5rem',
                           fontSize: '0.8rem',
                           borderRadius: '4px',
                           transition: 'all 0.2s ease'
                         }}
                         onClick={() => handleApprove(notification.sprint_id)}
                         title="Approve"
                       >
                         <FaCheck />
                       </button>
                       <button
                         className="btn btn-sm"
                         style={{
                           backgroundColor: 'var(--btn-danger-bg)',
                           color: 'var(--btn-danger-text)',
                           border: 'none',
                           padding: '0.25rem 0.5rem',
                           fontSize: '0.8rem',
                           borderRadius: '4px',
                           transition: 'all 0.2s ease'
                         }}
                         onClick={() => handleReject(notification.sprint_id)}
                         title="Reject"
                       >
                         <FaTimes />
                       </button>
                     </div>
                  </div>
                  
                                     <div className="small" style={{ fontSize: '0.8rem' }}>
                     <div className="row">
                       <div className="col-6">
                         <strong style={{ color: 'var(--text-primary)' }}>Current:</strong>
                         <br />
                         <span style={{ color: 'var(--text-muted)' }}>
                           Name: {approvalData.current_name || 'N/A'}
                           <br />
                           Description: {approvalData.current_description || 'N/A'}
                           <br />
                           Dates: {approvalData.current_start_date ? new Date(approvalData.current_start_date).toLocaleDateString() : 'N/A'} - {approvalData.current_end_date ? new Date(approvalData.current_end_date).toLocaleDateString() : 'N/A'}
                         </span>
                       </div>
                       <div className="col-6">
                         <strong style={{ color: 'var(--text-primary)' }}>Proposed:</strong>
                         <br />
                         <span style={{ color: 'var(--text-muted)' }}>
                           Name: {approvalData.proposed_name || 'N/A'}
                           <br />
                           Description: {approvalData.proposed_description || 'N/A'}
                           <br />
                           Dates: {approvalData.proposed_start_date ? new Date(approvalData.proposed_start_date).toLocaleDateString() : 'N/A'} - {approvalData.proposed_end_date ? new Date(approvalData.proposed_end_date).toLocaleDateString() : 'N/A'}
                         </span>
                       </div>
                     </div>
                   </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationDropdown; 