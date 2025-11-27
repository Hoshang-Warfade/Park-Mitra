import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import bookingService from '../../services/bookingService';
import {
  FaCheckCircle,
  FaDownload,
  FaShare,
  FaPrint,
  FaCopy,
  FaClock,
  FaBuilding,
  FaMapMarkerAlt,
  FaParking,
  FaCar,
  FaCalendarAlt,
  FaRupeeSign,
  FaShieldAlt,
  FaExclamationCircle,
  FaInfoCircle,
  FaPhone,
  FaEnvelope,
  FaSms,
  FaArrowLeft,
  FaPlus,
  FaTimesCircle,
  FaSpinner
} from 'react-icons/fa';

/**
 * QRCodeDisplay Component
 * Booking confirmation with QR code display and management
 */
const QRCodeDisplay = () => {
  const { id } = useParams(); // Changed from bookingId to id to match route
  const navigate = useNavigate();
  const location = useLocation();
  const qrRef = useRef(null);

  // Component state
  const [booking, setBooking] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  /**
   * Fetch booking details
   */
  useEffect(() => {
    const fetchBooking = async () => {
      // Check if booking was passed via route state
      if (location.state?.booking) {
        setBooking(location.state.booking);
        setLoading(false);
        return;
      }

      // Otherwise fetch by ID
      if (!id) {
        console.log('⚠️ QRCodeDisplay: No booking ID provided, redirecting to my-bookings');
        navigate('/my-bookings');
        return;
      }

      try {
        // Auto-expire bookings first
        try {
          await bookingService.autoExpireBookings();
        } catch (error) {
          console.error('Error auto-expiring bookings:', error);
        }
        
        console.log('🔍 QRCodeDisplay: Fetching booking ID:', id);
        const bookingData = await bookingService.getBookingById(id);
        console.log('✅ QRCodeDisplay: Received booking data:', bookingData);
        setBooking(bookingData);
      } catch (error) {
        console.error('❌ QRCodeDisplay: Error fetching booking:', error);
        console.error('❌ QRCodeDisplay: Error message:', error.message);
        alert('Failed to load booking details');
        navigate('/my-bookings');
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
    
    // Refresh booking status every 10 seconds
    const intervalId = setInterval(async () => {
      if (id) {
        try {
          await bookingService.autoExpireBookings();
          const bookingData = await bookingService.getBookingById(id);
          setBooking(bookingData);
        } catch (error) {
          console.error('Error refreshing booking:', error);
        }
      }
    }, 10000); // 10 seconds

    return () => clearInterval(intervalId);
  }, [id, location.state, navigate]);

  /**
   * Calculate and update countdown
   */
  useEffect(() => {
    if (!booking) return;

    const calculateCountdown = () => {
      const startTime = new Date(booking.booking_start_time);
      const now = new Date();
      const diff = startTime - now;

      if (diff > 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setCountdown({ hours, minutes, seconds, total: diff });
      } else {
        setCountdown(null);
      }
    };

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 1000);

    return () => clearInterval(interval);
  }, [booking]);

  /**
   * Copy booking ID to clipboard
   */
  const copyBookingId = () => {
    navigator.clipboard.writeText(booking.id.toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /**
   * Download QR code as image
   */
  const downloadQR = () => {
    if (!qrRef.current) return;

    const svg = qrRef.current.querySelector('svg');
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    canvas.width = 1024;
    canvas.height = 1024;

    img.onload = () => {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `parkmitra-booking-${booking.id}.png`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      });
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  /**
   * Share booking using Web Share API
   */
  const shareQR = async () => {
    const shareData = {
      title: 'ParkMitra Booking',
      text: `Booking #${booking.id} - ${booking.org_name}\nVehicle: ${booking.vehicle_number}\nSlot: ${booking.slot_number}\nTime: ${new Date(
        booking.booking_start_time
      ).toLocaleString('en-IN')}`,
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(
          `${shareData.text}\n\nView booking: ${shareData.url}`
        );
        alert('Booking details copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  /**
   * Print booking details
   */
  const printBooking = () => {
    window.print();
  };

  /**
   * Cancel booking
   */
  const handleCancelBooking = async () => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      await bookingService.cancelBooking(booking.id);
      alert('Booking cancelled successfully');
      navigate('/my-bookings');
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert('Failed to cancel booking');
    }
  };

  /**
   * Format date and time
   */
  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  /**
   * Get status badge styling
   */
  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmed':
      case 'active':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-indigo-600 text-5xl mx-auto mb-4" />
          <p className="text-gray-600">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FaTimesCircle className="text-red-500 text-5xl mb-4" />
          <p className="text-gray-600">Booking not found</p>
        </div>
      </div>
    );
  }

  const isFreeBooking = booking.amount === 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Success Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6 text-center">
          <div className="inline-block p-4 bg-green-100 rounded-full mb-4 animate-bounce">
            <FaCheckCircle className="text-green-600 text-6xl" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
          <p className="text-lg text-gray-600">
            {isFreeBooking
              ? 'Your free parking slot is reserved!'
              : 'Payment successful. Your slot is confirmed!'}
          </p>

          {/* Email & SMS Confirmation */}
          <div className="mt-6 flex flex-col sm:flex-row justify-center gap-4 text-sm text-gray-600">
            <div className="flex items-center justify-center">
              <FaEnvelope className="text-indigo-500 mr-2" />
              <span>Email confirmation sent</span>
            </div>
            <div className="flex items-center justify-center">
              <FaSms className="text-green-500 mr-2" />
              <span>SMS sent to your mobile</span>
            </div>
          </div>
        </div>

        {/* Countdown Timer */}
        {countdown && countdown.total > 0 && (
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl shadow-xl p-6 mb-6 text-white text-center">
            <h3 className="text-xl font-bold mb-3">Your booking starts in:</h3>
            <div className="flex justify-center gap-4 mb-4">
              <div className="bg-white bg-opacity-20 rounded-lg p-4 min-w-[80px]">
                <div className="text-3xl font-bold">{countdown.hours}</div>
                <div className="text-sm">Hours</div>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-4 min-w-[80px]">
                <div className="text-3xl font-bold">{countdown.minutes}</div>
                <div className="text-sm">Minutes</div>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-4 min-w-[80px]">
                <div className="text-3xl font-bold">{countdown.seconds}</div>
                <div className="text-sm">Seconds</div>
              </div>
            </div>
            <div className="w-full bg-white bg-opacity-20 rounded-full h-2">
              <div
                className="bg-white h-2 rounded-full transition-all"
                style={{
                  width: `${Math.max(
                    0,
                    100 - (countdown.total / (24 * 60 * 60 * 1000)) * 100
                  )}%`
                }}
              ></div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Booking Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Booking Summary Card */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Booking Summary</h2>

              <div className="space-y-4">
                {/* Booking ID */}
                <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                  <div>
                    <p className="text-xs text-gray-500">Booking ID</p>
                    <p className="text-lg font-bold text-gray-900">#{booking.id}</p>
                  </div>
                  <button
                    onClick={copyBookingId}
                    className="px-3 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-all"
                  >
                    {copied ? <FaCheckCircle /> : <FaCopy />}
                  </button>
                </div>

                {/* Organization */}
                <div className="border-b border-gray-200 pb-3">
                  <div className="flex items-start">
                    <FaBuilding className="text-indigo-600 mt-1 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-500">Organization</p>
                      <p className="font-bold text-gray-900">{booking.org_name}</p>
                      {booking.org_address && (
                        <p className="text-sm text-gray-600 flex items-start mt-1">
                          <FaMapMarkerAlt className="mt-1 mr-1 flex-shrink-0" />
                          {booking.org_address}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Slot Number */}
                <div className="bg-yellow-100 border-2 border-yellow-400 rounded-xl p-4 text-center">
                  <p className="text-sm text-yellow-800 font-semibold mb-1">
                    <FaParking className="inline mr-2" />
                    Assigned Slot
                  </p>
                  <p className="text-4xl font-bold text-yellow-900">{booking.slot_number}</p>
                </div>

                {/* Vehicle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FaCar className="text-indigo-600 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Vehicle Number</p>
                      <p className="font-bold text-gray-900">{booking.vehicle_number}</p>
                    </div>
                  </div>
                </div>

                {/* Booking Times */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-start mb-3">
                    <FaCalendarAlt className="text-blue-600 mt-1 mr-3" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Start Time</p>
                      <p className="font-semibold text-gray-900">
                        {formatDateTime(booking.booking_start_time)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start mb-3">
                    <FaClock className="text-blue-600 mt-1 mr-3" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">End Time</p>
                      <p className="font-semibold text-gray-900">
                        {formatDateTime(booking.booking_end_time)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-blue-200">
                    <span className="text-gray-700">Duration</span>
                    <span className="font-bold text-blue-900">
                      {booking.duration_hours} hour{booking.duration_hours !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {/* Amount */}
                <div className="border-t border-gray-200 pt-4">
                  {isFreeBooking ? (
                    <div className="bg-green-100 rounded-lg p-4 text-center">
                      <FaShieldAlt className="text-green-600 text-3xl mx-auto mb-2" />
                      <p className="text-2xl font-bold text-green-900">FREE PARKING</p>
                      <p className="text-sm text-green-700">Member Benefit</p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Amount Paid</span>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">
                          <FaRupeeSign className="inline text-lg" />
                          {booking.amount}
                        </p>
                        <p className="text-xs text-gray-500">Payment Completed</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Status */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Status</span>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold border-2 ${getStatusBadge(
                      booking.booking_status
                    )}`}
                  >
                    {booking.booking_status}
                  </span>
                </div>
              </div>
            </div>

            {/* Important Information */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <FaInfoCircle className="text-blue-600 mr-3" />
                Important Information
              </h3>

              <div className="space-y-4 text-sm text-gray-700">
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
                  <p className="font-semibold text-yellow-900 mb-1">
                    <FaExclamationCircle className="inline mr-2" />
                    Entry Instructions
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-yellow-800">
                    <li>Arrive 5 minutes before your booking time</li>
                    <li>Show the QR code to the watchman at entry</li>
                    <li>Park only in your assigned slot ({booking.slot_number})</li>
                    <li>Display this QR code on your dashboard</li>
                  </ul>
                </div>

                {booking.parking_rules && (
                  <div>
                    <p className="font-semibold text-gray-900 mb-2">Parking Rules:</p>
                    <p className="text-gray-600 whitespace-pre-line">{booking.parking_rules}</p>
                  </div>
                )}

                <div>
                  <p className="font-semibold text-gray-900 mb-2">Contact Information:</p>
                  <div className="space-y-1">
                    <p className="flex items-center">
                      <FaPhone className="text-green-600 mr-2" />
                      Support: 1800-123-4567
                    </p>
                    <p className="flex items-center">
                      <FaEnvelope className="text-blue-600 mr-2" />
                      support@parkmitra.com
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - QR Code */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-6 sticky top-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">
                Your Parking Pass
              </h2>

              {/* QR Code */}
              <div
                ref={qrRef}
                className="bg-white p-4 rounded-xl border-4 border-indigo-200 mb-4"
              >
                <QRCodeSVG
                  value={JSON.stringify({
                    id: booking.id,
                    user_id: booking.user_id,
                    org_id: booking.organization_id,
                    vehicle: booking.vehicle_number,
                    slot: booking.slot_number
                  })}
                  size={256}
                  level="M"
                  includeMargin={true}
                  className="w-full h-auto"
                />
              </div>

              {/* QR Instructions */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 mb-4">
                <p className="text-xs text-indigo-900 text-center font-medium">
                  Show this QR code to the watchman at entry and exit
                </p>
              </div>

              {/* QR Action Buttons */}
              <div className="space-y-2">
                <button
                  onClick={downloadQR}
                  className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all font-semibold flex items-center justify-center"
                >
                  <FaDownload className="mr-2" />
                  Download QR Code
                </button>
                <button
                  onClick={shareQR}
                  className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-semibold flex items-center justify-center"
                >
                  <FaShare className="mr-2" />
                  Share Booking
                </button>
                <button
                  onClick={printBooking}
                  className="w-full px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all font-semibold flex items-center justify-center print:hidden"
                >
                  <FaPrint className="mr-2" />
                  Print Details
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/my-bookings')}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all font-semibold flex items-center justify-center"
          >
            <FaArrowLeft className="mr-2" />
            View My Bookings
          </button>
          <button
            onClick={() => navigate('/book-parking')}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-semibold flex items-center justify-center"
          >
            <FaPlus className="mr-2" />
            Book Another Parking
          </button>
          {booking.booking_status !== 'cancelled' && booking.booking_status !== 'completed' && (
            <button
              onClick={handleCancelBooking}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-semibold flex items-center justify-center"
            >
              <FaTimesCircle className="mr-2" />
              Cancel Booking
            </button>
          )}
        </div>
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          body {
            background: white !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          button {
            display: none !important;
          }
          .bg-gradient-to-br,
          .bg-gradient-to-r {
            background: white !important;
          }
        }
      `}</style>
    </div>
  );
};

export default QRCodeDisplay;
