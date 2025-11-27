import api from './api';

/**
 * Parking Lot Service
 * Handles all parking lot-related API calls
 */

/**
 * Get all parking lots for an organization
 * @param {number} organizationId - Organization ID
 * @param {boolean} includeInactive - Include inactive lots
 * @returns {Promise} - Promise with parking lots data
 */
export const getParkingLots = async (organizationId, includeInactive = false) => {
  try {
    const response = await api.get(
      `/parking-lots/organization/${organizationId}${includeInactive ? '?includeInactive=true' : ''}`
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Get a specific parking lot by ID
 * @param {number} lotId - Parking lot ID
 * @returns {Promise} - Promise with parking lot data
 */
export const getParkingLotById = async (lotId) => {
  try {
    const response = await api.get(`/parking-lots/${lotId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Create a new parking lot
 * @param {number} organizationId - Organization ID
 * @param {Object} lotData - Parking lot data
 * @returns {Promise} - Promise with created parking lot data
 */
export const createParkingLot = async (organizationId, lotData) => {
  try {
    const response = await api.post(`/parking-lots/organization/${organizationId}`, lotData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Update a parking lot
 * @param {number} lotId - Parking lot ID
 * @param {Object} updateData - Data to update
 * @returns {Promise} - Promise with updated parking lot data
 */
export const updateParkingLot = async (lotId, updateData) => {
  try {
    const response = await api.put(`/parking-lots/${lotId}`, updateData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Update parking lot slot capacity
 * @param {number} lotId - Parking lot ID
 * @param {number} totalSlots - New total slots
 * @returns {Promise} - Promise with updated parking lot data
 */
export const updateParkingLotSlots = async (lotId, totalSlots) => {
  try {
    const response = await api.patch(`/parking-lots/${lotId}/slots`, { total_slots: totalSlots });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Toggle parking lot active status
 * @param {number} lotId - Parking lot ID
 * @returns {Promise} - Promise with updated parking lot data
 */
export const toggleParkingLotStatus = async (lotId) => {
  try {
    const response = await api.patch(`/parking-lots/${lotId}/toggle-active`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Delete a parking lot
 * @param {number} lotId - Parking lot ID
 * @returns {Promise} - Promise with delete confirmation
 */
export const deleteParkingLot = async (lotId) => {
  try {
    const response = await api.delete(`/parking-lots/${lotId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Get total slots for an organization across all parking lots
 * @param {number} organizationId - Organization ID
 * @returns {Promise} - Promise with total slots data
 */
export const getOrganizationTotalSlots = async (organizationId) => {
  try {
    const response = await api.get(`/parking-lots/organization/${organizationId}/total-slots`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

const parkingLotService = {
  getParkingLots,
  getParkingLotById,
  createParkingLot,
  updateParkingLot,
  updateParkingLotSlots,
  toggleParkingLotStatus,
  deleteParkingLot,
  getOrganizationTotalSlots
};

export default parkingLotService;
