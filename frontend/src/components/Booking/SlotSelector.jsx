/**
 * SlotSelector Component
 * Interactive parking slot selection with visual grid
 * Features: status filtering, real-time availability, responsive grid
 */

import React, { useState, useEffect } from 'react';
import '../../styles/Booking.css';

/**
 * SlotSelector Component
 * @param {Object} props
 * @param {number} props.organizationId - Organization ID
 * @param {number} props.totalSlots - Total number of parking slots
 * @param {number} props.availableSlots - Number of available slots
 * @param {Function} props.onSlotSelect - Callback when slot is selected
 * @param {number} props.selectedSlot - Currently selected slot number
 */
const SlotSelector = ({
  organizationId,
  totalSlots,
  availableSlots,
  onSlotSelect,
  selectedSlot
}) => {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [hoveredSlot, setHoveredSlot] = useState(null);

  /**
   * Fetch real slot data from API
   */
  useEffect(() => {
    const fetchSlotStatus = async () => {
      setLoading(true);

      try {
        // Fetch actual slot data from backend API
        const token = localStorage.getItem('token');
        const response = await fetch(
          `http://localhost:5000/api/bookings/available-slots?organizationId=${organizationId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch slots');
        }

        const result = await response.json();
        
        if (result.success && result.data) {
          // Map API data to slot format
          const apiSlots = result.data.map(slot => ({
            id: slot.id,
            number: parseInt(slot.slot_number.split('-').pop()) || slot.id,
            slotNumber: slot.slot_number,
            status: slot.current_status || 'available',
            currentUser: slot.occupied_by_vehicle || null,
            floorLevel: slot.floor_level,
            slotType: slot.slot_type
          }));

          // Sort by slot number
          apiSlots.sort((a, b) => a.number - b.number);
          setSlots(apiSlots);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (error) {
        console.error('Error fetching slot status:', error);
        // Generate default available slots on error
        const defaultSlots = Array.from({ length: totalSlots }, (_, i) => ({
          number: i + 1,
          status: 'available',
          currentUser: null
        }));
        setSlots(defaultSlots);
      } finally {
        setLoading(false);
      }
    };

    if (organizationId && totalSlots > 0) {
      fetchSlotStatus();
      
      // Refresh slot data every 30 seconds for real-time updates
      const intervalId = setInterval(fetchSlotStatus, 30000);
      
      return () => clearInterval(intervalId);
    }
  }, [organizationId, totalSlots]);

  /**
   * Handle slot click
   * @param {Object} slot - Slot object
   */
  const handleSlotClick = (slot) => {
    if (slot.status === 'available' || slot.status === 'reserved') {
      onSlotSelect(slot.number);
    }
  };

  /**
   * Filter slots based on selected filter
   * @returns {Array} Filtered slots
   */
  const filterSlots = () => {
    switch (filter) {
      case 'available':
        return slots.filter(slot => slot.status === 'available' || slot.status === 'reserved');
      case 'occupied':
        return slots.filter(slot => slot.status === 'occupied');
      default:
        return slots;
    }
  };

  /**
   * Get slot CSS class based on status
   * @param {Object} slot - Slot object
   * @returns {string} CSS class names
   */
  const getSlotClass = (slot) => {
    const classes = ['slot-box'];
    
    classes.push(`slot-${slot.status}`);
    
    if (slot.number === selectedSlot) {
      classes.push('slot-selected');
    }
    
    if (slot.status === 'occupied') {
      classes.push('slot-disabled');
    }

    return classes.join(' ');
  };

  /**
   * Get filter button class
   * @param {string} filterType - Filter type
   * @returns {string} CSS class names
   */
  const getFilterClass = (filterType) => {
    return `filter-btn ${filter === filterType ? 'filter-active' : ''}`;
  };

  const filteredSlots = filterSlots();
  const occupiedCount = slots.filter(s => s.status === 'occupied').length;

  if (loading) {
    return (
      <div className="slot-selector-container">
        <div className="loading-slots">
          <div className="spinner"></div>
          <p>Loading parking slots...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="slot-selector-container">
      {/* Header Section */}
      <div className="slot-selector-header">
        <div className="slot-header-info">
          <h3 className="slot-title">Select Parking Slot</h3>
          <div className="slot-stats">
            <span className="stat-available">
              Available: <strong>{availableSlots}</strong>
            </span>
            <span className="stat-divider">/</span>
            <span className="stat-total">
              Total: <strong>{totalSlots}</strong>
            </span>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="slot-filters">
          <button
            className={getFilterClass('all')}
            onClick={() => setFilter('all')}
          >
            All ({slots.length})
          </button>
          <button
            className={getFilterClass('available')}
            onClick={() => setFilter('available')}
          >
            Available ({availableSlots})
          </button>
          <button
            className={getFilterClass('occupied')}
            onClick={() => setFilter('occupied')}
          >
            Occupied ({occupiedCount})
          </button>
        </div>
      </div>

      {/* Slot Grid */}
      {filteredSlots.length > 0 ? (
        <div className="slot-grid">
          {filteredSlots.map((slot) => (
            <div
              key={slot.number}
              className={getSlotClass(slot)}
              onClick={() => handleSlotClick(slot)}
              onMouseEnter={() => setHoveredSlot(slot.number)}
              onMouseLeave={() => setHoveredSlot(null)}
              title={
                slot.status === 'occupied'
                  ? `Occupied${slot.currentUser ? ' by ' + slot.currentUser : ''}`
                  : slot.status === 'reserved'
                  ? 'Reserved - Available for booking'
                  : 'Available'
              }
            >
              <div className="slot-number">{slot.number}</div>
              <div className="slot-status-indicator">
                {slot.status === 'available' && (
                  <svg className="status-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
                {slot.status === 'occupied' && (
                  <svg className="status-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                )}
                {slot.status === 'reserved' && (
                  <svg className="status-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              
              {/* Tooltip for hovered slot */}
              {hoveredSlot === slot.number && (
                <div className="slot-tooltip">
                  {slot.status === 'available' && 'Click to select'}
                  {slot.status === 'reserved' && 'Reserved - Click to book'}
                  {slot.status === 'occupied' && (
                    <>
                      Occupied
                      {slot.currentUser && (
                        <span className="tooltip-user"> by {slot.currentUser}</span>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-slots">
          <svg className="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <p>No slots found matching the selected filter</p>
          <button className="btn btn-secondary" onClick={() => setFilter('all')}>
            Show All Slots
          </button>
        </div>
      )}

      {/* Legend */}
      <div className="slot-legend">
        <h4 className="legend-title">Legend</h4>
        <div className="legend-items">
          <div className="legend-item">
            <div className="legend-box legend-available"></div>
            <span>Available</span>
          </div>
          <div className="legend-item">
            <div className="legend-box legend-occupied"></div>
            <span>Occupied</span>
          </div>
          <div className="legend-item">
            <div className="legend-box legend-reserved"></div>
            <span>Reserved</span>
          </div>
          <div className="legend-item">
            <div className="legend-box legend-selected"></div>
            <span>Selected</span>
          </div>
        </div>
      </div>

      {/* Selected Slot Info */}
      {selectedSlot && (
        <div className="selected-slot-info">
          <svg className="info-icon" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <span>
            You have selected slot <strong>#{selectedSlot}</strong>
          </span>
        </div>
      )}
    </div>
  );
};

export default SlotSelector;
