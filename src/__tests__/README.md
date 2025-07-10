# FortifyJS Test Suite

This directory contains comprehensive tests for the FortifyJS library, organized into dedicated test files for better maintainability and reference.

## Test Files

### 1. `server-creation.test.ts`
Tests basic server creation and core functionality:
- ✅ Server instance creation
- ✅ Immediate middleware API availability
- ✅ Basic route handling (GET, POST)
- ✅ Middleware registration and execution
- ✅ Method chaining support

### 2. `rate-limiting.test.ts`
Tests rate limiting functionality:
- ✅ Basic rate limiting with custom limits
- ✅ Rate limit window reset behavior
- ✅ Disabled rate limiting
- ✅ Per-IP rate limiting (different buckets)

### 3. `cors.test.ts`
Tests Cross-Origin Resource Sharing (CORS):
- ✅ Basic CORS configuration
- ✅ Origin filtering (allow/deny)
- ✅ Method and header restrictions
- ✅ Disabled CORS behavior
- ✅ Preflight request handling

### 4. `security.test.ts`
Tests security middleware functionality:
- ✅ Basic security headers (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection)
- ✅ Security configuration through middleware API
- ✅ Disabled security behavior
- ✅ Security headers persistence across routes
- ✅ Security combined with other middleware

### 5. `integration.test.ts`
Tests multiple features working together:
- ✅ Full stack API with all middleware enabled
- ✅ Rate limiting combined with CORS
- ✅ Error handling with middleware
- ✅ Performance with multiple middleware layers

### 6. `run-all-tests.ts`
Main test runner that executes all test suites:
- 🏃 Runs all tests sequentially
- 📊 Provides comprehensive test report
- ⏱️ Measures execution time
- 📈 Calculates success rate

## Running Tests

### Run Individual Test Files

```bash
# Server creation tests
npx tsx src/__tests__/server-creation.test.ts

# Rate limiting tests
npx tsx src/__tests__/rate-limiting.test.ts

# CORS tests
npx tsx src/__tests__/cors.test.ts

# Security tests
npx tsx src/__tests__/security.test.ts

# Integration tests
npx tsx src/__tests__/integration.test.ts
```

### Run All Tests

```bash
# Run complete test suite
npx tsx src/__tests__/run-all-tests.ts
```

## Test Architecture

### Simple and Direct
- ❌ No external testing frameworks (Jest, Mocha, etc.)
- ✅ Direct HTTP requests using native `fetch`
- ✅ Simple assertion functions
- ✅ Clear, readable test code

### Real Server Testing
- ✅ Tests actual HTTP servers on different ports
- ✅ Real network requests (not mocked)
- ✅ Tests the complete request/response cycle
- ✅ Validates actual middleware behavior

### Comprehensive Coverage
- 🔧 **Server Creation**: Core functionality
- 🚦 **Rate Limiting**: Request throttling
- 🌐 **CORS**: Cross-origin security
- 🔒 **Security**: Security headers
- 🔗 **Integration**: Combined features

## Test Utilities

Each test file includes common utilities:

```typescript
// Simple assertion function
function assert(condition: boolean, message: string)

// HTTP request helper
async function makeRequest(url: string, options?: any)

// Sleep utility for timing tests
async function sleep(ms: number)
```

## Test Ports

Tests use different ports to avoid conflicts:
- `8090-8092`: Rate limiting tests
- `8093-8096`: CORS tests
- `8097-8098`: Server creation tests
- `8099-8103`: Security tests
- `8104-8107`: Integration tests

## Expected Output

### Successful Test Run
```
🧪 Starting FortifyJS Rate Limiting Tests...

🔬 Test 1: Basic Rate Limiting
✅ First request should succeed
✅ Second request should succeed
✅ Third request should succeed
✅ Fourth request should be rate limited (429)

🎉 All Rate Limiting Tests Passed!
```

### Test Suite Summary
```
📊 TEST SUITE SUMMARY
==================================================
Total Tests: 5
✅ Passed: 5
❌ Failed: 0
⏱️  Total Duration: 12543ms
📈 Success Rate: 100%

🎉 ALL TESTS PASSED! FortifyJS is working correctly!
```

## Adding New Tests

To add new test functionality:

1. **Create a new test file** following the naming pattern: `feature-name.test.ts`
2. **Use the same test utilities** for consistency
3. **Add the file to `run-all-tests.ts`** in the `testFiles` array
4. **Use unique port numbers** to avoid conflicts
5. **Follow the same structure**: test functions + main runner

## Test Philosophy

These tests are designed to:
- ✅ **Stress test the actual library** (not replace it with mocks)
- ✅ **Detect and prevent bugs** in real usage scenarios
- ✅ **Validate all major functionalities** comprehensively
- ✅ **Provide clear feedback** on what's working/broken
- ✅ **Be maintainable and readable** for future development

The goal is to ensure FortifyJS works correctly in production environments by testing it as close to real-world usage as possible.
