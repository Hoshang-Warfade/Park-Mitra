const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../../parkmitra.db');
const db = new sqlite3.Database(dbPath);

console.log('🔧 Synchronizing Slot Availability for All Organizations');
console.log('='.repeat(70));

// Get all organizations
db.all('SELECT id, org_name, total_slots, available_slots FROM organizations', [], (err, orgs) => {
  if (err) {
    console.error('Error:', err);
    process.exit(1);
  }
  
  console.log(`\nFound ${orgs.length} organizations to check...\n`);
  
  let fixedCount = 0;
  let checkedCount = 0;
  let totalDifference = 0;
  
  const checkOrg = (index) => {
    if (index >= orgs.length) {
      // All done
      console.log('\n' + '='.repeat(70));
      console.log('📊 Summary:');
      console.log(`   Organizations checked: ${checkedCount}`);
      console.log(`   Organizations fixed: ${fixedCount}`);
      console.log(`   Total slots corrected: ${Math.abs(totalDifference)}`);
      console.log('\n✅ Slot synchronization complete!');
      db.close();
      return;
    }
    
    const org = orgs[index];
    
    // Get occupied slots count
    db.get(
      `SELECT 
        COUNT(CASE WHEN booking_status IN ('confirmed', 'active', 'overstay') THEN 1 END) as occupied_count
      FROM bookings 
      WHERE organization_id = ?`,
      [org.id],
      (err2, result) => {
        if (err2) {
          console.error(`Error checking ${org.org_name}:`, err2);
          checkOrg(index + 1);
          return;
        }
        
        const occupiedSlots = result.occupied_count;
        const correctAvailable = org.total_slots - occupiedSlots;
        const difference = correctAvailable - org.available_slots;
        
        checkedCount++;
        
        if (difference === 0) {
          console.log(`✅ ${org.org_name.padEnd(30)} - OK (${org.available_slots} available)`);
          checkOrg(index + 1);
        } else {
          // Need to fix
          db.run(
            'UPDATE organizations SET available_slots = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [correctAvailable, org.id],
            function(err3) {
              if (err3) {
                console.error(`❌ Failed to update ${org.org_name}:`, err3);
              } else {
                fixedCount++;
                totalDifference += difference;
                console.log(`🔧 ${org.org_name.padEnd(30)} - FIXED: ${org.available_slots} → ${correctAvailable} (${difference > 0 ? '+' : ''}${difference})`);
              }
              checkOrg(index + 1);
            }
          );
        }
      }
    );
  };
  
  // Start checking organizations
  checkOrg(0);
});
