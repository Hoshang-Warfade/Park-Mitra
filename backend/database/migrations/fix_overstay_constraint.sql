-- Migration: Add 'overstay' to booking_status CHECK constraint
-- This allows bookings to be marked as parking violations

-- SQLite doesn't support ALTER TABLE ... MODIFY COLUMN with CHECK constraints
-- So we need to recreate the table with the new constraint

PRAGMA foreign_keys=off;

BEGIN TRANSACTION;

-- Create new table with updated constraint (matching actual structure)
CREATE TABLE bookings_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  organization_id INTEGER NOT NULL,
  vehicle_number VARCHAR(50) NOT NULL,
  slot_number VARCHAR(50),
  booking_start_time DATETIME NOT NULL,
  booking_end_time DATETIME NOT NULL,
  duration_hours DECIMAL(5, 2) NOT NULL,
  amount DECIMAL(10, 2) DEFAULT 0,
  payment_status VARCHAR(50) DEFAULT 'pending',
  booking_status VARCHAR(50) DEFAULT 'active' CHECK(booking_status IN ('active', 'completed', 'cancelled', 'overstay')),
  qr_code_data TEXT,
  entry_time DATETIME,
  exit_time DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Copy data from old table
INSERT INTO bookings_new SELECT * FROM bookings;

-- Drop old table
DROP TABLE bookings;

-- Rename new table
ALTER TABLE bookings_new RENAME TO bookings;

-- Recreate indexes (if any exist)
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_organization_id ON bookings(organization_id);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_status ON bookings(booking_status);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_start_time ON bookings(booking_start_time);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_end_time ON bookings(booking_end_time);

COMMIT;

PRAGMA foreign_keys=on;
