import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import watchmanService from '../../services/watchmanService';
import organizationService from '../../services/organizationService';
import {
  FaQrcode,
  FaWalking,
  FaParking,
  FaMoneyBillWave,
  FaSignOutAlt,
  FaClock,
  FaCar,
  FaUser,
  FaMobileAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaSpinner,
  FaCamera,
  FaKeyboard,
  FaSyncAlt,
  FaRupeeSign,
  FaArrowLeft,
  FaBuilding,
  FaShieldAlt
} from 'react-icons/fa';

/**
 * WatchmanDashboard Component
 * Mobile-optimized interface for parking watchmen
 */
const WatchmanDashboard = () => {
  const navigate = useNavigate();

  // Component state
  const [watchman, setWatchman] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [currentView, setCurrentView] = useState('scan');
  const [scannedData, setScannedData] = useState(null);
  const [bookingDetails, setBookingDetails] = useState(null);
  const [walkInUsers, setWalkInUsers] = useState([]);
  const [parkingStatus, setParkingStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [manualInput, setManualInput] = useState('');
  const [useManualInput, setUseManualInput] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [recentScans, setRecentScans] = useState([]);

  // Walk-in form state
  const [walkInForm, setWalkInForm] = useState({
    name: '',
    mobile: '',
    vehicle_number: '',
    duration_hours: '1'
  });

  // Payment form state
  const [paymentForm, setPaymentForm] = useState({
    booking_id: '',
    amount: ''
  });

  /**
   * Fetch parking status and walk-in users
   */
  const fetchDashboardData = useCallback(async () => {
    if (!watchman || !watchman.organization_id) return;

    try {
      // Fetch parking status
      const status = await watchmanService.getCurrentStatus();
      setParkingStatus(status);

      // Fetch walk-in users (simulated - you may need to implement this endpoint)
      // const walkIns = await watchmanService.getWalkInRequests(watchman.organization_id);
      // setWalkInUsers(walkIns);
      setWalkInUsers([]); // Placeholder
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  }, [watchman]);

  /**
   * Initialize watchman data and setup auto-refresh
   */
  useEffect(() => {
    // Load watchman from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      if (user?.user_type === 'watchman') {
        setWatchman(user);
      } else {
        navigate('/login');
      }
    } else {
      navigate('/login');
    }
  }, [navigate]);

  /**
   * Fetch data when watchman is loaded
   */
  useEffect(() => {
    if (watchman) {
      fetchDashboardData();

      // Auto-refresh every 20 seconds
      const intervalId = setInterval(() => {
        fetchDashboardData();
      }, 20000);

      return () => clearInterval(intervalId);
    }
  }, [watchman, fetchDashboardData]);

  /**
   * Fetch organization details for watchman
   */
  useEffect(() => {
    const fetchOrganization = async () => {
      if (watchman && watchman.organization_id) {
        try {
          const orgData = await organizationService.getOrganizationById(watchman.organization_id);
          setOrganization(orgData);
        } catch (error) {
          console.error('Error fetching organization:', error);
        }
      }
    };

    fetchOrganization();
  }, [watchman]);

  /**
   * Update current time every second
   */
  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timeInterval);
  }, []);

  /**
   * Handle QR code scan
   */
  const handleScan = async (qrCodeData) => {
    if (!qrCodeData) return;

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // Scan QR code and get booking details
      const result = await watchmanService.scanQR(qrCodeData);
      setBookingDetails(result);
      setScannedData(qrCodeData);

      // Add to recent scans
      setRecentScans(prev => [
        { qr: qrCodeData, time: new Date(), user: result.user_name },
        ...prev.slice(0, 4)
      ]);

      // Play success sound (if available)
      playSound('success');
    } catch (error) {
      console.error('Error scanning QR:', error);
      setErrorMessage(error.response?.data?.message || 'Invalid QR code or booking not found');
      playSound('error');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle manual QR input
   */
  const handleManualScan = () => {
    if (manualInput.trim()) {
      handleScan(manualInput.trim());
      setManualInput('');
    }
  };

  /**
   * Handle verify entry
   */
  const handleVerifyEntry = async (bookingId) => {
    setLoading(true);
    setErrorMessage('');

    try {
      const result = await watchmanService.verifyEntry(bookingId);
      setSuccessMessage(`✓ Entry verified. Slot ${result.slot_number} assigned to ${result.vehicle_number}`);
      
      // Clear scanned data after 3 seconds
      setTimeout(() => {
        setScannedData(null);
        setBookingDetails(null);
        setSuccessMessage('');
      }, 3000);

      // Play success sound and vibrate
      playSound('success');
      vibrate();

      // Refresh parking status
      fetchDashboardData();
    } catch (error) {
      console.error('Error verifying entry:', error);
      setErrorMessage(error.response?.data?.message || 'Failed to verify entry');
      playSound('error');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle verify exit
   */
  const handleVerifyExit = async (bookingId) => {
    setLoading(true);
    setErrorMessage('');

    try {
      const result = await watchmanService.verifyExit(bookingId);
      
      let message = `✓ Exit verified. Duration: ${result.duration_hours}h`;
      if (result.payment_status === 'pending') {
        message += ` | Payment Due: ₹${result.amount}`;
      } else {
        message += ` | Payment: ${result.payment_status}`;
      }
      
      setSuccessMessage(message);

      // Clear scanned data after 5 seconds
      setTimeout(() => {
        setScannedData(null);
        setBookingDetails(null);
        setSuccessMessage('');
      }, 5000);

      // Play success sound and vibrate
      playSound('success');
      vibrate();

      // Refresh parking status
      fetchDashboardData();
    } catch (error) {
      console.error('Error verifying exit:', error);
      setErrorMessage(error.response?.data?.message || 'Failed to verify exit');
      playSound('error');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle assist walk-in user
   */
  const handleAssistWalkIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      const result = await watchmanService.assignSlotToWalkIn({
        ...walkInForm,
        organization_id: watchman.organization_id
      });

      setSuccessMessage(`✓ Slot ${result.slot_number} assigned to ${walkInForm.vehicle_number}`);

      // Clear form
      setWalkInForm({
        name: '',
        mobile: '',
        vehicle_number: '',
        duration_hours: '1'
      });

      // Play success sound and vibrate
      playSound('success');
      vibrate();

      // Refresh parking status
      fetchDashboardData();
    } catch (error) {
      console.error('Error assisting walk-in:', error);
      setErrorMessage(error.response?.data?.message || 'Failed to assign slot');
      playSound('error');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle cash payment
   */
  const handleCashPayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      await watchmanService.recordCashPayment({
        booking_id: parseInt(paymentForm.booking_id),
        amount: parseFloat(paymentForm.amount),
        payment_method: 'cash'
      });

      setSuccessMessage(`✓ Cash payment of ₹${paymentForm.amount} recorded successfully`);

      // Clear form
      setPaymentForm({
        booking_id: '',
        amount: ''
      });

      // Play success sound and vibrate
      playSound('success');
      vibrate();

      // Refresh parking status
      fetchDashboardData();
    } catch (error) {
      console.error('Error recording payment:', error);
      setErrorMessage(error.response?.data?.message || 'Failed to record payment');
      playSound('error');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle logout
   */
  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  /**
   * Play sound (if audio API available)
   */
  const playSound = (type) => {
    try {
      // You can add actual audio files here
      const audio = new Audio(type === 'success' ? '/sounds/success.mp3' : '/sounds/error.mp3');
      audio.play().catch(() => {
        // Silently fail if audio not available
      });
    } catch (error) {
      // Silently fail
    }
  };

  /**
   * Vibrate device (if API available)
   */
  const vibrate = () => {
    if (navigator.vibrate) {
      navigator.vibrate(200);
    }
  };

  /**
   * Cancel scan
   */
  const handleCancelScan = () => {
    setScannedData(null);
    setBookingDetails(null);
    setErrorMessage('');
    setSuccessMessage('');
  };

  if (!watchman) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <FaSpinner className="animate-spin text-white text-5xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Top Navigation Bar */}
      <header className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 shadow-lg sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FaParking className="text-2xl" />
            <div>
              <h1 className="font-bold text-lg">ParkMitra</h1>
              <p className="text-xs text-indigo-100">{watchman.name}</p>
              {organization && (
                <p className="text-xs text-indigo-200 flex items-center mt-0.5">
                  <FaBuilding className="mr-1 text-[10px]" />
                  {organization.org_name}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold">{currentTime.toLocaleTimeString('en-IN')}</p>
              <p className="text-xs text-indigo-100">{currentTime.toLocaleDateString('en-IN')}</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 px-3 py-2 rounded-lg transition-all"
            >
              <FaSignOutAlt className="text-xl" />
            </button>
          </div>
        </div>
      </header>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-green-500 text-white px-4 py-3 text-center font-semibold animate-pulse">
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="bg-red-500 text-white px-4 py-3 text-center font-semibold animate-pulse">
          {errorMessage}
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        <div className="max-w-4xl mx-auto p-4">
          {/* SCAN VIEW */}
          {currentView === 'scan' && (
            <div className="space-y-4">
              {!bookingDetails ? (
                <>
                  <div className="bg-gray-800 rounded-2xl p-6 text-center">
                    <FaQrcode className="text-6xl mx-auto mb-4 text-indigo-400" />
                    <h2 className="text-2xl font-bold mb-2">Scan QR Code</h2>
                    <p className="text-gray-400 mb-6">
                      {scannedData ? 'Verifying QR code...' : 'Ask user to show their booking QR code'}
                    </p>

                    {/* Toggle between camera and manual input */}
                    <div className="flex justify-center space-x-4 mb-6">
                      <button
                        onClick={() => setUseManualInput(false)}
                        className={`px-4 py-2 rounded-lg transition-all ${
                          !useManualInput ? 'bg-indigo-600' : 'bg-gray-700'
                        }`}
                      >
                        <FaCamera className="inline mr-2" />
                        Camera
                      </button>
                      <button
                        onClick={() => setUseManualInput(true)}
                        className={`px-4 py-2 rounded-lg transition-all ${
                          useManualInput ? 'bg-indigo-600' : 'bg-gray-700'
                        }`}
                      >
                        <FaKeyboard className="inline mr-2" />
                        Manual
                      </button>
                    </div>

                    {/* Camera Scanner Placeholder */}
                    {!useManualInput && (
                      <div className="bg-gray-900 rounded-lg p-8 mb-4">
                        <div className="border-4 border-dashed border-indigo-500 rounded-lg p-12 text-center">
                          <FaCamera className="text-5xl mx-auto mb-3 text-gray-500" />
                          <p className="text-gray-500">Camera feed would appear here</p>
                          <p className="text-xs text-gray-600 mt-2">
                            QR Scanner integration required
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Manual Input */}
                    {useManualInput && (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={manualInput}
                          onChange={(e) => setManualInput(e.target.value)}
                          placeholder="Enter booking ID or QR data"
                          className="w-full px-4 py-3 bg-gray-700 rounded-lg text-white text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          onKeyPress={(e) => e.key === 'Enter' && handleManualScan()}
                        />
                        <button
                          onClick={handleManualScan}
                          disabled={loading || !manualInput.trim()}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 disabled:text-gray-500 px-6 py-4 rounded-lg font-bold text-lg transition-all"
                        >
                          {loading ? (
                            <FaSpinner className="animate-spin inline mr-2" />
                          ) : (
                            <FaQrcode className="inline mr-2" />
                          )}
                          Scan QR Code
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Recent Scans */}
                  {recentScans.length > 0 && (
                    <div className="bg-gray-800 rounded-2xl p-4">
                      <h3 className="font-bold mb-3 flex items-center">
                        <FaClock className="mr-2 text-indigo-400" />
                        Recent Scans
                      </h3>
                      <div className="space-y-2">
                        {recentScans.map((scan, index) => (
                          <div
                            key={index}
                            className="bg-gray-700 rounded-lg p-3 flex items-center justify-between"
                          >
                            <div>
                              <p className="font-semibold">{scan.user}</p>
                              <p className="text-xs text-gray-400">
                                {scan.time.toLocaleTimeString('en-IN')}
                              </p>
                            </div>
                            <button
                              onClick={() => handleScan(scan.qr)}
                              className="text-indigo-400 hover:text-indigo-300"
                            >
                              Rescan
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* Verification Card */
                <div className="bg-gray-800 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold">Verify User</h2>
                    <button
                      onClick={handleCancelScan}
                      className="text-gray-400 hover:text-white"
                    >
                      <FaTimesCircle className="text-2xl" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* User Photo Placeholder */}
                    <div className="flex justify-center">
                      <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center">
                        <FaUser className="text-5xl text-gray-500" />
                      </div>
                    </div>

                    {/* User Details */}
                    <div className="text-center">
                      <h3 className="text-2xl font-bold mb-2">{bookingDetails.user_name}</h3>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                          bookingDetails.user_type === 'organization_member'
                            ? 'bg-green-500'
                            : bookingDetails.user_type === 'visitor'
                            ? 'bg-blue-500'
                            : 'bg-orange-500'
                        }`}
                      >
                        {bookingDetails.user_type === 'organization_member' && (
                          <FaShieldAlt className="inline mr-1" />
                        )}
                        {bookingDetails.user_type}
                      </span>
                    </div>

                    {/* Vehicle Number */}
                    <div className="bg-yellow-500 text-black rounded-lg p-4 text-center">
                      <p className="text-sm font-semibold mb-1">Vehicle Number</p>
                      <p className="text-3xl font-bold tracking-wider">
                        {bookingDetails.vehicle_number}
                      </p>
                    </div>

                    {/* Booking Details */}
                    <div className="bg-gray-700 rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">
                          <FaBuilding className="inline mr-2" />
                          Organization
                        </span>
                        <span className="font-semibold">{bookingDetails.org_name}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">
                          <FaClock className="inline mr-2" />
                          Booking Time
                        </span>
                        <span className="font-semibold">
                          {new Date(bookingDetails.booking_start_time).toLocaleString('en-IN')}
                        </span>
                      </div>
                      {bookingDetails.slot_number && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">
                            <FaParking className="inline mr-2" />
                            Slot
                          </span>
                          <span className="font-semibold">{bookingDetails.slot_number}</span>
                        </div>
                      )}
                      {bookingDetails.amount > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">
                            <FaRupeeSign className="inline mr-2" />
                            Amount
                          </span>
                          <span className="font-semibold">₹{bookingDetails.amount}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-4 mt-6">
                      <button
                        onClick={() => handleVerifyEntry(bookingDetails.id)}
                        disabled={loading}
                        className="bg-green-500 hover:bg-green-600 disabled:bg-gray-700 px-6 py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center"
                      >
                        {loading ? (
                          <FaSpinner className="animate-spin" />
                        ) : (
                          <>
                            <FaCheckCircle className="mr-2" />
                            Entry
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleVerifyExit(bookingDetails.id)}
                        disabled={loading}
                        className="bg-red-500 hover:bg-red-600 disabled:bg-gray-700 px-6 py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center"
                      >
                        {loading ? (
                          <FaSpinner className="animate-spin" />
                        ) : (
                          <>
                            <FaTimesCircle className="mr-2" />
                            Exit
                          </>
                        )}
                      </button>
                    </div>

                    <button
                      onClick={handleCancelScan}
                      className="w-full bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg font-semibold transition-all"
                    >
                      <FaArrowLeft className="inline mr-2" />
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* WALK-IN VIEW */}
          {currentView === 'walkin' && (
            <div className="space-y-4">
              {/* Available Slots Info */}
              {parkingStatus && (
                <div className="bg-gradient-to-r from-green-600 to-green-500 rounded-2xl p-6 text-center">
                  <h3 className="text-lg font-semibold mb-2">Available Slots</h3>
                  <p className="text-5xl font-bold">{parkingStatus.available_slots}</p>
                  <p className="text-sm text-green-100 mt-1">
                    out of {parkingStatus.total_slots} total
                  </p>
                </div>
              )}

              {/* Waiting Walk-ins */}
              {walkInUsers.length > 0 && (
                <div className="bg-gray-800 rounded-2xl p-4">
                  <h3 className="font-bold text-lg mb-4 flex items-center">
                    <FaWalking className="mr-2 text-orange-400" />
                    Waiting Walk-ins ({walkInUsers.length})
                  </h3>
                  <div className="space-y-3">
                    {walkInUsers.map((user) => (
                      <div key={user.id} className="bg-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold">{user.name}</p>
                            <p className="text-sm text-gray-400">
                              <FaMobileAlt className="inline mr-1" />
                              {user.mobile}
                            </p>
                            <p className="text-xs text-orange-400 mt-1">
                              Waiting: {user.wait_time}
                            </p>
                          </div>
                          <button className="bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-lg font-semibold transition-all">
                            Assist Now
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Assign Parking Form */}
              <div className="bg-gray-800 rounded-2xl p-6">
                <h3 className="font-bold text-lg mb-4">Assign Parking</h3>
                <form onSubmit={handleAssistWalkIn} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      <FaUser className="inline mr-2" />
                      User Name
                    </label>
                    <input
                      type="text"
                      value={walkInForm.name}
                      onChange={(e) => setWalkInForm({ ...walkInForm, name: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      <FaMobileAlt className="inline mr-2" />
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      value={walkInForm.mobile}
                      onChange={(e) => setWalkInForm({ ...walkInForm, mobile: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      maxLength="10"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      <FaCar className="inline mr-2" />
                      Vehicle Number
                    </label>
                    <input
                      type="text"
                      value={walkInForm.vehicle_number}
                      onChange={(e) =>
                        setWalkInForm({ ...walkInForm, vehicle_number: e.target.value.toUpperCase() })
                      }
                      className="w-full px-4 py-3 bg-gray-700 rounded-lg text-white uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      <FaClock className="inline mr-2" />
                      Estimated Duration
                    </label>
                    <select
                      value={walkInForm.duration_hours}
                      onChange={(e) =>
                        setWalkInForm({ ...walkInForm, duration_hours: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="1">1 Hour</option>
                      <option value="2">2 Hours</option>
                      <option value="3">3 Hours</option>
                      <option value="4">4 Hours</option>
                      <option value="6">6 Hours</option>
                      <option value="8">8 Hours</option>
                      <option value="12">12 Hours</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 px-6 py-4 rounded-xl font-bold text-lg transition-all"
                  >
                    {loading ? (
                      <FaSpinner className="animate-spin inline mr-2" />
                    ) : (
                      <FaCheckCircle className="inline mr-2" />
                    )}
                    Assign Slot
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* PARKING STATUS VIEW */}
          {currentView === 'status' && parkingStatus && (
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800 rounded-xl p-4 text-center">
                  <FaParking className="text-3xl mx-auto mb-2 text-indigo-400" />
                  <p className="text-2xl font-bold">{parkingStatus.total_slots}</p>
                  <p className="text-sm text-gray-400">Total Slots</p>
                </div>
                <div className="bg-gradient-to-br from-red-600 to-red-500 rounded-xl p-4 text-center">
                  <FaCar className="text-3xl mx-auto mb-2" />
                  <p className="text-2xl font-bold">{parkingStatus.occupied_slots}</p>
                  <p className="text-sm">Occupied</p>
                </div>
                <div className="bg-gradient-to-br from-green-600 to-green-500 rounded-xl p-4 text-center">
                  <FaCheckCircle className="text-3xl mx-auto mb-2" />
                  <p className="text-2xl font-bold">{parkingStatus.available_slots}</p>
                  <p className="text-sm">Available</p>
                </div>
                <div className="bg-gray-800 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold mb-2">
                    {Math.round((parkingStatus.occupied_slots / parkingStatus.total_slots) * 100)}%
                  </div>
                  <p className="text-sm text-gray-400">Occupancy</p>
                  <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                    <div
                      className="bg-gradient-to-r from-green-500 to-red-500 h-2 rounded-full"
                      style={{
                        width: `${(parkingStatus.occupied_slots / parkingStatus.total_slots) * 100}%`
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Refresh Button */}
              <button
                onClick={fetchDashboardData}
                className="w-full bg-indigo-600 hover:bg-indigo-700 px-4 py-3 rounded-xl font-semibold transition-all"
              >
                <FaSyncAlt className="inline mr-2" />
                Refresh Status
              </button>

              {/* Recent Activity */}
              <div className="bg-gray-800 rounded-2xl p-4">
                <h3 className="font-bold mb-3">Recent Entries</h3>
                <div className="space-y-2">
                  {parkingStatus.recent_entries?.slice(0, 10).map((entry, index) => (
                    <div key={index} className="bg-gray-700 rounded-lg p-3 flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{entry.vehicle_number}</p>
                        <p className="text-xs text-gray-400">{entry.slot_number}</p>
                      </div>
                      <p className="text-xs text-green-400">
                        {new Date(entry.entry_time).toLocaleTimeString('en-IN')}
                      </p>
                    </div>
                  )) || <p className="text-gray-500 text-center py-4">No recent entries</p>}
                </div>
              </div>

              <div className="bg-gray-800 rounded-2xl p-4">
                <h3 className="font-bold mb-3">Recent Exits</h3>
                <div className="space-y-2">
                  {parkingStatus.recent_exits?.slice(0, 10).map((exit, index) => (
                    <div key={index} className="bg-gray-700 rounded-lg p-3 flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{exit.vehicle_number}</p>
                        <p className="text-xs text-gray-400">{exit.duration_hours}h</p>
                      </div>
                      <p className="text-xs text-red-400">
                        {new Date(exit.exit_time).toLocaleTimeString('en-IN')}
                      </p>
                    </div>
                  )) || <p className="text-gray-500 text-center py-4">No recent exits</p>}
                </div>
              </div>
            </div>
          )}

          {/* PAYMENTS VIEW */}
          {currentView === 'payments' && (
            <div className="space-y-4">
              {/* Record Cash Payment Form */}
              <div className="bg-gray-800 rounded-2xl p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center">
                  <FaMoneyBillWave className="mr-2 text-green-400" />
                  Record Cash Payment
                </h3>
                <form onSubmit={handleCashPayment} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      <FaQrcode className="inline mr-2" />
                      Booking ID
                    </label>
                    <input
                      type="number"
                      value={paymentForm.booking_id}
                      onChange={(e) => setPaymentForm({ ...paymentForm, booking_id: e.target.value })}
                      placeholder="Scan QR or enter booking ID"
                      className="w-full px-4 py-3 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      <FaRupeeSign className="inline mr-2" />
                      Amount (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                      placeholder="Enter amount"
                      className="w-full px-4 py-3 bg-gray-700 rounded-lg text-white text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-700 px-6 py-4 rounded-xl font-bold text-lg transition-all"
                  >
                    {loading ? (
                      <FaSpinner className="animate-spin inline mr-2" />
                    ) : (
                      <FaCheckCircle className="inline mr-2" />
                    )}
                    Confirm Payment
                  </button>
                </form>
              </div>

              {/* Recent Cash Payments */}
              <div className="bg-gray-800 rounded-2xl p-4">
                <h3 className="font-bold mb-3">Recent Cash Payments</h3>
                <div className="space-y-2">
                  <p className="text-gray-500 text-center py-4">No recent payments</p>
                </div>
              </div>

              {/* Total Cash Collected Today */}
              <div className="bg-gradient-to-r from-green-600 to-green-500 rounded-2xl p-6 text-center">
                <p className="text-sm font-semibold mb-2">Total Cash Collected Today</p>
                <p className="text-5xl font-bold">₹0</p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Tab Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 shadow-lg">
        <div className="flex justify-around">
          <button
            onClick={() => setCurrentView('scan')}
            className={`flex-1 py-4 flex flex-col items-center transition-all ${
              currentView === 'scan' ? 'text-indigo-400 bg-gray-700' : 'text-gray-400'
            }`}
          >
            <FaQrcode className="text-2xl mb-1" />
            <span className="text-xs font-semibold">Scan</span>
          </button>
          <button
            onClick={() => setCurrentView('walkin')}
            className={`flex-1 py-4 flex flex-col items-center transition-all ${
              currentView === 'walkin' ? 'text-orange-400 bg-gray-700' : 'text-gray-400'
            }`}
          >
            <FaWalking className="text-2xl mb-1" />
            <span className="text-xs font-semibold">Walk-ins</span>
          </button>
          <button
            onClick={() => setCurrentView('status')}
            className={`flex-1 py-4 flex flex-col items-center transition-all ${
              currentView === 'status' ? 'text-green-400 bg-gray-700' : 'text-gray-400'
            }`}
          >
            <FaParking className="text-2xl mb-1" />
            <span className="text-xs font-semibold">Status</span>
          </button>
          <button
            onClick={() => setCurrentView('payments')}
            className={`flex-1 py-4 flex flex-col items-center transition-all ${
              currentView === 'payments' ? 'text-yellow-400 bg-gray-700' : 'text-gray-400'
            }`}
          >
            <FaMoneyBillWave className="text-2xl mb-1" />
            <span className="text-xs font-semibold">Payments</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default WatchmanDashboard;
