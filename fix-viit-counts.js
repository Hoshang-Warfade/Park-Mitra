const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'parkmitra.db');
const db = new sqlite3.Database(dbPath);

console.log('Checking VIIT PUNE data...\n');

// First check current state
db.get(`SELECT id, org_name, total_slots, available_slots FROM organizations WHERE org_name LIKE '%VIIT%'`, (err, org) => {
  if (err) {
    console.error('Error fetching organization:', err);
    db.close();
    return;
  }
  
  console.log('Current organization data:');
  console.log(org);
  console.log('\n');
  
  if (!org) {
    console.log('VIIT organization not found!');
    db.close();
    return;
  }
  
  // Check parking lots
  db.all(`SELECT lot_name, total_slots, available_slots FROM parking_lots WHERE organization_id = ?`, [org.id], (err, lots) => {
    if (err) {
      console.error('Error fetching parking lots:', err);
      db.close();
      return;
    }
    
    console.log('Parking lots:');
    console.log(lots);
    console.log('\n');
    
    // Calculate actual totals
    const actualTotalSlots = lots.reduce((sum, lot) => sum + lot.total_slots, 0);
    const actualAvailableSlots = lots.reduce((sum, lot) => sum + lot.available_slots, 0);
    
    console.log(`Calculated totals: ${actualTotalSlots} total, ${actualAvailableSlots} available`);
    console.log(`Database shows: ${org.total_slots} total, ${org.available_slots} available`);
    console.log('\n');
    
    if (actualTotalSlots !== org.total_slots || actualAvailableSlots !== org.available_slots) {
      console.log('MISMATCH DETECTED! Updating organization...\n');
      
      db.run(
        `UPDATE organizations SET total_slots = ?, available_slots = ? WHERE id = ?`,
        [actualTotalSlots, actualAvailableSlots, org.id],
        function(err) {
          if (err) {
            console.error('Error updating organization:', err);
          } else {
            console.log(`✓ Updated ${org.org_name}`);
            console.log(`  Total slots: ${org.total_slots} → ${actualTotalSlots}`);
            console.log(`  Available slots: ${org.available_slots} → ${actualAvailableSlots}`);
          }
          db.close();
        }
      );
    } else {
      console.log('✓ Counts are already correct!');
      db.close();
    }
  });
});
