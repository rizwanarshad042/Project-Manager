import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import AvailableTeamMembers from './AvailableTeamMembers';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './theme.css';

function CreateUser() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('team_lead');
  const [specialization, setSpecialization] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAvailableTeamMembersModal, setShowAvailableTeamMembersModal] = useState(false);

  const user = useSelector((state) => state.login.user);
  const theme = useSelector((state) => state.theme.mode);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    
    if (!name || !email || !password) {
      setMessage('Name, email, and password are required.');
      return;
    }
    
    if (role === 'developer' && !specialization) {
      setMessage('Specialization is required for developers.');
      return;
    }

    setLoading(true);
    const token = JSON.parse(sessionStorage.getItem('loggedInUser'))?.token;
    
    const payload = {
      name,
      email,
      password,
      role,
      ...(role === 'developer' && { specialization })
    };

    try {
      const res = await fetch('http://localhost:3001/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        toast.success(`${role === 'team_lead' ? 'Team Lead' : 'Developer'} created successfully!`);
        setTimeout(() => {
          setName('');
          setEmail('');
          setPassword('');
          setRole('team_lead');
          setSpecialization('');
        }, 1000);
      } else {
        setMessage(data.message || 'Failed to create user.');
      }
    } catch (err) {
      setMessage('Server error.');
    }
    setLoading(false);
  };

  return (
    <div
      className="container-fluid d-flex justify-content-center align-items-center"
      style={{
        background: theme === 'dark' 
        ? 'linear-gradient(135deg, #0f1419 0%, #1a1f2e 50%, #181c24 100%)' 
        : 'linear-gradient(135deg, #f8faff 0%, #e3f2fd 50%, #f4f6fb 100%)',
        color: theme === 'dark' ? '#f1f1f1' : '#212529',
        minHeight: '91vh',
        padding: 0
      }}
    >
      <div className="col-12 col-md-7 col-lg-5 col-xl-4">
        <div
          className="shadow rounded p-4"
          style={{
            background: theme === 'dark' ? '#1e222a' : '#fff',
            color: theme === 'dark' ? '#f8f9fa' : '#212529',
            border: theme === 'dark' ? '1px solid #2c3039' : '1px solid #dee2e6',
            boxShadow:
              theme === 'dark'
                ? '0 2px 10px rgba(0,0,0,0.4)'
                : '0 2px 8px rgba(0,0,0,0.08)',
            transition: 'all 0.3s ease',
          }}
        >
          <h2 className="text-center mb-3" style={{ fontSize: '1.5rem', fontWeight: 600 }}>Create New User</h2>

          {/* Available Team Members Button */}
          {user?.role === 'project_manager' && (
            <div className="text-center mb-3">
              <button
                type="button"
                className="btn btn-outline-info btn-sm"
                onClick={() => setShowAvailableTeamMembersModal(true)}
                style={{ 
                  fontSize: '0.9rem', 
                  padding: '0.5rem 1rem',
                  borderRadius: '20px'
                }}
              >
                <i className="fas fa-users me-2"></i>
                View Available Team Members
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="row g-2 create-user-form">
            <div className="col-12">
              <label className="form-label" style={{ fontSize: '0.875rem', fontWeight: 500 }}>Name</label>
              <input 
                type="text" 
                className="form-control" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                required 
                placeholder="Enter full name" 
              />
            </div>
            
            <div className="col-12">
              <label className="form-label" style={{ fontSize: '0.875rem', fontWeight: 500 }}>Email</label>
              <input 
                type="email" 
                className="form-control" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
                placeholder="Enter email address" 
              />
            </div>
            
            <div className="col-12">
              <label className="form-label" style={{ fontSize: '0.875rem', fontWeight: 500 }}>Password</label>
              <input 
                type="password" 
                className="form-control" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
                placeholder="Enter password" 
              />
            </div>
            
            <div className="col-12">
              <label className="form-label" style={{ fontSize: '0.875rem', fontWeight: 500 }}>Role</label>
              <select 
                className="form-select" 
                value={role} 
                onChange={e => setRole(e.target.value)}
              >
                <option value="team_lead">Team Lead</option>
                <option value="developer">Developer</option>
              </select>
            </div>
            
            {role === 'developer' && (
              <div className="col-12">
                <label className="form-label" style={{ fontSize: '0.875rem', fontWeight: 500 }}>Specialization</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={specialization} 
                  onChange={e => setSpecialization(e.target.value)} 
                  required 
                  placeholder="Enter specialization (e.g., Frontend, Backend, Full Stack)" 
                />
              </div>
            )}
            
            <div className="col-12">
              {message && (
                <div className="mb-2">
                  <span style={{color: message.includes('successfully') ? 'green' : 'red', fontSize: '0.875rem'}}>
                    {message}
                  </span>
                </div>
              )}
              <button 
                type="submit" 
                className="btn btn-primary w-100" 
                style={{ 
                  fontWeight: 600, 
                  fontSize: '0.95rem', 
                  borderRadius: '0.5rem', 
                  padding: '0.6rem',
                  marginTop: '1rem'
                }} 
                disabled={loading}
              >
                {loading ? 'Creating...' : `Create ${role === 'team_lead' ? 'Team Lead' : 'Developer'}`}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Theme-aware styles */}
      <style>{`
        .create-user-form .form-control,
        .create-user-form .form-select {
          background-color: ${theme === 'dark' ? '#2d2d2d' : '#ffffff'} !important;
          color: ${theme === 'dark' ? '#ffffff' : '#212529'} !important;
          border-color: ${theme === 'dark' ? '#404040' : '#ced4da'} !important;
          transition: all 0.3s ease;
        }
        
        .create-user-form .form-control:focus,
        .create-user-form .form-select:focus {
          background-color: ${theme === 'dark' ? '#2d2d2d' : '#ffffff'} !important;
          color: ${theme === 'dark' ? '#ffffff' : '#212529'} !important;
          border-color: ${theme === 'dark' ? '#4dabf7' : '#86b7fe'} !important;
          box-shadow: 0 0 0 0.2rem ${theme === 'dark' ? 'rgba(77, 171, 247, 0.25)' : 'rgba(13, 110, 253, 0.25)'} !important;
        }
        
        .create-user-form .form-control::placeholder {
          color: ${theme === 'dark' ? '#888888' : '#6c757d'} !important;
        }
        
        .create-user-form .form-label {
          color: ${theme === 'dark' ? '#ffffff' : '#212529'} !important;
        }
      `}</style>

      {/* Available Team Members Modal */}
      <AvailableTeamMembers 
        show={showAvailableTeamMembersModal}
        onHide={() => setShowAvailableTeamMembersModal(false)}
      />
    </div>
  );
}

export default CreateUser;