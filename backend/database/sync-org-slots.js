const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../../parkmitra.db');
const db = new sqlite3.Database(dbPath);

console.log('🔄 Syncing Organization Slots with Parking Lots\n');

// Get all organizations
db.all('SELECT id, org_name, total_slots as old_total_slots FROM organizations', [], (err, orgs) => {
  if (err) {
    console.error('Error:', err);
    db.close();
    process.exit(1);
  }
  
  let processed = 0;
  let updated = 0;
  
  const updateOrg = (index) => {
    if (index >= orgs.length) {
      console.log(`\n✅ Sync complete! Updated ${updated} of ${processed} organizations.`);
      db.close();
      return;
    }
    
    const org = orgs[index];
    
    // Get actual slots from parking_lots
    db.get(
      `SELECT 
        COALESCE(SUM(total_slots), 0) as total_slots,
        COALESCE(SUM(available_slots), 0) as available_slots
       FROM parking_lots
       WHERE organization_id = ? AND is_active = 1`,
      [org.id],
      (err2, result) => {
        if (err2) {
          console.error(`❌ Error checking ${org.org_name}:`, err2);
          updateOrg(index + 1);
          return;
        }
        
        processed++;
        const newTotal = result.total_slots;
        const newAvailable = result.available_slots;
        
        if (org.old_total_slots !== newTotal) {
          // Need to update
          db.run(
            `UPDATE organizations 
             SET total_slots = ?, 
                 available_slots = ?,
                 updated_at = CURRENT_TIMESTAMP 
             WHERE id = ?`,
            [newTotal, newAvailable, org.id],
            function(err3) {
              if (err3) {
                console.error(`❌ Failed to update ${org.org_name}:`, err3);
              } else {
                updated++;
                console.log(`🔧 ${org.org_name}: ${org.old_total_slots} → ${newTotal} slots (available: ${newAvailable})`);
              }
              updateOrg(index + 1);
            }
          );
        } else {
          console.log(`✅ ${org.org_name}: Already correct (${newTotal} slots)`);
          updateOrg(index + 1);
        }
      }
    );
  };
  
  updateOrg(0);
});
