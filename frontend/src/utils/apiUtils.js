import axios from 'axios';

const BASE_URL = 'http://localhost:3001/api';

// Helper to get stored token
export const getStoredToken = () => {
  try {
    const userData = JSON.parse(sessionStorage.getItem('loggedInUser'));
    return userData?.token;
  } catch (error) {
    console.error('Error reading token:', error);
    return null;
  }
};

// API request with authentication
export const apiRequestWithAuth = async (endpoint, options = {}) => {
  const token = getStoredToken();
  
  if (!token) {
    throw new Error('Authentication required');
  }

  try {
    const response = await axios({
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    return response.data;
  } catch (error) {
    console.error('API request error:', error);
    if (error.response?.status === 401) {
      // Clear invalid token
      sessionStorage.removeItem('loggedInUser');
      throw new Error('Session expired. Please login again.');
    }
    throw error;
  }
};

// Public API request (no auth required)
export const apiRequest = async (endpoint, options = {}) => {
  try {
    const response = await axios({
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    return response.data;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
};