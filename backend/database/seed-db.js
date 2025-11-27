/**
 * Database Seeding Script with Bcrypt Password Hashing
 * Populates database with sample data
 * Usage: node backend/database/seed-db.js
 */

const bcrypt = require('bcrypt');
const { getDatabase, closeDatabase } = require('../config/db');

const seedDatabase = async () => {
  try {
    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║          ParkMitra Database Seeding Script               ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');
    
    const db = await getDatabase();
    
    // Hash password for all users (password123)
    console.log('[SEED INFO] Hashing passwords with bcrypt...');
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('[SEED SUCCESS] ✓ Password hashed successfully\n');
    
    let successCount = 0;
    let errorCount = 0;
    
    // Helper function to execute SQL
    const runSQL = (sql, params = []) => {
      return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ lastID: this.lastID, changes: this.changes });
          }
        });
      });
    };
    
    // =============================================================================
    // 1. ORGANIZATIONS
    // =============================================================================
    console.log('[SEED INFO] Inserting organizations...');
    
    const organizations = [
      ['Tech Corp Plaza', 'Rajesh Kumar', 'admin@techcorp.com', '9876543210', '123 Tech Street, Whitefield, Bangalore 560066', 50, 45, 1, 50.00, 'No overnight parking. Maintain speed limit.', '8:00 AM - 8:00 PM'],
      ['City Mall', 'Priya Sharma', 'admin@citymall.com', '9876543211', '456 Mall Road, Andheri West, Mumbai 400053', 100, 85, 1, 30.00, 'Follow parking attendant instructions.', '10:00 AM - 10:00 PM'],
      ['Central Hospital', 'Dr. Amit Patel', 'admin@hospital.com', '9876543212', '789 Hospital Avenue, Connaught Place, Delhi 110001', 75, 60, 1, 40.00, 'Emergency vehicle priority. No honking.', '24 Hours'],
      ['Corporate Tower', 'Suresh Menon', 'admin@corptower.com', '9876543213', '321 Business District, Electronic City, Bangalore 560100', 120, 100, 1, 45.00, 'Visitor parking on Level 1.', '7:00 AM - 9:00 PM']
    ];
    
    for (const org of organizations) {
      try {
        await runSQL(
          `INSERT INTO organizations (org_name, admin_name, admin_email, admin_mobile, address, total_slots, available_slots, member_parking_free, visitor_hourly_rate, parking_rules, operating_hours) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          org
        );
        console.log(`[SEED SUCCESS] ✓ Organization: ${org[0]}`);
        successCount++;
      } catch (err) {
        console.error(`[SEED ERROR] Failed to insert organization ${org[0]}:`, err.message);
        errorCount++;
      }
    }
    
    // =============================================================================
    // 2. USERS
    // =============================================================================
    console.log('\n[SEED INFO] Inserting users...');
    
    const users = [
      // Organization Members - Tech Corp Plaza (org_id: 1)
      ['John Member', 'member@test.com', hashedPassword, '9988776655', 'organization_member', 1, 'EMP001', 1],
      ['Sarah Johnson', 'sarah@techcorp.com', hashedPassword, '9988776656', 'organization_member', 1, 'EMP002', 1],
      ['Rajesh Verma', 'rajesh@techcorp.com', hashedPassword, '9988776659', 'organization_member', 1, 'EMP003', 1],
      
      // Organization Members - City Mall (org_id: 2)
      ['Mike Wilson', 'mike@citymall.com', hashedPassword, '9988776657', 'organization_member', 2, 'EMP101', 1],
      ['Priya Singh', 'priya@citymall.com', hashedPassword, '9988776662', 'organization_member', 2, 'EMP102', 1],
      
      // Organization Members - Central Hospital (org_id: 3)
      ['Emily Davis', 'emily@hospital.com', hashedPassword, '9988776658', 'organization_member', 3, 'EMP201', 1],
      ['Dr. Anand Kumar', 'anand@hospital.com', hashedPassword, '9988776663', 'organization_member', 3, 'DOC001', 1],
      
      // Organization Members - Corporate Tower (org_id: 4)
      ['Vikram Joshi', 'vikram@corptower.com', hashedPassword, '9988776664', 'organization_member', 4, 'EMP301', 1],
      
      // Visitors
      ['Jane Visitor', 'visitor@test.com', hashedPassword, '9988776660', 'visitor', null, null, 1],
      ['Tom Guest', 'guest@test.com', hashedPassword, '9988776661', 'visitor', null, null, 1],
      ['Robert Brown', 'robert@gmail.com', hashedPassword, '9988776665', 'visitor', null, null, 1]
    ];
    
    for (const user of users) {
      try {
        await runSQL(
          `INSERT INTO users (name, email, password, mobile, user_type, organization_id, employee_id, is_verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          user
        );
        console.log(`[SEED SUCCESS] ✓ User: ${user[0]} (${user[1]})`);
        successCount++;
      } catch (err) {
        console.error(`[SEED ERROR] Failed to insert user ${user[0]}:`, err.message);
        errorCount++;
      }
    }
    
    // =============================================================================
    // 3. WATCHMEN
    // =============================================================================
    console.log('\n[SEED INFO] Inserting watchmen...');
    
    const watchmen = [
      ['Ram Kumar', 'watchman@test.com', hashedPassword, '9988776670', 1, 'Morning 8AM-4PM', 1],
      ['Shyam Singh', 'watchman2@test.com', hashedPassword, '9988776671', 2, 'Evening 4PM-12AM', 1],
      ['Raju Patil', 'watchman3@test.com', hashedPassword, '9988776672', 3, 'Night 12AM-8AM', 1],
      ['Mohan Reddy', 'watchman4@test.com', hashedPassword, '9988776673', 4, 'Day 7AM-3PM', 1]
    ];
    
    for (const watchman of watchmen) {
      try {
        await runSQL(
          `INSERT INTO watchmen (name, email, password, mobile, organization_id, assigned_shift, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          watchman
        );
        console.log(`[SEED SUCCESS] ✓ Watchman: ${watchman[0]} (${watchman[1]})`);
        successCount++;
      } catch (err) {
        console.error(`[SEED ERROR] Failed to insert watchman ${watchman[0]}:`, err.message);
        errorCount++;
      }
    }
    
    // =============================================================================
    // 4. BOOKINGS
    // =============================================================================
    console.log('\n[SEED INFO] Inserting bookings...');
    
    const bookings = [
      // Active bookings
      [1, 1, 'MH12AB1234', 'A-103', new Date(Date.now() - 3600000).toISOString(), new Date(Date.now() + 10800000).toISOString(), 4.0, 0.00, 'completed', 'active', 'QR-TECH-001', new Date(Date.now() - 3600000).toISOString()],
      [9, 2, 'MH14CD5678', 'M1-002', new Date(Date.now() - 1800000).toISOString(), new Date(Date.now() + 7200000).toISOString(), 2.5, 75.00, 'completed', 'active', 'QR-MALL-001', new Date(Date.now() - 1800000).toISOString()],
      [6, 3, 'DL08GH3456', 'H-004', new Date(Date.now() - 7200000).toISOString(), new Date(Date.now() + 7200000).toISOString(), 4.0, 0.00, 'completed', 'active', 'QR-HOSP-001', new Date(Date.now() - 7200000).toISOString()],
      
      // Completed bookings
      [1, 1, 'MH12AB1234', 'A-101', new Date(Date.now() - 259200000).toISOString(), new Date(Date.now() - 244800000).toISOString(), 4.0, 0.00, 'completed', 'completed', 'QR-TECH-002', new Date(Date.now() - 259200000).toISOString()],
      [9, 2, 'MH14CD5678', 'M1-001', new Date(Date.now() - 432000000).toISOString(), new Date(Date.now() - 424800000).toISOString(), 2.0, 60.00, 'completed', 'completed', 'QR-MALL-002', new Date(Date.now() - 432000000).toISOString()]
    ];
    
    for (const [idx, booking] of bookings.entries()) {
      try {
        await runSQL(
          `INSERT INTO bookings (user_id, organization_id, vehicle_number, slot_number, booking_start_time, booking_end_time, duration_hours, amount, payment_status, booking_status, qr_code_data, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          booking
        );
        console.log(`[SEED SUCCESS] ✓ Booking ${idx + 1}: ${booking[2]} at ${booking[3]}`);
        successCount++;
      } catch (err) {
        console.error(`[SEED ERROR] Failed to insert booking ${idx + 1}:`, err.message);
        errorCount++;
      }
    }
    
    // =============================================================================
    // 5. PAYMENTS
    // =============================================================================
    console.log('\n[SEED INFO] Inserting payments...');
    
    const payments = [
      [1, 0.00, 'online', 'completed', 'FREE-MEMBER-001', new Date(Date.now() - 3600000).toISOString()],
      [2, 75.00, 'online', 'completed', 'TXN-' + Date.now(), new Date(Date.now() - 1800000).toISOString()],
      [3, 0.00, 'online', 'completed', 'FREE-MEMBER-002', new Date(Date.now() - 7200000).toISOString()],
      [4, 0.00, 'online', 'completed', 'FREE-MEMBER-003', new Date(Date.now() - 259200000).toISOString()],
      [5, 60.00, 'online', 'completed', 'TXN-' + (Date.now() - 1000), new Date(Date.now() - 432000000).toISOString()]
    ];
    
    for (const [idx, payment] of payments.entries()) {
      try {
        await runSQL(
          `INSERT INTO payments (booking_id, amount, payment_method, payment_status, transaction_id, payment_timestamp) VALUES (?, ?, ?, ?, ?, ?)`,
          payment
        );
        console.log(`[SEED SUCCESS] ✓ Payment ${idx + 1}: ₹${payment[1]} - ${payment[3]}`);
        successCount++;
      } catch (err) {
        console.error(`[SEED ERROR] Failed to insert payment ${idx + 1}:`, err.message);
        errorCount++;
      }
    }
    
    // =============================================================================
    // 6. INFORMAL PARKING LOCATIONS
    // =============================================================================
    console.log('\n[SEED INFO] Inserting informal parking locations...');
    
    const informalParking = [
      ['MG Road Street Parking', 'MG Road, Brigade Road Junction, Bangalore 560001', 12.9716, 77.5946, 20, 15, 20.00, 1],
      ['Brigade Road Parking', 'Brigade Road, Near Commercial Street, Bangalore 560025', 12.9719, 77.5937, 15, 8, 25.00, 1],
      ['Indiranagar 100ft Road', '100 Feet Road, Indiranagar, Bangalore 560038', 12.9784, 77.6408, 25, 20, 15.00, 1],
      ['Koramangala 80ft Road', '80 Feet Road, Koramangala 4th Block, Bangalore 560095', 12.9352, 77.6245, 30, 18, 18.00, 1],
      ['Church Street Parking', 'Church Street, Near Trinity Circle, Bangalore 560001', 12.9730, 77.6070, 18, 10, 30.00, 1],
      ['Commercial Street', 'Commercial Street, Shivaji Nagar, Bangalore 560007', 12.9823, 77.6107, 22, 14, 22.00, 1],
      ['Whitefield Main Road', 'Whitefield Main Road, ITPL Area, Bangalore 560066', 12.9698, 77.7499, 35, 25, 20.00, 1],
      ['HSR Layout BDA Complex', 'BDA Complex, HSR Layout Sector 1, Bangalore 560102', 12.9116, 77.6389, 28, 15, 18.00, 1]
    ];
    
    for (const location of informalParking) {
      try {
        await runSQL(
          `INSERT INTO informal_parking (location_name, address, latitude, longitude, total_spots, available_spots, hourly_rate, is_simulated) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          location
        );
        console.log(`[SEED SUCCESS] ✓ Informal Parking: ${location[0]}`);
        successCount++;
      } catch (err) {
        console.error(`[SEED ERROR] Failed to insert informal parking ${location[0]}:`, err.message);
        errorCount++;
      }
    }
    
    // =============================================================================
    // Display Summary
    // =============================================================================
    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║              Database Seeding Summary                    ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log(`✓ Successful inserts: ${successCount}`);
    console.log(`✗ Failed inserts: ${errorCount}`);
    console.log(`\n[SEED INFO] Verifying data counts...\n`);
    
    // Count records
    const counts = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          (SELECT COUNT(*) FROM organizations) as organizations,
          (SELECT COUNT(*) FROM users) as users,
          (SELECT COUNT(*) FROM watchmen) as watchmen,
          (SELECT COUNT(*) FROM bookings) as bookings,
          (SELECT COUNT(*) FROM payments) as payments,
          (SELECT COUNT(*) FROM informal_parking) as informal_parking
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows[0]);
      });
    });
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('              DATA INSERTED SUCCESSFULLY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  Organizations:      ${counts.organizations}`);
    console.log(`  Users:              ${counts.users}`);
    console.log(`  Watchmen:           ${counts.watchmen}`);
    console.log(`  Bookings:           ${counts.bookings}`);
    console.log(`  Payments:           ${counts.payments}`);
    console.log(`  Informal Parking:   ${counts.informal_parking}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('✅ Database seeded successfully!');
    console.log('\n📝 TEST CREDENTIALS (All passwords: "password123"):\n');
    console.log('   Members:  member@test.com, sarah@techcorp.com');
    console.log('   Visitors: visitor@test.com, guest@test.com');
    console.log('   Watchmen: watchman@test.com, watchman2@test.com');
    console.log('   Admins:   admin@techcorp.com, admin@citymall.com\n');
    console.log('Next step: Start server with "npm run dev"\n');
    
    await closeDatabase();
    process.exit(errorCount > 0 ? 1 : 0);
  } catch (error) {
    console.error('\n╔══════════════════════════════════════════════════════════╗');
    console.error('║              ✗ Seeding Failed!                           ║');
    console.error('╚══════════════════════════════════════════════════════════╝\n');
    console.error('Error:', error.message);
    
    if (error.code === 'MODULE_NOT_FOUND' && error.message.includes('bcrypt')) {
      console.error('\n❌ bcrypt module not found!');
      console.error('Please install it: npm install bcrypt\n');
    } else {
      console.error('\nPlease check:');
      console.error('  - Database has been initialized (run init-db.js first)');
      console.error('  - No duplicate data exists');
      console.error('  - bcrypt is installed: npm install bcrypt\n');
    }
    
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    
    try {
      await closeDatabase();
    } catch (closeErr) {
      // Ignore close errors
    }
    process.exit(1);
  }
};

// Run seeding
seedDatabase();
