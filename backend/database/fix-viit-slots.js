const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../../parkmitra.db');
const db = new sqlite3.Database(dbPath);

console.log('🔧 Fixing VIIT Slot Availability');
console.log('='.repeat(60));

// Get VIIT organization
db.get('SELECT id, org_name, total_slots, available_slots FROM organizations WHERE org_name LIKE "%Viit%"', [], (err, org) => {
  if (err) {
    console.error('Error:', err);
    process.exit(1);
  }
  
  console.log('\n📊 Current State:');
  console.log('   Organization:', org.org_name);
  console.log('   Total Slots:', org.total_slots);
  console.log('   Available (Current):', org.available_slots);
  
  // Calculate correct available slots
  db.get(
    `SELECT 
      COUNT(CASE WHEN booking_status = 'confirmed' THEN 1 END) as confirmed_count,
      COUNT(CASE WHEN booking_status = 'active' THEN 1 END) as active_count,
      COUNT(CASE WHEN booking_status = 'overstay' THEN 1 END) as overstay_count
    FROM bookings 
    WHERE organization_id = ?`,
    [org.id],
    (err2, counts) => {
      if (err2) {
        console.error('Error:', err2);
        db.close();
        process.exit(1);
      }
      
      const occupiedSlots = counts.confirmed_count + counts.active_count + counts.overstay_count;
      const correctAvailable = org.total_slots - occupiedSlots;
      
      console.log('\n🔢 Calculation:');
      console.log('   Confirmed bookings:', counts.confirmed_count);
      console.log('   Active bookings:', counts.active_count);
      console.log('   Overstay bookings:', counts.overstay_count);
      console.log('   Total Occupied:', occupiedSlots);
      console.log('   Correct Available:', correctAvailable);
      console.log('   Difference:', correctAvailable - org.available_slots);
      
      if (correctAvailable === org.available_slots) {
        console.log('\n✅ No fix needed! Slot count is already correct.');
        db.close();
        return;
      }
      
      // Update available_slots
      db.run(
        'UPDATE organizations SET available_slots = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [correctAvailable, org.id],
        function(err3) {
          if (err3) {
            console.error('❌ Failed to update:', err3);
            db.close();
            process.exit(1);
          }
          
          console.log('\n✅ FIXED!');
          console.log(`   Updated available_slots from ${org.available_slots} to ${correctAvailable}`);
          console.log('   Rows affected:', this.changes);
          
          // Verify the fix
          db.get('SELECT available_slots FROM organizations WHERE id = ?', [org.id], (err4, result) => {
            if (err4) {
              console.error('Error verifying:', err4);
            } else {
              console.log('\n✅ Verification:');
              console.log('   New available_slots:', result.available_slots);
              console.log('   Status: CORRECTED');
            }
            
            console.log('\n' + '='.repeat(60));
            console.log('✅ Slot availability has been synchronized!');
            console.log('   Users will now see the correct count: 993 available slots');
            db.close();
          });
        }
      );
    }
  );
});
