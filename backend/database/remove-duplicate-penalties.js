const { db } = require('../config/db');

async function runQuery(sql, params = []) {
  // Wait for db to be ready
  await new Promise(resolve => setTimeout(resolve, 500));
  const dbInstance = db();
  
  return new Promise((resolve, reject) => {
    dbInstance.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function executeUpdate(sql, params = []) {
  const dbInstance = db();
  return new Promise((resolve, reject) => {
    dbInstance.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this.changes);
    });
  });
}

async function removeDuplicatePenalties() {
  console.log('🔍 Finding duplicate penalty payments...\n');
  
  // Find all penalty payments grouped by booking_id and transaction details
  const duplicates = await runQuery(`
    SELECT 
      booking_id,
      amount,
      payment_method,
      DATE(created_at) as payment_date,
      COUNT(*) as payment_count,
      GROUP_CONCAT(id) as payment_ids
    FROM payments
    WHERE payment_type = 'penalty'
    GROUP BY booking_id, amount, payment_method, DATE(created_at)
    HAVING COUNT(*) > 1
    ORDER BY created_at DESC
  `);
  
  if (duplicates.length === 0) {
    console.log('✅ No duplicate penalty payments found!');
    return;
  }
  
  console.log(`Found ${duplicates.length} sets of duplicate payments:\n`);
  
  let totalRemoved = 0;
  
  for (const dup of duplicates) {
    const paymentIds = dup.payment_ids.split(',').map(id => parseInt(id));
    const keepId = Math.max(...paymentIds); // Keep the most recent one
    const removeIds = paymentIds.filter(id => id !== keepId);
    
    console.log(`Booking ${dup.booking_id}:`);
    console.log(`  - Amount: ₹${dup.amount}`);
    console.log(`  - Method: ${dup.payment_method}`);
    console.log(`  - Date: ${dup.payment_date}`);
    console.log(`  - Count: ${dup.payment_count} payments`);
    console.log(`  - Keeping ID: ${keepId}`);
    console.log(`  - Removing IDs: ${removeIds.join(', ')}`);
    
    // Delete the duplicate payments (keep only the most recent)
    for (const removeId of removeIds) {
      await executeUpdate('DELETE FROM payments WHERE id = ?', [removeId]);
      totalRemoved++;
    }
    
    console.log(`  ✅ Removed ${removeIds.length} duplicate(s)\n`);
  }
  
  console.log(`\n✅ Total duplicate payments removed: ${totalRemoved}`);
  
  // Show remaining penalty payments
  const remaining = await runQuery(`
    SELECT 
      p.id,
      p.booking_id,
      p.amount,
      p.payment_method,
      p.transaction_id,
      datetime(p.created_at, 'localtime') as payment_time,
      b.vehicle_number
    FROM payments p
    LEFT JOIN bookings b ON p.booking_id = b.id
    WHERE p.payment_type = 'penalty'
    ORDER BY p.created_at DESC
  `);
  
  console.log(`\n📋 Remaining penalty payments: ${remaining.length}\n`);
  remaining.forEach(p => {
    console.log(`ID: ${p.id} | Booking: ${p.booking_id} | Vehicle: ${p.vehicle_number} | Amount: ₹${p.amount} | Method: ${p.payment_method} | Time: ${p.payment_time}`);
  });
}

removeDuplicatePenalties()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
