import api from './api';

/**
 * Create a new booking
 * @param {Object} bookingData - Booking details
 * @param {Number} bookingData.organization_id - Organization ID
 * @param {String} bookingData.vehicle_number - Vehicle registration number
 * @param {String} bookingData.booking_start_time - Start time (ISO format)
 * @param {String} bookingData.booking_end_time - End time (ISO format)
 * @returns {Object} Created booking with QR code
 */
const createBooking = async (bookingData) => {
  try {
    const response = await api.post('/bookings/create', bookingData);
    // api interceptor returns response.data which is { success, message, data: { booking } }
    // Extract the booking object from data
    return response.data.booking;
  } catch (error) {
    console.error('Error in createBooking service:', error);
    throw new Error(error.response?.data?.error || error.message || 'Failed to create booking');
  }
};

/**
 * Get all bookings for a specific user
 * @param {Number} userId - User ID
 * @returns {Array} Array of user's bookings
 */
const getUserBookings = async (userId) => {
  try {
    const response = await api.get(`/bookings/user/${userId}`);
    // api interceptor returns response.data which contains { success, data: { bookings } }
    return response.data.bookings || [];  // Extract bookings array
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch user bookings');
  }
};

/**
 * Get all bookings for an organization
 * @param {Number} orgId - Organization ID
 * @param {Object} filters - Optional filters
 * @param {String} filters.status - Filter by status (active, completed, cancelled)
 * @param {String} filters.start_date - Filter by start date (YYYY-MM-DD)
 * @param {String} filters.end_date - Filter by end date (YYYY-MM-DD)
 * @returns {Array} Array of organization bookings
 */
