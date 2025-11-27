/**
 * Test Suite for Organization Model
 * Tests all database operations and statistics
 */

const {
  createOrganization,
  findById,
  updateOrganization,
  updateAvailableSlots,
  getOrganizationStats,
  getAllOrganizations,
  Organization
} = require('./Organization');
const { initializeDatabase, closeDatabase } = require('../config/db');
const { runQuery } = require('../config/db');

// Test counter
let totalTests = 0;
let passedTests = 0;

const test = async (name, fn) => {
  totalTests++;
  try {
    await fn();
    passedTests++;
    console.log(`✓ ${name}`);
  } catch (error) {
    console.log(`✗ ${name}`);
    console.error(`  Error: ${error.message}`);
  }
};

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
};

// Test data
const testOrgs = {
  org1: {
    org_name: 'Tech Corp',
    admin_name: 'John Admin',
    admin_email: 'admin@techcorp.com',
    admin_mobile: '9876543210',
    address: '123 Tech Street, Bangalore',
    total_slots: 50,
    visitor_hourly_rate: 20.00,
    parking_rules: 'No overnight parking. Speed limit 10 km/h.'
  },
  org2: {
    org_name: 'Business Hub',
    admin_name: 'Jane Manager',
    admin_email: 'manager@businesshub.com',
    admin_mobile: '9876543211',
    address: '456 Business Avenue, Mumbai',
    total_slots: 100,
    visitor_hourly_rate: 25.50,
    parking_rules: 'Visitor parking only. Members park free.'
  }
};

let createdOrgIds = [];

console.log('\n' + '='.repeat(70));
console.log('Testing Organization Model');
console.log('='.repeat(70) + '\n');

