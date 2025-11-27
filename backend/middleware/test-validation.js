/**
 * Test Suite for Validation Middleware
 * Tests all validation functions with various test cases
 */

const {
  validateMobile,
  validateEmail,
  validateUserType,
  validatePassword,
  validateVehicleNumber,
  validateBookingTime,
  validateOrganizationMember
} = require('./validation');

// Mock response object
const createMockRes = () => {
  const res = {};
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res.jsonData = data;
    return res;
  };
  return res;
};

// Mock next function
const createMockNext = () => {
  let called = false;
  const next = () => { called = true; };
  next.wasCalled = () => called;
  return next;
};

// Test counter
let totalTests = 0;
let passedTests = 0;

const test = (name, fn) => {
  totalTests++;
  try {
    fn();
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

console.log('\n' + '='.repeat(70));
console.log('Testing Validation Middleware');
console.log('='.repeat(70) + '\n');

// ============================================================================
// Test validateMobile
// ============================================================================
console.log('📱 Testing validateMobile...\n');

test('validateMobile: should pass with valid 10-digit mobile', () => {
  const req = { body: { mobile: '9876543210' } };
  const res = createMockRes();
  const next = createMockNext();
  
  validateMobile(req, res, next);
  assert(next.wasCalled(), 'next() should be called');
});

test('validateMobile: should fail when mobile is missing', () => {
  const req = { body: {} };
  const res = createMockRes();
  const next = createMockNext();
  
  validateMobile(req, res, next);
  assert(res.statusCode === 400, 'Status should be 400');
  assert(res.jsonData.error === 'Mobile number is required', 'Error message mismatch');
});

test('validateMobile: should fail when mobile is not a string', () => {
  const req = { body: { mobile: 9876543210 } };
  const res = createMockRes();
  const next = createMockNext();
  
  validateMobile(req, res, next);
  assert(res.statusCode === 400, 'Status should be 400');
  assert(res.jsonData.error === 'Mobile number must be a string', 'Error message mismatch');
});

test('validateMobile: should fail with less than 10 digits', () => {
  const req = { body: { mobile: '987654321' } };
  const res = createMockRes();
  const next = createMockNext();
  
  validateMobile(req, res, next);
  assert(res.statusCode === 400, 'Status should be 400');
  assert(res.jsonData.error === 'Mobile number must be exactly 10 digits', 'Error message mismatch');
});

test('validateMobile: should fail with more than 10 digits', () => {
  const req = { body: { mobile: '98765432100' } };
  const res = createMockRes();
  const next = createMockNext();
  
  validateMobile(req, res, next);
  assert(res.statusCode === 400, 'Status should be 400');
});

test('validateMobile: should fail with letters in mobile', () => {
  const req = { body: { mobile: '987654321a' } };
  const res = createMockRes();
  const next = createMockNext();
  
  validateMobile(req, res, next);
  assert(res.statusCode === 400, 'Status should be 400');
});

// ============================================================================
// Test validateEmail
// ============================================================================
console.log('\n📧 Testing validateEmail...\n');

test('validateEmail: should pass with valid email', () => {
  const req = { body: { email: 'test@example.com' } };
  const res = createMockRes();
  const next = createMockNext();
  
  validateEmail(req, res, next);
  assert(next.wasCalled(), 'next() should be called');
});

test('validateEmail: should fail when email is missing', () => {
  const req = { body: {} };
  const res = createMockRes();
  const next = createMockNext();
  
  validateEmail(req, res, next);
  assert(res.statusCode === 400, 'Status should be 400');
  assert(res.jsonData.error === 'Email is required', 'Error message mismatch');
});

test('validateEmail: should fail with invalid email format (no @)', () => {
  const req = { body: { email: 'testexample.com' } };
  const res = createMockRes();
  const next = createMockNext();
  
  validateEmail(req, res, next);
  assert(res.statusCode === 400, 'Status should be 400');
  assert(res.jsonData.error === 'Invalid email format', 'Error message mismatch');
});

test('validateEmail: should fail with invalid email format (no domain)', () => {
  const req = { body: { email: 'test@' } };
  const res = createMockRes();
  const next = createMockNext();
  
  validateEmail(req, res, next);
  assert(res.statusCode === 400, 'Status should be 400');
});

test('validateEmail: should pass with complex valid email', () => {
  const req = { body: { email: 'user.name+tag@example.co.in' } };
  const res = createMockRes();
  const next = createMockNext();
  
  validateEmail(req, res, next);
  assert(next.wasCalled(), 'next() should be called');
});

// ============================================================================
// Test validateUserType
// ============================================================================
console.log('\n👤 Testing validateUserType...\n');

test('validateUserType: should pass with organization_member', () => {
  const req = { body: { user_type: 'organization_member' } };
  const res = createMockRes();
  const next = createMockNext();
  
  validateUserType(req, res, next);
  assert(next.wasCalled(), 'next() should be called');
});

test('validateUserType: should pass with visitor', () => {
  const req = { body: { user_type: 'visitor' } };
  const res = createMockRes();
  const next = createMockNext();
  
  validateUserType(req, res, next);
  assert(next.wasCalled(), 'next() should be called');
});

test('validateUserType: should pass with walk_in', () => {
  const req = { body: { user_type: 'walk_in' } };
  const res = createMockRes();
  const next = createMockNext();
  
  validateUserType(req, res, next);
  assert(next.wasCalled(), 'next() should be called');
});

test('validateUserType: should fail with invalid type', () => {
  const req = { body: { user_type: 'admin' } };
  const res = createMockRes();
  const next = createMockNext();
  
  validateUserType(req, res, next);
  assert(res.statusCode === 400, 'Status should be 400');
  assert(res.jsonData.error.includes('Invalid user type'), 'Error message mismatch');
});

test('validateUserType: should fail when user_type is missing', () => {
  const req = { body: {} };
  const res = createMockRes();
  const next = createMockNext();
  
  validateUserType(req, res, next);
  assert(res.statusCode === 400, 'Status should be 400');
});

test('validateUserType: should work with userType field (camelCase)', () => {
  const req = { body: { userType: 'visitor' } };
  const res = createMockRes();
  const next = createMockNext();
  
  validateUserType(req, res, next);
  assert(next.wasCalled(), 'next() should be called');
});

// ============================================================================
// Test validatePassword
// ============================================================================
console.log('\n🔒 Testing validatePassword...\n');

test('validatePassword: should pass with valid password', () => {
  const req = { body: { password: 'Password123' } };
  const res = createMockRes();
  const next = createMockNext();
  
  validatePassword(req, res, next);
  assert(next.wasCalled(), 'next() should be called');
});

test('validatePassword: should fail when password is missing', () => {
  const req = { body: {} };
  const res = createMockRes();
  const next = createMockNext();
  
  validatePassword(req, res, next);
  assert(res.statusCode === 400, 'Status should be 400');
  assert(res.jsonData.error === 'Password is required', 'Error message mismatch');
});

test('validatePassword: should fail with less than 8 characters', () => {
  const req = { body: { password: 'Pass12' } };
  const res = createMockRes();
  const next = createMockNext();
  
  validatePassword(req, res, next);
  assert(res.statusCode === 400, 'Status should be 400');
  assert(res.jsonData.error === 'Password must be at least 8 characters long', 'Error message mismatch');
});

test('validatePassword: should fail without uppercase letter', () => {
  const req = { body: { password: 'password123' } };
  const res = createMockRes();
  const next = createMockNext();
  
  validatePassword(req, res, next);
  assert(res.statusCode === 400, 'Status should be 400');
  assert(res.jsonData.error === 'Password must contain at least one uppercase letter', 'Error message mismatch');
});

test('validatePassword: should fail without lowercase letter', () => {
  const req = { body: { password: 'PASSWORD123' } };
  const res = createMockRes();
  const next = createMockNext();
  
  validatePassword(req, res, next);
  assert(res.statusCode === 400, 'Status should be 400');
  assert(res.jsonData.error === 'Password must contain at least one lowercase letter', 'Error message mismatch');
});

test('validatePassword: should fail without number', () => {
  const req = { body: { password: 'Password' } };
  const res = createMockRes();
  const next = createMockNext();
  
  validatePassword(req, res, next);
  assert(res.statusCode === 400, 'Status should be 400');
  assert(res.jsonData.error === 'Password must contain at least one number', 'Error message mismatch');
});

test('validatePassword: should pass with complex password', () => {
  const req = { body: { password: 'MyP@ssw0rd123' } };
  const res = createMockRes();
  const next = createMockNext();
  
  validatePassword(req, res, next);
  assert(next.wasCalled(), 'next() should be called');
});

// ============================================================================
// Test validateVehicleNumber
// ============================================================================
console.log('\n🚗 Testing validateVehicleNumber...\n');

test('validateVehicleNumber: should pass with valid vehicle number', () => {
  const req = { body: { vehicle_number: 'KA01AB1234' } };
  const res = createMockRes();
  const next = createMockNext();
  
  validateVehicleNumber(req, res, next);
  assert(next.wasCalled(), 'next() should be called');
});

test('validateVehicleNumber: should fail when vehicle number is missing', () => {
  const req = { body: {} };
  const res = createMockRes();
  const next = createMockNext();
  
  validateVehicleNumber(req, res, next);
  assert(res.statusCode === 400, 'Status should be 400');
  assert(res.jsonData.error === 'Vehicle number is required', 'Error message mismatch');
});

test('validateVehicleNumber: should fail with less than 6 characters', () => {
  const req = { body: { vehicle_number: 'KA01' } };
  const res = createMockRes();
  const next = createMockNext();
  
  validateVehicleNumber(req, res, next);
  assert(res.statusCode === 400, 'Status should be 400');
});

test('validateVehicleNumber: should fail with more than 10 characters', () => {
  const req = { body: { vehicle_number: 'KA01AB12345' } };
  const res = createMockRes();
  const next = createMockNext();
  
  validateVehicleNumber(req, res, next);
  assert(res.statusCode === 400, 'Status should be 400');
});

test('validateVehicleNumber: should work with vehicleNumber field (camelCase)', () => {
  const req = { body: { vehicleNumber: 'DL1CAB1234' } };
  const res = createMockRes();
  const next = createMockNext();
  
  validateVehicleNumber(req, res, next);
  assert(next.wasCalled(), 'next() should be called');
});

test('validateVehicleNumber: should pass with lowercase input', () => {
  const req = { body: { vehicle_number: 'mh12a1234' } };
  const res = createMockRes();
  const next = createMockNext();
  
  validateVehicleNumber(req, res, next);
  assert(next.wasCalled(), 'next() should be called');
});

// ============================================================================
// Test validateBookingTime
// ============================================================================
console.log('\n⏰ Testing validateBookingTime...\n');

test('validateBookingTime: should pass with valid future times', () => {
  const now = new Date();
  const start = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours from now
  const end = new Date(start.getTime() + 3 * 60 * 60 * 1000); // 3 hours after start
  
  const req = { body: { booking_start_time: start.toISOString(), booking_end_time: end.toISOString() } };
  const res = createMockRes();
  const next = createMockNext();
  
  validateBookingTime(req, res, next);
  assert(next.wasCalled(), 'next() should be called');
  assert(req.bookingDuration === 3, 'Duration should be 3 hours');
});

test('validateBookingTime: should fail when start time is missing', () => {
  const req = { body: { booking_end_time: new Date().toISOString() } };
  const res = createMockRes();
  const next = createMockNext();
  
  validateBookingTime(req, res, next);
  assert(res.statusCode === 400, 'Status should be 400');
  assert(res.jsonData.error === 'Booking start time is required', 'Error message mismatch');
});

test('validateBookingTime: should fail when end time is missing', () => {
  const req = { body: { booking_start_time: new Date().toISOString() } };
  const res = createMockRes();
  const next = createMockNext();
  
  validateBookingTime(req, res, next);
  assert(res.statusCode === 400, 'Status should be 400');
  assert(res.jsonData.error === 'Booking end time is required', 'Error message mismatch');
});

test('validateBookingTime: should fail when start time is in the past', () => {
  const past = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
  const future = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
  
  const req = { body: { booking_start_time: past.toISOString(), booking_end_time: future.toISOString() } };
  const res = createMockRes();
  const next = createMockNext();
  
  validateBookingTime(req, res, next);
  assert(res.statusCode === 400, 'Status should be 400');
  assert(res.jsonData.error === 'Booking start time must be in the future', 'Error message mismatch');
});

test('validateBookingTime: should fail when end time is before start time', () => {
  const now = new Date();
  const start = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const end = new Date(now.getTime() + 1 * 60 * 60 * 1000);
  
  const req = { body: { booking_start_time: start.toISOString(), booking_end_time: end.toISOString() } };
  const res = createMockRes();
  const next = createMockNext();
  
  validateBookingTime(req, res, next);
  assert(res.statusCode === 400, 'Status should be 400');
  assert(res.jsonData.error === 'Booking end time must be after start time', 'Error message mismatch');
});

test('validateBookingTime: should fail with less than 1 hour duration', () => {
  const now = new Date();
  const start = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const end = new Date(start.getTime() + 30 * 60 * 1000); // 30 minutes
  
  const req = { body: { booking_start_time: start.toISOString(), booking_end_time: end.toISOString() } };
  const res = createMockRes();
  const next = createMockNext();
  
  validateBookingTime(req, res, next);
  assert(res.statusCode === 400, 'Status should be 400');
  assert(res.jsonData.error === 'Booking duration must be at least 1 hour', 'Error message mismatch');
});

test('validateBookingTime: should fail with more than 24 hours duration', () => {
  const now = new Date();
  const start = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const end = new Date(start.getTime() + 25 * 60 * 60 * 1000); // 25 hours
  
  const req = { body: { booking_start_time: start.toISOString(), booking_end_time: end.toISOString() } };
  const res = createMockRes();
  const next = createMockNext();
  
  validateBookingTime(req, res, next);
  assert(res.statusCode === 400, 'Status should be 400');
  assert(res.jsonData.error === 'Booking duration cannot exceed 24 hours', 'Error message mismatch');
});

test('validateBookingTime: should work with startTime/endTime fields (camelCase)', () => {
  const now = new Date();
  const start = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const end = new Date(start.getTime() + 3 * 60 * 60 * 1000);
  
  const req = { body: { startTime: start.toISOString(), endTime: end.toISOString() } };
  const res = createMockRes();
  const next = createMockNext();
  
  validateBookingTime(req, res, next);
  assert(next.wasCalled(), 'next() should be called');
});

// ============================================================================
// Test Summary
// ============================================================================
console.log('\n' + '='.repeat(70));
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
