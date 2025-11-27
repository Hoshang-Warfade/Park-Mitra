const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../../../parkmitra.db');
const migrationPath = path.join(__dirname, './add_confirmed_booking_status.sql');

console.log('🔄 Running Migration: Add "confirmed" booking status');
console.log('=' .repeat(60));

// Read migration SQL
const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

// Connect to database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Failed to connect to database:', err);
    process.exit(1);
  }
  console.log('✅ Connected to database');
});

// Execute migration
db.exec(migrationSQL, (err) => {
  if (err) {
    console.error('❌ Migration failed:', err);
    db.close();
    process.exit(1);
  }
  
  console.log('✅ Migration completed successfully!');
  console.log('');
  console.log('📋 Booking Status Values:');
  console.log('   • confirmed  - Booking scheduled but not yet started');
  console.log('   • active     - Currently ongoing parking session');
  console.log('   • completed  - Parking session finished');
  console.log('   • cancelled  - Booking cancelled');
  console.log('   • overstay   - Vehicle exceeded booking time');
  console.log('');
  
  // Verify the migration
  db.all('SELECT booking_status, COUNT(*) as count FROM bookings GROUP BY booking_status', [], (err, rows) => {
    if (err) {
      console.error('❌ Failed to verify migration:', err);
    } else {
      console.log('📊 Current booking status distribution:');
      rows.forEach(row => {
        console.log(`   ${row.booking_status}: ${row.count}`);
      });
    }
    
    db.close((err) => {
      if (err) {
        console.error('❌ Error closing database:', err);
      } else {
        console.log('');
        console.log('✅ Database connection closed');
        console.log('=' .repeat(60));
      }
    });
  });
});
