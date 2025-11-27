-- Add overstay tracking columns to bookings table
-- This migration adds support for parking violation (overstay) tracking

-- Add overstay_minutes column to track how long user overstayed
ALTER TABLE bookings ADD COLUMN overstay_minutes INTEGER DEFAULT 0;

-- Add penalty_amount column to track overstay fines
ALTER TABLE bookings ADD COLUMN penalty_amount DECIMAL(10, 2) DEFAULT 0;

-- Update booking_status constraint to include 'overstay' status
-- Note: SQLite doesn't support modifying constraints, so we note this for reference
-- The 'overstay' status will be handled in application logic
