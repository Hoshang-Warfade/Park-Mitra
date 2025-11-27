/**
 * Test Suite for Error Handling Middleware
 * Tests all error types and scenarios
 */

const errorHandler = require('./errorHandler');
const {
  notFound,
  asyncHandler,
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  DatabaseError
} = require('./errorHandler');

// Save original NODE_ENV
const originalEnv = process.env.NODE_ENV;

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
  let error = null;
  const next = (err) => { 
    called = true; 
    error = err;
  };
  next.wasCalled = () => called;
  next.getError = () => error;
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
console.log('Testing Error Handling Middleware');
console.log('='.repeat(70) + '\n');

// ============================================================================
// Test JWT Errors -> 401
// ============================================================================
console.log('🔐 Testing JWT Errors (401)...\n');

test('JWT Error: JsonWebTokenError should return 401', () => {
  const err = new Error('jwt malformed');
  err.name = 'JsonWebTokenError';
  
  const req = { method: 'GET', originalUrl: '/test', body: {} };
  const res = createMockRes();
  const next = () => {};
  
  // Set to production to avoid verbose logging
  process.env.NODE_ENV = 'production';
  errorHandler(err, req, res, next);
  
  assert(res.statusCode === 401, 'Status should be 401');
  assert(res.jsonData.success === false, 'Success should be false');
  assert(res.jsonData.error === 'Invalid token. Authentication failed', 'Error message mismatch');
});

test('JWT Error: TokenExpiredError should return 401', () => {
  const err = new Error('jwt expired');
  err.name = 'TokenExpiredError';
  
  const req = { method: 'GET', originalUrl: '/test', body: {} };
  const res = createMockRes();
  const next = () => {};
  
  process.env.NODE_ENV = 'production';
  errorHandler(err, req, res, next);
  
  assert(res.statusCode === 401, 'Status should be 401');
  assert(res.jsonData.error === 'Token expired. Please login again', 'Error message mismatch');
});

test('JWT Error: UnauthorizedError should return 401', () => {
  const err = new Error('Unauthorized');
  err.name = 'UnauthorizedError';
  
  const req = { method: 'GET', originalUrl: '/test', body: {} };
  const res = createMockRes();
  const next = () => {};
  
  process.env.NODE_ENV = 'production';
  errorHandler(err, req, res, next);
  
  assert(res.statusCode === 401, 'Status should be 401');
  assert(res.jsonData.error === 'Unauthorized access', 'Error message mismatch');
});

// ============================================================================
// Test Validation Errors -> 400
// ============================================================================
console.log('\n📝 Testing Validation Errors (400)...\n');

test('Validation Error: ValidationError should return 400', () => {
  const err = new Error('Validation failed');
  err.name = 'ValidationError';
  
  const req = { method: 'POST', originalUrl: '/test', body: {} };
  const res = createMockRes();
  const next = () => {};
  
  process.env.NODE_ENV = 'production';
  errorHandler(err, req, res, next);
  
  assert(res.statusCode === 400, 'Status should be 400');
  assert(res.jsonData.error === 'Validation failed', 'Error message mismatch');
});

test('Validation Error: CastError should return 400', () => {
  const err = new Error('Cast error');
  err.name = 'CastError';
  err.path = 'id';
  err.value = 'invalid';
  
  const req = { method: 'GET', originalUrl: '/test', body: {} };
  const res = createMockRes();
  const next = () => {};
  
  process.env.NODE_ENV = 'production';
  errorHandler(err, req, res, next);
  
  assert(res.statusCode === 400, 'Status should be 400');
  assert(res.jsonData.error.includes('Invalid'), 'Error should mention invalid');
});

test('Validation Error: Invalid JSON should return 400', () => {
  const err = new Error('Invalid JSON');
  err.type = 'entity.parse.failed';
  
  const req = { method: 'POST', originalUrl: '/test', body: {} };
  const res = createMockRes();
  const next = () => {};
  
  process.env.NODE_ENV = 'production';
  errorHandler(err, req, res, next);
  
  assert(res.statusCode === 400, 'Status should be 400');
  assert(res.jsonData.error === 'Invalid JSON format', 'Error message mismatch');
});

// ============================================================================
// Test Database Errors -> 500
// ============================================================================
console.log('\n💾 Testing Database Errors (500/503/409)...\n');

