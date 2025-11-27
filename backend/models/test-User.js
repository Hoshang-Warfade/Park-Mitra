/**
 * Test Suite for User Model
 * Tests all database operations and password handling
 */

const {
  createUser,
  findByEmail,
  findById,
  verifyPassword,
  updateUser,
  verifyOrganizationMember,
  getAllUsersByOrganization,
  User
} = require('./User');
const { initializeDatabase, closeDatabase } = require('../config/db');

// Test counter
let totalTests = 0;
let passedTests = 0;

const test = async (name, fn) => {
  totalTests++;
  try {
    await fn();
    passedTests++;
    console.log(`✓ ${name}`);
  } catch (error) {
    console.log(`✗ ${name}`);
    console.error(`  Error: ${error.message}`);
  }
};

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
};

// Test data
const testUsers = {
  visitor: {
    name: 'John Doe',
    email: 'john.doe@example.com',
    mobile: '9876543210',
    password: 'Test@123',
    user_type: 'visitor'
  },
  orgMember: {
    name: 'Jane Smith',
    email: 'jane.smith@company.com',
    mobile: '9876543211',
    password: 'Test@456',
    user_type: 'organization_member',
    organization_id: 1,
    employee_id: 'EMP001'
  },
  walkIn: {
    name: 'Walk In User',
    email: 'walkin@example.com',
    mobile: '9876543212',
    password: 'Walk@789',
    user_type: 'walk_in',
    organization_id: null,
    employee_id: null
  }
};

let createdUserIds = [];

console.log('\n' + '='.repeat(70));
console.log('Testing User Model');
console.log('='.repeat(70) + '\n');

