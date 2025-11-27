/**
 * Migration Script: Migrate existing organizations to parking lot system
 * 
 * This script creates a default parking lot for each existing organization
 * based on their current total_slots value.
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path - root folder, not backend
const dbPath = path.join(__dirname, '..', '..', 'parkmitra.db');

async function runMigration() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('❌ Error opening database:', err.message);
        reject(err);
        return;
      }
      console.log('✅ Connected to database');
    });

    // Enable foreign keys
    db.run('PRAGMA foreign_keys = ON');

    console.log('\n' + '🔄'.repeat(50));
    console.log('🔄 STARTING PARKING LOT MIGRATION');
    console.log('🔄'.repeat(50) + '\n');

    // Step 1: Check if parking_lots table exists
    db.get(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='parking_lots'",
      (err, row) => {
        if (err) {
          console.error('❌ Error checking for parking_lots table:', err.message);
          db.close();
          reject(err);
          return;
        }

        if (!row) {
          console.log('⚠️  parking_lots table does not exist. Running table creation...');
          
          // Create parking_lots table
          const createTableSQL = `
            CREATE TABLE IF NOT EXISTS parking_lots (
              lot_id INTEGER PRIMARY KEY AUTOINCREMENT,
              organization_id INTEGER NOT NULL,
              lot_name VARCHAR(255) NOT NULL,
              lot_description TEXT,
              total_slots INTEGER NOT NULL CHECK(total_slots > 0),
              available_slots INTEGER NOT NULL CHECK(available_slots >= 0),
              priority_order INTEGER NOT NULL DEFAULT 1,
              is_active BOOLEAN DEFAULT 1,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
              CONSTRAINT unique_lot_name_per_org UNIQUE (organization_id, lot_name)
            )
          `;

          db.run(createTableSQL, (err) => {
            if (err) {
              console.error('❌ Error creating parking_lots table:', err.message);
              db.close();
              reject(err);
              return;
            }
            console.log('✅ parking_lots table created');
            
            // Create indexes
            createIndexes(db, () => {
              migrateOrganizations(db, resolve, reject);
            });
          });
        } else {
          console.log('✅ parking_lots table already exists');
          migrateOrganizations(db, resolve, reject);
        }
      }
    );
  });
}

function createIndexes(db, callback) {
  console.log('📊 Creating indexes...');
  
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_parking_lots_organization_id ON parking_lots(organization_id)',
    'CREATE INDEX IF NOT EXISTS idx_parking_lots_priority_order ON parking_lots(priority_order)',
    'CREATE INDEX IF NOT EXISTS idx_parking_lots_is_active ON parking_lots(is_active)',
    'CREATE INDEX IF NOT EXISTS idx_parking_lots_available_slots ON parking_lots(available_slots)'
  ];

  let completed = 0;
  indexes.forEach((sql) => {
    db.run(sql, (err) => {
      if (err) {
        console.error('⚠️  Error creating index:', err.message);
      }
      completed++;
      if (completed === indexes.length) {
        console.log('✅ Indexes created');
        callback();
      }
    });
  });
}

function migrateOrganizations(db, resolve, reject) {
  // Step 2: Get all organizations
  db.all('SELECT * FROM organizations', [], (err, organizations) => {
    if (err) {
      console.error('❌ Error fetching organizations:', err.message);
      db.close();
      reject(err);
      return;
    }

    if (!organizations || organizations.length === 0) {
      console.log('⚠️  No organizations found. Nothing to migrate.');
      db.close();
      resolve();
      return;
    }

    console.log(`\n📋 Found ${organizations.length} organization(s) to migrate\n`);

    let migrated = 0;
    let errors = 0;

    // Step 3: For each organization, create a default parking lot
    organizations.forEach((org, index) => {
      // Check if parking lot already exists for this organization
      db.get(
        'SELECT lot_id FROM parking_lots WHERE organization_id = ?',
        [org.id],
        (err, existingLot) => {
          if (err) {
            console.error(`❌ Error checking for existing parking lot for org ${org.id}:`, err.message);
            errors++;
            checkComplete();
            return;
          }

          if (existingLot) {
            console.log(`ℹ️  Organization ${org.id} (${org.org_name}) already has parking lot(s). Skipping.`);
            checkComplete();
            return;
          }

          // Create default parking lot
          const defaultLotName = 'Main Parking Area';
          const defaultLotDescription = `Default parking area for ${org.org_name}`;
          
          db.run(
            `INSERT INTO parking_lots (
              organization_id, lot_name, lot_description, 
              total_slots, available_slots, priority_order, is_active
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              org.id,
              defaultLotName,
              defaultLotDescription,
              org.total_slots,
              org.available_slots,
              1, // First priority
              1  // Active
            ],
            function(err) {
              if (err) {
                console.error(`❌ Error creating parking lot for org ${org.id}:`, err.message);
                errors++;
              } else {
                console.log(`✅ Created parking lot for org ${org.id} (${org.org_name})`);
                console.log(`   - Lot ID: ${this.lastID}`);
                console.log(`   - Total Slots: ${org.total_slots}`);
                console.log(`   - Available Slots: ${org.available_slots}`);
                migrated++;
              }
              checkComplete();
            }
          );
        }
      );

      function checkComplete() {
        if (migrated + errors === organizations.length) {
          console.log('\n' + '✅'.repeat(50));
          console.log(`✅ MIGRATION COMPLETE`);
          console.log(`✅ Successfully migrated: ${migrated}`);
          console.log(`✅ Errors: ${errors}`);
          console.log('✅'.repeat(50) + '\n');
          
          db.close((err) => {
            if (err) {
              console.error('❌ Error closing database:', err.message);
              reject(err);
            } else {
              console.log('✅ Database connection closed');
              resolve();
            }
          });
        }
      }
    });
  });
}

// Run migration
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('🎉 Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { runMigration };
