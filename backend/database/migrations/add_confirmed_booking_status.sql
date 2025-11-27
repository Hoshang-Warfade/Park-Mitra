-- Migration: Add 'confirmed' status to booking_status
-- Date: 2025-11-09
-- Description: Add 'confirmed' status for bookings that are scheduled but not yet started
-- This differentiates between:
--   - 'confirmed': Booking created, payment done, but parking time hasn't started yet
--   - 'active': Currently ongoing parking session (vehicle has entered or time has started)
--   - 'completed': Parking session finished
--   - 'cancelled': Booking cancelled
--   - 'overstay': Vehicle exceeded booking time

-- Step 1: Drop the existing CHECK constraint on booking_status
-- SQLite doesn't support ALTER COLUMN directly, so we need to:
-- 1. Create a new table with updated constraint
-- 2. Copy data from old table
-- 3. Drop old table
-- 4. Rename new table

-- Create temporary table with new booking_status constraint
CREATE TABLE IF NOT EXISTS bookings_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  organization_id INTEGER NOT NULL,
  vehicle_number VARCHAR(50) NOT NULL,
  slot_number VARCHAR(50),
  booking_start_time DATETIME NOT NULL,
  booking_end_time DATETIME NOT NULL,
  duration_hours DECIMAL(5, 2) NOT NULL CHECK(duration_hours > 0),
  amount DECIMAL(10, 2) DEFAULT 0 CHECK(amount >= 0),
  payment_status VARCHAR(50) DEFAULT 'pending' CHECK(payment_status IN ('pending', 'completed', 'failed')),
  booking_status VARCHAR(50) DEFAULT 'confirmed' CHECK(booking_status IN ('confirmed', 'active', 'completed', 'cancelled', 'overstay')),
  qr_code_data TEXT,
  entry_time DATETIME,
  exit_time DATETIME,
  overstay_minutes INTEGER DEFAULT 0,
  penalty_amount DECIMAL(10, 2) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Copy all data from old table to new table
-- Map 'active' status to 'confirmed' if booking_start_time is in the future
-- Otherwise keep as 'active'
INSERT INTO bookings_new (
  id, user_id, organization_id, vehicle_number, slot_number,
  booking_start_time, booking_end_time, duration_hours, amount,
  payment_status, booking_status, qr_code_data, entry_time, exit_time,
  overstay_minutes, penalty_amount, created_at, updated_at
)
SELECT 
  id, user_id, organization_id, vehicle_number, slot_number,
  booking_start_time, booking_end_time, duration_hours, amount,
  payment_status,
  CASE 
    -- If booking is 'active' but start time is in the future, change to 'confirmed'
    WHEN booking_status = 'active' AND datetime(booking_start_time) > datetime('now') THEN 'confirmed'
    -- Otherwise keep the original status
    ELSE booking_status
  END as booking_status,
  qr_code_data, entry_time, exit_time,
  overstay_minutes, penalty_amount, created_at, updated_at
FROM bookings;

-- Drop old table
DROP TABLE bookings;

-- Rename new table to original name
ALTER TABLE bookings_new RENAME TO bookings;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_organization_id ON bookings(organization_id);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_status ON bookings(booking_status);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_start_time ON bookings(booking_start_time);

-- Migration complete
-- New booking lifecycle:
-- 1. User creates booking → status = 'confirmed' (scheduled but not started)
-- 2. Booking time starts or watchman scans QR → status = 'active' (in progress)
-- 3. User exits → status = 'completed'
-- 4. User cancels before start → status = 'cancelled'
-- 5. User exceeds time → status = 'overstay'
