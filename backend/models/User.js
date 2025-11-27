const { runQuery, getRow, getAllRows } = require('../config/db');
const bcrypt = require('bcrypt');
const { passwordConfig } = require('../config/auth.config');

class User {
  /**
   * Create a new user
   * @param {Object} userData - User data
   * @param {string} userData.name - User's full name
   * @param {string} userData.email - User's email
   * @param {string} userData.mobile - User's mobile number
   * @param {string} userData.password - User's plain password
   * @param {string} userData.user_type - User type (individual/organization_member/organization_admin)
   * @param {number} [userData.organization_id] - Organization ID (if member/admin)
   * @param {string} [userData.employee_id] - Employee ID (if organization member)
   * @returns {Object} Created user object without password
   */
  static async createUser(name, email, mobile, password, user_type, organization_id = null, employee_id = null) {
    // 🔍 DETAILED LOGGING: User creation
    console.log('\n' + '👤'.repeat(35));
    console.log('👤 USER MODEL: createUser()');
    console.log('👤'.repeat(35));
    console.log('👤 Input Data:');
    console.log('👤   - Name:', name);
    console.log('👤   - Email:', email);
    console.log('👤   - Mobile:', mobile);
    console.log('👤   - User Type:', user_type);
    console.log('👤   - Organization ID:', organization_id === null ? 'NULL' : organization_id, '(type:', typeof organization_id + ')');
    console.log('👤   - Employee ID:', employee_id === null ? 'NULL' : employee_id, '(type:', typeof employee_id + ')');
    
    // Hash password using bcrypt
    const saltRounds = passwordConfig.saltRounds || 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    console.log('👤 Password hashed successfully');
    
    // Insert user into database - set is_verified = 1 for organization members
    const sql = `INSERT INTO users (name, email, mobile, password, user_type, organization_id, employee_id, is_verified) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    
    const params = [
      name,
      email,
      mobile,
      hashedPassword,
      user_type,
      organization_id,
      employee_id,
      1  // Set is_verified = 1 for newly created organization members
    ];
    
    console.log('👤 SQL Query:', sql);
    console.log('👤 Parameters:', JSON.stringify({
      name,
      email,
      mobile,
      password: '[HASHED]',
      user_type,
      organization_id,
      employee_id
    }, null, 2));
    console.log('👤'.repeat(35) + '\n');
    
    const result = await runQuery(sql, params);
    
    console.log('✅ User inserted with ID:', result.lastID);
    
    // Return created user without password
    return {
      id: result.lastID,
      name,
      email,
      mobile,
      user_type,
      organization_id,
      employee_id,
      is_verified: 0,
      created_at: new Date().toISOString()
    };
  }

  /**
   * Find user by email
   * @param {string} email - User's email
   * @returns {Object|null} User object with all fields (including password)
   */
  static async findByEmail(email) {
    return await getRow('SELECT * FROM users WHERE email = ?', [email]);
  }

  /**
   * Find user by mobile
   * @param {string} mobile - User's mobile number
   * @returns {Object|null} User object with all fields (including password)
   */
  static async findByMobile(mobile) {
    return await getRow('SELECT * FROM users WHERE mobile = ?', [mobile]);
  }

  /**
   * Find user by employee ID within an organization
   * @param {string} employee_id - Employee ID
   * @param {number} organization_id - Organization ID
   * @returns {Object|null} User object if found
   */
  static async findByEmployeeId(employee_id, organization_id) {
    return await getRow(
      'SELECT * FROM users WHERE employee_id = ? AND organization_id = ?',
      [employee_id, organization_id]
    );
  }

  /**
   * Find user by ID
   * @param {number} id - User ID
   * @returns {Object|null} User object without password
   */
  static async findById(id) {
    return await getRow(
      'SELECT id, name, email, mobile, user_type, organization_id, employee_id, is_verified, created_at, updated_at FROM users WHERE id = ?',
      [id]
    );
  }

  /**
   * Verify user password
   * @param {string} email - User's email
   * @param {string} plainPassword - Plain password to verify
   * @returns {Object|null} User object (without password) if valid, null if invalid
   */
  static async verifyPassword(email, plainPassword) {
    // Find user by email (with password)
    const user = await getRow('SELECT * FROM users WHERE email = ?', [email]);
    
    if (!user) {
      return null;
    }
    
    // Compare password using bcrypt
    const isValid = await bcrypt.compare(plainPassword, user.password);
    
    if (!isValid) {
      return null;
    }
    
    // Return user without password
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Update user information
   * @param {number} user_id - User ID
   * @param {Object} updateFields - Fields to update
   * @returns {Object} Update result
   */
  static async updateUser(user_id, updateFields) {
    const allowedFields = ['name', 'mobile', 'employee_id', 'is_verified'];
    const updates = [];
    const values = [];
    
    // Build dynamic update query
    for (const [key, value] of Object.entries(updateFields)) {
      if (allowedFields.includes(key)) {
        updates.push(`${key} = ?`);
        values.push(value);
      }
    }
    
    if (updates.length === 0) {
      throw new Error('No valid fields to update');
    }
    
    // Add updated_at timestamp
    updates.push('updated_at = CURRENT_TIMESTAMP');
    
    // Add user_id to values array
    values.push(user_id);
    
    const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
    const result = await runQuery(sql, values);
    
    // Return updated user
    return await this.findById(user_id);
  }

  /**
   * Delete user from database
   * @param {number} user_id - User ID
   * @returns {Object} Delete result
   */
  static async deleteUser(user_id) {
    const sql = 'DELETE FROM users WHERE id = ?';
    const result = await runQuery(sql, [user_id]);
    return result;
  }

  /**
   * Verify if user is a member of an organization
   * @param {number} user_id - User ID
   * @param {number} organization_id - Organization ID
   * @returns {boolean} True if user belongs to organization and has employee_id, false otherwise
   */
  static async verifyOrganizationMember(user_id, organization_id) {
    const user = await getRow(
      'SELECT id, organization_id, employee_id, user_type FROM users WHERE id = ? AND organization_id = ?',
      [user_id, organization_id]
    );
    
    // Verify user exists, belongs to organization, has employee_id, and is organization_member
    if (!user || !user.employee_id || user.user_type !== 'organization_member') {
      return false;
    }
    
    return true;
  }

  /**
   * Get all users by organization
   * @param {number} organization_id - Organization ID
   * @returns {Array} Array of organization members (without passwords)
   */
  static async getAllUsersByOrganization(organization_id) {
    return await getAllRows(
      `SELECT id, name, email, mobile, user_type, employee_id, is_verified, created_at, updated_at 
       FROM users 
       WHERE organization_id = ? AND user_type = 'organization_member'
       ORDER BY created_at DESC`,
      [organization_id]
    );
  }

  /**
   * Find user by mobile number
   */
  static async findByMobile(mobile) {
    return await getRow('SELECT * FROM users WHERE mobile = ?', [mobile]);
  }

  /**
   * Find user by employee ID and organization
   */
  static async findByEmployeeId(employeeId, organizationId) {
    return await getRow(
      'SELECT * FROM users WHERE employee_id = ? AND organization_id = ?',
      [employeeId, organizationId]
    );
  }

  /**
   * Update user information (legacy method - kept for backward compatibility)
   */
  static async update(id, userData) {
    const { name, mobile, employeeId } = userData;
    return await runQuery(
      'UPDATE users SET name = ?, mobile = ?, employee_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, mobile, employeeId || null, id]
    );
  }

  /**
   * Verify user account
   */
  static async verify(id) {
    return await runQuery(
      'UPDATE users SET is_verified = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );
  }

  /**
   * Delete user
   */
  static async delete(id) {
    return await runQuery('DELETE FROM users WHERE id = ?', [id]);
  }

  /**
   * Find all users (exclude sensitive data)
   */
  static async findAll() {
    return await getAllRows(
      'SELECT id, name, email, mobile, user_type, organization_id, employee_id, is_verified, created_at FROM users'
    );
  }

  /**
   * Find users by organization
   */
  static async findByOrganization(organizationId) {
    return await getAllRows(
      'SELECT id, name, email, mobile, user_type, employee_id, is_verified, created_at FROM users WHERE organization_id = ?',
      [organizationId]
    );
  }

  /**
   * Find users by type
   */
  static async findByType(userType) {
    return await getAllRows(
      'SELECT id, name, email, mobile, organization_id, employee_id, is_verified, created_at FROM users WHERE user_type = ?',
      [userType]
    );
  }

  /**
   * Count total users
   */
  static async count() {
    const result = await getRow('SELECT COUNT(*) as total FROM users');
    return result ? result.total : 0;
  }

  /**
   * Count users by organization
   */
  static async countByOrganization(organizationId) {
    const result = await getRow(
      'SELECT COUNT(*) as total FROM users WHERE organization_id = ?',
      [organizationId]
    );
    return result ? result.total : 0;
  }
}

// Export all functions
module.exports = {
  createUser: User.createUser.bind(User),
  findByEmail: User.findByEmail.bind(User),
  findByMobile: User.findByMobile.bind(User),
  findByEmployeeId: User.findByEmployeeId.bind(User),
  findById: User.findById.bind(User),
  verifyPassword: User.verifyPassword.bind(User),
  updateUser: User.updateUser.bind(User),
  deleteUser: User.deleteUser.bind(User),
  verifyOrganizationMember: User.verifyOrganizationMember.bind(User),
  getAllUsersByOrganization: User.getAllUsersByOrganization.bind(User),
  
  // Export the class itself for additional methods
  User
};
