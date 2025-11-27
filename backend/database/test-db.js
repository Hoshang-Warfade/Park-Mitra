/**
 * Database Connection Test Script
 * Verifies database connection, initialization, and basic operations
 * Usage: node backend/database/test-db.js
 */

const { getDatabase, runQuery, getRow, getAllRows, closeDatabase } = require('../config/db');

const testDatabase = async () => {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║          ParkMitra Database Test Suite                  ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  let testsPassed = 0;
  let testsFailed = 0;

  try {
    // Test 1: Database Connection
    console.log('📋 Test 1: Database Connection');
    const db = await getDatabase();
    if (db) {
      console.log('   ✓ Database connection established\n');
      testsPassed++;
    } else {
      throw new Error('Failed to get database instance');
    }

    // Test 2: Check Foreign Keys
    console.log('📋 Test 2: Foreign Key Constraints');
    const fkResult = await getRow('PRAGMA foreign_keys');
    if (fkResult && fkResult.foreign_keys === 1) {
      console.log('   ✓ Foreign key constraints enabled\n');
      testsPassed++;
    } else {
      console.log('   ✗ Foreign key constraints not enabled\n');
      testsFailed++;
    }

    // Test 3: Check Tables Exist
    console.log('📋 Test 3: Table Existence Check');
    const tables = await getAllRows(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    );
    
    const requiredTables = [
      'organizations',
      'users',
      'watchmen',
      'bookings',
      'payments',
      'informal_parking'
    ];
    
    const existingTables = tables.map(t => t.name);
    let allTablesExist = true;
    
    for (const table of requiredTables) {
      if (existingTables.includes(table)) {
        console.log(`   ✓ Table exists: ${table}`);
      } else {
        console.log(`   ✗ Table missing: ${table}`);
        allTablesExist = false;
      }
    }
    
    if (allTablesExist) {
      testsPassed++;
      console.log('   ✓ All required tables exist\n');
    } else {
      testsFailed++;
      console.log('   ✗ Some tables are missing\n');
    }

    // Test 4: Check Indexes
    console.log('📋 Test 4: Index Verification');
    const indexes = await getAllRows(
      "SELECT name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    );
    
    if (indexes.length > 0) {
      console.log(`   ✓ Found ${indexes.length} indexes:`);
      indexes.slice(0, 5).forEach(idx => {
        console.log(`     - ${idx.name}`);
      });
      if (indexes.length > 5) {
        console.log(`     ... and ${indexes.length - 5} more`);
      }
      testsPassed++;
    } else {
      console.log('   ✗ No indexes found');
      testsFailed++;
    }
    console.log('');

    // Test 5: Sample Data Check
    console.log('📋 Test 5: Sample Data Verification');
    
    const orgCount = await getRow('SELECT COUNT(*) as count FROM organizations');
    console.log(`   Organizations: ${orgCount.count}`);
    
    const userCount = await getRow('SELECT COUNT(*) as count FROM users');
    console.log(`   Users: ${userCount.count}`);
    
    const bookingCount = await getRow('SELECT COUNT(*) as count FROM bookings');
    console.log(`   Bookings: ${bookingCount.count}`);
    
    const paymentCount = await getRow('SELECT COUNT(*) as count FROM payments');
    console.log(`   Payments: ${paymentCount.count}`);
    
    if (orgCount.count > 0 && userCount.count > 0) {
      console.log('   ✓ Sample data present\n');
      testsPassed++;
    } else {
      console.log('   ⚠️  No sample data (run seed-db.js to add data)\n');
      testsPassed++; // Not a failure, just informational
    }

    // Test 6: Query Performance
    console.log('📋 Test 6: Query Performance Test');
    const startTime = Date.now();
    
    await getAllRows(`
      SELECT b.*, u.name as user_name, o.org_name 
      FROM bookings b
      LEFT JOIN users u ON b.user_id = u.id
      LEFT JOIN organizations o ON b.organization_id = o.id
      LIMIT 10
    `);
    
    const queryTime = Date.now() - startTime;
    console.log(`   ✓ Complex JOIN query executed in ${queryTime}ms\n`);
    testsPassed++;

    // Test 7: User Type Constraint
    console.log('📋 Test 7: User Type CHECK Constraint');
    try {
      await runQuery(
        `INSERT INTO users (name, email, mobile, password, user_type) 
         VALUES (?, ?, ?, ?, ?)`,
        ['Test User', 'test@invalid.com', '9999999999', 'password123', 'invalid_type']
      );
      console.log('   ✗ CHECK constraint not working (invalid user_type accepted)\n');
      testsFailed++;
      
      // Cleanup
      await runQuery('DELETE FROM users WHERE email = ?', ['test@invalid.com']);
    } catch (error) {
      if (error.message.includes('constraint')) {
        console.log('   ✓ CHECK constraint working (invalid user_type rejected)\n');
        testsPassed++;
      } else {
        console.log('   ✗ Unexpected error:', error.message, '\n');
        testsFailed++;
      }
    }

    // Test 8: Foreign Key Constraint
    console.log('📋 Test 8: Foreign Key Constraint Test');
    try {
      await runQuery(
        `INSERT INTO bookings (user_id, organization_id, vehicle_number, booking_start_time, booking_end_time, duration_hours, amount) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [99999, 99999, 'TEST1234', '2025-10-30 10:00:00', '2025-10-30 12:00:00', 2, 100]
      );
      console.log('   ✗ Foreign key constraint not working (invalid references accepted)\n');
      testsFailed++;
      
      // Cleanup
      await runQuery('DELETE FROM bookings WHERE vehicle_number = ?', ['TEST1234']);
    } catch (error) {
      if (error.message.includes('foreign key') || error.message.includes('FOREIGN KEY')) {
        console.log('   ✓ Foreign key constraint working (invalid references rejected)\n');
        testsPassed++;
      } else {
        console.log('   ✗ Unexpected error:', error.message, '\n');
        testsFailed++;
      }
    }

    // Test Summary
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║                    Test Summary                          ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log(`✓ Tests Passed: ${testsPassed}`);
    console.log(`✗ Tests Failed: ${testsFailed}`);
    console.log(`Total Tests: ${testsPassed + testsFailed}`);
    console.log(`Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%\n`);

    if (testsFailed === 0) {
      console.log('🎉 All tests passed! Database is ready for use.\n');
      await closeDatabase();
      process.exit(0);
    } else {
      console.log('⚠️  Some tests failed. Please review the errors above.\n');
      await closeDatabase();
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Critical Error:', error.message);
    console.error('Stack:', error.stack);
    await closeDatabase();
    process.exit(1);
  }
};

// Run tests
testDatabase();
