import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import bookingService from '../../services/bookingService';
import organizationService from '../../services/organizationService';
import {
  FaParking,
  FaCar,
  FaClock,
  FaMapMarkerAlt,
  FaCheckCircle,
  FaShieldAlt,
  FaUser,
  FaWalking,
  FaRupeeSign,
  FaHistory,
  FaPlus,
  FaCreditCard,
  FaQuestionCircle,
  FaCalendarAlt,
  FaSpinner,
  FaExpand,
  FaTicketAlt
} from 'react-icons/fa';

/**
 * UserDashboard Component
 * Adapts interface based on user_type: organization_member, visitor, or walk_in
 */
const UserDashboard = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  // Component state
  const [bookings, setBookings] = useState([]);
  const [activeBookings, setActiveBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [organization, setOrganization] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    cancelled: 0
  });
  const [selectedQR, setSelectedQR] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  /**
   * Fetch user bookings and calculate stats
   */
  const fetchBookings = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Fetch user bookings
      const userBookings = await bookingService.getUserBookings(user.id);
      setBookings(userBookings);

      // Filter active bookings (exclude expired and confirmed)
      // Only bookings with status 'active' should be considered as active
      // Confirmed bookings are future bookings that haven't started yet
      const isExpired = (booking) => {
        const now = new Date();
        const endTime = new Date(booking.booking_end_time);
        return now > endTime;
      };

      const active = userBookings.filter(
        booking => 
          (booking.booking_status === 'active' || booking.booking_status === 'confirmed') &&
          !isExpired(booking)
      );
      setActiveBookings(active);

      // Calculate stats
      const completed = userBookings.filter(
        booking => booking.booking_status === 'completed'
      ).length;
      const cancelled = userBookings.filter(
        booking => booking.booking_status === 'cancelled'
      ).length;

      setStats({
        total: userBookings.length,
        active: active.length,
        completed: completed,
        cancelled: cancelled
      });

    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    let mounted = true;

    if (!user) {
      navigate('/login');
      return;
    }

    if (mounted) {
      fetchBookings();
    }

    return () => {
      mounted = false;
    };
  }, [user, navigate, fetchBookings]);

  // Fetch organization details for members and watchmen
  useEffect(() => {
    const fetchOrganization = async () => {
      if (user && user.organization_id && 
          (user.user_type === 'organization_member' || user.user_type === 'watchman')) {
        try {
          const orgData = await organizationService.getOrganizationById(user.organization_id);
          setOrganization(orgData);
        } catch (error) {
          console.error('Error fetching organization:', error);
        }
      }
    };

    fetchOrganization();
  }, [user]);

  /**
   * Handle booking cancellation
   */
  const handleCancelBooking = async (bookingId, orgName) => {
    const confirmCancel = window.confirm(
      `Are you sure you want to cancel your parking booking at ${orgName}?`
    );

    if (!confirmCancel) return;

    try {
      setActionLoading(true);
      await bookingService.cancelBooking(bookingId);
      
      // Show success message
      alert('Booking cancelled successfully!');
      
      // Refresh bookings
      await fetchBookings();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert(error.message || 'Failed to cancel booking. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Get user type badge configuration
   */
  const getUserTypeBadge = () => {
    switch (user?.user_type) {
      case 'admin':
        return {
          label: 'Admin',
          color: 'bg-purple-100 text-purple-800 border-purple-300',
          icon: FaShieldAlt
        };
      case 'organization_member':
        return {
          label: 'Free Parking Member',
          color: 'bg-green-100 text-green-800 border-green-300',
          icon: FaShieldAlt
        };
      case 'visitor':
        return {
          label: 'Visitor',
          color: 'bg-blue-100 text-blue-800 border-blue-300',
          icon: FaUser
        };
      case 'walk_in':
        return {
          label: 'Walk-in User',
          color: 'bg-orange-100 text-orange-800 border-orange-300',
          icon: FaWalking
        };
      default:
        return {
          label: 'User',
          color: 'bg-gray-100 text-gray-800 border-gray-300',
          icon: FaUser
        };
    }
  };

  /**
   * Format date and time
   */
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
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
  const getStatusBadge = (booking) => {
    // Check if it's a booking object or just status string (for backwards compatibility)
    const status = typeof booking === 'string' ? booking : booking.booking_status;
    
    // Check for overstay (highest priority)
    if (status === 'overstay') {
      return 'bg-orange-100 text-orange-800 border-orange-300';
    }
    
    // Check if expired (for active bookings past end time)
    if (typeof booking === 'object' && status === 'active') {
      const now = new Date();
      const endTime = new Date(booking.booking_end_time);
      if (now > endTime) {
        return 'bg-orange-100 text-orange-800 border-orange-300'; // Show as expired
      }
    }
    
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'active':
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };
  
  /**
   * Get display status text
   */
  const getDisplayStatus = (booking) => {
    const status = booking.booking_status;
    
    // Check for overstay - includes active bookings past end time
    if (status === 'overstay') {
      return 'OVERSTAY';
    }
    
    // Check if active booking is past end time (overstay)
    if (status === 'active') {
      const now = new Date();
      const endTime = new Date(booking.booking_end_time);
      if (now > endTime) {
        return 'OVERSTAY';
      }
    }
    
    return status.toUpperCase();
  };

  const userTypeBadge = getUserTypeBadge();
  const BadgeIcon = userTypeBadge.icon;

  // Loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-indigo-600 text-5xl mx-auto mb-4" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Welcome back, {user.name || user.email}!
              </h1>
              <div className="flex items-center flex-wrap gap-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${userTypeBadge.color}`}>
                  <BadgeIcon className="mr-2" />
                  {userTypeBadge.label}
                </span>
                {organization && (user.user_type === 'organization_member' || user.user_type === 'watchman') && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/20 border border-white/30">
                    <FaMapMarkerAlt className="mr-2" />
                    {organization.org_name}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-8">
            {/* Hero Section - Different for each user type */}
            {user?.user_type === 'organization_member' && (
              <div className="bg-gradient-to-r from-green-400 to-green-600 rounded-2xl shadow-xl p-8 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Book Your Free Parking</h2>
                    <p className="text-green-50 mb-4">
                      As an organization member, you enjoy complimentary parking. Just reserve your slot in advance!
                    </p>
                    <button
                      onClick={() => navigate('/booking/new')}
                      className="bg-white text-green-600 px-6 py-3 rounded-lg font-semibold hover:bg-green-50 transition-all transform hover:scale-105 shadow-lg"
                    >
                      <FaPlus className="inline mr-2" />
                      Book Free Parking
                    </button>
                  </div>
                  <FaShieldAlt className="hidden md:block text-9xl opacity-20" />
                </div>
              </div>
            )}

            {user?.user_type === 'visitor' && (
              <div className="bg-gradient-to-r from-blue-400 to-blue-600 rounded-2xl shadow-xl p-8 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold mb-2">Book Parking</h2>
                    <p className="text-blue-50 mb-4">
                      Find and book parking at partnered organizations
                    </p>
                    <div className="bg-white bg-opacity-20 rounded-lg p-4 mb-4 backdrop-blur">
                      <div className="flex items-center text-sm">
                        <FaRupeeSign className="mr-2" />
                        <span>Hourly rates vary by organization</span>
                      </div>
                      <div className="flex items-center text-sm mt-2">
                        <FaCreditCard className="mr-2" />
                        <span>Cash & Online payments accepted</span>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate('/booking/new')}
                      className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-all transform hover:scale-105 shadow-lg"
                    >
                      <FaPlus className="inline mr-2" />
                      Book Parking Now
                    </button>
                  </div>
                  <FaCar className="hidden md:block text-9xl opacity-20" />
                </div>
              </div>
            )}

            {user?.user_type === 'walk_in' && (
              <div className="bg-gradient-to-r from-orange-400 to-orange-600 rounded-2xl shadow-xl p-8 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Need Immediate Parking?</h2>
                    <p className="text-orange-50 mb-4">
                      Our watchman will assist you with immediate slot assignment
                    </p>
                    <div className="bg-white bg-opacity-20 rounded-lg p-3 mb-4 backdrop-blur">
                      <div className="flex items-center">
                        <FaClock className="mr-2" />
                        <span className="text-sm">Estimated wait time: ~5 minutes</span>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate('/help')}
                      className="bg-white text-orange-600 px-6 py-3 rounded-lg font-semibold hover:bg-orange-50 transition-all transform hover:scale-105 shadow-lg"
                    >
                      <FaQuestionCircle className="inline mr-2" />
                      Request Assistance
                    </button>
                  </div>
                  <FaWalking className="hidden md:block text-9xl opacity-20" />
                </div>
              </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-indigo-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-medium">Total Bookings</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
                  </div>
                  <div className="bg-indigo-100 rounded-full p-3">
                    <FaTicketAlt className="text-indigo-600 text-2xl" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-medium">Active Bookings</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{stats.active}</p>
                  </div>
                  <div className="bg-green-100 rounded-full p-3">
                    <FaParking className="text-green-600 text-2xl" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-medium">Completed</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{stats.completed}</p>
                  </div>
                  <div className="bg-blue-100 rounded-full p-3">
                    <FaCheckCircle className="text-blue-600 text-2xl" />
                  </div>
                </div>
              </div>
            </div>

            {/* Active Bookings Section */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <FaParking className="mr-2 text-indigo-600" />
                Active Bookings
              </h3>

              {activeBookings.length === 0 ? (
                <div className="text-center py-12">
                  <FaCar className="text-gray-300 text-6xl mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No active parking right now</p>
                  <button
                    onClick={() => navigate('/booking/new')}
                    className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    Book a parking slot →
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {activeBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="border-2 border-indigo-200 rounded-lg p-5 hover:shadow-lg transition-all"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-semibold text-lg text-gray-900">
                            {booking.org_name || 'Organization'}
                          </h4>
                          <p className="text-sm text-gray-500">
                            <FaMapMarkerAlt className="inline mr-1" />
                            Slot: {booking.slot_number || 'N/A'}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(booking)}`}>
                          {getDisplayStatus(booking)}
                        </span>
                      </div>

                      <div className="space-y-2 mb-4">
                        <p className="text-sm text-gray-600">
                          <FaClock className="inline mr-2 text-gray-400" />
                          {formatDateTime(booking.booking_start_time)}
                        </p>
                        <p className="text-sm text-gray-600">
                          <FaCar className="inline mr-2 text-gray-400" />
                          {booking.vehicle_number}
                        </p>
                        {/* Amount - Hide for organization members (free parking) */}
                        {user?.user_type !== 'organization_member' && booking.amount > 0 && (
                          <p className="text-sm text-gray-600">
                            <FaRupeeSign className="inline mr-2 text-gray-400" />
                            Amount: ₹{booking.amount}
                          </p>
                        )}
                      </div>

                      {/* QR Code Display */}
                      {booking.qr_code_data && (
                        <div className="bg-gray-50 rounded-lg p-4 mb-4 text-center">
                          <img
                            src={booking.qr_code_data}
                            alt="Booking QR Code"
                            className="w-32 h-32 mx-auto mb-2"
                          />
                          <button
                            onClick={() => setSelectedQR(booking)}
                            className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center justify-center mx-auto"
                          >
                            <FaExpand className="mr-1" />
                            Show Full QR
                          </button>
                        </div>
                      )}

                      <div className="flex space-x-3">
                        <button
                          onClick={() => navigate(`/booking/${booking.id}/qr`)}
                          className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-all text-sm font-medium"
                        >
                          Show QR
                        </button>
                        
                        {/* Show Cancel only for CONFIRMED bookings (before they start) */}
                        {booking.booking_status === 'confirmed' && (
                          <button
                            onClick={() => handleCancelBooking(booking.id, booking.org_name)}
                            disabled={actionLoading}
                            className="flex-1 bg-red-100 text-red-600 py-2 rounded-lg hover:bg-red-200 transition-all text-sm font-medium disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        )}
                        
                        {/* Show Extend for ACTIVE bookings (during parking) */}
                        {booking.booking_status === 'active' && (
                          <button
                            onClick={() => navigate(`/booking/${booking.id}/extend`)}
                            className="flex-1 bg-blue-100 text-blue-600 py-2 rounded-lg hover:bg-blue-200 transition-all text-sm font-medium"
                          >
                            Extend
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Booking History Section */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <FaHistory className="mr-2 text-indigo-600" />
                Booking History
              </h3>

              {bookings.length === 0 ? (
                <div className="text-center py-12">
                  <FaCalendarAlt className="text-gray-300 text-6xl mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No booking history yet</p>
                  <p className="text-gray-400 text-sm mt-2">Your past bookings will appear here</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Organization
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Vehicle
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Slot
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Duration
                        </th>
                        {/* Amount column - Hide for organization members */}
                        {user?.user_type !== 'organization_member' && (
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                        )}
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {bookings.slice(0, 10).map((booking) => (
                        <tr key={booking.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(booking.booking_start_time).toLocaleDateString('en-IN')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {booking.org_name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {booking.vehicle_number}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {booking.slot_number || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {booking.duration_hours ? `${booking.duration_hours}h` : '-'}
                          </td>
                          {/* Amount column - Hide for organization members */}
                          {user?.user_type !== 'organization_member' && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              ₹{booking.amount || 0}
                            </td>
                          )}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusBadge(booking)}`}>
                              {getDisplayStatus(booking)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/book-parking')}
                  className="w-full flex items-center justify-center bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md transform hover:scale-105"
                >
                  <FaPlus className="mr-2" />
                  New Booking
                </button>

                <button
                  onClick={() => navigate('/profile')}
                  className="w-full flex items-center justify-center bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-all"
                >
                  <FaUser className="mr-2" />
                  View Profile
                </button>

                {/* Payment History - Hide for organization members (they have free parking) */}
                {user?.user_type !== 'organization_member' && (
                  <button
                    onClick={() => navigate('/payment-history')}
                    className="w-full flex items-center justify-center bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-all"
                  >
                    <FaCreditCard className="mr-2" />
                    Payment History
                  </button>
                )}

                <button
                  onClick={() => navigate('/help-support')}
                  className="w-full flex items-center justify-center bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-all"
                >
                  <FaQuestionCircle className="mr-2" />
                  Help & Support
                </button>
              </div>
            </div>

            {/* Info Card for Organization Members */}
            {user?.user_type === 'organization_member' && (
              <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 rounded-xl p-6">
                <div className="flex items-start">
                  <FaShieldAlt className="text-green-600 text-3xl mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-green-900 mb-2">Member Benefit</h4>
                    <p className="text-sm text-green-800">
                      Enjoy free parking at your organization. No charges apply!
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {selectedQR && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedQR(null)}
        >
          <div className="bg-white rounded-2xl p-8 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Your Parking QR Code</h3>
              <div className="bg-gray-50 rounded-lg p-6 mb-4">
                <img
                  src={selectedQR.qr_code_data}
                  alt="Booking QR Code"
                  className="w-64 h-64 mx-auto"
                />
              </div>
              <div className="text-left bg-indigo-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-700">
                  <strong>Organization:</strong> {selectedQR.org_name}
                </p>
                <p className="text-sm text-gray-700 mt-1">
                  <strong>Slot:</strong> {selectedQR.slot_number}
                </p>
                <p className="text-sm text-gray-700 mt-1">
                  <strong>Vehicle:</strong> {selectedQR.vehicle_number}
                </p>
              </div>
              <p className="text-xs text-gray-500 mb-4">
                Show this QR code to the watchman at entry and exit
              </p>
              <button
                onClick={() => setSelectedQR(null)}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default UserDashboard;
