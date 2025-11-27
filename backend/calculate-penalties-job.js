/**
 * Scheduled Job: Calculate and Update Overstay Penalties
 * 
 * This script should be run periodically (e.g., every hour) to:
 * 1. Mark expired bookings as overstay
 * 2. Calculate and update penalty amounts for overstay bookings
 * 
 * Run this with: node calculate-penalties-job.js
 * Or schedule it with cron/task scheduler
 */

const { runQuery, getAllRows, getDatabase } = require('./config/db');

async function markExpiredBookings() {
  console.log('\n=== Marking Expired Bookings as Overstay ===');
  const now = new Date().toISOString();
  
  try {
    const result = await runQuery(
      `UPDATE bookings
       SET booking_status = 'overstay',
           updated_at = CURRENT_TIMESTAMP
       WHERE booking_status = 'active'
         AND booking_end_time < ?`,
      [now]
    );
    
    console.log(`✅ Marked ${result.changes || 0} bookings as overstay`);
    return result.changes || 0;
  } catch (error) {
    console.error('❌ Error marking expired bookings:', error);
    return 0;
  }
}

async function calculatePenalties() {
  console.log('\n=== Calculating Overstay Penalties ===');
  
  try {
    // Get all overstay bookings with organization rates
    const overstayBookings = await getAllRows(
      `SELECT b.*, o.visitor_hourly_rate
       FROM bookings b
       JOIN organizations o ON b.organization_id = o.id
       WHERE b.booking_status = 'overstay'`
    );
    
    console.log(`Found ${overstayBookings.length} overstay bookings to process`);
    
    const now = new Date();
    let updatedCount = 0;
    
    for (const booking of overstayBookings) {
      const endTime = new Date(booking.booking_end_time);
      const overstayMinutes = Math.ceil((now - endTime) / (1000 * 60));
      
      if (overstayMinutes > 0) {
        // Calculate penalty: 2x hourly rate per hour overstayed
        const overstayHours = Math.ceil(overstayMinutes / 60);
        const penaltyRate = booking.visitor_hourly_rate * 2;
        const penaltyAmount = overstayHours * penaltyRate;
        
        // Update booking with new penalty
        await runQuery(
          `UPDATE bookings 
           SET overstay_minutes = ?, 
               penalty_amount = ?,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [overstayMinutes, penaltyAmount, booking.id]
        );
        
        console.log(`  ✓ Booking ID ${booking.id}: ${overstayMinutes} mins overstay = ₹${penaltyAmount} penalty`);
        updatedCount++;
      }
    }
    
    console.log(`✅ Updated ${updatedCount} booking penalties`);
    return updatedCount;
  } catch (error) {
    console.error('❌ Error calculating penalties:', error);
    return 0;
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║   Overstay Penalty Calculation Job                ║');
  console.log('║   ' + new Date().toLocaleString('en-IN').padEnd(46) + ' ║');
  console.log('╚════════════════════════════════════════════════════╝');
  
  try {
    // Initialize database connection
    console.log('\n=== Initializing Database Connection ===');
    await getDatabase();
    console.log('✅ Database connected');
    
    // Step 1: Mark expired bookings as overstay
    const expiredCount = await markExpiredBookings();
    
    // Step 2: Calculate and update penalties
    const updatedCount = await calculatePenalties();
    
    console.log('\n=== Summary ===');
    console.log(`Bookings marked as overstay: ${expiredCount}`);
    console.log(`Penalties updated: ${updatedCount}`);
    console.log('\n✅ Job completed successfully\n');
    
  } catch (error) {
    console.error('\n❌ Job failed:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

// Run the job
if (require.main === module) {
  main();
}

module.exports = { markExpiredBookings, calculatePenalties };
