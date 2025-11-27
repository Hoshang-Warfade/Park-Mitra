const db = require('../config/db');
const { generateQRCode } = require('../utils/qrGenerator');
const { calculateParkingFee, parseTime } = require('../utils/dateHelper');

// Create new booking
exports.createBooking = (req, res) => {
  const { organizationId, slotId, bookingDate, startTime, endTime, vehicleNumber, vehicleType } = req.body;
  const userId = req.userId;

  // First, check if the user is a member and validate organization access
  db.get('SELECT user_type, organization_id FROM users WHERE id = ?', [userId], (err, user) => {
    if (err || !user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // If user is an organization_member, they can only book at their own organization
    if (user.user_type === 'organization_member' && user.organization_id !== organizationId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Members can only book parking at their own organization' 
      });
    }

    // Calculate total amount
    const hours = parseTime(endTime) - parseTime(startTime);
    
    db.get('SELECT pricing_per_hour FROM organizations WHERE id = ?', [organizationId], (err, org) => {
      if (err || !org) {
        return res.status(404).json({ 
          success: false, 
          message: 'Organization not found' 
        });
      }

    const totalAmount = calculateParkingFee(hours, org.pricing_per_hour);

    const sql = `INSERT INTO bookings (user_id, organization_id, slot_id, booking_date, start_time, end_time, 
                 vehicle_number, vehicle_type, total_amount, status) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`;

    db.run(sql, [userId, organizationId, slotId, bookingDate, startTime, endTime, vehicleNumber, vehicleType, totalAmount], 
      function(err) {
        if (err) {
          return res.status(500).json({ 
            success: false, 
            message: 'Error creating booking' 
          });
        }

        // Update slot availability
        if (slotId) {
          db.run('UPDATE parking_slots SET is_available = 0 WHERE id = ?', [slotId]);
        }

        res.status(201).json({
          success: true,
          message: 'Booking created successfully',
          bookingId: this.lastID,
          totalAmount
        });
      }
    );
    });
  });
};

// Get user bookings
exports.getUserBookings = (req, res) => {
  const userId = req.userId;

  const sql = `SELECT b.*, o.name as organization_name, ps.slot_number 
               FROM bookings b
               LEFT JOIN organizations o ON b.organization_id = o.id
               LEFT JOIN parking_slots ps ON b.slot_id = ps.id
               WHERE b.user_id = ?
               ORDER BY b.created_at DESC`;

  db.all(sql, [userId], (err, bookings) => {
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
  });
};

// Get booking by ID
exports.getBookingById = (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  const sql = `SELECT b.*, o.name as organization_name, o.address as organization_address,
               ps.slot_number, ps.floor_level,
               u.name as user_name, u.mobile as user_mobile
               FROM bookings b
               LEFT JOIN organizations o ON b.organization_id = o.id
               LEFT JOIN parking_slots ps ON b.slot_id = ps.id
               LEFT JOIN users u ON b.user_id = u.id
               WHERE b.id = ? AND (b.user_id = ? OR ? IN (SELECT user_id FROM watchmen WHERE organization_id = b.organization_id))`;

  db.get(sql, [id, userId, userId], (err, booking) => {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        message: 'Error fetching booking' 
      });
    }

    if (!booking) {
      return res.status(404).json({ 
        success: false, 
        message: 'Booking not found' 
      });
    }

    res.json({ 
      success: true, 
      data: booking 
    });
  });
};

// Update booking
exports.updateBooking = (req, res) => {
  const { id } = req.params;
  const { startTime, endTime, vehicleNumber } = req.body;
  const userId = req.userId;

  db.run(
    `UPDATE bookings SET start_time = ?, end_time = ?, vehicle_number = ?, updated_at = CURRENT_TIMESTAMP 
     WHERE id = ? AND user_id = ? AND status = 'pending'`,
    [startTime, endTime, vehicleNumber, id, userId],
    function(err) {
      if (err) {
        return res.status(500).json({ 
          success: false, 
          message: 'Error updating booking' 
        });
      }

      if (this.changes === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Booking not found or cannot be updated' 
        });
      }

      res.json({ 
        success: true, 
        message: 'Booking updated successfully' 
      });
    }
  );
};

// Cancel booking
exports.cancelBooking = (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  db.run(
    `UPDATE bookings SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP 
     WHERE id = ? AND user_id = ? AND status IN ('pending', 'confirmed')`,
    [id, userId],
    function(err) {
      if (err) {
        return res.status(500).json({ 
          success: false, 
          message: 'Error cancelling booking' 
        });
      }

      if (this.changes === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Booking not found or cannot be cancelled' 
        });
      }

      // Free up the slot
      db.run('UPDATE parking_slots SET is_available = 1 WHERE id = (SELECT slot_id FROM bookings WHERE id = ?)', [id]);

      res.json({ 
        success: true, 
        message: 'Booking cancelled successfully' 
      });
    }
  );
};

// Generate QR code
exports.generateQRCode = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    db.get('SELECT * FROM bookings WHERE id = ? AND user_id = ?', [id, userId], async (err, booking) => {
      if (err || !booking) {
        return res.status(404).json({ 
          success: false, 
          message: 'Booking not found' 
        });
      }

      if (booking.qr_code) {
        return res.json({ 
          success: true, 
          qrCode: booking.qr_code 
        });
      }

      const qrData = {
        bookingId: booking.id,
        userId: booking.user_id,
        vehicleNumber: booking.vehicle_number,
        bookingDate: booking.booking_date
      };

      const qrCode = await generateQRCode(JSON.stringify(qrData));

      db.run('UPDATE bookings SET qr_code = ? WHERE id = ?', [qrCode, id], (err) => {
        if (err) {
          return res.status(500).json({ 
            success: false, 
            message: 'Error generating QR code' 
          });
        }

        res.json({ 
          success: true, 
          qrCode 
        });
      });
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error generating QR code' 
    });
  }
};

// Get available slots with real-time status
exports.getAvailableSlots = (req, res) => {
  const { organizationId } = req.query;

  if (!organizationId) {
    return res.status(400).json({
      success: false,
      message: 'Organization ID is required'
    });
  }

  // Get all slots with their current booking status
  const sql = `
    SELECT 
      ps.*,
      CASE 
        WHEN b.id IS NOT NULL AND b.status IN ('confirmed', 'active', 'overstay') THEN 'occupied'
        WHEN ps.is_available = 1 THEN 'available'
        ELSE 'disabled'
      END as current_status,
      b.vehicle_number as occupied_by_vehicle
    FROM parking_slots ps
    LEFT JOIN (
      SELECT * FROM bookings 
      WHERE status IN ('confirmed', 'active', 'overstay')
      AND booking_date = date('now')
    ) b ON ps.id = b.slot_id
    WHERE ps.organization_id = ?
    ORDER BY ps.slot_number`;

  db.all(sql, [organizationId], (err, slots) => {
    if (err) {
      console.error('Error fetching slots:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Error fetching available slots' 
      });
    }

    res.json({ 
      success: true, 
      data: slots 
    });
  });
};

// Check booking status
exports.checkBookingStatus = (req, res) => {
  const { id } = req.params;

  db.get('SELECT status, payment_status FROM bookings WHERE id = ?', [id], (err, booking) => {
    if (err || !booking) {
      return res.status(404).json({ 
        success: false, 
        message: 'Booking not found' 
      });
    }

    res.json({ 
      success: true, 
      status: booking.status,
      paymentStatus: booking.payment_status
    });
  });
};
