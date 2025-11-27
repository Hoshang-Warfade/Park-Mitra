const express = require('express');
const router = express.Router();
const {
  simulateOnlinePayment,
  findByBookingId,
  getOrganizationRevenue
} = require('../models/Payment');
const { findById: findBookingById } = require('../models/Booking');
const { findById: findUserById } = require('../models/User');
const { runQuery } = require('../config/db');
const { verifyToken } = require('../middleware/auth');
const { BadRequestError, NotFoundError, ForbiddenError } = require('../middleware/errorHandler');

/**
 * POST /api/payments/simulate-online
 * Simulate online payment (PSEUDO implementation)
 */
router.post('/simulate-online', verifyToken, async (req, res, next) => {
  try {
    const { booking_id, amount, payment_method_type } = req.body;
    
    if (!booking_id || !amount) {
      throw new BadRequestError('booking_id and amount are required');
    }
    
    // Validate payment_method_type
    const validMethods = ['card', 'upi', 'netbanking'];
    if (payment_method_type && !validMethods.includes(payment_method_type)) {
      throw new BadRequestError('Invalid payment_method_type. Must be: card, upi, or netbanking');
    }
    
    // Get booking details
    const booking = await findBookingById(booking_id);
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }
    
    // Verify user owns this booking
    if (booking.user_id !== req.user.user_id) {
      throw new ForbiddenError('You can only make payments for your own bookings');
    }
    
    // Simulate 2-second processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate random success/failure (95% success rate for realism)
    const isSuccess = Math.random() < 0.95;
    
    if (!isSuccess) {
      throw new BadRequestError('Payment failed. Please try again.');
    }
    
    // Call Payment.simulateOnlinePayment with payment method type
    const paymentResult = await simulateOnlinePayment(booking_id, amount, payment_method_type);
    
    // Return success response with transaction details
    res.json({
      success: true,
      message: 'Payment processed successfully',
      data: {
        ...paymentResult,
        payment_method_type: payment_method_type || 'card',
        booking_id,
        amount
      }
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/payments/initiate
 * Initiate payment process
 */
router.post('/initiate', verifyToken, async (req, res, next) => {
  try {
    const { booking_id } = req.body;
    
    if (!booking_id) {
      throw new BadRequestError('booking_id is required');
    }
    
    // Get booking details
    const booking = await findBookingById(booking_id);
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }
    
    // Verify user owns this booking
    if (booking.user_id !== req.user.user_id) {
      throw new ForbiddenError('You can only initiate payments for your own bookings');
    }
    
    // Check if already paid
    if (booking.payment_status === 'completed') {
      throw new BadRequestError('Payment already completed for this booking');
    }
    
    // Generate mock payment order ID
    const order_id = `ORDER_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    
    // Return payment initiation data (PSEUDO implementation)
    res.json({
      success: true,
      message: 'Payment initiated successfully',
      data: {
        booking_id,
        order_id,
        amount: booking.amount,
        currency: 'INR',
        booking_details: {
          vehicle_number: booking.vehicle_number,
          slot_number: booking.slot_number,
          organization_name: booking.org_name,
          booking_start_time: booking.booking_start_time,
          booking_end_time: booking.booking_end_time,
          duration_hours: booking.duration_hours
        },
        // Mock payment gateway URL (pseudo)
        payment_gateway_url: `https://mock-payment-gateway.parkmitra.com/pay/${order_id}`,
        payment_methods: ['card', 'upi', 'netbanking'],
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutes
      }
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/payments/verify
 * Verify payment status
 */
router.post('/verify', async (req, res, next) => {
  try {
    const { transaction_id, booking_id } = req.body;
    
    if (!transaction_id || !booking_id) {
      throw new BadRequestError('transaction_id and booking_id are required');
    }
    
    // In simulation, always return success if transaction_id format is valid
    if (!transaction_id.startsWith('TXN')) {
      throw new BadRequestError('Invalid transaction_id format');
    }
    
    // Get booking details
    const booking = await findBookingById(booking_id);
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }
    
    // Check if payment already exists
    const existingPayment = await findByBookingId(booking_id);
    
    let verification_status = 'success';
    let payment_status = 'completed';
    
    if (existingPayment) {
      verification_status = 'already_verified';
      payment_status = existingPayment.payment_status;
    } else {
      // Update booking payment_status (would be done by simulateOnlinePayment in real flow)
      await runQuery(
        'UPDATE bookings SET payment_status = ? WHERE id = ?',
        ['completed', booking_id]
      );
    }
    
    // Return verification result (always success in simulation)
    res.json({
      success: true,
      message: 'Payment verified successfully',
      data: {
        verification_status,
        transaction_id,
        booking_id,
        payment_status,
        amount: booking.amount,
        verified_at: new Date().toISOString()
      }
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/payments/booking/:bookingId
 * Get payment details by booking ID
 */
router.get('/booking/:bookingId', verifyToken, async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    
    // Get booking to verify ownership
    const booking = await findBookingById(bookingId);
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }
    
    // Verify user owns this booking (or is admin)
    if (booking.user_id !== req.user.user_id && req.user.user_type !== 'admin') {
      throw new ForbiddenError('You can only view payments for your own bookings');
    }
    
    // Get payment details
    const payment = await findByBookingId(bookingId);
    
    if (!payment) {
      throw new NotFoundError('Payment not found for this booking');
    }
    
    // Return payment details
    res.json({
      success: true,
      data: {
        payment
      }
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/payments/organization-revenue/:orgId
 * Get organization revenue data (admin only)
 */
router.get('/organization-revenue/:orgId', verifyToken, async (req, res, next) => {
  try {
    const { orgId } = req.params;
    const { start_date, end_date } = req.query;
    
    // Check if user is admin of this organization
    const user = await findUserById(req.user.user_id);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    
    // Verify admin access
    if (user.user_type !== 'organization_member' || user.organization_id !== parseInt(orgId)) {
      throw new ForbiddenError('You do not have access to this organization\'s revenue data');
    }
    
    // Build date_range object
    const date_range = {};
    if (start_date) date_range.start_date = start_date;
    if (end_date) date_range.end_date = end_date;
    
    // Get organization revenue
    const revenueData = await getOrganizationRevenue(orgId, date_range);
    
    // Return revenue data with breakdown
    res.json({
      success: true,
      data: revenueData
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/payments/history
 * Get payment history for logged-in user
 */
router.get('/history', verifyToken, async (req, res, next) => {
  try {
    const user_id = req.user.user_id;
    console.log('=== PAYMENT HISTORY REQUEST ===');
    console.log('User ID from token:', user_id);
    console.log('User object:', req.user);
    
    // Query to get all payment-related transactions for the user
    const query = `
      SELECT 
        p.id,
        p.booking_id,
        p.transaction_id,
        p.amount,
        p.payment_status as status,
        p.payment_method as payment_method,
        p.payment_type,
        p.created_at,
        b.vehicle_number,
        b.slot_number,
        b.booking_status,
        b.booking_start_time,
        b.booking_end_time,
        b.penalty_amount,
        b.overstay_minutes,
        o.org_name as location
      FROM payments p
      JOIN bookings b ON p.booking_id = b.id
      LEFT JOIN organizations o ON b.organization_id = o.id
      WHERE b.user_id = ?
      ORDER BY p.created_at DESC
    `;
    
    const { getAllRows } = require('../config/db');
    const rawPayments = await getAllRows(query, [user_id]);
    console.log('Raw payments from DB:', rawPayments.length, 'records');
    if (rawPayments.length > 0) {
      console.log('First payment:', JSON.stringify(rawPayments[0], null, 2));
    }
    
    // Transform payments to include type (debit, refund, penalty)
    const payments = [];
    
    rawPayments.forEach(payment => {
      let type = 'debit';
      let description = 'Parking booking payment';
      
      // Use the payment_type from database if available
      if (payment.payment_type === 'penalty') {
        type = 'penalty';
        description = `Overstay penalty charges${payment.overstay_minutes ? ` (${payment.overstay_minutes} mins)` : ''}`;
      } else if (payment.booking_status === 'cancelled') {
        type = 'refund';
        description = 'Refund for cancelled booking';
      } else if (payment.transaction_id && payment.transaction_id.includes('PEN')) {
        // Legacy check for old penalty transactions
        type = 'penalty';
        description = 'Overstay penalty charges';
      } else if (payment.transaction_id && payment.transaction_id.includes('REF')) {
        type = 'refund';
        description = 'Refund for cancelled booking';
      }
      
      // Add the payment
      payments.push({
        id: payment.id,
        booking_id: payment.booking_id,
        transaction_id: payment.transaction_id,
        type: type,
        amount: parseFloat(payment.amount),
        status: payment.status === 'completed' ? 'success' : payment.status,
        payment_method: payment.payment_method || 'UPI',
        description: description,
        location: payment.location,
        vehicle_number: payment.vehicle_number,
        created_at: payment.created_at
      });
      
      // OLD LOGIC REMOVED: Do NOT create synthetic penalty entries anymore
      // because we now have real penalty payments with payment_type='penalty'
    });
    
    console.log(`Payment history for user ${user_id}: ${payments.length} payments found`);
    
    res.json({
      success: true,
      payments: payments,
      count: payments.length
    });
    
  } catch (error) {
    console.error('Payment history error:', error);
    next(error);
  }
});

module.exports = router;
