const { runQuery, getRow, getAllRows } = require('../config/db');

/**
 * Safely delete an organization and all its related data
 * This function handles all foreign key constraints and deletes in the correct order
 * 
 * @param {number} organizationId - The ID of the organization to delete
 * @returns {Promise<Object>} Result of the deletion operation
 */
async function deleteOrganizationWithDependencies(organizationId) {
  try {
    console.log(`\n🗑️ Starting deletion process for organization ID: ${organizationId}`);
    
    // 1. Get organization details
    const org = await getRow('SELECT * FROM organizations WHERE id = ?', [organizationId]);
    if (!org) {
      throw new Error('Organization not found');
    }
    console.log(`✓ Found organization: ${org.org_name}`);
    
    // 2. Check for related data
    const stats = {
      users: 0,
      bookings: 0,
      payments: 0,
      parkingLots: 0,
      watchmen: 0
    };
    
    // Count users
    const usersResult = await getRow(
      'SELECT COUNT(*) as count FROM users WHERE organization_id = ?',
      [organizationId]
    );
    stats.users = usersResult ? usersResult.count : 0;
    console.log(`  - Users: ${stats.users}`);
    
    // Count bookings
    const bookingsResult = await getRow(
      'SELECT COUNT(*) as count FROM bookings WHERE organization_id = ?',
      [organizationId]
    );
    stats.bookings = bookingsResult ? bookingsResult.count : 0;
    console.log(`  - Bookings: ${stats.bookings}`);
    
    // Count payments (via bookings)
    const paymentsResult = await getRow(
      `SELECT COUNT(*) as count FROM payments 
       WHERE booking_id IN (SELECT id FROM bookings WHERE organization_id = ?)`,
      [organizationId]
    );
    stats.payments = paymentsResult ? paymentsResult.count : 0;
    console.log(`  - Payments: ${stats.payments}`);
    
    // Count parking lots
    const parkingLotsResult = await getRow(
      'SELECT COUNT(*) as count FROM parking_lots WHERE organization_id = ?',
      [organizationId]
    );
    stats.parkingLots = parkingLotsResult ? parkingLotsResult.count : 0;
    console.log(`  - Parking Lots: ${stats.parkingLots}`);
    
    // Count watchmen
    const watchmenResult = await getRow(
      'SELECT COUNT(*) as count FROM watchmen WHERE organization_id = ?',
      [organizationId]
    );
    stats.watchmen = watchmenResult ? watchmenResult.count : 0;
    console.log(`  - Watchmen: ${stats.watchmen}`);
    
    // 3. Delete in correct order (respecting foreign key constraints)
    
    // Step 3.1: Delete payments (references bookings)
    if (stats.payments > 0) {
      console.log(`\n🗑️ Deleting ${stats.payments} payments...`);
      await runQuery(
        `DELETE FROM payments 
         WHERE booking_id IN (SELECT id FROM bookings WHERE organization_id = ?)`,
        [organizationId]
      );
      console.log(`✓ Deleted ${stats.payments} payments`);
    }
    
    // Step 3.2: Delete bookings (references organization, users, parking_lots)
    if (stats.bookings > 0) {
      console.log(`\n🗑️ Deleting ${stats.bookings} bookings...`);
      await runQuery(
        'DELETE FROM bookings WHERE organization_id = ?',
        [organizationId]
      );
      console.log(`✓ Deleted ${stats.bookings} bookings`);
    }
    
    // Step 3.3: Delete parking lots (references organization)
    if (stats.parkingLots > 0) {
      console.log(`\n🗑️ Deleting ${stats.parkingLots} parking lots...`);
      await runQuery(
        'DELETE FROM parking_lots WHERE organization_id = ?',
        [organizationId]
      );
      console.log(`✓ Deleted ${stats.parkingLots} parking lots`);
    }
    
    // Step 3.4: Delete watchmen (references organization)
    if (stats.watchmen > 0) {
      console.log(`\n🗑️ Deleting ${stats.watchmen} watchmen...`);
      await runQuery(
        'DELETE FROM watchmen WHERE organization_id = ?',
        [organizationId]
      );
      console.log(`✓ Deleted ${stats.watchmen} watchmen`);
    }
    
    // Step 3.5: Delete users (references organization with ON DELETE SET NULL)
    // Since the schema has ON DELETE SET NULL, we could just delete the org
    // But for clean data, let's explicitly delete organization members
    if (stats.users > 0) {
      console.log(`\n🗑️ Deleting ${stats.users} users...`);
      await runQuery(
        'DELETE FROM users WHERE organization_id = ?',
        [organizationId]
      );
      console.log(`✓ Deleted ${stats.users} users`);
    }
    
    // Step 3.6: Finally, delete the organization itself
    console.log(`\n🗑️ Deleting organization: ${org.org_name}...`);
    await runQuery(
      'DELETE FROM organizations WHERE id = ?',
      [organizationId]
    );
    console.log(`✓ Organization deleted successfully`);
    
    // 4. Return summary
    const summary = {
      success: true,
      message: `Organization "${org.org_name}" and all related data deleted successfully`,
      organization: {
        id: organizationId,
        name: org.org_name,
        admin_email: org.admin_email
      },
      deletedRecords: stats
    };
    
    console.log(`\n✅ Deletion completed successfully!`);
    console.log(JSON.stringify(summary, null, 2));
    
    return summary;
    
  } catch (error) {
    console.error(`\n❌ Error during organization deletion:`, error.message);
    throw error;
  }
}

