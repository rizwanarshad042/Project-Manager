import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

const Help = () => {
  const theme = useSelector((state) => state.theme.mode);
  const isLoggedIn = useSelector((state) => state.login.isLoggedIn);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
    }
  }, [isLoggedIn, navigate]);

  return (
    <div
      className="container-fluid d-flex justify-content-center align-items-center"
      style={{
        background: theme === 'dark' 
          ? 'linear-gradient(135deg, #0f1419 0%, #1a1f2e 50%, #181c24 100%)' 
          : 'linear-gradient(135deg, #f8faff 0%, #e3f2fd 50%, #f4f6fb 100%)',
        color: theme === 'dark' ? '#f8f8f8' : '#181c24',
        minHeight: '100vh',
        transition: 'all 0.3s ease-in-out',
        overflow: 'hidden'
      }}
    >
      <div
        className="shadow-lg p-5 rounded-4 border-0"
        style={{
          background: theme === 'dark' 
            ? 'linear-gradient(145deg, #23272f 0%, #2b2f36 100%)' 
            : 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
          color: theme === 'dark' ? '#f8f8f8' : '#181c24',
          width: '90%',
          maxWidth: '600px',
          textAlign: 'center',
          transition: 'all 0.3s ease-in-out',
          boxShadow: theme === 'dark' 
            ? '0 20px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)' 
            : '0 20px 40px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <h1 style={{ fontWeight: 'bold', fontSize: '2rem' }}>Help Center</h1>
        <p style={{ fontSize: '1rem', opacity: 0.9 }}>
          Need assistance? Here you can find answers to common questions and get support.
        </p>
        <ul className="list-group list-group-flush mb-4" style={{ background: 'transparent' }}>
          <li className="list-group-item" style={{ background: 'transparent', color: theme === 'dark' ? '#fff' : '#181c24' }}>
            <strong>How do I reset my password?</strong><br />Go to your profile and click on 'Reset Password'.
          </li>
          <li className="list-group-item" style={{ background: 'transparent', color: theme === 'dark' ? '#fff' : '#181c24' }}>
            <strong>How do I contact support?</strong><br />Email us at <a href="mailto:support@example.com">support@example.com</a>.
          </li>
          <li className="list-group-item" style={{ background: 'transparent', color: theme === 'dark' ? '#fff' : '#181c24' }}>
            <strong>How do I switch themes?</strong><br />Use the theme toggle button in the navigation bar.
          </li>
        </ul>
        <div style={{ fontSize: '0.95rem', opacity: 0.7 }}>
          If you need further help, please reach out to our support team.
        </div>
      </div>
    </div>
  );
};

export default Help;