/**
 * BookingContext - Global booking state management
 * Manages booking flow, user bookings, and booking operations
 */

import React, { createContext, useState, useEffect, useContext } from 'react';
import bookingService from '../services/bookingService';

// Create BookingContext
export const BookingContext = createContext();

/**
 * BookingProvider Component
 * Provides booking state and operations to all child components
 */
export const BookingProvider = ({ children }) => {
  // State management
  const [currentBooking, setCurrentBooking] = useState(null);
  const [userBookings, setUserBookings] = useState([]);
  const [activeBookings, setActiveBookings] = useState([]);
  const [selectedOrganization, setSelectedOrganization] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load current booking from sessionStorage on mount
  useEffect(() => {
    const savedBooking = sessionStorage.getItem('currentBooking');
    if (savedBooking) {
      try {
        setCurrentBooking(JSON.parse(savedBooking));
      } catch (err) {
        console.error('Error loading saved booking:', err);
        sessionStorage.removeItem('currentBooking');
      }
    }
  }, []);

  /**
   * Start a new booking process
   * @param {Object} organization - Selected organization
   * @param {Object} bookingData - Initial booking data
   */
  const startBooking = (organization, bookingData = {}) => {
    const booking = {
      organization,
      ...bookingData,
      startedAt: new Date().toISOString()
    };
    
    setCurrentBooking(booking);
    setSelectedOrganization(organization);
    sessionStorage.setItem('currentBooking', JSON.stringify(booking));
  };

  /**
   * Complete the booking process
   * @param {Object} bookingResult - Completed booking with QR code
   */
  const completeBooking = (bookingResult) => {
    // Add to user bookings
    setUserBookings(prev => [bookingResult, ...prev]);
    
    // Add to active bookings if status is 'active' or 'confirmed'
    if (bookingResult.status === 'active' || bookingResult.status === 'confirmed') {
      setActiveBookings(prev => [bookingResult, ...prev]);
    }
    
    // Clear current booking
    setCurrentBooking(null);
    setSelectedOrganization(null);
    sessionStorage.removeItem('currentBooking');
  };

  /**
   * Fetch all bookings for a user
   * @param {number} userId - User ID
   */
  const fetchUserBookings = async (userId) => {
    if (!userId) {
      setError('User ID is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const bookings = await bookingService.getUserBookings(userId);
      setUserBookings(bookings);
      
      // Filter active bookings (status: active, confirmed, or checked-in)
      const active = bookings.filter(booking => 
        ['active', 'confirmed', 'checked-in'].includes(booking.status?.toLowerCase())
      );
      setActiveBookings(active);
    } catch (err) {
      console.error('Error fetching user bookings:', err);
      setError(err.message || 'Failed to fetch bookings');
      setUserBookings([]);
      setActiveBookings([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cancel a booking
   * @param {number} bookingId - Booking ID to cancel
   */
  const cancelBooking = async (bookingId) => {
    if (!bookingId) {
      setError('Booking ID is required');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      // Update booking status to 'cancelled'
      await bookingService.updateBookingStatus(bookingId, 'cancelled');
      
      // Remove from active bookings
      setActiveBookings(prev => 
        prev.filter(booking => booking.id !== bookingId)
      );
      
      // Update status in user bookings
      setUserBookings(prev =>
        prev.map(booking =>
          booking.id === bookingId
            ? { ...booking, status: 'cancelled' }
            : booking
        )
      );

      return true;
    } catch (err) {
      console.error('Error cancelling booking:', err);
      setError(err.message || 'Failed to cancel booking');
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Clear current booking in progress
   */
  const clearCurrentBooking = () => {
    setCurrentBooking(null);
    setSelectedOrganization(null);
    sessionStorage.removeItem('currentBooking');
  };

  /**
   * Update current booking data
   * @param {Object} updates - Partial booking data to update
   */
  const updateCurrentBooking = (updates) => {
    if (!currentBooking) return;
    
    const updatedBooking = { ...currentBooking, ...updates };
    setCurrentBooking(updatedBooking);
    sessionStorage.setItem('currentBooking', JSON.stringify(updatedBooking));
  };

  /**
   * Get booking by ID from user bookings
   * @param {number} bookingId - Booking ID
   * @returns {Object|null} Booking object or null
   */
  const getBookingById = (bookingId) => {
    return userBookings.find(booking => booking.id === bookingId) || null;
  };

  /**
   * Check if user has active bookings
   * @returns {boolean}
   */
  const hasActiveBookings = () => {
    return activeBookings.length > 0;
  };

  // Context value
  const value = {
    // State
    currentBooking,
    userBookings,
    activeBookings,
    selectedOrganization,
    loading,
    error,
    
    // Actions
    startBooking,
    completeBooking,
    fetchUserBookings,
    cancelBooking,
    clearCurrentBooking,
    updateCurrentBooking,
    
    // Utilities
    getBookingById,
    hasActiveBookings
  };

  return (
    <BookingContext.Provider value={value}>
      {children}
    </BookingContext.Provider>
  );
};

/**
 * Custom hook to use BookingContext
 * @returns {Object} Booking context value
 * @throws {Error} If used outside BookingProvider
 */
export const useBooking = () => {
  const context = useContext(BookingContext);
  
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  
  return context;
};
