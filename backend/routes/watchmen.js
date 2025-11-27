const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { runQuery, getRow, getAllRows } = require('../config/db');
const {
  findById: findBookingById,
  markEntry,
  markExit,
  createBooking,
  checkSlotAvailability,
  getActiveBookings
} = require('../models/Booking');
const ParkingLot = require('../models/ParkingLot');
const { recordCashPayment } = require('../models/Payment');
const { findById: findUserById } = require('../models/User');
const { findById: findOrgById } = require('../models/Organization');
const { verifyToken } = require('../middleware/auth');
const { BadRequestError, UnauthorizedError, NotFoundError, ConflictError } = require('../middleware/errorHandler');
const { jwtConfig } = require('../config/auth.config');

/**
 * Middleware to check if user is a watchman
 */
const checkWatchman = async (req, res, next) => {
  try {
    // Check if user is a watchman (either via user_type or is_watchman flag)
    if (req.user.user_type !== 'watchman' && !req.user.is_watchman && !req.user.watchman_id) {
      throw new UnauthorizedError('Watchman authentication required');
    }
    
    // Get watchman_id from JWT payload or use user_id
    const watchman_id = req.user.watchman_id || req.user.user_id;
    
    // Verify watchman exists and is active
    const watchman = await getRow('SELECT * FROM watchmen WHERE id = ?', [watchman_id]);
    if (!watchman || !watchman.is_active) {
      throw new UnauthorizedError('Watchman account is not active');
    }
    
    // Store watchman details in request for use in route handlers
    req.watchman = watchman;
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/watchmen/login
 * Watchman login
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      throw new BadRequestError('Email and password are required');
    }
    
    // Query watchmen table with JOIN to users
    const watchman = await getRow(`
      SELECT w.*, u.email, u.password, u.name, u.mobile
      FROM watchmen w
      INNER JOIN users u ON w.user_id = u.id
      WHERE u.email = ? AND w.is_active = 1
    `, [email]);
    
    if (!watchman) {
      throw new UnauthorizedError('Invalid credentials');
    }
    
    // Verify password using bcrypt
    const isPasswordValid = await bcrypt.compare(password, watchman.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid credentials');
    }
    
    // Generate JWT with watchman_id and organization_id
    const payload = {
      watchman_id: watchman.id,
      user_id: watchman.user_id,
      organization_id: watchman.organization_id,
      email: watchman.email,
      user_type: 'watchman'
    };
    
    const token = jwt.sign(payload, jwtConfig.secret, {
      expiresIn: jwtConfig.expiresIn
    });
    
    // Return token and watchman details (without password)
    res.json({
      success: true,
      message: 'Watchman login successful',
      data: {
        token,
        watchman: {
          id: watchman.id,
          user_id: watchman.user_id,
          organization_id: watchman.organization_id,
          name: watchman.name,
          email: watchman.email,
          mobile: watchman.mobile,
          shift_start: watchman.shift_start,
          shift_end: watchman.shift_end
        }
      }
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/watchmen/scan-qr
 * Scan QR code to get booking details
 */
router.post('/scan-qr', verifyToken, checkWatchman, async (req, res, next) => {
  try {
    const { qr_code_data } = req.body;
    
    if (!qr_code_data) {
      throw new BadRequestError('qr_code_data is required');
    }
    
    // Decode QR data to extract booking_id and user_id
    let bookingData;
    try {
      bookingData = JSON.parse(qr_code_data);
    } catch (parseError) {
      throw new BadRequestError('Invalid QR code format');
    }
    
    const { booking_id, user_id } = bookingData;
    
    if (!booking_id || !user_id) {
      throw new BadRequestError('Invalid QR code: missing booking_id or user_id');
    }
    
    // Get booking details
    const booking = await findBookingById(booking_id);
    
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }
    
    // Verify booking is valid and active
    if (booking.booking_status !== 'active') {
      throw new BadRequestError(`Booking is ${booking.booking_status}, not active`);
    }
    
    // Verify booking belongs to the organization
    if (booking.organization_id !== req.user.organization_id) {
      throw new BadRequestError('Booking does not belong to this organization');
    }
    
    // Return booking details with user info
    res.json({
      success: true,
      message: 'QR code scanned successfully',
      data: {
        booking
      }
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/watchmen/verify-entry
 * Mark vehicle entry
 */
router.post('/verify-entry', verifyToken, checkWatchman, async (req, res, next) => {
  try {
    const { booking_id } = req.body;
    
    if (!booking_id) {
      throw new BadRequestError('booking_id is required');
    }
    
    // Get current time
    const entry_time = new Date().toISOString();
    
    // Mark entry
    const updatedBooking = await markEntry(booking_id, entry_time);
    
    // Return confirmation
    res.json({
      success: true,
      message: 'Entry verified successfully',
      data: {
        booking_id: updatedBooking.id,
        vehicle_number: updatedBooking.vehicle_number,
        slot_number: updatedBooking.slot_number,
        entry_time: updatedBooking.entry_time,
        user_name: updatedBooking.user_name
      }
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/watchmen/verify-exit
 * Mark vehicle exit
 */
router.post('/verify-exit', verifyToken, checkWatchman, async (req, res, next) => {
  try {
    const { booking_id } = req.body;
    
    if (!booking_id) {
      throw new BadRequestError('booking_id is required');
    }
    
    // Get booking details before exit
    const booking = await findBookingById(booking_id);
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }
    
    // Get current time
    const exit_time = new Date().toISOString();
    
    // Calculate duration if entry_time exists
    let actual_duration = null;
    if (booking.entry_time) {
      const entry = new Date(booking.entry_time);
      const exit = new Date(exit_time);
      actual_duration = Math.ceil((exit - entry) / (1000 * 60 * 60)); // hours
    }
    
    // Mark exit
    const updatedBooking = await markExit(booking_id, exit_time);
    
    // Return confirmation with duration and payment status
    res.json({
      success: true,
      message: 'Exit verified successfully',
      data: {
        booking_id: updatedBooking.id,
        vehicle_number: updatedBooking.vehicle_number,
        slot_number: updatedBooking.slot_number,
        entry_time: updatedBooking.entry_time,
        exit_time: updatedBooking.exit_time,
        duration_hours: actual_duration || booking.duration_hours,
        payment_status: updatedBooking.payment_status,
        amount: booking.amount,
        user_name: updatedBooking.user_name
      }
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/watchmen/assist-walkin
 * Get walk-in users waiting for assistance
 */
router.get('/assist-walkin', verifyToken, checkWatchman, async (req, res, next) => {
  try {
    const organization_id = req.user.organization_id;
    
    // Query walk-in users who need assistance
    // Get recent walk-in users with pending bookings or no bookings
    const walkInUsers = await getAllRows(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.mobile,
        u.created_at,
        CAST((julianday('now') - julianday(u.created_at)) * 24 * 60 AS INTEGER) as wait_time_minutes
      FROM users u
      WHERE u.user_type = 'walk_in'
        AND u.created_at >= datetime('now', '-2 hours')
        AND NOT EXISTS (
          SELECT 1 FROM bookings b 
          WHERE b.user_id = u.id 
            AND b.organization_id = ?
            AND b.booking_status = 'active'
        )
      ORDER BY u.created_at ASC
    `, [organization_id]);
    
    // Return list with user details and wait time
    res.json({
      success: true,
      data: {
        walk_in_users: walkInUsers,
        count: walkInUsers.length
      }
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/watchmen/assign-slot-walkin
 * Assign slot to walk-in user
 */
router.post('/assign-slot-walkin', verifyToken, checkWatchman, async (req, res, next) => {
  try {
    const { user_id, vehicle_number, estimated_duration } = req.body;
    const organization_id = req.user.organization_id;
    
    if (!user_id || !vehicle_number || !estimated_duration) {
      throw new BadRequestError('user_id, vehicle_number, and estimated_duration are required');
    }
    
    // Check slot availability
    const slotsAvailable = await checkSlotAvailability(organization_id);
    if (!slotsAvailable) {
      throw new ConflictError('No parking slots available');
    }
    
    // Get organization for rate calculation
    const organization = await findOrgById(organization_id);
    
    // Calculate amount
    const amount = estimated_duration * organization.visitor_hourly_rate;
    
    // Calculate booking times
    const booking_start_time = new Date().toISOString();
    const booking_end_time = new Date(Date.now() + estimated_duration * 60 * 60 * 1000).toISOString();
    
    // Try assign slot from parking lots in priority order
    const lots = await ParkingLot.getParkingLotsByOrganization(organization_id);
    if (!lots || lots.length === 0) {
      throw new ConflictError('No parking lots configured for this organization');
    }

    let slotInfo = null;
    let chosenLot = null;
    for (const lot of lots) {
      if (!lot.is_active || lot.available_slots <= 0) continue;
      slotInfo = await ParkingLot.getNextAvailableSlotInLot(lot.lot_id, organization_id, booking_start_time, booking_end_time);
      if (slotInfo) {
        chosenLot = lot;
        break;
      }
    }

    if (!slotInfo) {
      throw new ConflictError('Unable to assign slot number');
    }

    const slot_number_formatted = slotInfo.slot_number;

    // Create booking with status 'active' and immediate entry - include parking lot id
    const booking = await createBooking(
      user_id,
      organization_id,
      vehicle_number,
      slot_number_formatted,
      booking_start_time,
      booking_end_time,
      estimated_duration,
      amount,
      slotInfo.lot_id
    );
    
    // Mark entry immediately for walk-in
    const entry_time = new Date().toISOString();
    await markEntry(booking.id, entry_time);
    
    // Return slot assignment details
    res.status(201).json({
      success: true,
      message: 'Slot assigned successfully',
      data: {
        booking_id: booking.id,
        user_id,
        vehicle_number,
        slot_number: slot_number_formatted,
        estimated_duration,
        amount,
        entry_time,
        payment_status: booking.payment_status
      }
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/watchmen/cash-payment
 * Record cash payment
 */
router.post('/cash-payment', verifyToken, checkWatchman, async (req, res, next) => {
  try {
    const { booking_id, amount } = req.body;
    const watchman_id = req.watchman.id;
    
    if (!booking_id || !amount) {
      throw new BadRequestError('booking_id and amount are required');
    }
    
    // Validate amount is positive
    if (amount <= 0) {
      throw new BadRequestError('Amount must be greater than 0');
    }
    
    // Get booking details
    const booking = await findBookingById(booking_id);
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }
    
    // Record cash payment
    const payment = await recordCashPayment(booking_id, amount, watchman_id);
    
    // Return payment confirmation
    res.json({
      success: true,
      message: 'Cash payment recorded successfully',
      data: {
        payment
      }
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/watchmen/current-status
 * Get current parking status
 */
router.get('/current-status', verifyToken, checkWatchman, async (req, res, next) => {
  try {
    const organization_id = req.user.organization_id;
    
    // Get active bookings
    const activeBookings = await getActiveBookings(organization_id);
    
    // Get walk-ins waiting
    const walkInsWaiting = await getAllRows(`
      SELECT COUNT(*) as count
      FROM users u
      WHERE u.user_type = 'walk_in'
        AND u.created_at >= datetime('now', '-2 hours')
        AND NOT EXISTS (
          SELECT 1 FROM bookings b 
          WHERE b.user_id = u.id 
            AND b.organization_id = ?
            AND b.booking_status = 'active'
        )
    `, [organization_id]);
    
    // Get organization details
    const organization = await findOrgById(organization_id);
    
    // Get recent entries (last 10)
    const recentEntries = await getAllRows(`
      SELECT 
        b.id,
        b.vehicle_number,
        b.slot_number,
        b.entry_time,
        u.name as user_name
      FROM bookings b
      INNER JOIN users u ON b.user_id = u.id
      WHERE b.organization_id = ?
        AND b.entry_time IS NOT NULL
        AND b.booking_status = 'active'
      ORDER BY b.entry_time DESC
      LIMIT 10
    `, [organization_id]);
    
    // Get recent exits (last 10)
    const recentExits = await getAllRows(`
      SELECT 
        b.id,
        b.vehicle_number,
        b.slot_number,
        b.exit_time,
        u.name as user_name
      FROM bookings b
      INNER JOIN users u ON b.user_id = u.id
      WHERE b.organization_id = ?
        AND b.exit_time IS NOT NULL
        AND b.booking_status = 'completed'
      ORDER BY b.exit_time DESC
      LIMIT 10
    `, [organization_id]);
    
    // Return current parking status
    res.json({
      success: true,
      data: {
        organization_id,
        active_bookings_count: activeBookings.length,
        walk_ins_waiting_count: walkInsWaiting[0]?.count || 0,
        available_slots: organization.available_slots,
        total_slots: organization.total_slots,
        occupancy_rate: ((organization.total_slots - organization.available_slots) / organization.total_slots * 100).toFixed(2),
        recent_entries: recentEntries,
        recent_exits: recentExits
      }
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/watchmen/add
 * Add a new watchman to organization (Admin only)
 */
router.post('/add', verifyToken, async (req, res, next) => {
  try {
    const { name, email, mobile, employee_id, password, organization_id, shift_start, shift_end } = req.body;
    
    // Validate required fields
    if (!name || !email || !mobile || !employee_id || !password || !organization_id) {
      throw new BadRequestError('All fields are required: name, email, mobile, employee_id, password, organization_id');
    }

    // Verify requester is admin
    if (req.user.user_type !== 'admin') {
      throw new UnauthorizedError('Only organization admins can add watchmen');
    }

    // Check if email already exists
    const existingByEmail = await getRow('SELECT * FROM watchmen WHERE email = ?', [email]);
    if (existingByEmail) {
      throw new ConflictError('Email already exists');
    }

    // Check if employee_id already exists
    const existingByEmpId = await getRow('SELECT * FROM watchmen WHERE employee_id = ?', [employee_id]);
    if (existingByEmpId) {
      throw new ConflictError('Employee ID already exists');
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Insert watchman
    const result = await runQuery(`
      INSERT INTO watchmen (name, email, mobile, employee_id, password_hash, organization_id, shift_start, shift_end, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
    `, [name, email, mobile, employee_id, password_hash, organization_id, shift_start || null, shift_end || null]);

    // Return created watchman
    res.status(201).json({
      success: true,
      message: 'Watchman added successfully',
      data: {
        id: result.lastID,
        name,
        email,
        mobile,
        employee_id,
        organization_id,
        shift_start,
        shift_end
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/watchmen/organization/:orgId
 * Get all watchmen for an organization (Admin only)
 */
router.get('/organization/:orgId', verifyToken, async (req, res, next) => {
  try {
    const { orgId } = req.params;

    // Verify requester is admin
    if (req.user.user_type !== 'admin') {
      throw new UnauthorizedError('Only organization admins can view watchmen');
    }

    // Get watchmen
    const watchmen = await getAllRows(`
      SELECT id, name, email, mobile, employee_id, shift_start, shift_end, is_active, created_at
      FROM watchmen
      WHERE organization_id = ?
      ORDER BY created_at DESC
    `, [orgId]);

    res.json({
      success: true,
      data: {
        watchmen,
        count: watchmen.length
      }
    });

  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/watchmen/:watchmanId
 * Remove watchman (Admin only)
 */
router.delete('/:watchmanId', verifyToken, async (req, res, next) => {
  try {
    const { watchmanId } = req.params;

    // Verify requester is admin
    if (req.user.user_type !== 'admin') {
      throw new UnauthorizedError('Only organization admins can remove watchmen');
    }

    // Check if watchman exists
    const watchman = await getRow('SELECT * FROM watchmen WHERE id = ?', [watchmanId]);
    if (!watchman) {
      throw new NotFoundError('Watchman not found');
    }

    // Delete watchman
    await runQuery('DELETE FROM watchmen WHERE id = ?', [watchmanId]);

    res.json({
      success: true,
      message: 'Watchman removed successfully'
    });

  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/watchmen/:watchmanId
 * Update watchman details (Admin only)
 */
router.put('/:watchmanId', verifyToken, async (req, res, next) => {
  try {
    const { watchmanId } = req.params;
    const { name, email, mobile, shift_start, shift_end, is_active } = req.body;

    // Verify requester is admin
    if (req.user.user_type !== 'admin') {
      throw new UnauthorizedError('Only organization admins can update watchmen');
    }

    // Check if watchman exists
    const watchman = await getRow('SELECT * FROM watchmen WHERE id = ?', [watchmanId]);
    if (!watchman) {
      throw new NotFoundError('Watchman not found');
    }

    // Build update query
    const updates = [];
    const values = [];

    if (name) {
      updates.push('name = ?');
      values.push(name);
    }
    if (email) {
      updates.push('email = ?');
      values.push(email);
    }
    if (mobile) {
      updates.push('mobile = ?');
      values.push(mobile);
    }
    if (shift_start !== undefined) {
      updates.push('shift_start = ?');
      values.push(shift_start);
    }
    if (shift_end !== undefined) {
      updates.push('shift_end = ?');
      values.push(shift_end);
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(is_active ? 1 : 0);
    }

    if (updates.length === 0) {
      throw new BadRequestError('No fields to update');
    }

    values.push(watchmanId);

    // Update watchman
    await runQuery(`
      UPDATE watchmen
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, values);

    // Get updated watchman
    const updatedWatchman = await getRow('SELECT id, name, email, mobile, employee_id, shift_start, shift_end, is_active FROM watchmen WHERE id = ?', [watchmanId]);

    res.json({
      success: true,
      message: 'Watchman updated successfully',
      data: updatedWatchman
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