test('Database Error: SQLITE_ERROR should return 500', () => {
  const err = new Error('Database error');
  err.code = 'SQLITE_ERROR';
  
  const req = { method: 'GET', originalUrl: '/test', body: {} };
  const res = createMockRes();
  const next = () => {};
  
  process.env.NODE_ENV = 'production';
  errorHandler(err, req, res, next);
  
  assert(res.statusCode === 500, 'Status should be 500');
  assert(res.jsonData.error === 'Database error occurred', 'Error message mismatch');
});

test('Database Error: SQLITE_CONSTRAINT should return 409', () => {
  const err = new Error('Constraint violation');
  err.code = 'SQLITE_CONSTRAINT';
  
  const req = { method: 'POST', originalUrl: '/test', body: {} };
  const res = createMockRes();
  const next = () => {};
  
  process.env.NODE_ENV = 'production';
  errorHandler(err, req, res, next);
  
  assert(res.statusCode === 409, 'Status should be 409');
  assert(res.jsonData.error.includes('constraint'), 'Error should mention constraint');
});

test('Database Error: SQLITE_CONSTRAINT_UNIQUE should return 409', () => {
  const err = new Error('Unique constraint');
  err.code = 'SQLITE_CONSTRAINT_UNIQUE';
  
  const req = { method: 'POST', originalUrl: '/test', body: {} };
  const res = createMockRes();
  const next = () => {};
  
  process.env.NODE_ENV = 'production';
  errorHandler(err, req, res, next);
  
  assert(res.statusCode === 409, 'Status should be 409');
  assert(res.jsonData.error.includes('Duplicate'), 'Error should mention duplicate');
});

test('Database Error: SQLITE_BUSY should return 503', () => {
  const err = new Error('Database busy');
  err.code = 'SQLITE_BUSY';
  
  const req = { method: 'GET', originalUrl: '/test', body: {} };
  const res = createMockRes();
  const next = () => {};
  
  process.env.NODE_ENV = 'production';
  errorHandler(err, req, res, next);
  
  assert(res.statusCode === 503, 'Status should be 503');
  assert(res.jsonData.error.includes('busy'), 'Error should mention busy');
});

// ============================================================================
// Test Not Found Errors -> 404
// ============================================================================
console.log('\n🔍 Testing Not Found Errors (404)...\n');

test('Not Found: NotFoundError should return 404', () => {
  const err = new Error('Resource not found');
  err.name = 'NotFoundError';
  
  const req = { method: 'GET', originalUrl: '/test', body: {} };
  const res = createMockRes();
  const next = () => {};
  
  process.env.NODE_ENV = 'production';
  errorHandler(err, req, res, next);
  
  assert(res.statusCode === 404, 'Status should be 404');
  assert(res.jsonData.error === 'Resource not found', 'Error message mismatch');
});

test('Not Found: statusCode 404 should return 404', () => {
  const err = new Error('Not found');
  err.statusCode = 404;
  
  const req = { method: 'GET', originalUrl: '/test', body: {} };
  const res = createMockRes();
  const next = () => {};
  
  process.env.NODE_ENV = 'production';
  errorHandler(err, req, res, next);
  
  assert(res.statusCode === 404, 'Status should be 404');
});

// ============================================================================
// Test Custom Error Classes
// ============================================================================
console.log('\n🎯 Testing Custom Error Classes...\n');

test('Custom Error: BadRequestError should return 400', () => {
  const err = new BadRequestError('Invalid input');
  
  const req = { method: 'POST', originalUrl: '/test', body: {} };
  const res = createMockRes();
  const next = () => {};
  
  process.env.NODE_ENV = 'production';
  errorHandler(err, req, res, next);
  
  assert(res.statusCode === 400, 'Status should be 400');
  assert(res.jsonData.error === 'Invalid input', 'Error message mismatch');
});

test('Custom Error: UnauthorizedError should return 401', () => {
  const err = new UnauthorizedError('Login required');
  
  const req = { method: 'GET', originalUrl: '/test', body: {} };
  const res = createMockRes();
  const next = () => {};
  
  process.env.NODE_ENV = 'production';
  errorHandler(err, req, res, next);
  
  assert(res.statusCode === 401, 'Status should be 401');
});

