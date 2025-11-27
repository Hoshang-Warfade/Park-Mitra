-- =============================================================================
-- ParkMitra Seed Data - Comprehensive Sample Data for Testing
-- =============================================================================
-- Insert sample data for testing the ParkMitra application
-- Run this after initializing the database schema
--
-- NOTE: All test passwords are 'password123'
-- The placeholder hashes below will NOT work - actual passwords should be
-- hashed using bcrypt in the application or use the seed-db.js script
-- =============================================================================

-- =============================================================================
-- 1. ORGANIZATIONS
-- =============================================================================

INSERT INTO organizations (name, admin_name, admin_email, admin_mobile, address, total_slots, available_slots, member_parking_free, visitor_hourly_rate, parking_rules, operating_hours, created_at) 
VALUES 
('Tech Corp Plaza', 'Rajesh Kumar', 'admin@techcorp.com', '9876543210', '123 Tech Street, Whitefield, Bangalore 560066', 50, 45, 1, 50.00, 'No overnight parking. Maintain speed limit. Follow one-way directions. Emergency lanes must remain clear.', '8:00 AM - 8:00 PM', datetime('now')),
('City Mall', 'Priya Sharma', 'admin@citymall.com', '9876543211', '456 Mall Road, Andheri West, Mumbai 400053', 100, 85, 1, 30.00, 'Follow parking attendant instructions. Keep ticket visible on dashboard. First 2 hours free with purchase.', '10:00 AM - 10:00 PM', datetime('now')),
('Central Hospital', 'Dr. Amit Patel', 'admin@hospital.com', '9876543212', '789 Hospital Avenue, Connaught Place, Delhi 110001', 75, 60, 1, 40.00, 'Emergency vehicle priority. No honking. Patient drop-off zone available at entrance. Ambulances have 24/7 access.', '24 Hours', datetime('now')),
('Corporate Tower', 'Suresh Menon', 'admin@corptower.com', '9876543213', '321 Business District, Electronic City, Bangalore 560100', 120, 100, 1, 45.00, 'Visitor parking on Level 1. Member parking on Level 2-3. Basement reserved for executives.', '7:00 AM - 9:00 PM', datetime('now'));

-- =============================================================================
-- 2. USERS
-- =============================================================================
-- Note: Password is 'password123' for all users
-- These placeholder hashes won't work - use actual bcrypt hashing in application
-- or run the seed-db.js script for proper password hashing

INSERT INTO users (name, email, password_hash, mobile, user_type, organization_id, employee_id, is_verified, created_at)
VALUES
-- Organization Members (Tech Corp Plaza)
('John Member', 'member@test.com', '$2b$10$rQZ3QhL5vKxJ5KxJ5KxJ5uO7ZYq9XqJ5KxJ5KxJ5KxJ5KxJ5KxJ5K', '9988776655', 'organization_member', 1, 'EMP001', 1, datetime('now')),
('Sarah Johnson', 'sarah@techcorp.com', '$2b$10$rQZ3QhL5vKxJ5KxJ5KxJ5uO7ZYq9XqJ5KxJ5KxJ5KxJ5KxJ5KxJ5K', '9988776656', 'organization_member', 1, 'EMP002', 1, datetime('now')),
('Rajesh Verma', 'rajesh@techcorp.com', '$2b$10$rQZ3QhL5vKxJ5KxJ5KxJ5uO7ZYq9XqJ5KxJ5KxJ5KxJ5KxJ5KxJ5K', '9988776659', 'organization_member', 1, 'EMP003', 1, datetime('now')),

-- Organization Members (City Mall)
('Mike Wilson', 'mike@citymall.com', '$2b$10$rQZ3QhL5vKxJ5KxJ5KxJ5uO7ZYq9XqJ5KxJ5KxJ5KxJ5KxJ5KxJ5K', '9988776657', 'organization_member', 2, 'EMP101', 1, datetime('now')),
('Priya Singh', 'priya@citymall.com', '$2b$10$rQZ3QhL5vKxJ5KxJ5KxJ5uO7ZYq9XqJ5KxJ5KxJ5KxJ5KxJ5KxJ5K', '9988776662', 'organization_member', 2, 'EMP102', 1, datetime('now')),

