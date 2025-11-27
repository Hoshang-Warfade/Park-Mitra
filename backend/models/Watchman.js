// Watchman Model - Database operations for watchman management
const { getDatabase, runQuery, getRow, getAllRows } = require('../config/db');
const bcrypt = require('bcrypt');

/**
 * Create a new watchman with hashed password
 * @param {Object} watchmanData - Watchman details
 * @returns {Promise<Object>} - Created watchman object (without password)
 */
const createWatchman = async (watchmanData) => {
  try {
    const { name, email, mobile, password, organization_id, assigned_shift, shift_start, shift_end } = watchmanData;

    // Hash password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // First create user account with user_type = 'watchman'
    const userSql = `
      INSERT INTO users (name, email, password_hash, mobile, user_type, organization_id)
      VALUES (?, ?, ?, ?, 'watchman', ?)
    `;
    
    const userResult = await runQuery(userSql, [name, email, password_hash, mobile, organization_id]);
    const userId = userResult.lastID;

    // Then create watchman record
    const watchmanSql = `
      INSERT INTO watchmen (user_id, organization_id, shift_start, shift_end, status)
      VALUES (?, ?, ?, ?, 'active')
    `;

    const watchmanResult = await runQuery(watchmanSql, [
      userId,
      organization_id,
      shift_start || '09:00',
      shift_end || '17:00'
    ]);

    // Return created watchman (without password)
    const createdWatchman = await findById(watchmanResult.lastID);
    return createdWatchman;
  } catch (error) {
    console.error('[Watchman Model] Error creating watchman:', error.message);
    throw error;
  }
};

/**
 * Find watchman by email with organization details
 * @param {string} email - Watchman email
 * @returns {Promise<Object|null>} - Watchman object with organization details
 */
const findByEmail = async (email) => {
  try {
    const sql = `
      SELECT 
        w.id as watchman_id,
        w.user_id,
        w.organization_id,
        w.shift_start,
        w.shift_end,
        w.status,
        w.created_at as watchman_created_at,
        w.updated_at as watchman_updated_at,
        u.id as user_id,
        u.name,
        u.email,
        u.mobile,
        u.user_type,
        u.password_hash,
        u.created_at as user_created_at,
        o.id as org_id,
        o.name as organization_name,
        o.address as organization_address
      FROM watchmen w
      INNER JOIN users u ON w.user_id = u.id
      LEFT JOIN organizations o ON w.organization_id = o.id
      WHERE u.email = ?
    `;

    const watchman = await getRow(sql, [email]);
    
    if (watchman) {
      return {
        id: watchman.watchman_id,
        user_id: watchman.user_id,
        organization_id: watchman.organization_id,
        shift_start: watchman.shift_start,
        shift_end: watchman.shift_end,
        status: watchman.status,
        name: watchman.name,
        email: watchman.email,
        mobile: watchman.mobile,
        user_type: watchman.user_type,
        password_hash: watchman.password_hash,
        organization: {
          id: watchman.org_id,
          name: watchman.organization_name,
          address: watchman.organization_address
        },
        created_at: watchman.watchman_created_at,
        updated_at: watchman.watchman_updated_at
      };
    }
    
    return null;
  } catch (error) {
    console.error('[Watchman Model] Error finding watchman by email:', error.message);
    throw error;
  }
};

/**
 * Find watchman by ID (without password)
 * @param {number} id - Watchman ID
 * @returns {Promise<Object|null>} - Watchman object without password
 */
const findById = async (id) => {
  try {
    const sql = `
      SELECT 
        w.id,
        w.user_id,
        w.organization_id,
        w.shift_start,
        w.shift_end,
        w.status,
        w.created_at,
        w.updated_at,
        u.name,
        u.email,
        u.mobile,
        u.user_type,
        o.name as organization_name,
        o.address as organization_address
      FROM watchmen w
      INNER JOIN users u ON w.user_id = u.id
      LEFT JOIN organizations o ON w.organization_id = o.id
      WHERE w.id = ?
    `;

    const watchman = await getRow(sql, [id]);
    
    if (watchman) {
      return {
        id: watchman.id,
        user_id: watchman.user_id,
        organization_id: watchman.organization_id,
        shift_start: watchman.shift_start,
        shift_end: watchman.shift_end,
        status: watchman.status,
        name: watchman.name,
        email: watchman.email,
        mobile: watchman.mobile,
        user_type: watchman.user_type,
        organization: {
          name: watchman.organization_name,
          address: watchman.organization_address
        },
        created_at: watchman.created_at,
        updated_at: watchman.updated_at
      };
    }
    
    return null;
  } catch (error) {
    console.error('[Watchman Model] Error finding watchman by ID:', error.message);
    throw error;
  }
};

/**
 * Find watchman by user ID
 * @param {number} userId - User ID
 * @returns {Promise<Object|null>} - Watchman object
 */
const findByUserId = async (userId) => {
  try {
    const sql = `
      SELECT 
        w.id,
        w.user_id,
        w.organization_id,
        w.shift_start,
        w.shift_end,
        w.status,
        w.created_at,
        w.updated_at,
        u.name,
        u.email,
        u.mobile,
        u.user_type,
        o.name as organization_name
      FROM watchmen w
      INNER JOIN users u ON w.user_id = u.id
      LEFT JOIN organizations o ON w.organization_id = o.id
      WHERE w.user_id = ?
    `;

    const watchman = await getRow(sql, [userId]);
    
    if (watchman) {
      return {
        id: watchman.id,
        user_id: watchman.user_id,
        organization_id: watchman.organization_id,
        shift_start: watchman.shift_start,
        shift_end: watchman.shift_end,
        status: watchman.status,
        name: watchman.name,
        email: watchman.email,
        mobile: watchman.mobile,
        user_type: watchman.user_type,
        organization_name: watchman.organization_name,
        created_at: watchman.created_at,
        updated_at: watchman.updated_at
      };
    }
    
    return null;
  } catch (error) {
    console.error('[Watchman Model] Error finding watchman by user ID:', error.message);
    throw error;
  }
};

