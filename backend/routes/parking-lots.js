const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { BadRequestError, NotFoundError, ConflictError, ForbiddenError } = require('../middleware/errorHandler');
const {
  createParkingLot,
  getParkingLotsByOrganization,
  getParkingLotById,
  updateParkingLot,
  deleteParkingLot,
  getParkingLotStats,
  getOrganizationTotalSlots
} = require('../models/ParkingLot');
const { findById: findUserById } = require('../models/User');

/**
 * Middleware to check if user is organization admin
 */
const checkOrgAdmin = async (req, res, next) => {
  try {
    const orgId = req.params.orgId || req.params.id;
    const user = await findUserById(req.user.user_id);
    
    if (!user) {
      throw new NotFoundError('User not found');
    }
    
    // Check if user is admin of this organization
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
 * GET /api/parking-lots/organization/:orgId
 * Get all parking lots for an organization
 */
router.get('/organization/:orgId', verifyToken, async (req, res, next) => {
  try {
    const { orgId } = req.params;
    const { includeInactive } = req.query;
    
    const activeOnly = includeInactive !== 'true';
    const parkingLots = await getParkingLotsByOrganization(orgId, activeOnly);
    
    // Get stats for each parking lot
    const lotsWithStats = await Promise.all(
      parkingLots.map(async (lot) => {
        const stats = await getParkingLotStats(lot.lot_id);
        return {
          ...lot,
          stats
        };
      })
    );
    
    res.json({
      success: true,
      data: {
        parking_lots: lotsWithStats,
        count: lotsWithStats.length
      }
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/parking-lots/:lotId
 * Get a specific parking lot by ID
 */
router.get('/:lotId', verifyToken, async (req, res, next) => {
  try {
    const { lotId } = req.params;
    
    const parkingLot = await getParkingLotById(lotId);
    
    if (!parkingLot) {
      throw new NotFoundError('Parking lot not found');
    }
    
    // Get statistics for this lot
    const stats = await getParkingLotStats(lotId);
    
    res.json({
      success: true,
      data: {
        ...parkingLot,
        stats
      }
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/parking-lots/organization/:orgId
 * Create a new parking lot for an organization
 */
router.post('/organization/:orgId', verifyToken, checkOrgAdmin, async (req, res, next) => {
  try {
    const { orgId } = req.params;
    const { lot_name, lot_description, total_slots, priority_order } = req.body;
    
    // Validation
    if (!lot_name || !total_slots) {
      throw new BadRequestError('lot_name and total_slots are required');
    }
    
    if (total_slots <= 0) {
      throw new BadRequestError('total_slots must be greater than 0');
    }
    
    // If no priority order provided, set it to max + 1
    let finalPriorityOrder = priority_order;
    if (!finalPriorityOrder) {
      const existingLots = await getParkingLotsByOrganization(orgId, false);
      finalPriorityOrder = existingLots.length > 0 
        ? Math.max(...existingLots.map(lot => lot.priority_order)) + 1 
        : 1;
    }
    
    // Create parking lot
    const parkingLot = await createParkingLot(
      orgId,
      lot_name,
      lot_description || '',
      total_slots,
      finalPriorityOrder
    );
    
    res.status(201).json({
      success: true,
      message: 'Parking lot created successfully',
      data: parkingLot
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/parking-lots/:lotId
 * Update a parking lot
 */
router.put('/:lotId', verifyToken, async (req, res, next) => {
  try {
    const { lotId } = req.params;
    const { lot_name, lot_description, total_slots, priority_order, is_active } = req.body;
    
    // Get parking lot to check organization
    const parkingLot = await getParkingLotById(lotId);
    if (!parkingLot) {
      throw new NotFoundError('Parking lot not found');
    }
    
    // Verify user is admin of this organization
    const user = await findUserById(req.user.user_id);
    const isAdmin = (user.user_type === 'admin' || user.user_type === 'organization_member') && 
                    user.organization_id === parkingLot.organization_id;
    
    if (!isAdmin) {
      throw new ForbiddenError('You do not have permission to update this parking lot');
    }
    
    // Build update fields
    const updateFields = {};
    if (lot_name) updateFields.lot_name = lot_name;
    if (lot_description !== undefined) updateFields.lot_description = lot_description;
    if (total_slots !== undefined) {
      if (total_slots <= 0) {
        throw new BadRequestError('total_slots must be greater than 0');
      }
      // Check if new total_slots is less than currently occupied slots
      const occupiedSlots = parkingLot.total_slots - parkingLot.available_slots;
      if (total_slots < occupiedSlots) {
        throw new BadRequestError(`Cannot reduce total_slots below ${occupiedSlots} (currently occupied)`);
      }
      updateFields.total_slots = total_slots;
    }
    if (priority_order !== undefined) updateFields.priority_order = priority_order;
    if (is_active !== undefined) updateFields.is_active = is_active ? 1 : 0;
    
    // Update parking lot
    const updatedLot = await updateParkingLot(lotId, updateFields);
    
    res.json({
      success: true,
      message: 'Parking lot updated successfully',
      data: updatedLot
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/parking-lots/:lotId
 * Delete a parking lot
 */
router.delete('/:lotId', verifyToken, async (req, res, next) => {
  try {
    const { lotId } = req.params;
    
    // Get parking lot to check organization
    const parkingLot = await getParkingLotById(lotId);
    if (!parkingLot) {
      throw new NotFoundError('Parking lot not found');
    }
    
    // Verify user is admin of this organization
    const user = await findUserById(req.user.user_id);
    const isAdmin = (user.user_type === 'admin' || user.user_type === 'organization_member') && 
                    user.organization_id === parkingLot.organization_id;
    
    if (!isAdmin) {
      throw new ForbiddenError('You do not have permission to delete this parking lot');
    }
    
    // Delete parking lot (will throw error if there are active bookings)
    await deleteParkingLot(lotId);
    
    res.json({
      success: true,
      message: 'Parking lot deleted successfully',
      data: {
        lot_id: parseInt(lotId),
        status: 'deleted'
      }
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/parking-lots/:lotId/slots
 * Update total slots for a parking lot
 */
router.patch('/:lotId/slots', verifyToken, async (req, res, next) => {
  try {
    const { lotId } = req.params;
    const { total_slots } = req.body;
    
    if (!total_slots || total_slots <= 0) {
      throw new BadRequestError('total_slots must be a positive number');
    }
    
    // Get parking lot to check organization
    const parkingLot = await getParkingLotById(lotId);
    if (!parkingLot) {
      throw new NotFoundError('Parking lot not found');
    }
    
    // Verify user is admin of this organization
    const user = await findUserById(req.user.user_id);
    const isAdmin = (user.user_type === 'admin' || user.user_type === 'organization_member') && 
                    user.organization_id === parkingLot.organization_id;
    
    if (!isAdmin) {
      throw new ForbiddenError('You do not have permission to update this parking lot');
    }
    
    // Check if new total_slots is less than currently occupied slots
    const occupiedSlots = parkingLot.total_slots - parkingLot.available_slots;
    if (total_slots < occupiedSlots) {
      throw new BadRequestError(`Cannot reduce total_slots to ${total_slots}. Currently ${occupiedSlots} slots are occupied.`);
    }
    
    // Calculate new available_slots
    const newAvailableSlots = total_slots - occupiedSlots;
    
    // Update parking lot
    const updatedLot = await updateParkingLot(lotId, { 
      total_slots,
      available_slots: newAvailableSlots
    });
    
    res.json({
      success: true,
      message: 'Parking lot slots updated successfully',
      data: updatedLot
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/parking-lots/organization/:orgId/total-slots
 * Get total slots across all parking lots for an organization
 */
router.get('/organization/:orgId/total-slots', verifyToken, async (req, res, next) => {
  try {
    const { orgId } = req.params;
    
    const totals = await getOrganizationTotalSlots(orgId);
    
    res.json({
      success: true,
      data: totals
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/parking-lots/:lotId/toggle-active
 * Toggle active status of a parking lot
 */
router.patch('/:lotId/toggle-active', verifyToken, async (req, res, next) => {
  try {
    const { lotId } = req.params;
    
    // Get parking lot to check organization
    const parkingLot = await getParkingLotById(lotId);
    if (!parkingLot) {
      throw new NotFoundError('Parking lot not found');
    }
    
    // Verify user is admin of this organization
    const user = await findUserById(req.user.user_id);
    const isAdmin = (user.user_type === 'admin' || user.user_type === 'organization_member') && 
                    user.organization_id === parkingLot.organization_id;
    
    if (!isAdmin) {
      throw new ForbiddenError('You do not have permission to update this parking lot');
    }
    
    // Toggle active status
    const newStatus = parkingLot.is_active ? 0 : 1;
    const updatedLot = await updateParkingLot(lotId, { is_active: newStatus });
    
    res.json({
      success: true,
      message: `Parking lot ${newStatus ? 'activated' : 'deactivated'} successfully`,
      data: updatedLot
    });
    
  } catch (error) {
    next(error);
  }
});

module.exports = router;
