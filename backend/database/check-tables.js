const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../../parkmitra.db');
const db = new sqlite3.Database(dbPath);

console.log('📊 Checking Database Tables and Parking Data\n');

// Check what tables exist
db.all('SELECT name FROM sqlite_master WHERE type="table" ORDER BY name', [], (err, tables) => {
  if (err) {
    console.error('Error:', err);
    process.exit(1);
  }
  
  console.log('Tables in database:');
  tables.forEach(t => console.log(`  - ${t.name}`));
  
  // Check parking_slots table data
  db.all('SELECT COUNT(*) as count, organization_id FROM parking_slots GROUP BY organization_id', [], (err2, slotCounts) => {
    if (err2) {
      console.log('\n❌ parking_slots table does not exist or error:', err2.message);
    } else {
      console.log('\n📦 Parking Slots by Organization:');
      slotCounts.forEach(row => {
        console.log(`  Org ${row.organization_id}: ${row.count} slots`);
      });
    }
    
    // Check parking_lots table data
    db.all('SELECT COUNT(*) as count, SUM(total_slots) as total, organization_id FROM parking_lots GROUP BY organization_id', [], (err3, lotCounts) => {
      if (err3) {
        console.log('\n❌ parking_lots table error:', err3.message);
      } else {
        console.log('\n🅿️  Parking Lots by Organization:');
        lotCounts.forEach(row => {
          console.log(`  Org ${row.organization_id}: ${row.count} lots, ${row.total} total slots`);
        });
      }
      
      // Check organizations table
      db.all('SELECT id, org_name, total_slots, available_slots FROM organizations', [], (err4, orgs) => {
        if (err4) {
          console.log('\n❌ organizations table error:', err4.message);
        } else {
          console.log('\n🏢 Organizations:');
          orgs.forEach(org => {
            console.log(`  ${org.org_name} (ID: ${org.id}): total_slots=${org.total_slots}, available=${org.available_slots}`);
          });
        }
        
        db.close();
      });
    });
  });
});