-- Organization Members (Central Hospital)
('Emily Davis', 'emily@hospital.com', '$2b$10$rQZ3QhL5vKxJ5KxJ5KxJ5uO7ZYq9XqJ5KxJ5KxJ5KxJ5KxJ5KxJ5K', '9988776658', 'organization_member', 3, 'EMP201', 1, datetime('now')),
('Dr. Anand Kumar', 'anand@hospital.com', '$2b$10$rQZ3QhL5vKxJ5KxJ5KxJ5uO7ZYq9XqJ5KxJ5KxJ5KxJ5KxJ5KxJ5K', '9988776663', 'organization_member', 3, 'DOC001', 1, datetime('now')),

-- Organization Members (Corporate Tower)
('Vikram Joshi', 'vikram@corptower.com', '$2b$10$rQZ3QhL5vKxJ5KxJ5KxJ5uO7ZYq9XqJ5KxJ5KxJ5KxJ5KxJ5KxJ5K', '9988776664', 'organization_member', 4, 'EMP301', 1, datetime('now')),

-- Visitors
('Jane Visitor', 'visitor@test.com', '$2b$10$rQZ3QhL5vKxJ5KxJ5KxJ5uO7ZYq9XqJ5KxJ5KxJ5KxJ5KxJ5KxJ5K', '9988776660', 'visitor', NULL, NULL, 1, datetime('now')),
('Tom Guest', 'guest@test.com', '$2b$10$rQZ3QhL5vKxJ5KxJ5KxJ5uO7ZYq9XqJ5KxJ5KxJ5KxJ5KxJ5KxJ5K', '9988776661', 'visitor', NULL, NULL, 1, datetime('now')),
('Robert Brown', 'robert@gmail.com', '$2b$10$rQZ3QhL5vKxJ5KxJ5KxJ5uO7ZYq9XqJ5KxJ5KxJ5KxJ5KxJ5KxJ5K', '9988776665', 'visitor', NULL, NULL, 1, datetime('now')),

-- Admins (organization members with admin privileges - set in organization table)
('Bob Admin', 'admin@techcorp.com', '$2b$10$rQZ3QhL5vKxJ5KxJ5KxJ5uO7ZYq9XqJ5KxJ5KxJ5KxJ5KxJ5KxJ5K', '9876543210', 'organization_member', 1, 'ADMIN001', 1, datetime('now')),
('Admin Mall', 'admin@citymall.com', '$2b$10$rQZ3QhL5vKxJ5KxJ5KxJ5uO7ZYq9XqJ5KxJ5KxJ5KxJ5KxJ5KxJ5K', '9876543211', 'organization_member', 2, 'ADMIN002', 1, datetime('now')),

-- Watchmen (users with user_type='watchman')
('Ram Kumar', 'watchman@test.com', '$2b$10$rQZ3QhL5vKxJ5KxJ5KxJ5uO7ZYq9XqJ5KxJ5KxJ5KxJ5KxJ5KxJ5K', '9988776670', 'watchman', 1, 'WM001', 1, datetime('now')),
('Shyam Singh', 'watchman2@test.com', '$2b$10$rQZ3QhL5vKxJ5KxJ5KxJ5uO7ZYq9XqJ5KxJ5KxJ5KxJ5KxJ5KxJ5K', '9988776671', 'watchman', 2, 'WM002', 1, datetime('now')),
('Raju Patil', 'watchman3@test.com', '$2b$10$rQZ3QhL5vKxJ5KxJ5KxJ5uO7ZYq9XqJ5KxJ5KxJ5KxJ5KxJ5KxJ5K', '9988776672', 'watchman', 3, 'WM003', 1, datetime('now')),
('Mohan Reddy', 'watchman4@test.com', '$2b$10$rQZ3QhL5vKxJ5KxJ5KxJ5uO7ZYq9XqJ5KxJ5KxJ5KxJ5KxJ5KxJ5K', '9988776673', 'watchman', 4, 'WM004', 1, datetime('now'));

-- =============================================================================
-- 3. WATCHMEN RECORDS
-- =============================================================================
-- Links watchmen users to organizations with shift information

INSERT INTO watchmen (user_id, organization_id, shift_start, shift_end, status, created_at)
VALUES
(14, 1, '08:00', '16:00', 'active', datetime('now')),
(15, 2, '16:00', '00:00', 'active', datetime('now')),
(16, 3, '00:00', '08:00', 'active', datetime('now')),
(17, 4, '07:00', '15:00', 'active', datetime('now'));

-- =============================================================================
-- 4. PARKING SLOTS
-- =============================================================================

