import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginSuccess } from '../features/Login';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const schema = yup.object().shape({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().required('Password is required')
});

function Login() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema)
  });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const error = useSelector((state) => state.login.error);
  const theme = useSelector((state) => state.theme.mode);
  const [showPassword, setShowPassword] = useState(false);

  // Theme is now handled globally in theme.css

  // Input styling is now handled globally in theme.css

  const onSubmit = async (data) => {
    try {
      const response = await fetch('http://localhost:3001/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          password: data.password
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        alert(result.message || 'Login failed');
        return;
      }

      dispatch(loginSuccess(result));
      sessionStorage.setItem('loggedInUser', JSON.stringify(result));
      navigate('/home');
    } catch (error) {
      console.error('❌ Login error:', error);
      alert('Server error during login');
    }
  };

  return (
    <div
      className="d-flex justify-content-center align-items-center vh-100 themed-container"
      style={{
        background: theme === 'dark'? 'linear-gradient(135deg, #0f1419 0%, #1a1f2e 50%, #181c24 100%)' 
                                    : 'linear-gradient(135deg, #f8faff 0%, #e3f2fd 50%, #f4f6fb 100%)',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <style>{`
        html, body {
          margin: 0;
          height: 100% !important;
          width: 100% !important;
          overflow: hidden !important;
        }
      `}</style>
      <div
        className="border shadow-lg p-4 rounded themed-card"
        style={{
          width: '100%',
          maxWidth: '320px',
          transition: 'all 0.3s ease',
        }}
      >
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* Logo */}
          <div className="text-center mb-4">
            <img
              src="/favicon.png"
              alt="TaskMaster Logo"
              width="48"
              height="48"
              className="mb-2"
              style={{
                borderRadius: '50%',
                border: '2px solid var(--border-primary)',
                padding: '5px',
                backgroundColor: 'var(--bg-secondary)',
                imageRendering: 'crisp-edges',
                WebkitImageRendering: 'crisp-edges',
                MozImageRendering: 'crisp-edges'
              }}
            />
          </div>

          <h3 className="text-center mb-3">Login</h3>

          {error && <div className="alert alert-danger">{error}</div>}

          <div className="mb-2">
            <input
              {...register('email')}
              placeholder="Email"
              className="form-control themed-input"
              style={{
                borderColor: errors.email ? '#dc3545' : '',
                backgroundImage: 'none'  // Removes validation icons
              }}
            />
            <div className="invalid-feedback" style={{ display: errors.email ? 'block' : 'none' }}>
              {errors.email?.message}
            </div>
          </div>

          <div className="mb-2">
            <div className="position-relative">
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                placeholder="Password"
                className="form-control themed-input"
                style={{
                  borderColor: errors.password ? '#dc3545' : '',
                  backgroundImage: 'none',  // Removes validation icons
                  paddingRight: '40px'  // Space for eye icon
                }}
              />
              <button
                type="button"
                className="btn btn-link position-absolute"
                onClick={() => setShowPassword(!showPassword)}
                style={{ 
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  padding: '4px',
                  background: 'none',
                  border: 'none',
                  color: '#6c757d',
                  zIndex: 10 
                }}
                tabIndex={-1}
              >
                {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
              </button>
            </div>
            <div className="invalid-feedback" style={{ display: errors.password ? 'block' : 'none' }}>
              {errors.password?.message}
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100 mt-2"
            style={{ fontSize: '1rem', padding: '0.6rem' }}
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
