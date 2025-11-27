const express = require('express');
const router = express.Router();

/**
 * Helper function to calculate distance between two coordinates (Haversine formula)
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(2);
}

/**
 * Helper function to generate mock parking locations
 */
function generateMockLocations(userLat, userLon, count = 8) {
  const locations = [
    { name: 'Main Street Parking', area: 'Downtown', type: 'street' },
    { name: 'Central Avenue Parking', area: 'Central Business District', type: 'street' },
    { name: 'Park Road Street Parking', area: 'Park Area', type: 'street' },
    { name: 'Station Road Parking', area: 'Railway Station', type: 'street' },
    { name: 'Market Street Parking', area: 'City Market', type: 'street' },
    { name: 'Beach Road Parking', area: 'Beachfront', type: 'street' },
    { name: 'Mall Road Parking', area: 'Shopping District', type: 'street' },
    { name: 'Temple Street Parking', area: 'Old Town', type: 'street' },
    { name: 'Hospital Road Parking', area: 'Medical District', type: 'street' },
    { name: 'University Street Parking', area: 'Education Zone', type: 'street' }
  ];

  return locations.slice(0, count).map((loc, index) => {
    // Generate random coordinates near user location (±0.05 degrees)
    const lat = userLat + (Math.random() - 0.5) * 0.1;
    const lon = userLon + (Math.random() - 0.5) * 0.1;
    const distance = calculateDistance(userLat, userLon, lat, lon);

    return {
      location_id: `LOC${Date.now()}${index}`,
      location_name: loc.name,
      address: `${Math.floor(Math.random() * 500) + 1} ${loc.name.split(' ')[0]} Street, ${loc.area}`,
      area: loc.area,
      coordinates: {
        latitude: parseFloat(lat.toFixed(6)),
        longitude: parseFloat(lon.toFixed(6))
      },
      distance: parseFloat(distance),
      available_spots: Math.floor(Math.random() * 19) + 2, // 2-20
      total_spots: Math.floor(Math.random() * 30) + 20, // 20-50
      hourly_rate: Math.floor(Math.random() * 81) + 20, // 20-100 rupees
      parking_type: loc.type,
      is_available: true
    };
  });
}

/**
 * GET /api/informal-parking/nearby
 * Get nearby street parking locations (SIMULATION)
 */
router.get('/nearby', (req, res) => {
  const { latitude, longitude } = req.query;

  if (!latitude || !longitude) {
    return res.status(400).json({
      success: false,
      message: 'latitude and longitude are required'
    });
  }

  const userLat = parseFloat(latitude);
  const userLon = parseFloat(longitude);

  // Generate 5-10 mock locations
  const count = Math.floor(Math.random() * 6) + 5; // 5-10
  const mockLocations = generateMockLocations(userLat, userLon, count);

  // Sort by distance
  mockLocations.sort((a, b) => a.distance - b.distance);

  res.json({
    success: true,
    disclaimer: '⚠️ THIS IS SIMULATION DATA - Not actual parking locations',
    message: 'Mock data for demonstration purposes only',
    data: {
      user_location: {
        latitude: userLat,
        longitude: userLon
      },
      locations: mockLocations,
      count: mockLocations.length
    }
  });
});

/**
 * GET /api/informal-parking/location/:locationId
 * Get detailed information for specific location (SIMULATION)
 */
router.get('/location/:locationId', (req, res) => {
  const { locationId } = req.params;

  // Generate mock detailed data
  const mockLocation = {
    location_id: locationId,
    location_name: 'Main Street Parking',
    address: '123 Main Street, Downtown',
    area: 'Downtown',
    coordinates: {
      latitude: 28.6139 + (Math.random() - 0.5) * 0.1,
      longitude: 77.2090 + (Math.random() - 0.5) * 0.1
    },
    available_spots: Math.floor(Math.random() * 19) + 2,
    total_spots: 30,
    hourly_rate: 50,
    parking_type: 'street',
    amenities: [
      'CCTV Surveillance',
      'Well-lit Area',
      '24/7 Access',
      'Nearby Shops',
      'Police Station Nearby'
    ],
    operating_hours: '24/7',
    payment_methods: ['cash', 'upi', 'card'],
    reviews: [
      {
        user: 'John Doe',
        rating: 4.5,
        comment: 'Good parking spot, safe and convenient',
        date: '2025-10-15'
      },
      {
        user: 'Jane Smith',
        rating: 4.0,
        comment: 'Easy to find and reasonable rates',
        date: '2025-10-20'
      },
      {
        user: 'Mike Johnson',
        rating: 3.5,
        comment: 'Decent parking but can get crowded during peak hours',
        date: '2025-10-25'
      }
    ],
    average_rating: 4.0,
    pricing: {
      hourly_rate: 50,
      daily_rate: 400,
      weekly_rate: 2500,
      monthly_rate: 8000
    },
    map_data: {
      static_map_url: `https://maps.googleapis.com/maps/api/staticmap?center=${28.6139},${77.2090}&zoom=15&size=600x400&markers=color:red%7C${28.6139},${77.2090}`,
      directions_url: `https://www.google.com/maps/dir/?api=1&destination=${28.6139},${77.2090}`
    }
  };

  res.json({
    success: true,
    disclaimer: '⚠️ THIS IS SIMULATION DATA - Not actual parking location details',
    message: 'Mock data including fake reviews and amenities',
    data: mockLocation
  });
});

