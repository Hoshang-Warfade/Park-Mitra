/**
 * Run database migration to add overstay tracking columns
 */

const { getDatabase, runQuery, closeDatabase } = require('../config/db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('🔄 Starting migration: Add overstay tracking columns...');
    
    // Read migration SQL
    const migrationPath = path.join(__dirname, 'migrations', 'add_overstay_columns.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const statement of statements) {
      console.log('Executing:', statement.substring(0, 50) + '...');
      await runQuery(statement);
    }
    
    console.log('✅ Migration completed successfully!');
    console.log('📊 Overstay tracking columns added:');
    console.log('   - overstay_minutes: Track duration of parking violation');
    console.log('   - penalty_amount: Track overstay fines');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await closeDatabase();
  }
}

// Run migration if called directly
if (require.main === module) {
  runMigration()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = runMigration;