async function runTests() {
  try {
    // Initialize database
    console.log('Initializing test database...\n');
    await initializeDatabase();

    // ============================================================================
    // Test createUser Function
    // ============================================================================
    console.log('👤 Testing createUser Function...\n');

    await test('createUser: Should create visitor user', async () => {
      const user = await createUser(
        testUsers.visitor.name,
        testUsers.visitor.email,
        testUsers.visitor.mobile,
        testUsers.visitor.password,
        testUsers.visitor.user_type
      );

      assert(user, 'User should be created');
      assert(user.id, 'User should have ID');
      assert(user.name === testUsers.visitor.name, 'Name should match');
      assert(user.email === testUsers.visitor.email, 'Email should match');
      assert(user.mobile === testUsers.visitor.mobile, 'Mobile should match');
      assert(user.user_type === testUsers.visitor.user_type, 'User type should match');
      assert(!user.password, 'Password should not be in response');
      assert(user.is_verified === 0, 'User should not be verified initially');

      createdUserIds.push(user.id);
    });

    await test('createUser: Should create organization member', async () => {
      const user = await createUser(
        testUsers.orgMember.name,
        testUsers.orgMember.email,
        testUsers.orgMember.mobile,
        testUsers.orgMember.password,
        testUsers.orgMember.user_type,
        testUsers.orgMember.organization_id,
        testUsers.orgMember.employee_id
      );

      assert(user, 'User should be created');
      assert(user.organization_id === testUsers.orgMember.organization_id, 'Organization ID should match');
      assert(user.employee_id === testUsers.orgMember.employee_id, 'Employee ID should match');
      assert(!user.password, 'Password should not be in response');

      createdUserIds.push(user.id);
    });

    await test('createUser: Should hash password', async () => {
      const user = await createUser(
        'Test User',
        'test.hash@example.com',
        '9876543213',
        'PlainPassword123',
        'visitor'
      );

      // Verify password is hashed in database
      const dbUser = await findByEmail('test.hash@example.com');
      assert(dbUser.password !== 'PlainPassword123', 'Password should be hashed');
      assert(dbUser.password.length > 50, 'Hashed password should be long');
      assert(dbUser.password.startsWith('$2b$'), 'Should be bcrypt hash');

      createdUserIds.push(user.id);
    });

    // ============================================================================
    // Test findByEmail Function
    // ============================================================================
    console.log('\n📧 Testing findByEmail Function...\n');

    await test('findByEmail: Should find user by email', async () => {
      const user = await findByEmail(testUsers.visitor.email);

      assert(user, 'User should be found');
      assert(user.email === testUsers.visitor.email, 'Email should match');
      assert(user.name === testUsers.visitor.name, 'Name should match');
      assert(user.password, 'Password should be included');
    });

    await test('findByEmail: Should return null/undefined for non-existent email', async () => {
      const user = await findByEmail('nonexistent@example.com');
      assert(!user, 'Should return null or undefined');
    });

    // ============================================================================
    // Test findById Function
    // ============================================================================
    console.log('\n🔍 Testing findById Function...\n');

    await test('findById: Should find user by ID', async () => {
      const user = await findById(createdUserIds[0]);

      assert(user, 'User should be found');
      assert(user.id === createdUserIds[0], 'ID should match');
      assert(user.email === testUsers.visitor.email, 'Email should match');
      assert(!user.password, 'Password should NOT be included');
    });

    await test('findById: Should return null/undefined for non-existent ID', async () => {
      const user = await findById(99999);
      assert(!user, 'Should return null or undefined');
    });

    // ============================================================================
    // Test verifyPassword Function
    // ============================================================================
    console.log('\n🔐 Testing verifyPassword Function...\n');

    await test('verifyPassword: Should verify correct password', async () => {
      const user = await verifyPassword(
        testUsers.visitor.email,
        testUsers.visitor.password
      );

      assert(user, 'User should be returned');
      assert(user.email === testUsers.visitor.email, 'Email should match');
      assert(!user.password, 'Password should NOT be in response');
    });

    await test('verifyPassword: Should reject incorrect password', async () => {
      const user = await verifyPassword(
        testUsers.visitor.email,
        'WrongPassword123'
      );

      assert(user === null, 'Should return null for wrong password');
    });

    await test('verifyPassword: Should return null for non-existent email', async () => {
      const user = await verifyPassword(
        'nonexistent@example.com',
        'SomePassword'
      );

      assert(user === null, 'Should return null for non-existent user');
    });

    // ============================================================================
    // Test updateUser Function
    // ============================================================================
    console.log('\n✏️  Testing updateUser Function...\n');

    await test('updateUser: Should update user fields', async () => {
      const updatedUser = await updateUser(createdUserIds[0], {
        name: 'John Updated',
        mobile: '9999999999'
      });

      assert(updatedUser, 'Updated user should be returned');
      assert(updatedUser.name === 'John Updated', 'Name should be updated');
      assert(updatedUser.mobile === '9999999999', 'Mobile should be updated');
      assert(updatedUser.email === testUsers.visitor.email, 'Email should remain unchanged');
    });

    await test('updateUser: Should update is_verified flag', async () => {
      const updatedUser = await updateUser(createdUserIds[0], {
        is_verified: 1
      });

      assert(updatedUser.is_verified === 1, 'User should be verified');
    });

    await test('updateUser: Should reject invalid fields', async () => {
      try {
        await updateUser(createdUserIds[0], {
          invalid_field: 'test'
        });
        throw new Error('Should have thrown error');
      } catch (error) {
        assert(error.message.includes('No valid fields'), 'Should reject invalid fields');
      }
    });

    // ============================================================================
    // Test verifyOrganizationMember Function
    // ============================================================================
    console.log('\n🏢 Testing verifyOrganizationMember Function...\n');

    await test('verifyOrganizationMember: Should verify valid organization member', async () => {
      const isValid = await verifyOrganizationMember(
        createdUserIds[1],
        testUsers.orgMember.organization_id
      );

      assert(isValid === true, 'Should return true for valid member');
    });

    await test('verifyOrganizationMember: Should reject user from different organization', async () => {
      const isValid = await verifyOrganizationMember(
        createdUserIds[1],
        999 // Different organization
      );

      assert(isValid === false, 'Should return false for different organization');
    });

    await test('verifyOrganizationMember: Should reject visitor user', async () => {
      const isValid = await verifyOrganizationMember(
        createdUserIds[0], // Visitor user
        1
      );

      assert(isValid === false, 'Should return false for visitor user');
    });

    await test('verifyOrganizationMember: Should reject user without employee_id', async () => {
      // Create user without employee_id
      const userWithoutEmpId = await createUser(
        'No Employee ID',
        'no.emp@company.com',
        '9876543214',
        'Test@123',
        'organization_member',
        1,
        null // No employee_id
      );

      const isValid = await verifyOrganizationMember(userWithoutEmpId.id, 1);
      assert(isValid === false, 'Should return false for user without employee_id');

      createdUserIds.push(userWithoutEmpId.id);
    });

    // ============================================================================
    // Test getAllUsersByOrganization Function
    // ============================================================================
    console.log('\n👥 Testing getAllUsersByOrganization Function...\n');

    await test('getAllUsersByOrganization: Should return organization members', async () => {
      const users = await getAllUsersByOrganization(1);

      assert(Array.isArray(users), 'Should return an array');
      assert(users.length >= 1, 'Should have at least one member');
      
      // Check all returned users are organization members
      if (users.length > 0) {
        users.forEach(user => {
          assert(user.user_type === 'organization_member', 'All should be organization_member');
          assert(!user.password, 'Password should not be included');
        });
      }
    });

    await test('getAllUsersByOrganization: Should return empty array for organization with no members', async () => {
      const users = await getAllUsersByOrganization(999);

      assert(Array.isArray(users), 'Should return an array');
      assert(users.length === 0, 'Should be empty for non-existent organization');
    });

    await test('getAllUsersByOrganization: Should filter by user_type', async () => {
      const users = await getAllUsersByOrganization(1);

      // Verify no visitor users are returned
      const hasVisitor = users.some(user => user.user_type === 'visitor');
      const hasWalkIn = users.some(user => user.user_type === 'walk_in');
      assert(!hasVisitor, 'Should not include visitor users');
      assert(!hasWalkIn, 'Should not include walk_in users');
    });

    // ============================================================================
    // Test Legacy Methods (Backward Compatibility)
    // ============================================================================
    console.log('\n🔄 Testing Legacy Methods...\n');

    await test('User.findByMobile: Should find user by mobile', async () => {
      // Use the updated mobile number from the update test
      const user = await User.findByMobile('9999999999');
      assert(user, 'User should be found');
      assert(user.mobile === '9999999999', 'Mobile should match');
    });

    await test('User.findByEmployeeId: Should find user by employee ID', async () => {
      const user = await User.findByEmployeeId(
        testUsers.orgMember.employee_id,
        testUsers.orgMember.organization_id
      );
      assert(user, 'User should be found');
      assert(user.employee_id === testUsers.orgMember.employee_id, 'Employee ID should match');
    });

    await test('User.countByOrganization: Should count organization users', async () => {
      const count = await User.countByOrganization(1);
      assert(count >= 1, 'Should have at least one user');
      assert(typeof count === 'number', 'Count should be a number');
    });

    // ============================================================================
    // Cleanup
    // ============================================================================
    console.log('\n🧹 Cleaning up test data...\n');

    // Delete test users
    for (const userId of createdUserIds) {
      await User.delete(userId);
    }

    console.log('Test data cleaned up.\n');

  } catch (error) {
    console.error('Test execution error:', error);
  } finally {
    // Close database
    await closeDatabase();
  }
}

// Run all tests
runTests().then(() => {
  // Test Summary
  console.log('='.repeat(70));
  console.log('Test Summary');
  console.log('='.repeat(70));
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${totalTests - passedTests}`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(2)}%`);
  console.log('='.repeat(70) + '\n');

  if (passedTests === totalTests) {
    console.log('🎉 All tests passed!\n');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed.\n');
    process.exit(1);
  }
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
