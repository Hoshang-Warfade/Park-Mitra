/**
 * SlotManagement Component
 * Admin component for managing parking slots
 * Features: slot grid, status tracking, capacity management, force checkout
 */

import React, { useState, useEffect, useCallback } from 'react';
import organizationService from '../../services/organizationService';
import bookingService from '../../services/bookingService';
import '../../styles/Common.css';

/**
 * SlotManagement Component
 * @param {Object} props
 * @param {number} props.organizationId - Organization ID
 */
const SlotManagement = ({ organizationId }) => {
  // State management
  const [totalSlots, setTotalSlots] = useState(0);
  const [availableSlots, setAvailableSlots] = useState(0);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [newTotalSlots, setNewTotalSlots] = useState(0);
  const [updating, setUpdating] = useState(false);

  // Filter and search state
  const [filter, setFilter] = useState('all'); // all, available, occupied
  const [searchTerm, setSearchTerm] = useState('');

  // Modal state
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [forcingCheckout, setForcingCheckout] = useState(false);

  /**
   * Fetch slot data
   */
  const fetchSlotData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch organization details
      const orgResponse = await organizationService.getOrganizationById(organizationId);
      const org = orgResponse.data;

      const total = org.total_slots || 50;
      const available = org.available_slots || 30;

      setTotalSlots(total);
      setAvailableSlots(available);
      setNewTotalSlots(total);

      // Fetch active bookings
      const bookingsResponse = await bookingService.getActiveBookings(organizationId);
      const activeBookings = bookingsResponse.data || [];

      // Build slots array
      const slotsArray = [];
      for (let i = 1; i <= total; i++) {
        // Find if this slot is occupied
        const booking = activeBookings.find(b => b.slot_number === i);

        if (booking) {
          slotsArray.push({
            number: i,
            status: 'occupied',
            booking: {
              id: booking.id,
              userName: booking.user_name || 'Unknown User',
              vehicleNumber: booking.vehicle_number,
              entryTime: booking.start_time,
              duration: booking.duration || 'N/A',
              bookingTime: booking.booking_time
            }
          });
        } else {
          slotsArray.push({
            number: i,
            status: 'available',
            booking: null
          });
        }
      }

      setSlots(slotsArray);
    } catch (error) {
      console.error('Error fetching slot data:', error);
      alert('Failed to load slot data. Please try again.');
      
      // Set default data on error
      const defaultTotal = 50;
      setTotalSlots(defaultTotal);
      setAvailableSlots(defaultTotal);
      setNewTotalSlots(defaultTotal);
      
      const defaultSlots = [];
      for (let i = 1; i <= defaultTotal; i++) {
        defaultSlots.push({
          number: i,
          status: 'available',
          booking: null
        });
      }
      setSlots(defaultSlots);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  /**
   * Fetch on mount
   */
  useEffect(() => {
    if (organizationId) {
      fetchSlotData();
    }
  }, [organizationId, fetchSlotData]);

  /**
   * Handle update total slots
   */
  const handleUpdateTotal = async () => {
    const newTotal = parseInt(newTotalSlots);

    // Validation
    if (isNaN(newTotal) || newTotal < 1) {
      alert('Please enter a valid number of slots (minimum 1)');
      return;
    }

    const occupiedSlots = totalSlots - availableSlots;
    if (newTotal < occupiedSlots) {
      alert(`Cannot reduce total slots below ${occupiedSlots}.\nCurrently ${occupiedSlots} slots are occupied.`);
      return;
    }

    if (newTotal < totalSlots && newTotal < slots.length) {
      // Check if any slot beyond newTotal is occupied
      const hasOccupiedBeyond = slots
        .slice(newTotal)
        .some(slot => slot.status === 'occupied');
      
      if (hasOccupiedBeyond) {
        alert('Cannot reduce slots. Some slots beyond the new total are currently occupied.');
        return;
      }
    }

    setUpdating(true);

    try {
      // Update organization
      await organizationService.updateOrganization(organizationId, {
        total_slots: newTotal,
        available_slots: availableSlots + (newTotal - totalSlots)
      });

      alert('Total slots updated successfully!');
      setEditMode(false);

      // Refresh data
      await fetchSlotData();
    } catch (error) {
      console.error('Error updating total slots:', error);
      if (error.response?.data?.message) {
        alert(`Failed to update: ${error.response.data.message}`);
      } else {
        alert('Failed to update total slots. Please try again.');
      }
    } finally {
      setUpdating(false);
    }
  };

  /**
   * Handle slot click
   */
  const handleSlotClick = (slot) => {
    setSelectedSlot(slot);
    setShowModal(true);
  };

  /**
   * Handle close modal
   */
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedSlot(null);
  };

  /**
   * Handle force checkout
   */
  const handleForceCheckout = async () => {
    if (!selectedSlot || !selectedSlot.booking) return;

    const confirmed = window.confirm(
      `Force checkout for Slot ${selectedSlot.number}?\n\n` +
      `Vehicle: ${selectedSlot.booking.vehicleNumber}\n` +
      `User: ${selectedSlot.booking.userName}\n\n` +
      `This will mark the booking as completed and free up the slot.`
    );

    if (!confirmed) return;

    setForcingCheckout(true);

    try {
      // Update booking status to completed
      await bookingService.updateBookingStatus(selectedSlot.booking.id, 'completed');

      alert('Slot marked as available successfully!');
      handleCloseModal();

      // Refresh data
      await fetchSlotData();
    } catch (error) {
      console.error('Error forcing checkout:', error);
      if (error.response?.data?.message) {
        alert(`Failed to checkout: ${error.response.data.message}`);
      } else {
        alert('Failed to mark slot as available. Please try again.');
      }
    } finally {
      setForcingCheckout(false);
    }
  };

  /**
   * Filter slots
   */
  const getFilteredSlots = () => {
    let filtered = slots;

    // Apply status filter
    if (filter === 'available') {
      filtered = filtered.filter(slot => slot.status === 'available');
    } else if (filter === 'occupied') {
      filtered = filtered.filter(slot => slot.status === 'occupied');
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(slot => {
        if (slot.status === 'occupied' && slot.booking) {
          return (
            slot.booking.vehicleNumber?.toLowerCase().includes(searchLower) ||
            slot.booking.userName?.toLowerCase().includes(searchLower) ||
            slot.number.toString().includes(searchLower)
          );
        }
        return slot.number.toString().includes(searchLower);
      });
    }

    return filtered;
  };

  /**
   * Format time
   */
  const formatTime = (dateTime) => {
    if (!dateTime) return 'N/A';
    try {
      const date = new Date(dateTime);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return dateTime;
    }
  };

  /**
   * Calculate duration
   */
  const calculateDuration = (entryTime) => {
    if (!entryTime) return 'N/A';
    try {
      const start = new Date(entryTime);
      const now = new Date();
      const diffMs = now - start;
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${minutes}m`;
    } catch {
      return 'N/A';
    }
  };

  const occupiedSlots = totalSlots - availableSlots;
  const filteredSlots = getFilteredSlots();

  // Loading state
  if (loading) {
    return (
      <div className="slot-management-container">
        <div className="loading-skeleton">
          <div className="skeleton-header"></div>
          <div className="skeleton-overview"></div>
          <div className="skeleton-grid"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="slot-management-container">
      {/* Header */}
      <div className="slot-management-header">
        <div className="header-left">
          <h2 className="page-title">Parking Slot Management</h2>
          <p className="page-subtitle">
            Monitor and manage parking slot capacity and occupancy
          </p>
        </div>
        {!editMode && (
          <button className="btn btn-primary" onClick={() => setEditMode(true)}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Edit Capacity
          </button>
        )}
      </div>

      {/* Overview Section */}
      <div className="overview-section">
        <div className="overview-card overview-card-total">
          <div className="overview-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
              />
            </svg>
          </div>
          <div className="overview-content">
            <div className="overview-label">Total Slots</div>
            {editMode ? (
              <div className="overview-edit">
                <input
                  type="number"
                  className="overview-input"
                  value={newTotalSlots}
                  onChange={(e) => setNewTotalSlots(e.target.value)}
                  min="1"
                  disabled={updating}
                />
                <div className="overview-actions">
                  <button
                    className="btn btn-sm btn-success"
                    onClick={handleUpdateTotal}
                    disabled={updating}
                  >
                    {updating ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => {
                      setEditMode(false);
                      setNewTotalSlots(totalSlots);
                    }}
                    disabled={updating}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="overview-value">{totalSlots}</div>
            )}
          </div>
        </div>

        <div className="overview-card overview-card-available">
          <div className="overview-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="overview-content">
            <div className="overview-label">Available Slots</div>
            <div className="overview-value">{availableSlots}</div>
            <div className="overview-percentage">
              {totalSlots > 0 ? Math.round((availableSlots / totalSlots) * 100) : 0}% free
            </div>
          </div>
        </div>

        <div className="overview-card overview-card-occupied">
          <div className="overview-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <div className="overview-content">
            <div className="overview-label">Occupied Slots</div>
            <div className="overview-value">{occupiedSlots}</div>
            <div className="overview-percentage">
              {totalSlots > 0 ? Math.round((occupiedSlots / totalSlots) * 100) : 0}% occupied
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="slot-filters-section">
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({slots.length})
          </button>
          <button
            className={`filter-btn ${filter === 'available' ? 'active' : ''}`}
            onClick={() => setFilter('available')}
          >
            <span className="status-dot status-dot-available"></span>
            Available ({availableSlots})
          </button>
          <button
            className={`filter-btn ${filter === 'occupied' ? 'active' : ''}`}
            onClick={() => setFilter('occupied')}
          >
            <span className="status-dot status-dot-occupied"></span>
            Occupied ({occupiedSlots})
          </button>
        </div>

        <div className="search-box">
          <svg className="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="Search by slot, vehicle, or user..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-btn" onClick={() => setSearchTerm('')}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Slot Grid */}
      <div className="slot-grid-section">
        {filteredSlots.length === 0 ? (
          <div className="empty-state">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3>No slots found</h3>
            <p>Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          <div className="slot-grid">
            {filteredSlots.map((slot) => (
              <div
                key={slot.number}
                className={`slot-box slot-${slot.status}`}
                onClick={() => handleSlotClick(slot)}
              >
                <div className="slot-number">#{slot.number}</div>
                {slot.status === 'occupied' && slot.booking ? (
                  <div className="slot-details">
                    <div className="slot-vehicle">{slot.booking.vehicleNumber}</div>
                    <div className="slot-time">{calculateDuration(slot.booking.entryTime)}</div>
                  </div>
                ) : (
                  <div className="slot-status-label">Available</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Configuration Section */}
      <div className="configuration-section">
        <div className="config-card">
          <div className="config-header">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <h3>Advanced Configuration</h3>
          </div>
          <div className="config-content">
            <div className="config-item config-item-disabled">
              <div className="config-label">Slot Layout Settings</div>
              <div className="config-description">
                Customize slot arrangement and grouping
              </div>
              <button className="btn btn-sm btn-secondary" disabled>
                Coming Soon
              </button>
            </div>
            <div className="config-item config-item-disabled">
              <div className="config-label">Slot Numbering Scheme</div>
              <div className="config-description">
                Change slot numbering format and sequence
              </div>
              <button className="btn btn-sm btn-secondary" disabled>
                Coming Soon
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Slot Details Modal */}
      {showModal && selectedSlot && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content modal-content-wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Slot #{selectedSlot.number} Details</h3>
              <button className="modal-close-btn" onClick={handleCloseModal}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="modal-body">
              <div className="slot-detail-status">
                <span className={`status-badge status-badge-${selectedSlot.status}`}>
                  {selectedSlot.status === 'occupied' ? 'Occupied' : 'Available'}
                </span>
              </div>

              {selectedSlot.status === 'occupied' && selectedSlot.booking ? (
                <>
                  <div className="slot-detail-grid">
                    <div className="slot-detail-item">
                      <div className="slot-detail-label">User Name</div>
                      <div className="slot-detail-value">{selectedSlot.booking.userName}</div>
                    </div>
                    <div className="slot-detail-item">
                      <div className="slot-detail-label">Vehicle Number</div>
                      <div className="slot-detail-value slot-detail-highlight">
                        {selectedSlot.booking.vehicleNumber}
                      </div>
                    </div>
                    <div className="slot-detail-item">
                      <div className="slot-detail-label">Entry Time</div>
                      <div className="slot-detail-value">
                        {formatTime(selectedSlot.booking.entryTime)}
                      </div>
                    </div>
                    <div className="slot-detail-item">
                      <div className="slot-detail-label">Duration</div>
                      <div className="slot-detail-value">
                        {calculateDuration(selectedSlot.booking.entryTime)}
                      </div>
                    </div>
                    <div className="slot-detail-item">
                      <div className="slot-detail-label">Booking Time</div>
                      <div className="slot-detail-value">
                        {formatTime(selectedSlot.booking.bookingTime)}
                      </div>
                    </div>
                    <div className="slot-detail-item">
                      <div className="slot-detail-label">Booking ID</div>
                      <div className="slot-detail-value">#{selectedSlot.booking.id}</div>
                    </div>
                  </div>

                  <div className="modal-actions">
                    <button
                      className="btn btn-danger"
                      onClick={handleForceCheckout}
                      disabled={forcingCheckout}
                    >
                      {forcingCheckout ? (
                        <>
                          <div className="spinner spinner-sm"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          Mark Available (Force Checkout)
                        </>
                      )}
                    </button>
                  </div>

                  <div className="slot-detail-warning">
                    <svg fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>
                      Force checkout will immediately free this slot and mark the booking as
                      completed. Use only when necessary.
                    </span>
                  </div>
                </>
              ) : (
                <div className="slot-detail-empty">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p>This slot is currently available and ready for bookings.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SlotManagement;