INSERT INTO parking_slots (organization_id, slot_number, slot_type, vehicle_type, is_available, floor_level, created_at)
VALUES
-- Tech Corp Plaza (Organization 1) - 50 slots
(1, 'A-101', 'regular', 'car', 1, 1, datetime('now')),
(1, 'A-102', 'regular', 'car', 1, 1, datetime('now')),
(1, 'A-103', 'regular', 'car', 0, 1, datetime('now')),
(1, 'A-104', 'disabled', 'car', 1, 1, datetime('now')),
(1, 'A-105', 'regular', 'bike', 1, 1, datetime('now')),
(1, 'A-106', 'regular', 'bike', 1, 1, datetime('now')),
(1, 'B-201', 'regular', 'car', 1, 2, datetime('now')),
(1, 'B-202', 'regular', 'car', 1, 2, datetime('now')),
(1, 'B-203', 'ev_charging', 'car', 1, 2, datetime('now')),
(1, 'B-204', 'regular', 'car', 0, 2, datetime('now')),

-- City Mall (Organization 2) - 100 slots
(2, 'M1-001', 'regular', 'car', 1, 1, datetime('now')),
(2, 'M1-002', 'regular', 'car', 0, 1, datetime('now')),
(2, 'M1-003', 'vip', 'car', 1, 1, datetime('now')),
(2, 'M1-004', 'regular', 'car', 1, 1, datetime('now')),
(2, 'M1-005', 'disabled', 'car', 1, 1, datetime('now')),
(2, 'M2-101', 'regular', 'bike', 1, 2, datetime('now')),
(2, 'M2-102', 'regular', 'bike', 1, 2, datetime('now')),
(2, 'M2-103', 'regular', 'bike', 0, 2, datetime('now')),
(2, 'M3-201', 'regular', 'car', 1, 3, datetime('now')),
(2, 'M3-202', 'ev_charging', 'car', 1, 3, datetime('now')),

-- Central Hospital (Organization 3) - 75 slots
(3, 'H-001', 'regular', 'car', 1, 1, datetime('now')),
(3, 'H-002', 'disabled', 'car', 1, 1, datetime('now')),
(3, 'H-003', 'emergency', 'car', 1, 1, datetime('now')),
(3, 'H-004', 'regular', 'car', 0, 1, datetime('now')),
(3, 'H-101', 'regular', 'bike', 1, 1, datetime('now')),
(3, 'H-102', 'regular', 'bike', 1, 1, datetime('now')),
(3, 'H-201', 'regular', 'car', 1, 2, datetime('now')),
(3, 'H-202', 'vip', 'car', 1, 2, datetime('now')),

-- Corporate Tower (Organization 4) - 120 slots
(4, 'CT-101', 'regular', 'car', 1, 1, datetime('now')),
(4, 'CT-102', 'regular', 'car', 1, 1, datetime('now')),
(4, 'CT-103', 'disabled', 'car', 1, 1, datetime('now')),
(4, 'CT-201', 'regular', 'car', 1, 2, datetime('now')),
(4, 'CT-202', 'ev_charging', 'car', 1, 2, datetime('now')),
(4, 'CT-301', 'vip', 'car', 1, 3, datetime('now'));

-- =============================================================================
-- 5. BOOKINGS (Mix of active, completed, confirmed, and cancelled)
-- =============================================================================

INSERT INTO bookings (user_id, organization_id, slot_id, vehicle_number, vehicle_type, booking_type, start_time, end_time, duration_hours, status, qr_code, notes, created_at)
VALUES
-- Active bookings (currently in use)
(1, 1, 3, 'MH12AB1234', 'car', 'organization_member', datetime('now', '-1 hour'), datetime('now', '+3 hours'), 4.0, 'active', 'QR-' || hex(randomblob(8)), 'Member parking - free', datetime('now', '-1 hour')),
(9, 2, 12, 'MH14CD5678', 'car', 'visitor', datetime('now', '-30 minutes'), datetime('now', '+2 hours'), 2.5, 'active', 'QR-' || hex(randomblob(8)), 'Visitor parking - paid', datetime('now', '-30 minutes')),
(6, 3, 24, 'DL08GH3456', 'car', 'organization_member', datetime('now', '-2 hours'), datetime('now', '+2 hours'), 4.0, 'active', 'QR-' || hex(randomblob(8)), 'Hospital staff parking', datetime('now', '-2 hours')),
(NULL, 1, 5, 'GJ01MN5678', 'bike', 'walk_in', datetime('now', '-2 hours'), datetime('now', '+2 hours'), 4.0, 'active', 'QR-' || hex(randomblob(8)), 'Walk-in handled by watchman Ram', datetime('now', '-2 hours')),

