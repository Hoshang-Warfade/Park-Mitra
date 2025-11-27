-- ParkMitra Database Schema
-- Complete SQLite schema for parking management system

-- Organizations table for parking providers
-- Must be created first due to foreign key dependencies
CREATE TABLE IF NOT EXISTS organizations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  org_name VARCHAR(255) NOT NULL,
  admin_name VARCHAR(255) NOT NULL,
  admin_email VARCHAR(255) NOT NULL UNIQUE,
  admin_mobile VARCHAR(10) NOT NULL,
  address TEXT NOT NULL,
  total_slots INTEGER NOT NULL CHECK(total_slots > 0),
  available_slots INTEGER NOT NULL CHECK(available_slots >= 0),
  member_parking_free BOOLEAN DEFAULT 1,
  visitor_hourly_rate DECIMAL(10, 2) CHECK(visitor_hourly_rate >= 0),
  parking_rules TEXT,
  operating_hours TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Parking Lots table for managing multiple parking areas per organization
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

-- Users table to store all user types (organization_member, visitor, walk_in)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  mobile VARCHAR(10) NOT NULL CHECK(length(mobile) = 10),
  password VARCHAR(255) NOT NULL,
  user_type VARCHAR(50) NOT NULL CHECK(user_type IN ('organization_member', 'visitor', 'walk_in')),
  organization_id INTEGER,
  employee_id VARCHAR(100),
  is_verified BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL
);

-- Watchmen table for parking assistants
CREATE TABLE IF NOT EXISTS watchmen (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  mobile VARCHAR(10) NOT NULL CHECK(length(mobile) = 10),
  employee_id VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  organization_id INTEGER NOT NULL,
  shift_start TIME,
  shift_end TIME,
  assigned_shift VARCHAR(50),
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Bookings table for all parking reservations
CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  organization_id INTEGER NOT NULL,
  parking_lot_id INTEGER,
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
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (parking_lot_id) REFERENCES parking_lots(lot_id) ON DELETE SET NULL
);

-- Payments table for transaction tracking
CREATE TABLE IF NOT EXISTS payments (
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

-- InformalParking table for street parking simulation
CREATE TABLE IF NOT EXISTS informal_parking (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  location_name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  total_spots INTEGER NOT NULL CHECK(total_spots > 0),
  available_spots INTEGER NOT NULL CHECK(available_spots >= 0),
  hourly_rate DECIMAL(10, 2) NOT NULL CHECK(hourly_rate >= 0),
  is_simulated BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes on frequently queried columns for performance optimization
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_mobile ON users(mobile);
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);
CREATE INDEX IF NOT EXISTS idx_users_organization_id ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_employee_id ON users(employee_id);

CREATE INDEX IF NOT EXISTS idx_organizations_admin_email ON organizations(admin_email);

CREATE INDEX IF NOT EXISTS idx_watchmen_email ON watchmen(email);
CREATE INDEX IF NOT EXISTS idx_watchmen_organization_id ON watchmen(organization_id);
CREATE INDEX IF NOT EXISTS idx_watchmen_is_active ON watchmen(is_active);

CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_organization_id ON bookings(organization_id);
CREATE INDEX IF NOT EXISTS idx_bookings_parking_lot_id ON bookings(parking_lot_id);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_status ON bookings(booking_status);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_bookings_start_time ON bookings(booking_start_time);
CREATE INDEX IF NOT EXISTS idx_bookings_vehicle_number ON bookings(vehicle_number);

CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_status ON payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_watchman_id ON payments(watchman_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_type ON payments(payment_type);

CREATE INDEX IF NOT EXISTS idx_informal_parking_location ON informal_parking(location_name);
CREATE INDEX IF NOT EXISTS idx_informal_parking_available ON informal_parking(available_spots);

CREATE INDEX IF NOT EXISTS idx_parking_lots_organization_id ON parking_lots(organization_id);
CREATE INDEX IF NOT EXISTS idx_parking_lots_priority_order ON parking_lots(priority_order);
CREATE INDEX IF NOT EXISTS idx_parking_lots_is_active ON parking_lots(is_active);
CREATE INDEX IF NOT EXISTS idx_parking_lots_available_slots ON parking_lots(available_slots);
