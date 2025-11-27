const db = require('../config/db');

// Initiate payment
exports.initiatePayment = (req, res) => {
  const { bookingId, amount, paymentMethod } = req.body;
  const userId = req.userId;

  const transactionId = 'TXN' + Date.now() + Math.random().toString(36).substr(2, 9).toUpperCase();

  const sql = `INSERT INTO payments (booking_id, user_id, amount, payment_method, payment_status, transaction_id)
               VALUES (?, ?, ?, ?, 'pending', ?)`;

  db.run(sql, [bookingId, userId, amount, paymentMethod, transactionId], function(err) {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        message: 'Error initiating payment' 
      });
    }

    res.status(201).json({
      success: true,
      message: 'Payment initiated',
      paymentId: this.lastID,
      transactionId,
      paymentUrl: `${process.env.PAYMENT_GATEWAY_URL}?txn=${transactionId}`
    });
  });
};

// Simulate payment (for testing)
exports.simulatePayment = (req, res) => {
  const { transactionId, status } = req.body;

  const paymentStatus = status === 'success' ? 'success' : 'failed';

  db.run(
    'UPDATE payments SET payment_status = ?, payment_date = CURRENT_TIMESTAMP WHERE transaction_id = ?',
    [paymentStatus, transactionId],
    function(err) {
      if (err) {
        return res.status(500).json({ 
          success: false, 
          message: 'Error processing payment' 
        });
      }

      if (this.changes === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Transaction not found' 
        });
      }

      // Update booking payment status
      if (paymentStatus === 'success') {
        db.get('SELECT booking_id FROM payments WHERE transaction_id = ?', [transactionId], (err, payment) => {
          if (payment) {
            db.run('UPDATE bookings SET payment_status = ?, status = ? WHERE id = ?', 
              ['paid', 'confirmed', payment.booking_id]);
          }
        });
      }

      res.json({
        success: true,
        message: `Payment ${paymentStatus}`,
        transactionId,
        status: paymentStatus
      });
    }
  );
};

// Verify payment status
exports.verifyPayment = (req, res) => {
  const { transactionId } = req.params;

  db.get('SELECT * FROM payments WHERE transaction_id = ?', [transactionId], (err, payment) => {
    if (err || !payment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Transaction not found' 
      });
    }

    res.json({
      success: true,
      data: {
        transactionId: payment.transaction_id,
        status: payment.payment_status,
        amount: payment.amount,
        paymentMethod: payment.payment_method,
        paymentDate: payment.payment_date
      }
    });
  });
};

// Get payment history
exports.getPaymentHistory = (req, res) => {
  const userId = req.userId;

  db.all(
    `SELECT p.*, b.booking_date, b.vehicle_number, o.name as organization_name
     FROM payments p
     LEFT JOIN bookings b ON p.booking_id = b.id
     LEFT JOIN organizations o ON b.organization_id = o.id
     WHERE p.user_id = ?
     ORDER BY p.created_at DESC`,
    [userId],
    (err, payments) => {
      if (err) {
        return res.status(500).json({ 
          success: false, 
          message: 'Error fetching payment history' 
        });
      }

      res.json({ 
        success: true, 
        data: payments 
      });
    }
  );
};

// Get payment by booking ID
exports.getPaymentByBooking = (req, res) => {
  const { bookingId } = req.params;

  db.get('SELECT * FROM payments WHERE booking_id = ?', [bookingId], (err, payment) => {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        message: 'Error fetching payment' 
      });
    }

    if (!payment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Payment not found' 
      });
    }

    res.json({ 
      success: true, 
      data: payment 
    });
  });
};

// Process refund
exports.processRefund = (req, res) => {
  const { paymentId } = req.params;

  db.get('SELECT * FROM payments WHERE id = ?', [paymentId], (err, payment) => {
    if (err || !payment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Payment not found' 
      });
    }

    if (payment.payment_status !== 'success') {
      return res.status(400).json({ 
        success: false, 
        message: 'Only successful payments can be refunded' 
      });
    }

    db.run(
      'UPDATE payments SET payment_status = ? WHERE id = ?',
      ['refunded', paymentId],
      function(err) {
        if (err) {
          return res.status(500).json({ 
            success: false, 
            message: 'Error processing refund' 
          });
        }

        // Update booking payment status
        db.run('UPDATE bookings SET payment_status = ? WHERE id = ?', ['refunded', payment.booking_id]);

        res.json({
          success: true,
          message: 'Refund processed successfully',
          refundAmount: payment.amount
        });
      }
    );
  });
};

// Payment callback (webhook)
exports.paymentCallback = (req, res) => {
  const { transactionId, status, signature } = req.body;

  // In production, verify the signature

  const paymentStatus = status === 'SUCCESS' ? 'success' : 'failed';

  db.run(
    'UPDATE payments SET payment_status = ?, payment_date = CURRENT_TIMESTAMP WHERE transaction_id = ?',
    [paymentStatus, transactionId],
    function(err) {
      if (err) {
        return res.status(500).json({ 
          success: false, 
          message: 'Error processing callback' 
        });
      }

      // Update booking if payment successful
      if (paymentStatus === 'success') {
        db.get('SELECT booking_id FROM payments WHERE transaction_id = ?', [transactionId], (err, payment) => {
          if (payment) {
            db.run('UPDATE bookings SET payment_status = ?, status = ? WHERE id = ?', 
              ['paid', 'confirmed', payment.booking_id]);
          }
        });
      }

      res.json({ 
        success: true, 
        message: 'Callback processed' 
      });
    }
  );
};
