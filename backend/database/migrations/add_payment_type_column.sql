-- Migration: Add payment_type column to distinguish booking vs penalty payments
-- And update payment_method to allow specific payment methods

-- Create a new table with updated schema
CREATE TABLE IF NOT EXISTS payments_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER NOT NULL,
  amount DECIMAL(10, 2) NOT NULL CHECK(amount >= 0),
  payment_method VARCHAR(50) NOT NULL CHECK(payment_method IN ('UPI', 'Net Banking', 'Credit Card', 'Debit Card', 'Cash', 'Wallet', 'online', 'cash')),
  payment_type VARCHAR(50) DEFAULT 'booking' CHECK(payment_type IN ('booking', 'penalty')),
  payment_status VARCHAR(50) DEFAULT 'pending' CHECK(payment_status IN ('pending', 'completed', 'failed')),
  transaction_id VARCHAR(255) UNIQUE,
  watchman_id INTEGER,
  payment_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (watchman_id) REFERENCES watchmen(id) ON DELETE SET NULL
);

-- Copy existing data
INSERT INTO payments_new (id, booking_id, amount, payment_method, payment_type, payment_status, transaction_id, watchman_id, payment_timestamp, created_at)
SELECT 
  id, 
  booking_id, 
  amount, 
  CASE 
    WHEN payment_method = 'online' THEN 'UPI'
    WHEN payment_method = 'cash' THEN 'Cash'
    ELSE payment_method
  END as payment_method,
  'booking' as payment_type,
  payment_status, 
  transaction_id, 
  watchman_id, 
  payment_timestamp, 
  created_at
FROM payments;

-- Drop old table
DROP TABLE payments;

-- Rename new table
ALTER TABLE payments_new RENAME TO payments;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_status ON payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_watchman_id ON payments(watchman_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_type ON payments(payment_type);
