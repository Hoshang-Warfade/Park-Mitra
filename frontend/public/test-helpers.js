// Quick Test Data Generator for ParkMitra Integration Tests
// Run this in browser console after loading the app

const testData = {
  // Flow 1: Organization Registration
  organization: {
    org_name: "Test Tech Park",
    address: "123 Tech Avenue, Innovation District, Bangalore 560001",
    operating_hours: "Monday-Friday 9AM-6PM, Saturday 9AM-2PM",
    admin_name: "Admin User",
    admin_email: `admin.${Date.now()}@testtech.com`, // Unique email
    admin_mobile: "9876543210",
    admin_password: "Admin@123",
    total_slots: "100",
    visitor_hourly_rate: "50",
    parking_rules: "No overnight parking. Follow security guidelines. Helmets mandatory for two-wheelers."
  },

  // Flow 2: Member Registration
  member: {
    name: "Test Member",
    email: `member.${Date.now()}@testtech.com`,
    mobile: "9876543211",
    password: "Member@123",
    user_type: "organization_member",
    employee_id: "EMP001"
  },

  // Member Booking Data
  memberBooking: {
    vehicle_number: "KA01AB1234",
    vehicle_type: "Car",
    // Set start time to 1 hour from now
    booking_start_time: new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16),
    // Set end time to 3 hours from now (2 hour duration)
    booking_end_time: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString().slice(0, 16)
  },

  // Flow 3: Visitor Registration
  visitor: {
    name: "Test Visitor",
    email: `visitor.${Date.now()}@test.com`,
    mobile: "9876543212",
    password: "Visitor@123",
    user_type: "visitor"
  },

  // Visitor Booking Data
  visitorBooking: {
    vehicle_number: "KA02CD5678",
    vehicle_type: "Car",
    booking_start_time: new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16),
    booking_end_time: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString().slice(0, 16)
  },

  // Payment Simulation
  payment: {
    payment_method_type: "card" // or "upi", "netbanking"
  },

  // Flow 4: Watchman (use seeded data)
  watchman: {
    email: "watchman@testtech.com",
    password: "Watchman@123"
  }
};

// Helper function to fill form fields
function fillForm(data) {
  Object.keys(data).forEach(key => {
    const input = document.querySelector(`[name="${key}"], #${key}`);
    if (input) {
      if (input.type === 'select-one') {
        // For dropdowns, try to find option by text or value
        const option = Array.from(input.options).find(opt => 
          opt.text.includes(data[key]) || opt.value === data[key]
        );
        if (option) input.value = option.value;
      } else {
        input.value = data[key];
        // Trigger change event for React
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  });
}

// Auto-fill functions for each flow
window.testHelpers = {
  // Flow 1: Fill organization registration form
  fillOrgRegistration: () => {
    console.log('Filling organization registration form...');
    fillForm(testData.organization);
    console.log('✅ Form filled! Review and click Submit.');
  },

  // Flow 2: Fill member registration form
  fillMemberRegistration: () => {
    console.log('Filling member registration form...');
    fillForm(testData.member);
    console.log('✅ Form filled! Select organization and click Submit.');
  },

  // Fill member booking form
  fillMemberBooking: () => {
    console.log('Filling member booking form...');
    fillForm(testData.memberBooking);
    console.log('✅ Form filled! Review amount (should be FREE) and submit.');
  },

  // Flow 3: Fill visitor registration form
  fillVisitorRegistration: () => {
    console.log('Filling visitor registration form...');
    fillForm(testData.visitor);
    console.log('✅ Form filled! Click Submit.');
  },

  // Fill visitor booking form
  fillVisitorBooking: () => {
    console.log('Filling visitor booking form...');
    fillForm(testData.visitorBooking);
    console.log('✅ Form filled! Review amount (should be ₹100) and proceed to payment.');
  },

  // Check localStorage
  checkAuth: () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    console.log('Token:', token ? '✅ Present' : '❌ Missing');
    console.log('User:', user ? JSON.parse(user) : '❌ Missing');
    return { token, user: user ? JSON.parse(user) : null };
  },

  // Clear auth for new test
  clearAuth: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    console.log('✅ Auth cleared. Reload page to test login.');
  },

  // Get test data
  getTestData: () => {
    console.log('Test Data:', testData);
    return testData;
  },

  // Test API endpoints directly
  testAPI: {
    // Test organization list
    getOrganizations: async () => {
      try {
        const response = await fetch('http://localhost:5000/api/organizations/all');
        const data = await response.json();
        console.log('Organizations:', data);
        return data;
      } catch (error) {
        console.error('❌ Error fetching organizations:', error);
      }
    },

    // Test booking creation (requires auth)
    createBooking: async (bookingData) => {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('❌ No auth token. Please login first.');
        return;
      }

      try {
        const response = await fetch('http://localhost:5000/api/bookings/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(bookingData)
        });
        const data = await response.json();
        console.log('Booking Response:', data);
        return data;
      } catch (error) {
        console.error('❌ Error creating booking:', error);
      }
    },

    // Test user bookings
    getUserBookings: async () => {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      if (!token || !user.id) {
        console.error('❌ No auth token or user ID. Please login first.');
        return;
      }

      try {
        const response = await fetch(`http://localhost:5000/api/bookings/user/${user.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        console.log('User Bookings:', data);
        return data;
      } catch (error) {
        console.error('❌ Error fetching bookings:', error);
      }
    }
  }
};

// Print usage instructions
console.log(`
╔════════════════════════════════════════════════════════════╗
║         ParkMitra Integration Test Helpers                 ║
╚════════════════════════════════════════════════════════════╝

Available commands:

📝 FORM FILLING:
  testHelpers.fillOrgRegistration()     - Fill organization registration
  testHelpers.fillMemberRegistration()  - Fill member registration
  testHelpers.fillMemberBooking()       - Fill member booking form
  testHelpers.fillVisitorRegistration() - Fill visitor registration
  testHelpers.fillVisitorBooking()      - Fill visitor booking form

🔐 AUTH HELPERS:
  testHelpers.checkAuth()               - Check localStorage auth
  testHelpers.clearAuth()               - Clear auth and logout

📊 DATA HELPERS:
  testHelpers.getTestData()             - View all test data

🔌 API TESTING:
  testHelpers.testAPI.getOrganizations()     - Test GET /organizations/all
  testHelpers.testAPI.createBooking(data)    - Test POST /bookings/create
  testHelpers.testAPI.getUserBookings()      - Test GET /bookings/user/:id

USAGE EXAMPLE:
  1. Navigate to /register-organization
  2. Run: testHelpers.fillOrgRegistration()
  3. Click "Next" and "Submit"
  4. Verify success and login

═══════════════════════════════════════════════════════════
`);

console.log('✅ Test helpers loaded! Type testHelpers to see available commands.');
