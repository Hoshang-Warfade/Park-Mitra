// Informal Parking Service - API calls for street parking
import api from './api';

/**
 * Get nearby informal parking locations based on coordinates
 * @param {number} latitude - User's latitude
 * @param {number} longitude - User's longitude
 * @param {number} radius - Search radius in kilometers (optional)
 * @returns {Promise<Array>} Array of nearby parking locations
 */
const getNearbyParking = async (latitude, longitude, radius = 5) => {
  try {
    const response = await api.get('/informal-parking/nearby', {
      params: {
        latitude,
        longitude,
        radius
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching nearby parking:', error);
    throw new Error(
      error.response?.data?.message || 
      'Failed to fetch nearby parking locations. Please try again.'
    );
  }
};

/**
 * Get detailed information about a specific parking location
 * @param {number} locationId - The ID of the parking location
 * @returns {Promise<Object>} Location details with amenities, rates, etc.
 */
const getLocationDetails = async (locationId) => {
  try {
    const response = await api.get(`/informal-parking/location/${locationId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching location details:', error);
    throw new Error(
      error.response?.data?.message || 
      'Failed to fetch location details. Please try again.'
    );
  }
};

/**
 * Check real-time availability for a parking location
 * @param {number} locationId - The ID of the parking location
 * @returns {Promise<Object>} Availability data with occupied/total spots
 */
const checkAvailability = async (locationId) => {
  try {
    const response = await api.post('/informal-parking/check-availability', {
      location_id: locationId
    });
    return response.data;
  } catch (error) {
    console.error('Error checking availability:', error);
    throw new Error(
      error.response?.data?.message || 
      'Failed to check parking availability. Please try again.'
    );
  }
};

/**
 * Simulate a booking for informal parking (mock booking for walk-ins)
 * @param {number} locationId - The ID of the parking location
 * @param {number} duration - Duration in hours
 * @param {string} vehicleNumber - Vehicle registration number
 * @returns {Promise<Object>} Mock booking confirmation
 */
const simulateBooking = async (locationId, duration, vehicleNumber) => {
  try {
    const response = await api.post('/informal-parking/simulate-booking', {
      location_id: locationId,
      duration,
      vehicle_number: vehicleNumber
    });
    return response.data;
  } catch (error) {
    console.error('Error simulating booking:', error);
    throw new Error(
      error.response?.data?.message || 
      'Failed to simulate parking booking. Please try again.'
    );
  }
};

/**
 * Search for parking locations by area name
 * @param {string} area - Area or locality name to search
 * @param {number} limit - Maximum number of results (optional)
 * @returns {Promise<Array>} Array of locations in the specified area
 */
const searchByArea = async (area, limit = 10) => {
  try {
    const response = await api.get('/informal-parking/search', {
      params: {
        area,
        limit
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error searching parking by area:', error);
    throw new Error(
      error.response?.data?.message || 
      'Failed to search parking locations. Please try again.'
    );
  }
};

/**
 * Get all informal parking locations
 * @returns {Promise<Array>} Array of all parking locations
 */
const getAllLocations = async () => {
  try {
    const response = await api.get('/informal-parking/locations');
    return response.data;
  } catch (error) {
    console.error('Error fetching all locations:', error);
    throw new Error(
      error.response?.data?.message || 
      'Failed to fetch parking locations. Please try again.'
    );
  }
};

/**
 * Get popular parking locations
 * @param {number} limit - Maximum number of results (optional)
 * @returns {Promise<Array>} Array of popular locations
 */
const getPopularLocations = async (limit = 5) => {
  try {
    const response = await api.get('/informal-parking/popular', {
      params: { limit }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching popular locations:', error);
    throw new Error(
      error.response?.data?.message || 
      'Failed to fetch popular parking locations. Please try again.'
    );
  }
};

/**
 * Calculate estimated parking cost
 * @param {number} locationId - The ID of the parking location
 * @param {number} duration - Duration in hours
 * @returns {Promise<Object>} Cost estimation details
 */
const calculateCost = async (locationId, duration) => {
  try {
    const response = await api.post('/informal-parking/calculate-cost', {
      location_id: locationId,
      duration
    });
    return response.data;
  } catch (error) {
    console.error('Error calculating cost:', error);
    throw new Error(
      error.response?.data?.message || 
      'Failed to calculate parking cost. Please try again.'
    );
  }
};

/**
 * Report an issue with a parking location
 * @param {number} locationId - The ID of the parking location
 * @param {string} issue - Description of the issue
 * @param {string} issueType - Type of issue (e.g., 'full', 'unsafe', 'closed')
 * @returns {Promise<Object>} Report confirmation
 */
const reportIssue = async (locationId, issue, issueType) => {
  try {
    const response = await api.post('/informal-parking/report-issue', {
      location_id: locationId,
      issue,
      issue_type: issueType
    });
    return response.data;
  } catch (error) {
    console.error('Error reporting issue:', error);
    throw new Error(
      error.response?.data?.message || 
      'Failed to report issue. Please try again.'
    );
  }
};

/**
 * Get parking history for current location
 * @param {number} locationId - The ID of the parking location
 * @returns {Promise<Object>} Historical data about the location
 */
const getLocationHistory = async (locationId) => {
  try {
    const response = await api.get(`/informal-parking/location/${locationId}/history`);
    return response.data;
  } catch (error) {
    console.error('Error fetching location history:', error);
    throw new Error(
      error.response?.data?.message || 
      'Failed to fetch location history. Please try again.'
    );
  }
};

// Export all functions
const informalParkingService = {
  getNearbyParking,
  getLocationDetails,
  checkAvailability,
  simulateBooking,
  searchByArea,
  getAllLocations,
  getPopularLocations,
  calculateCost,
  reportIssue,
  getLocationHistory
};

export default informalParkingService;

// Named exports for individual functions
export {
  getNearbyParking,
  getLocationDetails,
  checkAvailability,
  simulateBooking,
  searchByArea,
  getAllLocations,
  getPopularLocations,
  calculateCost,
  reportIssue,
  getLocationHistory
};

