/**
 * PaymentSuccess Component
 * Payment confirmation screen with transaction details and celebration
 * Features: success animation, transaction summary, auto-redirect, confetti effect
 */

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../../styles/Payment.css';

/**
 * PaymentSuccess Component
 * Displays payment confirmation with booking details and celebratory elements
 */
const PaymentSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [countdown, setCountdown] = useState(5);
  const [showConfetti, setShowConfetti] = useState(true);

  /**
   * Initialize component and start countdown
   */
  useEffect(() => {
    // Get booking data from navigation state
    const bookingData = location.state?.booking;

    if (!bookingData) {
      // No booking data, redirect to dashboard
      navigate('/dashboard');
      return;
    }

    setBooking(bookingData);

    // Hide confetti after 5 seconds
    const confettiTimer = setTimeout(() => {
      setShowConfetti(false);
    }, 5000);

    // Countdown timer for auto-redirect
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          // Auto-redirect to booking details
          navigate(`/bookings/${bookingData.booking_id || bookingData.id}`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Cleanup timers
    return () => {
      clearTimeout(confettiTimer);
      clearInterval(countdownInterval);
    };
  }, [location.state, navigate]);

  /**
   * Copy transaction ID to clipboard
   */
  const handleCopyTransactionId = () => {
    if (booking?.transaction_id || booking?.payment_id) {
      const txnId = booking.transaction_id || booking.payment_id;
      navigator.clipboard.writeText(txnId);
      alert('Transaction ID copied to clipboard!');
    }
  };

  /**
   * Navigate to booking details
   */
  const handleViewBooking = () => {
    if (booking?.booking_id || booking?.id) {
      navigate(`/bookings/${booking.booking_id || booking.id}`);
    }
  };

  /**
   * Navigate to new booking
   */
  const handleBookAnother = () => {
    navigate('/organizations');
  };

  /**
   * Navigate to dashboard
   */
  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  /**
   * Format currency
   */
  const formatCurrency = (amount) => {
    if (!amount) return '₹0.00';
    return `₹${parseFloat(amount).toFixed(2)}`;
  };

  /**
   * Format date and time
   */
  const formatDateTime = (dateTime) => {
    if (!dateTime) {
      const now = new Date();
      return now.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
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
   * Get payment method display name
   */
  const getPaymentMethodName = (method) => {
    const methodLower = method?.toLowerCase();
    switch (methodLower) {
      case 'card':
      case 'credit_card':
      case 'debit_card':
        return 'Card Payment';
      case 'upi':
        return 'UPI';
      case 'netbanking':
      case 'net_banking':
        return 'Net Banking';
      case 'wallet':
        return 'Wallet';
      default:
        return method || 'Online Payment';
    }
  };

  if (!booking) {
    return null;
  }

  return (
    <div className="payment-success-container">
      {/* Confetti Animation (CSS-based) */}
      {showConfetti && (
        <div className="confetti-container">
          {[...Array(50)].map((_, index) => (
            <div
              key={index}
              className="confetti-piece"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][
                  Math.floor(Math.random() * 5)
                ]
              }}
            />
          ))}
        </div>
      )}

      <div className="payment-success-content">
        {/* Success Icon */}
        <div className="success-icon-wrapper">
          <div className="success-icon">
            <svg className="checkmark" viewBox="0 0 52 52">
              <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none" />
              <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
            </svg>
          </div>
        </div>

        {/* Success Message */}
        <h1 className="success-heading">Payment Successful!</h1>
        <p className="success-subheading">Your parking slot is confirmed</p>

        {/* Transaction Summary Card */}
        <div className="card transaction-summary">
          <h3 className="card-title">Transaction Summary</h3>
          <div className="transaction-details">
            <div className="transaction-row">
              <span className="transaction-label">Transaction ID</span>
              <div className="transaction-value-group">
                <span className="transaction-value transaction-id">
                  {booking.transaction_id || booking.payment_id || `TXN${Date.now()}`}
                </span>
                <button
                  className="copy-btn"
                  onClick={handleCopyTransactionId}
                  title="Copy to clipboard"
                >
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <div className="transaction-row highlight">
              <span className="transaction-label">Amount Paid</span>
              <span className="transaction-value amount-paid">
                {formatCurrency(booking.amount)}
              </span>
            </div>
            <div className="transaction-row">
              <span className="transaction-label">Payment Method</span>
              <span className="transaction-value">
                {getPaymentMethodName(booking.payment_method)}
              </span>
            </div>
            <div className="transaction-row">
              <span className="transaction-label">Date & Time</span>
              <span className="transaction-value">{formatDateTime(booking.payment_date)}</span>
            </div>
            <div className="transaction-row">
              <span className="transaction-label">Organization</span>
              <span className="transaction-value">{booking.organization_name || 'N/A'}</span>
            </div>
            <div className="transaction-row">
              <span className="transaction-label">Slot Number</span>
              <span className="transaction-value slot-number">
                #{booking.slot_number || 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Booking Details Preview */}
        <div className="card booking-preview">
          <h3 className="card-title">Booking Details</h3>
          <div className="booking-preview-grid">
            <div className="preview-item">
              <svg className="preview-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"
                />
              </svg>
              <div className="preview-content">
                <span className="preview-label">Vehicle Number</span>
                <span className="preview-value">{booking.vehicle_number || 'N/A'}</span>
              </div>
            </div>
            <div className="preview-item">
              <svg className="preview-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="preview-content">
                <span className="preview-label">Booking Time</span>
                <span className="preview-value">{formatDateTime(booking.start_time)}</span>
              </div>
            </div>
            <div className="preview-item">
              <svg className="preview-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
              <div className="preview-content">
                <span className="preview-label">Duration</span>
                <span className="preview-value">{booking.duration || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Confirmation Messages */}
        <div className="confirmation-messages">
          <div className="confirmation-item">
            <svg className="confirmation-icon" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>Payment processed successfully</span>
          </div>
          <div className="confirmation-item">
            <svg className="confirmation-icon" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>Booking confirmed</span>
          </div>
          <div className="confirmation-item">
            <svg className="confirmation-icon" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>QR code generated</span>
          </div>
          <div className="confirmation-item">
            <svg className="confirmation-icon" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>Confirmation sent to your email</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="success-actions">
          <button className="btn btn-primary btn-lg" onClick={handleViewBooking}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
              />
            </svg>
            View QR Code & Booking
          </button>
          <button className="btn btn-secondary" onClick={handleBookAnother}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Book Another Parking
          </button>
          <button className="btn btn-outline" onClick={handleGoToDashboard}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            Go to Dashboard
          </button>
        </div>

        {/* Auto-redirect Message */}
        <div className="auto-redirect-message">
          <svg className="redirect-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>Redirecting to your booking in {countdown} second{countdown !== 1 ? 's' : ''}...</span>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
