import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

function UserProjects({ data }) {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!data?.id) return;

    const token = JSON.parse(sessionStorage.getItem('loggedInUser'))?.token;
    setIsLoading(true);

    fetch(`http://localhost:3001/api/users/projects?id=${encodeURIComponent(data.id)}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then((res) => res.json())
      .then((projects) => {
        setProjects(projects);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching user projects:', err);
        setIsLoading(false);
      });
  }, [data?.id]);

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

      setProjects(projects.filter(project => project.pid !== pid));
      alert('Project deleted successfully');
    } catch (err) {
      console.error('Error deleting project:', err);
      alert(err.message || 'Failed to delete project. Please try again.');
    }
  };

  // Ensure body doesn't allow horizontal scroll
  useEffect(() => {
    document.body.style.overflowX = 'hidden';
    return () => {
      document.body.style.overflowX = 'auto';
    };
  }, []);

  return (
    <div
      className="container-fluid bg-light min-vh-100 min-vw-100 w-100 px-0"
      style={{ marginTop: '60px', overflowX: 'hidden' }}
    >
      <div className="p-4">
        <div className="row justify-content-center g-0">
          <div className="col-12 px-0">
            <div className="bg-white shadow rounded p-4">
              <h2 className="text-center display-6 mb-4">Your Projects</h2>
              {isLoading ? (
                <div className="text-center p-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : projects.length === 0 ? (
                <div className="text-center p-5">
                  <p className="lead text-muted">
                    You have not created any projects yet.
                    <br/>
                    <small className="d-block mt-2">
                      Get started by clicking "Create Project" in the navigation bar.
                    </small>
                  </p>
                </div>
              ) : (
                <div className="row row-cols-1 row-cols-md-2 g-4 justify-content-center">
                  {projects.map((project, index) => (
                    <div 
                      key={project.pid} 
                      className={`col ${
                        projects.length % 2 !== 0 && index === projects.length - 1 
                          ? 'col-md-8 mx-auto' 
                          : ''
                      }`}
                    >
                      <div className="card h-100 shadow-sm">
                        <div className="card-body">
                          <div className="d-flex justify-content-between align-items-start mb-3">
                            <h3 className="card-title h5 text-primary mb-0">{project.pname}</h3>
                            <button
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => handleDelete(project.pid)}
                            >
                              Delete
                            </button>
                          </div>

                          <p className="card-text">
                            <strong>Description:</strong> {project.description}
                          </p>

                          <div className="row g-3 mb-3">
                            <div className="col-12 col-sm-6">
                              <p className="mb-1"><small className="text-muted">Start Date:</small></p>
                              <p className="mb-0">{new Date(project.start_date).toLocaleDateString()}</p>
                            </div>
                            <div className="col-12 col-sm-6">
                              <p className="mb-1"><small className="text-muted">End Date:</small></p>
                              <p className="mb-0">{new Date(project.completion_date).toLocaleDateString()}</p>
                            </div>
                          </div>

                          <div className="border-top pt-3">
                            <p className="mb-2"><strong>Team Lead:</strong> {project.team_lead_name}</p>
                            <p className="text-muted small mb-3">{project.team_lead_designation}</p>

                            <p className="mb-2"><strong>Team Members:</strong></p>
                            <ul className="list-group list-group-flush">
                              {project.team_members && project.team_members.map((member) => (
                                <li key={member.rid} className="list-group-item px-0 py-2">
                                  <div className="d-flex justify-content-between align-items-center">
                                    <span>{member.rname}</span>
                                    <small className="text-muted">{member.designation}</small>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserProjects;
