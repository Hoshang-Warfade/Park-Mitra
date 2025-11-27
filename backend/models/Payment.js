const { runQuery, getRow, getAllRows } = require('../config/db');

class Payment {
  /**
   * Create a new payment record
   * @param {number} booking_id - Booking ID
   * @param {number} amount - Payment amount
   * @param {string} payment_method - Payment method (specific like 'UPI', 'Credit Card', 'Net Banking', 'Cash')
   * @param {string} transaction_id - Transaction ID
   * @param {string} payment_status - Payment status (default: 'completed')
   * @param {string} payment_type - Payment type: 'booking' or 'penalty' (default: 'booking')
   * @param {number} watchman_id - Watchman ID (optional, for cash payments)
   * @returns {Object} Created payment record
   */
  static async createPayment(booking_id, amount, payment_method, transaction_id, payment_status = 'completed', payment_type = 'booking', watchman_id = null) {
    const payment_timestamp = new Date().toISOString();
    
    const sql = `INSERT INTO payments (
      booking_id, amount, payment_method, transaction_id, 
      watchman_id, payment_status, payment_type, payment_timestamp
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    
    const result = await runQuery(sql, [
      booking_id,
      amount,
      payment_method,
      transaction_id,
      watchman_id,
      payment_status,
      payment_type,
      payment_timestamp
    ]);
    
    // Only update booking payment_status if it's for a regular booking payment (not penalty)
    // For penalty payments, the booking status is already updated by the penalty route
    if (payment_type === 'booking') {
      await runQuery(
        'UPDATE bookings SET payment_status = ? WHERE id = ?',
        [payment_status, booking_id]
      );
    }
    
    // Return created payment record
    return {
      id: result.lastID,
      booking_id,
      amount,
      payment_method,
      transaction_id,
      watchman_id,
      payment_status,
      payment_type,
      payment_timestamp,
      created_at: new Date().toISOString()
    };
  }

  /**
   * Find payment by booking ID
   * @param {number} booking_id - Booking ID
   * @returns {Object|null} Payment details
   */
  static async findByBookingId(booking_id) {
    const sql = 'SELECT * FROM payments WHERE booking_id = ?';
    return await getRow(sql, [booking_id]);
  }

  /**
   * Simulate online payment (pseudo implementation)
   * @param {number} booking_id - Booking ID
   * @param {number} amount - Payment amount
   * @param {string} payment_method_type - Specific payment method (UPI, Credit Card, Net Banking, etc.)
   * @returns {Object} Transaction details with success message
   */
  static async simulateOnlinePayment(booking_id, amount, payment_method_type = 'UPI') {
    // Generate random transaction_id (simulate payment gateway)
    const transaction_id = `TXN${Date.now()}${Math.floor(Math.random() * 10000)}`;
    
    // Map frontend payment method types to user-friendly names
    const methodMap = {
      'upi': 'UPI',
      'card': 'Credit Card',
      'netbanking': 'Net Banking',
      'debitcard': 'Debit Card',
      'wallet': 'Wallet',
      'cash': 'Cash'
    };
    
    const friendlyMethod = methodMap[payment_method_type?.toLowerCase()] || payment_method_type || 'UPI';
    
    // Create payment record with specific payment method
    const payment = await this.createPayment(
      booking_id,
      amount,
      friendlyMethod,
      transaction_id,
      'completed', // Payment status
      'booking',   // Payment type
      null         // No watchman for online payments
    );
    
    // Return transaction details with success message
    return {
      success: true,
      message: 'Payment processed successfully',
      transaction_id,
      payment_id: payment.id,
      amount,
      payment_method: friendlyMethod,
      payment_timestamp: payment.payment_timestamp
    };
  }

  /**
   * Record cash payment (used by watchmen)
   * @param {number} booking_id - Booking ID
   * @param {number} amount - Payment amount
   * @param {number} watchman_id - Watchman ID who collected payment
   * @returns {Object} Payment confirmation
   */
  static async recordCashPayment(booking_id, amount, watchman_id) {
    // Generate transaction_id for cash payment
    const transaction_id = `CASH${Date.now()}${watchman_id}`;
    
    // Create payment record with method 'cash'
    const payment = await this.createPayment(
      booking_id,
      amount,
      'cash',
      transaction_id,
      watchman_id
    );
    
    // Return payment confirmation
    return {
      success: true,
      message: 'Cash payment recorded successfully',
      payment_id: payment.id,
      booking_id,
      amount,
      payment_method: 'cash',
      watchman_id,
      transaction_id,
      payment_timestamp: payment.payment_timestamp
    };
  }

  /**
   * Get organization revenue
   * @param {number} organization_id - Organization ID
   * @param {Object} date_range - Optional date range {start_date, end_date}
   * @returns {Object} Revenue data with total and grouped by date
   */
  static async getOrganizationRevenue(organization_id, date_range = {}) {
    // Base query: sum completed payments for bookings in this organization
    let sql = `
      SELECT 
        DATE(p.payment_timestamp) as payment_date,
        COUNT(p.id) as transaction_count,
        SUM(p.amount) as daily_revenue,
        p.payment_method
      FROM payments p
      INNER JOIN bookings b ON p.booking_id = b.id
      WHERE b.organization_id = ? 
        AND p.payment_status = 'completed'
    `;
    
    const params = [organization_id];
    
    // Apply date range filter
    if (date_range.start_date) {
      sql += ' AND DATE(p.payment_timestamp) >= ?';
      params.push(date_range.start_date);
    }
    
    if (date_range.end_date) {
      sql += ' AND DATE(p.payment_timestamp) <= ?';
      params.push(date_range.end_date);
    }
    
    // Group by date and payment method for analytics
    sql += ' GROUP BY DATE(p.payment_timestamp), p.payment_method ORDER BY payment_date DESC';
    
    const dailyRevenue = await getAllRows(sql, params);
    
    // Calculate total revenue
    const totalSql = `
      SELECT 
        SUM(p.amount) as total_revenue,
        COUNT(p.id) as total_transactions
      FROM payments p
      INNER JOIN bookings b ON p.booking_id = b.id
      WHERE b.organization_id = ? 
        AND p.payment_status = 'completed'
    `;
    
    const totalParams = [organization_id];
    
    if (date_range.start_date) {
      totalSql += ' AND DATE(p.payment_timestamp) >= ?';
      totalParams.push(date_range.start_date);
    }
    
    if (date_range.end_date) {
      totalSql += ' AND DATE(p.payment_timestamp) <= ?';
      totalParams.push(date_range.end_date);
    }
    
    const totalData = await getRow(totalSql, totalParams);
    
    return {
      organization_id,
      total_revenue: totalData?.total_revenue || 0,
      total_transactions: totalData?.total_transactions || 0,
      date_range: date_range.start_date || date_range.end_date ? date_range : 'all_time',
      daily_breakdown: dailyRevenue
    };
  }

  // Legacy methods for backward compatibility
  static async create(paymentData) {
    const { bookingId, amount, paymentMethod, transactionId, watchmanId } = paymentData;
    return await this.createPayment(bookingId, amount, paymentMethod, transactionId, watchmanId);
  }

  static async findById(id) {
    return await getRow('SELECT * FROM payments WHERE id = ?', [id]);
  }

  static async findByTransactionId(transactionId) {
    return await getRow('SELECT * FROM payments WHERE transaction_id = ?', [transactionId]);
  }

  static async findByUserId(userId) {
    const sql = `
      SELECT p.*, b.vehicle_number, b.slot_number, o.org_name
      FROM payments p
      INNER JOIN bookings b ON p.booking_id = b.id
      INNER JOIN organizations o ON b.organization_id = o.id
      WHERE b.user_id = ?
      ORDER BY p.created_at DESC
    `;
    return await getAllRows(sql, [userId]);
  }

  static async updateStatus(id, status) {
    await runQuery(
      'UPDATE payments SET payment_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, id]
    );
    return await this.findById(id);
  }
}

// Export all functions
module.exports = {
  createPayment: Payment.createPayment.bind(Payment),
  findByBookingId: Payment.findByBookingId.bind(Payment),
  simulateOnlinePayment: Payment.simulateOnlinePayment.bind(Payment),
  recordCashPayment: Payment.recordCashPayment.bind(Payment),
  getOrganizationRevenue: Payment.getOrganizationRevenue.bind(Payment),
  
  // Export the class itself for additional methods
  Payment
};