-- Completed bookings (past)
(1, 1, 1, 'MH12AB1234', 'car', 'organization_member', datetime('now', '-3 days'), datetime('now', '-3 days', '+4 hours'), 4.0, 'completed', 'QR-' || hex(randomblob(8)), 'Completed successfully', datetime('now', '-3 days')),
(2, 1, 2, 'KA05EF9012', 'car', 'organization_member', datetime('now', '-2 days'), datetime('now', '-2 days', '+3 hours'), 3.0, 'completed', 'QR-' || hex(randomblob(8)), NULL, datetime('now', '-2 days')),
(9, 2, 11, 'MH14CD5678', 'car', 'visitor', datetime('now', '-5 days'), datetime('now', '-5 days', '+2 hours'), 2.0, 'completed', 'QR-' || hex(randomblob(8)), 'Paid ₹60', datetime('now', '-5 days')),
(10, 3, 21, 'DL08GH3456', 'car', 'visitor', datetime('now', '-1 day'), datetime('now', '-1 day', '+1 hour'), 1.0, 'completed', 'QR-' || hex(randomblob(8)), 'Paid ₹40', datetime('now', '-1 day')),
(4, 2, 13, 'MH01IJ7890', 'car', 'organization_member', datetime('now', '-6 days'), datetime('now', '-6 days', '+5 hours'), 5.0, 'completed', 'QR-' || hex(randomblob(8)), NULL, datetime('now', '-6 days')),
(NULL, 2, 16, 'MH03OP9012', 'bike', 'walk_in', datetime('now', '-6 hours'), datetime('now', '-2 hours'), 4.0, 'completed', 'QR-' || hex(randomblob(8)), 'Walk-in - Cash payment collected', datetime('now', '-6 hours')),

-- Confirmed (upcoming) bookings
(2, 1, 7, 'KA05EF9012', 'car', 'organization_member', datetime('now', '+2 hours'), datetime('now', '+6 hours'), 4.0, 'confirmed', 'QR-' || hex(randomblob(8)), 'Pre-booked for later today', datetime('now')),
(6, 3, 25, 'TN09KL1234', 'bike', 'organization_member', datetime('now', '+1 day'), datetime('now', '+1 day', '+3 hours'), 3.0, 'confirmed', 'QR-' || hex(randomblob(8)), 'Tomorrow morning shift', datetime('now')),
(8, 4, 29, 'KA02MN5678', 'car', 'organization_member', datetime('now', '+3 hours'), datetime('now', '+7 hours'), 4.0, 'confirmed', 'QR-' || hex(randomblob(8)), NULL, datetime('now')),

-- Cancelled bookings
(4, 2, 14, 'MH01IJ7890', 'car', 'organization_member', datetime('now', '-4 days'), datetime('now', '-4 days', '+2 hours'), 2.0, 'cancelled', 'QR-' || hex(randomblob(8)), 'Cancelled by user', datetime('now', '-4 days')),
(11, 1, 4, 'PB03QR1234', 'car', 'visitor', datetime('now', '-7 days'), datetime('now', '-7 days', '+3 hours'), 3.0, 'cancelled', 'QR-' || hex(randomblob(8)), 'No-show', datetime('now', '-7 days'));

-- =============================================================================
-- 6. PAYMENTS
-- =============================================================================

INSERT INTO payments (booking_id, user_id, amount, payment_method, payment_status, transaction_id, paid_at, created_at)
VALUES
-- Payments for completed bookings
(5, 1, 0.00, 'free', 'completed', 'FREE-' || hex(randomblob(4)), datetime('now', '-3 days'), datetime('now', '-3 days')),
(6, 2, 0.00, 'free', 'completed', 'FREE-' || hex(randomblob(4)), datetime('now', '-2 days'), datetime('now', '-2 days')),
(7, 9, 60.00, 'online', 'completed', 'TXN-' || hex(randomblob(6)), datetime('now', '-5 days'), datetime('now', '-5 days')),
(8, 10, 40.00, 'cash', 'completed', 'CASH-' || hex(randomblob(4)), datetime('now', '-1 day'), datetime('now', '-1 day')),
(9, 4, 0.00, 'free', 'completed', 'FREE-' || hex(randomblob(4)), datetime('now', '-6 days'), datetime('now', '-6 days')),
(10, NULL, 0.00, 'cash', 'completed', 'CASH-' || hex(randomblob(4)), datetime('now', '-2 hours'), datetime('now', '-2 hours')),

