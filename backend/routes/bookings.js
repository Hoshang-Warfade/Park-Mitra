const express = require('express');
const router = express.Router();
const {
  createBooking,
  findById,
  findByUserId,
  findByOrganizationId,
  updateBookingStatus,
  markEntry,
  markExit,
  checkSlotAvailability,
  getActiveBookings
} = require('../models/Booking');
const { findById: findOrgById, updateAvailableSlots } = require('../models/Organization');
const { findById: findUserById } = require('../models/User');
const ParkingLot = require('../models/ParkingLot');
const { verifyToken } = require('../middleware/auth');
const { validateBooking } = require('../middleware/validation');
const { generateQRCode } = require('../utils/qrGenerator');
const { runQuery, getRow, getAllRows } = require('../config/db');
const { BadRequestError, NotFoundError, ConflictError, ForbiddenError } = require('../middleware/errorHandler');

/**
 * POST /api/bookings/create
 * Create a new booking
 */
router.post('/create', verifyToken, validateBooking, async (req, res, next) => {
  try {
    const {
      organization_id,
      vehicle_number,
      booking_start_time,
      booking_end_time
    } = req.body;
    
    // 🔍 DETAILED LOGGING: Booking creation attempt
    console.log('\n' + '🅿️'.repeat(35));
    console.log('🅿️  BOOKING CREATION ATTEMPT');
    console.log('🅿️'.repeat(35));
    console.log('🅿️  User ID:', req.user.user_id);
    console.log('🅿️  Organization ID:', organization_id, '(type:', typeof organization_id + ')');
    console.log('🅿️  Vehicle Number:', vehicle_number);
    console.log('🅿️  Start Time:', booking_start_time);
    console.log('🅿️  End Time:', booking_end_time);
    console.log('🅿️'.repeat(35) + '\n');
    
    // Validate required fields
    if (!organization_id || !vehicle_number || !booking_start_time || !booking_end_time) {
      throw new BadRequestError('organization_id, vehicle_number, and booking times are required');
    }
    
    // Get user from req.user (includes user_type)
    console.log('🔍 Fetching user details for ID:', req.user.user_id);
    const user = await findUserById(req.user.user_id);
    if (!user) {
      console.log('❌ User not found:', req.user.user_id);
      throw new NotFoundError('User not found');
    }
    console.log('✅ User found:', user.name, '| Type:', user.user_type, '| Org ID:', user.organization_id);
    
    // Check slot availability
    console.log('🔍 Checking slot availability for organization:', organization_id);
    const slotsAvailable = await checkSlotAvailability(organization_id, booking_start_time);
    if (!slotsAvailable) {
      console.log('❌ No slots available');
      throw new ConflictError('No parking slots available');
    }
    console.log('✅ Slots available');
    
    // Get organization details for rate calculation
    console.log('🔍 Fetching organization details for ID:', organization_id);
    const organization = await findOrgById(organization_id);
    if (!organization) {
      console.log('❌ Organization not found:', organization_id);
      console.log('⚠️  This will likely cause a FOREIGN KEY constraint violation!');
      throw new NotFoundError('Organization not found');
    }
    console.log('✅ Organization found:', organization.org_name);
    
    // Calculate duration in hours
    const start = new Date(booking_start_time);
    const end = new Date(booking_end_time);
    const duration_hours = Math.ceil((end - start) / (1000 * 60 * 60));
    
    if (duration_hours <= 0) {
      throw new BadRequestError('Invalid booking times: end time must be after start time');
    }
    
    // Calculate amount based on user_type and organization
    let amount = 0;
    if (user.user_type === 'organization_member' && user.organization_id === organization_id) {
      // Free parking for organization members at THEIR OWN organization
      amount = 0;
    } else {
      // Paid parking for:
      // 1. Visitors (user_type === 'visitor')
      // 2. Walk-ins (user_type === 'walk_in')
      // 3. Organization members visiting OTHER organizations (user.organization_id !== organization_id)
      amount = duration_hours * organization.visitor_hourly_rate;
    }
    
    // Assign slot_number with parking lot based allocation
    // Get all parking lots for this organization (sorted by priority)
    const parkingLots = await ParkingLot.getParkingLotsByOrganization(organization_id, true);
    
    if (!parkingLots || parkingLots.length === 0) {
      throw new ConflictError('No parking lots configured for this organization. Please contact the administrator.');
    }
    
    // Try to allocate slot from parking lots in priority order
    let slotInfo = null;
    let chosenLot = null;
    
    for (const lot of parkingLots) {
      // Skip inactive lots or lots with no available slots
      if (!lot.is_active || lot.available_slots <= 0) {
        console.log(`🅿️  Skipping lot ${lot.lot_name} (Active: ${lot.is_active}, Available: ${lot.available_slots})`);
        continue;
      }
      
      // Try to get next available slot in this lot
      slotInfo = await ParkingLot.getNextAvailableSlotInLot(
        lot.lot_id, 
        organization_id, 
        booking_start_time, 
        booking_end_time
      );
      
      if (slotInfo) {
        chosenLot = lot;
        console.log(`✅ Allocated slot from lot: ${lot.lot_name} (Priority: ${lot.priority_order})`);
        break;
      }
    }
    
    if (!slotInfo) {
      throw new ConflictError('No available slots for the requested time period. All parking lots are full.');
    }
    
    const slot_number = slotInfo.slot_number;
    const parking_lot_id = slotInfo.lot_id;
    
    // Create booking
    console.log('🅿️  Creating booking with:');
    console.log('🅿️    - User ID:', user.id);
    console.log('🅿️    - Organization ID:', organization_id);
    console.log('🅿️    - Parking Lot ID:', parking_lot_id);
    console.log('🅿️    - Parking Lot Name:', slotInfo.lot_name);
    console.log('🅿️    - Vehicle Number:', vehicle_number);
    console.log('🅿️    - Slot Number:', slot_number);
    console.log('🅿️    - Duration:', duration_hours, 'hours');
    console.log('🅿️    - Amount: ₹', amount);
    
    const booking = await createBooking(
      user.id,
      organization_id,
      vehicle_number,
      slot_number,
      booking_start_time,
      booking_end_time,
      duration_hours,
      amount,
      parking_lot_id
    );
    
    console.log('✅ Booking created successfully with ID:', booking.id);
    
    // Generate QR code data (booking_id + user_id encoded)
    const qrData = {
      booking_id: booking.id,
      user_id: user.id,
      organization_id,
      vehicle_number,
      slot_number,
      booking_start_time
    };
    
    const qr_code_data = await generateQRCode(JSON.stringify(qrData));
    
    // Save QR code to database
    await runQuery(
      'UPDATE bookings SET qr_code_data = ? WHERE id = ?',
      [qr_code_data, booking.id]
    );
    console.log('✅ QR code saved to database for booking:', booking.id);
    
    // Return booking details with QR code
    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: {
        booking: {
          ...booking,
          qr_code_data
        }
      }
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/bookings/user/:userId
 * Get all bookings for a user
 */
router.get('/user/:userId', verifyToken, async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    // Verify user can only access own bookings (or is admin)
    if (req.user.user_id !== parseInt(userId) && req.user.user_type !== 'admin') {
      throw new ForbiddenError('You can only access your own bookings');
    }
    
    // Get user bookings
    const bookings = await findByUserId(userId);
    
    // Return array of bookings
    res.json({
      success: true,
      data: {
        bookings
      }
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/bookings/organization/:orgId
 * Get all bookings for an organization
 */
router.get('/organization/:orgId', verifyToken, async (req, res, next) => {
  try {
    const { orgId } = req.params;
    const { status, start_date, end_date } = req.query;
    
    // Check user is admin or watchman of organization
    const user = await findUserById(req.user.user_id);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    
    // TODO: Add watchman check when Watchman model is ready
    const isAuthorized = (
      user.user_type === 'organization_member' && 
      user.organization_id === parseInt(orgId)
    );
    
    if (!isAuthorized && req.user.user_type !== 'admin') {
      throw new ForbiddenError('You do not have access to this organization\'s bookings');
    }
    
    // Build filters
    const filters = {};
    if (status) filters.status = status;
    if (start_date) filters.startDate = start_date;
    if (end_date) filters.endDate = end_date;
    
    // Get organization bookings with filters
    const bookings = await findByOrganizationId(orgId, filters);
    
    // Return bookings
    res.json({
      success: true,
      data: {
        bookings,
        filters: filters
      }
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/bookings/update-status/:bookingId
 * Update booking status
 */
router.put('/update-status/:bookingId', verifyToken, async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body;
    
    // Validate new status
    const validStatuses = ['active', 'completed', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      throw new BadRequestError('Invalid status. Must be: active, completed, or cancelled');
    }
    
    // Check if booking exists
    const booking = await findById(bookingId);
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }
    
    // Update booking status
    const updatedBooking = await updateBookingStatus(bookingId, status);
    
    // Return updated booking
    res.json({
      success: true,
      message: 'Booking status updated successfully',
      data: {
        booking: updatedBooking
      }
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/bookings/mark-entry
 * Mark vehicle entry (watchman only)
 */
router.post('/mark-entry', verifyToken, async (req, res, next) => {
  try {
    const { booking_id, entry_time } = req.body;
    
    // TODO: Add checkWatchman middleware when Watchman model is ready
    // For now, allow organization members
    const user = await findUserById(req.user.user_id);
    if (user.user_type !== 'organization_member') {
      throw new ForbiddenError('Only watchmen can mark entry');
    }
    
    // Validate required fields
    if (!booking_id || !entry_time) {
      throw new BadRequestError('booking_id and entry_time are required');
    }
    
    // Check if booking exists
    const booking = await findById(booking_id);
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }
    
    // Mark entry
    const updatedBooking = await markEntry(booking_id, entry_time);
    
    // Return confirmation with entry details
    res.json({
      success: true,
      message: 'Entry marked successfully',
      data: {
        booking: updatedBooking,
        entry_time: updatedBooking.entry_time
      }
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/bookings/mark-exit
 * Mark vehicle exit (watchman only)
 */
router.post('/mark-exit', verifyToken, async (req, res, next) => {
  try {
    const { booking_id, exit_time } = req.body;
    
    // TODO: Add checkWatchman middleware when Watchman model is ready
    const user = await findUserById(req.user.user_id);
    if (user.user_type !== 'organization_member') {
      throw new ForbiddenError('Only watchmen can mark exit');
    }
    
    // Validate required fields
    if (!booking_id || !exit_time) {
      throw new BadRequestError('booking_id and exit_time are required');
    }
    
    // Check if booking exists
    const booking = await findById(booking_id);
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }
    
    // Calculate final amount based on actual duration if payment pending
    let finalAmount = booking.amount;
    if (booking.payment_status === 'pending' && booking.entry_time) {
      const organization = await findOrgById(booking.organization_id);
      const entryDate = new Date(booking.entry_time);
      const exitDate = new Date(exit_time);
      const actualDuration = Math.ceil((exitDate - entryDate) / (1000 * 60 * 60));
      
      if (actualDuration > 0) {
        finalAmount = actualDuration * organization.visitor_hourly_rate;
      }
    }
    
    // Mark exit
    const updatedBooking = await markExit(booking_id, exit_time);
    
    // Return exit confirmation
    res.json({
      success: true,
      message: 'Exit marked successfully',
      data: {
        booking: updatedBooking,
        exit_time: updatedBooking.exit_time,
        final_amount: finalAmount,
        payment_status: updatedBooking.payment_status
      }
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/bookings/active/:orgId
 * Get active bookings for parking visualization
 */
router.get('/active/:orgId', verifyToken, async (req, res, next) => {
  try {
    const { orgId } = req.params;
    
    // Get active bookings
    const activeBookings = await getActiveBookings(orgId);
    
    // Return current parking status
    res.json({
      success: true,
      data: {
        active_bookings: activeBookings,
        count: activeBookings.length
      }
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/bookings/check-availability/:orgId
 * Check slot availability (public route)
 */
router.get('/check-availability/:orgId', async (req, res, next) => {
  try {
    const { orgId } = req.params;
    
    // Get organization details
    const organization = await findOrgById(orgId);
    if (!organization) {
      throw new NotFoundError('Organization not found');
    }
    
    // Check slot availability
    const isAvailable = await checkSlotAvailability(orgId);
    
    // Return available slot count
    res.json({
      success: true,
      data: {
        organization_id: parseInt(orgId),
        organization_name: organization.org_name,
        total_slots: organization.total_slots,
        available_slots: organization.available_slots,
        is_available: isAvailable,
        occupancy_rate: ((organization.total_slots - organization.available_slots) / organization.total_slots * 100).toFixed(2)
      }
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/bookings/check-extension/:bookingId
 * Check if booking can be extended with same slot
 */
router.post('/check-extension/:bookingId', verifyToken, async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const { extension_hours } = req.body;
    
    if (!extension_hours || extension_hours <= 0) {
      throw new BadRequestError('extension_hours is required and must be positive');
    }
    
    // Get current booking
    const booking = await findById(bookingId);
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }
    
    // Verify user owns this booking
    if (req.user.user_id !== booking.user_id) {
      throw new ForbiddenError('You can only extend your own bookings');
    }
    
    // Check if booking is active
    if (booking.booking_status !== 'active') {
      throw new BadRequestError('Only active bookings can be extended');
    }
    
    // Calculate new end time
    const currentEndTime = new Date(booking.booking_end_time);
    const newEndTime = new Date(currentEndTime.getTime() + (extension_hours * 60 * 60 * 1000));
    
    // Check if the same slot is available for the extension period
    const conflictingSql = `
      SELECT COUNT(*) as count
      FROM bookings
      WHERE organization_id = ?
        AND slot_number = ?
        AND id != ?
        AND booking_status = 'active'
        AND (
          (booking_start_time <= ? AND booking_end_time > ?)
          OR (booking_start_time < ? AND booking_end_time >= ?)
          OR (booking_start_time >= ? AND booking_end_time <= ?)
        )
    `;
    
    const conflictResult = await getRow(conflictingSql, [
      booking.organization_id,
      booking.slot_number,
      bookingId,
      currentEndTime.toISOString(), currentEndTime.toISOString(),
      newEndTime.toISOString(), newEndTime.toISOString(),
      currentEndTime.toISOString(), newEndTime.toISOString()
    ]);
    
    const canExtendSameSlot = conflictResult.count === 0;
    
    // Get organization for rate calculation
    const organization = await findOrgById(booking.organization_id);
    const user = await findUserById(req.user.user_id);
    
    // Calculate additional amount
    let additionalAmount = 0;
    if (user.user_type === 'organization_member' && user.organization_id === booking.organization_id) {
      // Free extension for organization members at their own organization
      additionalAmount = 0;
    } else {
      // Paid extension for visitors, walk-ins, or members visiting other organizations
      additionalAmount = extension_hours * organization.visitor_hourly_rate;
    }
    
    res.json({
      success: true,
      data: {
        can_extend_same_slot: canExtendSameSlot,
        current_slot: booking.slot_number,
        current_end_time: booking.booking_end_time,
        new_end_time: newEndTime.toISOString(),
        extension_hours,
        additional_amount: additionalAmount,
        message: canExtendSameSlot 
          ? 'Slot is available for extension'
          : 'Slot is booked by another user. You need to book a new slot.'
      }
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/bookings/extend/:bookingId
 * Extend booking duration (same slot)
 */
router.put('/extend/:bookingId', verifyToken, async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const { extension_hours } = req.body;
    
    if (!extension_hours || extension_hours <= 0) {
      throw new BadRequestError('extension_hours is required and must be positive');
    }
    
    // Get current booking
    const booking = await findById(bookingId);
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }
    
    // Verify user owns this booking
    if (req.user.user_id !== booking.user_id) {
      throw new ForbiddenError('You can only extend your own bookings');
    }
    
    // Check if booking is active
    if (booking.booking_status !== 'active') {
      throw new BadRequestError('Only active bookings can be extended');
    }
    
    // Calculate new end time
    const currentEndTime = new Date(booking.booking_end_time);
    const newEndTime = new Date(currentEndTime.getTime() + (extension_hours * 60 * 60 * 1000));
    
    // Double-check slot availability
    const conflictingSql = `
      SELECT COUNT(*) as count
      FROM bookings
      WHERE organization_id = ?
        AND slot_number = ?
        AND id != ?
        AND booking_status = 'active'
        AND (
          (booking_start_time <= ? AND booking_end_time > ?)
          OR (booking_start_time < ? AND booking_end_time >= ?)
          OR (booking_start_time >= ? AND booking_end_time <= ?)
        )
    `;
    
    const conflictResult = await getRow(conflictingSql, [
      booking.organization_id,
      booking.slot_number,
      bookingId,
      currentEndTime.toISOString(), currentEndTime.toISOString(),
      newEndTime.toISOString(), newEndTime.toISOString(),
      currentEndTime.toISOString(), newEndTime.toISOString()
    ]);
    
    if (conflictResult.count > 0) {
      throw new ConflictError('Slot is no longer available for extension. Please book a new slot.');
    }
    
    // Get organization for rate calculation
    const organization = await findOrgById(booking.organization_id);
    const user = await findUserById(req.user.user_id);
    
    // Calculate additional amount
    let additionalAmount = 0;
    if (user.user_type === 'organization_member' && user.organization_id === booking.organization_id) {
      // Free extension for organization members at their own organization
      additionalAmount = 0;
    } else {
      // Paid extension for visitors, walk-ins, or members visiting other organizations
      additionalAmount = extension_hours * organization.visitor_hourly_rate;
    }
    
    const newDuration = booking.duration_hours + extension_hours;
    const newAmount = booking.amount + additionalAmount;
    
    // Update booking
    const updateSql = `
      UPDATE bookings
      SET booking_end_time = ?,
          duration_hours = ?,
          amount = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    await runQuery(updateSql, [
      newEndTime.toISOString(),
      newDuration,
      newAmount,
      bookingId
    ]);
    
    // Get updated booking
    const updatedBooking = await findById(bookingId);
    
    res.json({
      success: true,
      message: 'Booking extended successfully',
      data: {
        booking: updatedBooking,
        extension_hours,
        additional_amount: additionalAmount
      }
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/bookings/auto-expire
 * Automatically mark expired bookings as overstay (parking violation)
 * AND activate confirmed bookings that have reached their start time
 */
router.post('/auto-expire', verifyToken, async (req, res, next) => {
  try {
    // Get current time in local timezone format (matching how bookings are stored)
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const nowLocal = `${year}-${month}-${day}T${hours}:${minutes}`;
    
    console.log('[AUTO-EXPIRE] Current time (local):', nowLocal);
    
    // 1. Activate confirmed bookings that have started
    const activateQuery = `
      SELECT id, organization_id FROM bookings
      WHERE booking_status = 'confirmed'
        AND booking_start_time <= ?
    `;
    
    const bookingsToActivate = await getAllRows(activateQuery, [nowLocal]);
    console.log('[AUTO-EXPIRE] Bookings to activate:', bookingsToActivate.length);
    
    // Update booking status to active and decrement available_slots
    for (const booking of bookingsToActivate) {
      await runQuery(
        `UPDATE bookings SET booking_status = 'active', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [booking.id]
      );
      
      // Decrement available_slots when booking becomes active
      await updateAvailableSlots(booking.organization_id, -1);
    }
    
    console.log('[AUTO-EXPIRE] Activated bookings:', bookingsToActivate.length);
    
    // 2. Find all active bookings where end time has passed (OVERSTAY - Parking Violation)
    // These bookings are still occupying slots even after their time is up
    const overstayQuery = `
      UPDATE bookings
      SET booking_status = 'overstay',
          updated_at = CURRENT_TIMESTAMP
      WHERE booking_status = 'active'
        AND booking_end_time < ?
    `;
    
    const overstayResult = await runQuery(overstayQuery, [nowLocal]);
    console.log('[AUTO-EXPIRE] Overstay bookings:', overstayResult.changes || 0);
    
    res.json({
      success: true,
      message: 'Booking statuses updated',
      data: {
        activated_count: bookingsToActivate.length,
        overstay_count: overstayResult.changes || 0
      }
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/bookings/mark-exit-with-penalty/:bookingId
 * Mark exit for overstay booking and calculate penalty
 */
router.post('/mark-exit-with-penalty/:bookingId', verifyToken, async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    
    // Get booking details
    const booking = await findById(bookingId);
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }
    
    // Verify user owns this booking or is watchman/admin
    if (req.user.user_id !== booking.user_id && 
        req.user.user_type !== 'watchman' && 
        req.user.user_type !== 'admin') {
      throw new ForbiddenError('You can only mark exit for your own bookings');
    }
    
    // Calculate overstay duration and penalty
    const now = new Date();
    const endTime = new Date(booking.booking_end_time);
    const overstayMinutes = Math.ceil((now - endTime) / (1000 * 60)); // Minutes overstayed
    
    if (overstayMinutes <= 0) {
      throw new BadRequestError('Booking has not overstayed yet');
    }
    
    // Get organization for penalty rate
    const organization = await findOrgById(booking.organization_id);
    
    // Calculate penalty: 2x the hourly rate per hour of overstay
    const overstayHours = Math.ceil(overstayMinutes / 60);
    const penaltyRate = organization.visitor_hourly_rate * 2; // Double rate as penalty
    const penaltyAmount = overstayHours * penaltyRate;
    
    // Update booking with penalty
    const updateQuery = `
      UPDATE bookings
      SET booking_status = 'completed',
          exit_time = ?,
          overstay_minutes = ?,
          penalty_amount = ?,
          amount = amount + ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    await runQuery(updateQuery, [
      now.toISOString(),
      overstayMinutes,
      penaltyAmount,
      penaltyAmount,
      bookingId
    ]);
    
    // Get updated booking
    const updatedBooking = await findById(bookingId);
    
    res.json({
      success: true,
      message: 'Exit marked with overstay penalty',
      data: {
        booking: updatedBooking,
        overstay_minutes: overstayMinutes,
        overstay_hours: overstayHours,
        penalty_amount: penaltyAmount,
        total_amount: updatedBooking.amount
      }
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/bookings/calculate-penalties
 * Calculate and update penalties for all overstay bookings
 * Penalty increases the longer it remains unpaid
 */
router.post('/calculate-penalties', verifyToken, async (req, res, next) => {
  try {
    // Only admin can trigger penalty calculation
    if (req.user.user_type !== 'admin' && req.user.user_type !== 'watchman') {
      throw new ForbiddenError('Only admin or watchman can calculate penalties');
    }
    
    // Get all overstay bookings
    const overstayQuery = `
      SELECT b.*, o.visitor_hourly_rate
      FROM bookings b
      JOIN organizations o ON b.organization_id = o.id
      WHERE b.booking_status = 'overstay'
    `;
    
    const overstayBookings = await runQuery(overstayQuery);
    const now = new Date();
    let updatedCount = 0;
    
    // Calculate penalty for each overstay booking
    for (const booking of overstayBookings) {
      const endTime = new Date(booking.booking_end_time);
      const overstayMinutes = Math.ceil((now - endTime) / (1000 * 60));
      
      if (overstayMinutes > 0) {
        // Calculate penalty: 2x hourly rate per hour overstayed
        const overstayHours = Math.ceil(overstayMinutes / 60);
        const penaltyRate = booking.visitor_hourly_rate * 2;
        const penaltyAmount = overstayHours * penaltyRate;
        
        // Update booking with new penalty
        await runQuery(
          `UPDATE bookings 
           SET overstay_minutes = ?, 
               penalty_amount = ?,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [overstayMinutes, penaltyAmount, booking.id]
        );
        updatedCount++;
      }
    }
    
    res.json({
      success: true,
      message: 'Penalties calculated and updated',
      data: {
        total_overstay_bookings: overstayBookings.length,
        updated_count: updatedCount
      }
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/bookings/pay-penalty-and-rebook/:bookingId
 * Pay penalty for overstay booking and create a new booking
 */
router.post('/pay-penalty-and-rebook/:bookingId', verifyToken, async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const {
      payment_method,
      new_booking_start_time,
      new_booking_end_time
    } = req.body;
    
    // Get overstay booking
    const booking = await findById(bookingId);
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }
    
    // Verify user owns this booking
    if (req.user.user_id !== booking.user_id) {
      throw new ForbiddenError('You can only pay penalty for your own bookings');
    }
    
    // Calculate current penalty
    const now = new Date();
    const endTime = new Date(booking.booking_end_time);
    const overstayMinutes = Math.ceil((now - endTime) / (1000 * 60));
    
    // Check if booking qualifies for penalty payment
    const isOverstayStatus = booking.booking_status === 'overstay';
    const isActiveOverstay = booking.booking_status === 'active' && overstayMinutes > 0;
    
    if (!isOverstayStatus && !isActiveOverstay) {
      throw new BadRequestError('This booking is not in overstay status');
    }
    
    if (overstayMinutes <= 0) {
      throw new BadRequestError('Booking has not overstayed');
    }
    
    const organization = await findOrgById(booking.organization_id);
    const overstayHours = Math.ceil(overstayMinutes / 60);
    const penaltyRate = organization.visitor_hourly_rate * 2;
    const penaltyAmount = overstayHours * penaltyRate;
    
    // VALIDATE NEW BOOKING TIMES FIRST (before making any database changes)
    let newBooking = null;
    if (new_booking_start_time && new_booking_end_time) {
      // Calculate duration and validate
      const start = new Date(new_booking_start_time);
      const end = new Date(new_booking_end_time);
      const duration_hours = Math.ceil((end - start) / (1000 * 60 * 60));
      
      if (duration_hours <= 0) {
        throw new BadRequestError('Invalid booking times: End time must be after start time');
      }
      
      // Check slot availability
      const slotsAvailable = await checkSlotAvailability(
        booking.organization_id,
        new_booking_start_time
      );
      
      if (!slotsAvailable) {
        throw new ConflictError('No parking slots available for new booking');
      }
    }
    
    // Update penalty amount in booking
    await runQuery(
      `UPDATE bookings 
       SET overstay_minutes = ?, 
           penalty_amount = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [overstayMinutes, penaltyAmount, bookingId]
    );
    
    // Generate transaction ID automatically
    const transaction_id = `TXN-PENALTY-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    // Map frontend payment method to backend format
    const methodMap = {
      'card': 'Credit Card',
      'upi': 'UPI',
      'netbanking': 'Net Banking',
      'Cash': 'Cash'
    };
    
    const paymentMethod = methodMap[payment_method] || payment_method || 'UPI';
    
    // Mark original booking as completed FIRST (before creating payment to avoid double update)
    await runQuery(
      `UPDATE bookings 
       SET booking_status = 'completed',
           exit_time = ?,
           payment_status = 'completed',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [now.toISOString(), bookingId]
    );
    
    // Release the parking slot (increment available_slots)
    const { updateAvailableSlots } = require('../models/Organization');
    await updateAvailableSlots(booking.organization_id, 1);
    
    // Create penalty payment record (after booking is updated to avoid duplicate payment_status update)
    const { createPayment } = require('../models/Payment');
    const penaltyPayment = await createPayment(
      bookingId,
      penaltyAmount,
      paymentMethod,
      transaction_id,
      'completed',
      'penalty', // This is a penalty payment
      null // No watchman_id
    );
    
    // Create new booking if requested (validation already done above)
    if (new_booking_start_time && new_booking_end_time) {
      // Calculate duration and amount for new booking
      const start = new Date(new_booking_start_time);
      const end = new Date(new_booking_end_time);
      const duration_hours = Math.ceil((end - start) / (1000 * 60 * 60));
      
      const user = await findUserById(req.user.user_id);
      let amount = 0;
      if (user.user_type === 'organization_member' && user.organization_id === booking.organization_id) {
        amount = 0;
      } else {
        amount = duration_hours * organization.visitor_hourly_rate;
      }
      
      // Assign slot number
      const activeBookings = await getActiveBookings(booking.organization_id);
      const usedSlots = activeBookings.map(b => {
        if (b.slot_number && typeof b.slot_number === 'string') {
          const match = b.slot_number.match(/\d+/);
          return match ? parseInt(match[0], 10) : 0;
        }
        return 0;
      });
      
      let slot_num = 1;
      while (usedSlots.includes(slot_num) && slot_num <= organization.total_slots) {
        slot_num++;
      }
      
      if (slot_num > organization.total_slots) {
        throw new ConflictError('Unable to assign slot number');
      }
      
      const slot_number = `SLOT-${String(slot_num).padStart(3, '0')}`;
      
      // Create new booking
      newBooking = await createBooking(
        req.user.user_id,
        booking.organization_id,
        booking.vehicle_number,
        slot_number,
        new_booking_start_time,
        new_booking_end_time,
        duration_hours,
        amount
      );
      
      // Generate QR code for new booking
      const qrData = {
        booking_id: newBooking.id,
        user_id: req.user.user_id,
        organization_id: booking.organization_id,
        vehicle_number: booking.vehicle_number,
        slot_number,
        booking_start_time: new_booking_start_time
      };
      
      const qr_code_data = await generateQRCode(JSON.stringify(qrData));
      
      await runQuery(
        'UPDATE bookings SET qr_code_data = ? WHERE id = ?',
        [qr_code_data, newBooking.id]
      );
      
      newBooking.qr_code_data = qr_code_data;
    }
    
    res.json({
      success: true,
      message: newBooking 
        ? 'Penalty paid and new booking created successfully'
        : 'Penalty paid successfully',
      data: {
        penalty_payment: penaltyPayment,
        overstay_minutes: overstayMinutes,
        overstay_hours: overstayHours,
        penalty_amount: penaltyAmount,
        old_booking: await findById(bookingId),
        new_booking: newBooking
      }
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/bookings/:id
 * Get a single booking by ID
 * NOTE: This must be LAST to avoid catching other routes like /user/:userId
 */
router.get('/:id', verifyToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    console.log('🔍 GET /api/bookings/:id - Requesting booking ID:', id);
    console.log('🔍 User making request:', req.user.user_id, '(', req.user.user_type, ')');
    
    // Get booking details
    const booking = await findById(id);
    console.log('📦 Found booking:', booking ? `ID ${booking.id}` : 'NULL');
    
    if (!booking) {
      console.log('❌ Booking not found for ID:', id);
      throw new NotFoundError('Booking not found');
    }
    
    // Verify user can only access own bookings (or is admin)
    if (req.user.user_id !== booking.user_id && req.user.user_type !== 'admin') {
      console.log('❌ Access denied: User', req.user.user_id, 'trying to access booking owned by', booking.user_id);
      throw new ForbiddenError('You can only access your own bookings');
    }
    
    console.log('✅ Returning booking data:', booking.id);
    
    // Return booking details
    res.json({
      success: true,
      data: {
        booking
      }
    });
    
  } catch (error) {
    console.error('❌ Error in GET /api/bookings/:id:', error.message);
    next(error);
  }
});

module.exports = router;
