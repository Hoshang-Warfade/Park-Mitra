/**
 * Quick Database View Script
 * View sample data from the database
 * Usage: node backend/database/view-db.js
 */

const { getDatabase, getAllRows, getRow, closeDatabase } = require('../config/db');

const viewDatabase = async () => {
  try {
    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║          ParkMitra Database Contents                    ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');

    // Ensure database connection
    await getDatabase();
    
    // Give a small delay for connection to stabilize
    await new Promise(resolve => setTimeout(resolve, 500));

    // Organizations
    console.log('📊 ORGANIZATIONS');
    console.log('═'.repeat(80));
    const orgs = await getAllRows('SELECT id, org_name, admin_name, total_slots, available_slots, member_parking_free FROM organizations');
    orgs.forEach(org => {
      console.log(`ID: ${org.id} | ${org.org_name}`);
      console.log(`  Admin: ${org.admin_name}`);
      console.log(`  Slots: ${org.available_slots}/${org.total_slots} available`);
      console.log(`  Member Parking: ${org.member_parking_free ? 'FREE' : 'PAID'}`);
      console.log('');
    });

    // Users
    console.log('\n👥 USERS');
    console.log('═'.repeat(80));
    const users = await getAllRows('SELECT id, name, email, user_type, employee_id, organization_id FROM users');
    users.forEach(user => {
      console.log(`ID: ${user.id} | ${user.name} (${user.user_type})`);
      console.log(`  Email: ${user.email}`);
      if (user.employee_id) console.log(`  Employee ID: ${user.employee_id}`);
      if (user.organization_id) console.log(`  Organization ID: ${user.organization_id}`);
      console.log('');
    });

    // Watchmen
    console.log('\n🔐 WATCHMEN');
    console.log('═'.repeat(80));
    const watchmen = await getAllRows('SELECT id, name, email, assigned_shift, organization_id, is_active FROM watchmen');
    watchmen.forEach(w => {
      console.log(`ID: ${w.id} | ${w.name} ${w.is_active ? '✓' : '✗'}`);
      console.log(`  Email: ${w.email}`);
      console.log(`  Shift: ${w.assigned_shift || 'Not assigned'}`);
      console.log(`  Organization ID: ${w.organization_id}`);
      console.log('');
    });

    // Bookings
    console.log('\n🅿️  BOOKINGS');
    console.log('═'.repeat(80));
    const bookings = await getAllRows(`
      SELECT 
        b.id, b.vehicle_number, b.slot_number, b.booking_status, 
        b.payment_status, b.amount, b.duration_hours,
        u.name as user_name, o.org_name
      FROM bookings b
      LEFT JOIN users u ON b.user_id = u.id
      LEFT JOIN organizations o ON b.organization_id = o.id
    `);
    bookings.forEach(b => {
      console.log(`ID: ${b.id} | ${b.vehicle_number} - Slot ${b.slot_number || 'TBD'}`);
      console.log(`  User: ${b.user_name}`);
      console.log(`  Location: ${b.org_name}`);
      console.log(`  Duration: ${b.duration_hours} hours | Amount: ₹${b.amount}`);
      console.log(`  Status: ${b.booking_status} | Payment: ${b.payment_status}`);
      console.log('');
    });

    // Payments
    console.log('\n💳 PAYMENTS');
    console.log('═'.repeat(80));
    const payments = await getAllRows(`
      SELECT 
        p.id, p.amount, p.payment_method, p.payment_status, p.transaction_id,
        b.vehicle_number, w.name as watchman_name
      FROM payments p
      LEFT JOIN bookings b ON p.booking_id = b.id
      LEFT JOIN watchmen w ON p.watchman_id = w.id
    `);
    payments.forEach(p => {
      console.log(`ID: ${p.id} | ₹${p.amount} via ${p.payment_method}`);
      console.log(`  Vehicle: ${p.vehicle_number}`);
      console.log(`  Status: ${p.payment_status}`);
      if (p.transaction_id) console.log(`  Transaction: ${p.transaction_id}`);
      if (p.watchman_name) console.log(`  Collected by: ${p.watchman_name}`);
      console.log('');
    });

    // Informal Parking
    console.log('\n🚗 INFORMAL PARKING LOCATIONS');
    console.log('═'.repeat(80));
    const informalParking = await getAllRows('SELECT id, location_name, address, total_spots, available_spots, hourly_rate FROM informal_parking LIMIT 3');
    informalParking.forEach(loc => {
      console.log(`ID: ${loc.id} | ${loc.location_name}`);
      console.log(`  ${loc.address}`);
      console.log(`  Availability: ${loc.available_spots}/${loc.total_spots} spots`);
      console.log(`  Rate: ₹${loc.hourly_rate}/hour`);
      console.log('');
    });

    // Statistics
    console.log('\n📈 STATISTICS');
    console.log('═'.repeat(80));
    const stats = await Promise.all([
      getRow('SELECT COUNT(*) as count FROM organizations'),
      getRow('SELECT COUNT(*) as count FROM users'),
      getRow('SELECT COUNT(*) as count FROM watchmen'),
      getRow('SELECT COUNT(*) as count FROM bookings'),
      getRow('SELECT COUNT(*) as count FROM payments'),
      getRow('SELECT COUNT(*) as count FROM informal_parking'),
      getRow("SELECT COUNT(*) as count FROM bookings WHERE booking_status = 'active'"),
      getRow("SELECT SUM(amount) as total FROM payments WHERE payment_status = 'completed'")
    ]);

    console.log(`Total Organizations: ${stats[0].count}`);
    console.log(`Total Users: ${stats[1].count}`);
    console.log(`Total Watchmen: ${stats[2].count}`);
    console.log(`Total Bookings: ${stats[3].count}`);
    console.log(`Total Payments: ${stats[4].count}`);
    console.log(`Total Informal Parking Locations: ${stats[5].count}`);
    console.log(`Active Bookings: ${stats[6].count}`);
    console.log(`Total Revenue (Completed): ₹${stats[7].total || 0}\n`);

    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║          Database View Complete                          ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');

    await closeDatabase();
    process.exit(0);
  } catch (error) {
    console.error('Error viewing database:', error.message);
    await closeDatabase();
    process.exit(1);
  }
};

viewDatabase();