-- Payment for active visitor booking
(2, 9, 75.00, 'online', 'completed', 'TXN-' || hex(randomblob(6)), datetime('now', '-30 minutes'), datetime('now', '-30 minutes')),

-- Payments for confirmed bookings (pending)
(11, 2, 0.00, 'free', 'pending', NULL, NULL, datetime('now')),
(13, 8, 0.00, 'free', 'pending', NULL, NULL, datetime('now')),

-- Walk-in payments
(4, NULL, 0.00, 'cash', 'completed', 'CASH-' || hex(randomblob(4)), datetime('now', '-2 hours'), datetime('now', '-2 hours'));

-- =============================================================================
-- 7. INFORMAL PARKING LOCATIONS (Street Parking Simulation)
-- =============================================================================

INSERT INTO informal_parking (location_name, address, latitude, longitude, total_spots, available_spots, hourly_rate, amenities, operating_hours, is_active, created_at)
VALUES
('MG Road Street Parking', 'MG Road, Brigade Road Junction, Bangalore 560001', 12.9716, 77.5946, 20, 15, 20.00, 'CCTV Surveillance, Security Guard, Well Lit Area', '24 Hours', 1, datetime('now')),
('Brigade Road Parking', 'Brigade Road, Near Commercial Street, Bangalore 560025', 12.9719, 77.5937, 15, 8, 25.00, 'Well Lit, CCTV, Pay & Park Attendant', '6 AM - 11 PM', 1, datetime('now')),
('Indiranagar 100ft Road', '100 Feet Road, Indiranagar, Bangalore 560038', 12.9784, 77.6408, 25, 20, 15.00, 'Security Guard, Clean Area, CCTV', '24 Hours', 1, datetime('now')),
('Koramangala 80ft Road', '80 Feet Road, Koramangala 4th Block, Bangalore 560095', 12.9352, 77.6245, 30, 18, 18.00, 'CCTV, Well Lit, Security Patrol', '24 Hours', 1, datetime('now')),
('Church Street Parking', 'Church Street, Near Trinity Circle, Bangalore 560001', 12.9730, 77.6070, 18, 10, 30.00, 'CCTV, Well Lit, Security Guard, Premium Area', '8 AM - 10 PM', 1, datetime('now')),
('Commercial Street', 'Commercial Street, Shivaji Nagar, Bangalore 560007', 12.9823, 77.6107, 22, 14, 22.00, 'Security Guard, CCTV, Near Shopping Area', '9 AM - 9 PM', 1, datetime('now')),
('Whitefield Main Road', 'Whitefield Main Road, ITPL Area, Bangalore 560066', 12.9698, 77.7499, 35, 25, 20.00, 'CCTV, Well Lit, Security, Near Tech Parks', '24 Hours', 1, datetime('now')),
('HSR Layout BDA Complex', 'BDA Complex, HSR Layout Sector 1, Bangalore 560102', 12.9116, 77.6389, 28, 15, 18.00, 'CCTV Surveillance, Security Guard', '6 AM - 11 PM', 1, datetime('now'));

-- =============================================================================
-- 8. NOTIFICATIONS (Sample user notifications)
-- =============================================================================

INSERT INTO notifications (user_id, booking_id, notification_type, title, message, is_read, created_at)
VALUES
(1, 1, 'booking_confirmed', 'Booking Confirmed', 'Your parking slot A-103 has been confirmed for today at Tech Corp Plaza.', 1, datetime('now', '-1 hour')),
(1, 5, 'booking_completed', 'Booking Completed', 'Your booking for slot A-101 has been completed. Thank you for using ParkMitra!', 1, datetime('now', '-3 days')),
(9, 2, 'payment_success', 'Payment Successful', 'Your payment of ₹75.00 has been received successfully. Booking is now active.', 1, datetime('now', '-30 minutes')),
(2, 11, 'booking_reminder', 'Upcoming Booking', 'Reminder: Your booking starts in 2 hours at Tech Corp Plaza, slot B-201.', 0, datetime('now')),
(6, 12, 'booking_reminder', 'Booking Tomorrow', 'Reminder: You have a booking tomorrow at Central Hospital. Slot H-101.', 0, datetime('now')),
(10, 8, 'booking_completed', 'Booking Completed', 'Thank you for visiting Central Hospital. Your booking is now completed.', 1, datetime('now', '-1 day')),
(4, 14, 'booking_cancelled', 'Booking Cancelled', 'Your booking at City Mall has been cancelled as requested.', 1, datetime('now', '-4 days'));

