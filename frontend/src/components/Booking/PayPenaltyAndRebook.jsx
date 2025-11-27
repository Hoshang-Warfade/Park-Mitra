import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { FaExclamationTriangle, FaMoneyBillWave, FaClock, FaBuilding, FaCar, FaCalendarAlt, FaCreditCard, FaMobileAlt, FaUniversity, FaLock } from 'react-icons/fa';
import { toast } from 'react-toastify';
import LoadingSpinner from '../Common/LoadingSpinner';

const PayPenaltyAndRebook = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  
  // Helper function to format date to local datetime-local format
  const formatLocalDateTime = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };
  
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [penaltyDetails, setPenaltyDetails] = useState(null);
  
  // New booking details
  const [createNewBooking, setCreateNewBooking] = useState(false);
  const [newBookingStartTime, setNewBookingStartTime] = useState('');
  const [newBookingEndTime, setNewBookingEndTime] = useState('');
  const [newBookingDuration, setNewBookingDuration] = useState(2);
  
  // Payment details
  const [paymentMethod, setPaymentMethod] = useState('card');

  useEffect(() => {
    fetchBookingDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  useEffect(() => {
    if (newBookingStartTime && newBookingDuration > 0) {
      const start = new Date(newBookingStartTime);
      const end = new Date(start.getTime() + newBookingDuration * 60 * 60 * 1000);
      setNewBookingEndTime(formatLocalDateTime(end));
    }
  }, [newBookingStartTime, newBookingDuration]);

  // Update start time to current time when user enables new booking
  useEffect(() => {
    if (createNewBooking) {
      const now = new Date();
      now.setMinutes(Math.ceil(now.getMinutes() / 15) * 15); // Round to nearest 15 min
      setNewBookingStartTime(formatLocalDateTime(now));
    }
  }, [createNewBooking]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/bookings/${bookingId}`);
      const bookingData = response.booking || response.data?.booking;
      
      if (!bookingData) {
        throw new Error('Booking not found');
      }
      
      if (bookingData.booking_status !== 'overstay') {
        toast.error('This booking is not in overstay status');
        navigate('/my-bookings');
        return;
      }
      
      setBooking(bookingData);
      
      // Calculate current penalty
      const now = new Date();
      const endTime = new Date(bookingData.booking_end_time);
      const overstayMinutes = Math.ceil((now - endTime) / (1000 * 60));
      const overstayHours = Math.ceil(overstayMinutes / 60);
      
      setPenaltyDetails({
        overstayMinutes,
        overstayHours,
        penaltyAmount: bookingData.penalty_amount || 0
      });
      
      // Set default new booking start time to now (will be used if user enables rebook)
      const defaultStart = new Date();
      defaultStart.setMinutes(Math.ceil(defaultStart.getMinutes() / 15) * 15); // Round to nearest 15 min
      setNewBookingStartTime(formatLocalDateTime(defaultStart));
      
    } catch (error) {
      console.error('Error fetching booking:', error);
      toast.error('Failed to load booking details');
      navigate('/my-bookings');
    } finally {
      setLoading(false);
    }
  };

  const handlePayPenalty = async () => {
    try {
      setSubmitting(true);
      
      if (!paymentMethod) {
        toast.error('Please select a payment method');
        return;
      }
      
      const requestData = {
        payment_method: paymentMethod
      };
      
      // Add new booking details if user wants to create one
      if (createNewBooking) {
        // If no start time provided, use current time
        let startTime = newBookingStartTime;
        if (!startTime) {
          const now = new Date();
          now.setMinutes(Math.ceil(now.getMinutes() / 15) * 15); // Round to nearest 15 min
          startTime = now.toISOString().slice(0, 16);
        }
        
        // If no end time provided or duration not set, calculate from duration
        let endTime = newBookingEndTime;
        if (!endTime && newBookingDuration > 0) {
          const start = new Date(startTime);
          const end = new Date(start.getTime() + newBookingDuration * 60 * 60 * 1000);
          endTime = end.toISOString().slice(0, 16);
        }
        
        if (!startTime || !endTime) {
          toast.error('Please select booking times for new booking');
          return;
        }
        
        // Validate that end time is after start time
        const startDate = new Date(startTime);
        const endDate = new Date(endTime);
        
        if (endDate <= startDate) {
          toast.error('End time must be after start time. Please select a valid duration.');
          return;
        }
        
        requestData.new_booking_start_time = startTime;
        requestData.new_booking_end_time = endTime;
      }
      
      const response = await api.post(`/bookings/pay-penalty-and-rebook/${bookingId}`, requestData);
      const result = response.data || response;
      
      toast.success(result.message || 'Penalty paid successfully!');
      
      // If new booking was created, navigate to it
      if (result.new_booking) {
        toast.info('New booking created. Redirecting to QR code...', { autoClose: 2000 });
        setTimeout(() => {
          navigate(`/booking/${result.new_booking.id}/qr`);
        }, 2000);
      } else {
        setTimeout(() => {
          navigate('/my-bookings');
        }, 1500);
      }
      
    } catch (error) {
      console.error('Error paying penalty:', error);
      toast.error(error.response?.data?.message || 'Failed to process penalty payment');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="large" message="Loading overstay details..." />
      </div>
    );
  }

  if (!booking || !penaltyDetails) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-red-600 text-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-4 rounded-full">
              <FaExclamationTriangle className="text-4xl" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Overstay Penalty Payment</h1>
              <p className="text-red-100 mt-1">Your parking booking has exceeded the allocated time</p>
            </div>
          </div>
        </div>

        {/* Booking Details */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Original Booking Details</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <FaBuilding className="text-2xl text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Organization</p>
                <p className="font-semibold text-gray-900">{booking.org_name || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FaCar className="text-2xl text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Vehicle Number</p>
                <p className="font-semibold text-gray-900">{booking.vehicle_number}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FaCalendarAlt className="text-2xl text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Booking Time</p>
                <p className="font-semibold text-gray-900">{formatDate(booking.booking_start_time)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FaClock className="text-2xl text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">End Time (Expired)</p>
                <p className="font-semibold text-red-600">{formatDate(booking.booking_end_time)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Penalty Details */}
        <div className="bg-orange-50 border-2 border-orange-200 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-orange-900 mb-4 flex items-center gap-2">
            <FaExclamationTriangle className="text-orange-600" />
            Penalty Calculation
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg p-4 border border-orange-200">
              <p className="text-sm text-gray-600 mb-1">Overstay Duration</p>
              <p className="text-3xl font-bold text-orange-600">{penaltyDetails.overstayHours} hrs</p>
              <p className="text-xs text-gray-500 mt-1">({penaltyDetails.overstayMinutes} minutes)</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-orange-200">
              <p className="text-sm text-gray-600 mb-1">Original Amount</p>
              <p className="text-3xl font-bold text-gray-700">₹{booking.amount}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-red-200">
              <p className="text-sm text-gray-600 mb-1">Penalty Amount</p>
              <p className="text-3xl font-bold text-red-600">₹{penaltyDetails.penaltyAmount}</p>
              <p className="text-xs text-gray-500 mt-1">(2x hourly rate)</p>
            </div>
          </div>
          <div className="mt-4 p-4 bg-white rounded-lg border-2 border-orange-300">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-gray-900">Total Amount to Pay:</span>
              <span className="text-3xl font-bold text-red-600">₹{penaltyDetails.penaltyAmount}</span>
            </div>
          </div>
        </div>

        {/* Payment Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <FaMoneyBillWave className="mr-3 text-orange-600" />
            Payment Method
          </h2>
          
          {/* Payment Method Tabs */}
          <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
            <button
              onClick={() => setPaymentMethod('card')}
              className={`flex-1 py-3 px-4 text-center font-semibold transition-all whitespace-nowrap ${
                paymentMethod === 'card'
                  ? 'border-b-2 border-orange-600 text-orange-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <FaCreditCard className="inline mr-2" />
              Card
            </button>
            <button
              onClick={() => setPaymentMethod('upi')}
              className={`flex-1 py-3 px-4 text-center font-semibold transition-all whitespace-nowrap ${
                paymentMethod === 'upi'
                  ? 'border-b-2 border-orange-600 text-orange-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <FaMobileAlt className="inline mr-2" />
              UPI
            </button>
            <button
              onClick={() => setPaymentMethod('netbanking')}
              className={`flex-1 py-3 px-4 text-center font-semibold transition-all whitespace-nowrap ${
                paymentMethod === 'netbanking'
                  ? 'border-b-2 border-orange-600 text-orange-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <FaUniversity className="inline mr-2" />
              Net Banking
            </button>
            <button
              onClick={() => setPaymentMethod('Cash')}
              className={`flex-1 py-3 px-4 text-center font-semibold transition-all whitespace-nowrap ${
                paymentMethod === 'Cash'
                  ? 'border-b-2 border-orange-600 text-orange-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <FaMoneyBillWave className="inline mr-2" />
              Cash
            </button>
          </div>

          {/* Payment Method Info */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            {paymentMethod === 'card' && (
              <div className="text-center">
                <FaCreditCard className="text-4xl text-gray-400 mx-auto mb-2" />
                <p className="text-gray-700 font-semibold">Credit / Debit Card</p>
                <p className="text-sm text-gray-500 mt-1">Visa, Mastercard, RuPay accepted</p>
              </div>
            )}
            {paymentMethod === 'upi' && (
              <div className="text-center">
                <FaMobileAlt className="text-4xl text-gray-400 mx-auto mb-2" />
                <p className="text-gray-700 font-semibold">UPI Payment</p>
                <p className="text-sm text-gray-500 mt-1">GPay, PhonePe, Paytm, and all UPI apps</p>
              </div>
            )}
            {paymentMethod === 'netbanking' && (
              <div className="text-center">
                <FaUniversity className="text-4xl text-gray-400 mx-auto mb-2" />
                <p className="text-gray-700 font-semibold">Net Banking</p>
                <p className="text-sm text-gray-500 mt-1">All major Indian banks supported</p>
              </div>
            )}
            {paymentMethod === 'Cash' && (
              <div className="text-center">
                <FaMoneyBillWave className="text-4xl text-gray-400 mx-auto mb-2" />
                <p className="text-gray-700 font-semibold">Cash Payment</p>
                <p className="text-sm text-gray-500 mt-1">Pay at the parking facility</p>
              </div>
            )}
          </div>

          {/* Security Notice */}
          <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3 flex items-center">
            <FaLock className="text-green-600 mr-3 text-xl" />
            <p className="text-sm text-green-900">
              Your payment is secure and encrypted with 256-bit SSL
            </p>
          </div>
        </div>

        {/* New Booking Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Create New Booking (Optional)</h2>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={createNewBooking}
                onChange={(e) => setCreateNewBooking(e.target.checked)}
                className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
              />
              <span className="text-sm font-medium text-gray-700">Book a new slot</span>
            </label>
          </div>

          {createNewBooking && (
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Book a new parking slot after paying the penalty for the same vehicle at the same location.
              </p>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Time
                  </label>
                  <input
                    type="datetime-local"
                    value={newBookingStartTime}
                    onChange={(e) => setNewBookingStartTime(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (hours)
                  </label>
                  <select
                    value={newBookingDuration}
                    onChange={(e) => setNewBookingDuration(parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    {[1, 2, 3, 4, 6, 8, 12, 24].map(hours => (
                      <option key={hours} value={hours}>{hours} hour{hours > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {newBookingEndTime && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-900">
                    <strong>New booking will end at:</strong> {formatDate(newBookingEndTime)}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => navigate('/my-bookings')}
            disabled={submitting}
            className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-semibold disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handlePayPenalty}
            disabled={submitting}
            className="flex-1 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Processing...
              </>
            ) : (
              <>
                <FaMoneyBillWave />
                Pay ₹{penaltyDetails.penaltyAmount} Penalty {createNewBooking && '& Book'}
              </>
            )}
          </button>
        </div>

        {/* Info Banner */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl">ℹ️</div>
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Important Information</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Penalty rate is 2x the regular hourly rate</li>
                <li>Penalty increases as overstay duration increases</li>
                <li>Your original booking will be marked as completed after payment</li>
                <li>If creating a new booking, slot availability will be checked</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayPenaltyAndRebook;