test('Custom Error: ForbiddenError should return 403', () => {
  const err = new ForbiddenError('Access denied');
  
  const req = { method: 'GET', originalUrl: '/test', body: {} };
  const res = createMockRes();
  const next = () => {};
  
  process.env.NODE_ENV = 'production';
  errorHandler(err, req, res, next);
  
  assert(res.statusCode === 403, 'Status should be 403');
});

test('Custom Error: NotFoundError should return 404', () => {
  const err = new NotFoundError('User not found');
  
  const req = { method: 'GET', originalUrl: '/test', body: {} };
  const res = createMockRes();
  const next = () => {};
  
  process.env.NODE_ENV = 'production';
  errorHandler(err, req, res, next);
  
  assert(res.statusCode === 404, 'Status should be 404');
});

test('Custom Error: ConflictError should return 409', () => {
  const err = new ConflictError('Email already exists');
  
  const req = { method: 'POST', originalUrl: '/test', body: {} };
  const res = createMockRes();
  const next = () => {};
  
  process.env.NODE_ENV = 'production';
  errorHandler(err, req, res, next);
  
  assert(res.statusCode === 409, 'Status should be 409');
});

// ============================================================================
// Test Default Behavior
// ============================================================================
console.log('\n⚙️  Testing Default Behavior...\n');

test('Default: Should return 500 for unknown error', () => {
  const err = new Error('Unknown error');
  
  const req = { method: 'GET', originalUrl: '/test', body: {} };
  const res = createMockRes();
  const next = () => {};
  
  process.env.NODE_ENV = 'production';
  errorHandler(err, req, res, next);
  
  assert(res.statusCode === 500, 'Status should be 500');
  assert(res.jsonData.success === false, 'Success should be false');
});

test('Default: Should not include stack in production', () => {
  const err = new Error('Test error');
  
  const req = { method: 'GET', originalUrl: '/test', body: {} };
  const res = createMockRes();
  const next = () => {};
  
  process.env.NODE_ENV = 'production';
  errorHandler(err, req, res, next);
  
  assert(!res.jsonData.stack, 'Stack should not be included in production');
});

test('Default: Should include stack in development', () => {
  const err = new Error('Test error');
  
  const req = { method: 'GET', originalUrl: '/test', body: {} };
  const res = createMockRes();
  const next = () => {};
  
  process.env.NODE_ENV = 'development';
  errorHandler(err, req, res, next);
  
  assert(res.jsonData.stack, 'Stack should be included in development');
  assert(res.jsonData.details, 'Details should be included in development');
});

// ============================================================================
// Test notFound Middleware
// ============================================================================
console.log('\n🚫 Testing notFound Middleware...\n');

test('notFound: Should create 404 error', () => {
  const req = { method: 'GET', originalUrl: '/nonexistent' };
  const res = createMockRes();
  const next = createMockNext();
  
  notFound(req, res, next);
  
  assert(next.wasCalled(), 'next() should be called');
  const error = next.getError();
  assert(error.statusCode === 404, 'Error statusCode should be 404');
  assert(error.name === 'NotFoundError', 'Error name should be NotFoundError');
});

// ============================================================================
// Test asyncHandler
// ============================================================================
console.log('\n🔄 Testing asyncHandler...\n');

test('asyncHandler: Should catch async errors', async () => {
  const asyncFunction = async (req, res) => {
    throw new Error('Async error');
  };
  
  const wrappedFunction = asyncHandler(asyncFunction);
  
  const req = {};
  const res = {};
  const next = createMockNext();
  
  await wrappedFunction(req, res, next);
  
  assert(next.wasCalled(), 'next() should be called with error');
  const error = next.getError();
  assert(error.message === 'Async error', 'Error message should match');
});

test('asyncHandler: Should not catch sync errors', () => {
  const syncFunction = (req, res) => {
    throw new Error('Sync error');
  };
  
  const wrappedFunction = asyncHandler(syncFunction);
  
  const req = {};
  const res = {};
  const next = createMockNext();
  
  try {
    wrappedFunction(req, res, next);
  } catch (err) {
    assert(err.message === 'Sync error', 'Should throw sync error');
  }
});

// ============================================================================
// Restore environment
// ============================================================================
process.env.NODE_ENV = originalEnv;

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