-- =============================================================================
-- 9. ANALYTICS DATA (For Dashboard Reporting)
-- =============================================================================

INSERT INTO analytics (organization_id, date, total_bookings, member_bookings, visitor_bookings, walk_in_bookings, total_revenue, average_duration, peak_hour, created_at)
VALUES
-- Tech Corp Plaza (Org 1)
(1, date('now', '-1 day'), 25, 18, 5, 2, 250.00, 3.5, 14, datetime('now', '-1 day')),
(1, date('now', '-2 days'), 30, 22, 6, 2, 300.00, 3.8, 15, datetime('now', '-2 days')),
(1, date('now', '-3 days'), 28, 20, 6, 2, 280.00, 3.2, 16, datetime('now', '-3 days')),

-- City Mall (Org 2)
(2, date('now', '-1 day'), 45, 30, 12, 3, 450.00, 2.5, 16, datetime('now', '-1 day')),
(2, date('now', '-2 days'), 50, 35, 13, 2, 500.00, 2.8, 17, datetime('now', '-2 days')),
(2, date('now', '-3 days'), 42, 28, 11, 3, 420.00, 2.3, 18, datetime('now', '-3 days')),

-- Central Hospital (Org 3)
(3, date('now', '-1 day'), 35, 25, 8, 2, 320.00, 2.0, 10, datetime('now', '-1 day')),
(3, date('now', '-2 days'), 38, 27, 9, 2, 360.00, 2.2, 11, datetime('now', '-2 days')),
(3, date('now', '-3 days'), 32, 23, 7, 2, 280.00, 1.8, 9, datetime('now', '-3 days')),

-- Corporate Tower (Org 4)
(4, date('now', '-1 day'), 40, 35, 4, 1, 200.00, 4.0, 9, datetime('now', '-1 day')),
(4, date('now', '-2 days'), 38, 33, 4, 1, 180.00, 4.2, 10, datetime('now', '-2 days'));

-- =============================================================================
-- DATA VERIFICATION - Display summary of inserted records
-- =============================================================================

SELECT '========================================' as summary
UNION ALL SELECT 'ParkMitra Seed Data Summary'
UNION ALL SELECT '========================================'
UNION ALL SELECT ''
UNION ALL SELECT 'Organizations: ' || COUNT(*) FROM organizations
UNION ALL SELECT 'Users: ' || COUNT(*) FROM users
UNION ALL SELECT 'Watchmen: ' || COUNT(*) FROM watchmen
UNION ALL SELECT 'Parking Slots: ' || COUNT(*) FROM parking_slots
UNION ALL SELECT 'Bookings: ' || COUNT(*) FROM bookings
UNION ALL SELECT 'Payments: ' || COUNT(*) FROM payments
UNION ALL SELECT 'Informal Parking: ' || COUNT(*) FROM informal_parking
UNION ALL SELECT 'Notifications: ' || COUNT(*) FROM notifications
UNION ALL SELECT 'Analytics Records: ' || COUNT(*) FROM analytics
UNION ALL SELECT ''
UNION ALL SELECT '========================================';

-- =============================================================================
-- TEST CREDENTIALS REFERENCE
-- =============================================================================
--
-- NOTE: All passwords are 'password123' 
-- The placeholder hashes in this SQL won't work - use actual bcrypt in app
--
-- ORGANIZATION MEMBERS:
--   member@test.com          (Tech Corp Plaza)
--   sarah@techcorp.com       (Tech Corp Plaza)
--   rajesh@techcorp.com      (Tech Corp Plaza)
--   mike@citymall.com        (City Mall)
--   priya@citymall.com       (City Mall)
--   emily@hospital.com       (Central Hospital)
--   anand@hospital.com       (Central Hospital)
--   vikram@corptower.com     (Corporate Tower)
--
-- VISITORS:
--   visitor@test.com
--   guest@test.com
--   robert@gmail.com
--
-- ADMINS:
--   admin@techcorp.com       (Tech Corp Plaza Admin)
--   admin@citymall.com       (City Mall Admin)
--   admin@hospital.com       (Central Hospital Admin)
--   admin@corptower.com      (Corporate Tower Admin)
--
-- WATCHMEN:
--   watchman@test.com        (Tech Corp Plaza - Morning 8AM-4PM)
--   watchman2@test.com       (City Mall - Evening 4PM-12AM)
--   watchman3@test.com       (Central Hospital - Night 12AM-8AM)
--   watchman4@test.com       (Corporate Tower - Day 7AM-3PM)
--
-- =============================================================================
