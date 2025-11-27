const express = require('express');
const router = express.Router();
const { getRow, getAllRows } = require('../config/db');
const {
  getOrganizationStats,
  updateOrganization,
  getAllOrganizations,
  findById: findOrgById
} = require('../models/Organization');
const {
  createUser,
  getAllUsersByOrganization,
  findById: findUserById,
  findByEmail
} = require('../models/User');
const { findByOrganizationId } = require('../models/Booking');
const { verifyToken } = require('../middleware/auth');
const { BadRequestError, NotFoundError, ConflictError, ForbiddenError } = require('../middleware/errorHandler');

/**
 * Middleware to check if user is organization admin
 */
const checkOrgAdmin = async (req, res, next) => {
  try {
    const { orgId } = req.params;
    const user = await findUserById(req.user.user_id);
    
    if (!user) {
      throw new NotFoundError('User not found');
    }
    
    // Check if user is admin of this organization
    // Admin users have user_type = 'admin' or 'organization_member' with matching organization_id
    const isAdmin = (user.user_type === 'admin' || user.user_type === 'organization_member') && 
                    user.organization_id === parseInt(orgId);
    
    if (!isAdmin) {
      throw new ForbiddenError('You do not have admin access to this organization');
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/organizations/dashboard/:orgId
 * Get organization dashboard data
 */
router.get('/dashboard/:orgId', verifyToken, checkOrgAdmin, async (req, res, next) => {
  try {
    const { orgId } = req.params;
    
    // Get organization stats
    const stats = await getOrganizationStats(orgId);
    
    // Get today's date boundaries in IST (Indian Standard Time, UTC+5:30)
    const now = new Date();
    // Convert to IST by adding 5 hours 30 minutes
    const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
    const istDate = new Date(now.getTime() + istOffset);
    const todayStr = istDate.toISOString().split('T')[0]; // e.g., "2025-11-10"
    
    const tomorrow = new Date(istDate);
    tomorrow.setDate(istDate.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    // Get this week's date boundaries
    const weekStart = new Date(istDate);
    weekStart.setDate(istDate.getDate() - istDate.getDay());
    const weekStartStr = weekStart.toISOString().split('T')[0];
    
    // Get this month's date boundaries
    const monthStart = new Date(istDate.getFullYear(), istDate.getMonth(), 1);
    const monthStartStr = monthStart.toISOString().split('T')[0];
    
    // Get bookings for different time periods using DATE comparison
    const todayBookingsResult = await getAllRows(
      `SELECT * FROM bookings 
       WHERE organization_id = ? 
       AND DATE(booking_start_time) = ?`,
      [orgId, todayStr]
    );
    const todayBookings = todayBookingsResult || [];
    
    const weekBookingsResult = await getAllRows(
      `SELECT * FROM bookings 
       WHERE organization_id = ? 
       AND DATE(booking_start_time) >= ?`,
      [orgId, weekStartStr]
    );
    const weekBookings = weekBookingsResult || [];
    
    const monthBookingsResult = await getAllRows(
      `SELECT * FROM bookings 
       WHERE organization_id = ? 
       AND DATE(booking_start_time) >= ?`,
      [orgId, monthStartStr]
    );
    const monthBookings = monthBookingsResult || [];
    
    // Calculate peak hours (group by hour)
    const hourCounts = {};
    todayBookings.forEach(booking => {
      const hour = new Date(booking.booking_start_time).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    
    const peakHours = Object.entries(hourCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour, count]) => ({
        hour: `${hour}:00 - ${parseInt(hour) + 1}:00`,
        bookings: count
      }));
    
    // Calculate today's revenue from completed booking payments ONLY (exclude penalties)
    // Only count revenue from bookings that were created/started today
    const todayRevenueResult = await getRow(
      `SELECT SUM(p.amount) as total 
       FROM payments p
       INNER JOIN bookings b ON p.booking_id = b.id
       WHERE b.organization_id = ? 
         AND p.payment_status = 'completed'
         AND p.payment_type = 'booking'
         AND DATE(b.booking_start_time) = ?`,
      [orgId, todayStr]
    );
    const today_revenue = todayRevenueResult && todayRevenueResult.total ? parseFloat(todayRevenueResult.total).toFixed(2) : '0.00';
    
    // Calculate today's penalty revenue separately
    const todayPenaltyResult = await getRow(
      `SELECT SUM(p.amount) as total 
       FROM payments p
       INNER JOIN bookings b ON p.booking_id = b.id
       WHERE b.organization_id = ? 
         AND p.payment_status = 'completed'
         AND p.payment_type = 'penalty'
         AND DATE(p.payment_timestamp) = ?`,
      [orgId, todayStr]
    );
    const today_penalty_revenue = todayPenaltyResult && todayPenaltyResult.total ? parseFloat(todayPenaltyResult.total).toFixed(2) : '0.00';
    
    // Return dashboard data
    const dashboardResponse = {
      success: true,
      data: {
        organization_id: parseInt(orgId),
        total_bookings_today: todayBookings.length,
        total_bookings_this_week: weekBookings.length,
        total_bookings_this_month: monthBookings.length,
        active_bookings: stats.active_bookings,
        overstay_bookings: stats.overstay_bookings, // Add overstay count
        available_slots: stats.available_slots,
        total_slots: stats.total_slots,
        occupancy_rate: stats.occupancy_rate,
        total_revenue: stats.total_revenue,
        today_revenue: today_revenue,
        today_penalty_revenue: today_penalty_revenue, // Separate penalty revenue
        peak_hours: peakHours
      }
    };
    
    console.log('📊 Dashboard Response:', JSON.stringify(dashboardResponse, null, 2));
    res.json(dashboardResponse);
    
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/organizations/update-rules/:orgId
 * Update organization parking rules and settings
 */
router.put('/update-rules/:orgId', verifyToken, checkOrgAdmin, async (req, res, next) => {
  try {
    const { orgId } = req.params;
    const { parking_rules, operating_hours, visitor_hourly_rate } = req.body;
    
    // Validate at least one field is provided
    if (!parking_rules && !operating_hours && !visitor_hourly_rate) {
      throw new BadRequestError('At least one field (parking_rules, operating_hours, visitor_hourly_rate) is required');
    }
    
    // Build update fields
    const updateFields = {};
    if (parking_rules) updateFields.parking_rules = parking_rules;
    if (operating_hours) updateFields.operating_hours = operating_hours;
    if (visitor_hourly_rate !== undefined) {
      if (visitor_hourly_rate < 0) {
        throw new BadRequestError('visitor_hourly_rate must be a positive number');
      }
      updateFields.visitor_hourly_rate = visitor_hourly_rate;
    }
    
    // Update organization
    await updateOrganization(orgId, updateFields);
    
    // Get updated organization
    const updatedOrg = await findOrgById(orgId);
    
    // Return updated organization
    res.json({
      success: true,
      message: 'Organization rules updated successfully',
      data: {
        organization: updatedOrg
      }
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/organizations/members/:orgId
 * Get all members of organization
 */
router.get('/members/:orgId', verifyToken, checkOrgAdmin, async (req, res, next) => {
  try {
    const { orgId } = req.params;
    
    // Get all organization members
    const members = await getAllUsersByOrganization(orgId);
    
    // Return list of members
    res.json({
      success: true,
      data: {
        members,
        count: members.length
      }
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/organizations/add-member
 * Add a new member to organization
 */
router.post('/add-member', verifyToken, async (req, res, next) => {
  try {
    const { name, email, mobile, employee_id, organization_id, password } = req.body;
    
    // Validate required fields
    if (!name || !email || !mobile || !employee_id || !organization_id || !password) {
      throw new BadRequestError('name, email, mobile, employee_id, organization_id, and password are required');
    }
    
    // Verify admin has access to this organization
    const admin = await findUserById(req.user.user_id);
    if (admin.organization_id !== parseInt(organization_id)) {
      throw new ForbiddenError('You can only add members to your own organization');
    }
    
    // Check if email already exists
    const existingUser = await findByEmail(email);
    if (existingUser) {
      throw new ConflictError('Email already registered');
    }
    
    // Check if employee ID already exists in this organization
    const { findByEmployeeId } = require('../models/User');
    const existingEmployee = await findByEmployeeId(employee_id, organization_id);
    if (existingEmployee) {
      throw new ConflictError('Employee ID already exists in this organization');
    }
    
    // Validate mobile (10 digits)
    if (!/^\d{10}$/.test(mobile)) {
      throw new BadRequestError('Mobile number must be exactly 10 digits');
    }
    
    // Create user with user_type = 'organization_member'
    const member = await createUser(
      name,
      email,
      mobile,
      password,
      'organization_member',
      organization_id,
      employee_id
    );
    
    // Return created member
    res.status(201).json({
      success: true,
      message: 'Member added successfully',
      data: {
        member
      }
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/organizations/remove-member/:userId
 * Remove member from organization (soft delete)
 */
router.delete('/remove-member/:userId', verifyToken, async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    // Get user to be removed
    const userToRemove = await findUserById(userId);
    if (!userToRemove) {
      throw new NotFoundError('User not found');
    }
    
    // Verify admin has access to this organization
    const admin = await findUserById(req.user.user_id);
    if (admin.organization_id !== userToRemove.organization_id) {
      throw new ForbiddenError('You can only remove members from your own organization');
    }
    
    // Prevent admin from removing themselves
    if (parseInt(userId) === req.user.user_id) {
      throw new BadRequestError('You cannot remove yourself');
    }
    
    // Hard delete: completely remove user from database
    const { deleteUser } = require('../models/User');
    await deleteUser(userId);
    
    // Return confirmation
    res.json({
      success: true,
      message: 'Member removed successfully',
      data: {
        user_id: parseInt(userId),
        status: 'deleted'
      }
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/organizations/analytics/:orgId
 * Get analytics data for organization
 */
router.get('/analytics/:orgId', verifyToken, checkOrgAdmin, async (req, res, next) => {
  try {
    const { orgId } = req.params;
    const { period = 'month' } = req.query; // daily, weekly, monthly
    
    // Get organization stats
    const stats = await getOrganizationStats(orgId);
    
    // Calculate date range based on period
    const endDate = new Date();
    let startDate = new Date();
    
    if (period === 'daily') {
      startDate.setDate(endDate.getDate() - 30); // Last 30 days
    } else if (period === 'weekly') {
      startDate.setDate(endDate.getDate() - 12 * 7); // Last 12 weeks
    } else {
      startDate.setMonth(endDate.getMonth() - 12); // Last 12 months
    }
    
    // Get all bookings in range
    const bookings = await findByOrganizationId(orgId, {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });
    
    // Group bookings by date
    const bookingTrends = {};
    const memberBookings = [];
    const visitorBookings = [];
    
    bookings.forEach(booking => {
      const date = new Date(booking.booking_start_time).toISOString().split('T')[0];
      bookingTrends[date] = (bookingTrends[date] || 0) + 1;
      
      // Separate by user type
      if (booking.user_type === 'organization_member') {
        memberBookings.push(booking);
      } else {
        visitorBookings.push(booking);
      }
    });
    
    // Calculate member vs visitor ratio
    const totalBookings = bookings.length;
    const memberRatio = totalBookings > 0 ? ((memberBookings.length / totalBookings) * 100).toFixed(2) : 0;
    const visitorRatio = totalBookings > 0 ? ((visitorBookings.length / totalBookings) * 100).toFixed(2) : 0;
    
    // Calculate revenue trends (visitors only)
    const revenueTrends = {};
    visitorBookings.forEach(booking => {
      const date = new Date(booking.booking_start_time).toISOString().split('T')[0];
      revenueTrends[date] = (revenueTrends[date] || 0) + booking.amount;
    });
    
    // Return analytics object
    res.json({
      success: true,
      data: {
        organization_id: parseInt(orgId),
        period,
        date_range: {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0]
        },
        summary: {
          total_bookings: totalBookings,
          member_bookings: memberBookings.length,
          visitor_bookings: visitorBookings.length,
          member_ratio: `${memberRatio}%`,
          visitor_ratio: `${visitorRatio}%`,
          total_revenue: stats.total_revenue,
          average_occupancy: stats.occupancy_rate
        },
        booking_trends: Object.entries(bookingTrends)
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([date, count]) => ({ date, bookings: count })),
        revenue_trends: Object.entries(revenueTrends)
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([date, revenue]) => ({ date, revenue }))
      }
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/organizations/all
 * Get all organizations (public endpoint for booking form)
 */
router.get('/all', async (req, res, next) => {
  try {
    // Get all organizations
    const organizations = await getAllOrganizations();
    
    // Return minimal data for dropdown
    const organizationList = organizations.map(org => ({
      id: org.id,
      org_name: org.org_name,
      address: org.address,
      visitor_hourly_rate: org.visitor_hourly_rate,
      available_slots: org.available_slots,
      total_slots: org.total_slots
    }));
    
    // Return array
    res.json({
      success: true,
      data: {
        organizations: organizationList,
        count: organizationList.length
      }
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/organizations/:id
 * Get organization details by ID (public endpoint)
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Get organization by ID
    const organization = await findOrgById(id);
    
    if (!organization) {
      throw new NotFoundError('Organization not found');
    }
    
    // Return organization details
    res.json({
      success: true,
      data: organization
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/organizations/:orgId
 * Delete an organization and all its related data
 * This will delete:
 * - All bookings and payments
 * - All parking lots
 * - All watchmen
 * - All organization members/users
 * - The organization itself
 */
router.delete('/:orgId', verifyToken, async (req, res, next) => {
  try {
    const { orgId } = req.params;
    const { deleteOrganizationWithDependencies } = require('../utils/organizationDeletion');
    
    // Get user making the request
    const user = await findUserById(req.user.user_id);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    
    // Get organization to be deleted
    const organization = await findOrgById(orgId);
    if (!organization) {
      throw new NotFoundError('Organization not found');
    }
    
    // Check if user is the admin of this organization
    // The admin should have the same email as the organization's admin_email
    const isAdmin = user.email === organization.admin_email;
    
    if (!isAdmin) {
      throw new ForbiddenError('Only the organization admin can delete the organization');
    }
    
    // Delete organization and all related data
    const result = await deleteOrganizationWithDependencies(parseInt(orgId));
    
    // Return success response
    res.json({
      success: true,
      message: result.message,
      data: result
    });
    
  } catch (error) {
    next(error);
  }
});

module.exports = router;