/**
 * Verify watchman password
 * @param {string} email - Watchman email
 * @param {string} plainPassword - Plain text password
 * @returns {Promise<Object|null>} - Watchman object if valid, null if invalid
 */
const verifyPassword = async (email, plainPassword) => {
  try {
    // Find watchman with password hash
    const watchman = await findByEmail(email);
    
    if (!watchman) {
      return null;
    }

    // Compare password
    const isValid = await bcrypt.compare(plainPassword, watchman.password_hash);
    
    if (isValid) {
      // Remove password hash from returned object
      const { password_hash, ...watchmanWithoutPassword } = watchman;
      return watchmanWithoutPassword;
    } else {
      return null;
    }
  } catch (error) {
    console.error('[Watchman Model] Error verifying password:', error.message);
    throw error;
  }
};

/**
 * Get all watchmen by organization with status
 * @param {number} organizationId - Organization ID
 * @returns {Promise<Array>} - Array of watchmen with active/inactive status
 */
const getAllByOrganization = async (organizationId) => {
  try {
    const sql = `
      SELECT 
        w.id,
        w.user_id,
        w.organization_id,
        w.shift_start,
        w.shift_end,
        w.status,
        w.created_at,
        w.updated_at,
        u.name,
        u.email,
        u.mobile,
        CASE 
          WHEN w.status = 'active' THEN 'Active'
          WHEN w.status = 'inactive' THEN 'Inactive'
          ELSE 'Unknown'
        END as status_label
      FROM watchmen w
      INNER JOIN users u ON w.user_id = u.id
      WHERE w.organization_id = ?
      ORDER BY w.status DESC, u.name ASC
    `;

    const watchmen = await getAllRows(sql, [organizationId]);
    
    return watchmen.map(w => ({
      id: w.id,
      user_id: w.user_id,
      organization_id: w.organization_id,
      shift_start: w.shift_start,
      shift_end: w.shift_end,
      status: w.status,
      status_label: w.status_label,
      name: w.name,
      email: w.email,
      mobile: w.mobile,
      created_at: w.created_at,
      updated_at: w.updated_at
    }));
  } catch (error) {
    console.error('[Watchman Model] Error getting watchmen by organization:', error.message);
    throw error;
  }
};

/**
 * Update watchman details
 * @param {number} watchmanId - Watchman ID
 * @param {Object} updateData - Fields to update
 * @returns {Promise<Object>} - Updated watchman object
 */
const updateWatchman = async (watchmanId, updateData) => {
  try {
    const { shift_start, shift_end, status, name, email, mobile } = updateData;
    
    // Update watchman record
    if (shift_start || shift_end || status !== undefined) {
      const updates = [];
      const params = [];
      
      if (shift_start) {
        updates.push('shift_start = ?');
        params.push(shift_start);
      }
      if (shift_end) {
        updates.push('shift_end = ?');
        params.push(shift_end);
      }
      if (status !== undefined) {
        updates.push('status = ?');
        params.push(status);
      }
      
      updates.push('updated_at = CURRENT_TIMESTAMP');
      params.push(watchmanId);
      
      const watchmanSql = `UPDATE watchmen SET ${updates.join(', ')} WHERE id = ?`;
      await runQuery(watchmanSql, params);
    }
    
    // Update user record if needed
    if (name || email || mobile) {
      const watchman = await findById(watchmanId);
      if (watchman && watchman.user_id) {
        const userUpdates = [];
        const userParams = [];
        
        if (name) {
          userUpdates.push('name = ?');
          userParams.push(name);
        }
        if (email) {
          userUpdates.push('email = ?');
          userParams.push(email);
        }
        if (mobile) {
          userUpdates.push('mobile = ?');
          userParams.push(mobile);
        }
        
        userUpdates.push('updated_at = CURRENT_TIMESTAMP');
        userParams.push(watchman.user_id);
        
        const userSql = `UPDATE users SET ${userUpdates.join(', ')} WHERE id = ?`;
        await runQuery(userSql, userParams);
      }
    }
    
    // Return updated watchman
    const updatedWatchman = await findById(watchmanId);
    return updatedWatchman;
  } catch (error) {
    console.error('[Watchman Model] Error updating watchman:', error.message);
    throw error;
  }
};

/**
 * Delete watchman (soft delete by setting status to inactive)
 * @param {number} watchmanId - Watchman ID
 * @returns {Promise<boolean>} - True if deleted successfully
 */
const deleteWatchman = async (watchmanId) => {
  try {
    const sql = `UPDATE watchmen SET status = 'inactive', updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    await runQuery(sql, [watchmanId]);
    return true;
  } catch (error) {
    console.error('[Watchman Model] Error deleting watchman:', error.message);
    throw error;
  }
};

/**
 * Get watchman statistics
 * @param {number} organizationId - Organization ID
 * @returns {Promise<Object>} - Statistics object
 */
const getStatistics = async (organizationId) => {
  try {
    const sql = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive
      FROM watchmen
      WHERE organization_id = ?
    `;

    const stats = await getRow(sql, [organizationId]);
    return stats || { total: 0, active: 0, inactive: 0 };
  } catch (error) {
    console.error('[Watchman Model] Error getting statistics:', error.message);
    throw error;
  }
};

// Export all functions
module.exports = {
  createWatchman,
  findByEmail,
  findById,
  findByUserId,
  verifyPassword,
  getAllByOrganization,
  updateWatchman,
  deleteWatchman,
  getStatistics
};
