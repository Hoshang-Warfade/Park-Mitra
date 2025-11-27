const { runQuery, getRow, getAllRows } = require('../config/db');

class ParkingLot {
  /**
   * Create a new parking lot for an organization
   * @param {number} organization_id - Organization ID
   * @param {string} lot_name - Name of the parking lot (e.g., "E Building Basement Parking")
   * @param {string} lot_description - Description of the parking lot
   * @param {number} total_slots - Total parking slots in this lot
   * @param {number} priority_order - Priority order for allocation (lower number = higher priority)
   * @returns {Object} Created parking lot with lot_id
   */
  static async createParkingLot(
    organization_id,
    lot_name,
    lot_description,
    total_slots,
    priority_order = 1
  ) {
    console.log('\n' + '🅿️'.repeat(35));
    console.log('🅿️ PARKING LOT MODEL: createParkingLot()');
    console.log('🅿️'.repeat(35));
    console.log('🅿️ Input Data:');
    console.log('🅿️   - Organization ID:', organization_id);
    console.log('🅿️   - Lot Name:', lot_name);
    console.log('🅿️   - Description:', lot_description);
    console.log('🅿️   - Total Slots:', total_slots);
    console.log('🅿️   - Priority Order:', priority_order);

    // Check if lot name already exists for this organization
    const existingLot = await getRow(
      'SELECT lot_id FROM parking_lots WHERE organization_id = ? AND lot_name = ?',
      [organization_id, lot_name]
    );

    if (existingLot) {
      throw new Error(`Parking lot with name '${lot_name}' already exists for this organization`);
    }

    const sql = `INSERT INTO parking_lots (
      organization_id, lot_name, lot_description, total_slots, 
      available_slots, priority_order, is_active
    ) VALUES (?, ?, ?, ?, ?, ?, 1)`;

    const params = [
      organization_id,
      lot_name,
      lot_description,
      total_slots,
      total_slots, // available_slots = total_slots initially
      priority_order
    ];

    console.log('🅿️ SQL Query:', sql);
    console.log('🅿️ Parameters:', JSON.stringify(params));
    console.log('🅿️'.repeat(35) + '\n');

    const result = await runQuery(sql, params);

    console.log('✅ Parking lot created with ID:', result.lastID);

    return {
      lot_id: result.lastID,
      organization_id,
      lot_name,
      lot_description,
      total_slots,
      available_slots: total_slots,
      priority_order,
      is_active: 1,
      created_at: new Date().toISOString()
    };
  }

  /**
   * Get all parking lots for an organization (sorted by priority)
   * @param {number} organization_id - Organization ID
   * @param {boolean} activeOnly - If true, only return active lots
   * @returns {Array} Array of parking lots
   */
  static async getParkingLotsByOrganization(organization_id, activeOnly = true) {
    let sql = `
      SELECT * FROM parking_lots 
      WHERE organization_id = ?
    `;

    if (activeOnly) {
      sql += ' AND is_active = 1';
    }

    sql += ' ORDER BY priority_order ASC, lot_id ASC';

    return await getAllRows(sql, [organization_id]);
  }

  /**
   * Get a specific parking lot by ID
   * @param {number} lot_id - Parking lot ID
   * @returns {Object|null} Parking lot details
   */
  static async getParkingLotById(lot_id) {
    return await getRow('SELECT * FROM parking_lots WHERE lot_id = ?', [lot_id]);
  }

