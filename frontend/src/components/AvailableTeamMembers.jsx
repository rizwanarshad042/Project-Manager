import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Modal, Button, Table, Badge } from 'react-bootstrap';
import { FaUsers, FaUserTie, FaUserCog, FaUserAlt, FaTimes } from 'react-icons/fa';
import toast from 'react-hot-toast';
import './theme.css';

// Custom styles for modal positioning
const modalStyles = {
  modal: {
    display: 'flex !important',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    zIndex: 1050
  },
  modalDialog: {
    margin: '1.75rem auto',
    maxWidth: '800px',
    width: '90%',
    maxHeight: '90vh',
    transform: 'none !important',
    overflow: 'hidden'
  }
};

// Add custom CSS for themed table and modal
const tableStyles = `
  .themed-table {
    background-color: var(--table-bg) !important;
    color: var(--text-primary) !important;
    border-color: var(--table-border) !important;
  }
  
  .themed-table th {
    background-color: var(--bg-secondary) !important;
    color: var(--text-primary) !important;
    border-color: var(--table-border) !important;
  }
  
  .themed-table td {
    border-color: var(--table-border) !important;
    color: var(--text-primary) !important;
  }
  
  .themed-table tbody tr:nth-of-type(odd) {
    background-color: var(--table-stripe) !important;
  }
  
  .themed-table tbody tr:hover {
    background-color: var(--table-hover) !important;
  }
  
  .themed-table tbody tr {
    border-color: var(--table-border) !important;
  }
  
  .themed-table thead tr {
    border-color: var(--table-border) !important;
  }
  
  .themed-table tbody tr td {
    border-color: var(--table-border) !important;
  }
  
  .themed-table thead tr th {
    border-color: var(--table-border) !important;
  }
  
  .available-team-modal .modal-content {
    max-height: 90vh;
    display: flex;
    flex-direction: column;
  }
  
  .available-team-modal .modal-header {
    flex-shrink: 0;
  }
  
  .available-team-modal .modal-body {
    flex: 1;
    overflow-y: auto;
    max-height: calc(90vh - 120px);
  }
  
  .available-team-modal .modal-footer {
    flex-shrink: 0;
  }
`;

