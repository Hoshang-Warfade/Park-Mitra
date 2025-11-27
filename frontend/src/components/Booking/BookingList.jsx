// Booking List Component - Comprehensive View
import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import bookingService from '../../services/bookingService';
import { 
  FaSearch, 
  FaQrcode, 
  FaTimes, 
  FaCalendarAlt,
  FaCar,
  FaClock,
  FaMoneyBillWave,
  FaBuilding,
  FaChevronLeft,
  FaChevronRight,
  FaDownload,
  FaParking,
  FaCheckCircle,
  FaBan,
  FaHourglassHalf,
  FaPlus,
  FaExclamationTriangle
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import LoadingSpinner from '../Common/LoadingSpinner';

const BookingList = () => {
  const { user } = useContext(AuthContext);
  
  // State management
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [extensionHours, setExtensionHours] = useState(1);
  const [extensionInfo, setExtensionInfo] = useState(null);
  const [checkingExtension, setCheckingExtension] = useState(false);
  const itemsPerPage = 10;

  // Fetch bookings on component mount
  useEffect(() => {
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Apply filters, search, and sort when dependencies change
  useEffect(() => {
    applyFiltersAndSort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookings, filter, sortBy, searchTerm]);

  // Fetch all user bookings
  const fetchBookings = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // First, auto-expire any bookings that have passed their end time
      try {
        await bookingService.autoExpireBookings();
      } catch (error) {
        console.error('Error auto-expiring bookings:', error);
        // Continue even if auto-expire fails
      }
      
      // Then fetch bookings
      const bookingsArray = await bookingService.getUserBookings(user.id);
      setBookings(bookingsArray || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to load bookings');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  // Apply filters, search, and sorting
  const applyFiltersAndSort = () => {
    let result = [...bookings];

    // Apply status filter
    if (filter !== 'all') {
      result = result.filter(booking => {
        // For 'active' filter, exclude expired bookings
        if (filter === 'active') {
          const now = new Date();
          const endTime = new Date(booking.booking_end_time);
          const isExpired = now > endTime;
          return booking.booking_status === filter && !isExpired;
        }
        // For 'overstay' filter, show overstay status OR completed with penalty
        if (filter === 'overstay') {
          return booking.booking_status === 'overstay' || 
                 (booking.booking_status === 'completed' && booking.penalty_amount && booking.penalty_amount > 0);
        }
        return booking.booking_status === filter;
      });
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      result = result.filter(booking => 
        booking.org_name?.toLowerCase().includes(search) ||
        booking.vehicle_number?.toLowerCase().includes(search) ||
        booking.slot_number?.toLowerCase().includes(search)
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          // Sort by booking start time (most recent first)
          const dateA = new Date(a.booking_start_time || a.created_at);
          const dateB = new Date(b.booking_start_time || b.created_at);
          return dateB - dateA;
        case 'organization':
          // Sort alphabetically by organization name
          return (a.org_name || '').localeCompare(b.org_name || '');
        case 'amount':
          // Sort by amount (highest first)
          return (b.amount || 0) - (a.amount || 0);
        default:
          return 0;
      }
    });

    setFilteredBookings(result);
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Handle filter change
  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
  };

  // Handle search
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle sort change
  const handleSort = (e) => {
    setSortBy(e.target.value);
  };

  // Check if booking can be cancelled (before start time - 5 min buffer)
  const canCancelBooking = (booking) => {
    const now = new Date();
    const startTime = new Date(booking.booking_start_time);
    const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
    return now < (startTime.getTime() - bufferTime);
  };

  // Handle cancel booking
  const handleCancelBooking = async () => {
    if (!selectedBookingId) return;

    try {
      await bookingService.updateBookingStatus(selectedBookingId, 'cancelled');
      toast.success('Booking cancelled successfully. Refund will be processed.');
      setShowCancelModal(false);
      setSelectedBookingId(null);
      setSelectedBooking(null);
      fetchBookings(); // Refresh list
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error(error.response?.data?.message || 'Failed to cancel booking');
    }
  };

  // Handle mark as complete
  const handleMarkComplete = async (bookingId) => {
    try {
      await bookingService.updateBookingStatus(bookingId, 'completed');
      toast.success('Booking marked as completed. Slot released successfully!');
      fetchBookings(); // Refresh list
    } catch (error) {
      console.error('Error marking booking as complete:', error);
      toast.error(error.response?.data?.message || 'Failed to mark booking as complete');
    }
  };

  // Open cancel confirmation modal
  const openCancelModal = (booking) => {
    // Check if booking can be cancelled
    if (!canCancelBooking(booking)) {
      toast.error('Cannot cancel booking within 5 minutes of start time or after booking has started.');
      return;
    }
    setSelectedBooking(booking);
    setSelectedBookingId(booking.id);
    setShowCancelModal(true);
  };

  // Open extend booking modal
  const openExtendModal = async (booking) => {
    setSelectedBooking(booking);
    setSelectedBookingId(booking.id);
    setExtensionHours(1);
    setExtensionInfo(null);
    setShowExtendModal(true);
    
    // Check extension availability for default 1 hour
    await checkExtensionAvailability(booking.id, 1);
  };

  // Check if extension is available
  const checkExtensionAvailability = async (bookingId, hours) => {
    try {
      setCheckingExtension(true);
      const result = await bookingService.checkExtension(bookingId, hours);
      
      // The result is already the data object (interceptor + service extracts it)
      setExtensionInfo(result);
    } catch (error) {
      console.error('❌ Error checking extension:', error);
      console.error('Error details:', error.response?.data);
      toast.error(error.message || 'Failed to check extension availability');
      setExtensionInfo(null);
    } finally {
      setCheckingExtension(false);
    }
  };

  // Handle extension hours change
  const handleExtensionHoursChange = async (hours) => {
    setExtensionHours(hours);
    if (selectedBookingId) {
      await checkExtensionAvailability(selectedBookingId, hours);
    }
  };

  // Handle extend booking
  const handleExtendBooking = async () => {
    if (!selectedBookingId || !extensionInfo) {
      return;
    }

    // If slot is not available, show warning
    if (!extensionInfo.can_extend_same_slot) {
      toast.error('This slot is booked by another user for the requested time. Please cancel this booking and create a new one.');
      return;
    }

    try {
      await bookingService.extendBooking(selectedBookingId, extensionHours);
      toast.success(`Booking extended by ${extensionHours} hour(s) successfully!`);
      setShowExtendModal(false);
      setSelectedBookingId(null);
      setSelectedBooking(null);
      setExtensionInfo(null);
      fetchBookings(); // Refresh list
    } catch (error) {
      console.error('Error extending booking:', error);
      toast.error(error.message || 'Failed to extend booking');
    }
  };

  // Check if booking is expired or overstay
  const isBookingExpired = (booking) => {
    // If already marked as overstay in database, it's expired
    if (booking.booking_status === 'overstay') return true;
    
    // Check if active booking has passed end time
    const now = new Date();
    const endTime = new Date(booking.booking_end_time);
    return now > endTime && booking.booking_status === 'active';
  };

  // Check if booking is expiring soon (within 30 minutes)
  const isBookingExpiringSoon = (booking) => {
    if (booking.booking_status !== 'active') return false;
    const now = new Date();
    const endTime = new Date(booking.booking_end_time);
    const diff = endTime - now;
    return diff > 0 && diff <= 30 * 60 * 1000; // 30 minutes
  };

  // Export bookings to CSV
  const exportToCSV = () => {
    // Helper function to escape CSV fields
    const escapeCSV = (value) => {
      if (value === null || value === undefined) return '';
      const stringValue = String(value);
      // If value contains comma, quotes, or newlines, wrap in quotes and escape existing quotes
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    // Hide amount column for organization members
    const headers = user?.user_type === 'organization_member'
      ? ['Date', 'Organization', 'Vehicle', 'Slot', 'Duration', 'Status']
      : ['Date', 'Organization', 'Vehicle', 'Slot', 'Duration', 'Amount', 'Status'];
    
    const csvData = filteredBookings.map(booking => {
      const baseData = [
        escapeCSV(formatDate(booking.booking_start_time)),
        escapeCSV(booking.org_name || 'N/A'),
        escapeCSV(booking.vehicle_number || 'N/A'),
        escapeCSV(booking.slot_number || 'N/A'),
        escapeCSV(`${booking.duration_hours || 0} hrs`)
      ];
      
      // Add amount only for non-organization members
      if (user?.user_type !== 'organization_member') {
        baseData.push(escapeCSV(booking.amount || 0));
      }
      
      baseData.push(escapeCSV(booking.booking_status || 'N/A'));
      return baseData;
    });

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `parkmitra_bookings_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Bookings exported successfully');
  };

  // Calculate statistics
  const stats = {
    total: bookings.length,
    active: bookings.filter(b => {
      if (b.booking_status !== 'active') return false;
      // Exclude expired bookings from active count
      const now = new Date();
      const endTime = new Date(b.booking_end_time);
      return now <= endTime;
    }).length,
    completed: bookings.filter(b => b.booking_status === 'completed').length,
    cancelled: bookings.filter(b => b.booking_status === 'cancelled').length,
    overstay: bookings.filter(b => {
      // Count overstay status bookings + active bookings past end time
      if (b.booking_status === 'overstay') return true;
      if (b.booking_status === 'active') {
        const now = new Date();
        const endTime = new Date(b.booking_end_time);
        return now > endTime;
      }
      return false;
    }).length
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBookings = filteredBookings.slice(startIndex, endIndex);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Get status badge style
  const getStatusBadge = (booking) => {
    const status = booking.booking_status;
    const expired = isBookingExpired(booking);
    const expiringSoon = isBookingExpiringSoon(booking);
    
    const styles = {
      active: 'bg-green-100 text-green-800 border-green-200',
      completed: 'bg-blue-100 text-blue-800 border-blue-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
      confirmed: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      pending: 'bg-gray-100 text-gray-800 border-gray-200',
      expired: 'bg-red-100 text-red-800 border-red-200',
      expiring: 'bg-orange-100 text-orange-800 border-orange-200',
      overstay: 'bg-red-100 text-red-800 border-red-200 animate-pulse'
    };

    const icons = {
      active: <FaCheckCircle className="inline mr-1" />,
      completed: <FaCheckCircle className="inline mr-1" />,
      cancelled: <FaBan className="inline mr-1" />,
      confirmed: <FaHourglassHalf className="inline mr-1" />,
      pending: <FaClock className="inline mr-1" />,
      expired: <FaExclamationTriangle className="inline mr-1" />,
      expiring: <FaClock className="inline mr-1 animate-pulse" />,
      overstay: <FaExclamationTriangle className="inline mr-1" />
    };

    // Determine display status
    let displayStatus = status;
    let statusClass = styles[status] || styles.pending;
    let icon = icons[status] || icons.pending;

    // OVERSTAY (Parking Violation) has highest priority - includes expired active bookings
    if (status === 'overstay' || (expired && status === 'active')) {
      displayStatus = 'OVERSTAY - PENALTY APPLIES';
      statusClass = styles.overstay;
      icon = icons.overstay;
    } else if (expiringSoon) {
      displayStatus = 'EXPIRING SOON';
      statusClass = styles.expiring;
      icon = icons.expiring;
    }

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${statusClass}`}>
        {icon}
        {displayStatus?.toUpperCase() || 'PENDING'}
      </span>
    );
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <LoadingSpinner size="large" message="Loading your bookings..." fullScreen={false} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Bookings</h1>
          <p className="text-gray-600">View and manage all your parking bookings</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-indigo-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Bookings</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <FaCalendarAlt className="text-4xl text-indigo-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active</p>
                <p className="text-3xl font-bold text-gray-900">{stats.active}</p>
              </div>
              <FaCheckCircle className="text-4xl text-green-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Completed</p>
                <p className="text-3xl font-bold text-gray-900">{stats.completed}</p>
              </div>
              <FaCheckCircle className="text-4xl text-blue-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Cancelled</p>
                <p className="text-3xl font-bold text-gray-900">{stats.cancelled}</p>
              </div>
              <FaBan className="text-4xl text-red-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Overstay</p>
                <p className="text-3xl font-bold text-gray-900">{stats.overstay}</p>
                <p className="text-xs text-orange-600 mt-1">Penalty Applies</p>
              </div>
              <FaExclamationTriangle className="text-4xl text-orange-500 opacity-20 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Filters and Search Section */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="grid lg:grid-cols-3 gap-4">
            
            {/* Search Input */}
            <div className="lg:col-span-1">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by organization, vehicle, or slot..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="lg:col-span-1">
              <div className="flex flex-wrap gap-2">
                {['all', 'active', 'completed', 'cancelled', 'overstay'].map(filterOption => (
                  <button
                    key={filterOption}
                    onClick={() => handleFilterChange(filterOption)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      filter === filterOption
                        ? filterOption === 'overstay' 
                          ? 'bg-orange-600 text-white shadow-md'
                          : 'bg-indigo-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort and Export */}
            <div className="lg:col-span-1 flex gap-2">
              <select
                value={sortBy}
                onChange={handleSort}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="date">Sort by Date</option>
                <option value="organization">Sort by Organization</option>
                {/* Hide sort by amount for organization members */}
                {user?.user_type !== 'organization_member' && (
                  <option value="amount">Sort by Amount</option>
                )}
              </select>

              <button
                onClick={exportToCSV}
                disabled={filteredBookings.length === 0}
                className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                title="Export to CSV"
              >
                <FaDownload />
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bookings List */}
        {currentBookings.length === 0 ? (
          // Empty State
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="bg-gray-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaParking className="text-5xl text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                {searchTerm || filter !== 'all' ? 'No Bookings Found' : 'No Bookings Yet'}
              </h3>
              <p className="text-gray-600 mb-8">
                {searchTerm || filter !== 'all' 
                  ? 'Try adjusting your filters or search terms'
                  : 'Start by booking a parking spot for your next visit'
                }
              </p>
              {!searchTerm && filter === 'all' && (
                <Link
                  to="/book-parking"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg"
                >
                  <FaCalendarAlt />
                  Book Parking Now
                </Link>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block bg-white rounded-xl shadow-md overflow-hidden mb-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Organization
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Vehicle
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Slot
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Duration
                      </th>
                      {/* Amount column - Hide for organization members (free parking) */}
                      {user?.user_type !== 'organization_member' && (
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Amount
                        </th>
                      )}
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {currentBookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm">
                            <FaCalendarAlt className="text-gray-400 mr-2" />
                            <span className="text-gray-900">{formatDate(booking.booking_start_time)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center text-sm">
                            <FaBuilding className="text-gray-400 mr-2" />
                            <span className="text-gray-900 font-medium">{booking.org_name || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm">
                            <FaCar className="text-gray-400 mr-2" />
                            <span className="text-gray-900 font-mono">{booking.vehicle_number || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">
                            <span className="text-gray-900 font-semibold">{booking.slot_number || 'N/A'}</span>
                            {booking.parking_lot_name && (
                              <div className="text-xs text-gray-500">@ {booking.parking_lot_name}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm">
                            <FaClock className="text-gray-400 mr-2" />
                            <span className="text-gray-900">{booking.duration_hours || 0} hrs</span>
                          </div>
                        </td>
                        {/* Amount column - Hide for organization members (free parking) */}
                        {user?.user_type !== 'organization_member' && (
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-sm font-semibold">
                              <FaMoneyBillWave className="text-green-500 mr-2" />
                              <span className="text-gray-900">₹{booking.amount || 0}</span>
                            </div>
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(booking)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {/* Show actions for active and confirmed bookings */}
                            {(booking.booking_status === 'active' || booking.booking_status === 'confirmed') && !isBookingExpired(booking) && (
                              <>
                                {/* Show QR Code only for ACTIVE bookings */}
                                {booking.booking_status === 'active' && (
                                  <Link
                                    to={`/booking/${booking.id}/qr`}
                                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                    title="Show QR Code"
                                  >
                                    <FaQrcode />
                                  </Link>
                                )}
                                
                                {/* Show Extend button for active bookings only */}
                                {booking.booking_status === 'active' && (
                                  <button
                                    onClick={() => openExtendModal(booking)}
                                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                    title="Extend Booking"
                                  >
                                    <FaPlus />
                                  </button>
                                )}
                                
                                {/* After booking starts (active), show Mark Complete */}
                                {booking.booking_status === 'active' && !canCancelBooking(booking) ? (
                                  <button
                                    onClick={() => handleMarkComplete(booking.id)}
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Mark as Complete (Release Slot)"
                                  >
                                    <FaCheckCircle />
                                  </button>
                                ) : (
                                  /* Show Cancel button for confirmed bookings or active bookings before start time */
                                  <button
                                    onClick={() => openCancelModal(booking)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Cancel Booking (Get Refund)"
                                  >
                                    <FaTimes />
                                  </button>
                                )}
                              </>
                            )}
                            {/* For OVERSTAY (parking violation) - Show Pay Penalty option */}
                            {(booking.booking_status === 'overstay' || (booking.booking_status === 'active' && isBookingExpired(booking))) && (
                              <Link
                                to={`/pay-penalty/${booking.id}`}
                                className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors font-medium text-xs flex items-center gap-1"
                                title="Pay Penalty & Book New Slot"
                              >
                                <FaExclamationTriangle />
                                Pay Penalty
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4 mb-6">
              {currentBookings.map((booking) => (
                <div key={booking.id} className="bg-white rounded-xl shadow-md p-6 border-l-4 border-indigo-500">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
                        <FaBuilding className="text-indigo-600" />
                        {booking.org_name || 'N/A'}
                      </h3>
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <FaCalendarAlt />
                        {formatDate(booking.booking_start_time)}
                      </p>
                    </div>
                    {getStatusBadge(booking)}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Vehicle</p>
                      <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <FaCar className="text-gray-400" />
                        {booking.vehicle_number || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Slot</p>
                      <div className="text-sm">
                        <p className="font-semibold text-gray-900">{booking.slot_number || 'N/A'}</p>
                        {booking.parking_lot_name && (
                          <p className="text-xs text-gray-500">@ {booking.parking_lot_name}</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Duration</p>
                      <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <FaClock className="text-gray-400" />
                        {booking.duration_hours || 0} hrs
                      </p>
                    </div>
                    {/* Amount - Hide for organization members (free parking) */}
                    {user?.user_type !== 'organization_member' && (
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Amount</p>
                        <p className="text-sm font-semibold text-green-600 flex items-center gap-2">
                          <FaMoneyBillWave />
                          ₹{booking.amount || 0}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Show overstay warning */}
                  {booking.booking_status === 'overstay' && (
                    <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 animate-pulse">
                      <FaExclamationTriangle className="text-red-600" />
                      <span className="text-sm text-red-600 font-medium">OVERSTAY - Penalty applies! Mark complete immediately.</span>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {/* Show actions for active and confirmed bookings */}
                    {(booking.booking_status === 'active' || booking.booking_status === 'confirmed') && !isBookingExpired(booking) && (
                      <>
                        {/* Show QR Code only for ACTIVE bookings */}
                        {booking.booking_status === 'active' && (
                          <Link
                            to={`/booking/${booking.id}/qr`}
                            className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                          >
                            <FaQrcode />
                            Show QR
                          </Link>
                        )}
                        
                        {/* Show Extend button for active bookings only */}
                        {booking.booking_status === 'active' && (
                          <button
                            onClick={() => openExtendModal(booking)}
                            className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                            title="Extend"
                          >
                            <FaPlus />
                          </button>
                        )}
                        
                        {/* After booking starts (active), show Mark Complete */}
                        {booking.booking_status === 'active' && !canCancelBooking(booking) ? (
                          <button
                            onClick={() => handleMarkComplete(booking.id)}
                            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <FaCheckCircle />
                            Mark Complete
                          </button>
                        ) : (
                          /* Show Cancel button for confirmed bookings or active bookings before start time */
                          <button
                            onClick={() => openCancelModal(booking)}
                            className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                            title="Cancel (Refund)"
                          >
                            <FaTimes />
                            Cancel
                          </button>
                        )}
                      </>
                    )}
                    {/* For OVERSTAY (parking violation) - Show Pay Penalty option */}
                    {(booking.booking_status === 'overstay' || (booking.booking_status === 'active' && isBookingExpired(booking))) && (
                      <Link
                        to={`/pay-penalty/${booking.id}`}
                        className="flex-1 flex items-center justify-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                      >
                        <FaExclamationTriangle />
                        Pay Penalty & Book New Slot
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <p className="text-sm text-gray-600">
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredBookings.length)} of {filteredBookings.length} bookings
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <FaChevronLeft />
                    </button>

                    <div className="flex gap-1">
                      {[...Array(totalPages)].map((_, index) => {
                        const page = index + 1;
                        // Show first page, last page, current page, and pages around current
                        if (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                          return (
                            <button
                              key={page}
                              onClick={() => goToPage(page)}
                              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                currentPage === page
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {page}
                            </button>
                          );
                        } else if (
                          page === currentPage - 2 ||
                          page === currentPage + 2
                        ) {
                          return <span key={page} className="px-2 text-gray-400">...</span>;
                        }
                        return null;
                      })}
                    </div>

                    <button
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <FaChevronRight />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-fade-in">
            <div className="text-center mb-6">
              <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaTimes className="text-red-600 text-3xl" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Cancel Booking?</h3>
              <p className="text-gray-600">
                Are you sure you want to cancel this booking? You will receive a full refund as you are cancelling before the booking start time.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setSelectedBookingId(null);
                }}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Keep Booking
              </button>
              <button
                onClick={handleCancelBooking}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Extend Booking Modal */}
      {showExtendModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-fade-in">
            <div className="text-center mb-6">
              <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaPlus className="text-indigo-600 text-3xl" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Extend Booking</h3>
              <p className="text-gray-600 text-sm">
                {selectedBooking.org_name} - Slot {selectedBooking.slot_number}
              </p>
            </div>

            {/* Current booking info */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-600">Current End Time</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(selectedBooking.booking_end_time).toLocaleString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Current Amount</p>
                  <p className="font-semibold text-green-600">₹{selectedBooking.amount}</p>
                </div>
              </div>
            </div>

            {/* Extension hours selector */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Extend by (hours)
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((hours) => (
                  <button
                    key={hours}
                    onClick={() => handleExtensionHoursChange(hours)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      extensionHours === hours
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {hours}h
                  </button>
                ))}
              </div>
            </div>

            {/* Extension info */}
            {checkingExtension && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-600">Checking availability...</p>
              </div>
            )}

            {extensionInfo && !checkingExtension && (
              <div className={`mb-4 p-4 rounded-lg border ${
                extensionInfo.can_extend_same_slot
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}>
                {extensionInfo.can_extend_same_slot ? (
                  <>
                    <div className="flex items-start gap-2 mb-3">
                      <FaCheckCircle className="text-green-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-green-800">Slot Available!</p>
                        <p className="text-xs text-green-600">You can extend your booking with the same slot.</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-green-600">New End Time</p>
                        <p className="font-semibold text-green-800">
                          {new Date(extensionInfo.new_end_time).toLocaleString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-green-600">Additional Cost</p>
                        <p className="font-semibold text-green-800">
                          {extensionInfo.additional_amount > 0 ? `₹${extensionInfo.additional_amount}` : 'FREE'}
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-start gap-2">
                    <FaExclamationTriangle className="text-red-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-red-800">Slot Not Available</p>
                      <p className="text-xs text-red-600">
                        This slot is booked by another user for the requested time. 
                        Please cancel this booking and create a new one with a different slot.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowExtendModal(false);
                  setSelectedBookingId(null);
                  setSelectedBooking(null);
                  setExtensionInfo(null);
                }}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleExtendBooking}
                disabled={!extensionInfo || !extensionInfo.can_extend_same_slot || checkingExtension}
                className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {checkingExtension ? 'Checking...' : 'Extend Booking'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingList;
