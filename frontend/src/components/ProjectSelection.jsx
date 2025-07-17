import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

function ProjectSelection({ user }) {
  const [pname, setPname] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [completionDate, setCompletionDate] = useState('');
  const [resources, setResources] = useState([]);
  const [selectedResources, setSelectedResources] = useState([]);
  const [teamLeadId, setTeamLeadId] = useState('');

  const navigate = useNavigate();
  useEffect(() => {
    const token = JSON.parse(sessionStorage.getItem('loggedInUser'))?.token;
    axios.get('http://localhost:3001/api/resources/unassigned', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => setResources(res.data))
      .catch(err => console.error('Error loading resources:', err));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedResources.includes(parseInt(teamLeadId))) {
      alert('Team lead must be selected from the chosen resources.');
      return;
    }

    const token = JSON.parse(sessionStorage.getItem('loggedInUser'))?.token;

    const payload = {
      pname,
      description,
      start_date: startDate,
      completion_date: completionDate,
      teamLeadId: parseInt(teamLeadId),
      resourceIds: selectedResources.map(Number)
    };

    try {
      await axios.post('http://localhost:3001/api/projects', payload, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      alert('Project created successfully!');
      navigate('/home');

      // Reset form
      setPname('');
      setDescription('');
      setStartDate('');
      setCompletionDate('');
      setSelectedResources([]);
      setTeamLeadId('');
    } catch (err) {
      console.error('Axios Error:', err.response?.data || err.message || err);
      alert('Failed to create project: ' + (err.response?.data || err.message));
    }
  };


  const toggleResource = (rid) => {
    setSelectedResources(prev =>
      prev.includes(rid) ? prev.filter(id => id !== rid) : [...prev, rid]
    );
  };


return (
  <div className="container-fluid bg-light min-vh-100 w-100" style={{ marginTop: '60px', paddingTop: '2rem', paddingBottom: '2rem' }}>
    <div className="row justify-content-center">
      <div className="col-12 col-lg-10 col-xl-8">
        <div className="bg-white shadow rounded p-3 p-md-5">
          <h2 className="text-center display-6 mb-4">Create a New Project</h2>
          
          <form onSubmit={handleSubmit} className="row g-3 g-md-4">
            {/* Project Name */}
            <div className="col-12">
              <label className="form-label">Project Name</label>
              <input
                type="text"
                className="form-control"
                value={pname}
                onChange={e => setPname(e.target.value)}
                required
                placeholder="Enter project name"
              />
            </div>

            {/* Description */}
            <div className="col-12">
              <label className="form-label">Description</label>
              <textarea
                className="form-control"
                value={description}
                onChange={e => setDescription(e.target.value)}
                required
                rows={4}
                placeholder="Enter project description"
              />
            </div>

            {/* Dates */}
            <div className="col-12 col-md-6">
              <label className="form-label">Start Date</label>
              <input
                type="date"
                className="form-control"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                required
              />
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label">Completion Date</label>
              <input
                type="date"
                className="form-control"
                value={completionDate}
                onChange={e => setCompletionDate(e.target.value)}
                required
              />
            </div>

            {/* Resources Selection */}
            <div className="col-12">
              <h4 className="h5 mb-3">Select Resources</h4>
              <div className="card">
                <div className="card-body">
                  {resources.length === 0 && (
                    <p className="text-muted mb-0">No unassigned resources available.</p>
                  )}
                  <div className="row g-2">
                    {resources.map(r => (
                      <div key={r.rid} className="col-12 col-sm-6 col-lg-4">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            value={r.rid}
                            checked={selectedResources.includes(r.rid)}
                            onChange={() => toggleResource(r.rid)}
                            id={`resource-${r.rid}`}
                          />
                          <label className="form-check-label" htmlFor={`resource-${r.rid}`}>
                            {r.rname} <span className="text-muted">({r.designation})</span>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Team Lead Selection */}
            <div className="col-12">
              <h4 className="h5 mb-3">Select Team Lead</h4>
              <select
                className="form-select"
                value={teamLeadId}
                onChange={e => setTeamLeadId(e.target.value)}
                required
              >
                <option value="">-- Select Team Lead --</option>
                {resources
                  .filter(r => selectedResources.includes(r.rid))
                  .map(r => (
                    <option key={r.rid} value={r.rid}>
                      {r.rname} ({r.designation})
                    </option>
                  ))}
              </select>
            </div>

            {/* Submit Button */}
            <div className="col-12 mt-4">
              <button type="submit" className="btn btn-primary w-100">
                Create Project
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
);
}

export default ProjectSelection;
