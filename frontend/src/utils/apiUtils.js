// API utility functions for making authenticated requests to the backend

const API_BASE_URL = 'http://localhost:3001/api';

/**
 * Makes an authenticated API request to the backend
 * @param {string} endpoint - The API endpoint (without /api prefix)
 * @param {Object} options - Request options (method, body, etc.)
 * @param {Function} navigate - React Router navigate function for redirecting on auth errors
 * @returns {Promise} - The API response data
 */
export const apiRequestWithAuth = async (endpoint, options = {}, navigate = null) => {
  try {
    // Get the auth token from sessionStorage (matching the login storage)
    const userData = sessionStorage.getItem('loggedInUser');
    let token = null;
    
    if (userData) {
      try {
        const user = JSON.parse(userData);
        token = user.token;
      } catch (error) {
        console.error('Error parsing user data from sessionStorage:', error);
      }
    }
    
    if (!token) {
      console.error('No authentication token found');
      if (navigate) {
        navigate('/login');
      }
      throw new Error('Authentication required');
    }

    // Prepare the request configuration
    const config = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
      },
      ...options
    };

    // Add body for POST/PUT requests
    if (options.body && (config.method === 'POST' || config.method === 'PUT')) {
      config.body = JSON.stringify(options.body);
    }

    // Make the request
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    // Handle different response statuses
    if (response.status === 401) {
      console.error('Authentication failed - token may be expired');
      sessionStorage.removeItem('loggedInUser');
      if (navigate) {
        navigate('/login');
      }
      throw new Error('Authentication required');
    }

    if (response.status === 403) {
      console.error('Access forbidden');
      throw new Error('Access forbidden');
    }

    if (response.status === 404) {
      console.error('Resource not found');
      throw new Error('Resource not found');
    }

    if (response.status === 429) {
      console.error('Too many requests');
      throw new Error('Too many requests. Please try again later.');
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API request failed:', response.status, errorText);
      throw new Error(errorText || `HTTP ${response.status}`);
    }

    // Parse and return the response
    const data = await response.json();
    return data;

  } catch (error) {
    console.error('API request error:', error);
    
    // Re-throw authentication errors
    if (error.message === 'Authentication required') {
      throw error;
    }
    
    // Handle network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Network error - please check your connection');
    }
    
    throw error;
  }
};

/**
 * Makes a simple API request without authentication
 * @param {string} endpoint - The API endpoint (without /api prefix)
 * @param {Object} options - Request options
 * @returns {Promise} - The API response data
 */
export const apiRequest = async (endpoint, options = {}) => {
  try {
    const config = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    if (options.body && (config.method === 'POST' || config.method === 'PUT')) {
      config.body = JSON.stringify(options.body);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `HTTP ${response.status}`);
    }

    return await response.json();

  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
};

/**
 * Login function that stores the token
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise} - Login response with user data and token
 */
export const loginUser = async (email, password) => {
  try {
    const response = await apiRequest('/login', {
      method: 'POST',
      body: { email, password }
    });

    // Store the token in sessionStorage (matching the existing login flow)
    if (response.token) {
      sessionStorage.setItem('loggedInUser', JSON.stringify(response));
    }

    return response;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

/**
 * Logout function that clears stored data
 */
export const logoutUser = () => {
  sessionStorage.removeItem('loggedInUser');
};

/**
 * Gets the current user data from sessionStorage
 * @returns {Object|null} - User data or null if not logged in
 */
export const getCurrentUser = () => {
  const userStr = sessionStorage.getItem('loggedInUser');
  return userStr ? JSON.parse(userStr) : null;
};

/**
 * Checks if user is authenticated
 * @returns {boolean} - True if user has a valid token
 */
export const isAuthenticated = () => {
  const userData = sessionStorage.getItem('loggedInUser');
  if (!userData) return false;
  
  try {
    const user = JSON.parse(userData);
    return !!user.token;
  } catch (error) {
    return false;
  }
}; 