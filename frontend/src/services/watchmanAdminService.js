import api from './api';

/**
 * Add a new watchman to organization
 * @param {Object} watchmanData - Watchman details
 * @returns {Object} Created watchman details
 */
const addWatchman = async (watchmanData) => {
  try {
    const response = await api.post('/watchmen/add', watchmanData);
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * Get all watchmen of an organization
 * @param {Number} orgId - Organization ID
 * @returns {Array} Array of watchmen
 */
const getOrganizationWatchmen = async (orgId) => {
  try {
    const response = await api.get(`/watchmen/organization/${orgId}`);
    return response;
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch watchmen');
  }
};

/**
 * Remove watchman from organization
 * @param {Number} watchmanId - Watchman ID to remove
 * @returns {Object} Removal confirmation
 */
const removeWatchman = async (watchmanId) => {
  try {
    const response = await api.delete(`/watchmen/${watchmanId}`);
    return response;
  } catch (error) {
    throw error;
  }
};

/**
 * Update watchman details
 * @param {Number} watchmanId - Watchman ID
 * @param {Object} updateData - Updated watchman data
 * @returns {Object} Updated watchman
 */
const updateWatchman = async (watchmanId, updateData) => {
  try {
    const response = await api.put(`/watchmen/${watchmanId}`, updateData);
    return response;
  } catch (error) {
    throw new Error(error.message || 'Failed to update watchman');
  }
};

// Export all functions
const watchmanAdminService = {
  addWatchman,
  getOrganizationWatchmen,
  removeWatchman,
  updateWatchman
};

export default watchmanAdminService;
