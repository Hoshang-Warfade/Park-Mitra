const db = require('../config/db');

// Register organization
exports.registerOrganization = (req, res) => {
  const { name, address, contactEmail, contactPhone, totalSlots, pricingPerHour } = req.body;
  const adminId = req.userId;

  const sql = `INSERT INTO organizations (name, address, contact_email, contact_phone, total_slots, 
               available_slots, pricing_per_hour, admin_id) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

  db.run(sql, [name, address, contactEmail, contactPhone, totalSlots, totalSlots, pricingPerHour, adminId], 
    function(err) {
      if (err) {
        return res.status(500).json({ 
          success: false, 
          message: 'Error registering organization' 
        });
      }

      // Update user to org_admin
      db.run('UPDATE users SET user_type = ?, organization_id = ? WHERE id = ?', 
        ['org_admin', this.lastID, adminId]);

      res.status(201).json({
        success: true,
        message: 'Organization registered successfully',
        organizationId: this.lastID
      });
    }
  );
};

// Get dashboard data
exports.getDashboard = (req, res) => {
  const organizationId = req.organizationId;

  const queries = {
    organization: new Promise((resolve, reject) => {
      db.get('SELECT * FROM organizations WHERE id = ?', [organizationId], (err, row) => {
        err ? reject(err) : resolve(row);
      });
    }),
    totalBookings: new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM bookings WHERE organization_id = ?', [organizationId], (err, row) => {
        err ? reject(err) : resolve(row.count);
      });
    }),
    todayBookings: new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM bookings WHERE organization_id = ? AND booking_date = date("now")', 
        [organizationId], (err, row) => {
          err ? reject(err) : resolve(row.count);
        });
    }),
    revenue: new Promise((resolve, reject) => {
      db.get('SELECT SUM(total_amount) as total FROM bookings WHERE organization_id = ? AND payment_status = "paid"', 
        [organizationId], (err, row) => {
          err ? reject(err) : resolve(row.total || 0);
        });
    }),
    // Get actual slot counts from parking_slots table (real-time data)
    slotCounts: new Promise((resolve, reject) => {
      db.get(
        `SELECT 
          COUNT(*) as total_slots,
          COUNT(CASE 
            WHEN ps.is_available = 1 
            AND (b.id IS NULL OR b.status NOT IN ('confirmed', 'active', 'overstay')) 
            THEN 1 
          END) as available_slots
         FROM parking_slots ps
         LEFT JOIN (
           SELECT slot_id, id, status 
           FROM bookings 
           WHERE status IN ('confirmed', 'active', 'overstay')
           AND booking_date = date('now')
         ) b ON ps.id = b.slot_id
         WHERE ps.organization_id = ?`,
        [organizationId],
        (err, row) => {
          err ? reject(err) : resolve(row || { total_slots: 0, available_slots: 0 });
        }
      );
    })
  };

  Promise.all(Object.values(queries))
    .then(([organization, totalBookings, todayBookings, revenue, slotCounts]) => {
      // Update organization with real-time slot counts
      const updatedOrg = {
        ...organization,
        total_slots: slotCounts.total_slots,
        available_slots: slotCounts.available_slots
      };
      
      res.json({
        success: true,
        data: {
          organization: updatedOrg,
          stats: {
            totalBookings,
            todayBookings,
            revenue,
            availableSlots: slotCounts.available_slots
          }
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

// Get organization by ID
exports.getOrganizationById = (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT * FROM organizations WHERE id = ?', [id], (err, org) => {
    if (err || !org) {
      return res.status(404).json({ 
        success: false, 
        message: 'Organization not found' 
      });
    }
    res.json({ success: true, data: org });
  });
};

// Update organization
exports.updateOrganization = (req, res) => {
  const { id } = req.params;
  const { name, address, contactEmail, contactPhone, pricingPerHour } = req.body;
  
  db.run(
    `UPDATE organizations SET name = ?, address = ?, contact_email = ?, contact_phone = ?, 
     pricing_per_hour = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [name, address, contactEmail, contactPhone, pricingPerHour, id],
    function(err) {
      if (err) {
        return res.status(500).json({ success: false, message: 'Error updating organization' });
      }
      res.json({ success: true, message: 'Organization updated successfully' });
    }
  );
};

// Get analytics
exports.getAnalytics = (req, res) => {
  const { id } = req.params;
  
  db.all(
    `SELECT DATE(booking_date) as date, COUNT(*) as bookings, SUM(total_amount) as revenue
     FROM bookings WHERE organization_id = ? AND booking_date >= date('now', '-30 days')
     GROUP BY DATE(booking_date) ORDER BY date DESC`,
    [id],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Error fetching analytics' });
      }
      res.json({ success: true, data: rows });
    }
  );
};