  /**
   * Update parking lot information
   * @param {number} lot_id - Parking lot ID
   * @param {Object} updateFields - Fields to update
   * @returns {Object} Updated parking lot
   */
  static async updateParkingLot(lot_id, updateFields) {
    const allowedFields = [
      'lot_name',
      'lot_description',
      'total_slots',
      'priority_order',
      'is_active'
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

    // Add lot_id to values array
    values.push(lot_id);

    const sql = `UPDATE parking_lots SET ${updates.join(', ')} WHERE lot_id = ?`;
    await runQuery(sql, values);

    // Return updated parking lot
    return await this.getParkingLotById(lot_id);
  }

  /**
   * Delete a parking lot
   * @param {number} lot_id - Parking lot ID
   * @returns {boolean} True if deleted successfully
   */
  static async deleteParkingLot(lot_id) {
    // Check if there are any active bookings for this lot
    const activeBookings = await getRow(
      `SELECT COUNT(*) as count FROM bookings 
       WHERE parking_lot_id = ? 
       AND booking_status NOT IN ('completed', 'cancelled')`,
      [lot_id]
    );

    if (activeBookings && activeBookings.count > 0) {
      throw new Error('Cannot delete parking lot with active bookings');
    }

    await runQuery('DELETE FROM parking_lots WHERE lot_id = ?', [lot_id]);
    return true;
  }

  /**
   * Update available slots atomically for a parking lot
   * @param {number} lot_id - Parking lot ID
   * @param {number} increment - Positive to add slots, negative to decrease
   * @returns {number} Updated available_slots count
   */
  static async updateAvailableSlots(lot_id, increment) {
    // Get current parking lot
    const lot = await this.getParkingLotById(lot_id);
    if (!lot) {
      throw new Error('Parking lot not found');
    }

    // Calculate new available slots
    const newAvailableSlots = lot.available_slots + increment;

    // Ensure available_slots doesn't go negative
    if (newAvailableSlots < 0) {
      throw new Error('Cannot decrease available slots below 0');
    }

    // Ensure available_slots doesn't exceed total_slots
    if (newAvailableSlots > lot.total_slots) {
      throw new Error('Available slots cannot exceed total slots');
    }

    // Update atomically
    const sql = `UPDATE parking_lots 
                 SET available_slots = ?, updated_at = CURRENT_TIMESTAMP 
                 WHERE lot_id = ?`;

    await runQuery(sql, [newAvailableSlots, lot_id]);

    console.log(`🅿️ Updated lot ${lot_id}: available_slots = ${newAvailableSlots}`);

    // Return updated count
    return newAvailableSlots;
  }

  /**
   * Get next available slot number in a parking lot
   * @param {number} lot_id - Parking lot ID
   * @param {number} organization_id - Organization ID
   * @param {string} booking_start_time - Booking start time
   * @param {string} booking_end_time - Booking end time
   * @returns {Object|null} Object with slot_number and lot_id, or null if no slots available
   */
  static async getNextAvailableSlotInLot(lot_id, organization_id, booking_start_time, booking_end_time) {
    // Get parking lot details
    const lot = await this.getParkingLotById(lot_id);
    
    if (!lot || !lot.is_active) {
      return null;
    }

    if (lot.available_slots <= 0) {
      return null;
    }

    // Get all occupied slot numbers in this lot for the requested time range
    const occupiedSlots = await getAllRows(
      `SELECT DISTINCT slot_number FROM bookings 
       WHERE parking_lot_id = ? 
       AND booking_status NOT IN ('completed', 'cancelled')
       AND (
         (booking_start_time < ? AND booking_end_time > ?) OR
         (booking_start_time >= ? AND booking_start_time < ?)
       )`,
      [lot_id, booking_end_time, booking_start_time, booking_start_time, booking_end_time]
    );

    const occupiedSlotNumbers = occupiedSlots.map(slot => slot.slot_number);

    // Generate slot number: LOT_NAME-SLOT_NUMBER (e.g., "E-Building-1", "Ground-5")
    const lotPrefix = lot.lot_name.replace(/\s+/g, '-').substring(0, 20);
    
    // Find first available slot number
    for (let i = 1; i <= lot.total_slots; i++) {
      const slotNumber = `${lotPrefix}-${i}`;
      if (!occupiedSlotNumbers.includes(slotNumber)) {
        return {
          slot_number: slotNumber,
          lot_id: lot.lot_id,
          lot_name: lot.lot_name
        };
      }
    }

    return null;
  }

  /**
   * Get parking lot statistics
   * @param {number} lot_id - Parking lot ID
   * @returns {Object} Statistics for the parking lot
   */
  static async getParkingLotStats(lot_id) {
    const lot = await this.getParkingLotById(lot_id);
    if (!lot) {
      throw new Error('Parking lot not found');
    }

    // Get total bookings count for this lot
    const totalBookingsResult = await getRow(
      'SELECT COUNT(*) as count FROM bookings WHERE parking_lot_id = ?',
      [lot_id]
    );
    const total_bookings = totalBookingsResult ? totalBookingsResult.count : 0;

    // Get active bookings count (NOT IN completed or cancelled, AND has started)
    // Using IST timezone (UTC+5:30) for Indian timezone
    const activeBookingsResult = await getRow(
      `SELECT COUNT(*) as count FROM bookings 
       WHERE parking_lot_id = ? 
       AND booking_status NOT IN ('completed', 'cancelled')
       AND datetime(booking_start_time) <= datetime('now', '+5 hours', '+30 minutes')`,
      [lot_id]
    );
    const active_bookings = activeBookingsResult ? activeBookingsResult.count : 0;

    // Calculate available and occupied slots dynamically from active bookings
    const occupied_slots = active_bookings;
    const available_slots = lot.total_slots - occupied_slots;
    const occupancy_rate = lot.total_slots > 0
      ? ((occupied_slots / lot.total_slots) * 100).toFixed(2)
      : 0;

    return {
      lot_id: lot.lot_id,
      lot_name: lot.lot_name,
      total_bookings,
      active_bookings,
      total_slots: lot.total_slots,
      available_slots: available_slots, // Calculated dynamically
      occupied_slots,
      occupancy_rate: parseFloat(occupancy_rate),
      is_active: lot.is_active,
      priority_order: lot.priority_order
    };
  }

  /**
   * Recalculate organization's total available slots based on all parking lots
   * AND actual active/overstay bookings
   * @param {number} organization_id - Organization ID
   * @returns {Object} Object with total_slots and available_slots
   */
  static async getOrganizationTotalSlots(organization_id) {
    // Get sum of total_slots from parking lots
    const slotsResult = await getRow(
      `SELECT SUM(total_slots) as total_slots
       FROM parking_lots 
       WHERE organization_id = ? AND is_active = 1`,
      [organization_id]
    );
    
    const total_slots = slotsResult?.total_slots || 0;
    
    // Count actual occupied slots from active AND overstay bookings
    const occupiedResult = await getRow(
      `SELECT COUNT(*) as occupied
       FROM bookings 
       WHERE organization_id = ? 
       AND booking_status IN ('active', 'overstay')`,
      [organization_id]
    );
    
    const occupied_slots = occupiedResult?.occupied || 0;
    const available_slots = Math.max(0, total_slots - occupied_slots);

    return {
      total_slots,
      available_slots,
      occupied_slots
    };
  }
}

// Export all functions
module.exports = {
  createParkingLot: ParkingLot.createParkingLot.bind(ParkingLot),
  getParkingLotsByOrganization: ParkingLot.getParkingLotsByOrganization.bind(ParkingLot),
  getParkingLotById: ParkingLot.getParkingLotById.bind(ParkingLot),
  updateParkingLot: ParkingLot.updateParkingLot.bind(ParkingLot),
  deleteParkingLot: ParkingLot.deleteParkingLot.bind(ParkingLot),
  updateAvailableSlots: ParkingLot.updateAvailableSlots.bind(ParkingLot),
  getNextAvailableSlotInLot: ParkingLot.getNextAvailableSlotInLot.bind(ParkingLot),
  getParkingLotStats: ParkingLot.getParkingLotStats.bind(ParkingLot),
  getOrganizationTotalSlots: ParkingLot.getOrganizationTotalSlots.bind(ParkingLot),

  // Export the class itself
  ParkingLot
};
