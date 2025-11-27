const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const authConfig = require('../config/auth.config');

// Register new user
exports.register = async (req, res) => {
  try {
    const { name, email, mobile, password, userType, organizationId } = req.body;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, authConfig.saltRounds);

    const sql = `INSERT INTO users (name, email, mobile, password, user_type, organization_id) 
                 VALUES (?, ?, ?, ?, ?, ?)`;

    db.run(sql, [name, email, mobile, hashedPassword, userType, organizationId || null], function(err) {
      if (err) {
        console.error('Registration error:', err.message);
        
        // Handle unique constraint violations with specific messages
        if (err.message.includes('UNIQUE constraint failed')) {
          if (err.message.includes('users.email')) {
            return res.status(409).json({ 
              success: false, 
              message: 'This email address is already registered. Please use a different email or try logging in.' 
            });
          }
          if (err.message.includes('users.mobile')) {
            return res.status(409).json({ 
              success: false, 
              message: 'This mobile number is already registered. Please use a different number or try logging in.' 
            });
          }
          return res.status(409).json({ 
            success: false, 
            message: 'An account with these details already exists. Please try logging in.' 
          });
        }
        
        // Handle foreign key constraint violations
        if (err.message.includes('FOREIGN KEY constraint failed')) {
          return res.status(400).json({ 
            success: false, 
            message: 'Invalid organization selected. Please choose a valid organization.' 
          });
        }
        
        return res.status(500).json({ 
          success: false, 
          message: 'Error registering user. Please try again.' 
        });
      }

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        userId: this.lastID
      });
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error during registration' 
    });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
      if (err) {
        return res.status(500).json({ 
          success: false, 
          message: 'Error during login' 
        });
      }

      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }

      const passwordValid = await bcrypt.compare(password, user.password);
      if (!passwordValid) {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid password' 
        });
      }

      const token = jwt.sign(
        { 
          id: user.id, 
          userType: user.user_type,
          organizationId: user.organization_id 
        },
        authConfig.jwtSecret,
        { expiresIn: authConfig.jwtExpiresIn }
      );

      res.json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          userType: user.user_type,
          organizationId: user.organization_id,
          isVerified: user.is_verified
        }
      });
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error during login' 
    });
  }
};

// Get user profile
exports.getProfile = (req, res) => {
  db.get('SELECT id, name, email, mobile, user_type, organization_id, is_verified, created_at FROM users WHERE id = ?', 
    [req.userId], 
    (err, user) => {
      if (err || !user) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }

      res.json({ 
        success: true, 
        data: user 
      });
    }
  );
};

// Update profile
exports.updateProfile = (req, res) => {
  const { name, mobile } = req.body;
  
  db.run(
    'UPDATE users SET name = ?, mobile = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [name, mobile, req.userId],
    function(err) {
      if (err) {
        return res.status(500).json({ 
          success: false, 
          message: 'Error updating profile' 
        });
      }

      res.json({ 
        success: true, 
        message: 'Profile updated successfully' 
      });
    }
  );
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    db.get('SELECT password FROM users WHERE id = ?', [req.userId], async (err, user) => {
      if (err || !user) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }

      const passwordValid = await bcrypt.compare(currentPassword, user.password);
      if (!passwordValid) {
        return res.status(401).json({ 
          success: false, 
          message: 'Current password is incorrect' 
        });
      }

      const hashedPassword = await bcrypt.hash(newPassword, authConfig.saltRounds);

      db.run(
        'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [hashedPassword, req.userId],
        (err) => {
          if (err) {
            return res.status(500).json({ 
              success: false, 
              message: 'Error changing password' 
            });
          }

          res.json({ 
            success: true, 
            message: 'Password changed successfully' 
          });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

// Verify member
exports.verifyMember = (req, res) => {
  const { email, organizationId } = req.body;

  db.get(
    `SELECT u.*, om.membership_type 
     FROM users u 
     LEFT JOIN organization_members om ON u.id = om.user_id AND om.organization_id = ?
     WHERE u.email = ?`,
    [organizationId, email],
    (err, user) => {
      if (err) {
        return res.status(500).json({ 
          success: false, 
          message: 'Error verifying member' 
        });
      }

      if (!user) {
        return res.json({ 
          success: false, 
          isMember: false, 
          message: 'User not found' 
        });
      }

      const isMember = user.membership_type !== null;

      res.json({
        success: true,
        isMember,
        user: isMember ? {
          id: user.id,
          name: user.name,
          email: user.email,
          membershipType: user.membership_type
        } : null
      });
    }
  );
};

// Logout (client-side token removal)
exports.logout = (req, res) => {
  res.json({ 
    success: true, 
    message: 'Logged out successfully' 
  });
};