// Member management
exports.getMembers = (req, res) => {
  const { id } = req.params;
  
  db.all(
    `SELECT om.*, u.name, u.email, u.mobile FROM organization_members om
     JOIN users u ON om.user_id = u.id WHERE om.organization_id = ?`,
    [id],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Error fetching members' });
      }
      res.json({ success: true, data: rows });
    }
  );
};

exports.addMember = (req, res) => {
  const { id } = req.params;
  const { userId, membershipType } = req.body;
  
  db.run(
    'INSERT INTO organization_members (organization_id, user_id, membership_type) VALUES (?, ?, ?)',
    [id, userId, membershipType],
    function(err) {
      if (err) {
        return res.status(500).json({ success: false, message: 'Error adding member' });
      }
      res.status(201).json({ success: true, message: 'Member added successfully', memberId: this.lastID });
    }
  );
};

exports.removeMember = (req, res) => {
  const { id, memberId } = req.params;
  
  db.run('DELETE FROM organization_members WHERE id = ? AND organization_id = ?', [memberId, id], function(err) {
    if (err) {
      return res.status(500).json({ success: false, message: 'Error removing member' });
    }
    res.json({ success: true, message: 'Member removed successfully' });
  });
};

exports.updateMember = (req, res) => {
  const { id, memberId } = req.params;
  const { membershipType, isActive } = req.body;
  
  db.run(
    'UPDATE organization_members SET membership_type = ?, is_active = ? WHERE id = ? AND organization_id = ?',
    [membershipType, isActive, memberId, id],
    function(err) {
      if (err) {
        return res.status(500).json({ success: false, message: 'Error updating member' });
      }
      res.json({ success: true, message: 'Member updated successfully' });
    }
  );
};

// Slot management
exports.getSlots = (req, res) => {
  const { id } = req.params;
  
  db.all('SELECT * FROM parking_slots WHERE organization_id = ?', [id], (err, rows) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Error fetching slots' });
    }
    res.json({ success: true, data: rows });
  });
};

exports.addSlot = (req, res) => {
  const { id } = req.params;
  const { slotNumber, slotType, floorLevel } = req.body;
  
  db.run(
    'INSERT INTO parking_slots (organization_id, slot_number, slot_type, floor_level, is_available) VALUES (?, ?, ?, ?, 1)',
    [id, slotNumber, slotType, floorLevel],
    function(err) {
      if (err) {
        return res.status(500).json({ success: false, message: 'Error adding slot' });
      }
      
      const slotId = this.lastID;
      
      // Recalculate total slots and available slots from parking_slots table
      db.get(
        `SELECT 
          COUNT(*) as total_slots,
          COUNT(CASE 
            WHEN ps.is_available = 1 
            AND (b.id IS NULL OR b.status NOT IN ('confirmed', 'active', 'overstay')) 
            THEN 1 
          END) as available_slots
         FROM parking_slots ps
         LEFT JOIN (
           SELECT slot_id, id, status 
           FROM bookings 
           WHERE status IN ('confirmed', 'active', 'overstay')
           AND booking_date = date('now')
         ) b ON ps.id = b.slot_id
         WHERE ps.organization_id = ?`,
        [id],
        (err, counts) => {
          if (!err && counts) {
            db.run(
              'UPDATE organizations SET total_slots = ?, available_slots = ? WHERE id = ?',
              [counts.total_slots, counts.available_slots, id]
            );
          }
        }
      );
      
      res.status(201).json({ success: true, message: 'Slot added successfully', slotId });
    }
  );
};

exports.updateSlot = (req, res) => {
  const { id, slotId } = req.params;
  const { slotNumber, slotType, isAvailable, floorLevel } = req.body;
  
  db.run(
    'UPDATE parking_slots SET slot_number = ?, slot_type = ?, is_available = ?, floor_level = ? WHERE id = ? AND organization_id = ?',
    [slotNumber, slotType, isAvailable, floorLevel, slotId, id],
    function(err) {
      if (err) {
        return res.status(500).json({ success: false, message: 'Error updating slot' });
      }
      
      // Recalculate available slots from parking_slots table
      db.get(
        `SELECT 
          COUNT(*) as total_slots,
          COUNT(CASE 
            WHEN ps.is_available = 1 
            AND (b.id IS NULL OR b.status NOT IN ('confirmed', 'active', 'overstay')) 
            THEN 1 
          END) as available_slots
         FROM parking_slots ps
         LEFT JOIN (
           SELECT slot_id, id, status 
           FROM bookings 
           WHERE status IN ('confirmed', 'active', 'overstay')
           AND booking_date = date('now')
         ) b ON ps.id = b.slot_id
         WHERE ps.organization_id = ?`,
        [id],
        (err, counts) => {
          if (!err && counts) {
            db.run(
              'UPDATE organizations SET total_slots = ?, available_slots = ? WHERE id = ?',
              [counts.total_slots, counts.available_slots, id]
            );
          }
        }
      );
      
      res.json({ success: true, message: 'Slot updated successfully' });
    }
  );
};