const getOrganizationBookings = async (orgId, filters = {}) => {
  try {
    // Build query params
    const queryParams = new URLSearchParams();
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.start_date) queryParams.append('start_date', filters.start_date);
    if (filters.end_date) queryParams.append('end_date', filters.end_date);
    
    const queryString = queryParams.toString();
    const url = `/bookings/organization/${orgId}${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get(url);
    return response.data;  // Extract data from { success, message, data }
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch organization bookings');
  }
};

/**
 * Check slot availability for an organization
 * @param {Number} organization_id - Organization ID
 * @returns {Object} Availability status with slot information
 */
const checkAvailability = async (organization_id) => {
  try {
    const response = await api.get(`/bookings/check-availability/${organization_id}`);
    return response.data;  // Extract data from { success, message, data }
  } catch (error) {
    throw new Error(error.message || 'Failed to check availability');
  }
};

/**
 * Get active bookings for an organization
 * @param {Number} orgId - Organization ID
 * @returns {Array} Array of active bookings
 */
const getActiveBookings = async (orgId) => {
  try {
    const response = await api.get(`/bookings/active/${orgId}`);
    return response.data;  // Extract data from { success, message, data }
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch active bookings');
  }
};

/**
 * Update booking status
 * @param {Number} bookingId - Booking ID
 * @param {String} status - New status (active, completed, cancelled)
 * @returns {Object} Updated booking details
 */
const updateBookingStatus = async (bookingId, status) => {
  try {
    const response = await api.put(`/bookings/update-status/${bookingId}`, { status });
    return response.data;  // Extract data from { success, message, data }
  } catch (error) {
    throw new Error(error.message || 'Failed to update booking status');
  }
};

/**
 * Get booking by ID
 * @param {Number} id - Booking ID
 * @returns {Object} Booking details
 */
const getBookingById = async (id) => {
  try {
    console.log('🔍 bookingService.getBookingById: Fetching ID:', id);
    const response = await api.get(`/bookings/${id}`);
    console.log('✅ bookingService.getBookingById: Response:', response);
    console.log('📋 bookingService.getBookingById: Response keys:', Object.keys(response));
    console.log('🔑 bookingService.getBookingById: response.data:', response.data);
    
    if (response.data) {
      console.log('🔑 bookingService.getBookingById: response.data keys:', Object.keys(response.data));
      console.log('🔑 bookingService.getBookingById: response.data.booking:', response.data.booking);
    }
    
    // Axios interceptor returns response.data, which is { success: true, data: { booking: {...} } }
    // Try to extract booking - handle multiple possible structures
    let booking = null;
    
    if (response.data && response.data.booking) {
      // Structure: { success: true, data: { booking: {...} } }
      booking = response.data.booking;
      console.log('📦 Extracted from response.data.booking');
    } else if (response.booking) {
      // Structure: { success: true, booking: {...} } (after interceptor strips one layer)
      booking = response.booking;
      console.log('📦 Extracted from response.booking');
    } else if (response.data && response.data.id) {
      // Structure: { success: true, data: {...booking fields...} }
      booking = response.data;
      console.log('📦 Extracted from response.data (booking object directly)');
    } else if (response.id) {
      // Structure: booking object is at root
      booking = response;
      console.log('📦 Using response directly as booking');
    }
    
    console.log('📦 bookingService.getBookingById: Final booking:', booking);
    console.log('📦 bookingService.getBookingById: Booking keys:', booking ? Object.keys(booking) : 'NULL');
    
    return booking;
  } catch (error) {
    console.error('❌ bookingService.getBookingById: Error:', error);
    throw new Error(error.message || 'Failed to fetch booking details');
  }
};

/**
 * Cancel a booking
 * @param {Number} id - Booking ID
 * @returns {Object} Cancellation confirmation
 */
const cancelBooking = async (id) => {
  try {
    const response = await updateBookingStatus(id, 'cancelled');
    return response.data;
  } catch (error) {
    throw new Error(error.message || 'Failed to cancel booking');
  }
};

/**
 * Mark entry for a booking (watchman use)
 * @param {Number} booking_id - Booking ID
 * @param {String} entry_time - Entry timestamp (ISO format)
 * @returns {Object} Updated booking with entry details
 */
const markEntry = async (booking_id, entry_time = new Date().toISOString()) => {
  try {
    const response = await api.post('/bookings/mark-entry', {
      booking_id,
      entry_time
    });
    return response.data;  // Extract data from { success, message, data }
  } catch (error) {
    throw new Error(error.message || 'Failed to mark entry');
  }
};

/**
 * Mark exit for a booking (watchman use)
 * @param {Number} booking_id - Booking ID
 * @param {String} exit_time - Exit timestamp (ISO format)
 * @returns {Object} Updated booking with exit details and final amount
 */
const markExit = async (booking_id, exit_time = new Date().toISOString()) => {
  try {
    const response = await api.post('/bookings/mark-exit', {
      booking_id,
      exit_time
    });
    return response.data;  // Extract data from { success, message, data }
  } catch (error) {
    throw new Error(error.message || 'Failed to mark exit');
  }
};

/**
 * Check if booking can be extended with same slot
 * @param {Number} bookingId - Booking ID
 * @param {Number} extensionHours - Number of hours to extend
 * @returns {Object} Extension availability info
 */
const checkExtension = async (bookingId, extensionHours) => {
  try {
    const response = await api.post(`/bookings/check-extension/${bookingId}`, {
      extension_hours: extensionHours
    });
    return response.data;  // Extract data from { success, data }
  } catch (error) {
    throw new Error(error.message || 'Failed to check extension availability');
  }
};

/**
 * Extend booking duration
 * @param {Number} bookingId - Booking ID
 * @param {Number} extensionHours - Number of hours to extend
 * @returns {Object} Extended booking details
 */
const extendBooking = async (bookingId, extensionHours) => {
  try {
    const response = await api.put(`/bookings/extend/${bookingId}`, {
      extension_hours: extensionHours
    });
    return response.data;  // Extract data from { success, message, data }
  } catch (error) {
    throw new Error(error.message || 'Failed to extend booking');
  }
};

/**
 * Auto-expire bookings that have passed their end time (marks as overstay)
 * @returns {Object} Result with count of overstay bookings
 */
const autoExpireBookings = async () => {
  try {
    const response = await api.post('/bookings/auto-expire');
    return response.data;
  } catch (error) {
    throw new Error(error.message || 'Failed to detect overstay bookings');
  }
};

/**
 * Mark exit with penalty for overstay booking
 * @param {Number} bookingId - Booking ID
 * @returns {Object} Updated booking with penalty details
 */
const markExitWithPenalty = async (bookingId) => {
  try {
    const response = await api.post(`/bookings/mark-exit-with-penalty/${bookingId}`);
    return response.data;
  } catch (error) {
    throw new Error(error.message || 'Failed to mark exit with penalty');
  }
};

// Export all functions
const bookingService = {
  createBooking,
  getUserBookings,
  getOrganizationBookings,
  checkAvailability,
  getActiveBookings,
  updateBookingStatus,
  getBookingById,
  cancelBooking,
  markEntry,
  markExit,
  checkExtension,
  extendBooking,
  autoExpireBookings,
  markExitWithPenalty
};

export default bookingService;


