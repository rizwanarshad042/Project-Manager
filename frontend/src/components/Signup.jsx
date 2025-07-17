import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate, Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

const schema = yup.object().shape({
  username: yup.string().required('Username is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  age: yup.number().typeError('Age must be a number').required('Age is required'),
  phone: yup.string().required('Phone is required'),
  password: yup.string().required('Password is required'),
  terms: yup.bool().oneOf([true], 'You must accept the terms and conditions'),
});

function Signup() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      const response = await fetch('http://localhost:3001/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        alert('Signup successful');
        navigate('/login');
      } else {
        console.error('Server responded with error:', result);
        alert(`Signup failed: ${result.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Signup error:', error);
      alert('Server error');
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 w-100 bg-light position-fixed top-0 start-0">
  <div className="border shadow-lg p-5 rounded bg-white" style={{ width: '500px', maxHeight: '80vh', overflowY: 'auto' }}>
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <h2 className="text-center mb-4">Signup</h2>

      <div className="mb-4">
        <input
          className={`form-control ${errors.username ? 'is-invalid' : ''} form-control-lg`}
          {...register('username')}
          placeholder="Username"
        />
        <div className="invalid-feedback">{errors.username?.message}</div>
      </div>

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
          className={`form-control ${errors.age ? 'is-invalid' : ''} form-control-lg`}
          {...register('age')}
          placeholder="Age"
        />
        <div className="invalid-feedback">{errors.age?.message}</div>
      </div>

      <div className="mb-4">
        <input
          className={`form-control ${errors.phone ? 'is-invalid' : ''} form-control-lg`}
          {...register('phone')}
          placeholder="Phone"
        />
        <div className="invalid-feedback">{errors.phone?.message}</div>
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

      <div className="mb-3">
        <div className="form-check">
          <input
            className="form-check-input"
            type="checkbox"
            {...register('terms')}
            id="terms"
          />
          <label className="form-check-label" htmlFor="terms">
            I accept the{' '}
            <Link to="/terms">Terms and Conditions</Link>
          </label>
        </div>
        {errors.terms && <p className="text-danger">{errors.terms.message}</p>}
      </div>

      <button type="submit" className="btn btn-primary btn-lg w-100">
        Register
      </button>
    </form>
  </div>
</div>

  );
}

export default Signup;
