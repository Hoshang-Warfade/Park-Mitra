/**
 * ScanInterface Component
 * Watchman interface for scanning QR codes and verifying entry/exit
 * Features: QR scanning, manual entry, verification, success/error states
 */

import React, { useState } from 'react';
import QRCodeScanner from '../QRCode/QRCodeScanner';
import watchmanService from '../../services/watchmanService';
import '../../styles/Common.css';

/**
 * ScanInterface Component
 * @param {Object} props
 * @param {Function} props.onEntryVerified - Callback when entry is verified
 * @param {Function} props.onExitVerified - Callback when exit is verified
 */
const ScanInterface = ({ onEntryVerified, onExitVerified }) => {
  // State management
  const [scanning, setScanning] = useState(true);
  const [bookingDetails, setBookingDetails] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState(null);
  const [manualInput, setManualInput] = useState(false);
  const [bookingId, setBookingId] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [recentScans, setRecentScans] = useState([]);

  /**
   * Handle QR scan
   */
  const handleScan = async (qrCodeData) => {
    setVerifying(true);
    setError(null);

    try {
      // Call watchman service to scan QR
      const response = await watchmanService.scanQR(qrCodeData);
      const booking = response.data;

      setBookingDetails(booking);
      setScanning(false);

      // Add to recent scans
      addToRecentScans(booking);
    } catch (err) {
      console.error('Error scanning QR code:', err);
      setError(
        err.response?.data?.message || 
        'Invalid QR code or booking not found. Please try again.'
      );
      
      // Play error sound (optional)
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200]); // Error vibration pattern
      }
    } finally {
      setVerifying(false);
    }
  };

  /**
   * Add to recent scans list
   */
  const addToRecentScans = (booking) => {
    const scan = {
      id: booking.id,
      vehicle: booking.vehicle_number,
      time: new Date().toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      type: booking.user_type
    };

    setRecentScans(prev => {
      const updated = [scan, ...prev.filter(s => s.id !== booking.id)];
      return updated.slice(0, 3); // Keep only last 3
    });
  };

  /**
   * Handle verify entry
   */
  const handleVerifyEntry = async () => {
    if (!bookingDetails) return;

    setVerifying(true);
    setError(null);

    try {
      await watchmanService.verifyEntry(bookingDetails.id);

      // Success feedback
      setSuccessMessage('Entry Verified Successfully!');
      setShowSuccess(true);

      // Play success sound/vibrate
      if (navigator.vibrate) {
        navigator.vibrate(200); // Success vibration
      }

      // Call callback
      if (onEntryVerified) {
        onEntryVerified(bookingDetails);
      }

      // Clear after 2 seconds
      setTimeout(() => {
        resetScanner();
      }, 2000);
    } catch (err) {
      console.error('Error verifying entry:', err);
      setError(
        err.response?.data?.message || 
        'Failed to verify entry. Please try again.'
      );
    } finally {
      setVerifying(false);
    }
  };

  /**
   * Handle verify exit
   */
  const handleVerifyExit = async () => {
    if (!bookingDetails) return;

    setVerifying(true);
    setError(null);

    try {
      const response = await watchmanService.verifyExit(bookingDetails.id);
      const exitData = response.data;

      // Success feedback with duration info
      const duration = exitData.duration || 'N/A';
      const payment = exitData.payment_status || 'Paid';
      
      setSuccessMessage(
        `Exit Verified Successfully!\nDuration: ${duration}\nPayment: ${payment}`
      );
      setShowSuccess(true);

      // Play success sound/vibrate
      if (navigator.vibrate) {
        navigator.vibrate(200);
      }

      // Call callback
      if (onExitVerified) {
        onExitVerified(bookingDetails, exitData);
      }

      // Clear after 2 seconds
      setTimeout(() => {
        resetScanner();
      }, 2000);
    } catch (err) {
      console.error('Error verifying exit:', err);
      setError(
        err.response?.data?.message || 
        'Failed to verify exit. Please try again.'
      );
    } finally {
      setVerifying(false);
    }
  };

  /**
   * Handle manual input
   */
  const handleManualInput = async () => {
    if (!bookingId.trim()) {
      setError('Please enter a booking ID');
      return;
    }

    // Scan with manual booking ID
    await handleScan(bookingId.trim());
  };

  /**
   * Toggle manual mode
   */
  const toggleManualMode = () => {
    setManualInput(!manualInput);
    setError(null);
    setBookingId('');
  };

  /**
   * Reset scanner
   */
  const resetScanner = () => {
    setScanning(true);
    setBookingDetails(null);
    setError(null);
    setShowSuccess(false);
    setSuccessMessage('');
    setBookingId('');
  };

  /**
   * Cancel and rescan
   */
  const handleCancel = () => {
    resetScanner();
  };

  /**
   * Get user initials
   */
  const getUserInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  /**
   * Format date time
   */
  const formatDateTime = (dateTime) => {
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

  // Success overlay
  if (showSuccess) {
    return (
      <div className="scan-interface scan-success-screen">
        <div className="success-animation">
          <div className="success-checkmark">
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
          <h2 className="success-title">{successMessage.split('\n')[0]}</h2>
          {successMessage.split('\n').slice(1).map((line, idx) => (
            <p key={idx} className="success-detail">{line}</p>
          ))}
        </div>
      </div>
    );
  }

  // Verification screen
  if (bookingDetails && !showSuccess) {
    const hasEntry = bookingDetails.entry_time || bookingDetails.status === 'checked-in';
    const canExit = hasEntry;
    const canEntry = !hasEntry && bookingDetails.status !== 'completed';

    return (
      <div className="scan-interface scan-verification-screen">
        {verifying && (
          <div className="verification-overlay">
            <div className="spinner spinner-lg"></div>
            <p>Verifying...</p>
          </div>
        )}

        <div className="verification-card">
          {/* User Info */}
          <div className="verification-header">
            <div className="user-avatar-large">
              {getUserInitials(bookingDetails.user_name)}
            </div>
            <h2 className="user-name-large">{bookingDetails.user_name || 'Unknown User'}</h2>
            <span className={`user-type-badge user-type-${bookingDetails.user_type || 'visitor'}`}>
              {bookingDetails.user_type === 'member' ? 'Member' : 'Visitor'}
            </span>
          </div>

          {/* Vehicle Number */}
          <div className="vehicle-display">
            <div className="vehicle-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                />
              </svg>
            </div>
            <div className="vehicle-number">{bookingDetails.vehicle_number}</div>
          </div>

          {/* Booking Details Grid */}
          <div className="booking-details-grid">
            <div className="detail-item">
              <div className="detail-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <div className="detail-content">
                <div className="detail-label">Organization</div>
                <div className="detail-value">{bookingDetails.organization_name || 'N/A'}</div>
              </div>
            </div>

            <div className="detail-item">
              <div className="detail-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <div className="detail-content">
                <div className="detail-label">Slot Number</div>
                <div className="detail-value">Slot {bookingDetails.slot_number || 'N/A'}</div>
              </div>
            </div>

            <div className="detail-item">
              <div className="detail-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div className="detail-content">
                <div className="detail-label">Booking Time</div>
                <div className="detail-value">{formatDateTime(bookingDetails.booking_time)}</div>
              </div>
            </div>

            <div className="detail-item">
              <div className="detail-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="detail-content">
                <div className="detail-label">Duration</div>
                <div className="detail-value">{bookingDetails.duration || 'N/A'}</div>
              </div>
            </div>
          </div>

          {/* Status Indicators */}
          <div className="status-indicators">
            <div className="status-indicator">
              <span className="status-label">Payment:</span>
              <span className={`status-badge status-${bookingDetails.payment_status || 'pending'}`}>
                {bookingDetails.payment_status === 'paid' ? 'Paid' : 
                 bookingDetails.user_type === 'member' ? 'Free (Member)' : 'Pending'}
              </span>
            </div>
            <div className="status-indicator">
              <span className="status-label">Entry:</span>
              <span className={`status-badge status-${hasEntry ? 'done' : 'pending'}`}>
                {hasEntry ? 'Checked In' : 'Not Checked In'}
              </span>
            </div>
            {bookingDetails.amount > 0 && (
              <div className="status-indicator">
                <span className="status-label">Amount:</span>
                <span className="status-badge status-amount">₹{bookingDetails.amount}</span>
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

          {/* Action Buttons */}
          <div className="verification-actions">
            {canEntry && (
              <button
                className="btn btn-verify btn-verify-entry"
                onClick={handleVerifyEntry}
                disabled={verifying}
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                  />
                </svg>
                Verify Entry
              </button>
            )}
            {canExit && (
              <button
                className="btn btn-verify btn-verify-exit"
                onClick={handleVerifyExit}
                disabled={verifying}
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Verify Exit
              </button>
            )}
            <button
              className="btn btn-secondary btn-cancel"
              onClick={handleCancel}
              disabled={verifying}
            >
              Cancel & Rescan
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main scanning interface
  return (
    <div className="scan-interface">
      {/* Header */}
      <div className="scan-header">
        <h1 className="scan-title">Scan QR Code</h1>
        <div className="manual-toggle">
          <label className="toggle-label">
            <span>Manual Entry</span>
            <input
              type="checkbox"
              checked={manualInput}
              onChange={toggleManualMode}
              className="toggle-checkbox"
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>

      {/* Scanner or Manual Input */}
      {!manualInput ? (
        <div className="scanner-section">
          <div className="scanner-frame">
            <QRCodeScanner
              onScan={handleScan}
              scanning={scanning}
              onError={(err) => setError(err.message)}
            />
          </div>
          <div className="scanner-instructions">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Align QR code within the frame</span>
          </div>

          {/* Recent Scans */}
          {recentScans.length > 0 && (
            <div className="recent-scans">
              <h3 className="recent-scans-title">Recent Scans</h3>
              <div className="recent-scans-list">
                {recentScans.map((scan, index) => (
                  <div key={index} className="recent-scan-item">
                    <div className="recent-scan-vehicle">{scan.vehicle}</div>
                    <div className="recent-scan-meta">
                      <span className={`recent-scan-type type-${scan.type}`}>
                        {scan.type === 'member' ? 'Member' : 'Visitor'}
                      </span>
                      <span className="recent-scan-time">{scan.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="manual-input-section">
          <div className="manual-input-card">
            <h2 className="manual-input-title">Enter Booking ID</h2>
            <input
              type="text"
              className="manual-input-field"
              placeholder="e.g., BK123456"
              value={bookingId}
              onChange={(e) => setBookingId(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleManualInput()}
              autoFocus
            />
            <button
              className="btn btn-primary btn-verify-manual"
              onClick={handleManualInput}
              disabled={verifying || !bookingId.trim()}
            >
              {verifying ? (
                <>
                  <div className="spinner spinner-sm"></div>
                  Verifying...
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
                  Verify
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="scan-error">
          <div className="error-icon">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <p className="error-message">{error}</p>
          <button className="btn btn-secondary" onClick={() => setError(null)}>
            Try Again
          </button>
        </div>
      )}

      {/* Verifying Overlay */}
      {verifying && !bookingDetails && (
        <div className="scan-verifying-overlay">
          <div className="spinner spinner-lg"></div>
          <p>Scanning QR Code...</p>
        </div>
      )}
    </div>
  );
};

export default ScanInterface;
