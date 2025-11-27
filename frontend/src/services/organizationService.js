import api from './api';

/**
 * Get all organizations (public endpoint)
 * @returns {Array} Array of organizations for dropdown
 */
const getAllOrganizations = async () => {
  try {
    const response = await api.get('/organizations/all');
    // api interceptor returns response.data which is { success: true, data: { organizations: [...], count: n } }
    // So we need to access response.data.organizations
    console.log('API response:', response);
    return response.data?.organizations || [];
  } catch (error) {
    console.error('Error fetching organizations:', error);
    throw new Error(error.message || 'Failed to fetch organizations');
  }
};

/**
 * Get organization dashboard statistics
 * @param {Number} orgId - Organization ID
 * @returns {Object} Dashboard data with statistics
 */
const getOrganizationDashboard = async (orgId) => {
  try {
    const response = await api.get(`/organizations/dashboard/${orgId}`);
    return response;  // api interceptor already returns response.data
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch dashboard data');
  }
};

/**
 * Get all members of an organization
 * @param {Number} orgId - Organization ID
 * @returns {Array} Array of organization members
 */
const getOrganizationMembers = async (orgId) => {
  try {
    const response = await api.get(`/organizations/members/${orgId}`);
    return response;  // api interceptor already returns response.data
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch organization members');
  }
};

/**
 * Add a new member to organization
 * @param {Object} memberData - Member details
 * @param {String} memberData.name - Member name
 * @param {String} memberData.email - Member email
 * @param {String} memberData.mobile - Member mobile
 * @param {String} memberData.employee_id - Employee ID
 * @param {Number} memberData.organization_id - Organization ID
 * @param {String} memberData.password - Member password
 * @returns {Object} Created member details
 */
const addMember = async (memberData) => {
  try {
    const response = await api.post('/organizations/add-member', memberData);
    return response;  // api interceptor already returns response.data
  } catch (error) {
    // Preserve the original error response for better error messages
    throw error;
  }
};

/**
 * Update organization parking rules and settings
 * @param {Number} orgId - Organization ID
 * @param {Object} rulesData - Rules and settings
 * @param {String} rulesData.parking_rules - Parking rules text
 * @param {String} rulesData.operating_hours - Operating hours
 * @param {Number} rulesData.visitor_hourly_rate - Hourly rate for visitors
 * @returns {Object} Updated organization details
 */
const updateParkingRules = async (orgId, rulesData) => {
  try {
    const response = await api.put(`/organizations/update-rules/${orgId}`, rulesData);
    return response;  // api interceptor already returns response.data
  } catch (error) {
    throw new Error(error.message || 'Failed to update parking rules');
  }
};

/**
 * Get organization analytics
 * @param {Number} orgId - Organization ID
 * @param {String} period - Period for analytics (daily, weekly, monthly)
 * @returns {Object} Analytics data with trends and statistics
 */
const getAnalytics = async (orgId, period = 'month') => {
  try {
    const response = await api.get(`/organizations/analytics/${orgId}?period=${period}`);
    return response;  // api interceptor already returns response.data
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch analytics data');
  }
};

/**
 * Remove member from organization
 * @param {Number} userId - User ID to remove
 * @returns {Object} Removal confirmation
 */
const removeMember = async (userId) => {
  try {
    const response = await api.delete(`/organizations/remove-member/${userId}`);
    return response;  // api interceptor already returns response.data
  } catch (error) {
    // Preserve the original error response for better error messages
    throw error;
  }
};

/**
 * Get organization by ID
 * @param {Number} id - Organization ID
 * @returns {Object} Organization details
 */
const getOrganizationById = async (id) => {
  try {
    const response = await api.get(`/organizations/${id}`);
    // api interceptor returns response.data which contains { success: true, data: organization }
    // So we need to access response.data to get the organization object
    return response.data || null;
  } catch (error) {
    console.error('Error in getOrganizationById:', error);
    throw new Error(error.response?.data?.error || error.message || 'Failed to fetch organization details');
  }
};

/**
 * Update organization details
 * @param {Number} id - Organization ID
 * @param {Object} orgData - Updated organization data
 * @returns {Object} Updated organization
 */
const updateOrganization = async (id, orgData) => {
  try {
    const response = await api.put(`/organizations/${id}`, orgData);
    return response;  // api interceptor already returns response.data
  } catch (error) {
    throw new Error(error.message || 'Failed to update organization');
  }
};

/**
 * Delete an organization and all its related data
 * This will permanently delete:
 * - All bookings and payments
 * - All parking lots
 * - All watchmen
 * - All organization members/users
 * - The organization itself
 * 
 * @param {Number} orgId - Organization ID to delete
 * @returns {Object} Deletion confirmation with details
 */
const deleteOrganization = async (orgId) => {
  try {
    const response = await api.delete(`/organizations/${orgId}`);
    return response;  // api interceptor already returns response.data
  } catch (error) {
    throw error;  // Preserve the original error for better error handling
  }
};

// Export all functions
const organizationService = {
  getAllOrganizations,
  getOrganizationDashboard,
  getOrganizationMembers,
  addMember,
  updateParkingRules,
  getAnalytics,
  removeMember,
  getOrganizationById,
  updateOrganization,
  deleteOrganization
};

export default organizationService;


