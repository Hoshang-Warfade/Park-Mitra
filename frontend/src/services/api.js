import axios from 'axios';

/**
 * Create axios instance with base configuration
 */
const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 10000, // 10 seconds
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Request interceptor
 * Adds authentication token to all requests
 */
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    // If token exists, add to Authorization header as Bearer token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Return config
    return config;
  },
  (error) => {
    // Handle request error
    return Promise.reject(error);
  }
);

/**
 * Response interceptor
 * Handles successful responses and errors
 */
api.interceptors.response.use(
  (response) => {
    // Return response.data on success
    return response.data;
  },
  (error) => {
    // Check if 401 (unauthorized)
    if (error.response && error.response.status === 401) {
      // Check if this is a login attempt (don't redirect during login)
      const isLoginAttempt = error.config?.url?.includes('/auth/login');
      
      // Only redirect to login if this is NOT a login attempt
      // (i.e., user is already logged in but token expired/invalid)
      if (!isLoginAttempt) {
        // Clear localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Redirect to login
        window.location.href = '/login';
      }
      // If it IS a login attempt, let the login form handle the error
    }
    
    // Extract error message
    const errorMessage = 
      error.response?.data?.message || 
      error.response?.data?.error || 
      error.message || 
      'An unexpected error occurred';
    
    // Return Promise.reject with error message
    return Promise.reject(new Error(errorMessage));
  }
);

// Export configured axios instance
export default api;
