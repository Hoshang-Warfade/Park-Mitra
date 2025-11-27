/**
 * Test Suite for Authentication Middleware
 * Tests all JWT authentication functions
 */

const jwt = require('jsonwebtoken');
const { jwtConfig } = require('../config/auth.config');
const {
  verifyToken,
  checkUserType,
  checkOrgAdmin,
  checkWatchman
} = require('./auth');

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
  return fn()
    .then(() => {
      passedTests++;
      console.log(`✓ ${name}`);
    })
    .catch((error) => {
      console.log(`✗ ${name}`);
      console.error(`  Error: ${error.message}`);
    });
};

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
};

console.log('\n' + '='.repeat(70));
console.log('Testing Authentication Middleware');
console.log('='.repeat(70) + '\n');

// ============================================================================
// Test verifyToken
// ============================================================================
console.log('🔐 Testing verifyToken...\n');

const generateTestToken = (payload) => {
  return jwt.sign(
    payload,
    jwtConfig.secret,
    {
      expiresIn: jwtConfig.expiresIn,
      algorithm: jwtConfig.algorithm,
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience
    }
  );
};

(async () => {
  await test('verifyToken: should pass with valid Bearer token', async () => {
    const token = generateTestToken({
      id: 1,
      email: 'test@example.com',
      user_type: 'visitor'
    });

    const req = {
      headers: {
        authorization: `Bearer ${token}`
      }
    };
    const res = createMockRes();
    const next = createMockNext();

    verifyToken(req, res, next);
    assert(next.wasCalled(), 'next() should be called');
    assert(req.user.id === 1, 'User ID should be set');
    assert(req.user.email === 'test@example.com', 'Email should be set');
    assert(req.user.user_type === 'visitor', 'User type should be set');
  });

  await test('verifyToken: should fail when no token provided', async () => {
    const req = { headers: {} };
    const res = createMockRes();
    const next = createMockNext();

    verifyToken(req, res, next);
    assert(res.statusCode === 401, 'Status should be 401');
    assert(res.jsonData.error === 'Access denied. No token provided', 'Error message mismatch');
  });

  await test('verifyToken: should fail with invalid token', async () => {
    const req = {
      headers: {
        authorization: 'Bearer invalid_token_here'
      }
    };
    const res = createMockRes();
    const next = createMockNext();

    verifyToken(req, res, next);
    assert(res.statusCode === 401, 'Status should be 401');
    assert(res.jsonData.error.includes('Invalid token'), 'Should return invalid token error');
  });

  await test('verifyToken: should fail with expired token', async () => {
    const expiredToken = jwt.sign(
      { id: 1, email: 'test@example.com', user_type: 'visitor' },
      jwtConfig.secret,
      { expiresIn: '-1s', algorithm: jwtConfig.algorithm, issuer: jwtConfig.issuer, audience: jwtConfig.audience }
    );

    const req = {
      headers: {
        authorization: `Bearer ${expiredToken}`
      }
    };
    const res = createMockRes();
    const next = createMockNext();

    verifyToken(req, res, next);
    assert(res.statusCode === 401, 'Status should be 401');
    assert(res.jsonData.error === 'Token expired. Please login again', 'Error message mismatch');
  });

  await test('verifyToken: should extract token without Bearer prefix', async () => {
    const token = generateTestToken({
      id: 2,
      email: 'user@example.com',
      user_type: 'organization_member'
    });

    const req = {
      headers: {
        authorization: token // Without Bearer prefix
      }
    };
    const res = createMockRes();
    const next = createMockNext();

    verifyToken(req, res, next);
    assert(next.wasCalled(), 'next() should be called');
    assert(req.user.id === 2, 'User ID should be set');
  });

  await test('verifyToken: should handle user_id field correctly', async () => {
    const token = generateTestToken({
      user_id: 3,
      email: 'member@example.com',
      user_type: 'organization_member',
      organization_id: 1,
      employee_id: 'EMP001'
    });

    const req = {
      headers: {
        authorization: `Bearer ${token}`
      }
    };
    const res = createMockRes();
    const next = createMockNext();

    verifyToken(req, res, next);
    assert(next.wasCalled(), 'next() should be called');
    assert(req.user.user_id === 3, 'User ID should be set');
    assert(req.user.organization_id === 1, 'Organization ID should be set');
    assert(req.user.employee_id === 'EMP001', 'Employee ID should be set');
  });

  // ============================================================================
  // Test checkUserType
  // ============================================================================
  console.log('\n👥 Testing checkUserType...\n');

  await test('checkUserType: should pass with allowed user type', async () => {
    const middleware = checkUserType(['organization_member', 'visitor']);
    const req = {
      user: {
        id: 1,
        email: 'visitor@example.com',
        user_type: 'visitor'
      }
    };
    const res = createMockRes();
    const next = createMockNext();

    middleware(req, res, next);
    assert(next.wasCalled(), 'next() should be called');
  });

  await test('checkUserType: should fail with forbidden user type', async () => {
    const middleware = checkUserType(['organization_member']);
    const req = {
      user: {
        id: 1,
        email: 'visitor@example.com',
        user_type: 'visitor'
      }
    };
    const res = createMockRes();
    const next = createMockNext();

    middleware(req, res, next);
    assert(res.statusCode === 403, 'Status should be 403');
    assert(res.jsonData.error === 'Access forbidden for your user type', 'Error message mismatch');
  });

  await test('checkUserType: should fail when req.user is missing', async () => {
    const middleware = checkUserType(['visitor']);
    const req = {};
    const res = createMockRes();
    const next = createMockNext();

    middleware(req, res, next);
    assert(res.statusCode === 401, 'Status should be 401');
    assert(res.jsonData.error === 'Authentication required', 'Error message mismatch');
  });

  await test('checkUserType: should allow organization_member', async () => {
    const middleware = checkUserType(['organization_member', 'visitor', 'walk_in']);
    const req = {
      user: {
        id: 1,
        email: 'member@example.com',
        user_type: 'organization_member'
      }
    };
    const res = createMockRes();
    const next = createMockNext();

    middleware(req, res, next);
    assert(next.wasCalled(), 'next() should be called');
  });

  await test('checkUserType: should allow walk_in', async () => {
    const middleware = checkUserType(['walk_in']);
    const req = {
      user: {
        id: 1,
        email: 'walkin@example.com',
        user_type: 'walk_in'
      }
    };
    const res = createMockRes();
    const next = createMockNext();

    middleware(req, res, next);
    assert(next.wasCalled(), 'next() should be called');
  });

  await test('checkUserType: should work with single user type', async () => {
    const middleware = checkUserType(['visitor']);
    const req = {
      user: {
        id: 1,
        email: 'visitor@example.com',
        user_type: 'visitor'
      }
    };
    const res = createMockRes();
    const next = createMockNext();

    middleware(req, res, next);
    assert(next.wasCalled(), 'next() should be called');
  });

  // ============================================================================
  // Test checkOrgAdmin
  // ============================================================================
  console.log('\n🏢 Testing checkOrgAdmin...\n');

  console.log('Note: checkOrgAdmin requires database access.');
  console.log('Skipping database-dependent tests in this suite.');
  console.log('Run integration tests to verify checkOrgAdmin functionality.\n');

  await test('checkOrgAdmin: should fail when req.user is missing', async () => {
    const req = {
      body: { organization_id: 1 }
    };
    const res = createMockRes();
    const next = createMockNext();

    await checkOrgAdmin(req, res, next);
    assert(res.statusCode === 401, 'Status should be 401');
    assert(res.jsonData.error === 'Authentication required', 'Error message mismatch');
  });

  await test('checkOrgAdmin: should fail when organization_id is missing', async () => {
    const req = {
      user: {
        id: 1,
        email: 'admin@example.com',
        user_type: 'organization_member'
      },
      body: {},
      params: {},
      query: {}
    };
    const res = createMockRes();
    const next = createMockNext();

    await checkOrgAdmin(req, res, next);
    assert(res.statusCode === 400, 'Status should be 400');
    assert(res.jsonData.error === 'Organization ID is required', 'Error message mismatch');
  });

  // ============================================================================
  // Test checkWatchman
  // ============================================================================
  console.log('\n👮 Testing checkWatchman...\n');

  console.log('Note: checkWatchman requires database access.');
  console.log('Skipping database-dependent tests in this suite.');
  console.log('Run integration tests to verify checkWatchman functionality.\n');

  await test('checkWatchman: should fail when req.user is missing', async () => {
    const req = {};
    const res = createMockRes();
    const next = createMockNext();

    await checkWatchman(req, res, next);
    assert(res.statusCode === 401, 'Status should be 401');
    assert(res.jsonData.error === 'Authentication required', 'Error message mismatch');
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
})();
