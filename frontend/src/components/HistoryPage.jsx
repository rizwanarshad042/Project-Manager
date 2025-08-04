import React, { useEffect, useState, useContext } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { useSelector } from 'react-redux';
import { FaHistory, FaTasks, FaRocket, FaProjectDiagram } from 'react-icons/fa';
import { ProjectSearchContext } from './Navbar';
import './theme.css';

function HistoryPage() {
  const [completedTasks, setCompletedTasks] = useState([]);
  const [completedSprints, setCompletedSprints] = useState([]);
  const [completedProjects, setCompletedProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tasks');
  const data = useSelector((state) => state.login.user);
  const theme = useSelector((state) => state.theme.mode);
  const { search, setSearch } = useContext(ProjectSearchContext);

  useEffect(() => {
    fetchHistoryData();
  }, []);

  // Filter data based on search term
  const filterData = (data, searchTerm) => {
    if (!searchTerm) return data;
    
    const lowerSearch = searchTerm.toLowerCase();
    return data.filter(item => {
      // For tasks
      if (item.title) {
        return item.title.toLowerCase().includes(lowerSearch) ||
               (item.description && item.description.toLowerCase().includes(lowerSearch)) ||
               (item.assigned_to_name && item.assigned_to_name.toLowerCase().includes(lowerSearch)) ||
               (item.project_name && item.project_name.toLowerCase().includes(lowerSearch));
      }
      
      // For sprints
      if (item.sprint_name) {
        return item.sprint_name.toLowerCase().includes(lowerSearch) ||
               (item.project_name && item.project_name.toLowerCase().includes(lowerSearch)) ||
               (item.description && item.description.toLowerCase().includes(lowerSearch));
      }
      
      // For projects
      if (item.pname) {
        return item.pname.toLowerCase().includes(lowerSearch) ||
               (item.description && item.description.toLowerCase().includes(lowerSearch)) ||
               (item.team_lead_name && item.team_lead_name.toLowerCase().includes(lowerSearch));
      }
      
      return false;
    });
  };

  // Get filtered data for each tab
  const filteredTasks = filterData(completedTasks, search);
  const filteredSprints = filterData(completedSprints, search);
  const filteredProjects = filterData(completedProjects, search);

  const fetchHistoryData = async () => {
    setIsLoading(true);
    const token = JSON.parse(sessionStorage.getItem('loggedInUser'))?.token;
    
    if (!token) {
      console.error('No authentication token found');
      setIsLoading(false);
      return;
    }
    
    // Log current user data for debugging
    const userData = JSON.parse(sessionStorage.getItem('loggedInUser'));
    console.log('Current user data:', userData);
    
    try {
      // Fetch completed tasks
      const tasksRes = await fetch('http://localhost:3001/api/history/tasks', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        console.log('Tasks history data received:', tasksData);
        setCompletedTasks(tasksData);
      } else {
        console.error('Failed to fetch tasks:', tasksRes.status, tasksRes.statusText);
        const errorData = await tasksRes.json().catch(() => ({}));
        console.error('Tasks error details:', errorData);
      }

      // Fetch completed sprints
      const sprintsRes = await fetch('http://localhost:3001/api/history/sprints', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (sprintsRes.ok) {
        const sprintsData = await sprintsRes.json();
        setCompletedSprints(sprintsData);
      } else {
        console.error('Failed to fetch sprints:', sprintsRes.status, sprintsRes.statusText);
      }

      // Fetch completed projects
      const projectsRes = await fetch('http://localhost:3001/api/history/projects', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (projectsRes.ok) {
        const projectsData = await projectsRes.json();
        setCompletedProjects(projectsData);
      } else {
        console.error('Failed to fetch projects:', projectsRes.status, projectsRes.statusText);
      }
    } catch (err) {
      console.error('Error fetching history data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No date available';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      'completed': 'success',
      'finished': 'success',
      'done': 'success'
    };
    return `badge bg-${statusColors[status.toLowerCase()] || 'secondary'}`;
  };

  return (
    <div className="main-content-area">
      <div
        className="container-fluid w-100"
        style={{
          background: theme === 'dark' 
            ? 'linear-gradient(135deg, #0f1419 0%, #1a1f2e 50%, #181c24 100%)' 
            : 'linear-gradient(135deg, #f8faff 0%, #e3f2fd 50%, #f4f6fb 100%)',
          color: theme === 'dark' ? '#f8f8f8' : '#181c24',
          transition: 'all 0.3s ease',
          paddingTop: '30px',
          minHeight: '91vh',
        }}
      >
        <div className="p-3">
          <div className="row justify-content-center g-3">
            <div className="col-12">
              <div
                className="shadow-lg rounded-3 p-3 mb-3 border-0"
                style={{
                  background: theme === 'dark' 
                    ? 'linear-gradient(145deg, #23272f 0%, #2b2f36 100%)' 
                    : 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
                  color: theme === 'dark' ? '#f8f8f8' : '#181c24',
                  boxShadow: theme === 'dark' 
                    ? '0 15px 30px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)' 
                    : '0 15px 30px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8)',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease'
                }}
              >
                {/* Header */}
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="d-flex align-items-center">
                    <div className="project-icon me-2" style={{ fontSize: '1.2rem' }}>
                      <FaHistory />
                    </div>
                    <div>
                      <h2 className="mb-1 fw-bold" style={{ fontSize: '1.7rem' }}>
                        History
                      </h2>
                      <p className="text-muted mb-0" style={{ fontSize: '1rem' }}>
                        {search ? `Searching for: "${search}"` : 'View completed tasks, sprints, and projects'}
                      </p>
                    </div>
                  </div>
                  {search && (
                    <button
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => setSearch('')}
                      style={{ fontSize: '0.8rem' }}
                    >
                      Clear Search
                    </button>
                  )}
                </div>

                {/* Tabs */}
                <ul className="nav nav-tabs mb-3" style={{ fontSize: '0.85rem' }}>
                  <li className="nav-item">
                    <button
                      className={`nav-link ${activeTab === 'tasks' ? 'active' : ''}`}
                      onClick={() => setActiveTab('tasks')}
                      style={{ padding: '0.5rem 1rem', fontSize: '1rem' }}
                    >
                      <FaTasks className="me-1" />
                      Completed Tasks ({filteredTasks.length})
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      className={`nav-link ${activeTab === 'sprints' ? 'active' : ''}`}
                      onClick={() => setActiveTab('sprints')}
                      style={{ padding: '0.5rem 1rem', fontSize: '1rem' }}
                    >
                      <FaRocket className="me-1" />
                      Completed Sprints ({filteredSprints.length})
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      className={`nav-link ${activeTab === 'projects' ? 'active' : ''}`}
                      onClick={() => setActiveTab('projects')}
                      style={{ padding: '0.5rem 1rem', fontSize: '1rem' }}
                    >
                      <FaProjectDiagram className="me-1" />
                      Completed Projects ({filteredProjects.length})
                    </button>
                  </li>
                </ul>

                {/* Content */}
                {isLoading ? (
                  <div className="text-center">
                    <div className="spinner-border" role="status" style={{ width: '1.5rem', height: '1.5rem' }}>
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : (
                  <div className="tab-content">
                    {/* Completed Tasks Tab */}
                    {activeTab === 'tasks' && (
                      <div className="tab-pane fade show active">
                        {filteredTasks.length === 0 ? (
                          <div className="text-center py-4">
                            <FaTasks size={36} className="text-muted mb-2" />
                            <h5 style={{ fontSize: '1.1rem' }}>
                              {search ? 'No tasks found matching your search' : 'No completed tasks yet'}
                            </h5>
                            <p className="text-muted" style={{ fontSize: '0.8rem' }}>
                              {search ? 'Try adjusting your search terms' : 'Completed tasks will appear here'}
                            </p>
                          </div>
                        ) : (
                          <div className="row g-3">
                            {filteredTasks.map((task) => (
                              <div key={task.task_id} className="col-12 col-sm-6 col-lg-4 col-xl-3">
                                <div className="card h-100 shadow-sm border-0 backlog-card themed-card"
                                  style={{
                                    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1), background 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    cursor: 'pointer',
                                    willChange: 'transform, box-shadow, background',
                                    background: theme === 'dark' 
                                      ? 'linear-gradient(145deg, #2b2f36 0%, #343a40 100%)' 
                                      : 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                    e.currentTarget.style.boxShadow = theme === 'dark' 
                                      ? '0 15px 30px rgba(0,0,0,0.4)' 
                                      : '0 15px 30px rgba(0,0,0,0.15)';
                                    e.currentTarget.style.background = theme === 'dark' 
                                      ? 'linear-gradient(145deg, #343a40 0%, #3d4248 100%)' 
                                      : 'linear-gradient(145deg, #f8f9fa 0%, #e9ecef 100%)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = theme === 'dark' 
                                      ? '0 4px 20px rgba(0,0,0,0.3)' 
                                      : '0 4px 20px rgba(0,0,0,0.08)';
                                    e.currentTarget.style.background = theme === 'dark' 
                                      ? 'linear-gradient(145deg, #2b2f36 0%, #343a40 100%)' 
                                      : 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)';
                                  }}
                                >
                                  <div className="card-body p-3">
                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                      <h6 className="card-title mb-0 fw-bold" style={{ fontSize: '1.2rem' }}>
                                        {task.title || 'Untitled Task'}
                                      </h6>
                                      <div className="text-end" style={{ marginRight: '8px' }}>
                                        <small className="text-muted d-block" style={{ fontSize: '0.75rem', marginBottom: '2px' }}>Status:</small>
                                        <span className={getStatusBadge(task.status)} style={{
                                          fontSize: '0.85rem',
                                          fontWeight: '1000',
                                          padding: '0.25rem 0.5rem'
                                        }}>
                                          {task.status || 'Unknown'}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="mb-3">
                                      <small className="text-muted d-block" style={{ fontSize: '0.75rem', fontWeight: '500', marginBottom: '4px' }}>Description</small>
                                      <p className="card-text text-muted mb-0" style={{
                                        fontSize: '0.95rem',
                                        lineHeight: '1.5',
                                        opacity: '0.8'
                                      }}>
                                        {task.description || 'No description available'}
                                      </p>
                                    </div>
                                    <div className="mt-auto">
                                      <div className="row g-1 mb-1">
                                        <div className="col-6">
                                        <small className="text-muted d-block" style={{ fontSize: '0.95rem' }}>Assigned to:</small>
                                        <span className="small" style={{ fontSize: '0.9rem' }}>
                                            {task.assigned_to_name || task.assigned_to || 'Unassigned'}
                                          </span>
                                        </div>
                                        <div className="col-6">
                                          <small className="text-muted d-block" style={{ fontSize: '0.95rem' }}>Completed:</small>
                                          <span className="small" style={{ fontSize: '0.9rem' }}>
                                            {formatDate(task.completed_at)}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Completed Sprints Tab */}
                    {activeTab === 'sprints' && (
                      <div className="tab-pane fade show active">
                        {filteredSprints.length === 0 ? (
                          <div className="text-center py-4">
                            <FaRocket size={36} className="text-muted mb-2" />
                            <h5 style={{ fontSize: '1.1rem' }}>
                              {search ? 'No sprints found matching your search' : 'No completed sprints yet'}
                            </h5>
                            <p className="text-muted" style={{ fontSize: '0.8rem' }}>
                              {search ? 'Try adjusting your search terms' : 'Completed sprints will appear here'}
                            </p>
                          </div>
                        ) : (
                          <div className="row g-3">
                            {filteredSprints.map((sprint) => (
                              <div key={sprint.sprint_id} className="col-12 col-sm-6 col-lg-4 col-xl-3">
                                <div className="card h-100 shadow-sm border-0 backlog-card themed-card"
                                  style={{
                                    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1), background 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    cursor: 'pointer',
                                    willChange: 'transform, box-shadow, background',
                                    background: theme === 'dark' 
                                      ? 'linear-gradient(145deg, #2b2f36 0%, #343a40 100%)' 
                                      : 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                    e.currentTarget.style.boxShadow = theme === 'dark' 
                                      ? '0 15px 30px rgba(0,0,0,0.4)' 
                                      : '0 15px 30px rgba(0,0,0,0.15)';
                                    e.currentTarget.style.background = theme === 'dark' 
                                      ? 'linear-gradient(145deg, #343a40 0%, #3d4248 100%)' 
                                      : 'linear-gradient(145deg, #f8f9fa 0%, #e9ecef 100%)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = theme === 'dark' 
                                      ? '0 4px 20px rgba(0,0,0,0.3)' 
                                      : '0 4px 20px rgba(0,0,0,0.08)';
                                    e.currentTarget.style.background = theme === 'dark' 
                                      ? 'linear-gradient(145deg, #2b2f36 0%, #343a40 100%)' 
                                      : 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)';
                                  }}
                                >
                                  <div className="card-body p-3">
                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                      <h6 className="card-title mb-0 fw-bold" style={{ fontSize: '1.2rem' }}>
                                        {sprint.sprint_name || 'Untitled Sprint'}
                                      </h6>
                                      <div className="text-end" style={{ marginRight: '8px' }}>
                                        <small className="text-muted d-block" style={{ fontSize: '0.75rem', marginBottom: '2px' }}>Status:</small>
                                        <span className={getStatusBadge(sprint.status)} style={{
                                          fontSize: '0.85rem',
                                          fontWeight: '1000',
                                          padding: '0.25rem 0.5rem'
                                        }}>
                                          {sprint.status || 'Unknown'}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="mb-3">
                                      <small className="text-muted d-block" style={{ fontSize: '0.75rem', fontWeight: '500', marginBottom: '4px' }}>Description</small>
                                      <p className="card-text text-muted mb-0" style={{
                                        fontSize: '0.95rem',
                                        lineHeight: '1.5',
                                        opacity: '0.8'
                                      }}>
                                        {sprint.start_date && sprint.end_date 
                                          ? `${new Date(sprint.start_date).toLocaleDateString()} - ${new Date(sprint.end_date).toLocaleDateString()}`
                                          : 'No date range specified'
                                        }
                                      </p>
                                    </div>
                                    <div className="mt-auto">
                                      <div className="row g-1 mb-1">
                                        <div className="col-6">
                                          <small className="text-muted d-block" style={{ fontSize: '0.95rem' }}>Project:</small>
                                          <span className="small" style={{ fontSize: '0.9rem' }}>
                                            {sprint.project_name || 'Unknown Project'}
                                          </span>
                                        </div>
                                        <div className="col-6">
                                          <small className="text-muted d-block" style={{ fontSize: '0.95rem' }}>Completed:</small>
                                          <span className="small" style={{ fontSize: '0.9rem' }}>
                                            {formatDate(sprint.completed_at)}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Completed Projects Tab */}
                    {activeTab === 'projects' && (
                      <div className="tab-pane fade show active">
                        {filteredProjects.length === 0 ? (
                          <div className="text-center py-4">
                            <FaProjectDiagram size={36} className="text-muted mb-2" />
                            <h5 style={{ fontSize: '1.1rem' }}>
                              {search ? 'No projects found matching your search' : 'No completed projects yet'}
                            </h5>
                            <p className="text-muted" style={{ fontSize: '0.8rem' }}>
                              {search ? 'Try adjusting your search terms' : 'Completed projects will appear here'}
                            </p>
                          </div>
                        ) : (
                          <div className="row g-3">
                            {filteredProjects.map((project) => (
                              <div key={project.project_id} className="col-12 col-sm-6 col-lg-4 col-xl-3">
                                <div className="card h-100 shadow-sm border-0 backlog-card themed-card"
                                  style={{
                                    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1), background 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    cursor: 'pointer',
                                    willChange: 'transform, box-shadow, background',
                                    background: theme === 'dark' 
                                      ? 'linear-gradient(145deg, #2b2f36 0%, #343a40 100%)' 
                                      : 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                    e.currentTarget.style.boxShadow = theme === 'dark' 
                                      ? '0 15px 30px rgba(0,0,0,0.4)' 
                                      : '0 15px 30px rgba(0,0,0,0.15)';
                                    e.currentTarget.style.background = theme === 'dark' 
                                      ? 'linear-gradient(145deg, #343a40 0%, #3d4248 100%)' 
                                      : 'linear-gradient(145deg, #f8f9fa 0%, #e9ecef 100%)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = theme === 'dark' 
                                      ? '0 4px 20px rgba(0,0,0,0.3)' 
                                      : '0 4px 20px rgba(0,0,0,0.08)';
                                    e.currentTarget.style.background = theme === 'dark' 
                                      ? 'linear-gradient(145deg, #2b2f36 0%, #343a40 100%)' 
                                      : 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)';
                                  }}
                                >
                                  <div className="card-body p-3">
                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                      <h6 className="card-title mb-0 fw-bold" style={{ fontSize: '1.2rem' }}>
                                        {project.pname || 'Untitled Project'}
                                      </h6>
                                      <div className="text-end" style={{ marginRight: '8px' }}>
                                        <small className="text-muted d-block" style={{ fontSize: '0.75rem', marginBottom: '2px' }}>Status:</small>
                                        <span className={getStatusBadge(project.status)} style={{
                                          fontSize: '0.85rem',
                                          fontWeight: '1000',
                                          padding: '0.25rem 0.5rem'
                                        }}>
                                          {project.status || 'Unknown'}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="mb-3">
                                      <small className="text-muted d-block" style={{ fontSize: '0.75rem', fontWeight: '500', marginBottom: '4px' }}>Description</small>
                                      <p className="card-text text-muted mb-0" style={{
                                        fontSize: '0.95rem',
                                        lineHeight: '1.5',
                                        opacity: '0.8'
                                      }}>
                                        {project.description || 'No description available'}
                                      </p>
                                    </div>
                                    <div className="mt-auto">
                                      <div className="row g-1 mb-2">
                                        <div className="col-6">
                                          <small className="text-muted d-block" style={{ fontSize: '0.95rem' }}>Team Lead{project.team_lead_name && project.team_lead_name.includes(',') ? 's' : ''}:</small>
                                          <span className="small" style={{ fontSize: '0.9rem' }}>
                                            {project.team_lead_name || 'Unassigned'}
                                          </span>
                                        </div>
                                        <div className="col-6">
                                          <small className="text-muted d-block" style={{ fontSize: '0.95rem' }}>Completed:</small>
                                          <span className="small" style={{ fontSize: '0.9rem' }}>
                                            {formatDate(project.completed_at)}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HistoryPage; 