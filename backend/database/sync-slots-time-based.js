const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'parkmitra.db');
console.log('Database path:', dbPath);
const db = new sqlite3.Database(dbPath);

console.log('🔧 Synchronizing Slot Availability (Time-Based Logic)');
console.log('   New Logic: Slots are occupied only by ACTIVE bookings');
console.log('   Confirmed bookings do not occupy slots until they become active\n');

db.all('SELECT id, org_name, total_slots, available_slots FROM organizations', [], (err, orgs) => {
  if (err) {
    console.error('❌ Error fetching organizations:', err);
    db.close();
    return;
  }

  console.log(`Found ${orgs.length} organization(s)\n`);

  let processed = 0;
  let updated = 0;

  orgs.forEach((org) => {
    // Count only ACTIVE bookings (not confirmed, not overstay, not completed, not cancelled)
    db.get(
      `SELECT COUNT(*) as active_count 
       FROM bookings 
       WHERE organization_id = ? 
         AND booking_status = 'active'`,
      [org.id],
      (err2, result) => {
        if (err2) {
          console.error(`❌ Error counting active bookings for ${org.org_name}:`, err2);
          processed++;
          checkComplete();
          return;
        }

        const activeCount = result.active_count;
        const correctAvailable = org.total_slots - activeCount;
        const difference = correctAvailable - org.available_slots;

        console.log(`📊 ${org.org_name}`);
        console.log(`   Total Slots: ${org.total_slots}`);
        console.log(`   Currently Active Bookings: ${activeCount}`);
        console.log(`   Current Available (DB): ${org.available_slots}`);
        console.log(`   Should Be Available: ${correctAvailable}`);

        if (difference === 0) {
          console.log(`   ✅ Already in sync\n`);
          processed++;
          checkComplete();
        } else {
          console.log(`   🔧 Needs update: ${difference > 0 ? '+' : ''}${difference}`);
          
          // Update available_slots
          db.run(
            'UPDATE organizations SET available_slots = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [correctAvailable, org.id],
            function(err3) {
              if (err3) {
                console.error(`   ❌ Failed to update: ${err3.message}\n`);
              } else {
                console.log(`   ✅ Updated: ${org.available_slots} → ${correctAvailable}\n`);
                updated++;
              }
              processed++;
              checkComplete();
            }
          );
        }
      }
    );
  });

  function checkComplete() {
    if (processed === orgs.length) {
      console.log('═'.repeat(50));
      console.log(`✅ Sync Complete!`);
      console.log(`   Total Organizations: ${orgs.length}`);
      console.log(`   Updated: ${updated}`);
      console.log(`   Already Synced: ${orgs.length - updated}`);
      console.log('═'.repeat(50));
      db.close();
    }
  }
});
