import React, { useState, useEffect, useContext } from 'react';
import { useSelector } from 'react-redux';
import { FaProjectDiagram, FaTasks, FaRocket, FaHistory, FaSearch, FaTimes } from 'react-icons/fa';
import { ProjectSearchContext } from './Navbar';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './theme.css';

const Home = () => {
  const theme = useSelector((state) => state.theme.mode);
  const user = useSelector((state) => state.login.user);
  const { search, setSearch } = useContext(ProjectSearchContext);
  const [searchResults, setSearchResults] = useState({
    projects: [],
    tasks: [],
    sprints: [],
    isLoading: false
  });

  // Fetch search results when search term changes
  useEffect(() => {
    if (search.trim()) {
      fetchSearchResults();
    } else {
      setSearchResults({ projects: [], tasks: [], sprints: [], isLoading: false });
    }
  }, [search]);

  const fetchSearchResults = async () => {
    setSearchResults(prev => ({ ...prev, isLoading: true }));
    const token = JSON.parse(sessionStorage.getItem('loggedInUser'))?.token;
    
    try {
      // Fetch projects (backend already handles role-based filtering)
      const projectsRes = await fetch('http://localhost:3001/api/projects', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const projects = projectsRes.ok ? await projectsRes.json() : [];
      // Fetch all users to resolve project manager names (admin only)
let users = [];
if (user?.role === 'admin') {
  const usersRes = await fetch('http://localhost:3001/api/users', {
    headers: { Authorization: `Bearer ${token}` }
  });
  users = usersRes.ok ? await usersRes.json() : [];
}

// Add project_manager_name to each project
projects.forEach(p => {
  const manager = users.find(u => u.user_id === p.created_by);
  p.project_manager_name = manager ? manager.name : 'Unassigned';
});


      // Fetch tasks (backend already handles role-based filtering)
      let tasks = [];
      try {
        console.log('Fetching tasks for search...');
        
        // First try the debug endpoint to see if there are any tasks
        const debugRes = await fetch('http://localhost:3001/api/debug/tasks', {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Debug tasks response status:', debugRes.status);
        if (debugRes.ok) {
          const debugTasks = await debugRes.json();
          console.log('Debug tasks found:', debugTasks.length);
        }
        
        const tasksRes = await fetch('http://localhost:3001/api/search/tasks', {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Tasks response status:', tasksRes.status);
        if (tasksRes.ok) {
          tasks = await tasksRes.json();
          console.log('Tasks fetched:', tasks);
        } else {
          const errorData = await tasksRes.json().catch(() => ({}));
          console.error('Tasks fetch failed:', errorData);
        }
      } catch (err) {
        console.error('Error fetching tasks:', err);
      }

      // Fetch sprints from user's accessible projects only
      let sprints = [];
      for (const project of projects) {
        try {
          const sprintsRes = await fetch(`http://localhost:3001/api/projects/${project.project_id || project.pid}/sprints`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (sprintsRes.ok) {
            const projectSprints = await sprintsRes.json();
            sprints.push(...projectSprints.map(sprint => ({ ...sprint, projectName: project.name || project.pname })));
          }
        } catch (err) {
          // Continue with other projects
        }
      }

      // Filter results based on search term
      const searchLower = search.toLowerCase();
      const filteredProjects = projects.filter(project => 
        (project.name || project.pname || '').toLowerCase().includes(searchLower) ||
        (project.description || '').toLowerCase().includes(searchLower)
      );
      
      const filteredTasks = tasks.filter(task => {
        const matches = (task.title || '').toLowerCase().includes(searchLower) ||
          (task.description || '').toLowerCase().includes(searchLower) ||
          (task.assigned_to_name || '').toLowerCase().includes(searchLower) ||
          (task.project_name || '').toLowerCase().includes(searchLower) ||
          (task.sprint_name || '').toLowerCase().includes(searchLower) ||
          (task.status || '').toLowerCase().includes(searchLower);
        
        if (matches) {
          console.log('Task matches search:', task);
        }
        return matches;
      });
      
      console.log('Filtered tasks:', filteredTasks);
      
      const filteredSprints = sprints.filter(sprint => 
        (sprint.name || sprint.sprint_name || '').toLowerCase().includes(searchLower) ||
        (sprint.description || '').toLowerCase().includes(searchLower) ||
        (sprint.projectName || '').toLowerCase().includes(searchLower)
      );

      setSearchResults({
        projects: filteredProjects,
        tasks: filteredTasks,
        sprints: filteredSprints,
        isLoading: false
      });
    } catch (err) {
      console.error('Error fetching search results:', err);
      setSearchResults(prev => ({ ...prev, isLoading: false }));
    }
  };

  const totalResults = searchResults.projects.length + searchResults.tasks.length + searchResults.sprints.length;

  return (
    <div className="main-content-area" style={{ height: '91vh', overflow: 'hidden' }}>
      <div
        className="container-fluid w-100 h-100"
        style={{
          background: theme === 'dark' 
            ? 'linear-gradient(135deg, #0f1419 0%, #1a1f2e 50%, #181c24 100%)' 
            : 'linear-gradient(135deg, #f8faff 0%, #e3f2fd 50%, #f4f6fb 100%)',
          color: theme === 'dark' ? '#f8f8f8' : '#181c24',
          transition: 'all 0.3s ease',
          paddingTop: '20px',
          height: '100vh',
          overflow: 'hidden',
          maxHeight: '91vh',
        }}
      >
        <div className="d-flex justify-content-center align-items-center h-100" style={{ height: 'calc(100vh - 70px)' }}>
                {search.trim() ? (
        // Search Results View
        <div className="w-100 h-100 p-3" style={{ maxWidth: '1200px', overflowY: 'auto', height: 'calc(100vh - 200px)', paddingBottom: '100px' }}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="d-flex align-items-center">
                  <FaSearch className="me-2" style={{ fontSize: '1.2rem' }} />
                  <h3 className="mb-0 fw-bold" style={{ fontSize: '1.5rem' }}>
                    Search Results for "{search}"
                  </h3>
                </div>
                <button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => setSearch('')}
                  style={{ fontSize: '0.8rem' }}
                >
                  <FaTimes className="me-1" />
                  Clear Search
                </button>
              </div>

              {searchResults.isLoading ? (
                <div className="text-center py-5">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2">Searching...</p>
                </div>
              ) : totalResults === 0 ? (
                <div className="text-center py-5">
                  <FaSearch size={48} className="text-muted mb-3" />
                  <h5>No results found</h5>
                  <p className="text-muted">Try adjusting your search terms</p>
                </div>
              ) : (
                <div className="row g-3">
                  {/* Projects Section */}
                  {searchResults.projects.length > 0 && (
                    <div className="col-12 mb-4">
                      <h5 className="mb-3">
                        <FaProjectDiagram className="me-2" />
                        Projects ({searchResults.projects.length})
                      </h5>
                      <div className="row g-2">
                        {searchResults.projects.map((project) => (
                          <div key={project.project_id || project.pid} className="col-md-6 col-lg-4">
                            <div className="card h-100 shadow-sm border-0 backlog-card themed-card">
                              <div className="card-body p-3">
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                  <h6 className="card-title fw-bold mb-0" style={{ fontSize: '1.2rem' }}>
                                    {project.name || project.pname}
                                  </h6>
                                  <div className="text-end" style={{ marginRight: '8px' }}>
                                    <small className="text-muted d-block" style={{ fontSize: '0.75rem', marginBottom: '2px' }}>Status:</small>
                                    <span className={`badge bg-${project.status === 'completed' ? 'success' : 'primary'}`} style={{
                                      fontSize: '0.85rem',
                                      fontWeight: '1000',
                                      padding: '0.25rem 0.5rem'
                                    }}>
                                      {project.status || 'Active'}
                                    </span>
                                  </div>
                                </div>
                                {user?.role === 'admin' && (
                                  <div className="mb-2">
                                    <small className="text-muted d-block" style={{ fontSize: '0.75rem', fontWeight: '500', marginBottom: '4px' }}>Project Manager</small>
                                    <p className="card-text mb-0" style={{ 
                                      fontSize: '0.95rem', 
                                      color: theme === 'dark' ? '#4299e1' : '#3182ce',
                                      fontWeight: '500'
                                    }}>
                                      {project.project_manager_name || 'Unassigned'}
                                    </p>
                                  </div>
                                )}
                                <div className="mb-3">
                                  <small className="text-muted d-block" style={{ fontSize: '0.75rem', fontWeight: '500', marginBottom: '4px' }}>Description</small>
                                  <p className="card-text text-muted mb-0" style={{
                                    fontSize: '0.95rem',
                                    lineHeight: '1.5',
                                    opacity: '0.8'
                                  }}>
                                    {project.description || 'No description'}
                                  </p>
                                </div>
                                <div className="mt-auto">
                                  <small className="text-muted">
                                    {project.created_at ? new Date(project.created_at).toLocaleDateString() : 'N/A'}
                                  </small>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tasks Section */}
                  {searchResults.tasks.length > 0 && (
                    <div className="col-12 mb-4">
                      <h5 className="mb-3">
                        <FaTasks className="me-2" />
                        Tasks ({searchResults.tasks.length})
                      </h5>
                      <div className="row g-2">
                        {searchResults.tasks.map((task) => (
                          <div key={task.task_id} className="col-md-6 col-lg-4">
                            <div className="card h-100 shadow-sm border-0 backlog-card themed-card">
                              <div className="card-body p-3">
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                  <h6 className="card-title fw-bold mb-0" style={{ fontSize: '1.2rem' }}>
                                    {task.title}
                                  </h6>
                                  <div className="text-end" style={{ marginRight: '8px' }}>
                                    <small className="text-muted d-block" style={{ fontSize: '0.75rem', marginBottom: '2px' }}>Status:</small>
                                    <span className={`badge bg-${
                                      task.status === 'completed' || task.status === 'done' ? 'success' : 
                                      task.status === 'in_progress' ? 'warning' : 'secondary'
                                    }`} style={{
                                      fontSize: '0.85rem',
                                      fontWeight: '1000',
                                      padding: '0.25rem 0.5rem'
                                    }}>
                                      {task.status}
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
                                    {task.description || 'No description'}
                                  </p>
                                </div>
                                <div className="mt-auto">
                                  <div className="row g-1 mb-1">
                                    <div className="col-6">
                                      <small className="text-muted d-block" style={{ fontSize: '0.8rem' }}>Assigned to:</small>
                                      <span className="text-muted small" style={{ fontSize: '0.85rem' }}>
                                        {task.assigned_to_name || 'Unassigned'}
                                      </span>
                                    </div>
                                    <div className="col-6">
                                      <small className="text-muted d-block" style={{ fontSize: '0.8rem' }}>Project:</small>
                                      <span className="text-muted small" style={{ fontSize: '0.85rem' }}>
                                        {task.project_name || 'Unknown'}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="row g-1">
                                    <div className="col-6">
                                      <small className="text-muted d-block" style={{ fontSize: '0.8rem' }}>Sprint:</small>
                                      <span className="text-muted small" style={{ fontSize: '0.85rem' }}>
                                        {task.sprint_name || 'Unknown'}
                                      </span>
                                    </div>
                                    <div className="col-6">
                                      <small className="text-muted d-block" style={{ fontSize: '0.8rem' }}>Created:</small>
                                      <span className="text-muted small" style={{ fontSize: '0.85rem' }}>
                                        {task.created_at ? new Date(task.created_at).toLocaleDateString() : 'N/A'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sprints Section */}
                  {searchResults.sprints.length > 0 && (
                    <div className="col-12 mb-4">
                      <h5 className="mb-3">
                        <FaRocket className="me-2" />
                        Sprints ({searchResults.sprints.length})
                      </h5>
                      <div className="row g-2">
                        {searchResults.sprints.map((sprint) => (
                          <div key={sprint.sprint_id} className="col-md-6 col-lg-4">
                            <div className="card h-100 shadow-sm border-0 backlog-card themed-card">
                              <div className="card-body p-3">
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                  <h6 className="card-title fw-bold mb-0" style={{ fontSize: '1.2rem' }}>
                                    {sprint.name || sprint.sprint_name}
                                  </h6>
                                  <div className="text-end" style={{ marginRight: '8px' }}>
                                    <small className="text-muted d-block" style={{ fontSize: '0.75rem', marginBottom: '2px' }}>Status:</small>
                                    <span className={`badge bg-${sprint.status === 'completed' ? 'success' : 'primary'}`} style={{
                                      fontSize: '0.85rem',
                                      fontWeight: '1000',
                                      padding: '0.25rem 0.5rem'
                                    }}>
                                      {sprint.status}
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
                                    {sprint.description || 'No description'}
                                  </p>
                                </div>
                                <div className="mt-auto">
                                  <small className="text-muted d-block" style={{ fontSize: '0.8rem' }}>Project:</small>
                                  <small className="text-muted">
                                  {sprint.projectName || 'Unknown Project'}
                                  </small>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            // Welcome View (original content)
            <div
              className="shadow-lg rounded-4 p-4 border-0"
              style={{
                background: theme === 'dark' 
                  ? 'linear-gradient(145deg, #23272f 0%, #2b2f36 100%)' 
                  : 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
                color: theme === 'dark' ? '#f8f8f8' : '#181c24',
                boxShadow: theme === 'dark' 
                  ? '0 12px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)' 
                  : '0 12px 24px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8)',
                backdropFilter: 'blur(8px)',
                transition: 'all 0.3s ease',
                width: '85%',
                maxWidth: '480px',
                fontSize: '0.85rem',
              }}
            >
              <div className="d-flex align-items-center justify-content-center mb-3">
                <div className="project-icon me-2" style={{ fontSize: '1.2rem', marginLeft: '8px' }}>
                  <FaProjectDiagram />
                </div>
                <h2 className="fw-bold mb-0" style={{ fontSize: '1.8rem' }}>Welcome</h2>
              </div>
              <p className="text-muted mb-3 text-center" style={{ fontSize: '0.95rem', lineHeight: '1.5' }}>
                You are successfully logged in. Explore the platform!
              </p>
              <div className="row g-2 mt-3">
                <div className="col-4">
                  <div className="text-center p-2">
                    <div className="project-icon mb-1" style={{ fontSize: '1.1rem', marginLeft: '10px' }}>
                      <FaTasks />
                    </div>
                    <h6 className="fw-bold mb-0" style={{ fontSize: '0.9rem' }}>Manage</h6>
                    <small className="text-muted" style={{ fontSize: '0.75rem' }}>Tasks</small>
                  </div>
                </div>
                <div className="col-4">
                  <div className="text-center p-2">
                    <div className="project-icon mb-1" style={{ fontSize: '1.1rem', marginLeft: '10px' }}>
                      <FaRocket />
                    </div>
                    <h6 className="fw-bold mb-0" style={{ fontSize: '0.9rem' }}>Sprint</h6>
                    <small className="text-muted" style={{ fontSize: '0.75rem' }}>Planning</small>
                  </div>
                </div>
                <div className="col-4">
                  <div className="text-center p-2">
                    <div className="project-icon mb-1" style={{ fontSize: '1.1rem', marginLeft: '10px' }}>
                      <FaHistory />
                    </div>
                    <h6 className="fw-bold mb-0" style={{ fontSize: '0.9rem' }}>History</h6>
                    <small className="text-muted" style={{ fontSize: '0.75rem' }}>View</small>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>  
    </div>
  );
};

export default Home;
