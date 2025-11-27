const { runQuery, getRow, getAllRows } = require('../config/db');
const { updateAvailableSlots } = require('./Organization');

class Booking {
  /**
   * Create a new booking
   * @param {number} user_id - User ID
   * @param {number} organization_id - Organization ID
   * @param {string} vehicle_number - Vehicle registration number
   * @param {string} slot_number - Parking slot number
   * @param {string} booking_start_time - Booking start time (ISO format)
   * @param {string} booking_end_time - Booking end time (ISO format)
   * @param {number} duration_hours - Duration in hours
   * @param {number} amount - Booking amount
   * @param {number} parking_lot_id - Parking lot ID (optional)
   * @returns {Object} Created booking with id
   */
  static async createBooking(
    user_id,
    organization_id,
    vehicle_number,
    slot_number,
    booking_start_time,
    booking_end_time,
    duration_hours,
    amount,
    parking_lot_id = null
  ) {
    // 🔍 DETAILED LOGGING: Booking creation
    console.log('\n' + '🎫'.repeat(35));
    console.log('🎫 BOOKING MODEL: createBooking()');
    console.log('🎫'.repeat(35));
    console.log('🎫 Input Data:');
    console.log('🎫   - User ID:', user_id, '(type:', typeof user_id + ')');
    console.log('🎫   - Organization ID:', organization_id, '(type:', typeof organization_id + ')');
    console.log('🎫   - Parking Lot ID:', parking_lot_id, '(type:', typeof parking_lot_id + ')');
    console.log('🎫   - Vehicle Number:', vehicle_number);
    console.log('🎫   - Slot Number:', slot_number);
    console.log('🎫   - Start Time:', booking_start_time);
    console.log('🎫   - End Time:', booking_end_time);
    console.log('🎫   - Duration Hours:', duration_hours);
    console.log('🎫   - Amount:', amount);
    
    // Get user details to determine payment status
    console.log('🔍 Fetching user for payment status...');
    const user = await getRow('SELECT user_type, organization_id FROM users WHERE id = ?', [user_id]);
    
    if (!user) {
      console.log('❌ User not found for ID:', user_id);
      console.log('⚠️  This will cause a FOREIGN KEY constraint violation (user_id)!');
    } else {
      console.log('✅ User found - Type:', user.user_type, '| Org:', user.organization_id);
    }
    
    // Check if slot is already occupied by an active or confirmed booking
    console.log('🔍 Checking if slot', slot_number, 'is already occupied...');
    const existingBooking = await getRow(
      `SELECT id, vehicle_number, booking_status FROM bookings 
       WHERE organization_id = ? 
       AND slot_number = ? 
       AND booking_status NOT IN ('completed', 'cancelled')`,
      [organization_id, slot_number]
    );
    
    if (existingBooking) {
      console.log('❌ SLOT ALREADY OCCUPIED!');
      console.log('   Existing Booking ID:', existingBooking.id);
      console.log('   Vehicle:', existingBooking.vehicle_number);
      console.log('   Status:', existingBooking.booking_status);
      throw new Error(`Slot ${slot_number} is already occupied. Please choose another slot.`);
    }
    console.log('✅ Slot is available');
    
    // Calculate payment_status: 'completed' for members, 'pending' for visitors
    let payment_status = 'pending';
    if (user && user.user_type === 'organization_member' && user.organization_id === organization_id) {
      payment_status = 'completed'; // Free parking for members
    }
    console.log('🎫 Payment Status:', payment_status);
    
    // Determine booking_status based on start time
    // If booking starts in the future, it's 'confirmed' (scheduled)
    // If booking starts now or in the past, it's 'active' (ongoing)
    const startTime = new Date(booking_start_time);
    const currentTime = new Date();
    const booking_status = startTime > currentTime ? 'confirmed' : 'active';
    console.log('🎫 Booking Status:', booking_status, '(Start:', startTime.toISOString(), '| Current:', currentTime.toISOString() + ')');
    
    // Insert booking
    const sql = `INSERT INTO bookings (
      user_id, organization_id, parking_lot_id, vehicle_number, slot_number,
      booking_start_time, booking_end_time, duration_hours, amount,
      payment_status, booking_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    const params = [
      user_id,
      organization_id,
      parking_lot_id,
      vehicle_number,
      slot_number,
      booking_start_time,
      booking_end_time,
      duration_hours,
      amount,
      payment_status,
      booking_status
    ];
    
    console.log('🎫 SQL Query:', sql);
    console.log('🎫 Parameters:', JSON.stringify({
      user_id,
      organization_id,
      parking_lot_id,
      vehicle_number,
      slot_number,
      booking_start_time,
      booking_end_time,
      duration_hours,
      amount,
      payment_status,
      booking_status
    }, null, 2));
    console.log('🎫'.repeat(35) + '\n');
    
    const result = await runQuery(sql, params);
    
    console.log('✅ Booking inserted with ID:', result.lastID);
    
    // Don't decrement available_slots on booking creation
    // Slots will be decremented only when booking becomes 'active'
    // This allows multiple users to book the same slot for different time periods
    
    // Return created booking object
    return {
      id: result.lastID,
      user_id,
      organization_id,
      parking_lot_id,
      vehicle_number,
      slot_number,
      booking_start_time,
      booking_end_time,
      duration_hours,
      amount,
      payment_status,
      booking_status,
      entry_time: null,
      exit_time: null,
      created_at: new Date().toISOString()
    };
  }

  /**
   * Find booking by ID with complete details
   * @param {number} id - Booking ID
   * @returns {Object|null} Complete booking details with user and organization info
   */
  static async findById(id) {
    const sql = `
      SELECT 
        b.*,
        u.name as user_name,
        u.email as user_email,
        u.mobile as user_mobile,
        u.user_type,
        o.org_name,
        o.address as org_address,
        o.admin_email as organization_admin_email,
        pl.lot_name as parking_lot_name,
        pl.lot_description as parking_lot_description
      FROM bookings b
      INNER JOIN users u ON b.user_id = u.id
      INNER JOIN organizations o ON b.organization_id = o.id
      LEFT JOIN parking_lots pl ON b.parking_lot_id = pl.lot_id
      WHERE b.id = ?
    `;
    
    return await getRow(sql, [id]);
  }

  /**
   * Find all bookings by user ID
   * @param {number} user_id - User ID
   * @returns {Array} User's bookings with organization details
   */
  static async findByUserId(user_id) {
    const sql = `
      SELECT 
        b.id,
        b.vehicle_number,
        b.slot_number,
        b.booking_start_time,
        b.booking_end_time,
        b.duration_hours,
        b.amount,
        b.payment_status,
        b.booking_status,
        b.entry_time,
        b.exit_time,
        b.qr_code_data,
        b.created_at,
        o.org_name,
        o.address as org_address,
        pl.lot_name as parking_lot_name
      FROM bookings b
      INNER JOIN organizations o ON b.organization_id = o.id
      LEFT JOIN parking_lots pl ON b.parking_lot_id = pl.lot_id
      WHERE b.user_id = ?
      ORDER BY b.created_at DESC
    `;
    
    const bookings = await getAllRows(sql, [user_id]);
    
    // Auto-update booking status: confirmed → active when start time arrives
    const now = new Date();
    for (const booking of bookings) {
      if (booking.booking_status === 'confirmed') {
        const startTime = new Date(booking.booking_start_time);
        if (startTime <= now) {
          // Update status to active
          await runQuery(
            'UPDATE bookings SET booking_status = ? WHERE id = ?',
            ['active', booking.id]
          );
          booking.booking_status = 'active';
          console.log(`✅ Auto-updated booking ${booking.id} from confirmed → active`);
        }
      }
    }
    
    return bookings;
  }

  /**
   * Find all bookings by organization ID
   * @param {number} organization_id - Organization ID
   * @param {Object} filters - Optional filters (startDate, endDate, status)
   * @returns {Array} Organization's bookings with user details
   */
  static async findByOrganizationId(organization_id, filters = {}) {
    let sql = `
      SELECT 
        b.*,
        u.name as user_name,
        u.email as user_email,
        u.mobile as user_mobile,
        u.user_type,
        pl.lot_name as parking_lot_name
      FROM bookings b
      INNER JOIN users u ON b.user_id = u.id
      LEFT JOIN parking_lots pl ON b.parking_lot_id = pl.lot_id
      WHERE b.organization_id = ?
    `;
    
    const params = [organization_id];
    
    // Apply date range filter
    if (filters.startDate) {
      sql += ' AND b.booking_start_time >= ?';
      params.push(filters.startDate);
    }
    
    if (filters.endDate) {
      sql += ' AND b.booking_end_time <= ?';
      params.push(filters.endDate);
    }
    
    // Apply status filter
    if (filters.status) {
      sql += ' AND b.booking_status = ?';
      params.push(filters.status);
    }
    
    sql += ' ORDER BY b.created_at DESC';
    
    return await getAllRows(sql, params);
  }

  /**
   * Update booking status
   * @param {number} booking_id - Booking ID
   * @param {string} new_status - New status ('confirmed', 'active', 'completed', 'cancelled', 'overstay')
   * @returns {Object} Updated booking
   */
  static async updateBookingStatus(booking_id, new_status) {
    // Get current booking
    const booking = await getRow('SELECT * FROM bookings WHERE id = ?', [booking_id]);
    if (!booking) {
      throw new Error('Booking not found');
    }
    
    // Update status
    await runQuery(
      'UPDATE bookings SET booking_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [new_status, booking_id]
    );
    
    // If status is 'completed' or 'cancelled', increment available_slots
    // Only if previous status was 'active' (slot was actually occupied)
    // Confirmed bookings don't occupy slots until they become active
    if ((new_status === 'completed' || new_status === 'cancelled') && 
        booking.booking_status === 'active') {
      await updateAvailableSlots(booking.organization_id, 1);
    }
    
    // Return updated booking
    return await this.findById(booking_id);
  }

  /**
   * Mark entry time for booking
   * @param {number} booking_id - Booking ID
   * @param {string} entry_time - Entry timestamp (ISO format)
   * @returns {Object} Updated booking
   */
  static async markEntry(booking_id, entry_time) {
    await runQuery(
      'UPDATE bookings SET entry_time = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [entry_time, booking_id]
    );
    
    return await this.findById(booking_id);
  }

  /**
   * Mark exit time and complete booking
   * @param {number} booking_id - Booking ID
   * @param {string} exit_time - Exit timestamp (ISO format)
   * @returns {Object} Updated booking
   */
  static async markExit(booking_id, exit_time) {
    // Get current booking
    const booking = await getRow('SELECT * FROM bookings WHERE id = ?', [booking_id]);
    if (!booking) {
      throw new Error('Booking not found');
    }
    
    // Update exit_time and set status to 'completed'
    await runQuery(
      `UPDATE bookings 
       SET exit_time = ?, booking_status = 'completed', updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [exit_time, booking_id]
    );
    
