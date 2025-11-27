/**
 * CashPayment Component
 * Watchman component for recording cash payments
 * Features: QR scanning, payment recording, receipt generation, collection summary
 */

import React, { useState, useEffect, useCallback } from 'react';
import watchmanService from '../../services/watchmanService';
import '../../styles/Common.css';

/**
 * CashPayment Component
 */
const CashPayment = () => {
  // State management
  const [bookingId, setBookingId] = useState('');
  const [amount, setAmount] = useState('');
  const [scanning, setScanning] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [bookingDetails, setBookingDetails] = useState(null);
  const [receiptData, setReceiptData] = useState(null);
  const [error, setError] = useState(null);
  
  // Summary and recent payments
  const [todaySummary, setTodaySummary] = useState({
    totalCash: 0,
    paymentCount: 0,
    lastUpdated: new Date().toISOString()
  });
  const [recentPayments, setRecentPayments] = useState([]);

  /**
   * Fetch today's cash collection summary
   */
  const fetchTodaySummary = useCallback(async () => {
    try {
      const response = await watchmanService.getCashCollectionSummary();
      setTodaySummary(response.data || {
        totalCash: 0,
        paymentCount: 0,
        lastUpdated: new Date().toISOString()
      });
    } catch (err) {
      console.error('Error fetching summary:', err);
      // Use mock data
      setTodaySummary({
        totalCash: 2500,
        paymentCount: 8,
        lastUpdated: new Date().toISOString()
      });
    }
  }, []);

  /**
   * Fetch recent cash payments
   */
  const fetchRecentPayments = useCallback(async () => {
    try {
      const response = await watchmanService.getRecentCashPayments();
      setRecentPayments((response.data || []).slice(0, 5));
    } catch (err) {
      console.error('Error fetching recent payments:', err);
      // Use mock data
      setRecentPayments(generateMockRecentPayments());
    }
  }, []);

  /**
   * Generate mock recent payments
   */
  const generateMockRecentPayments = () => {
    const vehicles = ['MH12AB1234', 'KA05CD5678', 'DL08EF9012', 'TN09GH3456', 'AP01IJ7890'];
    const now = new Date();
    
    return vehicles.slice(0, 3).map((vehicle, index) => ({
      id: `BK${1000 + index}`,
      booking_id: `BK${1000 + index}`,
      amount: (index + 1) * 50,
      vehicle_number: vehicle,
      payment_time: new Date(now - (index + 1) * 30 * 60000).toISOString()
    }));
  };

  /**
   * Fetch data on mount
   */
  useEffect(() => {
    fetchTodaySummary();
    fetchRecentPayments();
  }, [fetchTodaySummary, fetchRecentPayments]);

  /**
   * Handle scan for payment
   */
  const handleScanForPayment = async (qrCodeData) => {
    setScanning(true);
    setError(null);

    try {
      // Fetch booking details
      const response = await watchmanService.getBookingByQR(qrCodeData || bookingId);
      const booking = response.data;

      setBookingDetails(booking);
      setBookingId(booking.id || booking.booking_id);
      
      // Auto-fill amount if available
      if (booking.amount && booking.amount > 0) {
        setAmount(booking.amount.toString());
      }
    } catch (err) {
      console.error('Error fetching booking:', err);
      setError(
        err.response?.data?.message || 
        'Booking not found. Please check the ID and try again.'
      );
    } finally {
      setScanning(false);
    }
  };

  /**
   * Validate payment form
   */
  const validatePayment = () => {
    if (!bookingId.trim()) {
      setError('Please enter a booking ID');
      return false;
    }

    const amountNum = parseFloat(amount);
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount');
      return false;
    }

    return true;
  };

  /**
   * Handle record payment
   */
  const handleRecordPayment = async (e) => {
    e.preventDefault();

    // Validate
    if (!validatePayment()) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const response = await watchmanService.recordCashPayment({
        booking_id: bookingId.trim(),
        amount: parseFloat(amount)
      });

      const receipt = response.data;

      // Generate receipt data
      const receiptInfo = {
        receiptNumber: receipt.receipt_number || `RCP${Date.now()}`,
        dateTime: new Date().toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }),
        bookingId: bookingId,
        amount: parseFloat(amount),
        vehicleNumber: bookingDetails?.vehicle_number || 'N/A',
        userName: bookingDetails?.user_name || 'N/A',
        watchmanName: 'Watchman' // Get from auth context in production
      };

      setReceiptData(receiptInfo);
      setPaymentComplete(true);

      // Refresh summary and recent payments
      await fetchTodaySummary();
      await fetchRecentPayments();

      // Clear form after 3 seconds
      setTimeout(() => {
        handleNewPayment();
      }, 3000);
    } catch (err) {
      console.error('Error recording payment:', err);
      setError(
        err.response?.data?.message || 
        'Failed to record payment. Please try again.'
      );
    } finally {
      setProcessing(false);
    }
  };

  /**
   * Handle print receipt
   */
  const handlePrintReceipt = () => {
    window.print();
  };

  /**
   * Handle new payment
   */
  const handleNewPayment = () => {
    setBookingId('');
    setAmount('');
    setBookingDetails(null);
    setPaymentComplete(false);
    setReceiptData(null);
    setError(null);
  };

  /**
   * Handle manual booking ID input
   */
  const handleBookingIdChange = (e) => {
    setBookingId(e.target.value);
    setError(null);
  };

  /**
   * Handle amount input
   */
  const handleAmountChange = (e) => {
    const value = e.target.value;
    // Allow only numbers and decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
      setError(null);
    }
  };

  /**
   * Format currency
   */
  const formatCurrency = (value) => {
    return `₹${parseFloat(value).toLocaleString('en-IN')}`;
  };

  /**
   * Format time ago
   */
  const formatTimeAgo = (dateTime) => {
    if (!dateTime) return 'N/A';
    
    try {
      const date = new Date(dateTime);
      const now = new Date();
      const diffMs = now - date;
      const minutes = Math.floor(diffMs / 60000);
      
      if (minutes < 1) return 'Just now';
      if (minutes < 60) return `${minutes}m ago`;
      
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h ago`;
      
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return 'N/A';
    }
  };

  // Payment complete screen with receipt
  if (paymentComplete && receiptData) {
    return (
      <div className="cash-payment-container payment-success-view">
        {/* Success Animation */}
        <div className="payment-success-animation">
          <div className="success-checkmark-large">
            <svg viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#10b981"
                strokeWidth="4"
                className="success-circle"
              />
              <path
                d="M25 50 L40 65 L75 35"
                fill="none"
                stroke="#10b981"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="success-check"
              />
            </svg>
          </div>
          <h2 className="success-message">Payment Recorded Successfully!</h2>
        </div>

        {/* Receipt Preview */}
        <div className="receipt-preview" id="receipt-print">
          <div className="receipt-header">
            <h3>PAYMENT RECEIPT</h3>
            <div className="receipt-number">#{receiptData.receiptNumber}</div>
          </div>

          <div className="receipt-body">
            <div className="receipt-row">
              <span className="receipt-label">Date & Time:</span>
              <span className="receipt-value">{receiptData.dateTime}</span>
            </div>
            <div className="receipt-row">
              <span className="receipt-label">Booking ID:</span>
              <span className="receipt-value">{receiptData.bookingId}</span>
            </div>
            <div className="receipt-row">
              <span className="receipt-label">Vehicle:</span>
              <span className="receipt-value">{receiptData.vehicleNumber}</span>
            </div>
            <div className="receipt-row">
              <span className="receipt-label">User Name:</span>
              <span className="receipt-value">{receiptData.userName}</span>
            </div>
            <div className="receipt-divider"></div>
            <div className="receipt-row receipt-amount-row">
              <span className="receipt-label">Amount Received:</span>
              <span className="receipt-amount">{formatCurrency(receiptData.amount)}</span>
            </div>
            <div className="receipt-divider"></div>
            <div className="receipt-row">
              <span className="receipt-label">Collected By:</span>
              <span className="receipt-value">{receiptData.watchmanName}</span>
            </div>
            <div className="receipt-row">
              <span className="receipt-label">Payment Method:</span>
              <span className="receipt-value">Cash</span>
            </div>
          </div>

          <div className="receipt-footer">
            <p>Thank you for using ParkMitra!</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="receipt-actions">
          <button className="btn btn-secondary btn-lg" onClick={handlePrintReceipt}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              />
            </svg>
            Print Receipt
          </button>
          <button className="btn btn-primary btn-lg" onClick={handleNewPayment}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            New Payment
          </button>
        </div>
      </div>
    );
  }

  // Main payment form
  return (
    <div className="cash-payment-container">
      {/* Header */}
      <div className="cash-payment-header">
        <div className="header-left">
          <h2 className="page-title">Cash Payment</h2>
          <p className="page-subtitle">Record cash payments from visitors</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => handleScanForPayment()}
          disabled={scanning}
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
            />
          </svg>
          {scanning ? 'Scanning...' : 'Scan QR'}
        </button>
      </div>

      {/* Today's Summary */}
      <div className="summary-cards">
        <div className="summary-card summary-card-primary">
          <div className="summary-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="summary-content">
            <div className="summary-value">{formatCurrency(todaySummary.totalCash)}</div>
            <div className="summary-label">Total Cash Collected</div>
          </div>
        </div>

        <div className="summary-card summary-card-success">
          <div className="summary-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
          </div>
          <div className="summary-content">
            <div className="summary-value">{todaySummary.paymentCount}</div>
            <div className="summary-label">Cash Payments Today</div>
          </div>
        </div>

        <div className="summary-card summary-card-info">
          <div className="summary-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="summary-content">
            <div className="summary-value summary-value-sm">
              {formatTimeAgo(todaySummary.lastUpdated)}
            </div>
            <div className="summary-label">Last Updated</div>
          </div>
        </div>
      </div>

      {/* Payment Form */}
      <div className="payment-form-section">
        <form onSubmit={handleRecordPayment} className="payment-form-card">
          <h3 className="form-section-title">Record Payment</h3>

          {/* Booking ID Input */}
          <div className="form-group">
            <label htmlFor="bookingId" className="form-label">
              Booking ID <span className="required">*</span>
            </label>
            <div className="input-with-button">
              <input
                type="text"
                id="bookingId"
                className="form-input form-input-lg"
                placeholder="Enter or scan booking ID"
                value={bookingId}
                onChange={handleBookingIdChange}
                disabled={processing || scanning}
              />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => handleScanForPayment()}
                disabled={processing || scanning || !bookingId.trim()}
              >
                {scanning ? 'Loading...' : 'Fetch'}
              </button>
            </div>
          </div>

          {/* Booking Details (if found) */}
          {bookingDetails && (
            <div className="booking-details-card">
              <div className="booking-detail-row">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span className="booking-label">User:</span>
                <span className="booking-value">{bookingDetails.user_name || 'N/A'}</span>
              </div>
              <div className="booking-detail-row">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                  />
                </svg>
                <span className="booking-label">Vehicle:</span>
                <span className="booking-value">{bookingDetails.vehicle_number || 'N/A'}</span>
              </div>
            </div>
          )}

          {/* Amount Input */}
          <div className="form-group">
            <label htmlFor="amount" className="form-label">
              Amount (₹) <span className="required">*</span>
            </label>
            <div className="amount-input-wrapper">
              <span className="amount-currency">₹</span>
              <input
                type="text"
                id="amount"
                className="form-input form-input-lg amount-input"
                placeholder="0.00"
                value={amount}
                onChange={handleAmountChange}
                disabled={processing}
              />
            </div>
            {amount && parseFloat(amount) > 0 && (
              <div className="amount-preview">
                Amount: {formatCurrency(amount)}
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-banner">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary btn-lg btn-block"
            disabled={processing || !bookingId.trim() || !amount}
          >
            {processing ? (
              <>
                <div className="spinner spinner-sm"></div>
                Recording Payment...
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
                Record Payment
              </>
            )}
          </button>
        </form>
      </div>

      {/* Recent Cash Payments */}
      <div className="recent-payments-section">
        <h3 className="section-title">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Recent Cash Payments
        </h3>

        {recentPayments.length === 0 ? (
          <div className="empty-state empty-state-sm">
            <p>No recent cash payments</p>
          </div>
        ) : (
          <div className="recent-payments-list">
            {recentPayments.map((payment, index) => (
              <div key={index} className="payment-list-item">
                <div className="payment-item-left">
                  <div className="payment-item-time">{formatTimeAgo(payment.payment_time)}</div>
                  <div className="payment-item-details">
                    <span className="payment-booking-id">#{payment.booking_id}</span>
                    <span className="payment-vehicle">{payment.vehicle_number}</span>
                  </div>
                </div>
                <div className="payment-item-amount">{formatCurrency(payment.amount)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CashPayment;
