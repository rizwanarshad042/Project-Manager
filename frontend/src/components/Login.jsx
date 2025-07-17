import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

const schema = yup.object().shape({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().required('Password is required')
});

function Login({ onLogin }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema)
  });

  const navigate = useNavigate();

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

      let result;
      try {
        result = await response.json();
      } catch (e) {
        console.error('❌ Error parsing server response:', e);
        alert('Server returned invalid response');
        return;
      }

      if (!response.ok) {
        alert(result.message || 'Login failed');
        return;
      }

      onLogin(result);
      navigate('/home');
    } catch (error) {
      console.error('❌ Network or server error:', error);
      alert('Server error during login');
    }
  };

  return (
   <div className="d-flex justify-content-center align-items-center vh-100 w-100 bg-light position-absolute top-50 start-50 translate-middle">
  <div className="border shadow-lg p-5 rounded bg-white" style={{ width: '500px' }}>
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <h2 className="text-center mb-4">Login</h2>

      <div className="mb-4">
        <input
          className={`form-control ${errors.email ? 'is-invalid' : ''} form-control-lg`}
          {...register('email')}
          placeholder="Email"
        />
        <div className="invalid-feedback">{errors.email?.message}</div>
      </div>

      <div className="mb-4">
        <input
          type="password"
          className={`form-control ${errors.password ? 'is-invalid' : ''} form-control-lg`}
          {...register('password')}
          placeholder="Password"
        />
        <div className="invalid-feedback">{errors.password?.message}</div>
      </div>

      <button type="submit" className="btn btn-primary btn-lg w-100">
        Login
      </button>
    </form>
  </div>
</div>

  );
}

export default Login;
       