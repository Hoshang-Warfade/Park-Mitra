const { db } = require('../config/db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const migrationPath = path.join(__dirname, 'migrations', 'add_payment_type_column.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  
  // Remove comments first
  const cleanedSQL = migrationSQL
    .split('\n')
    .filter(line => !line.trim().startsWith('--'))
    .join('\n');
  
  // Split by semicolon and filter out empty statements
  const statements = cleanedSQL
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0);
  
  console.log('Starting payment_type migration...\n');
  console.log(`Found ${statements.length} statements to execute\n`);
  
  // Wait for db to be ready
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const dbInstance = db();
  
  try {
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`${i + 1}. Executing: ${statement.substring(0, 60)}...`);
      await new Promise((resolve, reject) => {
        dbInstance.run(statement, (err) => {
          if (err) {
            console.error(`   ❌ Failed: ${err.message}`);
            reject(err);
          } else {
            console.log(`   ✓ Success`);
            resolve();
          }
        });
      });
    }
    
    console.log('\n✅ Migration completed successfully!');
    
    // Verify the changes
    console.log('\nVerifying payments table structure:');
    await new Promise((resolve, reject) => {
      dbInstance.all('PRAGMA table_info(payments)', (err, columns) => {
        if (err) reject(err);
        else {
          console.log('\nColumns:');
          columns.forEach(col => {
            console.log(`  - ${col.name} (${col.type})`);
          });
          resolve();
        }
      });
    });
    
    // Check existing payments
    await new Promise((resolve, reject) => {
      dbInstance.all('SELECT COUNT(*) as count FROM payments', (err, result) => {
        if (err) reject(err);
        else {
          console.log(`\nTotal payments: ${result[0].count}`);
          resolve();
        }
      });
    });
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    dbInstance.close();
  }
}

runMigration();