/**
 * POST /api/informal-parking/check-availability
 * Check real-time availability (SIMULATION)
 */
router.post('/check-availability', (req, res) => {
  const { location_id } = req.body;

  if (!location_id) {
    return res.status(400).json({
      success: false,
      message: 'location_id is required'
    });
  }

  // Simulate real-time availability (random spots)
  const available_spots = Math.floor(Math.random() * 20) + 1;
  const total_spots = 30;
  const last_updated = new Date().toISOString();

  res.json({
    success: true,
    disclaimer: '⚠️ THIS IS SIMULATION DATA - Randomly generated availability',
    message: 'Mock real-time availability data',
    data: {
      location_id,
      available_spots,
      total_spots,
      occupancy_rate: ((total_spots - available_spots) / total_spots * 100).toFixed(2),
      is_available: available_spots > 0,
      last_updated,
      peak_hours: ['9:00 AM - 11:00 AM', '5:00 PM - 8:00 PM'],
      current_demand: available_spots < 5 ? 'high' : available_spots < 15 ? 'medium' : 'low'
    }
  });
});

/**
 * POST /api/informal-parking/simulate-booking
 * Simulate booking (DOES NOT STORE IN DATABASE)
 */
router.post('/simulate-booking', (req, res) => {
  const { location_id, duration, vehicle_number } = req.body;

  if (!location_id || !duration || !vehicle_number) {
    return res.status(400).json({
      success: false,
      message: 'location_id, duration, and vehicle_number are required'
    });
  }

  // Generate fake booking_id
  const fake_booking_id = `INFORMAL_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  const hourly_rate = 50;
  const total_amount = duration * hourly_rate;
  const start_time = new Date();
  const end_time = new Date(start_time.getTime() + duration * 60 * 60 * 1000);

  res.json({
    success: true,
    disclaimer: '⚠️ THIS IS A SIMULATION - Actual booking NOT created in database',
    message: 'This is simulation data only. No real booking has been made.',
    warning: 'This feature is not yet implemented. Please use formal parking bookings.',
    data: {
      fake_booking_id,
      location_id,
      vehicle_number,
      duration_hours: duration,
      hourly_rate,
      total_amount,
      start_time: start_time.toISOString(),
      end_time: end_time.toISOString(),
      status: 'simulated',
      payment_status: 'not_processed',
      note: 'This booking exists only in this response and is not stored anywhere'
    }
  });
});

/**
 * GET /api/informal-parking/search
 * Search parking locations by area/city (SIMULATION)
 */
router.get('/search', (req, res) => {
  const { area, city } = req.query;

  if (!area && !city) {
    return res.status(400).json({
      success: false,
      message: 'area or city query parameter is required'
    });
  }

  const searchTerm = area || city;

  // Generate mock search results
  const mockResults = [
    {
      location_id: `LOC${Date.now()}1`,
      location_name: `${searchTerm} Main Street Parking`,
      address: `Main Street, ${searchTerm}`,
      area: searchTerm,
      available_spots: Math.floor(Math.random() * 15) + 5,
      hourly_rate: Math.floor(Math.random() * 50) + 30,
      distance: (Math.random() * 3).toFixed(2),
      rating: (Math.random() * 1.5 + 3.5).toFixed(1)
    },
    {
      location_id: `LOC${Date.now()}2`,
      location_name: `${searchTerm} Central Parking`,
      address: `Central Avenue, ${searchTerm}`,
      area: searchTerm,
      available_spots: Math.floor(Math.random() * 15) + 5,
      hourly_rate: Math.floor(Math.random() * 50) + 30,
      distance: (Math.random() * 3).toFixed(2),
      rating: (Math.random() * 1.5 + 3.5).toFixed(1)
    },
    {
      location_id: `LOC${Date.now()}3`,
      location_name: `${searchTerm} Market Parking`,
      address: `Market Road, ${searchTerm}`,
      area: searchTerm,
      available_spots: Math.floor(Math.random() * 15) + 5,
      hourly_rate: Math.floor(Math.random() * 50) + 30,
      distance: (Math.random() * 3).toFixed(2),
      rating: (Math.random() * 1.5 + 3.5).toFixed(1)
    },
    {
      location_id: `LOC${Date.now()}4`,
      location_name: `${searchTerm} Station Parking`,
      address: `Station Road, ${searchTerm}`,
      area: searchTerm,
      available_spots: Math.floor(Math.random() * 15) + 5,
      hourly_rate: Math.floor(Math.random() * 50) + 30,
      distance: (Math.random() * 3).toFixed(2),
      rating: (Math.random() * 1.5 + 3.5).toFixed(1)
    }
  ];

  res.json({
    success: true,
    disclaimer: '⚠️ THIS IS SIMULATION DATA - Not actual parking locations',
    message: `Mock search results for "${searchTerm}"`,
    data: {
      search_term: searchTerm,
      locations: mockResults,
      count: mockResults.length,
      filters_available: ['price', 'distance', 'rating', 'availability']
    }
  });
});

module.exports = router;