async function runTests() {
  try {
    // Initialize database
    console.log('Initializing test database...\n');
    await initializeDatabase();

    // ============================================================================
    // Test createOrganization Function
    // ============================================================================
    console.log('🏢 Testing createOrganization Function...\n');

    await test('createOrganization: Should create organization with all fields', async () => {
      const org = await createOrganization(
        testOrgs.org1.org_name,
        testOrgs.org1.admin_name,
        testOrgs.org1.admin_email,
        testOrgs.org1.admin_mobile,
        testOrgs.org1.address,
        testOrgs.org1.total_slots,
        testOrgs.org1.visitor_hourly_rate,
        testOrgs.org1.parking_rules
      );

      assert(org, 'Organization should be created');
      assert(org.id, 'Organization should have ID');
      assert(org.org_name === testOrgs.org1.org_name, 'Name should match');
      assert(org.admin_email === testOrgs.org1.admin_email, 'Email should match');
      assert(org.total_slots === testOrgs.org1.total_slots, 'Total slots should match');
      assert(org.available_slots === testOrgs.org1.total_slots, 'Available slots should equal total slots');
      assert(org.visitor_hourly_rate === testOrgs.org1.visitor_hourly_rate, 'Hourly rate should match');
      assert(org.member_parking_free === 1, 'Member parking should be free by default');

      createdOrgIds.push(org.id);
    });

    await test('createOrganization: Should set available_slots equal to total_slots', async () => {
      const org = await createOrganization(
        testOrgs.org2.org_name,
        testOrgs.org2.admin_name,
        testOrgs.org2.admin_email,
        testOrgs.org2.admin_mobile,
        testOrgs.org2.address,
        testOrgs.org2.total_slots,
        testOrgs.org2.visitor_hourly_rate,
        testOrgs.org2.parking_rules
      );

      assert(org.available_slots === org.total_slots, 'Available slots should equal total slots initially');
      assert(org.available_slots === 100, 'Available slots should be 100');

      createdOrgIds.push(org.id);
    });

    // ============================================================================
    // Test findById Function
    // ============================================================================
    console.log('\n🔍 Testing findById Function...\n');

    await test('findById: Should find organization by ID', async () => {
      const org = await findById(createdOrgIds[0]);

      assert(org, 'Organization should be found');
      assert(org.id === createdOrgIds[0], 'ID should match');
      assert(org.org_name === testOrgs.org1.org_name, 'Name should match');
      assert(org.admin_email === testOrgs.org1.admin_email, 'Email should match');
      assert(org.parking_rules === testOrgs.org1.parking_rules, 'Parking rules should match');
    });

    await test('findById: Should return null/undefined for non-existent ID', async () => {
      const org = await findById(99999);
      assert(!org, 'Should return null or undefined');
    });

    // ============================================================================
    // Test updateOrganization Function
    // ============================================================================
    console.log('\n✏️  Testing updateOrganization Function...\n');

    await test('updateOrganization: Should update organization fields', async () => {
      const updatedOrg = await updateOrganization(createdOrgIds[0], {
        org_name: 'Tech Corp Updated',
        visitor_hourly_rate: 30.00,
        parking_rules: 'Updated parking rules'
      });

      assert(updatedOrg, 'Updated organization should be returned');
      assert(updatedOrg.org_name === 'Tech Corp Updated', 'Name should be updated');
      assert(updatedOrg.visitor_hourly_rate === 30.00, 'Hourly rate should be updated');
      assert(updatedOrg.parking_rules === 'Updated parking rules', 'Parking rules should be updated');
      assert(updatedOrg.admin_email === testOrgs.org1.admin_email, 'Email should remain unchanged');
    });

    await test('updateOrganization: Should update admin information', async () => {
      const updatedOrg = await updateOrganization(createdOrgIds[0], {
        admin_name: 'New Admin',
        admin_mobile: '9999999999'
      });

      assert(updatedOrg.admin_name === 'New Admin', 'Admin name should be updated');
      assert(updatedOrg.admin_mobile === '9999999999', 'Admin mobile should be updated');
    });

    await test('updateOrganization: Should reject invalid fields', async () => {
      try {
        await updateOrganization(createdOrgIds[0], {
          invalid_field: 'test'
        });
        throw new Error('Should have thrown error');
      } catch (error) {
        assert(error.message.includes('No valid fields'), 'Should reject invalid fields');
      }
    });

    // ============================================================================
    // Test updateAvailableSlots Function
    // ============================================================================
    console.log('\n🅿️  Testing updateAvailableSlots Function...\n');

    await test('updateAvailableSlots: Should decrease available slots', async () => {
      const org = await findById(createdOrgIds[0]);
      const initialSlots = org.available_slots;

      const newCount = await updateAvailableSlots(createdOrgIds[0], -5);

      assert(newCount === initialSlots - 5, 'Should decrease by 5');
      
      // Verify in database
      const updatedOrg = await findById(createdOrgIds[0]);
      assert(updatedOrg.available_slots === newCount, 'Database should be updated');
    });

    await test('updateAvailableSlots: Should increase available slots', async () => {
      const org = await findById(createdOrgIds[0]);
      const initialSlots = org.available_slots;

      const newCount = await updateAvailableSlots(createdOrgIds[0], 3);

      assert(newCount === initialSlots + 3, 'Should increase by 3');
    });

    await test('updateAvailableSlots: Should not allow negative available_slots', async () => {
      try {
        await updateAvailableSlots(createdOrgIds[0], -1000);
        throw new Error('Should have thrown error');
      } catch (error) {
        assert(error.message.includes('Cannot decrease'), 'Should prevent negative slots');
      }
    });

    await test('updateAvailableSlots: Should not exceed total_slots', async () => {
      const org = await findById(createdOrgIds[0]);
      const excess = org.total_slots - org.available_slots + 10;

      try {
        await updateAvailableSlots(createdOrgIds[0], excess);
        throw new Error('Should have thrown error');
      } catch (error) {
        assert(error.message.includes('cannot exceed'), 'Should prevent exceeding total slots');
      }
    });

    // ============================================================================
    // Test getOrganizationStats Function
    // ============================================================================
    console.log('\n📊 Testing getOrganizationStats Function...\n');

    await test('getOrganizationStats: Should return correct structure', async () => {
      const stats = await getOrganizationStats(createdOrgIds[0]);

      assert(stats, 'Stats should be returned');
      assert(typeof stats.total_bookings === 'number', 'total_bookings should be a number');
      assert(typeof stats.active_bookings === 'number', 'active_bookings should be a number');
      assert(typeof stats.total_revenue === 'string', 'total_revenue should be a string');
      assert(typeof stats.occupancy_rate === 'number', 'occupancy_rate should be a number');
      assert(typeof stats.total_slots === 'number', 'total_slots should be a number');
      assert(typeof stats.available_slots === 'number', 'available_slots should be a number');
      assert(typeof stats.occupied_slots === 'number', 'occupied_slots should be a number');
    });

    await test('getOrganizationStats: Should calculate occupancy rate correctly', async () => {
      const org = await findById(createdOrgIds[0]);
      const stats = await getOrganizationStats(createdOrgIds[0]);

      const expectedOccupied = org.total_slots - org.available_slots;
      const expectedOccupancyRate = ((expectedOccupied / org.total_slots) * 100).toFixed(2);

      assert(stats.occupied_slots === expectedOccupied, 'Occupied slots should match');
      assert(parseFloat(stats.occupancy_rate) === parseFloat(expectedOccupancyRate), 'Occupancy rate should match');
    });

    await test('getOrganizationStats: Should return 0 bookings for new organization', async () => {
      const stats = await getOrganizationStats(createdOrgIds[0]);

      assert(stats.total_bookings === 0, 'New org should have 0 total bookings');
      assert(stats.active_bookings === 0, 'New org should have 0 active bookings');
      assert(parseFloat(stats.total_revenue) === 0, 'New org should have 0 revenue');
    });

    await test('getOrganizationStats: Should handle organization with bookings', async () => {
      // Create a test booking
      await runQuery(
        `INSERT INTO bookings (user_id, organization_id, slot_number, vehicle_number, 
         booking_start_time, booking_end_time, duration_hours, booking_status, payment_status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [1, createdOrgIds[0], 'A-101', 'KA01AB1234', 
         '2025-10-30 10:00:00', '2025-10-30 12:00:00', 2, 'active', 'pending']
      );

      // Create another booking
      await runQuery(
        `INSERT INTO bookings (user_id, organization_id, slot_number, vehicle_number, 
         booking_start_time, booking_end_time, duration_hours, booking_status, payment_status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [1, createdOrgIds[0], 'A-102', 'KA01AB5678', 
         '2025-10-30 11:00:00', '2025-10-30 13:00:00', 2, 'completed', 'completed']
      );

      const stats = await getOrganizationStats(createdOrgIds[0]);

      assert(stats.total_bookings === 2, 'Should have 2 total bookings');
      assert(stats.active_bookings === 1, 'Should have 1 active booking');
    });

    await test('getOrganizationStats: Should calculate revenue from completed payments', async () => {
      // Get the completed booking
      const { getRow } = require('../config/db');
      const booking = await getRow(
        `SELECT id FROM bookings WHERE organization_id = ? AND booking_status = ? LIMIT 1`,
        [createdOrgIds[0], 'completed']
      );

      if (booking && booking.id) {
        await runQuery(
          `INSERT INTO payments (booking_id, amount, payment_method, payment_status, transaction_id) 
           VALUES (?, ?, ?, ?, ?)`,
          [booking.id, 50.00, 'online', 'completed', 'TXN123456']
        );

        const stats = await getOrganizationStats(createdOrgIds[0]);
        assert(parseFloat(stats.total_revenue) > 0, 'Should have revenue from completed payment');
      }
    });

    // ============================================================================
    // Test getAllOrganizations Function
    // ============================================================================
    console.log('\n📋 Testing getAllOrganizations Function...\n');

    await test('getAllOrganizations: Should return all organizations', async () => {
      const orgs = await getAllOrganizations();

      assert(Array.isArray(orgs), 'Should return an array');
      assert(orgs.length >= 2, 'Should have at least 2 organizations');
    });

    await test('getAllOrganizations: Should return organizations with basic info', async () => {
      const orgs = await getAllOrganizations();

      orgs.forEach(org => {
        assert(org.id, 'Should have id');
        assert(org.org_name, 'Should have org_name');
        assert(org.admin_email, 'Should have admin_email');
        assert(typeof org.total_slots === 'number', 'Should have total_slots');
        assert(typeof org.available_slots === 'number', 'Should have available_slots');
      });
    });

    await test('getAllOrganizations: Should be ordered by org_name', async () => {
      const orgs = await getAllOrganizations();

      if (orgs.length > 1) {
        // Check if sorted alphabetically
        for (let i = 1; i < orgs.length; i++) {
          const prevName = orgs[i - 1].org_name.toLowerCase();
          const currName = orgs[i].org_name.toLowerCase();
          assert(prevName <= currName, 'Should be ordered alphabetically');
        }
      }
    });

    // ============================================================================
    // Test Edge Cases
    // ============================================================================
    console.log('\n⚠️  Testing Edge Cases...\n');

    await test('Edge Case: getOrganizationStats for non-existent org', async () => {
      try {
        await getOrganizationStats(99999);
        throw new Error('Should have thrown error');
      } catch (error) {
        assert(error.message.includes('not found'), 'Should throw not found error');
      }
    });

    await test('Edge Case: updateAvailableSlots for non-existent org', async () => {
      try {
        await updateAvailableSlots(99999, 5);
        throw new Error('Should have thrown error');
      } catch (error) {
        assert(error.message.includes('not found'), 'Should throw not found error');
      }
    });

    await test('Edge Case: Organization with 0 total_slots', async () => {
      // This should fail due to CHECK constraint
      try {
        await createOrganization(
          'Zero Slots Org',
          'Admin',
          'zero@test.com',
          '9876543213',
          'Address',
          0, // 0 total_slots
          10.00,
          'Rules'
        );
        throw new Error('Should have thrown error');
      } catch (error) {
        assert(error.message.includes('CONSTRAINT') || error.message.includes('CHECK'), 
               'Should fail CHECK constraint');
      }
    });

    // ============================================================================
    // Cleanup
    // ============================================================================
    console.log('\n🧹 Cleaning up test data...\n');

    // Delete test bookings and payments
    await runQuery('DELETE FROM payments WHERE booking_id IN (SELECT id FROM bookings WHERE organization_id IN (?, ?))', 
                   [createdOrgIds[0], createdOrgIds[1]]);
    await runQuery('DELETE FROM bookings WHERE organization_id IN (?, ?)', 
                   [createdOrgIds[0], createdOrgIds[1]]);
    
    // Delete test organizations
    for (const orgId of createdOrgIds) {
      await Organization.delete(orgId);
    }

    console.log('Test data cleaned up.\n');

  } catch (error) {
    console.error('Test execution error:', error);
  } finally {
    // Close database
    await closeDatabase();
  }
}

// Run all tests
runTests().then(() => {
  // Test Summary
  console.log('='.repeat(70));
  console.log('Test Summary');
  console.log('='.repeat(70));
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${totalTests - passedTests}`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(2)}%`);
  console.log('='.repeat(70) + '\n');

  if (passedTests === totalTests) {
    console.log('🎉 All tests passed!\n');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed.\n');
    process.exit(1);
  }
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
