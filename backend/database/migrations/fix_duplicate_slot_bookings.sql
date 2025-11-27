-- Migration: Fix duplicate slot bookings
-- This migration cancels older duplicate bookings for the same slot
-- keeping only the most recent booking per slot

-- Step 1: Identify and mark duplicate bookings as cancelled (keep the most recent one per slot)
UPDATE bookings
SET booking_status = 'cancelled',
    updated_at = CURRENT_TIMESTAMP
WHERE id IN (
    SELECT b1.id
    FROM bookings b1
    INNER JOIN (
        SELECT 
            organization_id,
            slot_number,
            MAX(id) as latest_booking_id
        FROM bookings
        WHERE booking_status NOT IN ('completed', 'cancelled')
        GROUP BY organization_id, slot_number
        HAVING COUNT(*) > 1
    ) b2 ON b1.organization_id = b2.organization_id 
        AND b1.slot_number = b2.slot_number
        AND b1.id < b2.latest_booking_id
    WHERE b1.booking_status NOT IN ('completed', 'cancelled')
);

-- Step 2: Add a note explaining the cancellation
-- (SQLite doesn't support adding comments to rows, but we'll log this in a separate table if needed)

-- Step 3: Recalculate available_slots for all organizations
-- This ensures the counter is accurate after fixing duplicates
UPDATE organizations
SET available_slots = (
    SELECT total_slots - COUNT(DISTINCT b.slot_number)
    FROM bookings b
    WHERE b.organization_id = organizations.id
        AND b.booking_status NOT IN ('completed', 'cancelled')
);
