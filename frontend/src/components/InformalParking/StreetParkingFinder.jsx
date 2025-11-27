import React, { useState, useEffect } from 'react';
import {
  FaMapMarkerAlt,
  FaSearch,
  FaMap,
  FaList,
  FaMapPin,
  FaExclamationTriangle,
  FaRoute,
  FaCar,
  FaRupeeSign,
  FaClock,
  FaShieldAlt,
  FaVideo,
  FaLightbulb,
  FaStar,
  FaFilter,
  FaTimes,
  FaSpinner,
  FaInfoCircle,
  FaCheckCircle
} from 'react-icons/fa';

/**
 * StreetParkingFinder Component
 * Simulates street parking finder functionality
 */
const StreetParkingFinder = () => {
  // Component state
  const [userLocation, setUserLocation] = useState(null);
  const [nearbyLocations, setNearbyLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [searchArea, setSearchArea] = useState('');
  const [loading, setLoading] = useState(false);
  const [mapView, setMapView] = useState(true);
  const [sortBy, setSortBy] = useState('distance');
  const [filterPrice, setFilterPrice] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [locationDetails, setLocationDetails] = useState(null);

  /**
   * Mock parking locations data
   */
  const mockLocations = [
    {
      id: 1,
      name: 'Main Street Parking',
      address: '123 Main Street, Downtown',
      latitude: 12.9716,
      longitude: 77.5946,
      hourlyRate: 30,
      amenities: ['CCTV', 'Security Guard', 'Street Lighting'],
      rating: 4.2,
      reviews: 156
    },
    {
      id: 2,
      name: 'Commercial Complex Roadside',
      address: '45 MG Road, City Center',
      latitude: 12.9756,
      longitude: 77.6008,
      hourlyRate: 40,
      amenities: ['CCTV', 'Street Lighting'],
      rating: 4.0,
      reviews: 89
    },
    {
      id: 3,
      name: 'Park Avenue Street',
      address: '78 Park Avenue, North Block',
      latitude: 12.9696,
      longitude: 77.5916,
      hourlyRate: 25,
      amenities: ['Security Guard', 'Street Lighting', 'Well-lit'],
      rating: 4.5,
      reviews: 234
    },
    {
      id: 4,
      name: 'Shopping District Parking',
      address: '12 Brigade Road, Shopping Area',
      latitude: 12.9726,
      longitude: 77.5986,
      hourlyRate: 50,
      amenities: ['CCTV', 'Security Guard', 'Street Lighting', '24/7 Access'],
      rating: 4.3,
      reviews: 178
    },
    {
      id: 5,
      name: 'Residential Area Parking',
      address: '56 Koramangala, Residential Zone',
      latitude: 12.9346,
      longitude: 77.6279,
      hourlyRate: 20,
      amenities: ['Street Lighting', 'Quiet Area'],
      rating: 3.8,
      reviews: 67
    }
  ];

  /**
   * Mock reviews data
   */
  const mockReviews = [
    {
      id: 1,
      user: 'Rajesh Kumar',
      rating: 5,
      comment: 'Great location, always find a spot here!',
      date: '2 days ago'
    },
    {
      id: 2,
      user: 'Priya Sharma',
      rating: 4,
      comment: 'Good security, but can be crowded during peak hours.',
      date: '1 week ago'
    },
    {
      id: 3,
      user: 'Amit Patel',
      rating: 4,
      comment: 'Convenient and affordable. Recommended!',
      date: '2 weeks ago'
    }
  ];

  /**
   * Fetch nearby informal parking locations (simulation)
   */
  const fetchNearbyLocations = async (lat, lng) => {
    setLoading(true);

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Calculate distances and add random availability
      const locationsWithDetails = mockLocations.map((location) => {
        const distance = calculateDistance(lat, lng, location.latitude, location.longitude);
        const availableSpots = Math.floor(Math.random() * 10) + 1;

        return {
          ...location,
          distance,
          availableSpots
        };
      });

      // Sort by distance initially
      locationsWithDetails.sort((a, b) => a.distance - b.distance);

      setNearbyLocations(locationsWithDetails);
    } catch (error) {
      console.error('Error fetching locations:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Request user's geolocation on mount
   */
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          // Fetch nearby locations after getting user location
          fetchNearbyLocations(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.error('Geolocation error:', error);
          // Use default location (Bangalore city center)
          const defaultLocation = { latitude: 12.9716, longitude: 77.5946 };
          setUserLocation(defaultLocation);
          fetchNearbyLocations(defaultLocation.latitude, defaultLocation.longitude);
        }
      );
    } else {
      // Geolocation not supported, use default
      const defaultLocation = { latitude: 12.9716, longitude: 77.5946 };
      setUserLocation(defaultLocation);
      fetchNearbyLocations(defaultLocation.latitude, defaultLocation.longitude);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Auto-refresh availability every 30 seconds
   */
  useEffect(() => {
    const interval = setInterval(() => {
      if (nearbyLocations.length > 0) {
        refreshAvailability();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [nearbyLocations]);

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return parseFloat(distance.toFixed(1));
  };

  /**
   * Search parking spots by area name
   */
  const searchParkingSpots = async (e) => {
    e.preventDefault();

    if (!searchArea.trim()) return;

    setLoading(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Filter locations by search query (simulation)
      const filtered = mockLocations.filter((location) =>
        location.address.toLowerCase().includes(searchArea.toLowerCase())
      );

      if (filtered.length > 0) {
        const locationsWithDetails = filtered.map((location) => ({
          ...location,
          distance: calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            location.latitude,
            location.longitude
          ),
          availableSpots: Math.floor(Math.random() * 10) + 1
        }));

        setNearbyLocations(locationsWithDetails);
      } else {
        // No results, show all locations
        fetchNearbyLocations(userLocation.latitude, userLocation.longitude);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Check availability for a specific location
   */
  const checkAvailability = async (locationId) => {
    setNearbyLocations((prev) =>
      prev.map((loc) => {
        if (loc.id === locationId) {
          return {
            ...loc,
            availableSpots: Math.floor(Math.random() * 10) + 1,
            lastUpdated: new Date()
          };
        }
        return loc;
      })
    );
  };

  /**
   * Refresh availability for all locations
   */
  const refreshAvailability = () => {
    setNearbyLocations((prev) =>
      prev.map((loc) => ({
        ...loc,
        availableSpots: Math.floor(Math.random() * 10) + 1,
        lastUpdated: new Date()
      }))
    );
  };

  /**
   * Get availability color class
   */
  const getAvailabilityColor = (spots) => {
    if (spots >= 5) return 'text-green-600 bg-green-100 border-green-300';
    if (spots >= 2) return 'text-yellow-600 bg-yellow-100 border-yellow-300';
    return 'text-red-600 bg-red-100 border-red-300';
  };

  /**
   * Sort locations
   */
  const sortLocations = (locations) => {
    const sorted = [...locations];

    switch (sortBy) {
      case 'distance':
        sorted.sort((a, b) => a.distance - b.distance);
        break;
      case 'price':
        sorted.sort((a, b) => a.hourlyRate - b.hourlyRate);
        break;
      case 'availability':
        sorted.sort((a, b) => b.availableSpots - a.availableSpots);
        break;
      case 'rating':
        sorted.sort((a, b) => b.rating - a.rating);
        break;
      default:
        break;
    }

    return sorted;
  };

  /**
   * Filter locations by price
   */
  const filterLocations = (locations) => {
    if (filterPrice === 'all') return locations;

    return locations.filter((loc) => {
      switch (filterPrice) {
        case 'low':
          return loc.hourlyRate <= 30;
        case 'medium':
          return loc.hourlyRate > 30 && loc.hourlyRate <= 45;
        case 'high':
          return loc.hourlyRate > 45;
        default:
          return true;
      }
    });
  };

  /**
   * Show location details
   */
  const showLocationDetails = (location) => {
    setLocationDetails(location);
  };

  /**
   * Simulate booking
   */
  const simulateBooking = (location) => {
    setSelectedLocation(location);
    setShowBookingModal(true);
  };

  /**
   * Use current GPS location
   */
  const useCurrentLocation = () => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          fetchNearbyLocations(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.error('GPS error:', error);
          setLoading(false);
        }
      );
    }
  };

  // Get sorted and filtered locations
  const displayLocations = sortLocations(filterLocations(nearbyLocations));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simulation Disclaimer Banner */}
      <div className="bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 text-white py-3 px-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-center">
          <FaExclamationTriangle className="text-2xl mr-3 animate-pulse" />
          <div className="text-center">
            <p className="font-bold text-lg">SIMULATION MODE</p>
            <p className="text-sm">
              This is a simulated feature demonstrating informal parking finder functionality.
              Actual street parking data integration coming in future updates.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Find Street Parking Nearby</h1>
          <p className="text-gray-600">Discover available parking spots in your area</p>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <form onSubmit={searchParkingSpots} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <FaMapMarkerAlt className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
              <input
                type="text"
                value={searchArea}
                onChange={(e) => setSearchArea(e.target.value)}
                placeholder="Search by location or area name..."
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              type="button"
              onClick={useCurrentLocation}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-all flex items-center justify-center"
              disabled={loading}
            >
              <FaMapPin className="mr-2" />
              Use GPS
            </button>
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-lg transition-all flex items-center justify-center"
              disabled={loading}
            >
              {loading ? (
                <FaSpinner className="animate-spin mr-2" />
              ) : (
                <FaSearch className="mr-2" />
              )}
              Find Parking
            </button>
          </form>
        </div>

        {/* View Toggle & Filters */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          {/* View Toggle */}
          <div className="flex bg-white rounded-lg shadow-md overflow-hidden">
            <button
              onClick={() => setMapView(true)}
              className={`flex items-center px-6 py-3 font-semibold transition-all ${
                mapView
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <FaMap className="mr-2" />
              Map View
            </button>
            <button
              onClick={() => setMapView(false)}
              className={`flex items-center px-6 py-3 font-semibold transition-all ${
                !mapView
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <FaList className="mr-2" />
              List View
            </button>
          </div>

          {/* Filters & Sort */}
          <div className="flex gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 px-6 rounded-lg shadow-md transition-all flex items-center"
            >
              <FaFilter className="mr-2" />
              Filters
            </button>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white border border-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="distance">Sort by Distance</option>
              <option value="price">Sort by Price</option>
              <option value="availability">Sort by Availability</option>
              <option value="rating">Sort by Rating</option>
            </select>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Filter Options</h3>
              <button
                onClick={() => setShowFilters(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Price Range
                </label>
                <select
                  value={filterPrice}
                  onChange={(e) => setFilterPrice(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Prices</option>
                  <option value="low">₹0 - ₹30/hr</option>
                  <option value="medium">₹31 - ₹45/hr</option>
                  <option value="high">₹46+/hr</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* MAP VIEW */}
        {mapView ? (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="relative h-96 md:h-[600px] bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
              {/* Simulated Map */}
              <div className="absolute inset-0 opacity-20">
                <div className="grid grid-cols-8 grid-rows-8 h-full">
                  {Array.from({ length: 64 }).map((_, i) => (
                    <div key={i} className="border border-gray-300"></div>
                  ))}
                </div>
              </div>

              {/* User Location Marker */}
              {userLocation && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="relative">
                    <div className="absolute -inset-4 bg-blue-500 rounded-full animate-ping opacity-75"></div>
                    <FaMapMarkerAlt className="relative text-blue-600 text-4xl" />
                  </div>
                  <p className="mt-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                    You are here
                  </p>
                </div>
              )}

              {/* Parking Location Markers */}
              {displayLocations.slice(0, 5).map((location, index) => (
                <div
                  key={location.id}
                  className="absolute cursor-pointer transform hover:scale-110 transition-transform"
                  style={{
                    top: `${20 + index * 15}%`,
                    left: `${30 + index * 10}%`
                  }}
                  onClick={() => showLocationDetails(location)}
                >
                  <FaMapPin className="text-red-600 text-3xl drop-shadow-lg" />
                  <div className="mt-1 bg-white text-xs px-2 py-1 rounded shadow-md">
                    {location.availableSpots} spots
                  </div>
                </div>
              ))}

              {/* Map Placeholder Message */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-yellow-100 border-2 border-yellow-400 rounded-lg p-4 shadow-lg max-w-md">
                <p className="text-yellow-800 font-semibold text-center flex items-center">
                  <FaInfoCircle className="mr-2" />
                  Actual map integration (Google Maps / Mapbox) coming soon
                </p>
              </div>
            </div>
          </div>
        ) : (
          // LIST VIEW
          <div className="space-y-4">
            {loading ? (
              // Loading Skeletons
              <>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-xl shadow-md p-6 animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </>
            ) : displayLocations.length > 0 ? (
              displayLocations.map((location) => (
                <div
                  key={location.id}
                  className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-1">
                          {location.name}
                        </h3>
                        <p className="text-gray-600 text-sm flex items-center">
                          <FaMapMarkerAlt className="mr-2 text-gray-400" />
                          {location.address}
                        </p>
                      </div>

                      <div
                        className={`mt-3 md:mt-0 px-4 py-2 rounded-lg font-bold border-2 ${getAvailabilityColor(
                          location.availableSpots
                        )}`}
                      >
                        {location.availableSpots} spots available
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center text-gray-700">
                        <FaRoute className="mr-2 text-indigo-600" />
                        <span className="font-semibold">{location.distance} km</span>
                      </div>

                      <div className="flex items-center text-gray-700">
                        <FaRupeeSign className="mr-1 text-green-600" />
                        <span className="font-semibold">{location.hourlyRate}/hr</span>
                      </div>

                      <div className="flex items-center text-gray-700">
                        <FaStar className="mr-2 text-yellow-500" />
                        <span className="font-semibold">
                          {location.rating} ({location.reviews})
                        </span>
                      </div>

                      <div className="flex items-center text-gray-700">
                        <FaClock className="mr-2 text-blue-600" />
                        <span className="text-sm">24/7 Access</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {location.amenities.map((amenity, index) => (
                        <span
                          key={index}
                          className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full flex items-center"
                        >
                          {amenity === 'CCTV' && <FaVideo className="mr-1" />}
                          {amenity === 'Security Guard' && <FaShieldAlt className="mr-1" />}
                          {amenity === 'Street Lighting' && <FaLightbulb className="mr-1" />}
                          {amenity}
                        </span>
                      ))}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => checkAvailability(location.id)}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center"
                      >
                        <FaCar className="mr-2" />
                        Check Availability
                      </button>

                      <button
                        onClick={() => showLocationDetails(location)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center"
                      >
                        <FaInfoCircle className="mr-2" />
                        View Details
                      </button>

                      <button
                        disabled
                        className="flex-1 bg-gray-300 text-gray-500 font-bold py-3 rounded-lg cursor-not-allowed flex items-center justify-center"
                      >
                        <FaRoute className="mr-2" />
                        Navigate (Disabled)
                      </button>
                    </div>
                  </div>

                  <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500 flex items-center">
                      <FaInfoCircle className="mr-2" />
                      Last updated: {location.lastUpdated ? 'Just now' : '30 seconds ago'}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <FaMapMarkerAlt className="text-6xl text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-700 mb-2">No parking spots found</h3>
                <p className="text-gray-500">Try searching in a different area</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Location Details Modal */}
      {locationDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 relative">
              <button
                onClick={() => setLocationDetails(null)}
                className="absolute top-4 right-4 text-white hover:text-gray-200"
              >
                <FaTimes className="text-2xl" />
              </button>
              <h2 className="text-2xl font-bold mb-2">{locationDetails.name}</h2>
              <p className="flex items-center">
                <FaMapMarkerAlt className="mr-2" />
                {locationDetails.address}
              </p>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Map Preview */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg h-48 mb-6 flex items-center justify-center">
                <p className="text-gray-500">Map preview (simulation)</p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center bg-green-50 rounded-lg p-4">
                  <p className="text-2xl font-bold text-green-600">
                    {locationDetails.availableSpots}
                  </p>
                  <p className="text-sm text-gray-600">Spots Available</p>
                </div>
                <div className="text-center bg-blue-50 rounded-lg p-4">
                  <p className="text-2xl font-bold text-blue-600">
                    {locationDetails.distance} km
                  </p>
                  <p className="text-sm text-gray-600">Distance</p>
                </div>
                <div className="text-center bg-yellow-50 rounded-lg p-4">
                  <p className="text-2xl font-bold text-yellow-600">{locationDetails.rating}</p>
                  <p className="text-sm text-gray-600">Rating</p>
                </div>
                <div className="text-center bg-purple-50 rounded-lg p-4">
                  <p className="text-2xl font-bold text-purple-600">
                    ₹{locationDetails.hourlyRate}
                  </p>
                  <p className="text-sm text-gray-600">Per Hour</p>
                </div>
              </div>

              {/* Amenities */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Amenities</h3>
                <div className="flex flex-wrap gap-2">
                  {locationDetails.amenities.map((amenity, index) => (
                    <span
                      key={index}
                      className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-lg font-semibold flex items-center"
                    >
                      {amenity === 'CCTV' && <FaVideo className="mr-2" />}
                      {amenity === 'Security Guard' && <FaShieldAlt className="mr-2" />}
                      {(amenity === 'Street Lighting' || amenity === 'Well-lit') && (
                        <FaLightbulb className="mr-2" />
                      )}
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>

              {/* Reviews */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3">User Reviews</h3>
                <div className="space-y-3">
                  {mockReviews.map((review) => (
                    <div key={review.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-semibold text-gray-900">{review.user}</p>
                        <div className="flex items-center">
                          {Array.from({ length: review.rating }).map((_, i) => (
                            <FaStar key={i} className="text-yellow-500 text-sm" />
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm mb-1">{review.comment}</p>
                      <p className="text-gray-400 text-xs">{review.date}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => {
                  simulateBooking(locationDetails);
                  setLocationDetails(null);
                }}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center text-lg"
              >
                <FaCar className="mr-3 text-xl" />
                Book Parking Spot
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Simulation Modal */}
      {showBookingModal && selectedLocation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center">
            <div className="inline-block p-4 bg-yellow-100 rounded-full mb-4">
              <FaExclamationTriangle className="text-yellow-600 text-5xl" />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-3">Feature Under Development</h2>

            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-blue-900 font-semibold mb-2">This is a Simulation</p>
              <p className="text-blue-700 text-sm">
                Street parking booking functionality is currently under development. This demo
                shows the user interface and flow.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-bold text-gray-900 mb-2">Selected Location:</h3>
              <p className="text-gray-700 mb-1">
                <strong>Name:</strong> {selectedLocation.name}
              </p>
              <p className="text-gray-700 mb-1">
                <strong>Address:</strong> {selectedLocation.address}
              </p>
              <p className="text-gray-700 mb-1">
                <strong>Rate:</strong> ₹{selectedLocation.hourlyRate}/hour
              </p>
              <p className="text-gray-700">
                <strong>Available:</strong> {selectedLocation.availableSpots} spots
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center text-green-600 mb-2">
                <FaCheckCircle className="text-2xl mr-2" />
                <p className="font-bold">Coming Soon!</p>
              </div>
              <p className="text-green-700 text-sm">
                Real-time street parking integration, live availability, and instant booking will
                be available in future updates.
              </p>
            </div>

            <button
              onClick={() => {
                setShowBookingModal(false);
                setSelectedLocation(null);
              }}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StreetParkingFinder;