    // Increment available_slots only if booking was active
    if (booking.booking_status === 'active') {
      await updateAvailableSlots(booking.organization_id, 1);
    }
    
    return await this.findById(booking_id);
  }

  /**
   * Check slot availability for organization
   * @param {number} organization_id - Organization ID
   * @param {string} requested_time - Requested booking time (optional)
   * @returns {boolean} True if slots available, false otherwise
   */
  static async checkSlotAvailability(organization_id, requested_time = null) {
    const org = await getRow(
      'SELECT available_slots FROM organizations WHERE id = ?',
      [organization_id]
    );
    
    if (!org) {
      return false;
    }
    
    return org.available_slots > 0;
  }

  /**
   * Get all active bookings for organization
   * @param {number} organization_id - Organization ID
   * @returns {Array} Active bookings with user details
   */
  static async getActiveBookings(organization_id) {
    const sql = `
      SELECT 
        b.id,
        b.vehicle_number,
        b.slot_number,
        b.parking_lot_id,
        b.booking_start_time,
        b.booking_end_time,
        b.entry_time,
        b.payment_status,
        b.booking_status,
        u.name as user_name,
        u.email as user_email,
        u.mobile as user_mobile,
        u.user_type,
        pl.lot_name as parking_lot_name
      FROM bookings b
      INNER JOIN users u ON b.user_id = u.id
      LEFT JOIN parking_lots pl ON b.parking_lot_id = pl.lot_id
      WHERE b.organization_id = ? 
        AND b.booking_status NOT IN ('completed', 'cancelled')
      ORDER BY b.booking_start_time ASC
    `;
    
    return await getAllRows(sql, [organization_id]);
  }

  // Legacy methods for backward compatibility
  static async create(bookingData) {
    const {
      userId,
      organizationId,
      vehicleNumber,
      slotNumber,
      startTime,
      endTime,
      durationHours,
      amount,
      parking_lot_id,
      parkingLotId
    } = bookingData;

    // support both snake_case and camelCase names for parking lot id
    const lotId = parking_lot_id || parkingLotId || null;

    return await this.createBooking(
      userId,
      organizationId,
      vehicleNumber,
      slotNumber,
      startTime,
      endTime,
      durationHours,
      amount,
      lotId
    );
  }

  static async update(id, bookingData) {
    const { booking_status } = bookingData;
    if (booking_status) {
      return await this.updateBookingStatus(id, booking_status);
    }
    throw new Error('No valid fields to update');
  }

  static async cancel(id) {
    return await this.updateBookingStatus(id, 'cancelled');
  }

  static async delete(id) {
    return await runQuery('DELETE FROM bookings WHERE id = ?', [id]);
  }
}

// Export all functions
module.exports = {
  createBooking: Booking.createBooking.bind(Booking),
  findById: Booking.findById.bind(Booking),
  findByUserId: Booking.findByUserId.bind(Booking),
  findByOrganizationId: Booking.findByOrganizationId.bind(Booking),
  updateBookingStatus: Booking.updateBookingStatus.bind(Booking),
  markEntry: Booking.markEntry.bind(Booking),
  markExit: Booking.markExit.bind(Booking),
  checkSlotAvailability: Booking.checkSlotAvailability.bind(Booking),
  getActiveBookings: Booking.getActiveBookings.bind(Booking),
  
  // Export the class itself for additional methods
  Booking
};
