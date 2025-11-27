import api from './api';

/**
 * Simulate online payment (PSEUDO implementation)
 * @param {Number} booking_id - Booking ID
 * @param {Number} amount - Payment amount
 * @param {String} payment_method_type - Payment method (card, upi, netbanking)
 * @returns {Object} Transaction details with success message
 */
const simulateOnlinePayment = async (booking_id, amount, payment_method_type = 'card') => {
  try {
    // Simulate processing delay on frontend (2 seconds)
    // Note: Backend also simulates 2-second delay, so total is ~4 seconds
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Make API call (backend will add another 2-second delay)
    const response = await api.post('/payments/simulate-online', {
      booking_id,
      amount,
      payment_method_type
    });
    
    // Return transaction details
    return response.data;
  } catch (error) {
    throw new Error(error.message || 'Payment simulation failed');
  }
};

/**
 * Initiate payment process
 * @param {Number} booking_id - Booking ID
 * @returns {Object} Payment initiation data with amount and gateway URL
 */
const initiatePayment = async (booking_id) => {
  try {
    const response = await api.post('/payments/initiate', { booking_id });
    return response.data;
  } catch (error) {
    throw new Error(error.message || 'Failed to initiate payment');
  }
};

/**
 * Verify payment status
 * @param {String} transaction_id - Transaction ID from payment gateway
 * @param {Number} booking_id - Booking ID
 * @returns {Object} Verification result with payment status
 */
const verifyPayment = async (transaction_id, booking_id) => {
  try {
    const response = await api.post('/payments/verify', {
      transaction_id,
      booking_id
    });
    return response.data;
  } catch (error) {
    throw new Error(error.message || 'Payment verification failed');
  }
};

/**
 * Get payment details for a booking
 * @param {Number} booking_id - Booking ID
 * @returns {Object} Payment information
 */
const getPaymentDetails = async (booking_id) => {
  try {
    const response = await api.get(`/payments/booking/${booking_id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch payment details');
  }
};

/**
 * Get organization revenue data (admin only)
 * @param {Number} orgId - Organization ID
 * @param {Object} dateRange - Optional date range filter
 * @param {String} dateRange.start_date - Start date (YYYY-MM-DD)
 * @param {String} dateRange.end_date - End date (YYYY-MM-DD)
 * @returns {Object} Revenue data with breakdown
 */
const getOrganizationRevenue = async (orgId, dateRange = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (dateRange.start_date) queryParams.append('start_date', dateRange.start_date);
    if (dateRange.end_date) queryParams.append('end_date', dateRange.end_date);
    
    const queryString = queryParams.toString();
    const url = `/payments/organization-revenue/${orgId}${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch revenue data');
  }
};

/**
 * Get payment history for current user
 * @returns {Array} Array of payment records
 */
const getPaymentHistory = async () => {
  try {
    const response = await api.get('/payments/history');
    return response.data;
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch payment history');
  }
};

// Export all functions
const paymentService = {
  simulateOnlinePayment,
  initiatePayment,
  verifyPayment,
  getPaymentDetails,
  getOrganizationRevenue,
  getPaymentHistory
};

export default paymentService;

