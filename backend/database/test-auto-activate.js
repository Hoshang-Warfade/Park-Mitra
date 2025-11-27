const { db } = require('../config/db');

async function testAutoActivate() {
  console.log('Testing auto-activation of confirmed bookings...\n');
  
  // Wait for db to be ready
  await new Promise(resolve => setTimeout(resolve, 500));
  const dbInstance = db();
  
  try {
    const now = new Date().toISOString();
    console.log('Current time (ISO):', now);
    console.log('Current time (Local):', new Date().toLocaleString('en-IN'));
    console.log('');
    
    // Get all confirmed bookings
    const confirmedBookings = await new Promise((resolve, reject) => {
      dbInstance.all(`
        SELECT 
          id, 
          vehicle_number, 
          booking_status,
          datetime(booking_start_time, 'localtime') as start_time_local,
          booking_start_time as start_time_utc,
          datetime(booking_end_time, 'localtime') as end_time_local
        FROM bookings 
        WHERE booking_status = 'confirmed'
        ORDER BY booking_start_time
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    console.log('📋 Confirmed bookings:', confirmedBookings.length);
    console.log('');
    
    if (confirmedBookings.length > 0) {
      console.log('Details:');
      confirmedBookings.forEach(b => {
        console.log(`  ID: ${b.id} | Vehicle: ${b.vehicle_number}`);
        console.log(`  Start: ${b.start_time_local} (${b.start_time_utc})`);
        console.log(`  End: ${b.end_time_local}`);
        
        // Check if should be activated
        const shouldActivate = b.start_time_utc <= now;
        console.log(`  Should activate: ${shouldActivate ? '✅ YES' : '❌ NO'}`);
        console.log('');
      });
    }
    
    // Now run the activation query
    console.log('🔄 Running activation query...');
    const result = await new Promise((resolve, reject) => {
      dbInstance.run(`
        UPDATE bookings
        SET booking_status = 'active',
            updated_at = CURRENT_TIMESTAMP
        WHERE booking_status = 'confirmed'
          AND booking_start_time <= ?
      `, [now], function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });
    
    console.log(`✅ Activated ${result} booking(s)`);
    console.log('');
    
    // Get all active bookings now
    const activeBookings = await new Promise((resolve, reject) => {
      dbInstance.all(`
        SELECT 
          id, 
          vehicle_number, 
          booking_status,
          datetime(booking_start_time, 'localtime') as start_time_local,
          datetime(booking_end_time, 'localtime') as end_time_local
        FROM bookings 
        WHERE booking_status = 'active'
        ORDER BY booking_start_time
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    console.log('📋 Active bookings after activation:', activeBookings.length);
    if (activeBookings.length > 0) {
      console.log('');
      console.log('Details:');
      activeBookings.forEach(b => {
        console.log(`  ID: ${b.id} | Vehicle: ${b.vehicle_number}`);
        console.log(`  Start: ${b.start_time_local}`);
        console.log(`  End: ${b.end_time_local}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

testAutoActivate();
