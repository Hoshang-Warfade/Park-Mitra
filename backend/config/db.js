const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs').promises;

// Define database file path
const dbPath = process.env.DB_PATH || path.join(__dirname, '../../parkmitra.db');
const schemaPath = path.join(__dirname, '../database/schema.sql');

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Database connection instance
let db = null;

/**
 * Create database connection with retry logic
 */
const createConnection = (retries = MAX_RETRIES) => {
  return new Promise((resolve, reject) => {
    const connection = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error(`[DB ERROR] Failed to connect to database (attempt ${MAX_RETRIES - retries + 1}/${MAX_RETRIES}):`, err.message);
        
        if (retries > 0) {
          console.log(`[DB INFO] Retrying connection in ${RETRY_DELAY}ms...`);
          setTimeout(() => {
            createConnection(retries - 1)
              .then(resolve)
              .catch(reject);
          }, RETRY_DELAY);
        } else {
          reject(new Error(`Database connection failed after ${MAX_RETRIES} attempts: ${err.message}`));
        }
      } else {
        console.log(`[DB SUCCESS] Connected to SQLite database at: ${dbPath}`);
        
        // Enable foreign keys
        connection.run('PRAGMA foreign_keys = ON', (pragmaErr) => {
          if (pragmaErr) {
            console.error('[DB ERROR] Failed to enable foreign keys:', pragmaErr.message);
            reject(pragmaErr);
          } else {
            console.log('[DB INFO] Foreign key constraints enabled');
            resolve(connection);
          }
        });
      }
    });

    // Handle connection errors
    connection.on('error', (err) => {
      console.error('[DB ERROR] Database connection error:', err.message);
    });
  });
};

/**
 * Initialize database by executing schema.sql
 * Creates all tables if they don't exist
 */
const initializeDatabase = async () => {
  try {
    console.log('[DB INFO] Starting database initialization...');
    
    // Ensure database connection exists
    if (!db) {
      db = await createConnection();
    }

    // Read schema.sql file
    console.log(`[DB INFO] Reading schema file: ${schemaPath}`);
    let schemaSQL = await fs.readFile(schemaPath, 'utf-8');
    
    // Remove all single-line comments (-- comments)
    schemaSQL = schemaSQL
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n');
    
    // Split SQL statements by semicolon
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    console.log(`[DB INFO] Found ${statements.length} SQL statements to execute`);

    // Execute each statement sequentially
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Extract table name for logging (if CREATE TABLE statement)
      const tableMatch = statement.match(/CREATE TABLE(?:\s+IF NOT EXISTS)?\s+(\w+)/i);
      const indexMatch = statement.match(/CREATE INDEX(?:\s+IF NOT EXISTS)?\s+(\w+)/i);
      
      await new Promise((resolve, reject) => {
        db.run(statement + ';', (err) => {
          if (err) {
            console.error(`[DB ERROR] Failed to execute statement ${i + 1}:`, err.message);
            console.error('[DB ERROR] Statement:', statement.substring(0, 100) + '...');
            reject(err);
          } else {
            if (tableMatch) {
              console.log(`[DB SUCCESS] ✓ Table created: ${tableMatch[1]}`);
            } else if (indexMatch) {
              console.log(`[DB SUCCESS] ✓ Index created: ${indexMatch[1]}`);
            } else if (statement.toUpperCase().includes('PRAGMA')) {
              console.log(`[DB SUCCESS] ✓ Pragma executed`);
            } else {
              console.log(`[DB SUCCESS] ✓ Statement ${i + 1} executed successfully`);
            }
            resolve();
          }
        });
      });
    }

    console.log('[DB SUCCESS] ✓ Database initialization completed successfully!');
    console.log('[DB INFO] All tables and indexes created');
    
    return { success: true, message: 'Database initialized successfully' };
  } catch (error) {
    console.error('[DB ERROR] Database initialization failed:', error.message);
    throw error;
  }
};

/**
 * Close database connection gracefully
 */
const closeDatabase = () => {
  return new Promise((resolve, reject) => {
    if (!db) {
      console.log('[DB INFO] No active database connection to close');
      resolve();
      return;
    }

    console.log('[DB INFO] Closing database connection...');
    
    db.close((err) => {
      if (err) {
        console.error('[DB ERROR] Error closing database:', err.message);
        reject(err);
      } else {
        console.log('[DB SUCCESS] ✓ Database connection closed successfully');
        db = null;
        resolve();
      }
    });
  });
};

/**
 * Execute a query with enhanced logging and constraint error details
 */
const runQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    console.log('[DB QUERY]', sql.substring(0, 100), params.length > 0 ? `[${params.length} params]` : '');
    if (params.length > 0) {
      console.log('[DB PARAMS]', JSON.stringify(params));
    }
    
    db.run(sql, params, function(err) {
      if (err) {
        console.error('[DB ERROR] Query failed:', err.message);
        console.error('[DB ERROR] Error code:', err.code);
        console.error('[DB ERROR] Full SQL:', sql);
        console.error('[DB ERROR] Parameters:', JSON.stringify(params));
        
        // Enhance error object with query details for better debugging
        err.sql = sql;
        err.params = params;
        
        reject(err);
      } else {
        console.log(`[DB SUCCESS] Query executed (lastID: ${this.lastID}, affected rows: ${this.changes})`);
        resolve({ lastID: this.lastID, changes: this.changes });
      }
    });
  });
};

/**
 * Get single row with logging
 */
const getRow = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    console.log('[DB QUERY]', sql.substring(0, 100), params.length > 0 ? `[${params.length} params]` : '');
    
    db.get(sql, params, (err, row) => {
      if (err) {
        console.error('[DB ERROR] Query failed:', err.message);
        reject(err);
      } else {
        console.log(`[DB SUCCESS] Row retrieved: ${row ? 'found' : 'not found'}`);
        resolve(row);
      }
    });
  });
};

/**
 * Get all rows with logging
 */
const getAllRows = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    console.log('[DB QUERY]', sql.substring(0, 100), params.length > 0 ? `[${params.length} params]` : '');
    
    db.all(sql, params, (err, rows) => {
      if (err) {
        console.error('[DB ERROR] Query failed:', err.message);
        reject(err);
      } else {
        console.log(`[DB SUCCESS] Rows retrieved: ${rows ? rows.length : 0}`);
        resolve(rows);
      }
    });
  });
};

/**
 * Get database instance (initialize if not connected)
 */
const getDatabase = async () => {
  if (!db) {
    console.log('[DB INFO] Database not connected, creating connection...');
    db = await createConnection();
  }
  return db;
};

// Initialize connection on module load
(async () => {
  try {
    db = await createConnection();
  } catch (error) {
    console.error('[DB FATAL] Failed to establish initial database connection:', error.message);
    process.exit(1);
  }
})();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n[DB INFO] Received SIGINT signal, closing database...');
  await closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n[DB INFO] Received SIGTERM signal, closing database...');
  await closeDatabase();
  process.exit(0);
});

// Export database instance and utility functions
module.exports = {
  db: () => db, // Return current instance
  getDatabase,
  initializeDatabase,
  closeDatabase,
  runQuery,
  getRow,
  getAllRows
};