/**
 * Safely delete a user (organization admin or member)
 * This function handles all foreign key constraints
 * 
 * @param {number} userId - The ID of the user to delete
 * @returns {Promise<Object>} Result of the deletion operation
 */
async function deleteUserWithDependencies(userId) {
  try {
    console.log(`\n🗑️ Starting deletion process for user ID: ${userId}`);
    
    // 1. Get user details
    const user = await getRow('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) {
      throw new Error('User not found');
    }
    console.log(`✓ Found user: ${user.name} (${user.email})`);
    console.log(`  - User type: ${user.user_type}`);
    console.log(`  - Organization ID: ${user.organization_id || 'None'}`);
    
    // 2. Check if user is an organization admin
    if (user.organization_id) {
      const org = await getRow(
        'SELECT * FROM organizations WHERE admin_email = ?',
        [user.email]
      );
      
      if (org) {
        console.log(`\n⚠️  WARNING: This user is the admin of organization "${org.org_name}"`);
        console.log(`❌ Cannot delete organization admin without deleting the entire organization`);
        throw new Error(
          `Cannot delete user. This user is the admin of "${org.org_name}". ` +
          `Delete the organization first or transfer admin rights to another user.`
        );
      }
    }
    
    // 3. Check for related bookings
    const bookingsResult = await getRow(
      'SELECT COUNT(*) as count FROM bookings WHERE user_id = ?',
      [userId]
    );
    const bookingsCount = bookingsResult ? bookingsResult.count : 0;
    console.log(`  - Bookings: ${bookingsCount}`);
    
    // 4. Get booking IDs for payment deletion
    if (bookingsCount > 0) {
      const bookingIds = await getAllRows(
        'SELECT id FROM bookings WHERE user_id = ?',
        [userId]
      );
      
      // Delete payments first
      const paymentsResult = await getRow(
        `SELECT COUNT(*) as count FROM payments 
         WHERE booking_id IN (${bookingIds.map(b => b.id).join(',')})`,
        []
      );
      const paymentsCount = paymentsResult ? paymentsResult.count : 0;
      
      if (paymentsCount > 0) {
        console.log(`\n🗑️ Deleting ${paymentsCount} payments...`);
        await runQuery(
          `DELETE FROM payments WHERE booking_id IN (${bookingIds.map(b => b.id).join(',')})`,
          []
        );
        console.log(`✓ Deleted ${paymentsCount} payments`);
      }
      
      // Delete bookings
      console.log(`\n🗑️ Deleting ${bookingsCount} bookings...`);
      await runQuery('DELETE FROM bookings WHERE user_id = ?', [userId]);
      console.log(`✓ Deleted ${bookingsCount} bookings`);
    }
    
    // 5. Delete the user
    console.log(`\n🗑️ Deleting user: ${user.name}...`);
    await runQuery('DELETE FROM users WHERE id = ?', [userId]);
    console.log(`✓ User deleted successfully`);
    
    // 6. Return summary
    const summary = {
      success: true,
      message: `User "${user.name}" and all related data deleted successfully`,
      user: {
        id: userId,
        name: user.name,
        email: user.email,
        type: user.user_type
      },
      deletedRecords: {
        bookings: bookingsCount,
        payments: bookingsCount > 0 ? await getRow(
          'SELECT COUNT(*) as count FROM payments WHERE booking_id IN (SELECT id FROM bookings WHERE user_id = ?)',
          [userId]
        ).then(r => r ? r.count : 0) : 0
      }
    };
    
    console.log(`\n✅ Deletion completed successfully!`);
    console.log(JSON.stringify(summary, null, 2));
    
    return summary;
    
  } catch (error) {
    console.error(`\n❌ Error during user deletion:`, error.message);
    throw error;
  }
}

module.exports = {
  deleteOrganizationWithDependencies,
  deleteUserWithDependencies
};
