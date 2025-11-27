-- Migration: Update payment_method constraint to allow specific payment methods
-- This allows storing UPI, Credit Card, Net Banking, etc. instead of just 'online' or 'cash'

-- SQLite doesn't support ALTER COLUMN, so we need to recreate the table
-- Step 1: Create new payments table with updated constraint
CREATE TABLE payments_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER NOT NULL,
  amount REAL NOT NULL CHECK(amount > 0),
  payment_method TEXT NOT NULL,
  transaction_id TEXT UNIQUE NOT NULL,
  watchman_id INTEGER,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK(payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (watchman_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Step 2: Copy all data from old table to new table
INSERT INTO payments_new (id, booking_id, amount, payment_method, transaction_id, watchman_id, payment_status, payment_timestamp, created_at, updated_at)
SELECT id, booking_id, amount, payment_method, transaction_id, watchman_id, payment_status, payment_timestamp, created_at, updated_at
FROM payments;

-- Step 3: Drop old table
DROP TABLE payments;

-- Step 4: Rename new table to payments
ALTER TABLE payments_new RENAME TO payments;

-- Step 5: Recreate indexes
CREATE INDEX idx_payments_booking ON payments(booking_id);
CREATE INDEX idx_payments_transaction ON payments(transaction_id);
CREATE INDEX idx_payments_status ON payments(payment_status);
