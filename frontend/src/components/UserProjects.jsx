import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import toast, { Toaster } from 'react-hot-toast';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

import { ProjectSearchContext } from './Navbar';
import { Modal, Button } from 'react-bootstrap';

function UserProjects() {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const data = useSelector((state) => state.login.user);
  const theme = useSelector((state) => state.theme.mode);

  const navigate = useNavigate();
  const { search, setSearch } = useContext(ProjectSearchContext);
  const [showTeamModal, setShowTeamModal] = useState(false);
  // Change teamLead to teamLeads (array)
  const [teamLeads, setTeamLeads] = useState([{ name: '', email: '', password: '' }]);
  const [developers, setDevelopers] = useState([{ name: '', email: '', password: '', specialization: '', teamLeadIdx: 0 }]);
  const [showBacklogModal, setShowBacklogModal] = useState(false);
  const [backlogItems, setBacklogItems] = useState([]);
  const [newBacklog, setNewBacklog] = useState({ title: '', description: '' });
  const [showSprintModal, setShowSprintModal] = useState(false);
  const [sprintDesc, setSprintDesc] = useState('');
  const [selectedBacklog, setSelectedBacklog] = useState(null);
  const [showSprintsModal, setShowSprintsModal] = useState(false);
  const [sprints, setSprints] = useState([]);
  const [editSprintModal, setEditSprintModal] = useState(false);
  const [editSprint, setEditSprint] = useState(null);
  const [showTasksModal, setShowTasksModal] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [selectedSprint, setSelectedSprint] = useState(null);
  const [newTask, setNewTask] = useState({ title: '', description: '', assigned_to: '' });
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '', completion_date: '' });

  // Open modal and prefill with current team if present
  const openTeamModal = (project) => {
    setShowTeamModal(true);
    // Support multiple team leads
    setTeamLeads(
      Array.isArray(project.team_leads) && project.team_leads.length > 0
        ? project.team_leads.map(tl => ({ name: tl.name, email: tl.email, password: '' }))
        : [{ name: '', email: '', password: '' }]
    );
    setDevelopers(
      Array.isArray(project.developers) && project.developers.length > 0
        ? project.developers.map(d => ({ name: d.name, email: d.email, password: '', specialization: d.specialization || '', teamLeadIdx: 0 }))
        : [{ name: '', email: '', password: '', specialization: '', teamLeadIdx: 0 }]
    );
  };
  const closeTeamModal = () => setShowTeamModal(false);

  const handleTeamLeadChange = (idx, field, value) => {
    setTeamLeads(prev => prev.map((tl, i) => i === idx ? { ...tl, [field]: value } : tl));
  };
  const handleDevChange = (idx, field, value) => {
    setDevelopers(prev => prev.map((dev, i) => i === idx ? { ...dev, [field]: value } : dev));
  };
  const handleDevTeamLeadChange = (idx, value) => {
    setDevelopers(prev => prev.map((dev, i) => i === idx ? { ...dev, teamLeadIdx: value } : dev));
  };
  const addDeveloper = () => setDevelopers(prev => [...prev, { name: '', email: '', password: '', specialization: '', teamLeadIdx: 0 }]);
  const removeDeveloper = (idx) => setDevelopers(prev => prev.filter((_, i) => i !== idx));
  const addTeamLead = () => setTeamLeads(prev => [...prev, { name: '', email: '', password: '' }]);
  const removeTeamLead = (idx) => setTeamLeads(prev => prev.filter((_, i) => i !== idx));

  // Open backlog modal for a project
  const openBacklogModal = async (project) => {
    setShowBacklogModal(true);
    setSelectedBacklog(null);
    setNewBacklog({ title: '', description: '' });
    // Fetch backlog items from backend
    const token = JSON.parse(sessionStorage.getItem('loggedInUser'))?.token;
    try {
      const res = await fetch(`http://localhost:3001/api/projects/${project.project_id || project.pid}/backlogs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setBacklogItems(Array.isArray(data) ? data : []);
      setSelectedProjectId(project.project_id || project.pid);
    } catch (err) {
      setBacklogItems([]);
    }
  };
  const closeBacklogModal = () => setShowBacklogModal(false);

  // Track which project is being managed for backlog
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  const handleAddBacklog = async () => {
    if (!newBacklog.title || !selectedProjectId) return;
    const token = JSON.parse(sessionStorage.getItem('loggedInUser'))?.token;
    try {
      const res = await fetch(`http://localhost:3001/api/projects/${selectedProjectId}/backlogs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newBacklog)
      });
      if (res.ok) {
        setNewBacklog({ title: '', description: '' });
        // Refresh backlog list
        const updated = await fetch(`http://localhost:3001/api/projects/${selectedProjectId}/backlogs`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const updatedData = await updated.json();
        setBacklogItems(Array.isArray(updatedData) ? updatedData : []);
      }
    } catch (err) {
      setBacklogItems([]);
    }
  };

  const openSprintModal = (backlog) => {
    setSelectedBacklog(backlog);
    setSprintDesc('');
    setShowSprintModal(true);
  };
  const closeSprintModal = () => setShowSprintModal(false);
  const handleAddToSprint = async () => {
    if (!selectedProjectId || !selectedBacklog) return;
    const token = JSON.parse(sessionStorage.getItem('loggedInUser'))?.token;
    try {
      const res = await fetch(`http://localhost:3001/api/projects/${selectedProjectId}/backlogs/${selectedBacklog.backlog_id || selectedBacklog.id}/add-to-sprint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ sprintDescription: sprintDesc })
      });
      if (res.ok) {
        // Refresh backlog list
        const updated = await fetch(`http://localhost:3001/api/projects/${selectedProjectId}/backlogs`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const updatedData = await updated.json();
        setBacklogItems(Array.isArray(updatedData) ? updatedData : []);
      }
    } catch (err) {
      setBacklogItems([]);
    }
    setShowSprintModal(false);
  };

  // Open sprints modal for a project
  const openSprintsModal = async (project) => {
    setShowSprintsModal(true);
    // Fetch sprints from backend
    const token = JSON.parse(sessionStorage.getItem('loggedInUser'))?.token;
    try {
      const res = await fetch(`http://localhost:3001/api/projects/${project.project_id || project.pid}/sprints`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setSprints(Array.isArray(data) ? data : []);
    } catch (err) {
      setSprints([]);
    }
  };
  const closeSprintsModal = () => setShowSprintsModal(false);
  const closeEditSprintModal = () => setEditSprintModal(false);

  // Open tasks modal for a sprint
  const openTasksModal = async (sprint, project) => {
    setShowTasksModal(true);
    setSelectedSprint(sprint);
    setNewTask({ title: '', description: '', assigned_to: '' });
    // Fetch tasks for this sprint
    const token = JSON.parse(sessionStorage.getItem('loggedInUser'))?.token;
    try {
      const res = await fetch(`http://localhost:3001/api/sprints/${sprint.sprint_id}/tasks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setTasks(Array.isArray(data) ? data : []);
      setSelectedProjectForTasks(project);
    } catch (err) {
      setTasks([]);
    }
  };
  const closeTasksModal = () => setShowTasksModal(false);
  const [selectedProjectForTasks, setSelectedProjectForTasks] = useState(null);

  // Add task (team lead)
  const handleAddTask = async () => {
    if (!newTask.title || !newTask.assigned_to || !selectedSprint) return;
    const token = JSON.parse(sessionStorage.getItem('loggedInUser'))?.token;
    try {
      const res = await fetch(`http://localhost:3001/api/sprints/${selectedSprint.sprint_id}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newTask)
      });
      if (res.ok) {
        setNewTask({ title: '', description: '', assigned_to: '' });
        // Refresh tasks
        const updated = await fetch(`http://localhost:3001/api/sprints/${selectedSprint.sprint_id}/tasks`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTasks(await updated.json());
      }
    } catch (err) {}
  };

  // Update task status (developer)
  const handleUpdateTaskStatus = async (taskId, status) => {
    const token = JSON.parse(sessionStorage.getItem('loggedInUser'))?.token;
    try {
      await fetch(`http://localhost:3001/api/tasks/${taskId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      // Refresh tasks
      if (selectedSprint) {
        const updated = await fetch(`http://localhost:3001/api/sprints/${selectedSprint.sprint_id}/tasks`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTasks(await updated.json());
      }
    } catch (err) {}
  };

  useEffect(() => {
    document.body.classList.toggle('dark', theme === 'dark');

    if (!data?.id) return;

    const token = JSON.parse(sessionStorage.getItem('loggedInUser'))?.token;
    setIsLoading(true);

    fetch(`http://localhost:3001/api/projects`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then((res) => res.json())
      .then((projects) => {
        console.log('Fetched projects from backend:', projects); // <-- Add this line
        setProjects(projects);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching projects:', err);
        setIsLoading(false);
      });

    // Reset search on unmount
    return () => setSearch("");
  }, [data?.id, theme, setSearch]);

  const handleDelete = async (pid) => {
    const token = JSON.parse(sessionStorage.getItem('loggedInUser'))?.token;

    if (!window.confirm("Are you sure you want to delete this project?")) return;

    try {
      const response = await fetch(`http://localhost:3001/api/users/projects/${pid}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete project');
      }

      setProjects(projects.filter(project => (project.project_id || project.pid) !== pid));
      
      // Show success message with information about freed team members
      if (data.teamLeads > 0 || data.developers > 0) {
      } else {
        toast.success('Project deleted successfully');
      }
    } catch (err) {
      console.error('Error deleting project:', err);
      toast.error(err.message || 'Failed to delete project. Please try again.');
    }
  };

  const handleCompleteProject = async (projectId) => {
    if (window.confirm('Are you sure you want to mark this project as completed? This action cannot be undone.')) {
      const token = JSON.parse(sessionStorage.getItem('loggedInUser'))?.token;
      try {
        const res = await fetch(`http://localhost:3001/api/projects/${projectId}/complete`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          
          // Show success message with information about freed team members
          if (data.teamLeads > 0 || data.developers > 0) {
          } else {
            toast.success('Project marked as completed!');
          }
          
          fetchProjects(); // Refresh the projects list
        } else {
          const data = await res.json();
          toast.error(data.message || 'Failed to complete project');
        }
      } catch (err) {
        toast.error('Error completing project');
      }
    }
  };

  const handleSaveTeam = async () => {
    const token = JSON.parse(sessionStorage.getItem('loggedInUser'))?.token;
    if (!token) {
      alert('Authentication required');
      return;
    }

    try {
      // Validate required fields
      const validTeamLeads = teamLeads.filter(tl => tl.name && tl.email);
      const validDevelopers = developers.filter(dev => dev.name && dev.email && dev.specialization);
      
      if (validTeamLeads.length === 0) {
        alert('At least one team lead is required');
        return;
      }

      if (validDevelopers.length === 0) {
        alert('At least one developer is required');
        return;
      }

      // Prepare team data
      const teamData = {
        team_leads: validTeamLeads.map(tl => ({
          name: tl.name,
          email: tl.email,
          password: tl.password || undefined // Only include if provided
        })),
        developers: validDevelopers.map(dev => ({
          name: dev.name,
          email: dev.email,
          password: dev.password || undefined,
          specialization: dev.specialization,
          team_lead_id: validTeamLeads[dev.teamLeadIdx]?.email // Reference by email
        }))
      };

      // Save team data to backend
      const res = await fetch('http://localhost:3001/api/projects/team', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(teamData)
      });

      if (res.ok) {
        alert('Team saved successfully!');
        closeTeamModal();
        fetchProjects(); // Refresh projects to show updated team info
      } else {
        const errorData = await res.json();
        alert(errorData.message || 'Failed to save team');
      }
    } catch (err) {
      console.error('Error saving team:', err);
      alert('Error saving team data');
    }
  };

  const fetchProjects = async () => {
    setIsLoading(true);
    const token = JSON.parse(sessionStorage.getItem('loggedInUser'))?.token;
    try {
      const res = await fetch('http://localhost:3001/api/projects', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Additional frontend filtering to ensure completed projects are not shown
        const activeProjects = data.filter(project => project.status !== 'completed');
        setProjects(activeProjects);
      } else {
        console.error('Failed to fetch projects');
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // If project manager, only show their assigned project (should be one)
  let displayProjects = projects;
  // if (data?.role === 'project_manager') {
  //   // Show all projects created by this project manager
  //   displayProjects = projects.filter(
  //     p => p.created_by === data.id || p.created_by === data.user_id
  //   );
  // }

  // Filtered projects based on search from navbar
  const filteredProjects = displayProjects.filter((project) => {
    const searchLower = search.toLowerCase();
    // Project name
    if (project.name && project.name.toLowerCase().includes(searchLower)) return true;
    // Team lead
    if (project.team_lead && project.team_lead.name && project.team_lead.name.toLowerCase().includes(searchLower)) return true;
    if (project.team_lead && project.team_lead.email && project.team_lead.email.toLowerCase().includes(searchLower)) return true;
    // Developers
    if (project.developers && project.developers.some(dev =>
      (dev.name && dev.name.toLowerCase().includes(searchLower)) ||
      (dev.email && dev.email.toLowerCase().includes(searchLower)) ||
      (dev.specialization && dev.specialization.toLowerCase().includes(searchLower))
    )) return true;
    return false;
  });

  return (
    <div className="main-content-area">
      <div
        className="container-fluid w-100 user-projects-root"
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
                <div className="text-center mb-3">
                  <h2 className="fw-bold mb-1" style={{
                    fontSize: '2rem',
                    color: theme === 'dark' ? '#f8f8f8' : '#181c24',
                  }}>
                    Your Projects
                  </h2>
                  <p className="text-muted mb-0" style={{ fontSize: '1.2rem' }}>All your projects at a glance</p>
                </div>
                
                {/* Create Project Button */}
                {data?.role === 'project_manager' && (
                  <div className="text-center mb-3">
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => setShowCreateProjectModal(true)}
                      style={{ 
                        fontSize: '0.95rem', 
                        padding: '0.5rem 1rem',
                        borderRadius: '20px'
                      }}
                    >
                      <i className="fas fa-plus me-2"></i>
                      Create New Project
                    </button>
                  </div>
                )}
                {isLoading ? (
                  <div className="text-center p-4">
                    <div className="d-flex flex-column align-items-center">
                      <div className="spinner-border text-primary mb-2" style={{ width: '1.5rem', height: '1.5rem' }} role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <h6 className="text-muted" style={{ fontSize: '0.9rem' }}>Loading projects...</h6>
                    </div>
                  </div>
                ) : filteredProjects.length === 0 ? (
                  <div className="text-center p-4">
                    <div className="mb-3">
                      <i className="fas fa-inbox" style={{ fontSize: '2rem', color: '#6c757d' }}></i>
                    </div>
                    <h5 className="text-muted mb-2" style={{ fontSize: '1.2rem' }}>No projects found</h5>
                    <p className="text-muted mb-3" style={{ fontSize: '0.9rem' }}>
                      Start by creating your first project to get started.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="row g-3">
                      {filteredProjects.map((project, projectIdx) => {
                        // Debug prints for developers and team_leads
                        console.log('Project:', project);
                        return (
                          <div
                            key={project.pid || projectIdx}
                            className="col-12 col-sm-6 col-lg-4 col-xl-3"
                          >
                            <div
                              className="card h-100 shadow-sm border-0 backlog-card"
                              style={{
                                background: theme === 'dark' 
                                  ? 'linear-gradient(145deg, #2b2f36 0%, #343a40 100%)' 
                                  : 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
                                borderRadius: '12px',
                                transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1), background 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                cursor: 'pointer',
                                willChange: 'transform, box-shadow, background'
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
                                    <h6 className="card-title mb-0 fw-bold" style={{ 
                                      fontSize: '1.2rem',
                                      color: theme === 'dark' ? '#f8f8f8' : '#181c24'
                                    }}>
                                      {project.pname || project.name}
                                    </h6>
                                    <div className="text-end" style={{ marginRight: '8px' }}>
                                      <small className="text-muted d-block" style={{ fontSize: '0.75rem', marginBottom: '2px' }}>Status:</small>
                                      <span className={`badge rounded-pill px-2 py-1 ${
                                        project.status === 'completed' ? 'bg-success' :
                                        project.status === 'active' ? 'bg-primary' :
                                        project.status === 'on_hold' ? 'bg-warning' :
                                        'bg-secondary'
                                      }`} style={{
                                        fontSize: '0.85rem',
                                        fontWeight: '1000',
                                        padding: '0.25rem 0.5rem'
                                      }}>
                                        {project.status || 'Active'}
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
                                      {project.description || 'No description provided'}
                                    </p>
                                  </div>
                                
                                <div className="mt-auto">
                                  <div className="row g-1 mb-2">
                                    <div className="col-6">
                                    <small className="text-muted d-block" style={{ fontSize: '1rem' }}>Team Lead:</small>
                                    <span className="small" style={{ fontSize: '0.9rem' }}>
                                        {(() => {
                                          if (project.team_lead_name) {
                                            return project.team_lead_name;
                                          } else if (project.team_lead && project.team_lead.name) {
                                            return project.team_lead.name;
                                          } else if (project.team_leads && project.team_leads.length > 0) {
                                            return project.team_leads.map(tl => tl.name).join(', ');
                                          } else {
                                            return 'Unassigned';
                                          }
                                        })()}
                                      </span>
                                    </div>
                                    <div className="col-6">
                                    <small className="text-muted d-block" style={{ fontSize: '1rem' }}>Created:</small>
                                    <span className="small" style={{ fontSize: '0.9rem' }}>
                                        {project.created_at ? new Date(project.created_at).toLocaleDateString() : 'N/A'}
                                      </span>
                                    </div>
                                  </div>
                                  
                                  {data?.role === 'project_manager' && (
                                    <div className="mb-2">
                                      <div className="d-flex justify-content-between align-items-center">
                                        <button
                                          className="btn btn-outline-info btn-sm me-1"
                                          style={{ fontSize: '0.9rem', padding: '0.25rem 0.5rem' }}
                                          onClick={() => navigate(`/manage-project-team/${project.project_id || project.pid}`)}
                                        >
                                          Manage
                                        </button>
                                        <button
                                          className="btn btn-outline-success btn-sm me-1"
                                          style={{ fontSize: '0.9rem', padding: '0.25rem 0.5rem' }}
                                          onClick={() => handleCompleteProject(project.project_id || project.pid)}
                                        >
                                          Complete
                                        </button>
                                        <button
                                          className="btn btn-outline-danger btn-sm"
                                          style={{ fontSize: '0.9rem', padding: '0.25rem 0.5rem' }}
                                          onClick={() => handleDelete(project.project_id || project.pid)}
                                        >
                                          Delete
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Inline Styles */}
        <style>{`
          :root {
            --input-bg: #fff;
            --input-color: #212529;
            --input-border: #ced4da;
            --input-focus: #86b7fe;
            --placeholder-color: #6c757d;
            --card-bg: #fff;
            --card-text: #212529;
          }

          body.dark {
            --input-bg: #2c3039;
            --input-color: #f1f1f1;
            --input-border: #495057;
            --input-focus: #5c9eff;
            --placeholder-color: #adb5bd;
            --card-bg: #2b2f36;
            --card-text: #f1f1f1;
          }

          .themed-card {
            background-color: var(--card-bg) !important;
            color: var(--card-text) !important;
          }

          .themed-card .list-group-item {
            background-color: var(--card-bg) !important;
            color: var(--card-text) !important;
            border-color: var(--input-border) !important;
          }

          .form-control,
          .form-select {
            background-color: var(--input-bg);
            color: var(--input-color);
            border: 1px solid var(--input-border);
            border-radius: 12px;
            padding: 12px 16px;
            font-size: 0.95rem;
            transition: all 0.3s ease;
          }

          .form-control::placeholder {
            color: var(--placeholder-color);
          }

          .form-control:focus,
          .form-select:focus {
            border-color: var(--input-focus);
            box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
            transform: translateY(-2px);
          }

          .btn {
            border-radius: 12px;
            font-weight: 500;
            transition: all 0.3s ease;
            border: none;
          }

          .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.15);
          }

          .btn-primary {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
          }

          .btn-danger {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3);
          }

          .btn-success {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
          }

          .backlog-card {
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            animation: fadeInUp 0.6s ease forwards;
          }

          .project-header {
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
          }

          .modal-content {
            border-radius: 20px;
            border: none;
            backdrop-filter: blur(20px);
          }

          .modal-header {
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 20px 20px 0 0;
          }

          .modal-footer {
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 0 0 20px 20px;
          }

          .spinner-border {
            border-width: 3px;
          }

          html, body {
            max-width: 100%;
            overflow-x: hidden;
          }

          .row {
            margin-right: 0;
            margin-left: 0;
          }

          /* Custom scrollbar */
          ::-webkit-scrollbar {
            width: 8px;
          }

          ::-webkit-scrollbar-track {
            background: transparent;
          }

          ::-webkit-scrollbar-thumb {
            background: rgba(0,0,0,0.2);
            border-radius: 10px;
          }

          body.dark ::-webkit-scrollbar-thumb {
            background: rgba(255,255,255,0.2);
          }

          /* Animation for cards */
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .backlog-card:nth-child(1) { animation-delay: 0.1s; }
          .backlog-card:nth-child(2) { animation-delay: 0.2s; }
          .backlog-card:nth-child(3) { animation-delay: 0.3s; }
          .backlog-card:nth-child(4) { animation-delay: 0.4s; }
          .backlog-card:nth-child(5) { animation-delay: 0.5s; }
          .backlog-card:nth-child(6) { animation-delay: 0.6s; }
        `}</style>
        {/* End Enhanced Inline Styles */}
      </div>

      {/* Team Management Modal */}
      <Modal show={showTeamModal} onHide={closeTeamModal} size="lg" centered>
        <Modal.Header closeButton className={theme === 'dark' ? 'dark-modal-header' : 'light-modal-header'}>
          <Modal.Title style={{ fontSize: '1.1rem' }}>Manage Team</Modal.Title>
        </Modal.Header>
        <Modal.Body className={theme === 'dark' ? 'dark-modal-body' : 'light-modal-body'} style={{ padding: '1rem' }}>
          <h6 className="mb-2" style={{ color: theme === 'dark' ? '#ffffff' : '#212529', fontSize: '0.9rem', fontWeight: '600' }}>Current Team Leads</h6>
          <div className="mb-3 p-2 themed-card" style={{ 
            borderRadius: '8px', 
            border: theme === 'dark' ? '1px solid #404040' : '1px solid #dee2e6',
            backgroundColor: theme === 'dark' ? '#1e1e1e' : '#ffffff',
            color: theme === 'dark' ? '#ffffff' : '#212529',
            boxShadow: theme === 'dark' ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            {teamLeads.map((tl, idx) => (
              <div className="row g-1 mb-1" key={idx}>
                <div className="col-md-4">
                  <input 
                    type="text" 
                    className="form-control themed-input" 
                    placeholder="Name" 
                    value={tl.name} 
                    onChange={e => handleTeamLeadChange(idx, 'name', e.target.value)} 
                    required 
                    style={{ fontSize: '0.8rem', padding: '0.5rem' }}
                  />
                </div>
                <div className="col-md-4">
                  <input 
                    type="email" 
                    className="form-control themed-input" 
                    placeholder="Email" 
                    value={tl.email} 
                    onChange={e => handleTeamLeadChange(idx, 'email', e.target.value)} 
                    required 
                    style={{ fontSize: '0.8rem', padding: '0.5rem' }}
                  />
                </div>
                <div className="col-md-3">
                  <input 
                    type="password" 
                    className="form-control themed-input" 
                    placeholder="Password (leave blank to keep)" 
                    value={tl.password} 
                    onChange={e => handleTeamLeadChange(idx, 'password', e.target.value)} 
                    style={{ fontSize: '0.8rem', padding: '0.5rem' }}
                  />
                </div>
                <div className="col-md-1 d-flex align-items-center">
                  {teamLeads.length > 1 && (
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => removeTeamLead(idx)} style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}>Remove</button>
                  )}
                </div>
              </div>
            ))}
            <button type="button" className="btn btn-secondary btn-sm mt-2" onClick={addTeamLead} style={{ fontSize: '0.8rem' }}>Add Team Lead</button>
          </div>
          
          <h6 className="mb-2" style={{ color: theme === 'dark' ? '#ffffff' : '#212529', fontSize: '0.9rem', fontWeight: '600' }}>Current Developers</h6>
          <div className="mb-3 p-2 themed-card" style={{ 
            borderRadius: '8px', 
            border: theme === 'dark' ? '1px solid #404040' : '1px solid #dee2e6',
            backgroundColor: theme === 'dark' ? '#1e1e1e' : '#ffffff',
            color: theme === 'dark' ? '#ffffff' : '#212529',
            boxShadow: theme === 'dark' ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            {developers.map((dev, idx) => (
              <div className="row g-1 mb-1" key={idx}>
                <div className="col-md-3">
                  <input 
                    type="text" 
                    className="form-control themed-input" 
                    placeholder="Name" 
                    value={dev.name} 
                    onChange={e => handleDevChange(idx, 'name', e.target.value)} 
                    required 
                    style={{ fontSize: '0.8rem', padding: '0.5rem' }}
                  />
                </div>
                <div className="col-md-3">
                  <input 
                    type="email" 
                    className="form-control themed-input" 
                    placeholder="Email" 
                    value={dev.email} 
                    onChange={e => handleDevChange(idx, 'email', e.target.value)} 
                    required 
                    style={{ fontSize: '0.8rem', padding: '0.5rem' }}
                  />
                </div>
                <div className="col-md-2">
                  <input 
                    type="password" 
                    className="form-control themed-input" 
                    placeholder="Password (leave blank to keep)" 
                    value={dev.password} 
                    onChange={e => handleDevChange(idx, 'password', e.target.value)} 
                    style={{ fontSize: '0.8rem', padding: '0.5rem' }}
                  />
                </div>
                <div className="col-md-2">
                  <input 
                    type="text" 
                    className="form-control themed-input" 
                    placeholder="(Specialization)" 
                    value={dev.specialization} 
                    onChange={e => handleDevChange(idx, 'specialization', e.target.value)} 
                    required 
                    style={{ fontSize: '0.8rem', padding: '0.5rem' }}
                  />
                </div>
                <div className="col-md-2">
                  <select 
                    className="form-select themed-input" 
                    value={dev.teamLeadIdx} 
                    onChange={e => handleDevTeamLeadChange(idx, Number(e.target.value))}
                    style={{ fontSize: '0.8rem', padding: '0.5rem' }}
                  >
                    {teamLeads.map((tl, tIdx) => (
                      <option key={tIdx} value={tIdx}>{tl.name || `Team Lead #${tIdx + 1}`}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-1 d-flex align-items-center">
                  {developers.length > 1 && (
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => removeDeveloper(idx)} style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}>Remove</button>
                  )}
                </div>
              </div>
            ))}
            <button type="button" className="btn btn-secondary btn-sm mt-2" onClick={addDeveloper} style={{ fontSize: '0.8rem' }}>Add Developer</button>
          </div>
        </Modal.Body>
        <Modal.Footer className={theme === 'dark' ? 'dark-modal-footer' : 'light-modal-footer'} style={{ padding: '0.75rem 1rem' }}>
          <Button variant="secondary" onClick={closeTeamModal} size="sm" style={{ fontSize: '0.8rem' }}>Close</Button>
          <Button variant="primary" onClick={handleSaveTeam} size="sm" style={{ fontSize: '0.8rem' }}>Save Team</Button>
        </Modal.Footer>
      </Modal>
      {/* Backlog Modal */}
      {data?.role === 'team_lead' && (
      <Modal show={showBacklogModal} onHide={closeBacklogModal} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: '1.1rem' }}>Project Backlog</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: '1rem' }}>
          <h6 style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.75rem' }}>Add Backlog Item</h6>
          <div className="row g-2 mb-3">
            <div className="col-md-4">
              <input 
                type="text" 
                className="form-control" 
                placeholder="Title" 
                value={newBacklog.title} 
                onChange={e => setNewBacklog(nb => ({ ...nb, title: e.target.value }))} 
                required 
                style={{ fontSize: '0.8rem', padding: '0.5rem' }}
              />
            </div>
            <div className="col-md-6">
              <input 
                type="text" 
                className="form-control" 
                placeholder="Description" 
                value={newBacklog.description} 
                onChange={e => setNewBacklog(nb => ({ ...nb, description: e.target.value }))} 
                style={{ fontSize: '0.8rem', padding: '0.5rem' }}
              />
            </div>
            <div className="col-md-2">
              <button className="btn btn-success w-100" onClick={handleAddBacklog} style={{ fontSize: '0.8rem', padding: '0.5rem' }}>Add</button>
            </div>
          </div>
          <h6 style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.75rem' }}>Backlog Items</h6>
          <ul className="list-group">
            {backlogItems.length === 0 && <li className="list-group-item" style={{ fontSize: '0.8rem' }}>No backlog items.</li>}
            {backlogItems.map((item, idx) => (
              <li key={item.backlog_id || item.id || idx} className="list-group-item d-flex justify-content-between align-items-center" style={{ padding: '0.75rem', fontSize: '0.8rem' }}>
                <div>
                  <strong style={{ fontSize: '0.85rem' }}>{item.title}</strong>
                  <div className="text-muted small" style={{ fontSize: '0.75rem' }}>{item.description}</div>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => openSprintModal(item)} disabled={!!item.sprint_id} style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}>Add to Sprint</button>
              </li>
            ))}
          </ul>
        </Modal.Body>
        <Modal.Footer style={{ padding: '0.75rem 1rem' }}>
          <Button variant="secondary" onClick={closeBacklogModal} size="sm" style={{ fontSize: '0.8rem' }}>Close</Button>
        </Modal.Footer>
      </Modal>
      )}
      {/* Add to Sprint Modal */}
      <Modal show={showSprintModal} onHide={closeSprintModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Add to Sprint</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3">
            <label className="form-label">Sprint Description</label>
            <textarea className="form-control" value={sprintDesc} onChange={e => setSprintDesc(e.target.value)} />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeSprintModal}>Cancel</Button>
          <Button variant="primary" onClick={handleAddToSprint}>Add to Sprint</Button>
        </Modal.Footer>
      </Modal>
      {/* Sprints Modal */}
      <Modal show={showSprintsModal} onHide={closeSprintsModal} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Project Sprints</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <h5>All Sprints</h5>
          <ul className="list-group">
            {sprints.length === 0 && <li className="list-group-item">No sprints found.</li>}
            {sprints.map((sprint, idx) => (
              <li key={sprint.sprint_id || idx} className={`list-group-item${sprint.is_latest ? ' bg-warning-subtle border-warning' : ''}`}> 
                <div className="fw-bold d-flex justify-content-between align-items-center">
                  <span>{sprint.name || `Sprint #${idx + 1}`}</span>
                  <span className="badge bg-info text-dark ms-2">{sprint.is_latest ? 'Latest' : ''}</span>
                  <button className="btn btn-sm btn-outline-primary ms-2" onClick={() => openTasksModal(sprint, selectedProjectId ? { project_id: selectedProjectId } : null)}>Tasks</button>
                </div>
                <div className="small text-muted">Start: {sprint.start_date ? new Date(sprint.start_date).toLocaleDateString() : 'N/A'} | End: {sprint.end_date ? new Date(sprint.end_date).toLocaleDateString() : 'N/A'}</div>
                <div>{sprint.description || ''}</div>
              </li>
            ))}
          </ul>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeSprintsModal}>Close</Button>
        </Modal.Footer>
      </Modal>
      {/* Tasks Modal */}
      <Modal show={showTasksModal} onHide={closeTasksModal} size="lg" centered>
        <Modal.Header closeButton className={theme === 'dark' ? 'dark-modal-header' : 'light-modal-header'}>
          <Modal.Title>Tasks for {selectedSprint ? (selectedSprint.name || 'Sprint') : ''}</Modal.Title>
        </Modal.Header>
        <Modal.Body className={theme === 'dark' ? 'dark-modal-body' : 'light-modal-body'}>
          {data?.role === 'team_lead' && selectedProjectForTasks && (
            <>
              <h5 style={{ color: theme === 'dark' ? '#ffffff' : '#212529' }}>Assign Task</h5>
              <div className="row g-2 mb-3">
                <div className="col-md-3">
                  <input type="text" className="form-control themed-input" placeholder="Title" value={newTask.title} onChange={e => setNewTask(t => ({ ...t, title: e.target.value }))} required />
                </div>
                <div className="col-md-5">
                  <input type="text" className="form-control themed-input" placeholder="Description" value={newTask.description} onChange={e => setNewTask(t => ({ ...t, description: e.target.value }))} />
                </div>
                <div className="col-md-3">
                  <select className="form-select themed-input" value={newTask.assigned_to} onChange={e => setNewTask(t => ({ ...t, assigned_to: e.target.value }))} required>
                    <option value="">Assign to Developer</option>
                    {project.developers && project.developers.map(dev => (
                      <option key={dev.user_id} value={dev.user_id}>{dev.name} ({dev.email})</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-1">
                  <button className="btn btn-success w-100" onClick={handleAddTask}>Add</button>
                </div>
              </div>
            </>
          )}
          <h5 style={{ color: theme === 'dark' ? '#ffffff' : '#212529' }}>Tasks</h5>
          <ul className="list-group">
            {tasks.length === 0 && <li className="list-group-item themed-card">No tasks found.</li>}
            {tasks.map((task, idx) => (
              <li key={task.task_id || idx} className="list-group-item d-flex justify-content-between align-items-center themed-card" style={{ 
                backgroundColor: theme === 'dark' ? '#1e1e1e' : '#ffffff',
                color: theme === 'dark' ? '#ffffff' : '#212529',
                border: theme === 'dark' ? '1px solid #404040' : '1px solid #dee2e6'
              }}>
                <div>
                  <div className="fw-bold">{task.title}</div>
                  <div className="small text-muted">{task.description}</div>
                  <div className="small">Assigned to: {(() => {
                    if (!selectedProjectForTasks || !selectedProjectForTasks.developers) return task.assigned_to;
                    const dev = selectedProjectForTasks.developers.find(d => d.user_id === task.assigned_to);
                    return dev ? `${dev.name} (${dev.email})` : task.assigned_to;
                  })()}</div>
                  <div className="small">
                    <small className="text-muted d-block" style={{ fontSize: '0.75rem', marginBottom: '2px' }}>Status:</small>
                    <span className={`badge bg-${task.status === 'done' ? 'success' : task.status === 'in_progress' ? 'warning' : 'secondary'}`} style={{
                      fontSize: '0.85rem',
                      fontWeight: '1000',
                      padding: '0.25rem 0.5rem'
                    }}>
                      {task.status}
                    </span>
                  </div>
                </div>
                {data?.role === 'developer' && task.assigned_to === data.id && (
                  <div>
                    <select className="form-select themed-input" value={task.status} onChange={e => handleUpdateTaskStatus(task.task_id, e.target.value)}>
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="done">Done</option>
                    </select>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </Modal.Body>
        <Modal.Footer className={theme === 'dark' ? 'dark-modal-footer' : 'light-modal-footer'}>
          <Button variant="secondary" onClick={closeTasksModal}>Close</Button>
        </Modal.Footer>
      </Modal>
      {/* Edit Sprint Modal */}
      <Modal show={editSprintModal} onHide={closeEditSprintModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Edit Sprint</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editSprint && (
            <form onSubmit={e => { e.preventDefault(); handleEditSprint(); }}>
              <div className="mb-3">
                <label className="form-label">Name</label>
                <input type="text" className="form-control" value={editSprint.name || ''} onChange={e => setEditSprint(s => ({ ...s, name: e.target.value }))} required />
              </div>
              <div className="mb-3">
                <label className="form-label">Description</label>
                <textarea className="form-control" value={editSprint.description || ''} onChange={e => setEditSprint(s => ({ ...s, description: e.target.value }))} />
              </div>
              <div className="mb-3">
                <label className="form-label">Start Date</label>
                <input type="date" className="form-control" value={editSprint.start_date ? editSprint.start_date.split('T')[0] : ''} onChange={e => setEditSprint(s => ({ ...s, start_date: e.target.value }))} />
              </div>
              <div className="mb-3">
                <label className="form-label">End Date</label>
                <input type="date" className="form-control" value={editSprint.end_date ? editSprint.end_date.split('T')[0] : ''} onChange={e => setEditSprint(s => ({ ...s, end_date: e.target.value }))} />
              </div>
              <div className="d-flex justify-content-end">
                <Button variant="secondary" onClick={closeEditSprintModal}>Cancel</Button>
                <Button variant="primary" type="submit" className="ms-2">Save</Button>
              </div>
            </form>
          )}
        </Modal.Body>
      </Modal>

      {/* Create Project Modal */}
      <Modal show={showCreateProjectModal} onHide={() => setShowCreateProjectModal(false)} centered>
        <Modal.Header closeButton style={{ 
          backgroundColor: theme === 'dark' ? '#1e222a' : '#f8f9fa',
          color: theme === 'dark' ? '#f8f9fa' : '#212529',
          borderBottom: theme === 'dark' ? '1px solid #404040' : '1px solid #dee2e6'
        }}>
          <Modal.Title style={{ fontSize: '1.2rem' }}>Create New Project</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ 
          backgroundColor: theme === 'dark' ? '#1e222a' : '#ffffff',
          color: theme === 'dark' ? '#f8f9fa' : '#212529',
          padding: '1rem',
          borderBottomLeftRadius: '0.5rem',
          borderBottomRightRadius: '0.5rem'
        }}>
          <form onSubmit={async (e) => {
            e.preventDefault();
            if (!newProject.name.trim()) {
              alert('Project name is required');
              return;
            }
            
            const token = JSON.parse(sessionStorage.getItem('loggedInUser'))?.token;
            try {
              const response = await fetch('http://localhost:3001/api/projects', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                  pname: newProject.name,
                  description: newProject.description || '',
                  start_date: new Date().toISOString().split('T')[0], // Today's date
                  completion_date: newProject.completion_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 30 days from now
                })
              });

              if (response.ok) {
                toast.success('Project created successfully!');
                setShowCreateProjectModal(false);
                setNewProject({ name: '', description: '', completion_date: '' });
                fetchProjects(); // Refresh the projects list
              } else {
                const error = await response.json();
                toast.error(error.message || 'Failed to create project');
              }
            } catch (error) {
              console.error('Error creating project:', error);
              toast.error('Error creating project');
            }
          }}>
            <div className="mb-3">
              <label className="form-label" style={{ fontSize: '0.9rem', fontWeight: '600' }}>Project Name *</label>
              <input
                type="text"
                className="form-control themed-input"
                value={newProject.name}
                onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter project name"
                required
                style={{ fontSize: '0.9rem', padding: '0.5rem' }}
              />
            </div>
            <div className="mb-3">
              <label className="form-label" style={{ fontSize: '0.9rem', fontWeight: '600' }}>Description</label>
              <textarea
                className="form-control themed-input"
                value={newProject.description}
                onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter project description (optional)"
                rows="3"
                style={{ fontSize: '0.9rem', padding: '0.5rem' }}
              />
            </div>
            <div className="mb-3">
              <label className="form-label" style={{ fontSize: '0.9rem', fontWeight: '600' }}>Completion Date *</label>
              <input
                type="date"
                className="form-control themed-input"
                value={newProject.completion_date}
                onChange={(e) => setNewProject(prev => ({ ...prev, completion_date: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
                required
                style={{ fontSize: '0.9rem', padding: '0.5rem' }}
              />
              <small className="text-muted" style={{ fontSize: '0.8rem' }}>Select when the project should be completed</small>
            </div>
            <div className="d-flex justify-content-end gap-2">
              <Button 
                variant="secondary" 
                onClick={() => setShowCreateProjectModal(false)}
                size="sm"
                style={{ fontSize: '0.9rem' }}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="primary"
                size="sm"
                style={{ fontSize: '0.9rem' }}
              >
                Create Project
              </Button>
            </div>
          </form>
        </Modal.Body>
      </Modal>


    </div>
  );
}

export default UserProjects;
