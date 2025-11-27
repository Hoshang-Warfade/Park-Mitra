import api from './api';

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @param {String} userData.name - User's full name
 * @param {String} userData.email - User's email
 * @param {String} userData.mobile - User's mobile number
 * @param {String} userData.password - User's password
 * @param {String} userData.user_type - User type (visitor, organization_member, walk_in)
 * @param {Number} userData.organization_id - Organization ID (for members)
 * @param {String} userData.employee_id - Employee ID (for members)
 * @returns {Object} Response data with user details
 */
const register = async (userData) => {
  try {
    const response = await api.post('/auth/register', userData);
    // Response interceptor already returns response.data
    return response.data;
  } catch (error) {
    throw new Error(error.message || 'Registration failed');
  }
};

/**
 * Login user
 * @param {String} email - User's email or employee ID
 * @param {String} password - User's password
 * @param {String} organizationId - Organization ID (optional, required for members/watchmen)
 * @returns {Object} User data and token
 */
const login = async (email, password, organizationId = null) => {
  try {
    const payload = { email, password };
    
    // Add organization_id if provided (for members/watchmen)
    if (organizationId) {
      payload.organization_id = organizationId;
    }
    
    const response = await api.post('/auth/login', payload);
    
    // Response interceptor returns response.data which contains { success, message, data }
    // Extract token and user from response.data
    const { token, user } = response.data;
    
    // Store token in localStorage
    localStorage.setItem('token', token);
    
    // Store user data in localStorage
    localStorage.setItem('user', JSON.stringify(user));
    
    // Return user and token
    return { user, token };
  } catch (error) {
    throw new Error(error.message || 'Login failed');
  }
};

/**
 * Register a new organization with admin user
 * @param {Object} orgData - Organization registration data
 * @returns {Object} Response data with organization and admin details
 */
const registerOrganization = async (orgData) => {
  try {
    const response = await api.post('/auth/register-organization', orgData);
    // Response interceptor already returns response.data
    return response.data;
  } catch (error) {
    throw new Error(error.message || 'Organization registration failed');
  }
};

/**
 * Logout user
 * Clears localStorage and redirects to login page
 */
const logout = () => {
  // Clear localStorage
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  
  // Redirect to login page
  window.location.href = '/login';
};

/**
 * Get current user from localStorage
 * @returns {Object|null} User object or null if not found
 */
const getCurrentUser = () => {
  try {
    // Get user from localStorage
    const userStr = localStorage.getItem('user');
    
    // Return null if not found
    if (!userStr) {
      return null;
    }
    
    // Parse and return user object
    return JSON.parse(userStr);
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
};

/**
 * Get authentication token from localStorage
 * @returns {String|null} Token or null if not found
 */
const getToken = () => {
  // Get token from localStorage
  const token = localStorage.getItem('token');
  
  // Return token or null
  return token || null;
};

/**
 * Check if user is authenticated
 * @returns {Boolean} True if authenticated, false otherwise
 */
const isAuthenticated = () => {
  // Check if token exists in localStorage
  const token = getToken();
  
  // Return boolean
  return token !== null && token !== undefined && token !== '';
};

/**
 * Verify if user is a valid organization member
 * @param {Number} user_id - User ID
 * @param {Number} organization_id - Organization ID
 * @returns {Object} Verification result
 */
const verifyMember = async (user_id, organization_id) => {
  try {
    const response = await api.post('/auth/verify-member', {
      user_id,
      organization_id
    });
    
    // Response interceptor already returns response.data
    return response.data;
  } catch (error) {
    throw new Error(error.message || 'Member verification failed');
  }
};

/**
 * Get user profile
 * @returns {Object} User profile data
 */
const getProfile = async () => {
  try {
    const response = await api.get('/auth/profile');
    // Response interceptor already returns response.data
    return response.data;
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch profile');
  }
};

/**
 * Update user profile
 * @param {Object} userData - Updated user data
 * @returns {Object} Updated user data
 */
const updateProfile = async (userData) => {
  try {
    const response = await api.put('/auth/profile', userData);
    
    // Response interceptor already returns response.data
    // Update localStorage with new user data
    if (response && response.user) {
      localStorage.setItem('user', JSON.stringify(response.user));
    }
    
    return response.data;
  } catch (error) {
    throw new Error(error.message || 'Profile update failed');
  }
};

/**
 * Change user password
 * @param {Object} passwords - Old and new passwords
 * @param {String} passwords.oldPassword - Current password
 * @param {String} passwords.newPassword - New password
 * @returns {Object} Success response
 */
const changePassword = async (passwords) => {
  try {
    const response = await api.post('/auth/change-password', passwords);
    // Response interceptor already returns response.data
    return response.data;
  } catch (error) {
    throw new Error(error.message || 'Password change failed');
  }
};

// Export all functions as object
const authService = {
  register,
  login,
  registerOrganization,
  logout,
  getCurrentUser,
  getToken,
  isAuthenticated,
  verifyMember,
  getProfile,
  updateProfile,
  changePassword
};

export default authService;

