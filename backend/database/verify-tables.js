/**
 * Verify Database Tables Script
 * Checks if all required tables and indexes exist in parkmitra.db
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'parkmitra.db');

console.log('╔══════════════════════════════════════════════════════════╗');
console.log('║          Database Tables Verification Script            ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');
console.log(`Database: ${dbPath}\n`);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error connecting to database:', err.message);
    process.exit(1);
  }
  
  console.log('✅ Connected to database successfully\n');
  
  // Check tables
  db.all(`SELECT name, sql FROM sqlite_master WHERE type='table' ORDER BY name`, [], (err, tables) => {
    if (err) {
      console.error('❌ Query error:', err.message);
      process.exit(1);
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('                    TABLES');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const expectedTables = [
      'organizations',
      'users',
      'watchmen',
      'bookings',
      'payments',
      'informal_parking'
    ];
    
    const foundTables = tables.map(t => t.name);
    
    expectedTables.forEach(tableName => {
      if (foundTables.includes(tableName)) {
        console.log(`  ✅ ${tableName.padEnd(20)} [EXISTS]`);
      } else {
        console.log(`  ❌ ${tableName.padEnd(20)} [MISSING]`);
      }
    });
    
    console.log(`\n  Total tables: ${tables.length}`);
    console.log(`  Expected: ${expectedTables.length}`);
    console.log(`  Status: ${tables.length === expectedTables.length ? '✅ ALL PRESENT' : '❌ SOME MISSING'}`);
    
    // Check indexes
    db.all(`SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%' ORDER BY name`, [], (err, indexes) => {
      if (err) {
        console.error('❌ Index query error:', err.message);
        process.exit(1);
      }
      
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('                    INDEXES');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
      if (indexes.length > 0) {
        indexes.forEach(idx => {
          console.log(`  ✅ ${idx.name}`);
        });
      }
      
      console.log(`\n  Total indexes: ${indexes.length}`);
      
      // Check table structures
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('                TABLE STRUCTURES');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
      let completed = 0;
      expectedTables.forEach(tableName => {
        db.all(`PRAGMA table_info(${tableName})`, [], (err, columns) => {
          if (err) {
            console.log(`  ❌ ${tableName}: Error reading structure - ${err.message}`);
          } else if (columns && columns.length > 0) {
            console.log(`  ✅ ${tableName}: ${columns.length} columns`);
          } else {
            console.log(`  ⚠️  ${tableName}: No columns found (table may not exist)`);
          }
          
          completed++;
          
          if (completed === expectedTables.length) {
            // Final summary
            console.log('\n╔══════════════════════════════════════════════════════════╗');
            console.log('║                  VERIFICATION COMPLETE                   ║');
            console.log('╚══════════════════════════════════════════════════════════╝\n');
            
            if (tables.length === expectedTables.length) {
              console.log('✅ All tables created successfully!');
              console.log('✅ Database is ready for seeding and use.');
            } else {
              console.log('⚠️  Some tables are missing. Please check schema.sql');
            }
            
            console.log('');
            db.close(() => {
              process.exit(tables.length === expectedTables.length ? 0 : 1);
            });
          }
        });
      });
    });
  });
});
