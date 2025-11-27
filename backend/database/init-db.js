/**
 * Standalone Database Initialization Script
 * Run this script to initialize the ParkMitra database
 * 
 * Usage: 
 *   node backend/database/init-db.js              # Initialize schema only
 *   node backend/database/init-db.js --seed       # Initialize and seed data
 *   npm run init-db                               # Initialize schema only
 *   npm run setup-db                              # Initialize and seed
 */

const { initializeDatabase, closeDatabase } = require('../config/db');
const fs = require('fs');
const path = require('path');

/**
 * Main initialization function
 */
const initDB = async () => {
  const shouldSeed = process.argv.includes('--seed') || process.argv.includes('-s');
  
  try {
    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║       ParkMitra Database Initialization Script          ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');
    
    console.log('[INIT] Mode:', shouldSeed ? 'Schema + Seed Data' : 'Schema Only');
    console.log('[INIT] Database Path:', process.env.DB_PATH || 'parkmitra.db');
    console.log('[INIT] Node Environment:', process.env.NODE_ENV || 'development');
    console.log('');
    
    // Check if schema.sql exists
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found at: ${schemaPath}`);
    }
    console.log('[INIT] ✓ Schema file found');
    
    // Initialize database schema
    console.log('\n[INIT] Initializing database schema...\n');
    await initializeDatabase();
    
    // Optional: Seed data
    if (shouldSeed) {
      console.log('\n[INIT] Seeding database with sample data...\n');
      
      try {
        // Dynamic import of seed script
        const seedDB = require('./seed-db');
        if (typeof seedDB === 'function') {
          await seedDB();
        } else if (seedDB.seedDatabase) {
          await seedDB.seedDatabase();
        } else {
          console.log('[INIT] ⚠ Seed function not found, skipping...');
        }
      } catch (seedError) {
        console.warn('[INIT] ⚠ Seeding failed or seed-db.js not found:', seedError.message);
        console.warn('[INIT] You can run seeding separately: npm run seed-db');
      }
    }
    
    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║              ✓ Initialization Complete!                 ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');
    
    if (!shouldSeed) {
      console.log('Next steps:');
      console.log('  1. Run seed script: node backend/database/seed-db.js');
      console.log('  2. Or use: npm run seed-db');
      console.log('  3. Start server: npm run dev\n');
    } else {
      console.log('Next steps:');
      console.log('  1. Start server: npm run dev');
      console.log('  2. Access frontend: http://localhost:3000\n');
    }
    
    // Database statistics
    console.log('[INFO] Database ready for use!');
    console.log('[INFO] Schema initialized successfully');
    if (shouldSeed) {
      console.log('[INFO] Sample data seeded');
    }
    console.log('');
    
    // Close connection
    await closeDatabase();
    process.exit(0);
  } catch (error) {
    console.error('\n╔══════════════════════════════════════════════════════════╗');
    console.error('║              ✗ Initialization Failed!                   ║');
    console.error('╚══════════════════════════════════════════════════════════╝\n');
    console.error('[ERROR] Details:', error.message);
    
    if (error.stack) {
      console.error('\n[ERROR] Stack trace:');
      console.error(error.stack);
    }
    
    console.error('\nPlease check:');
    console.error('  - schema.sql file exists and is valid SQL');
    console.error('  - Database file path and permissions');
    console.error('  - SQLite3 is properly installed: npm install sqlite3');
    console.error('  - No syntax errors in schema.sql');
    console.error('  - Current working directory is project root\n');
    
    try {
      await closeDatabase();
    } catch (closeError) {
      console.error('[ERROR] Failed to close database:', closeError.message);
    }
    
    process.exit(1);
  }
};

// Handle uncaught errors
process.on('uncaughtException', async (error) => {
  console.error('\n[FATAL] Uncaught exception:', error.message);
  console.error(error.stack);
  try {
    await closeDatabase();
  } catch (e) {
    // Ignore close errors during fatal shutdown
  }
  process.exit(1);
});

process.on('unhandledRejection', async (reason, promise) => {
  console.error('\n[FATAL] Unhandled promise rejection at:', promise);
  console.error('[FATAL] Reason:', reason);
  try {
    await closeDatabase();
  } catch (e) {
    // Ignore close errors during fatal shutdown
  }
  process.exit(1);
});

// Run initialization
initDB();
