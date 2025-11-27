const db = require('../config/db');

// Scan QR code
exports.scanQRCode = (req, res) => {
  const { qrCode } = req.body;

  try {
    const qrData = JSON.parse(qrCode);
    
    db.get(
      `SELECT b.*, u.name as user_name, u.mobile, ps.slot_number 
       FROM bookings b
       LEFT JOIN users u ON b.user_id = u.id
       LEFT JOIN parking_slots ps ON b.slot_id = ps.id
       WHERE b.id = ?`,
      [qrData.bookingId],
      (err, booking) => {
        if (err || !booking) {
          return res.status(404).json({ 
            success: false, 
            message: 'Booking not found' 
          });
        }

        res.json({ 
          success: true, 
          data: booking,
          valid: booking.status === 'confirmed' || booking.status === 'pending'
        });
      }
    );
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: 'Invalid QR code format' 
    });
  }
};

// Verify booking
exports.verifyBooking = (req, res) => {
  const { bookingId } = req.params;

  db.run(
    'UPDATE bookings SET status = ? WHERE id = ? AND status = ?',
    ['confirmed', bookingId, 'pending'],
    function(err) {
      if (err) {
        return res.status(500).json({ 
          success: false, 
          message: 'Error verifying booking' 
        });
      }

      if (this.changes === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Booking not found or already verified' 
        });
      }

      res.json({ 
        success: true, 
        message: 'Booking verified successfully' 
      });
    }
  );
};

// Handle walk-in customer
exports.handleWalkIn = (req, res) => {
  const { organizationId, slotId, vehicleNumber, vehicleType, hours } = req.body;
  const watchmanId = req.userId;

  db.get('SELECT pricing_per_hour FROM organizations WHERE id = ?', [organizationId], (err, org) => {
    if (err || !org) {
      return res.status(404).json({ 
        success: false, 
        message: 'Organization not found' 
      });
    }

    const totalAmount = hours * org.pricing_per_hour;
    const now = new Date();
    const endTime = new Date(now.getTime() + hours * 60 * 60 * 1000);

    const sql = `INSERT INTO bookings (user_id, organization_id, slot_id, booking_date, start_time, end_time,
                 vehicle_number, vehicle_type, total_amount, status, payment_status) 
                 VALUES (?, ?, ?, date('now'), time('now'), time(?, 'unixepoch'), ?, ?, ?, 'confirmed', 'pending')`;

    db.run(sql, [watchmanId, organizationId, slotId, endTime.getTime() / 1000, vehicleNumber, vehicleType, totalAmount], 
      function(err) {
        if (err) {
          return res.status(500).json({ 
            success: false, 
            message: 'Error creating walk-in booking' 
          });
        }

        // Update slot availability
        if (slotId) {
          db.run('UPDATE parking_slots SET is_available = 0 WHERE id = ?', [slotId]);
        }

        res.status(201).json({
          success: true,
          message: 'Walk-in booking created',
          bookingId: this.lastID,
          totalAmount
        });
      }
    );
  });
};

// Record cash payment
exports.recordCashPayment = (req, res) => {
  const { bookingId, amount } = req.body;
  const watchmanId = req.userId;

  db.get('SELECT * FROM bookings WHERE id = ?', [bookingId], (err, booking) => {
    if (err || !booking) {
      return res.status(404).json({ 
        success: false, 
        message: 'Booking not found' 
      });
    }

    const sql = `INSERT INTO payments (booking_id, user_id, amount, payment_method, payment_status, transaction_id)
                 VALUES (?, ?, ?, 'cash', 'success', ?)`;

    const transactionId = 'CASH_' + Date.now() + '_' + bookingId;

    db.run(sql, [bookingId, booking.user_id, amount, transactionId], function(err) {
      if (err) {
        return res.status(500).json({ 
          success: false, 
          message: 'Error recording payment' 
        });
      }

      // Update booking payment status
      db.run('UPDATE bookings SET payment_status = ? WHERE id = ?', ['paid', bookingId]);

      res.status(201).json({
        success: true,
        message: 'Cash payment recorded',
        paymentId: this.lastID,
        transactionId
      });
    });
  });
};

