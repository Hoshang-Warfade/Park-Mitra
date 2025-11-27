const { runQuery, getRow, getAllRows } = require('../config/db');

class Organization {
  /**
   * Create a new organization
   * @param {string} org_name - Organization name
   * @param {string} admin_name - Administrator's name
   * @param {string} admin_email - Administrator's email
   * @param {string} admin_mobile - Administrator's mobile number
   * @param {string} address - Organization address
   * @param {number} total_slots - Total parking slots
   * @param {number} visitor_hourly_rate - Hourly rate for visitors
   * @param {string} parking_rules - Parking rules and regulations
   * @param {Array} parking_lots - Array of parking lot objects (optional)
   * @returns {Object} Created organization with id
   */
  static async createOrganization(
    org_name,
    admin_name,
    admin_email,
    admin_mobile,
    address,
    total_slots,
    visitor_hourly_rate,
    parking_rules,
    parking_lots = null
  ) {
    // 🔍 DETAILED LOGGING: Organization creation
    console.log('\n' + '🏢'.repeat(35));
    console.log('🏢 ORGANIZATION MODEL: createOrganization()');
    console.log('🏢'.repeat(35));
    console.log('🏢 Input Data:');
    console.log('🏢   - Org Name:', org_name);
    console.log('🏢   - Admin Name:', admin_name);
    console.log('🏢   - Admin Email:', admin_email);
    console.log('🏢   - Admin Mobile:', admin_mobile);
    console.log('🏢   - Address:', address);
    console.log('🏢   - Total Slots:', total_slots, '(type:', typeof total_slots + ')');
    console.log('🏢   - Visitor Hourly Rate:', visitor_hourly_rate, '(type:', typeof visitor_hourly_rate + ')');
    console.log('🏢   - Parking Lots:', parking_lots ? parking_lots.length + ' lots' : 'None (will create default)');
    
    const sql = `INSERT INTO organizations (
      org_name, admin_name, admin_email, admin_mobile, address, 
      total_slots, available_slots, visitor_hourly_rate, parking_rules
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    // Set available_slots = total_slots initially
    const params = [
      org_name,
      admin_name,
      admin_email,
      admin_mobile,
      address,
      total_slots,
      total_slots, // available_slots = total_slots
      visitor_hourly_rate,
      parking_rules
    ];
    
    console.log('🏢 SQL Query:', sql);
    console.log('🏢 Parameters:', JSON.stringify({
      org_name,
      admin_name,
      admin_email,
      admin_mobile,
      address,
      total_slots,
      available_slots: total_slots,
      visitor_hourly_rate,
      parking_rules: parking_rules?.substring(0, 50) + '...'
    }, null, 2));
    console.log('🏢'.repeat(35) + '\n');
    
    const result = await runQuery(sql, params);
    const organizationId = result.lastID;
    
    console.log('✅ Organization inserted with ID:', organizationId);
    
    // Create parking lots if provided, otherwise create a default one
    const ParkingLot = require('./ParkingLot');
    
    if (parking_lots && Array.isArray(parking_lots) && parking_lots.length > 0) {
      console.log('🅿️ Creating', parking_lots.length, 'parking lots...');
      for (const lot of parking_lots) {
        await ParkingLot.createParkingLot(
          organizationId,
          lot.lot_name,
          lot.lot_description,
          lot.total_slots,
          lot.priority_order
        );
        console.log('✅ Created parking lot:', lot.lot_name);
      }
    } else {
      // Create a default parking lot if none provided
      console.log('🅿️ Creating default parking lot...');
      await ParkingLot.createParkingLot(
        organizationId,
        'Main Parking Area',
        'Default parking area',
        total_slots,
        1
      );
      console.log('✅ Created default parking lot: Main Parking Area');
    }
    
    // Return created organization with id
    return {
      id: organizationId,
      org_name,
      admin_name,
      admin_email,
      admin_mobile,
      address,
      total_slots,
      available_slots: total_slots,
      visitor_hourly_rate,
      parking_rules,
      member_parking_free: 1,
      created_at: new Date().toISOString()
    };
  }

  /**
   * Find organization by ID
   * @param {number} id - Organization ID
   * @returns {Object|null} Organization details
   */
  static async findById(id) {
    return await getRow('SELECT * FROM organizations WHERE id = ?', [id]);
  }

  /**
   * Update organization information
   * @param {number} organization_id - Organization ID
   * @param {Object} updateFields - Fields to update
   * @returns {Object} Updated organization
   */
  static async updateOrganization(organization_id, updateFields) {
    const allowedFields = [
      'org_name',
      'admin_name',
      'admin_email',
      'admin_mobile',
      'address',
      'total_slots',
      'member_parking_free',
      'visitor_hourly_rate',
      'parking_rules',
      'operating_hours'
    ];
    
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
    
    // Add organization_id to values array
    values.push(organization_id);
    
    const sql = `UPDATE organizations SET ${updates.join(', ')} WHERE id = ?`;
    await runQuery(sql, values);
    
    // Return updated organization
    return await this.findById(organization_id);
  }

  /**
   * Update available slots atomically
   * @param {number} organization_id - Organization ID
   * @param {number} increment - Positive to add slots, negative to decrease
   * @returns {number} Updated available_slots count
   */
  static async updateAvailableSlots(organization_id, increment) {
    // Get current organization
    const org = await this.findById(organization_id);
    if (!org) {
      throw new Error('Organization not found');
    }
    
    // Calculate new available slots
    const newAvailableSlots = org.available_slots + increment;
    
    // Ensure available_slots doesn't go negative
    if (newAvailableSlots < 0) {
      throw new Error('Cannot decrease available slots below 0');
    }
    
    // Ensure available_slots doesn't exceed total_slots
    if (newAvailableSlots > org.total_slots) {
      throw new Error('Available slots cannot exceed total slots');
    }
    
    // Update atomically
    const sql = `UPDATE organizations 
                 SET available_slots = ?, updated_at = CURRENT_TIMESTAMP 
                 WHERE id = ?`;
    
    await runQuery(sql, [newAvailableSlots, organization_id]);
    
    // Return updated count
    return newAvailableSlots;
  }

  /**
   * Get organization statistics
   * @param {number} organization_id - Organization ID
   * @returns {Object} Statistics object with bookings, revenue, and occupancy
   */
  static async getOrganizationStats(organization_id) {
    // Get organization details
    const org = await this.findById(organization_id);
    if (!org) {
      throw new Error('Organization not found');
    }
    
    // Try to get stats from parking lots first
    const ParkingLot = require('./ParkingLot');
    const lotTotals = await ParkingLot.getOrganizationTotalSlots(organization_id);
    
    // Use parking lot totals if available, otherwise fall back to organization table
    const total_slots = lotTotals.total_slots > 0 ? lotTotals.total_slots : org.total_slots;
    const available_slots = lotTotals.total_slots > 0 ? lotTotals.available_slots : org.available_slots;
    
    // Get total bookings count
    const totalBookingsResult = await getRow(
      'SELECT COUNT(*) as count FROM bookings WHERE organization_id = ?',
      [organization_id]
    );
    const total_bookings = totalBookingsResult ? totalBookingsResult.count : 0;
    
    // Get active bookings count (status = 'active')
    const activeBookingsResult = await getRow(
      'SELECT COUNT(*) as count FROM bookings WHERE organization_id = ? AND booking_status = ?',
      [organization_id, 'active']
    );
    const active_bookings = activeBookingsResult ? activeBookingsResult.count : 0;
    
    // Get overstay bookings count (status = 'overstay')
    const overstayBookingsResult = await getRow(
      'SELECT COUNT(*) as count FROM bookings WHERE organization_id = ? AND booking_status = ?',
      [organization_id, 'overstay']
    );
    const overstay_bookings = overstayBookingsResult ? overstayBookingsResult.count : 0;
    
    // Get total revenue (sum of completed payments)
    const revenueResult = await getRow(
      `SELECT SUM(p.amount) as total 
       FROM payments p
       INNER JOIN bookings b ON p.booking_id = b.id
       WHERE b.organization_id = ? AND p.payment_status = ?`,
      [organization_id, 'completed']
    );
    const total_revenue = revenueResult && revenueResult.total ? revenueResult.total : 0;
    
    // Calculate occupancy rate (percentage of slots occupied)
    // Occupied slots should include both active AND overstay bookings
    const occupied_slots = active_bookings + overstay_bookings;
    const occupancy_rate = total_slots > 0 
      ? ((occupied_slots / total_slots) * 100).toFixed(2)
      : 0;
    
    return {
      total_bookings,
      active_bookings,
      overstay_bookings,
      total_revenue: parseFloat(total_revenue).toFixed(2),
      occupancy_rate: parseFloat(occupancy_rate),
      total_slots,
      available_slots,
      occupied_slots
    };
  }

  /**
   * Get all organizations with basic info
   * @returns {Array} Array of organizations
   */
  static async getAllOrganizations() {
    return await getAllRows(
      `SELECT id, org_name, admin_name, admin_email, address, 
              total_slots, available_slots, visitor_hourly_rate, 
              member_parking_free, created_at 
       FROM organizations 
       ORDER BY org_name ASC`
    );
  }

  // Legacy methods for backward compatibility
  static async create(orgData) {
    const { name, address, contactEmail, contactPhone, totalSlots, pricingPerHour } = orgData;
    return await this.createOrganization(
      name,
      'Admin', // Default admin name
      contactEmail,
      contactPhone,
      address,
      totalSlots,
      pricingPerHour,
      null // No parking rules
    );
  }

  static async findAll() {
    return await this.getAllOrganizations();
  }

  static async update(id, orgData) {
    return await this.updateOrganization(id, orgData);
  }

  static async delete(id) {
    return await runQuery('DELETE FROM organizations WHERE id = ?', [id]);
  }
}

// Export all functions
module.exports = {
  createOrganization: Organization.createOrganization.bind(Organization),
  findById: Organization.findById.bind(Organization),
  updateOrganization: Organization.updateOrganization.bind(Organization),
  updateAvailableSlots: Organization.updateAvailableSlots.bind(Organization),
  getOrganizationStats: Organization.getOrganizationStats.bind(Organization),
  getAllOrganizations: Organization.getAllOrganizations.bind(Organization),
  
  // Export the class itself for additional methods
  Organization
};
