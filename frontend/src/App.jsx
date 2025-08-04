import React, { useEffect, useRef, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { useSelector, useDispatch } from 'react-redux';
import { loginSuccess, logout } from './features/Login';
import toast, { Toaster } from 'react-hot-toast';

import Login from './components/Login';
import Profile from './components/Profile';
import UserProjects from './components/UserProjects';
import Home from './components/Home';
import CreateUser from './components/CreateUser';
import ManageProjectTeam from './components/ManageProjectTeam';
import Navbar from './components/Navbar';
import Help from './components/Help';
import Sidebar from './components/Sidebar';
import { ProjectSearchContext } from './components/Navbar';
import BacklogPage from './components/BacklogPage';
import SprintsPage from './components/SprintsPage';
import HistoryPage from './components/HistoryPage';
import { ProjectProvider } from './components/ProjectContext';

function App() {
  const isLoggedIn = useSelector((state) => state.login.isLoggedIn);
  const user = useSelector((state) => state.login.user);
  const dispatch = useDispatch();
  const timeoutRef = useRef(null);
  const isLoading = false;
  const theme = useSelector((state) => state.theme.mode);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleLogout = () => {
    dispatch(logout());
    sessionStorage.removeItem('loggedInUser');
    clearTimeout(timeoutRef.current);
  };

  const startInactivityTimer = () => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      alert('You have been logged out due to inactivity.');
      handleLogout();
    }, 10 * 60 * 1000);
  };

  useEffect(() => {
    const savedUser = sessionStorage.getItem('loggedInUser');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        if (userData && userData.email) {
          dispatch(loginSuccess(userData));
        } else {
          sessionStorage.removeItem('loggedInUser');
        }
      } catch (error) {
        sessionStorage.removeItem('loggedInUser');
      }
    }
  }, [dispatch]);

  useEffect(() => {
    if (!isLoggedIn) return;
    startInactivityTimer();
    const events = ['mousemove', 'keydown', 'scroll', 'click'];
    events.forEach(event => window.addEventListener(event, startInactivityTimer));
    return () => {
      clearTimeout(timeoutRef.current);
      events.forEach(event => window.removeEventListener(event, startInactivityTimer));
    };
  }, [isLoggedIn]);

  if (isLoading) return <div className="text-center py-5">Loading...</div>;

  // CreateProjectManager page for admin: show all project managers, and an Add button to open the form
  function CreateProjectManager() {
    const user = useSelector((state) => state.login.user);
    const theme = useSelector((state) => state.theme.mode);
    const [managers, setManagers] = React.useState([]);
    const [showForm, setShowForm] = React.useState(false);
    const [name, setName] = React.useState('');
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [confirmPassword, setConfirmPassword] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const [message, setMessage] = React.useState('');
    const [editId, setEditId] = React.useState(null);
    const [editName, setEditName] = React.useState('');
    const [editEmail, setEditEmail] = React.useState('');
    const [editPassword, setEditPassword] = React.useState('');
    const [editConfirmPassword, setEditConfirmPassword] = React.useState('');
    const [showEditForm, setShowEditForm] = React.useState(false);
    const { search } = React.useContext(ProjectSearchContext);


    // Theme-aware styles
    const themeStyles = {
      pageBackground: {
        background: theme === 'dark' 
          ? 'linear-gradient(135deg, #0f1419 0%, #1a1f2e 50%, #181c24 100%)' 
          : 'linear-gradient(135deg, #f8faff 0%, #e3f2fd 50%, #f4f6fb 100%)',
        minHeight: '100vh',
        padding: '20px',
        transition: 'all 0.3s ease'
      },
      container: {
        maxWidth: 900,
        margin: '40px auto',
        background: theme === 'dark' 
          ? 'linear-gradient(145deg, #23272f 0%, #2b2f36 100%)' 
          : 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
        borderRadius: 8,
        boxShadow: theme === 'dark' 
          ? '0 12px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)' 
          : '0 12px 24px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8)',
        padding: 32,
        color: theme === 'dark' ? '#f8f8f8' : '#181c24',
        border: theme === 'dark' ? '1px solid #4a5568' : '1px solid #e2e8f0',
        backdropFilter: 'blur(8px)',
        transition: 'all 0.3s ease'
      },
      heading: {
        color: theme === 'dark' ? '#f7fafc' : '#2d3748',
        marginBottom: 0
      },
      input: {
        backgroundColor: theme === 'dark' ? '#4a5568' : '#fff',
        color: theme === 'dark' ? '#e2e8f0' : '#333',
        border: theme === 'dark' ? '1px solid #718096' : '1px solid #e2e8f0',
        borderRadius: '4px',
        padding: '8px 12px',
        fontSize: '14px'
      },
      inputFocus: {
        backgroundColor: theme === 'dark' ? '#4a5568' : '#fff',
        color: theme === 'dark' ? '#e2e8f0' : '#333',
        border: theme === 'dark' ? '1px solid #63b3ed' : '1px solid #3182ce',
        outline: 'none',
        boxShadow: theme === 'dark' ? '0 0 0 3px rgba(99, 179, 237, 0.1)' : '0 0 0 3px rgba(49, 130, 206, 0.1)'
      },
      table: {
        backgroundColor: theme === 'dark' ? '#2d3748' : '#fff',
        color: theme === 'dark' ? '#e2e8f0' : '#333',
        border: theme === 'dark' ? '1px solid #4a5568' : '1px solid #e2e8f0'
      },
      tableHeader: {
        backgroundColor: theme === 'dark' ? '#4a5568' : '#f7fafc',
        color: theme === 'dark' ? '#f7fafc' : '#2d3748',
        borderBottom: theme === 'dark' ? '1px solid #718096' : '1px solid #e2e8f0',
        borderRight: theme === 'dark' ? '1px solid #718096' : '1px solid #e2e8f0'
      },
      tableRow: {
        backgroundColor: theme === 'dark' ? '#2d3748' : '#fff',
        borderBottom: theme === 'dark' ? '1px solid #4a5568' : '1px solid #e2e8f0',
        borderRight: theme === 'dark' ? '1px solid #4a5568' : '1px solid #e2e8f0'
      },
      tableRowHover: {
        backgroundColor: theme === 'dark' ? '#4a5568' : '#f8f9fa'
      },
      modal: {
        backgroundColor: theme === 'dark' ? '#2d3748' : '#fff',
        color: theme === 'dark' ? '#e2e8f0' : '#333',
        border: theme === 'dark' ? '1px solid #4a5568' : '1px solid #e2e8f0'
      },
      modalHeader: {
        backgroundColor: theme === 'dark' ? '#4a5568' : '#f8f9fa',
        borderBottom: theme === 'dark' ? '1px solid #718096' : '1px solid #e2e8f0',
        color: theme === 'dark' ? '#f7fafc' : '#2d3748'
      },
      modalFooter: {
        backgroundColor: theme === 'dark' ? '#4a5568' : '#f8f9fa',
        borderTop: theme === 'dark' ? '1px solid #718096' : '1px solid #e2e8f0'
      },
      message: {
        color: theme === 'dark' ? '#68d391' : '#38a169'
      },
      errorMessage: {
        color: theme === 'dark' ? '#fc8181' : '#e53e3e'
      }
    };

    React.useEffect(() => {
      if (user?.role === 'admin') {
        const token = JSON.parse(sessionStorage.getItem('loggedInUser'))?.token;
        fetch('http://localhost:3001/api/users', {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then(res => res.json())
          .then(data => {
            setManagers(data.filter(u => u.role === 'project_manager'));
          });
      }
    }, [user, showForm, showEditForm]);

    // Filtered managers based on search
    const filteredManagers = managers.filter(m => {
      const s = search.toLowerCase();
      return (
        (m.name && m.name.toLowerCase().includes(s)) ||
        (m.email && m.email.toLowerCase().includes(s))
      );
    });

    if (!user || user.role !== 'admin') {
      return (
        <div style={{
          padding: 40,
          color: theme === 'dark' ? '#e2e8f0' : '#333',
          background: theme === 'dark' ? '#2d3748' : '#fff',
          borderRadius: 8,
          margin: '40px auto',
          maxWidth: 900,
          textAlign: 'center'
        }}>
          <h2 style={{ color: theme === 'dark' ? '#f7fafc' : '#2d3748' }}>Access Denied</h2>
          <p style={{ color: theme === 'dark' ? '#a0aec0' : '#4a5568' }}>Only admin can manage project managers.</p>
        </div>
      );
    }

    const handleSubmit = async (e) => {
      e.preventDefault();
      setMessage('');
      if (!name || !email || !password || !confirmPassword) {
        setMessage('All fields are required.');
        return;
      }
      if (password !== confirmPassword) {
        setMessage('Passwords do not match.');
        return;
      }
      setLoading(true);
      try {
        const token = JSON.parse(sessionStorage.getItem('loggedInUser'))?.token;
        const res = await fetch('http://localhost:3001/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ 
            name, 
            email, 
            password, 
            role: 'project_manager'
          })
        });
        const data = await res.json();
        if (res.ok) {
          toast.success('Project manager created successfully!');
          setName(''); 
          setEmail(''); 
          setPassword(''); 
          setConfirmPassword('');
          setShowForm(false);
        } else {
          setMessage(data.message || 'Failed to create project manager.');
        }
      } catch (err) {
        setMessage('Server error.');
      }
      setLoading(false);
    };

    // Edit logic
    const openEdit = (m) => {
      setEditId(m.user_id);
      setEditName(m.name);
      setEditEmail(m.email);
      setShowEditForm(true);
      setShowForm(false); // Close add form when opening edit form
    };
    const handleEdit = async (e) => {
      e.preventDefault();
      if (!editName || !editEmail) return;
      if (editPassword && editPassword !== editConfirmPassword) {
        toast.error('Passwords do not match');
        return;
      }
      setLoading(true);
      setMessage('');
      try {
        const token = JSON.parse(sessionStorage.getItem('loggedInUser'))?.token;
        const payload = {
          name: editName,
          email: editEmail,
          ...(editPassword && { password: editPassword })
        };
        const res = await fetch(`http://localhost:3001/api/users/${editId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok) {
          setShowEditForm(false);
          setEditName('');
          setEditEmail('');
          setEditPassword('');
          setEditConfirmPassword('');
          setEditId(null);
          toast.success('Project manager updated!');
        } else {
          toast.error(data.message || 'Failed to update.');
        }
      } catch (err) {
        toast.error('Server error.');
      }
      setLoading(false);
    };
    // Delete logic
    const handleDelete = async (id) => {
      if (!window.confirm('Are you sure you want to delete this project manager?')) return;
      setLoading(true);
      setMessage('');
      try {
        const token = JSON.parse(sessionStorage.getItem('loggedInUser'))?.token;
        const res = await fetch(`http://localhost:3001/api/users/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          toast.success('Project manager deleted successfully!');
          // Filter out the deleted manager from state
          setManagers(prevManagers => prevManagers.filter(m => m.user_id !== id));
        } else {
          toast.error('Failed to delete project manager.');
        }
      } catch (err) {
        toast.error('Server error.');
      }
      setLoading(false);
    };

    return (
      <div style={themeStyles.pageBackground}>
        <div style={themeStyles.container}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="mb-0" style={themeStyles.heading}>Project Managers</h2>
          <button 
            className="btn btn-primary" 
            onClick={() => {
              if (showForm || showEditForm) {
                // Close both forms
                setShowForm(false);
                setShowEditForm(false);
                setEditName('');
                setEditEmail('');
                setEditId(null);
              } else {
                // Open add form
                setShowForm(true);
                setShowEditForm(false);
              }
            }}
            style={{
              backgroundColor: theme === 'dark' ? '#3182ce' : '#007bff',
              borderColor: theme === 'dark' ? '#3182ce' : '#007bff',
              color: '#fff'
            }}
          >
            {(showForm || showEditForm) ? 'Close' : 'Add'}
          </button>
        </div>
        {/* Search bar is now in the navbar for admin mode */}
        {showForm && (
          <form onSubmit={handleSubmit} className="mb-4">
            <div className="row g-2">
              <div className="col-md-3">
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Name" 
                  value={name} 
                  onChange={e=>setName(e.target.value)} 
                  required 
                  style={themeStyles.input}
                  onFocus={(e) => e.target.style = {...themeStyles.inputFocus}}
                  onBlur={(e) => e.target.style = themeStyles.input}
                />
              </div>
              <div className="col-md-3">
                <input 
                  type="email" 
                  className="form-control" 
                  placeholder="Email" 
                  value={email} 
                  onChange={e=>setEmail(e.target.value)} 
                  required 
                  style={themeStyles.input}
                  onFocus={(e) => e.target.style = {...themeStyles.inputFocus}}
                  onBlur={(e) => e.target.style = themeStyles.input}
                />
              </div>
              <div className="col-md-3">
                <input 
                  type="password" 
                  className="form-control" 
                  placeholder="Password" 
                  value={password} 
                  onChange={e=>setPassword(e.target.value)} 
                  required 
                  style={themeStyles.input}
                  onFocus={(e) => e.target.style = {...themeStyles.inputFocus}}
                  onBlur={(e) => e.target.style = themeStyles.input}
                />
              </div>
              <div className="col-md-3">
                <input 
                  type="password" 
                  className="form-control" 
                  placeholder="Confirm Password" 
                  value={confirmPassword} 
                  onChange={e=>setConfirmPassword(e.target.value)} 
                  required 
                  style={themeStyles.input}
                  onFocus={(e) => e.target.style = {...themeStyles.inputFocus}}
                  onBlur={(e) => e.target.style = themeStyles.input}
                />
              </div>
            </div>
            <div className="row g-2 mt-2">
              <div className="col-md-12 d-flex justify-content-end">
                <div className="col-md-2">
                  <button 
                    type="submit" 
                    className="btn btn-success w-100" 
                    disabled={loading}
                    style={{
                      backgroundColor: theme === 'dark' ? '#38a169' : '#28a745',
                      borderColor: theme === 'dark' ? '#38a169' : '#28a745',
                      color: '#fff'
                    }}
                  >
                    {loading ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </div>
            </div>
            {message && (
              <div className="mt-2">
                <span style={message.includes('success') ? themeStyles.message : themeStyles.errorMessage}>
                  {message}
                </span>
              </div>
            )}
          </form>
        )}
        
        {/* Edit Form */}
        {showEditForm && (
          <form onSubmit={handleEdit} className="mb-4">
            <div className="row g-2">
              <div className="col-md-3">
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Name" 
                  value={editName} 
                  onChange={e=>setEditName(e.target.value)} 
                  required 
                  style={themeStyles.input}
                />
              </div>
              <div className="col-md-3">
                <input 
                  type="email" 
                  className="form-control" 
                  placeholder="Email" 
                  value={editEmail} 
                  onChange={e=>setEditEmail(e.target.value)} 
                  required 
                  style={themeStyles.input}
                />
              </div>
              <div className="col-md-3">
                <input 
                  type="password" 
                  className="form-control" 
                  placeholder="New Password (optional)" 
                  value={editPassword} 
                  onChange={e=>setEditPassword(e.target.value)} 
                  style={themeStyles.input}
                />
              </div>
              <div className="col-md-3">
                <input 
                  type="password" 
                  className="form-control" 
                  placeholder="Confirm New Password" 
                  value={editConfirmPassword} 
                  onChange={e=>setEditConfirmPassword(e.target.value)} 
                  style={themeStyles.input}
                />
              </div>
              <div className="col-md-12 d-flex justify-content-end">
                <div className="col-md-2">
                  <button 
                    type="submit" 
                    className="btn btn-success w-100" 
                    disabled={loading}
                    style={{
                      backgroundColor: theme === 'dark' ? '#38a169' : '#28a745',
                      borderColor: theme === 'dark' ? '#38a169' : '#28a745',
                      color: '#fff'
                    }}
                  >
                    {loading ? 'Saving...' : 'Update'}
                  </button>
                </div>
              </div>
            </div>
            {message && (
              <div className="mt-2">
                <span style={message.includes('success') ? themeStyles.message : themeStyles.errorMessage}>
                  {message}
                </span>
              </div>
            )}
          </form>
        )}
        
        <div className="table-responsive">
          <table 
            className="table table-bordered table-hover" 
            style={{
              ...themeStyles.table,
              borderCollapse: 'collapse'
            }}
          >
            <thead>
              <tr>
                <th style={{
                  ...themeStyles.tableHeader, 
                  color: theme === 'dark' ? '#f7fafc' : '#2d3748',
                  border: theme === 'dark' ? '1px solid #718096' : '1px solid #e2e8f0',
                  padding: '12px 8px'
                }}>Name</th>
                <th style={{
                  ...themeStyles.tableHeader, 
                  color: theme === 'dark' ? '#f7fafc' : '#2d3748',
                  border: theme === 'dark' ? '1px solid #718096' : '1px solid #e2e8f0',
                  padding: '12px 8px'
                }}>Email</th>
                <th style={{
                  ...themeStyles.tableHeader, 
                  color: theme === 'dark' ? '#f7fafc' : '#2d3748',
                  border: theme === 'dark' ? '1px solid #718096' : '1px solid #e2e8f0',
                  padding: '12px 8px'
                }}>Created At</th>
                <th style={{
                  ...themeStyles.tableHeader, 
                  color: theme === 'dark' ? '#f7fafc' : '#2d3748',
                  border: theme === 'dark' ? '1px solid #718096' : '1px solid #e2e8f0',
                  padding: '12px 8px'
                }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredManagers.map(m => (
                <tr 
                  key={m.user_id} 
                  style={themeStyles.tableRow}
                  onMouseEnter={(e) => e.target.closest('tr').style.backgroundColor = theme === 'dark' ? '#4a5568' : '#f8f9fa'}
                  onMouseLeave={(e) => e.target.closest('tr').style.backgroundColor = theme === 'dark' ? '#2d3748' : '#fff'}
                >
                  <td style={{
                    ...themeStyles.tableRow, 
                    color: theme === 'dark' ? '#e2e8f0' : '#333',
                    border: theme === 'dark' ? '1px solid #4a5568' : '1px solid #e2e8f0',
                    padding: '12px 8px'
                  }}>{m.name}</td>
                  <td style={{
                    ...themeStyles.tableRow, 
                    color: theme === 'dark' ? '#e2e8f0' : '#333',
                    border: theme === 'dark' ? '1px solid #4a5568' : '1px solid #e2e8f0',
                    padding: '12px 8px'
                  }}>{m.email}</td>
                  <td style={{
                    ...themeStyles.tableRow, 
                    color: theme === 'dark' ? '#e2e8f0' : '#333',
                    border: theme === 'dark' ? '1px solid #4a5568' : '1px solid #e2e8f0',
                    padding: '12px 8px'
                  }}>{m.created_at ? new Date(m.created_at).toLocaleString() : ''}</td>
                  <td style={{
                    ...themeStyles.tableRow, 
                    color: theme === 'dark' ? '#e2e8f0' : '#333',
                    border: theme === 'dark' ? '1px solid #4a5568' : '1px solid #e2e8f0',
                    padding: '12px 8px'
                  }}>
                    <button 
                      className="btn btn-sm btn-warning me-2" 
                      onClick={()=>openEdit(m)}
                      style={{
                        backgroundColor: theme === 'dark' ? '#d69e2e' : '#ffc107',
                        borderColor: theme === 'dark' ? '#d69e2e' : '#ffc107',
                        color: theme === 'dark' ? '#fff' : '#212529'
                      }}
                    >
                      Edit
                    </button>
                    <button 
                      className="btn btn-sm btn-danger" 
                      onClick={()=>handleDelete(m.user_id)}
                      style={{
                        backgroundColor: theme === 'dark' ? '#e53e3e' : '#dc3545',
                        borderColor: theme === 'dark' ? '#e53e3e' : '#dc3545',
                        color: '#fff'
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        </div>
      </div>
    );
  }
  // Placeholder for AllProjects
  function AllProjects() {
    return <UserProjects />;
  }

  return (
    <ProjectSearchContext.Provider value={{ search, setSearch }}>
      <BrowserRouter>
        <ProjectProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: theme === 'dark' ? '#2d3748' : '#fff',
                color: theme === 'dark' ? '#e2e8f0' : '#333',
                border: theme === 'dark' ? '1px solid #4a5568' : '1px solid #e2e8f0',
              },
            }}
          />
          <Navbar onSidebarToggle={() => setSidebarOpen(prev => !prev)} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          <div className="app-flex-layout d-flex" style={{ minHeight: '100vh', width: '100vw', overflow: 'hidden' }}>
            {/* Sidebar */}
            {isLoggedIn && (
                <Sidebar className={sidebarOpen ? "sidebar-wrapper open" : "sidebar-wrapper closed"} collapsed={!sidebarOpen} setSidebarOpen={setSidebarOpen} />
            )}

            {/* Main Content */}
            <div
              className="main-content-area flex-grow-1"
              style={{
                marginLeft: isLoggedIn ? (sidebarOpen ? 250 : 70) : 0,
                transition: 'margin-left 0.3s cubic-bezier(0.4,0,0.2,1)',
                width: isLoggedIn ? (sidebarOpen ? 'calc(100vw - 250px)' : 'calc(100vw - 70px)') : '100vw',
                minWidth: 0,
                overflowX: 'auto',
                position: 'relative',
                zIndex: 1,
                paddingTop: '60px', // Account for navbar height
              }}
            >
              <Routes>
                <Route path="/" element={<Navigate to={isLoggedIn ? '/home' : '/login'} replace />} />
                <Route path="/login" element={isLoggedIn ? <Navigate to="/home" replace /> : <Login />} />
                <Route path="/home" element={isLoggedIn ? <Home /> : <Navigate to="/login" replace />} />
                <Route path="/user-projects" element={isLoggedIn ? <UserProjects /> : <Navigate to="/login" replace />} />
                <Route path="/profile" element={isLoggedIn ? <Profile /> : <Navigate to="/login" replace />} />
                <Route path="/create-user" element={isLoggedIn ? <CreateUser /> : <Navigate to="/login" replace />} />
                <Route path="/manage-project-team/:projectId" element={isLoggedIn ? <ManageProjectTeam /> : <Navigate to="/login" replace />} />
                <Route path="/create-project-manager" element={isLoggedIn ? <CreateProjectManager /> : <Navigate to="/login" replace />} />
                <Route path="/backlog" element={isLoggedIn ? <BacklogPage /> : <Navigate to="/login" replace />} />
                <Route path="/sprints" element={isLoggedIn ? <SprintsPage /> : <Navigate to="/login" replace />} />
                <Route path="/history" element={isLoggedIn ? <HistoryPage /> : <Navigate to="/login" replace />} />
                <Route path="/all-projects" element={isLoggedIn ? <AllProjects /> : <Navigate to="/login" replace />} />
                <Route path="/help" element={<Help />} />
                <Route path="*" element={<h2>404 - Page Not Found</h2>} />
              </Routes>
            </div>

            {/* Overlay on small screens */}
            {sidebarOpen && window.innerWidth < 992 && (
              <div
                className="sidebar-overlay"
                onClick={() => setSidebarOpen(false)}
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  width: '100vw',
                  height: '100vh',
                  background: 'rgba(0,0,0,0.3)',
                  zIndex: 1019,
                }}
              />
            )}
          </div>
        </ProjectProvider>
      </BrowserRouter>
    </ProjectSearchContext.Provider>
  );
}

export default App;
