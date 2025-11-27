-- Migration: Add parking_lots table for parking lot management
-- Date: 2025-11-09
-- Description: This migration adds support for multiple parking lots per organization
--              allowing organizations to manage different parking areas independently

-- Create parking_lots table
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
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_parking_lots_organization_id ON parking_lots(organization_id);
CREATE INDEX IF NOT EXISTS idx_parking_lots_priority_order ON parking_lots(priority_order);
CREATE INDEX IF NOT EXISTS idx_parking_lots_is_active ON parking_lots(is_active);
CREATE INDEX IF NOT EXISTS idx_parking_lots_available_slots ON parking_lots(available_slots);

-- Add parking_lot_id column to bookings table
ALTER TABLE bookings ADD COLUMN parking_lot_id INTEGER REFERENCES parking_lots(lot_id) ON DELETE SET NULL;

-- Create index on parking_lot_id in bookings
CREATE INDEX IF NOT EXISTS idx_bookings_parking_lot_id ON bookings(parking_lot_id);
