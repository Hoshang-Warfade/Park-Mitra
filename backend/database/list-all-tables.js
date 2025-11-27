/**
 * List All Database Tables
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'parkmitra.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
  
  db.all(`SELECT name, type FROM sqlite_master WHERE type='table' ORDER BY name`, [], (err, tables) => {
    if (err) {
      console.error('Query error:', err.message);
      process.exit(1);
    }
    
    console.log('\n=== ALL TABLES IN DATABASE ===\n');
    tables.forEach((t, i) => {
      console.log(`${i + 1}. ${t.name}`);
    });
    console.log(`\nTotal: ${tables.length} tables`);
    
    db.close();
  });
});
