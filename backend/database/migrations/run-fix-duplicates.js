/**
 * Migration Script: Fix Duplicate Slot Bookings
 * 
 * This script:
 * 1. Identifies duplicate bookings for the same slot
 * 2. Cancels older duplicates (keeps most recent)
 * 3. Recalculates available_slots for all organizations
 */

const fs = require('fs').promises;
const path = require('path');
const db = require('../../config/db');

async function runMigration() {
  try {
    console.log('\n' + '='.repeat(60));
    console.log('🔧 MIGRATION: Fix Duplicate Slot Bookings');
    console.log('='.repeat(60) + '\n');

    // Wait for database connection
    console.log('⏳ Waiting for database connection...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    await db.getDatabase();
    console.log('✅ Database connected\n');

    // Step 1: Find duplicate bookings
    console.log('📊 Step 1: Analyzing duplicate bookings...');
    const duplicates = await db.getAllRows(`
      SELECT 
        organization_id,
        slot_number,
        COUNT(*) as booking_count,
        GROUP_CONCAT(id) as booking_ids
      FROM bookings
      WHERE booking_status NOT IN ('completed', 'cancelled')
      GROUP BY organization_id, slot_number
      HAVING COUNT(*) > 1
    `);

    if (duplicates.length === 0) {
      console.log('✅ No duplicate bookings found. Database is clean!');
      return;
    }

    console.log(`⚠️  Found ${duplicates.length} slots with duplicate bookings:`);
    duplicates.forEach(dup => {
      console.log(`   - Slot ${dup.slot_number}: ${dup.booking_count} bookings (IDs: ${dup.booking_ids})`);
    });

    // Step 2: Cancel older duplicate bookings
    console.log('\n🔄 Step 2: Cancelling older duplicate bookings...');
    
    for (const dup of duplicates) {
      const bookingIds = dup.booking_ids.split(',').map(id => parseInt(id));
      
      // Get all bookings for this slot with their details
      const bookings = await db.getAllRows(`
        SELECT id, booking_start_time, vehicle_number
        FROM bookings
        WHERE id IN (${bookingIds.join(',')})
        ORDER BY id DESC
      `);

      // Keep the first one (most recent ID), cancel the rest
      const keepBooking = bookings[0];
      const cancelBookings = bookings.slice(1);

      console.log(`   Slot ${dup.slot_number}:`);
      console.log(`     ✓ Keeping: Booking #${keepBooking.id} (Vehicle: ${keepBooking.vehicle_number})`);

      for (const booking of cancelBookings) {
        await db.runQuery(
          `UPDATE bookings 
           SET booking_status = 'cancelled', updated_at = CURRENT_TIMESTAMP 
           WHERE id = ?`,
          [booking.id]
        );
        console.log(`     ✗ Cancelled: Booking #${booking.id} (Vehicle: ${booking.vehicle_number})`);
      }
    }

    // Step 3: Recalculate available_slots
    console.log('\n🔢 Step 3: Recalculating available_slots for all organizations...');
    
    const organizations = await db.getAllRows('SELECT id, org_name, total_slots FROM organizations');
    
    for (const org of organizations) {
      // Count unique occupied slots
      const result = await db.getRow(`
        SELECT COUNT(DISTINCT slot_number) as occupied_slots
        FROM bookings
        WHERE organization_id = ?
          AND booking_status NOT IN ('completed', 'cancelled')
      `, [org.id]);

      const occupiedSlots = result.occupied_slots || 0;
      const availableSlots = org.total_slots - occupiedSlots;

      await db.runQuery(
        'UPDATE organizations SET available_slots = ? WHERE id = ?',
        [availableSlots, org.id]
      );

      console.log(`   ${org.org_name}: ${org.total_slots} total, ${occupiedSlots} occupied, ${availableSlots} available`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Migration completed successfully!');
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error.stack);
    throw error;
  }
}

// Run migration if called directly
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('✅ All done! Exiting...');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { runMigration };
