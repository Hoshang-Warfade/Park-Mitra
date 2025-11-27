import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import organizationService from '../../services/organizationService';
import bookingService from '../../services/bookingService';
import watchmanAdminService from '../../services/watchmanAdminService';
import { getParkingLots } from '../../services/parkingLotService';
import ParkingLotManagement from '../Dashboard/ParkingLotManagement';
import { toast } from 'react-toastify';
import {
  FaTachometerAlt,
  FaCar,
  FaCalendarAlt,
  FaUsers,
  FaChartBar,
  FaCog,
  FaParking,
  FaRupeeSign,
  FaBuilding,
  FaSpinner,
  FaFilter,
  FaSearch,
  FaDownload,
  FaPlus,
  FaSave,
  FaBars,
  FaTimes,
  FaUserShield
} from 'react-icons/fa';

/**
 * OrgAdminDashboard Component
 * Comprehensive admin dashboard for organization parking management
 */
const OrgAdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  // Component state
  const [organization, setOrganization] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [activeBookings, setActiveBookings] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [parkingLots, setParkingLots] = useState([]);
  const [members, setMembers] = useState([]);
  const [watchmen, setWatchmen] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Booking filters state
  const [bookingFilters, setBookingFilters] = useState({
    date: '',
    userType: '',
    status: ''
  });
  
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showAddWatchmanModal, setShowAddWatchmanModal] = useState(false);
  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    mobile: '',
    employee_id: '',
    password: ''
  });
  const [newWatchman, setNewWatchman] = useState({
    name: '',
    email: '',
    mobile: '',
    employee_id: '',
    password: '',
    shift_start: '',
    shift_end: ''
  });

  /**
   * Fetch all dashboard data
   */
  const fetchDashboardData = useCallback(async () => {
    if (!user || !user.organization_id) {
      navigate('/login');
      return;
    }

    try {
      setRefreshing(true);

      // Fetch organization details
      const orgDetails = await organizationService.getOrganizationById(user.organization_id);
      // API returns {success: true, data: {...}}, so we need orgDetails.data
      setOrganization(orgDetails.data || orgDetails);

      // Fetch dashboard data (stats)
      const dashData = await organizationService.getOrganizationDashboard(user.organization_id);
      console.log('🔍 Dashboard API Response:', dashData);
      console.log('🔍 Dashboard Data Object:', dashData.data || dashData);
      // API returns { success: true, data: {...} }, so we need dashData.data
      const finalDashData = dashData.data || dashData;
      console.log('🔍 Setting Dashboard Data:', finalDashData);
      console.log('🔍 total_bookings_today:', finalDashData.total_bookings_today);
      setDashboardData(finalDashData);

      // Fetch active bookings
      const active = await bookingService.getActiveBookings(user.organization_id);
      console.log('🔍 Active Bookings API Response:', active);
      
      // The response structure is { active_bookings: [...], count: n }
      const activeBookingsArray = active?.active_bookings || active?.data?.active_bookings || [];
      console.log('🔍 Active Bookings Array:', activeBookingsArray);
      
      // Filter to keep only truly active bookings (including overstay)
      // A booking is considered occupying a slot if:
      // 1. Status is 'active', 'confirmed', or 'overstay'
      // 2. The booking has started (start time <= now)
      // 3. For non-overstay: not yet ended (end time > now)
      const now = new Date();
      const currentlyActiveBookings = activeBookingsArray.filter(booking => {
        const startTime = new Date(booking.booking_start_time);
        const endTime = new Date(booking.booking_end_time);
        const hasStarted = startTime <= now;
        const notEnded = endTime > now;
        const isOccupyingSlot = 
          (booking.booking_status === 'active' || 
           booking.booking_status === 'confirmed' || 
           booking.booking_status === 'overstay') &&
          hasStarted;
        
        // Overstay bookings still occupy the slot even if past end time
        if (booking.booking_status === 'overstay') {
          return hasStarted;
        }
        
        return isOccupyingSlot && notEnded;
      });
      
      // Filter to keep only the most recent booking per slot (remove duplicates)
      const slotMap = new Map();
      currentlyActiveBookings.forEach(booking => {
        const existing = slotMap.get(booking.slot_number);
        if (!existing || new Date(booking.booking_start_time) > new Date(existing.booking_start_time)) {
          slotMap.set(booking.slot_number, booking);
        }
      });
      const uniqueBookings = Array.from(slotMap.values());
      console.log('🔍 Final Active Bookings Count:', uniqueBookings.length);
      console.log('🔍 Active Bookings (including overstay):', uniqueBookings);
      setActiveBookings(uniqueBookings);

      // Fetch recent bookings
      const allBookings = await bookingService.getOrganizationBookings(user.organization_id, {});
      // The response structure is { bookings: [...], filters: {...} }
      const bookingsArray = allBookings?.bookings || allBookings?.data?.bookings || [];
      setRecentBookings(bookingsArray.slice(0, 10));

      // Fetch parking lots
      try {
        const lotsData = await getParkingLots(user.organization_id, false);
        setParkingLots(lotsData.parking_lots || []);
      } catch (error) {
        console.error('Error fetching parking lots:', error);
        setParkingLots([]);
      }

      // Fetch members
      if (selectedView === 'members') {
        const membersList = await organizationService.getOrganizationMembers(user.organization_id);
        // API returns {success: true, data: {members: [...]}}, so access data.members
        const membersArray = membersList.data?.members || membersList.members || [];
        setMembers(membersArray);
      }

      // Fetch watchmen
      if (selectedView === 'watchmen') {
        const watchmenList = await watchmanAdminService.getOrganizationWatchmen(user.organization_id);
        const watchmenArray = watchmenList.data?.watchmen || watchmenList.watchmen || [];
        setWatchmen(watchmenArray);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      alert('Failed to load dashboard data. Please refresh the page.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, navigate, selectedView]);

  /**
   * Initial data fetch and setup auto-refresh
   */
  useEffect(() => {
    fetchDashboardData();

    // Set up auto-refresh every 30 seconds
    const intervalId = setInterval(() => {
      fetchDashboardData();
    }, 30000);

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, [fetchDashboardData]);

  /**
   * Handle add member
   */
  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      const response = await organizationService.addMember({
        ...newMember,
        organization_id: user.organization_id
      });
      console.log('✅ Add member response:', response);
      // The API interceptor returns response.data directly, so response.message is correct
      const message = response?.message || response?.data?.message || 'Member added successfully!';
      toast.success(message);
      setShowAddMemberModal(false);
      setNewMember({
        name: '',
        email: '',
        mobile: '',
        employee_id: '',
        password: ''
      });
      // Refresh members list
      const membersList = await organizationService.getOrganizationMembers(user.organization_id);
      console.log('🔄 Refreshed members after add:', JSON.stringify(membersList, null, 2));
      console.log('🔄 membersList.data:', membersList.data);
      console.log('🔄 membersList.data.members:', membersList.data?.members);
      console.log('🔄 membersList.members:', membersList.members);
      // API returns {success: true, data: {members: [...]}}, so access data.members
      const membersArray = membersList.data?.members || membersList.members || [];
      console.log('🔄 Final members array:', membersArray);
      console.log('🔄 Members count:', membersArray.length);
      setMembers(membersArray);
    } catch (error) {
      console.error('Error adding member:', error);
      toast.error(error.message || 'Failed to add member');
    }
  };

  /**
   * Handle remove member
   */
  const handleRemoveMember = async (userId, memberName) => {
    try {
      const response = await organizationService.removeMember(userId);
      // The API interceptor returns response.data directly, so response.message is correct
      const message = response?.message || response?.data?.message || 'Member removed successfully!';
      toast.success(message);
      // Refresh members list
      const membersList = await organizationService.getOrganizationMembers(user.organization_id);
      // API returns {success: true, data: {members: [...]}}, so access data.members
      const membersArray = membersList.data?.members || membersList.members || [];
      setMembers(membersArray);
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error(error.message || 'Failed to remove member');
    }
  };

  /**
   * Handle add watchman
   */
  const handleAddWatchman = async (e) => {
    e.preventDefault();
    try {
      const response = await watchmanAdminService.addWatchman({
        ...newWatchman,
        organization_id: user.organization_id
      });
      const message = response?.message || response?.data?.message || 'Watchman added successfully!';
      toast.success(message);
      setShowAddWatchmanModal(false);
      setNewWatchman({
        name: '',
        email: '',
        mobile: '',
        employee_id: '',
        password: '',
        shift_start: '',
        shift_end: ''
      });
      // Refresh watchmen list
      const watchmenList = await watchmanAdminService.getOrganizationWatchmen(user.organization_id);
      const watchmenArray = watchmenList.data?.watchmen || watchmenList.watchmen || [];
      setWatchmen(watchmenArray);
    } catch (error) {
      console.error('Error adding watchman:', error);
      toast.error(error.message || 'Failed to add watchman');
    }
  };

  /**
   * Handle remove watchman
   */
  const handleRemoveWatchman = async (watchmanId, watchmanName) => {
    if (!window.confirm(`Are you sure you want to remove ${watchmanName}?`)) {
      return;
    }
    try {
      const response = await watchmanAdminService.removeWatchman(watchmanId);
      const message = response?.message || response?.data?.message || 'Watchman removed successfully!';
      toast.success(message);
      // Refresh watchmen list
      const watchmenList = await watchmanAdminService.getOrganizationWatchmen(user.organization_id);
      const watchmenArray = watchmenList.data?.watchmen || watchmenList.watchmen || [];
      setWatchmen(watchmenArray);
    } catch (error) {
      console.error('Error removing watchman:', error);
      toast.error(error.message || 'Failed to remove watchman');
    }
  };

  /**
   * Format currency
   */
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  /**
   * Get status badge styling
   */
  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'overstay':
        return 'bg-orange-100 text-orange-800';
      case 'active':
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Menu items
  const menuItems = [
    { id: 'overview', label: 'Overview', icon: FaTachometerAlt },
    { id: 'live-status', label: 'Live Parking Status', icon: FaCar },
    { id: 'parking-lots', label: 'Parking Lots', icon: FaParking },
    { id: 'bookings', label: 'Bookings', icon: FaCalendarAlt },
    { id: 'members', label: 'Members Management', icon: FaUsers },
    { id: 'watchmen', label: 'Watchmen Management', icon: FaUserShield },
    { id: 'analytics', label: 'Analytics', icon: FaChartBar },
    { id: 'settings', label: 'Settings', icon: FaCog }
  ];

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-indigo-600 text-5xl mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`bg-gradient-to-b from-indigo-800 to-indigo-900 text-white transition-all duration-300 ${
        sidebarOpen ? 'w-64' : 'w-20'
      } fixed h-screen overflow-y-auto z-30 shadow-xl flex flex-col`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-indigo-700 flex-shrink-0">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <div className="flex items-center">
                <FaBuilding className="text-2xl mr-2" />
                <span className="font-bold text-lg">Admin Panel</span>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-indigo-700 rounded-lg transition-colors"
            >
              {sidebarOpen ? <FaTimes /> : <FaBars />}
            </button>
          </div>
        </div>

        {/* Organization Info */}
        {sidebarOpen && organization && (
          <div className="p-4 bg-indigo-700 bg-opacity-50 flex-shrink-0">
            <p className="text-xs text-indigo-200 mb-1">Organization</p>
            <p className="font-semibold truncate">{organization.org_name}</p>
          </div>
        )}

        {/* Menu Items */}
        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setSelectedView(item.id)}
                className={`w-full flex items-center px-4 py-3 rounded-lg transition-all ${
                  selectedView === item.id
                    ? 'bg-indigo-600 shadow-lg'
                    : 'hover:bg-indigo-700'
                }`}
              >
                <Icon className="text-xl" />
                {sidebarOpen && <span className="ml-3">{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        {/* Top Bar */}
        <header className="bg-white shadow-sm sticky top-0 z-20">
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {organization?.org_name} - Admin Dashboard
              </h1>
              <p className="text-sm text-gray-500">
                Welcome back, {user?.name || user?.email}
              </p>
            </div>
            {refreshing && (
              <div className="flex items-center text-indigo-600">
                <FaSpinner className="animate-spin mr-2" />
                <span className="text-sm">Refreshing...</span>
              </div>
            )}
          </div>
        </header>

        {/* Content Area */}
        <div className="p-6">
          {/* OVERVIEW VIEW */}
          {selectedView === 'overview' && dashboardData && (
            <div className="space-y-6">
              {/* Stats Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Parking Slots */}
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-indigo-500">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-indigo-100 p-3 rounded-lg">
                      <FaParking className="text-indigo-600 text-2xl" />
                    </div>
                  </div>
                  <h3 className="text-gray-500 text-sm font-medium mb-1">Total Parking Slots</h3>
                  <p className="text-3xl font-bold text-gray-900">{organization.total_slots}</p>
                  <p className="text-sm text-green-600 mt-2">
                    Available: {organization.total_slots - activeBookings.length}
                  </p>
                </div>

                {/* Today's Bookings */}
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <FaCalendarAlt className="text-blue-600 text-2xl" />
                    </div>
                  </div>
                  <h3 className="text-gray-500 text-sm font-medium mb-1">Today's Bookings</h3>
                  <p className="text-3xl font-bold text-gray-900">
                    {dashboardData.total_bookings_today || 0}
                  </p>
                </div>

                {/* Active Parkings */}
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-green-100 p-3 rounded-lg">
                      <FaCar className="text-green-600 text-2xl" />
                    </div>
                  </div>
                  <h3 className="text-gray-500 text-sm font-medium mb-1">Active Parkings</h3>
                  <p className="text-3xl font-bold text-gray-900">
                    {activeBookings.length}
                  </p>
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{
                          width: `${(activeBookings.length / organization.total_slots) * 100}%`
                        }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {((activeBookings.length / organization.total_slots) * 100).toFixed(1)}% Occupancy
                    </p>
                  </div>
                </div>

                {/* Today's Revenue */}
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-yellow-100 p-3 rounded-lg">
                      <FaRupeeSign className="text-yellow-600 text-2xl" />
                    </div>
                  </div>
                  <h3 className="text-gray-500 text-sm font-medium mb-1">Today's Revenue</h3>
                  <p className="text-3xl font-bold text-gray-900">
                    {formatCurrency(dashboardData.today_revenue || 0)}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Members: Free | Visitors: {formatCurrency(dashboardData.today_revenue || 0)}
                  </p>
                </div>
              </div>

              {/* Quick Action Card */}
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold mb-2">🚗 View Live Parking Status</h3>
                    <p className="text-indigo-100 mb-4">
                      See real-time parking slot occupancy, vehicle details, and booking information
                    </p>
                    <button
                      onClick={() => setSelectedView('live-status')}
                      className="px-6 py-2 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-indigo-50 transition-all"
                    >
                      Go to Live Status →
                    </button>
                  </div>
                  <div className="text-right">
                    <FaCar className="text-6xl opacity-20" />
                  </div>
                </div>
              </div>

              {/* Recent Bookings Table */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">Recent Bookings</h3>
                  <button
                    onClick={() => setSelectedView('bookings')}
                    className="text-indigo-600 hover:text-indigo-700 font-medium text-sm"
                  >
                    View All →
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slot</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {recentBookings.map((booking) => (
                        <tr key={booking.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(booking.booking_start_time).toLocaleTimeString('en-IN', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {booking.user_name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {booking.user_type}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {booking.vehicle_number}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {booking.slot_number}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(booking.booking_status)}`}>
                              {booking.booking_status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Bookings Trend (7 Days)</h3>
                  <div className="h-64 flex items-center justify-center text-gray-400">
                    <p>Chart Placeholder - Line Chart</p>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Member vs Visitor Ratio</h3>
                  <div className="h-64 flex items-center justify-center text-gray-400">
                    <p>Chart Placeholder - Pie Chart</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* LIVE PARKING STATUS VIEW */}
          {selectedView === 'live-status' && (
            <div className="space-y-8">
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-90">Total Parking Slots</p>
                      <p className="text-4xl font-bold mt-2">{organization.total_slots}</p>
                    </div>
                    <FaParking className="text-5xl opacity-20" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-90">Available Now</p>
                      <p className="text-4xl font-bold mt-2">{organization.total_slots - activeBookings.length}</p>
                    </div>
                    <FaCar className="text-5xl opacity-20" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-90">Currently Occupied</p>
                      <p className="text-4xl font-bold mt-2">
                        {activeBookings.length}
                      </p>
                    </div>
                    <FaCar className="text-5xl opacity-20" />
                  </div>
                </div>
              </div>

              {/* Parking Lots with Slots */}
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">Live Parking Status by Lot</h2>
                  <button 
                    onClick={fetchDashboardData}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all"
                  >
                    {refreshing ? <FaSpinner className="inline mr-2 animate-spin" /> : null}
                    Refresh Data
                  </button>
                </div>

                {parkingLots.length > 0 ? (
                  parkingLots
                    .filter(lot => lot.is_active)
                    .sort((a, b) => a.priority_order - b.priority_order)
                    .map((lot) => {
                      // Get bookings for this parking lot
                      const lotBookings = activeBookings.filter(b => b.parking_lot_id === lot.lot_id);
                      const occupiedSlots = lotBookings.length;
                      // Calculate available slots dynamically from occupied count
                      const availableSlots = lot.stats?.available_slots ?? (lot.total_slots - occupiedSlots);
                      // Calculate occupancy percentage with 1 decimal place (don't round to 0 if there are occupied slots)
                      const occupancyPercent = lot.total_slots > 0 
                        ? ((occupiedSlots / lot.total_slots) * 100).toFixed(1)
                        : 0;

                      return (
                        <div key={lot.lot_id} className="bg-white rounded-xl shadow-lg p-6">
                          {/* Parking Lot Header */}
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 pb-4 border-b border-gray-200">
                            <div className="flex items-center gap-3">
                              <div className="bg-indigo-100 p-3 rounded-lg">
                                <FaParking className="text-indigo-600 text-2xl" />
                              </div>
                              <div>
                                <h3 className="text-xl font-bold text-gray-900">{lot.lot_name}</h3>
                                {lot.lot_description && (
                                  <p className="text-sm text-gray-600">{lot.lot_description}</p>
                                )}
                                <p className="text-xs text-gray-500 mt-1">Priority: #{lot.priority_order}</p>
                              </div>
                            </div>
                            <div className="mt-4 md:mt-0 flex items-center gap-4">
                              <div className="text-center">
                                <p className="text-2xl font-bold text-green-600">{availableSlots}</p>
                                <p className="text-xs text-gray-600">Available</p>
                              </div>
                              <div className="text-center">
                                <p className="text-2xl font-bold text-red-600">{occupiedSlots}</p>
                                <p className="text-xs text-gray-600">Occupied</p>
                              </div>
                              <div className="text-center">
                                <p className="text-2xl font-bold text-blue-600">{lot.total_slots}</p>
                                <p className="text-xs text-gray-600">Total</p>
                              </div>
                            </div>
                          </div>

                          {/* Occupancy Progress Bar */}
                          <div className="mb-4">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium text-gray-700">Occupancy Rate</span>
                              <span className="text-sm font-bold text-gray-900">{occupancyPercent}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                              <div
                                className={`h-3 rounded-full transition-all ${
                                  occupancyPercent > 80
                                    ? 'bg-red-500'
                                    : occupancyPercent > 50
                                    ? 'bg-yellow-500'
                                    : 'bg-green-500'
                                }`}
                                style={{ width: `${occupancyPercent}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* Slots Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                            {Array.from({ length: lot.total_slots }, (_, i) => {
                              // Generate slot number matching the format: LOT_NAME-NUMBER
                              // Replace spaces with hyphens and truncate to 20 chars (matching backend logic)
                              const lotPrefix = lot.lot_name.replace(/\s+/g, '-').substring(0, 20);
                              const slotNumber = `${lotPrefix}-${i + 1}`;
                              const booking = lotBookings.find(b => b.slot_number === slotNumber);
                              const isOccupied = !!booking;

                              return (
                                <div
                                  key={slotNumber}
                                  className={`p-3 rounded-lg border-2 transition-all cursor-pointer hover:shadow-md ${
                                    isOccupied
                                      ? 'border-red-300 bg-red-50 hover:bg-red-100'
                                      : 'border-green-300 bg-green-50 hover:bg-green-100'
                                  }`}
                                  title={isOccupied ? `Occupied by ${booking.vehicle_number}` : 'Available'}
                                >
                                  <div className="text-center">
                                    <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full mb-2 ${
                                      isOccupied ? 'bg-red-500' : 'bg-green-500'
                                    }`}>
                                      <FaCar className="text-white text-lg" />
                                    </div>
                                    <p className="font-bold text-gray-900 text-xs truncate">{slotNumber}</p>
                                    {isOccupied ? (
                                      <>
                                        <p className="text-[10px] text-red-600 mt-1 font-semibold">● OCCUPIED</p>
                                        <div className="mt-1 pt-1 border-t border-red-200">
                                          <p className="text-[10px] text-gray-700 truncate" title={booking.vehicle_number}>
                                            🚗 {booking.vehicle_number}
                                          </p>
                                        </div>
                                      </>
                                    ) : (
                                      <p className="text-[10px] text-green-600 mt-1 font-semibold">● AVAILABLE</p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })
                ) : (
                  <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                    <FaParking className="text-gray-300 text-6xl mx-auto mb-4" />
                    <p className="text-gray-600 text-lg">No parking lots configured yet</p>
                    <p className="text-gray-500 text-sm mt-2">Go to Parking Lots menu to add parking areas</p>
                  </div>
                )}
              </div>

              {/* Active Bookings Table */}
              <div className="bg-white rounded-xl shadow-lg p-6 mt-8">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Active Bookings Details</h3>
                    <div className="text-sm text-gray-600 bg-gray-100 px-4 py-2 rounded-lg">
                      <span className="font-semibold">Total Active Bookings:</span> {activeBookings.length} | 
                      <span className="font-semibold ml-2">Available Slots:</span> {organization.available_slots}
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slot</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle Number</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User Type</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start Time</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {activeBookings.map((booking) => (
                          <tr key={booking.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {booking.slot_number}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {booking.vehicle_number}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {booking.user_name || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                                {booking.user_type?.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(booking.booking_start_time).toLocaleString('en-IN')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {(() => {
                                const start = new Date(booking.booking_start_time);
                                const now = new Date();
                                const diff = Math.floor((now - start) / 1000 / 60); // minutes
                                const hours = Math.floor(diff / 60);
                                const mins = diff % 60;
                                return `${hours}h ${mins}m`;
                              })()}
                            </td>
                          </tr>
                        ))}
                        {activeBookings.length === 0 && (
                          <tr>
                            <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                              <FaCar className="text-4xl text-gray-300 mx-auto mb-2" />
                              <p>No active bookings at the moment</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
            </div>
          )}

          {/* PARKING LOTS MANAGEMENT VIEW */}
          {selectedView === 'parking-lots' && user && user.organization_id && (
            <div className="space-y-6">
              <ParkingLotManagement organizationId={user.organization_id} />
            </div>
          )}

          {/* BOOKINGS VIEW */}
          {selectedView === 'bookings' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 space-y-4 md:space-y-0">
                  <h2 className="text-2xl font-bold text-gray-900">All Bookings</h2>
                  <div className="flex space-x-3">
                    <button 
                      onClick={() => setBookingFilters({ date: '', userType: '', status: '' })}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all"
                    >
                      <FaTimes className="inline mr-2" />
                      Clear Filters
                    </button>
                    <button className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-all">
                      <FaFilter className="inline mr-2" />
                      Filters Active: {Object.values(bookingFilters).filter(v => v !== '').length}
                    </button>
                    <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all">
                      <FaDownload className="inline mr-2" />
                      Export CSV
                    </button>
                  </div>
                </div>

                <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    type="date"
                    value={bookingFilters.date}
                    onChange={(e) => setBookingFilters({...bookingFilters, date: e.target.value})}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <select 
                    value={bookingFilters.userType}
                    onChange={(e) => setBookingFilters({...bookingFilters, userType: e.target.value})}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">All User Types</option>
                    <option value="organization_member">Organization Member</option>
                    <option value="visitor">Visitor</option>
                    <option value="walk_in">Walk-in</option>
                  </select>
                  <select 
                    value={bookingFilters.status}
                    onChange={(e) => setBookingFilters({...bookingFilters, status: e.target.value})}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="overstay">Overstay</option>
                  </select>
                </div>

                {/* Results count */}
                <div className="mb-4 text-sm text-gray-600">
                  Showing {recentBookings.filter(booking => {
                    if (bookingFilters.date) {
                      const bookingDate = new Date(booking.booking_start_time).toISOString().split('T')[0];
                      if (bookingDate !== bookingFilters.date) return false;
                    }
                    if (bookingFilters.userType && booking.user_type !== bookingFilters.userType) return false;
                    if (bookingFilters.status && booking.booking_status !== bookingFilters.status) return false;
                    return true;
                  }).length} of {recentBookings.length} bookings
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slot</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {recentBookings
                        .filter(booking => {
                          // Date filter
                          if (bookingFilters.date) {
                            const bookingDate = new Date(booking.booking_start_time).toISOString().split('T')[0];
                            if (bookingDate !== bookingFilters.date) {
                              return false;
                            }
                          }
                          
                          // User type filter
                          if (bookingFilters.userType && booking.user_type !== bookingFilters.userType) {
                            return false;
                          }
                          
                          // Status filter
                          if (bookingFilters.status && booking.booking_status !== bookingFilters.status) {
                            return false;
                          }
                          
                          return true;
                        })
                        .map((booking) => (
                        <tr key={booking.id} className="hover:bg-gray-50 cursor-pointer">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">#{booking.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(booking.booking_start_time).toLocaleString('en-IN')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {booking.user_name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {booking.vehicle_number}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {booking.slot_number}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {booking.duration_hours ? `${booking.duration_hours}h` : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ₹{booking.amount || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(booking.booking_status)}`}>
                              {booking.booking_status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {recentBookings.filter(booking => {
                        if (bookingFilters.date) {
                          const bookingDate = new Date(booking.booking_start_time).toISOString().split('T')[0];
                          if (bookingDate !== bookingFilters.date) return false;
                        }
                        if (bookingFilters.userType && booking.user_type !== bookingFilters.userType) return false;
                        if (bookingFilters.status && booking.booking_status !== bookingFilters.status) return false;
                        return true;
                      }).length === 0 && (
                        <tr>
                          <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                            <FaFilter className="mx-auto text-4xl mb-2 text-gray-300" />
                            <p>No bookings match the selected filters</p>
                            <button 
                              onClick={() => setBookingFilters({ date: '', userType: '', status: '' })}
                              className="mt-2 text-indigo-600 hover:text-indigo-800"
                            >
                              Clear filters
                            </button>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* MEMBERS MANAGEMENT VIEW */}
          {selectedView === 'members' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 space-y-4 md:space-y-0">
                  <h2 className="text-2xl font-bold text-gray-900">Members Management</h2>
                  <div className="flex space-x-3">
                    <button 
                      onClick={() => setShowAddMemberModal(true)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all"
                    >
                      <FaPlus className="inline mr-2" />
                      Add New Member
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by name, email, or employee ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mobile</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {members
                        .filter(member => {
                          // Exclude current logged-in user by ID or email
                          console.log('🔍 Filtering member:', {
                            memberId: member.id,
                            memberEmail: member.email,
                            memberType: member.user_type,
                            userId: user.user_id,
                            userIdAlt: user.id,
                            userEmail: user.email,
                            isMatch: member.id === user.user_id || member.id === user.id || member.email === user.email
                          });
                          const isCurrentUser = member.id === user.user_id || 
                                               member.id === user.id || 
                                               member.email === user.email;
                          return !isCurrentUser;
                        })
                        .filter(member => member.user_type !== 'organization_admin') // Exclude all admins
                        .filter(member => 
                          !searchTerm || 
                          member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          member.employee_id?.toLowerCase().includes(searchTerm.toLowerCase())
                        ).map((member) => (
                        <tr key={member.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {member.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {member.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {member.mobile}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {member.employee_id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 capitalize">
                              {member.user_type?.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <button
                              onClick={() => handleRemoveMember(member.id, member.name)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                      {members.filter(member => {
                        const isCurrentUser = member.id === user.user_id || member.id === user.id || member.email === user.email;
                        return !isCurrentUser && member.user_type !== 'organization_admin';
                      }).length === 0 && (
                        <tr>
                          <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                            <FaUsers className="text-5xl text-gray-300 mx-auto mb-2" />
                            <p>No members found. Add your first member to get started.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Add Member Modal */}
          {showAddMemberModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">Add New Member</h3>
                  <button 
                    onClick={() => setShowAddMemberModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FaTimes size={24} />
                  </button>
                </div>

                <form onSubmit={handleAddMember} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input
                      type="text"
                      required
                      value={newMember.name}
                      onChange={(e) => setNewMember({...newMember, name: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input
                      type="email"
                      required
                      value={newMember.email}
                      onChange={(e) => setNewMember({...newMember, email: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="john@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mobile *</label>
                    <input
                      type="tel"
                      required
                      value={newMember.mobile}
                      onChange={(e) => setNewMember({...newMember, mobile: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="9876543210"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID *</label>
                    <input
                      type="text"
                      required
                      value={newMember.employee_id}
                      onChange={(e) => setNewMember({...newMember, employee_id: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="EMP001"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                    <input
                      type="password"
                      required
                      value={newMember.password}
                      onChange={(e) => setNewMember({...newMember, password: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="••••••••"
                    />
                  </div>

                  <div className="flex space-x-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setShowAddMemberModal(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Add Member
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* WATCHMEN MANAGEMENT VIEW */}
          {selectedView === 'watchmen' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 space-y-4 md:space-y-0">
                  <h2 className="text-2xl font-bold text-gray-900">Watchmen Management</h2>
                  <div className="flex space-x-3">
                    <button 
                      onClick={() => setShowAddWatchmanModal(true)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all"
                    >
                      <FaPlus className="inline mr-2" />
                      Add New Watchman
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by name, email, or employee ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mobile</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shift</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {watchmen
                        .filter(watchman => 
                          !searchTerm || 
                          watchman.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          watchman.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          watchman.employee_id?.toLowerCase().includes(searchTerm.toLowerCase())
                        ).map((watchman) => (
                        <tr key={watchman.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {watchman.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {watchman.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {watchman.mobile}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {watchman.employee_id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {watchman.shift_start && watchman.shift_end 
                              ? `${watchman.shift_start} - ${watchman.shift_end}`
                              : 'Not set'
                            }
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              watchman.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {watchman.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <button
                              onClick={() => handleRemoveWatchman(watchman.id, watchman.name)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                      {watchmen.filter(watchman => 
                        !searchTerm || 
                        watchman.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        watchman.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        watchman.employee_id?.toLowerCase().includes(searchTerm.toLowerCase())
                      ).length === 0 && (
                        <tr>
                          <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                            <FaUserShield className="text-5xl text-gray-300 mx-auto mb-2" />
                            <p>No watchmen found. Add your first watchman to get started.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Add Watchman Modal */}
          {showAddWatchmanModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">Add New Watchman</h3>
                  <button 
                    onClick={() => setShowAddWatchmanModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FaTimes size={24} />
                  </button>
                </div>

                <form onSubmit={handleAddWatchman} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input
                      type="text"
                      required
                      value={newWatchman.name}
                      onChange={(e) => setNewWatchman({...newWatchman, name: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input
                      type="email"
                      required
                      value={newWatchman.email}
                      onChange={(e) => setNewWatchman({...newWatchman, email: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="john@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mobile *</label>
                    <input
                      type="tel"
                      required
                      value={newWatchman.mobile}
                      onChange={(e) => setNewWatchman({...newWatchman, mobile: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="9876543210"
                      pattern="[0-9]{10}"
                      title="Please enter 10 digit mobile number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID *</label>
                    <input
                      type="text"
                      required
                      value={newWatchman.employee_id}
                      onChange={(e) => setNewWatchman({...newWatchman, employee_id: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="WM001"
                    />
                    <p className="text-xs text-gray-500 mt-1">Example: WM001, WM002, etc.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                    <input
                      type="password"
                      required
                      value={newWatchman.password}
                      onChange={(e) => setNewWatchman({...newWatchman, password: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="••••••••"
                      minLength="6"
                    />
                    <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Shift Start</label>
                      <input
                        type="time"
                        value={newWatchman.shift_start}
                        onChange={(e) => setNewWatchman({...newWatchman, shift_start: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Shift End</label>
                      <input
                        type="time"
                        value={newWatchman.shift_end}
                        onChange={(e) => setNewWatchman({...newWatchman, shift_end: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                    <p className="text-xs text-blue-800">
                      ℹ️ <strong>Note:</strong> The watchman will use their Employee ID and password to login at <code className="bg-blue-100 px-1 rounded">/member-login</code>
                    </p>
                  </div>

                  <div className="flex space-x-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setShowAddWatchmanModal(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      <FaPlus className="inline mr-2" />
                      Add Watchman
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ANALYTICS VIEW */}
          {selectedView === 'analytics' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 space-y-4 md:space-y-0">
                  <h2 className="text-2xl font-bold text-gray-900">Analytics & Reports</h2>
                  <div className="flex space-x-3">
                    <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      <option>Last 7 Days</option>
                      <option>Last 30 Days</option>
                      <option>Last 3 Months</option>
                      <option>Custom Range</option>
                    </select>
                    <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all">
                      <FaDownload className="inline mr-2" />
                      Export Report
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-4">Bookings Trend</h3>
                    <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
                      <p className="text-gray-400">Line Chart - Daily/Weekly/Monthly</p>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-4">Peak Hours Heatmap</h3>
                    <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
                      <p className="text-gray-400">Heatmap Chart</p>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-4">Member vs Visitor</h3>
                    <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
                      <p className="text-gray-400">Bar Chart Comparison</p>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-4">Revenue Trends</h3>
                    <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
                      <p className="text-gray-400">Area Chart</p>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-4">Average Parking Duration</h3>
                    <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
                      <p className="text-gray-400">Gauge Chart</p>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-4">Occupancy Rate Over Time</h3>
                    <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
                      <p className="text-gray-400">Line Chart</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SETTINGS VIEW */}
          {selectedView === 'settings' && organization && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Organization Settings</h2>

                <div className="space-y-6">
                  {/* Organization Details */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Organization Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Organization Name
                        </label>
                        <input
                          type="text"
                          defaultValue={organization.org_name}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Total Parking Slots
                        </label>
                        <input
                          type="number"
                          defaultValue={organization.total_slots}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Visitor Hourly Rate (₹)
                        </label>
                        <input
                          type="number"
                          defaultValue={organization.visitor_hourly_rate}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Operating Hours
                        </label>
                        <input
                          type="text"
                          defaultValue={organization.operating_hours || '8 AM - 8 PM'}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Parking Rules */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Parking Rules</h3>
                    <textarea
                      rows="6"
                      defaultValue={organization.parking_rules}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Enter parking rules and guidelines..."
                    />
                  </div>

                  {/* Address */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Address</h3>
                    <textarea
                      rows="3"
                      defaultValue={organization.address}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Enter complete address..."
                    />
                  </div>

                  {/* Notification Preferences */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Preferences</h3>
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input type="checkbox" defaultChecked className="mr-3 rounded" />
                        <span className="text-sm text-gray-700">Email notifications for new bookings</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" defaultChecked className="mr-3 rounded" />
                        <span className="text-sm text-gray-700">SMS alerts for slot availability</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="mr-3 rounded" />
                        <span className="text-sm text-gray-700">Daily summary reports</span>
                      </label>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <button className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all">
                      Cancel
                    </button>
                    <button className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all">
                      <FaSave className="inline mr-2" />
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default OrgAdminDashboard;