exports.deleteSlot = (req, res) => {
  const { id, slotId } = req.params;
  
  db.run('DELETE FROM parking_slots WHERE id = ? AND organization_id = ?', [slotId, id], function(err) {
    if (err) {
      return res.status(500).json({ success: false, message: 'Error deleting slot' });
    }
    
    // Recalculate total slots and available slots from parking_slots table
    db.get(
      `SELECT 
        COUNT(*) as total_slots,
        COUNT(CASE 
          WHEN ps.is_available = 1 
          AND (b.id IS NULL OR b.status NOT IN ('confirmed', 'active', 'overstay')) 
          THEN 1 
        END) as available_slots
       FROM parking_slots ps
       LEFT JOIN (
         SELECT slot_id, id, status 
         FROM bookings 
         WHERE status IN ('confirmed', 'active', 'overstay')
         AND booking_date = date('now')
       ) b ON ps.id = b.slot_id
       WHERE ps.organization_id = ?`,
      [id],
      (err, counts) => {
        if (!err && counts) {
          db.run(
            'UPDATE organizations SET total_slots = ?, available_slots = ? WHERE id = ?',
            [counts.total_slots || 0, counts.available_slots || 0, id]
          );
        }
      }
    );
    
    res.json({ success: true, message: 'Slot deleted successfully' });
  });
};

// Rules management
exports.getRules = (req, res) => {
  const { id } = req.params;
  
  db.all('SELECT * FROM parking_rules WHERE organization_id = ?', [id], (err, rows) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Error fetching rules' });
    }
    res.json({ success: true, data: rows });
  });
};

exports.addRule = (req, res) => {
  const { id } = req.params;
  const { ruleName, ruleDescription, maxBookingHours, advanceBookingDays, cancellationHours } = req.body;
  
  db.run(
    `INSERT INTO parking_rules (organization_id, rule_name, rule_description, max_booking_hours, 
     advance_booking_days, cancellation_hours) VALUES (?, ?, ?, ?, ?, ?)`,
    [id, ruleName, ruleDescription, maxBookingHours, advanceBookingDays, cancellationHours],
    function(err) {
      if (err) {
        return res.status(500).json({ success: false, message: 'Error adding rule' });
      }
      res.status(201).json({ success: true, message: 'Rule added successfully', ruleId: this.lastID });
    }
  );
};

exports.updateRule = (req, res) => {
  const { id, ruleId } = req.params;
  const { ruleName, ruleDescription, maxBookingHours, advanceBookingDays, cancellationHours, isActive } = req.body;
  
  db.run(
    `UPDATE parking_rules SET rule_name = ?, rule_description = ?, max_booking_hours = ?, 
     advance_booking_days = ?, cancellation_hours = ?, is_active = ? WHERE id = ? AND organization_id = ?`,
    [ruleName, ruleDescription, maxBookingHours, advanceBookingDays, cancellationHours, isActive, ruleId, id],
    function(err) {
      if (err) {
        return res.status(500).json({ success: false, message: 'Error updating rule' });
      }
      res.json({ success: true, message: 'Rule updated successfully' });
    }
  );
};

exports.deleteRule = (req, res) => {
  const { id, ruleId } = req.params;
  
  db.run('DELETE FROM parking_rules WHERE id = ? AND organization_id = ?', [ruleId, id], function(err) {
    if (err) {
      return res.status(500).json({ success: false, message: 'Error deleting rule' });
    }
    res.json({ success: true, message: 'Rule deleted successfully' });
  });
};

// Get organization bookings
exports.getOrganizationBookings = (req, res) => {
  const { id } = req.params;
  
  db.all(
    `SELECT b.*, u.name as user_name, ps.slot_number FROM bookings b
     LEFT JOIN users u ON b.user_id = u.id
     LEFT JOIN parking_slots ps ON b.slot_id = ps.id
     WHERE b.organization_id = ? ORDER BY b.created_at DESC`,
    [id],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Error fetching bookings' });
      }
      res.json({ success: true, data: rows });
    }
  );
};
