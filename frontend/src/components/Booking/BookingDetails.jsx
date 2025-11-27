/**
 * BookingDetails Component
 * Detailed view of a single booking with QR code, timeline, and actions
 * Features: QR display, status timeline, cancellation, download functionality
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import bookingService from '../../services/bookingService';
import LoadingSpinner from '../Common/LoadingSpinner';
import ErrorMessage from '../Common/ErrorMessage';
import '../../styles/Booking.css';

/**
 * BookingDetails Component
 * Displays comprehensive booking information with QR code and actions
 */
const BookingDetails = () => {
  const { id } = useParams(); // Changed from bookingId to id to match route
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch booking details on component mount
   */
  useEffect(() => {
    const fetchBookingDetails = async () => {
      console.log('🔍 BookingDetails: Fetching booking ID:', id);
      setLoading(true);
      setError(null);

      try {
        const data = await bookingService.getBookingById(id);
        console.log('✅ BookingDetails: Received data:', data);
        console.log('📋 BookingDetails: Data type:', typeof data);
        console.log('📋 BookingDetails: Data is null?', data === null);
        console.log('📋 BookingDetails: Data is undefined?', data === undefined);
        console.log('📋 BookingDetails: Data keys:', Object.keys(data || {}));
        
        if (!data) {
          console.error('⚠️ BookingDetails: Data is null/undefined, setting error');
          setError('Booking not found');
        } else {
          console.log('✅ BookingDetails: Setting booking state');
          setBooking(data);
        }
      } catch (err) {
        console.error('❌ BookingDetails: Error fetching booking:', err);
        console.error('❌ BookingDetails: Error message:', err.message);
        setError(err.message || 'Failed to load booking details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchBookingDetails();
    }
  }, [id]);

  /**
   * Handle booking cancellation
   */
  const handleCancelBooking = async () => {
    setCancelling(true);

    try {
      await bookingService.updateBookingStatus(id, 'cancelled');
      alert('Booking cancelled successfully');
      navigate('/my-bookings');
    } catch (err) {
      console.error('Error cancelling booking:', err);
      alert('Failed to cancel booking. Please try again.');
    } finally {
      setCancelling(false);
      setShowCancelModal(false);
    }
  };

  /**
   * Download QR code as image
   */
  const handleDownloadQR = () => {
    if (!booking || !booking.qr_code_data) {
      alert('QR code not available');
      return;
    }

    // Create a temporary link element
    const link = document.createElement('a');
    link.href = booking.qr_code_data;
    link.download = `parking-qr-${booking.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /**
   * Share QR code
   */
  const handleShareQR = async () => {
    if (!booking || !booking.qr_code_data) {
      alert('QR code not available');
      return;
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'ParkMitra Booking',
          text: `Parking Booking #${booking.booking_id}`,
          url: window.location.href
        });
      } catch (err) {
        // Sharing cancelled or failed - silent fail is acceptable
      }
    } else {
      // Fallback: copy link to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Booking link copied to clipboard!');
    }
  };

  /**
   * Navigate back to bookings list
   */
  const handleBack = () => {
    navigate('/my-bookings');
  };

  /**
   * Get status badge class
   */
  const getStatusClass = (status) => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
      case 'active':
      case 'confirmed':
        return 'badge badge-success';
      case 'completed':
        return 'badge badge-secondary';
      case 'cancelled':
        return 'badge badge-danger';
      case 'pending':
        return 'badge badge-warning';
      default:
        return 'badge';
    }
  };

  /**
   * Format date and time
   */
  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'N/A';
    const date = new Date(dateTime);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  /**
   * Format time only
   */
  const formatTime = (dateTime) => {
    if (!dateTime) return 'N/A';
    const date = new Date(dateTime);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  /**
   * Calculate duration
   */
  const calculateDuration = () => {
    if (!booking || !booking.booking_start_time || !booking.booking_end_time) return 'N/A';
    const start = new Date(booking.booking_start_time);
    const end = new Date(booking.booking_end_time);
    const hours = Math.abs(end - start) / 36e5;
    return `${hours.toFixed(1)} hours`;
  };

  // Loading state
  if (loading) {
    return (
      <div className="booking-details-container">
        <LoadingSpinner message="Loading booking details..." />
      </div>
    );
  }

  // Error state
  if (error) {
    console.log('❌ BookingDetails: Showing error state:', error);
    return (
      <div className="booking-details-container">
        <ErrorMessage message={error} />
        <button className="btn btn-primary mt-3" onClick={handleBack}>
          Back to Bookings
        </button>
      </div>
    );
  }

  // Still loading or no booking data
  if (!booking) {
    console.log('⚠️ BookingDetails: No booking data, loading:', loading);
    return (
      <div className="booking-details-container">
        <LoadingSpinner message="Loading booking details..." />
      </div>
    );
  }

  const canCancel = ['active', 'confirmed', 'pending'].includes(booking.booking_status?.toLowerCase());

  return (
    <div className="booking-details-container">
      {/* Page Header */}
      <div className="booking-details-header">
        <button className="btn-back" onClick={handleBack}>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>
        <div className="header-info">
          <h2 className="booking-id">Booking #{booking.id}</h2>
          <span className={getStatusClass(booking.booking_status)}>{booking.booking_status}</span>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="booking-details-grid">
        {/* Left Column */}
        <div className="booking-details-left">
          {/* QR Code Section */}
          <div className="card qr-code-card">
            <h3 className="card-title">Your QR Code</h3>
            <div className="qr-code-display">
              {booking.qr_code_data ? (
                <img src={booking.qr_code_data} alt="Booking QR Code" className="qr-image" />
              ) : (
                <div className="qr-placeholder">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                  <p>QR Code not available</p>
                </div>
              )}
            </div>
            <p className="qr-instruction">
              <svg className="instruction-icon" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Show this QR code at entry and exit
            </p>
            <div className="qr-actions">
              <button className="btn btn-primary" onClick={handleDownloadQR} disabled={!booking.qr_code_data}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download
              </button>
              <button className="btn btn-secondary" onClick={handleShareQR}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share
              </button>
            </div>
          </div>

          {/* Booking Information Card */}
          <div className="card booking-info-card">
            <h3 className="card-title">Booking Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Organization</span>
                <span className="info-value">{booking.org_name || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Location</span>
                <span className="info-value">{booking.org_address || 'N/A'}</span>
              </div>
              <div className="info-item info-prominent">
                <span className="info-label">Parking Slot</span>
                <span className="info-value info-slot">
                  {booking.slot_number || 'N/A'}
                  {booking.parking_lot_name && (
                    <span className="text-xs text-gray-500 block mt-1">
                      @ {booking.parking_lot_name}
                    </span>
                  )}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Vehicle Number</span>
                <span className="info-value">{booking.vehicle_number || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Booking Date</span>
                <span className="info-value">{formatDateTime(booking.created_at)}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Start Time</span>
                <span className="info-value">{formatTime(booking.booking_start_time)}</span>
              </div>
              <div className="info-item">
                <span className="info-label">End Time</span>
                <span className="info-value">{formatTime(booking.booking_end_time)}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Duration</span>
                <span className="info-value">{calculateDuration()}</span>
              </div>
              <div className="info-item info-prominent">
                <span className="info-label">Amount</span>
                <span className="info-value info-amount">
                  {booking.amount ? `₹${parseFloat(booking.amount).toFixed(2)}` : 'FREE'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="booking-details-right">
          {/* Timeline/Status Card */}
          <div className="card timeline-card">
            <h3 className="card-title">Status Timeline</h3>
            <div className="timeline">
              <div className="timeline-item completed">
                <div className="timeline-marker"></div>
                <div className="timeline-content">
                  <h4>Booking Created</h4>
                  <p>{formatDateTime(booking.booking_date)}</p>
                </div>
              </div>
              <div className={`timeline-item ${booking.payment_status === 'paid' ? 'completed' : 'pending'}`}>
                <div className="timeline-marker"></div>
                <div className="timeline-content">
                  <h4>Payment {booking.payment_status === 'paid' ? 'Completed' : 'Pending'}</h4>
                  <p>{booking.payment_status === 'paid' ? 'Payment received' : 'Awaiting payment'}</p>
                </div>
              </div>
              <div className={`timeline-item ${booking.entry_time ? 'completed' : 'pending'}`}>
                <div className="timeline-marker"></div>
                <div className="timeline-content">
                  <h4>Entry {booking.entry_time ? 'Completed' : 'Pending'}</h4>
                  <p>{booking.entry_time ? formatDateTime(booking.entry_time) : 'Not checked in yet'}</p>
                </div>
              </div>
              <div className={`timeline-item ${booking.exit_time ? 'completed' : 'pending'}`}>
                <div className="timeline-marker"></div>
                <div className="timeline-content">
                  <h4>Exit {booking.exit_time ? 'Completed' : 'Pending'}</h4>
                  <p>{booking.exit_time ? formatDateTime(booking.exit_time) : 'Not checked out yet'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions Card */}
          <div className="card actions-card">
            <h3 className="card-title">Actions</h3>
            <div className="action-buttons">
              {canCancel && (
                <button
                  className="btn btn-danger btn-block"
                  onClick={() => setShowCancelModal(true)}
                  disabled={cancelling}
                >
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  {cancelling ? 'Cancelling...' : 'Cancel Booking'}
                </button>
              )}
              <button className="btn btn-secondary btn-block" disabled title="Coming soon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Extend Booking
              </button>
              <button className="btn btn-outline btn-block">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Report Issue
              </button>
              <button className="btn btn-outline btn-block">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Contact Support
              </button>
            </div>
          </div>

          {/* Important Information */}
          <div className="card info-card">
            <h3 className="card-title">Important Information</h3>
            <div className="important-info">
              <div className="info-section">
                <h4>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Parking Rules
                </h4>
                <ul>
                  <li>Display QR code at entry/exit</li>
                  <li>Park only in your assigned slot</li>
                  <li>Keep vehicle locked and secure</li>
                  <li>Exit before booking end time</li>
                </ul>
              </div>
              <div className="info-section">
                <h4>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Entry Instructions
                </h4>
                <ul>
                  <li>Show QR code to watchman</li>
                  <li>Follow parking signage</li>
                  <li>Note your slot number</li>
                  <li>Keep booking details handy</li>
                </ul>
              </div>
              <div className="info-section">
                <h4>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Contact Details
                </h4>
                <p>For assistance, contact:</p>
                <p><strong>Support:</strong> +91 1234567890</p>
                <p><strong>Email:</strong> support@parkmitra.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="modal-overlay" onClick={() => setShowCancelModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Cancel Booking</h3>
              <button className="modal-close" onClick={() => setShowCancelModal(false)}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="warning-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p>Are you sure you want to cancel this booking?</p>
              <p className="warning-text">This action cannot be undone. Cancellation charges may apply.</p>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowCancelModal(false)}
                disabled={cancelling}
              >
                Keep Booking
              </button>
              <button
                className="btn btn-danger"
                onClick={handleCancelBooking}
                disabled={cancelling}
              >
                {cancelling ? 'Cancelling...' : 'Yes, Cancel Booking'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingDetails;
