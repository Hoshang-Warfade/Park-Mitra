import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import organizationService from '../../services/organizationService';
import bookingService from '../../services/bookingService';
import { getParkingLots } from '../../services/parkingLotService';
import { validateVehicleNumber } from '../../utils/validation';
import {
  FaBuilding,
  FaMapMarkerAlt,
  FaCar,
  FaCalendarAlt,
  FaClock,
  FaRupeeSign,
  FaCheckCircle,
  FaTimesCircle,
  FaSpinner,
  FaShieldAlt,
  FaParking,
  FaMotorcycle,
  FaBicycle,
  FaSearch,
  FaInfoCircle,
  FaExclamationTriangle
} from 'react-icons/fa';

/**
 * BookingForm Component
 * Comprehensive parking booking form with organization selection,
 * vehicle details, scheduling, and price calculation
 */
const BookingForm = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  // Component state
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [parkingLots, setParkingLots] = useState([]);
  const [availableSlots, setAvailableSlots] = useState(0);
  const [formData, setFormData] = useState({
    organization_id: '',
    vehicle_number: '',
    vehicle_type: 'Car',
    booking_start_time: '',
    booking_end_time: '',
    duration_hours: 0
  });
  const [calculatedAmount, setCalculatedAmount] = useState(0);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [availabilityChecked, setAvailabilityChecked] = useState(false);
  const [lastCheckedTime, setLastCheckedTime] = useState(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  /**
   * Fetch all organizations on component mount
   * For members, only show their own organization
   */
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const orgs = await organizationService.getAllOrganizations();
        
        // If user is an organization member, filter to only show their organization
        if (user && user.user_type === 'organization_member' && user.organization_id) {
          const userOrg = orgs.filter(org => org.id === user.organization_id);
          setOrganizations(userOrg);
          
          // Auto-select the user's organization
          if (userOrg.length > 0) {
            setFormData(prev => ({ ...prev, organization_id: userOrg[0].id }));
          }
        } else {
          setOrganizations(orgs);
        }
      } catch (error) {
        console.error('Error fetching organizations:', error);
        setErrors({ general: 'Failed to load organizations. Please refresh the page.' });
      }
    };

    if (user) {
      fetchOrganizations();
    }
  }, [user]);

  /**
   * Redirect if user not logged in
   */
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  /**
   * Fetch organization details and check availability when organization is selected
   */
  useEffect(() => {
    const fetchOrgDetails = async () => {
      if (!formData.organization_id) {
        setSelectedOrg(null);
        setAvailableSlots(0);
        setParkingLots([]);
        setAvailabilityChecked(false);
        return;
      }

      try {
        const org = await organizationService.getOrganizationById(formData.organization_id);
        setSelectedOrg(org);
        
        // Fetch parking lots for the organization and calculate real-time available slots
        try {
          const lotsData = await getParkingLots(formData.organization_id, false);
          const lots = lotsData.parking_lots || [];
          setParkingLots(lots);
          // Calculate total available slots from all active parking lots
          const totalAvailable = lots.reduce((sum, lot) => sum + (lot.available_slots || 0), 0);
          setAvailableSlots(totalAvailable);
        } catch (error) {
          console.error('Error fetching parking lots:', error);
          setParkingLots([]);
        }
      } catch (error) {
        console.error('Error fetching organization details:', error);
        setErrors((prev) => ({ ...prev, organization: 'Failed to load organization details' }));
      }
    };

    fetchOrgDetails();
  }, [formData.organization_id]);

  /**
   * Calculate duration when start or end time changes
   */
  /**
   * Calculate and display duration whenever start/end times change
   */
  useEffect(() => {
    if (formData.booking_start_time && formData.booking_end_time) {
      const start = new Date(formData.booking_start_time);
      const end = new Date(formData.booking_end_time);
      const durationMs = end - start;
      const durationHours = Math.ceil(durationMs / (1000 * 60 * 60));
      
      // Only update if duration has actually changed to avoid infinite loops
      if (durationHours > 0 && durationHours !== formData.duration_hours) {
        setFormData((prev) => ({ ...prev, duration_hours: durationHours }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.booking_start_time, formData.booking_end_time]);

  /**
   * Calculate amount when duration or organization changes
   */
  useEffect(() => {
    if (formData.duration_hours > 0 && selectedOrg && user) {
      let amount = 0;
      
      // Free parking ONLY for organization members at THEIR OWN organization
      if (user?.user_type === 'organization_member' && user?.organization_id === selectedOrg?.id) {
        amount = 0;
      } else {
        // Paid parking for:
        // 1. Visitors (user_type === 'visitor')
        // 2. Organization members visiting OTHER organizations
        amount = formData.duration_hours * (selectedOrg.visitor_hourly_rate || 0);
      }
      
      setCalculatedAmount(amount);
    } else {
      setCalculatedAmount(0);
    }
  }, [formData.duration_hours, selectedOrg, user]);

  /**
   * Set quick duration (in hours)
   * If user has entered start time, use it. Otherwise use current IST time.
   * All times handled in Indian Standard Time (IST - UTC+5:30)
   */
  const setQuickDuration = (hours) => {
    let startTimeStr;
    
    // Check if user has already entered a start time
    if (formData.booking_start_time && formData.booking_start_time.trim() !== '') {
      // User has entered a start time - keep it exactly as is
      startTimeStr = formData.booking_start_time;
    } else {
      // No start time entered, use current IST time rounded to next 15 minutes
      // Get current time in IST (UTC+5:30)
      const now = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000; // IST offset in milliseconds
      const istTime = new Date(now.getTime() + istOffset);
      
      // Round to next 15 minutes
      const minutes = istTime.getUTCMinutes();
      const roundedMinutes = Math.ceil(minutes / 15) * 15;
      
      if (roundedMinutes >= 60) {
        istTime.setUTCHours(istTime.getUTCHours() + 1);
        istTime.setUTCMinutes(roundedMinutes - 60);
      } else {
        istTime.setUTCMinutes(roundedMinutes);
      }
      
      istTime.setUTCSeconds(0);
      istTime.setUTCMilliseconds(0);
      
      // Format as YYYY-MM-DDTHH:mm in IST
      const year = istTime.getUTCFullYear();
      const month = String(istTime.getUTCMonth() + 1).padStart(2, '0');
      const day = String(istTime.getUTCDate()).padStart(2, '0');
      const hour = String(istTime.getUTCHours()).padStart(2, '0');
      const minute = String(istTime.getUTCMinutes()).padStart(2, '0');
      startTimeStr = `${year}-${month}-${day}T${hour}:${minute}`;
    }

    // Parse the start time string (treating as IST)
    const [datePart, timePart] = startTimeStr.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hour, minute] = timePart.split(':').map(Number);
    
    // Add hours directly to the time components
    let endHour = hour + hours;
    let endDay = day;
    let endMonth = month;
    let endYear = year;
    
    // Handle hour overflow (past midnight)
    if (endHour >= 24) {
      const daysToAdd = Math.floor(endHour / 24);
      endHour = endHour % 24;
      endDay += daysToAdd;
      
      // Handle day overflow (simplified - works for most cases)
      const daysInMonth = new Date(endYear, endMonth, 0).getDate();
      if (endDay > daysInMonth) {
        endDay = endDay - daysInMonth;
        endMonth++;
        if (endMonth > 12) {
          endMonth = 1;
          endYear++;
        }
      }
    }
    
    // Format end time as YYYY-MM-DDTHH:mm
    const endTimeStr = `${endYear}-${String(endMonth).padStart(2, '0')}-${String(endDay).padStart(2, '0')}T${String(endHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

    // Update form data
    setFormData({
      ...formData,
      booking_start_time: startTimeStr,
      booking_end_time: endTimeStr,
      duration_hours: hours
    });
  };

  /**
   * Handle input changes - clear errors only
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear error for this field
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  /**
   * Handle field blur - validate vehicle number when user leaves field
   */
  const handleBlur = (e) => {
    const { name, value } = e.target;
    
    if (name === 'vehicle_number' && value) {
      const vehicleValidation = validateVehicleNumber(value);
      if (!vehicleValidation.isValid) {
        setErrors({ ...errors, vehicle_number: vehicleValidation.error });
      } else {
        const newErrors = { ...errors };
        delete newErrors.vehicle_number;
        setErrors(newErrors);
      }
    }
  };

  /**
   * Validate vehicle number format (removed - now using centralized validation)
   */

  /**
   * Check slot availability
   */
  const checkAvailability = async () => {
    if (!formData.organization_id) {
      setErrors({ ...errors, organization: 'Please select an organization first' });
      return;
    }

    try {
      // Fetch parking lots to get real-time available slots
      const lotsData = await getParkingLots(formData.organization_id, false);
      const lots = lotsData.parking_lots || [];
      // Calculate total available slots from all active parking lots
      const totalAvailable = lots.reduce((sum, lot) => sum + (lot.available_slots || 0), 0);
      setAvailableSlots(totalAvailable);
      setAvailabilityChecked(true);
      setLastCheckedTime(new Date());
    } catch (error) {
      console.error('Error checking availability:', error);
      setErrors({ ...errors, availability: 'Failed to check availability' });
    }
  };

  /**
   * Validate form
   */
  const validateForm = () => {
    const newErrors = {};

    // Organization validation
    if (!formData.organization_id) {
      newErrors.organization = 'Please select an organization';
    }

    // Vehicle number validation
    const vehicleValidation = validateVehicleNumber(formData.vehicle_number);
    if (!vehicleValidation.isValid) {
      newErrors.vehicle_number = vehicleValidation.error;
    }

    // Booking time validation
    if (!formData.booking_start_time) {
      newErrors.booking_start_time = 'Start time is required';
    } else {
      const startTime = new Date(formData.booking_start_time);
      const now = new Date();
      if (startTime < now) {
        newErrors.booking_start_time = 'Start time must be in the future';
      }
    }

    if (!formData.booking_end_time) {
      newErrors.booking_end_time = 'End time is required';
    }

    // Verify end time is after start time
    if (formData.booking_start_time && formData.booking_end_time) {
      const start = new Date(formData.booking_start_time);
      const end = new Date(formData.booking_end_time);
      if (end <= start) {
        newErrors.booking_end_time = 'End time must be after start time';
      }
    }

    // Slot availability validation
    if (availableSlots === 0) {
      newErrors.availability = 'No slots available. Please select another organization or time.';
    }

    // Terms acceptance
    if (!termsAccepted) {
      newErrors.terms = 'Please accept the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // Prepare booking data
      const bookingData = {
        organization_id: parseInt(formData.organization_id),
        vehicle_number: formData.vehicle_number.toUpperCase(),
        vehicle_type: formData.vehicle_type,
        booking_start_time: formData.booking_start_time,
        booking_end_time: formData.booking_end_time,
        duration_hours: formData.duration_hours,
        amount: calculatedAmount
      };

      // Create booking
      const result = await bookingService.createBooking(bookingData);

      // For visitors, redirect to payment page
      // For organization members, redirect to booking details
      if (user?.user_type === 'visitor') {
        navigate(`/payment/${result.id}`, {
          state: {
            booking: result,
            amount: calculatedAmount
          }
        });
      } else {
        // Organization members get free parking, go to QR code page
        navigate(`/booking/${result.id}/qr`, {
          state: {
            booking: result,
            message: 'Booking created successfully!'
          }
        });
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      setErrors({
        general:
          error.response?.data?.message ||
          'Failed to create booking. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get user type badge
   */
  const getUserTypeBadge = () => {
    if (!user) return null;

    switch (user?.user_type) {
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
          icon: FaCar
        };
      case 'walk_in':
        return {
          label: 'Walk-in User',
          color: 'bg-orange-100 text-orange-800 border-orange-300',
          icon: FaParking
        };
      default:
        return null;
    }
  };

  /**
   * Filter organizations based on search query
   */
  const filteredOrganizations = organizations.filter((org) =>
    org.org_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  /**
   * Get submit button text based on user type
   */
  const getSubmitButtonText = () => {
    if (!user) return 'Submit';
    switch (user?.user_type) {
      case 'organization_member':
        return 'Reserve My Free Slot';
      case 'visitor':
        return 'Proceed to Payment';
      case 'walk_in':
        return 'Request Assistance';
      default:
        return 'Submit Booking';
    }
  };

  const userBadge = getUserTypeBadge();

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <FaSpinner className="animate-spin text-indigo-600 text-5xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Book Your Parking Spot</h1>
            {userBadge && (
              <span
                className={`px-4 py-2 rounded-full text-sm font-semibold border-2 flex items-center ${userBadge.color}`}
              >
                <userBadge.icon className="mr-2" />
                {userBadge.label}
              </span>
            )}
          </div>

          {/* User Info Section */}
          {user?.user_type === 'organization_member' && (
            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
              <div className="flex items-center">
                <FaShieldAlt className="text-green-600 text-2xl mr-3" />
                <div>
                  <h3 className="font-semibold text-green-900">Member Benefit</h3>
                  <p className="text-sm text-green-700">
                    As an organization member, you enjoy FREE parking at your organization's facilities!
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* General Error */}
        {errors.general && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-6">
            <div className="flex items-center">
              <FaTimesCircle className="text-red-500 mr-3" />
              <p className="text-red-700">{errors.general}</p>
            </div>
          </div>
        )}

        {/* Booking Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Organization Selection */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <FaBuilding className="mr-3 text-indigo-600" />
              Select Organization
            </h2>

            {/* Member Restriction Notice */}
            {user && user.user_type === 'organization_member' && (
              <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start">
                <FaInfoCircle className="text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                <p className="text-sm text-blue-800">
                  As an organization member, you can only book parking at your organization.
                </p>
              </div>
            )}

            {/* Search Bar - Only show for non-members */}
            {(!user || user.user_type !== 'organization_member') && (
              <div className="mb-4">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search organizations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}

            {/* Organization Dropdown */}
            <select
              name="organization_id"
              value={formData.organization_id}
              onChange={handleChange}
              disabled={user && user.user_type === 'organization_member'}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                errors.organization ? 'border-red-500' : 'border-gray-300'
              } ${user && user.user_type === 'organization_member' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            >
              <option value="">-- Select Organization --</option>
              {filteredOrganizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.org_name} - {org.address}
                </option>
              ))}
            </select>
            {errors.organization && (
              <p className="text-red-500 text-sm mt-1 flex items-center">
                <FaTimesCircle className="mr-1" />
                {errors.organization}
              </p>
            )}

            {/* Organization Details Card */}
            {selectedOrg && (
              <div className="mt-4 bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <h3 className="font-bold text-lg text-indigo-900 mb-3">{selectedOrg.org_name}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-start">
                    <FaMapMarkerAlt className="text-indigo-600 mt-1 mr-2 flex-shrink-0" />
                    <span className="text-gray-700">{selectedOrg.address}</span>
                  </div>
                  <div className="flex items-center">
                    <FaParking className="text-indigo-600 mr-2" />
                    <span
                      className={`font-semibold ${
                        availableSlots > 10
                          ? 'text-green-600'
                          : availableSlots > 0
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      }`}
                    >
                      {availableSlots} slots available
                    </span>
                  </div>
                  {user?.user_type === 'visitor' && (
                    <div className="flex items-center">
                      <FaRupeeSign className="text-indigo-600 mr-2" />
                      <span className="text-gray-700">
                        ₹{selectedOrg.visitor_hourly_rate}/hour
                      </span>
                    </div>
                  )}
                  {selectedOrg.operating_hours && (
                    <div className="flex items-center">
                      <FaClock className="text-indigo-600 mr-2" />
                      <span className="text-gray-700">{selectedOrg.operating_hours}</span>
                    </div>
                  )}
                </div>

                {/* Parking Lots Information */}
                {parkingLots.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-indigo-200">
                    <p className="text-xs text-gray-600 font-semibold mb-2 flex items-center">
                      <FaParking className="mr-1" />
                      Available Parking Lots:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {parkingLots
                        .filter(lot => (lot.stats?.available_slots ?? lot.available_slots) > 0)
                        .sort((a, b) => a.priority_order - b.priority_order)
                        .map((lot, index) => (
                        <div key={lot.lot_id} className="bg-white rounded-lg p-2 border border-indigo-100">
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="text-xs font-semibold text-gray-700">
                                {lot.lot_name}
                                <span className="ml-1 text-blue-600 text-[10px]">(Priority {lot.priority_order})</span>
                              </span>
                              {lot.lot_description && (
                                <p className="text-[10px] text-gray-500">{lot.lot_description}</p>
                              )}
                            </div>
                            <span className={`text-xs font-bold ${
                              (lot.stats?.available_slots ?? lot.available_slots) > 5 ? 'text-green-600' : 'text-orange-600'
                            }`}>
                              {lot.stats?.available_slots ?? lot.available_slots}/{lot.total_slots}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-gray-500 mt-2 italic">
                      * Slots are automatically assigned based on priority order
                    </p>
                  </div>
                )}

                {/* Parking Rules */}
                {selectedOrg.parking_rules && (
                  <div className="mt-3 pt-3 border-t border-indigo-200">
                    <p className="text-xs text-gray-600 font-semibold mb-1">Parking Rules:</p>
                    <p className="text-xs text-gray-600 whitespace-pre-line">
                      {selectedOrg.parking_rules}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 2: Vehicle Details */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <FaCar className="mr-3 text-indigo-600" />
              Vehicle Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vehicle Number *
                </label>
                <input
                  type="text"
                  name="vehicle_number"
                  value={formData.vehicle_number}
                  onChange={(e) => {
                    const upperValue = e.target.value.toUpperCase();
                    handleChange({ target: { name: 'vehicle_number', value: upperValue } });
                  }}
                  onBlur={(e) => {
                    const upperValue = e.target.value.toUpperCase();
                    handleBlur({ target: { name: 'vehicle_number', value: upperValue } });
                  }}
                  placeholder="e.g., MH12AB1234"
                  className={`w-full px-4 py-3 border rounded-lg uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.vehicle_number ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.vehicle_number && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <FaTimesCircle className="mr-1" />
                    {errors.vehicle_number}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vehicle Type
                </label>
                <select
                  name="vehicle_type"
                  value={formData.vehicle_type}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Car">
                    <FaCar className="inline" /> Car
                  </option>
                  <option value="Bike">
                    <FaMotorcycle className="inline" /> Bike
                  </option>
                  <option value="Scooter">
                    <FaBicycle className="inline" /> Scooter
                  </option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Booking Schedule */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <FaCalendarAlt className="mr-3 text-indigo-600" />
              Booking Schedule
            </h2>

            {/* Quick Duration Buttons */}
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Quick Duration:</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setQuickDuration(1)}
                  className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-all"
                >
                  1 Hour
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDuration(2)}
                  className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-all"
                >
                  2 Hours
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDuration(4)}
                  className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-all"
                >
                  4 Hours
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDuration(8)}
                  className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-all"
                >
                  Full Day
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date & Time *
                </label>
                <input
                  type="datetime-local"
                  name="booking_start_time"
                  value={formData.booking_start_time}
                  onChange={handleChange}
                  min={new Date().toISOString().slice(0, 16)}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.booking_start_time ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.booking_start_time && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <FaTimesCircle className="mr-1" />
                    {errors.booking_start_time}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date & Time *
                </label>
                <input
                  type="datetime-local"
                  name="booking_end_time"
                  value={formData.booking_end_time}
                  onChange={handleChange}
                  min={formData.booking_start_time || new Date().toISOString().slice(0, 16)}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.booking_end_time ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.booking_end_time && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <FaTimesCircle className="mr-1" />
                    {errors.booking_end_time}
                  </p>
                )}
              </div>
            </div>

            {/* Duration Display */}
            {formData.duration_hours > 0 && (
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center">
                <FaClock className="text-blue-600 text-xl mr-3" />
                <span className="text-blue-900 font-semibold">
                  Duration: {formData.duration_hours} hour{formData.duration_hours !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>

          {/* Section 4: Price Summary */}
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-xl p-6 text-white">
            <h2 className="text-2xl font-bold mb-4">Price Summary</h2>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-indigo-100">Duration:</span>
                <span className="font-semibold text-lg">
                  {formData.duration_hours} hour{formData.duration_hours !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Show rate for visitors or members visiting other orgs */}
              {calculatedAmount > 0 && selectedOrg && (
                <div className="flex items-center justify-between">
                  <span className="text-indigo-100">Rate:</span>
                  <span className="font-semibold text-lg">
                    ₹{selectedOrg.visitor_hourly_rate}/hour
                  </span>
                </div>
              )}

              <div className="border-t border-indigo-400 pt-3 mt-3">
                {user?.user_type === 'organization_member' && user?.organization_id === selectedOrg?.id ? (
                  <div className="bg-green-500 rounded-lg p-4 text-center">
                    <FaShieldAlt className="text-4xl mx-auto mb-2" />
                    <p className="text-2xl font-bold">FREE PARKING</p>
                    <p className="text-sm text-green-100">Member Benefit - Your Organization</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xl">Total Amount:</span>
                      <span className="text-4xl font-bold">₹{calculatedAmount}</span>
                    </div>
                    <p className="text-xs text-indigo-100">
                      Payment required after booking confirmation
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Section 5: Slot Availability Check */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <FaParking className="mr-3 text-indigo-600" />
              Slot Availability
            </h2>

            <button
              type="button"
              onClick={checkAvailability}
              disabled={!formData.organization_id}
              className="w-full mb-4 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all font-semibold"
            >
              <FaSearch className="inline mr-2" />
              Check Availability
            </button>

            {availabilityChecked && (
              <div
                className={`p-4 rounded-lg flex items-center ${
                  availableSlots > 0
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}
              >
                {availableSlots > 0 ? (
                  <>
                    <FaCheckCircle className="text-green-600 text-2xl mr-3" />
                    <div>
                      <p className="font-semibold text-green-900">
                        {availableSlots} slot{availableSlots !== 1 ? 's' : ''} available
                      </p>
                      {lastCheckedTime && (
                        <p className="text-xs text-green-700">
                          Last checked: {lastCheckedTime.toLocaleTimeString('en-IN')}
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <FaExclamationTriangle className="text-red-600 text-2xl mr-3" />
                    <div>
                      <p className="font-semibold text-red-900">No slots available</p>
                      <p className="text-sm text-red-700">
                        Please select another organization or time
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}

            {errors.availability && (
              <p className="text-red-500 text-sm mt-2 flex items-center">
                <FaTimesCircle className="mr-1" />
                {errors.availability}
              </p>
            )}
          </div>

          {/* Terms and Conditions */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <label className="flex items-start cursor-pointer">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-1 mr-3 w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">
                I accept the{' '}
                <a href="/terms" className="text-indigo-600 hover:underline">
                  terms and conditions
                </a>{' '}
                and parking rules of the selected organization.
              </span>
            </label>
            {errors.terms && (
              <p className="text-red-500 text-sm mt-2 flex items-center ml-8">
                <FaTimesCircle className="mr-1" />
                {errors.terms}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <button
              type="submit"
              disabled={loading || availableSlots === 0 || errors.vehicle_number}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center ${
                user?.user_type === 'organization_member' && user?.organization_id === selectedOrg?.id
                  ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                  : user?.user_type === 'visitor' || (user?.user_type === 'organization_member' && user?.organization_id !== selectedOrg?.id)
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700'
                  : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700'
              } text-white disabled:bg-gray-300 disabled:cursor-not-allowed`}
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Processing...
                </>
              ) : availableSlots === 0 ? (
                <>
                  <FaTimesCircle className="mr-2" />
                  No Slots Available
                </>
              ) : (
                <>
                  <FaCheckCircle className="mr-2" />
                  {getSubmitButtonText()}
                </>
              )}
            </button>

            {/* Info message for paid parking */}
            {calculatedAmount > 0 && (
              <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start">
                <FaInfoCircle className="text-blue-600 mt-1 mr-2 flex-shrink-0" />
                <p className="text-xs text-blue-900">
                  {user?.user_type === 'organization_member' && user?.organization_id !== selectedOrg?.id ? (
                    <>
                      You are booking as a visitor at another organization. 
                      Payment is required. Your parking slot will be reserved upon successful payment.
                    </>
                  ) : (
                    <>
                      After booking, you'll be redirected to the payment page to complete your transaction.
                      Your parking slot will be reserved upon successful payment.
                    </>
                  )}
                </p>
              </div>
            )}
            
            {/* Free parking message for own organization members */}
            {user?.user_type === 'organization_member' && user?.organization_id === selectedOrg?.id && (
              <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3 flex items-start">
                <FaInfoCircle className="text-green-600 mt-1 mr-2 flex-shrink-0" />
                <p className="text-xs text-green-900">
                  As a member of this organization, you enjoy free parking benefits. 
                  Your slot will be confirmed immediately.
                </p>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingForm;