function AvailableTeamMembers({ show, onHide }) {
  const theme = useSelector((state) => state.theme.mode);
  const [availableTeamMembers, setAvailableTeamMembers] = useState({
    availableTeamLeads: [],
    availableDevelopers: [],
    totalAvailable: 0
  });
  const [isLoading, setIsLoading] = useState(false);

  const fetchAvailableTeamMembers = async () => {
    setIsLoading(true);
    const token = JSON.parse(sessionStorage.getItem('loggedInUser'))?.token;
    
    try {
      const response = await fetch('http://localhost:3001/api/available-team-members', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAvailableTeamMembers(data);
      } else {
        toast.error('Failed to fetch available team members');
      }
    } catch (error) {
      console.error('Error fetching available team members:', error);
      toast.error('Error fetching available team members');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (show) {
      fetchAvailableTeamMembers();
      // Ensure modal is properly positioned
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [show]);

  const getRoleIcon = (role) => {
    switch (role) {
      case 'team_lead':
        return <FaUserTie className="text-primary" />;
      case 'developer':
        return <FaUserAlt className="text-success" />;
      case 'project_manager':
        return <FaUserCog className="text-warning" />;
      default:
        return <FaUsers className="text-secondary" />;
    }
  };

  const getRoleBadge = (role) => {
    const variant = role === 'team_lead' ? 'primary' : 'success';
    return <Badge bg={variant}>{role.replace('_', ' ').toUpperCase()}</Badge>;
  };

  return (
    <>
      <style>{tableStyles}</style>
      <Modal 
        show={show} 
        onHide={onHide} 
        size="lg"
        centered
        style={modalStyles.modal}
        className="modal-dialog-centered themed-modal available-team-modal"
        dialogClassName="modal-dialog-centered"
      >
      <Modal.Header className={theme === 'dark' ? 'dark-modal-header' : 'light-modal-header'}>
        <Modal.Title style={{ fontSize: '1.3rem', fontWeight: '600' }}>
          <FaUsers className="me-2" style={{ color: theme === 'dark' ? '#3b82f6' : '#2563eb' }} />
          Available Team Members
        </Modal.Title>
        <button
          type="button"
          className="btn-close"
          onClick={onHide}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: theme === 'dark' ? '#e9ecef' : '#495057',
            opacity: '0.7',
            transition: 'all 0.3s ease',
            padding: '0.5rem',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px'
          }}
          onMouseEnter={(e) => {
            e.target.style.opacity = '1';
            e.target.style.background = theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
            e.target.style.color = theme === 'dark' ? '#ffffff' : '#000000';
          }}
          onMouseLeave={(e) => {
            e.target.style.opacity = '0.7';
            e.target.style.background = 'none';
            e.target.style.color = theme === 'dark' ? '#e9ecef' : '#495057';
          }}
          aria-label="Close"
        >
          <FaTimes />
        </button>
      </Modal.Header>
      <Modal.Body className={theme === 'dark' ? 'dark-modal-body' : 'light-modal-body'}>
        {isLoading ? (
          <div className="text-center">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-3">
              <h6 className="text-muted">
                Total Available: {availableTeamMembers.totalAvailable} members
              </h6>
            </div>

            {/* Team Leads Section */}
            <div className="mb-4">
              <div className="d-flex align-items-center mb-3 p-2 rounded-3" style={{
                background: theme === 'dark' 
                  ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.1) 100%)' 
                  : 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(37, 99, 235, 0.05) 100%)',
                border: `1px solid ${theme === 'dark' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)'}`
              }}>
                <FaUserTie className="me-2" style={{ color: theme === 'dark' ? '#3b82f6' : '#2563eb', fontSize: '1.1rem' }} />
                <h6 className="mb-0" style={{ 
                  color: theme === 'dark' ? '#e9ecef' : '#495057', 
                  fontSize: '1rem', 
                  fontWeight: '600' 
                }}>
                  Available Team Leads ({availableTeamMembers.availableTeamLeads.length})
                </h6>
              </div>
                              {availableTeamMembers.availableTeamLeads.length > 0 ? (
                  <Table striped bordered hover size="sm" className="themed-table" style={{
                    borderRadius: '8px',
                    overflow: 'hidden',
                    boxShadow: theme === 'dark' ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)'
                  }}>
                    <thead>
                      <tr>
                        <th style={{ 
                          background: theme === 'dark' ? '#2b2f36' : '#f8f9fa',
                          borderBottom: `2px solid ${theme === 'dark' ? '#3b82f6' : '#2563eb'}`,
                          borderColor: theme === 'dark' ? '#495057' : '#dee2e6',
                          fontSize: '0.9rem',
                          fontWeight: '600'
                        }}>Name</th>
                        <th style={{ 
                          background: theme === 'dark' ? '#2b2f36' : '#f8f9fa',
                          borderBottom: `2px solid ${theme === 'dark' ? '#3b82f6' : '#2563eb'}`,
                          borderColor: theme === 'dark' ? '#495057' : '#dee2e6',
                          fontSize: '0.9rem',
                          fontWeight: '600'
                        }}>Email</th>
                        <th style={{ 
                          background: theme === 'dark' ? '#2b2f36' : '#f8f9fa',
                          borderBottom: `2px solid ${theme === 'dark' ? '#3b82f6' : '#2563eb'}`,
                          borderColor: theme === 'dark' ? '#495057' : '#dee2e6',
                          fontSize: '0.9rem',
                          fontWeight: '600'
                        }}>Role</th>
                      </tr>
                    </thead>
                    <tbody>
                    {availableTeamMembers.availableTeamLeads.map((teamLead) => (
                      <tr key={teamLead.user_id}>
                        <td style={{ 
                          backgroundColor: theme === 'dark' ? '#1e222a' : '#ffffff',
                          borderColor: theme === 'dark' ? '#495057' : '#dee2e6',
                          fontSize: '0.9rem',
                          fontWeight: '500'
                        }}>
                          {getRoleIcon(teamLead.role)} {teamLead.name}
                        </td>
                        <td style={{ 
                          backgroundColor: theme === 'dark' ? '#1e222a' : '#ffffff',
                          borderColor: theme === 'dark' ? '#495057' : '#dee2e6',
                          fontSize: '0.85rem'
                        }}>{teamLead.email}</td>
                        <td style={{ 
                          backgroundColor: theme === 'dark' ? '#1e222a' : '#ffffff',
                          borderColor: theme === 'dark' ? '#495057' : '#dee2e6',
                          fontSize: '0.8rem'
                        }}>{getRoleBadge(teamLead.role)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <div className="text-center text-muted py-3">
                  <FaUserTie className="mb-2" style={{ fontSize: '2rem' }} />
                  <p>No available team leads</p>
                </div>
              )}
            </div>

            {/* Developers Section */}
            <div className="mb-4">
              <div className="d-flex align-items-center mb-3 p-2 rounded-3" style={{
                background: theme === 'dark' 
                  ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)' 
                  : 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 150, 105, 0.05) 100%)',
                border: `1px solid ${theme === 'dark' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)'}`
              }}>
                <FaUserAlt className="me-2" style={{ color: theme === 'dark' ? '#10b981' : '#059669', fontSize: '1.1rem' }} />
                <h6 className="mb-0" style={{ 
                  color: theme === 'dark' ? '#e9ecef' : '#495057', 
                  fontSize: '1rem', 
                  fontWeight: '600' 
                }}>
                  Available Developers ({availableTeamMembers.availableDevelopers.length})
                </h6>
              </div>
                              {availableTeamMembers.availableDevelopers.length > 0 ? (
                  <Table striped bordered hover size="sm" className="themed-table" style={{
                    borderRadius: '8px',
                    overflow: 'hidden',
                    boxShadow: theme === 'dark' ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)'
                  }}>
                    <thead>
                      <tr>
                        <th style={{ 
                          background: theme === 'dark' ? '#2b2f36' : '#f8f9fa',
                          borderBottom: `2px solid ${theme === 'dark' ? '#10b981' : '#059669'}`,
                          borderColor: theme === 'dark' ? '#495057' : '#dee2e6',
                          fontSize: '0.9rem',
                          fontWeight: '600'
                        }}>Name</th>
                        <th style={{ 
                          background: theme === 'dark' ? '#2b2f36' : '#f8f9fa',
                          borderBottom: `2px solid ${theme === 'dark' ? '#10b981' : '#059669'}`,
                          borderColor: theme === 'dark' ? '#495057' : '#dee2e6',
                          fontSize: '0.9rem',
                          fontWeight: '600'
                        }}>Email</th>
                        <th style={{ 
                          background: theme === 'dark' ? '#2b2f36' : '#f8f9fa',
                          borderBottom: `2px solid ${theme === 'dark' ? '#10b981' : '#059669'}`,
                          borderColor: theme === 'dark' ? '#495057' : '#dee2e6',
                          fontSize: '0.9rem',
                          fontWeight: '600'
                        }}>Specialization</th>
                        <th style={{ 
                          background: theme === 'dark' ? '#2b2f36' : '#f8f9fa',
                          borderBottom: `2px solid ${theme === 'dark' ? '#10b981' : '#059669'}`,
                          borderColor: theme === 'dark' ? '#495057' : '#dee2e6',
                          fontSize: '0.9rem',
                          fontWeight: '600'
                        }}>Role</th>
                      </tr>
                    </thead>
                    <tbody>
                    {availableTeamMembers.availableDevelopers.map((developer) => (
                      <tr key={developer.user_id}>
                        <td style={{ 
                          backgroundColor: theme === 'dark' ? '#1e222a' : '#ffffff',
                          borderColor: theme === 'dark' ? '#495057' : '#dee2e6',
                          fontSize: '0.9rem',
                          fontWeight: '500'
                        }}>
                          {getRoleIcon(developer.role)} {developer.name}
                        </td>
                        <td style={{ 
                          backgroundColor: theme === 'dark' ? '#1e222a' : '#ffffff',
                          borderColor: theme === 'dark' ? '#495057' : '#dee2e6',
                          fontSize: '0.85rem'
                        }}>{developer.email}</td>
                        <td style={{ 
                          backgroundColor: theme === 'dark' ? '#1e222a' : '#ffffff',
                          borderColor: theme === 'dark' ? '#495057' : '#dee2e6',
                          fontSize: '0.8rem'
                        }}>
                          <Badge bg="info" style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}>{developer.specialization}</Badge>
                        </td>
                        <td style={{ 
                          backgroundColor: theme === 'dark' ? '#1e222a' : '#ffffff',
                          borderColor: theme === 'dark' ? '#495057' : '#dee2e6',
                          fontSize: '0.8rem'
                        }}>{getRoleBadge(developer.role)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <div className="text-center text-muted py-3">
                  <FaUserAlt className="mb-2" style={{ fontSize: '2rem' }} />
                  <p>No available developers</p>
                </div>
              )}
            </div>

            {availableTeamMembers.totalAvailable === 0 && (
              <div className="text-center text-muted py-4">
                <FaUsers className="mb-3" style={{ fontSize: '3rem' }} />
                <h6>No Available Team Members</h6>
                <p className="small">
                  All team members are currently assigned to active projects.
                </p>
              </div>
            )}
          </div>
        )}
      </Modal.Body>
      <Modal.Footer className={theme === 'dark' ? 'dark-modal-footer' : 'light-modal-footer'}>
        <Button 
          variant="secondary" 
          onClick={onHide}
          style={{ 
            fontSize: '0.9rem', 
            padding: '0.5rem 1.5rem',
            borderRadius: '8px'
          }}
        >
          Close
        </Button>
        <Button 
          variant="primary" 
          onClick={fetchAvailableTeamMembers} 
          disabled={isLoading}
          style={{ 
            fontSize: '0.9rem', 
            padding: '0.5rem 1.5rem',
            borderRadius: '8px',
            background: theme === 'dark' ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            border: 'none',
            boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
          }}
        >
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </Modal.Footer>
    </Modal>
    </>
  );
}

export default AvailableTeamMembers; 