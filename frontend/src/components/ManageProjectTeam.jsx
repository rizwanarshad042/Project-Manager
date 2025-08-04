import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import toast, { Toaster } from 'react-hot-toast';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './theme.css';

function ManageProjectTeam() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const user = useSelector((state) => state.login.user);
  const theme = useSelector((state) => state.theme.mode);
  
  const [project, setProject] = useState(null);
  const [currentTeamLeads, setCurrentTeamLeads] = useState([]);
  const [currentDevelopers, setCurrentDevelopers] = useState([]);
  const [availableTeamLeads, setAvailableTeamLeads] = useState([]);
  const [availableDevelopers, setAvailableDevelopers] = useState([]);
  const [selectedTeamLead, setSelectedTeamLead] = useState('');
  const [selectedDevelopers, setSelectedDevelopers] = useState([]);
  const [selectedTeamLeadForDevelopers, setSelectedTeamLeadForDevelopers] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('team-leads');

  useEffect(() => {
    document.body.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // Fetch project details and current team
  useEffect(() => {
    const fetchProjectDetails = async () => {
      const token = JSON.parse(sessionStorage.getItem('loggedInUser'))?.token;
      try {
        const res = await fetch(`http://localhost:3001/api/projects/${projectId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const projectData = await res.json();
          setProject(projectData);
          setCurrentTeamLeads(projectData.team_leads || []);
          setCurrentDevelopers(projectData.developers || []);
        }
      } catch (err) {
        console.error('Error fetching project details:', err);
      }
    };

    if (projectId) {
      fetchProjectDetails();
    }
  }, [projectId]);

  // Fetch available team leads and developers
  const fetchAvailableUsers = async () => {
    const token = JSON.parse(sessionStorage.getItem('loggedInUser'))?.token;
    try {
      const [teamLeadsRes, developersRes] = await Promise.all([
        fetch('http://localhost:3001/api/team-leads/available', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:3001/api/developers/available', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);
      
      if (teamLeadsRes.ok) {
        const teamLeads = await teamLeadsRes.json();
        setAvailableTeamLeads(teamLeads);
      }
      
      if (developersRes.ok) {
        const developers = await developersRes.json();
        setAvailableDevelopers(developers);
      }
    } catch (err) {
      console.error('Error fetching available users:', err);
    }
  };

  useEffect(() => {
    fetchAvailableUsers();
  }, []);


  const handleDeveloperSelection = (developerId, isSelected) => {
    if (isSelected) {
      setSelectedDevelopers(prev => [...prev, developerId]);
    } else {
      setSelectedDevelopers(prev => prev.filter(id => id !== developerId));
    }
  };

  const handleAddTeamLead = async (e) => {
    e.preventDefault();
    if (!selectedTeamLead) {
      toast.error('Please select a team lead.');
      return;
    }

    setLoading(true);
    const token = JSON.parse(sessionStorage.getItem('loggedInUser'))?.token;
    
    try {
      const res = await fetch(`http://localhost:3001/api/projects/${projectId}/team-leads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ teamLeadId: selectedTeamLead })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        toast.success('Team lead added successfully!');
        setSelectedTeamLead('');
        // Refresh project details
        const projectRes = await fetch(`http://localhost:3001/api/projects/${projectId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (projectRes.ok) {
          const projectData = await projectRes.json();
          setCurrentTeamLeads(projectData.team_leads || []);
        }
        // Refresh available team leads
        const availableRes = await fetch('http://localhost:3001/api/team-leads/available', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (availableRes.ok) {
          const available = await availableRes.json();
          setAvailableTeamLeads(available);
        }
      } else {
        toast.error(data.message || 'Failed to add team lead.');
      }
    } catch (err) {
      toast.error('Server error.');
    }
    setLoading(false);
  };

  const handleAddDevelopers = async (e) => {
    e.preventDefault();
    if (selectedDevelopers.length === 0) {
      toast.error('Please select at least one developer.');
      return;
    }
    if (!selectedTeamLeadForDevelopers) {
      toast.error('Please select a team lead to assign developers to.');
      return;
    }

    setLoading(true);
    const token = JSON.parse(sessionStorage.getItem('loggedInUser'))?.token;
    
    try {
      const res = await fetch(`http://localhost:3001/api/projects/${projectId}/developers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          teamLeadId: selectedTeamLeadForDevelopers,
          developerIds: selectedDevelopers 
        })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        toast.success('Developers added successfully!');
        setSelectedDevelopers([]);
        setSelectedTeamLeadForDevelopers('');
        // Refresh project details
        const projectRes = await fetch(`http://localhost:3001/api/projects/${projectId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (projectRes.ok) {
          const projectData = await projectRes.json();
          setCurrentDevelopers(projectData.developers || []);
        }
        // Refresh available developers
        const availableRes = await fetch('http://localhost:3001/api/developers/available', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (availableRes.ok) {
          const available = await availableRes.json();
          setAvailableDevelopers(available);
        }
      } else {
        toast.error(data.message || 'Failed to add developers.');
      }
    } catch (err) {
      toast.error('Server error.');
    }
    setLoading(false);
  };

  const handleRemoveTeamLead = async (teamLeadId) => {
    if (!window.confirm('Are you sure you want to remove this team lead from the project?')) {
      return;
    }

    setLoading(true);
    const token = JSON.parse(sessionStorage.getItem('loggedInUser'))?.token;
    
    try {
      const res = await fetch(`http://localhost:3001/api/projects/${projectId}/team-leads/${teamLeadId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        toast.success('Team lead removed successfully!');
        // Refresh project details
        const projectRes = await fetch(`http://localhost:3001/api/projects/${projectId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (projectRes.ok) {
          const projectData = await projectRes.json();
          setCurrentTeamLeads(projectData.team_leads || []);
        }
        // Refresh available team leads
        const availableRes = await fetch('http://localhost:3001/api/team-leads/available', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (availableRes.ok) {
          const available = await availableRes.json();
          setAvailableTeamLeads(available);
        }
      } else {
        const data = await res.json();
        toast.error(data.message || 'Failed to remove team lead.');
      }
    } catch (err) {
      toast.error('Server error.');
    }
    setLoading(false);
  };

  const handleRemoveDeveloper = async (developerId) => {
    if (!window.confirm('Are you sure you want to remove this developer from the project?')) {
      return;
    }

    setLoading(true);
    const token = JSON.parse(sessionStorage.getItem('loggedInUser'))?.token;
    
    try {
      const res = await fetch(`http://localhost:3001/api/projects/${projectId}/developers/${developerId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        toast.success('Developer removed successfully!');
        // Refresh project details
        const projectRes = await fetch(`http://localhost:3001/api/projects/${projectId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (projectRes.ok) {
          const projectData = await projectRes.json();
          setCurrentDevelopers(projectData.developers || []);
        }
        // Refresh available developers
        const availableRes = await fetch('http://localhost:3001/api/developers/available', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (availableRes.ok) {
          const available = await availableRes.json();
          setAvailableDevelopers(available);
        }
      } else {
        const data = await res.json();
        toast.error(data.message || 'Failed to remove developer.');
      }
    } catch (err) {
      toast.error('Server error.');
    }
    setLoading(false);
  };

  if (!project) {
    return (
      <div className="container-fluid d-flex justify-content-center align-items-center" style={{ minHeight: '91vh' }}>
        <div className="spinner-border" role="status" style={{ fontSize: '1.7rem' }}>
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="container-fluid d-flex justify-content-center align-items-center"
      style={{
        background: theme === 'dark' ? '#12161d' : '#f8f9fa',
        color: theme === 'dark' ? '#f1f1f1' : '#212529',
        minHeight: '91vh',
        padding: '20px',
        paddingTop: '30px',
      }}
    >
      <div className="col-12 col-lg-8 col-xl-6">
        <div
          className="shadow rounded p-3"
          style={{
            background: theme === 'dark' ? '#1e222a' : '#fff',
            color: theme === 'dark' ? '#f8f9fa' : '#212529',
            border: theme === 'dark' ? '1px solid #2c3039' : '1px solid #dee2e6',
            boxShadow:
              theme === 'dark'
                ? '0 2px 8px rgba(0,0,0,0.3)'
                : '0 2px 6px rgba(0,0,0,0.06)',
            transition: 'all 0.3s ease',
          }}
        >
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h3 className="mb-0" style={{ fontSize: '1.4rem' }}>Manage Project Team</h3>
            <div className="d-flex gap-2">
              <button 
                className="btn btn-secondary btn-sm" 
                onClick={() => navigate('/user-projects')}
                style={{ fontSize: '1rem', padding: '0.25rem 0.5rem' }}
              >
                Back to Projects
              </button>
            </div>
          </div>

          <div className="mb-3">
            <h5 style={{ fontSize: '1.2rem' }}>{project.name}</h5>
            <p className="text-muted" style={{ fontSize: '1rem' }}>{project.description}</p>
          </div>

          {/* Navigation Tabs */}
          <ul className="nav nav-tabs mb-3">
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'team-leads' ? 'active' : ''}`}
                onClick={() => setActiveTab('team-leads')}
                style={{ fontSize: '1rem', padding: '0.5rem 0.75rem' }}
              >
                Team Leads
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'developers' ? 'active' : ''}`}
                onClick={() => setActiveTab('developers')}
                style={{ fontSize: '1rem', padding: '0.5rem 0.75rem' }}
              >
                Developers
              </button>
            </li>
          </ul>

          {/* Team Leads Tab */}
          {activeTab === 'team-leads' && (
            <div className="row g-3">
              <div className="col-md-6">
                <div className="card" style={{
                  backgroundColor: theme === 'dark' ? '#2c3039' : '#ffffff',
                  color: theme === 'dark' ? '#f8f9fa' : '#212529',
                  border: theme === 'dark' ? '1px solid #404040' : '1px solid #dee2e6',
                  borderRadius: '8px'
                }}>
                  <div className="card-header" style={{
                    backgroundColor: theme === 'dark' ? '#1e222a' : '#f8f9fa',
                    color: theme === 'dark' ? '#f8f9fa' : '#212529',
                    borderBottom: theme === 'dark' ? '1px solid #404040' : '1px solid #dee2e6',
                    padding: '0.5rem 0.75rem'
                  }}>
                    <h6 className="mb-0" style={{ fontSize: '1.1rem' }}>Current Team Leads</h6>
                  </div>
                  <div className="card-body" style={{ padding: '0.75rem' }}>
                    {currentTeamLeads.length === 0 ? (
                      <p className="text-muted" style={{ fontSize: '1rem' }}>No team leads assigned to this project.</p>
                    ) : (
                      <div className="list-group">
                        {currentTeamLeads.map(tl => (
                          <div key={tl.user_id} className="list-group-item d-flex justify-content-between align-items-center" style={{
                            backgroundColor: theme === 'dark' ? '#1e222a' : '#ffffff',
                            color: theme === 'dark' ? '#f8f9fa' : '#212529',
                            border: theme === 'dark' ? '1px solid #404040' : '1px solid #dee2e6',
                            padding: '0.5rem',
                            fontSize: '1rem'
                          }}>
                            <div>
                              <strong style={{ fontSize: '1.05rem' }}>{tl.name}</strong>
                              <br />
                              <small style={{ color: theme === 'dark' ? '#adb5bd' : '#6c757d', fontSize: '0.95rem' }}>{tl.email}</small>
                            </div>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleRemoveTeamLead(tl.user_id)}
                              disabled={loading}
                              style={{ fontSize: '0.9rem', padding: '0.25rem 0.5rem' }}
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="col-md-6">
                <div className="card" style={{
                  backgroundColor: theme === 'dark' ? '#2c3039' : '#ffffff',
                  color: theme === 'dark' ? '#f8f9fa' : '#212529',
                  border: theme === 'dark' ? '1px solid #404040' : '1px solid #dee2e6',
                  borderRadius: '8px'
                }}>
                  <div className="card-header" style={{
                    backgroundColor: theme === 'dark' ? '#1e222a' : '#f8f9fa',
                    color: theme === 'dark' ? '#f8f9fa' : '#212529',
                    borderBottom: theme === 'dark' ? '1px solid #404040' : '1px solid #dee2e6',
                    padding: '0.5rem 0.75rem'
                  }}>
                    <div className="d-flex justify-content-between align-items-center">
                      <h6 className="mb-0" style={{ fontSize: '1.1rem' }}>Add Team Lead</h6>
                      <span className="badge bg-info" style={{ fontSize: '0.8rem' }}>
                        {availableTeamLeads.length} available
                      </span>
                    </div>
                  </div>
                  <div className="card-body" style={{ padding: '0.75rem' }}>
                    {availableTeamLeads.length === 0 ? (
                      <div className="alert alert-warning" style={{
                        backgroundColor: theme === 'dark' ? '#664d03' : '#fff3cd',
                        color: theme === 'dark' ? '#ffc107' : '#856404',
                        border: theme === 'dark' ? '1px solid #664d03' : '1px solid #ffeaa7',
                        fontSize: '0.95rem',
                        padding: '0.5rem'
                      }}>
                        <div>
                          <strong>No available team leads found.</strong>
                          <br />
                          <small>You can create new team leads using the "Create User" option.</small>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleAddTeamLead}>
                        <div className="mb-2">
                          <label className="form-label" style={{ color: theme === 'dark' ? '#f8f9fa' : '#212529', fontSize: '1rem', fontWeight: '600' }}>Available Team Leads</label>
                          <select 
                            className="form-control themed-input" 
                            value={selectedTeamLead} 
                            onChange={e => setSelectedTeamLead(e.target.value)}
                            required
                            style={{ fontSize: '1rem', padding: '0.5rem' }}
                          >
                            <option value="">Select a team lead</option>
                            {availableTeamLeads.map(tl => (
                              <option key={tl.user_id} value={tl.user_id}>
                                {tl.name} ({tl.email})
                              </option>
                            ))}
                          </select>
                        </div>
                        <button 
                          type="submit" 
                          className="btn btn-primary btn-sm" 
                          disabled={loading || !selectedTeamLead}
                          style={{ fontSize: '1rem', padding: '0.25rem 0.5rem' }}
                        >
                          {loading ? 'Adding...' : 'Add Team Lead'}
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Developers Tab */}
          {activeTab === 'developers' && (
            <div className="row g-3">
              <div className="col-md-6">
                <div className="card" style={{
                  backgroundColor: theme === 'dark' ? '#2c3039' : '#ffffff',
                  color: theme === 'dark' ? '#f8f9fa' : '#212529',
                  border: theme === 'dark' ? '1px solid #404040' : '1px solid #dee2e6',
                  borderRadius: '8px'
                }}>
                  <div className="card-header" style={{
                    backgroundColor: theme === 'dark' ? '#1e222a' : '#f8f9fa',
                    color: theme === 'dark' ? '#f8f9fa' : '#212529',
                    borderBottom: theme === 'dark' ? '1px solid #404040' : '1px solid #dee2e6',
                    padding: '0.5rem 0.75rem'
                  }}>
                    <h6 className="mb-0" style={{ fontSize: '1.1rem' }}>Current Developers</h6>
                  </div>
                  <div className="card-body" style={{ padding: '0.75rem' }}>
                    {currentDevelopers.length === 0 ? (
                      <p className="text-muted" style={{ fontSize: '1rem' }}>No developers assigned to this project.</p>
                    ) : (
                      <div className="list-group">
                        {currentDevelopers.map(dev => (
                          <div key={dev.user_id} className="list-group-item d-flex justify-content-between align-items-center" style={{
                            backgroundColor: theme === 'dark' ? '#1e222a' : '#ffffff',
                            color: theme === 'dark' ? '#f8f9fa' : '#212529',
                            border: theme === 'dark' ? '1px solid #404040' : '1px solid #dee2e6',
                            padding: '0.5rem',
                            fontSize: '1rem'
                          }}>
                            <div>
                              <strong style={{ fontSize: '1.05rem' }}>{dev.name}</strong>
                              <br />
                              <small style={{ color: theme === 'dark' ? '#adb5bd' : '#6c757d', fontSize: '0.95rem' }}>{dev.email}</small>
                              {dev.specialization && (
                                <small style={{ color: theme === 'dark' ? '#17a2b8' : '#0dcaf0', fontSize: '0.95rem' }}> ({dev.specialization})</small>
                              )}
                              <br />
                              <small style={{ color: theme === 'dark' ? '#28a745' : '#198754', fontSize: '0.95rem' }}>
                                Assigned to: {dev.team_lead_name || 'Unknown Team Lead'}
                              </small>
                            </div>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleRemoveDeveloper(dev.user_id)}
                              disabled={loading}
                              style={{ fontSize: '0.9rem', padding: '0.25rem 0.5rem' }}
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="col-md-6">
                <div className="card" style={{
                  backgroundColor: theme === 'dark' ? '#2c3039' : '#ffffff',
                  color: theme === 'dark' ? '#f8f9fa' : '#212529',
                  border: theme === 'dark' ? '1px solid #404040' : '1px solid #dee2e6',
                  borderRadius: '8px'
                }}>
                  <div className="card-header" style={{
                    backgroundColor: theme === 'dark' ? '#1e222a' : '#f8f9fa',
                    color: theme === 'dark' ? '#f8f9fa' : '#212529',
                    borderBottom: theme === 'dark' ? '1px solid #404040' : '1px solid #dee2e6',
                    padding: '0.5rem 0.75rem'
                  }}>
                    <div className="d-flex justify-content-between align-items-center">
                      <h6 className="mb-0" style={{ fontSize: '1.1rem' }}>Add Developers</h6>
                      <span className="badge bg-info" style={{ fontSize: '0.8rem' }}>
                        {availableDevelopers.length} available
                      </span>
                    </div>
                  </div>
                  <div className="card-body" style={{ padding: '0.75rem' }}>
                    {currentTeamLeads.length === 0 ? (
                      <div className="alert alert-warning" style={{
                        backgroundColor: theme === 'dark' ? '#664d03' : '#fff3cd',
                        color: theme === 'dark' ? '#ffc107' : '#856404',
                        border: theme === 'dark' ? '1px solid #664d03' : '1px solid #ffeaa7',
                        fontSize: '0.95rem',
                        padding: '0.5rem'
                      }}>
                        Please add a team lead first before adding developers.
                      </div>
                    ) : availableDevelopers.length === 0 ? (
                      <div className="alert alert-warning" style={{
                        backgroundColor: theme === 'dark' ? '#664d03' : '#fff3cd',
                        color: theme === 'dark' ? '#ffc107' : '#856404',
                        border: theme === 'dark' ? '1px solid #664d03' : '1px solid #ffeaa7',
                        fontSize: '0.95rem',
                        padding: '0.5rem'
                      }}>
                        <div>
                          <strong>No available developers found.</strong>
                          <br />
                          <small>Developers become available when:</small>
                          <ul className="mb-0 mt-1" style={{ fontSize: '0.85rem' }}>
                            <li>They are not assigned to any active project</li>
                            <li>Their previous project was completed or deleted</li>
                          </ul>
                          <small>You can create new developers using the "Create User" option.</small>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleAddDevelopers}>
                        <div className="mb-2">
                          <label className="form-label" style={{ color: theme === 'dark' ? '#f8f9fa' : '#212529', fontSize: '1rem', fontWeight: '600' }}>Select Team Lead to Assign Developers To</label>
                          <select 
                            className="form-control themed-input mb-2" 
                            value={selectedTeamLeadForDevelopers} 
                            onChange={e => setSelectedTeamLeadForDevelopers(e.target.value)}
                            required
                            style={{ fontSize: '1rem', padding: '0.5rem' }}
                          >
                            <option value="">Select a team lead</option>
                            {currentTeamLeads.map(tl => (
                              <option key={tl.user_id} value={tl.user_id}>
                                {tl.name} ({tl.email})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="mb-2">
                          <label className="form-label" style={{ color: theme === 'dark' ? '#f8f9fa' : '#212529', fontSize: '1rem', fontWeight: '600' }}>Available Developers</label>
                          <div className="max-h-60 overflow-y-auto border rounded p-2" style={{
                            backgroundColor: theme === 'dark' ? '#1e222a' : '#ffffff',
                            border: theme === 'dark' ? '1px solid #404040' : '1px solid #dee2e6'
                          }}>
                            {availableDevelopers.map(dev => (
                              <div key={dev.user_id} className="form-check mb-1">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id={`dev-${dev.user_id}`}
                                  checked={selectedDevelopers.includes(dev.user_id)}
                                  onChange={e => handleDeveloperSelection(dev.user_id, e.target.checked)}
                                />
                                <label className="form-check-label" htmlFor={`dev-${dev.user_id}`} style={{ color: theme === 'dark' ? '#f8f9fa' : '#212529', fontSize: '1rem' }}>
                                  <strong style={{ fontSize: '1.05rem' }}>{dev.name}</strong>
                                  {dev.specialization && (
                                    <span style={{ color: theme === 'dark' ? '#adb5bd' : '#6c757d', fontSize: '0.95rem' }} className="ms-2">- {dev.specialization}</span>
                                  )}
                                </label>
                              </div>
                            ))}
                          </div>
                          {selectedDevelopers.length > 0 && (
                            <div className="mt-1">
                              <small style={{ color: theme === 'dark' ? '#adb5bd' : '#6c757d', fontSize: '0.95rem' }}>
                                Selected: {selectedDevelopers.length} developer(s)
                              </small>
                            </div>
                          )}
                        </div>
                        <button 
                          type="submit" 
                          className="btn btn-primary btn-sm" 
                          disabled={loading || selectedDevelopers.length === 0 || !selectedTeamLeadForDevelopers}
                          style={{ fontSize: '1rem', padding: '0.25rem 0.5rem' }}
                        >
                          {loading ? 'Adding...' : `Add Selected Developers to ${currentTeamLeads.find(tl => tl.user_id === selectedTeamLeadForDevelopers)?.name || 'Team Lead'}`}
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Inline Styles */}
      <style>{`
        .max-h-60 {
          max-height: 240px;
        }
        .overflow-y-auto {
          overflow-y: auto;
        }
        .nav-tabs .nav-link {
          color: var(--text-color);
          border: 1px solid var(--border-color);
          background: var(--bg-color);
        }
        .nav-tabs .nav-link.active {
          background: var(--primary-color);
          color: white;
          border-color: var(--primary-color);
        }
        
        /* Checkbox styling for both themes */
        .form-check-input {
          width: 1.2em !important;
          height: 1.2em !important;
          margin-top: 0.25em !important;
          margin-right: 0.5em !important;
          vertical-align: top !important;
          background-color: var(--checkbox-bg) !important;
          background-repeat: no-repeat !important;
          background-position: center !important;
          background-size: contain !important;
          border: 1px solid var(--checkbox-border) !important;
          appearance: none !important;
          color-adjust: exact !important;
          display: inline-block !important;
          opacity: 1 !important;
          visibility: visible !important;
        }
        
        .form-check-input:checked {
          background-color: var(--primary-color) !important;
          border-color: var(--primary-color) !important;
          background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3e%3cpath fill='none' stroke='%23fff' stroke-linecap='round' stroke-linejoin='round' stroke-width='3' d='m6 10 3 3 6-6'/%3e%3c/svg%3e") !important;
        }
        
        .form-check-input:focus {
          border-color: var(--primary-color) !important;
          outline: 0 !important;
          box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25) !important;
        }
        
        .form-check-input:focus:not(:hover) {
          border-color: var(--checkbox-border) !important;
          box-shadow: none !important;
        }
        
        .form-check-input:hover:not(:checked) {
          border-color: var(--primary-color) !important;
          background-color: var(--checkbox-hover-bg) !important;
          cursor: pointer !important;
        }
        
        .form-check-input:hover:checked {
          background-color: var(--primary-hover) !important;
          border-color: var(--primary-hover) !important;
          cursor: pointer !important;
        }
        
        /* Ensure checkboxes are always visible */
        input[type="checkbox"].form-check-input {
          position: relative !important;
          z-index: 1 !important;
          clip: auto !important;
          clip-path: none !important;
          -webkit-clip-path: none !important;
        }
        
        /* Override any Bootstrap styles that might hide checkboxes */
        .form-check .form-check-input {
          position: static !important;
          margin-left: 0 !important;
          float: none !important;
        }
        
        /* Remove left padding from form-check */
        .form-check {
          padding-left: 0 !important;
        }
        
        /* Select dropdown styling for both themes */
        .form-control, .themed-input {
          background-color: var(--input-bg) !important;
          color: var(--text-color) !important;
          border: 1px solid var(--border-color) !important;
        }
        
        .form-control:focus, .themed-input:focus {
          background-color: var(--input-bg) !important;
          color: var(--text-color) !important;
          border-color: var(--primary-color) !important;
          box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25) !important;
        }
        
        /* Select option styling */
        .form-control option, .themed-input option {
          background-color: var(--input-bg) !important;
          color: var(--text-color) !important;
        }
        
        body.dark {
          --text-color: #f1f1f1;
          --border-color: #495057;
          --bg-color: #2c3039;
          --primary-color: #0d6efd;
          --checkbox-bg: #2c3039;
          --checkbox-border: #495057;
          --checkbox-hover-bg: #3a3f47;
          --primary-hover: #0b5ed6;
          --input-bg: #2c3039;
        }
        :root {
          --text-color: #212529;
          --border-color: #dee2e6;
          --bg-color: #fff;
          --primary-color: #0d6efd;
          --checkbox-bg: #fff;
          --checkbox-border: #dee2e6;
          --checkbox-hover-bg: #f8f9fa;
          --primary-hover: #0b5ed6;
          --input-bg: #fff;
        }
      `}</style>
    </div>
  );
}

export default ManageProjectTeam; 