// Get current occupancy
exports.getCurrentOccupancy = (req, res) => {
  const organizationId = req.organizationId;

  db.get(
    `SELECT total_slots, available_slots FROM organizations WHERE id = ?`,
    [organizationId],
    (err, org) => {
      if (err || !org) {
        return res.status(404).json({ 
          success: false, 
          message: 'Organization not found' 
        });
      }

      const occupied = org.total_slots - org.available_slots;
      const occupancyRate = (occupied / org.total_slots) * 100;

      res.json({
        success: true,
        data: {
          totalSlots: org.total_slots,
          availableSlots: org.available_slots,
          occupiedSlots: occupied,
          occupancyRate: occupancyRate.toFixed(2)
        }
      });
    }
  );
};

// Mark vehicle entry
exports.markEntry = (req, res) => {
  const { bookingId } = req.params;

  db.run(
    'UPDATE bookings SET status = ? WHERE id = ?',
    ['confirmed', bookingId],
    function(err) {
      if (err) {
        return res.status(500).json({ 
          success: false, 
          message: 'Error marking entry' 
        });
      }

      res.json({ 
        success: true, 
        message: 'Entry marked successfully' 
      });
    }
  );
};

// Mark vehicle exit
exports.markExit = (req, res) => {
  const { bookingId } = req.params;

  db.get('SELECT slot_id FROM bookings WHERE id = ?', [bookingId], (err, booking) => {
    if (err || !booking) {
      return res.status(404).json({ 
        success: false, 
        message: 'Booking not found' 
      });
    }

    db.run(
      'UPDATE bookings SET status = ? WHERE id = ?',
      ['completed', bookingId],
      function(err) {
        if (err) {
          return res.status(500).json({ 
            success: false, 
            message: 'Error marking exit' 
          });
        }

        // Free up the slot
        if (booking.slot_id) {
          db.run('UPDATE parking_slots SET is_available = 1 WHERE id = ?', [booking.slot_id]);
        }

        res.json({ 
          success: true, 
          message: 'Exit marked successfully' 
        });
      }
    );
  });
};

// Get watchman dashboard
exports.getDashboard = (req, res) => {
  const organizationId = req.organizationId;

  const queries = {
    todayBookings: new Promise((resolve, reject) => {
      db.get(
        'SELECT COUNT(*) as count FROM bookings WHERE organization_id = ? AND booking_date = date("now")',
        [organizationId],
        (err, row) => {
          err ? reject(err) : resolve(row.count);
        }
      );
    }),
    activeBookings: new Promise((resolve, reject) => {
      db.get(
        'SELECT COUNT(*) as count FROM bookings WHERE organization_id = ? AND status = "confirmed"',
        [organizationId],
        (err, row) => {
          err ? reject(err) : resolve(row.count);
        }
      );
    }),
    occupancy: new Promise((resolve, reject) => {
      db.get(
        'SELECT total_slots, available_slots FROM organizations WHERE id = ?',
        [organizationId],
        (err, row) => {
          err ? reject(err) : resolve(row);
        }
      );
    })
  };

  Promise.all(Object.values(queries))
    .then(([todayBookings, activeBookings, occupancy]) => {
      res.json({
        success: true,
        data: {
          todayBookings,
          activeBookings,
          totalSlots: occupancy.total_slots,
          availableSlots: occupancy.available_slots
        }
      });
    })
    .catch(err => {
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching dashboard data' 
      });
    });
};

// Get today's bookings
exports.getTodaysBookings = (req, res) => {
  const organizationId = req.organizationId;

  db.all(
    `SELECT b.*, u.name as user_name, u.mobile, ps.slot_number
     FROM bookings b
     LEFT JOIN users u ON b.user_id = u.id
     LEFT JOIN parking_slots ps ON b.slot_id = ps.id
     WHERE b.organization_id = ? AND b.booking_date = date('now')
     ORDER BY b.start_time`,
    [organizationId],
    (err, bookings) => {
      if (err) {
        return res.status(500).json({ 
          success: false, 
          message: 'Error fetching bookings' 
        });
      }

      res.json({ 
        success: true, 
        data: bookings 
      });
    }
  );
};
