import api from './api';

/**
 * Watchman login
 * @param {String} email - Watchman email
 * @param {String} password - Watchman password
 * @returns {Object} Watchman data and token
 */
const watchmanLogin = async (email, password) => {
  try {
    const response = await api.post('/watchmen/login', { email, password });
    
    // Extract data from response
    const { token, watchman } = response.data;
    
    // Store watchman token separately (different from user token)
    localStorage.setItem('watchman_token', token);
    
    // Store watchman data
    localStorage.setItem('watchman', JSON.stringify(watchman));
    
    // Return watchman data
    return { watchman, token };
  } catch (error) {
    throw new Error(error.message || 'Watchman login failed');
  }
};

/**
 * Scan QR code to get booking details
 * @param {String} qr_code_data - QR code data string
 * @returns {Object} Booking details for verification
 */
const scanQR = async (qr_code_data) => {
  try {
    const response = await api.post('/watchmen/scan-qr', { qr_code_data });
    return response.data;
  } catch (error) {
    throw new Error(error.message || 'Failed to scan QR code');
  }
};

/**
 * Verify vehicle entry
 * @param {Number} booking_id - Booking ID
 * @returns {Object} Entry confirmation with details
 */
const verifyEntry = async (booking_id) => {
  try {
    const response = await api.post('/watchmen/verify-entry', { booking_id });
    return response.data;
  } catch (error) {
    throw new Error(error.message || 'Failed to verify entry');
  }
};

/**
 * Verify vehicle exit
 * @param {Number} booking_id - Booking ID
 * @returns {Object} Exit confirmation with duration and payment status
 */
const verifyExit = async (booking_id) => {
  try {
    const response = await api.post('/watchmen/verify-exit', { booking_id });
    return response.data;
  } catch (error) {
    throw new Error(error.message || 'Failed to verify exit');
  }
};

/**
 * Get walk-in users waiting for assistance
 * @returns {Array} Array of walk-in users with wait time
 */
const getWalkInUsers = async () => {
  try {
    const response = await api.get('/watchmen/assist-walkin');
    return response.data;
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch walk-in users');
  }
};

/**
 * Assign parking slot to walk-in user
 * @param {Object} userData - Walk-in user data
 * @param {Number} userData.user_id - User ID
 * @param {String} userData.vehicle_number - Vehicle number
 * @param {Number} userData.estimated_duration - Duration in hours
 * @returns {Object} Slot assignment details
 */
const assignSlotToWalkIn = async (userData) => {
  try {
    const response = await api.post('/watchmen/assign-slot-walkin', userData);
    return response.data;
  } catch (error) {
    throw new Error(error.message || 'Failed to assign slot');
  }
};

/**
 * Record cash payment from user
 * @param {Number} booking_id - Booking ID
 * @param {Number} amount - Payment amount
 * @returns {Object} Payment confirmation
 */
const recordCashPayment = async (booking_id, amount) => {
  try {
    const response = await api.post('/watchmen/cash-payment', {
      booking_id,
      amount
    });
    return response.data;
  } catch (error) {
    throw new Error(error.message || 'Failed to record cash payment');
  }
};

/**
 * Get current parking status
 * @returns {Object} Current status with active bookings, walk-ins, available slots
 */
const getCurrentStatus = async () => {
  try {
    const response = await api.get('/watchmen/current-status');
    return response.data;
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch current status');
  }
};

/**
 * Watchman logout
 * Clears watchman data from localStorage
 */
const watchmanLogout = () => {
  // Clear watchman-specific localStorage
  localStorage.removeItem('watchman_token');
  localStorage.removeItem('watchman');
  
  // Redirect to watchman login page
  window.location.href = '/watchman/login';
};

/**
 * Get current watchman from localStorage
 * @returns {Object|null} Watchman object or null
 */
const getCurrentWatchman = () => {
  try {
    const watchmanStr = localStorage.getItem('watchman');
    if (!watchmanStr) {
      return null;
    }
    return JSON.parse(watchmanStr);
  } catch (error) {
    console.error('Error parsing watchman data:', error);
    return null;
  }
};

/**
 * Check if watchman is authenticated
 * @returns {Boolean} True if authenticated
 */
const isWatchmanAuthenticated = () => {
  const token = localStorage.getItem('watchman_token');
  return token !== null && token !== undefined && token !== '';
};

// Export all functions
const watchmanService = {
  watchmanLogin,
  scanQR,
  verifyEntry,
  verifyExit,
  getWalkInUsers,
  assignSlotToWalkIn,
  recordCashPayment,
  getCurrentStatus,
  watchmanLogout,
  getCurrentWatchman,
  isWatchmanAuthenticated
};

export default watchmanService;

