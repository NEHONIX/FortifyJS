# FortifyJS: fObject & fString Documentation

**Enterprise-grade secure data structures with automatic memory management, leak detection, and cryptographic protection.**

FortifyJS provides fObject and fString classes that offer significant advantages over standard JavaScript objects and strings, particularly in security-critical applications.

## Table of Contents

1. [Why FortifyJS vs Standard JavaScript](#why-fortifyjs-vs-standard-javascript)
2. [Automatic Memory Management](#automatic-memory-management)
3. [fObject Features](#fObject-features)
4. [fString Features](#fString-features)
5. [Security Advantages](#security-advantages)
6. [Performance Benefits](#performance-benefits)
7. [API Reference](#api-reference)
8. [Migration Guide](#migration-guide)

## Why FortifyJS vs Standard JavaScript

### Standard JavaScript Limitations

**Regular JavaScript Objects:**

```javascript
// Standard JavaScript - No security, no memory management
const user = {
    password: "secret123",
    apiKey: "sk-1234567890",
};

// Problems:
// ❌ Data remains in memory indefinitely
// ❌ No automatic cleanup
// ❌ Vulnerable to memory dumps
// ❌ No leak detection
// ❌ No encryption
// ❌ No secure wiping
```

**Regular JavaScript Strings:**

```javascript
// Standard JavaScript - Security vulnerabilities
let sensitiveData = "credit-card-number-1234-5678";

// Problems:
// ❌ String immutability creates multiple copies in memory
// ❌ No way to securely wipe from memory
// ❌ Vulnerable to memory analysis
// ❌ No automatic protection
// ❌ No fragmentation or encryption
```

### FortifyJS Advantages

**fObject - Enterprise Security:**

```typescript
import { fObject } "fortify2-js"

// FortifyJS - Automatic security and memory management
const user = fObject(
    {
        password: "secret123",
        apiKey: "sk-1234567890",
    },
    {
        enableMemoryTracking: true, // ✅ Automatic memory tracking
        autoCleanup: true, // ✅ Automatic cleanup
        enableEncryption: true, // ✅ Automatic encryption
    }
);

// Benefits:
// ✅ Automatic memory registration and tracking
// ✅ Proactive memory pressure handling
// ✅ Automatic leak detection with warnings
// ✅ Secure multi-pass buffer wiping
// ✅ Memory pool optimization
// ✅ Event-driven cleanup
// ✅ Zero developer effort required
```

**fString - Military-Grade Protection:**

```typescript
import { fString } "fortify2-js"

// FortifyJS - Maximum security for sensitive strings
const sensitiveData = fString("credit-card-number-1234-5678", {
    protectionLevel: "maximum", // ✅ Maximum security
    enableEncryption: true, // ✅ AES encryption
    enableFragmentation: true, // ✅ Memory fragmentation
    enableMemoryTracking: true, // ✅ Automatic tracking
});

// Benefits:
// ✅ Automatic secure memory allocation
// ✅ Multi-pass secure wiping (5 passes + random)
// ✅ Memory fragmentation prevents reconstruction
// ✅ Automatic encryption with key rotation
// ✅ Leak detection and prevention
// ✅ Pool-based memory reuse
```

## Automatic Memory Management

### Zero-Configuration Security

FortifyJS handles all memory management automatically, requiring zero effort from developers while providing enterprise-grade security.

**What Happens Automatically:**

```typescript
// Simple usage - everything is automatic
const secureObj = fObject({
    username: "admin",
    password: "secret123",
    sessionToken: "jwt-token-here",
});

// Behind the scenes (AUTOMATIC):
// ✅ Registered with advanced memory manager
// ✅ Memory pressure monitoring started
// ✅ Leak detection enabled
// ✅ Buffer pools created and optimized
// ✅ Secure wiping configured
// ✅ Event listeners attached for proactive management
```

### Memory Pressure Handling

**Automatic Response to Memory Pressure:**

```typescript
// When memory pressure exceeds 80%:
// ✅ Automatic cleanup of unused buffers
// ✅ Secure wiping before buffer release
// ✅ Pool optimization and resizing
// ✅ Proactive garbage collection
// ✅ Event emission for external handlers

// Developer sees:
console.log("Memory pressure handled automatically");

// No manual intervention required
```

### Leak Detection and Prevention

**Automatic Leak Detection:**

```typescript
// FortifyJS automatically detects potential leaks:
// ✅ Objects that haven't been accessed recently
// ✅ Objects with high reference counts
// ✅ Large objects that persist too long
// ✅ Suspicious memory patterns

// Automatic warnings:
// "Potential memory leak detected in fObject secure-object-1234"

// Automatic remediation:
// ✅ Cleanup recommendations
// ✅ Automatic garbage collection
// ✅ Pool optimization
```

### Memory Pool Optimization

**Automatic Buffer Pooling:**

```typescript
// FortifyJS automatically creates and manages memory pools:

// fObject Pool:
// - 1KB buffers for general use
// - LRU (Least Recently Used) strategy
// - Automatic secure wiping before reuse
// - Capacity: 50 buffers
// - Hit rate optimization

// fString Pool:
// - 256-byte buffers for string operations
// - Automatic fragmentation
// - Secure multi-pass wiping
// - Capacity: 30 buffers
// - Age-based cleanup
```

## fObject Features

### Enterprise-Grade Object Security

**Automatic Sensitive Key Detection:**

```typescript
const user = fObject({
    username: "admin",
    password: "secret123", // ✅ Automatically detected as sensitive
    apiKey: "sk-1234567890", // ✅ Automatically detected as sensitive
    email: "admin@company.com",
    sessionToken: "jwt-token", // ✅ Automatically detected as sensitive
});

// Automatic sensitive key management:
// ✅ Passwords, API keys, tokens automatically marked sensitive
// ✅ Automatic encryption for sensitive values
// ✅ Secure serialization with sensitive data protection
// ✅ Memory isolation for sensitive buffers
```

**Advanced Memory Statistics:**

```typescript
// Get comprehensive memory usage information
const memoryUsage = user.getMemoryUsage();

console.log({
    allocatedMemory: memoryUsage.formattedMemory, // "2.5 KB"
    bufferCount: memoryUsage.bufferCount, // 3
    age: memoryUsage.age, // 15000 (ms)
    poolHitRate: memoryUsage.poolStats?.hitRate, // 0.85 (85%)
});

// Automatic tracking:
// ✅ Memory allocation per object
// ✅ Buffer usage optimization
// ✅ Age-based cleanup recommendations
// ✅ Pool performance metrics
```

**Secure Data Operations:**

```typescript
// All standard operations with automatic security
user.set("newSecret", "confidential-data"); // ✅ Automatic secure storage
const value = user.get("password"); // ✅ Automatic decryption
user.delete("oldToken"); // ✅ Secure wiping

// Advanced operations with security
const filtered = user.filter((value, key) => !user.isSensitiveKey(key));
const publicData = user.omit("password", "apiKey");
const transformed = user.transform((value) => sanitize(value));

// ✅ All operations maintain security context
// ✅ Sensitive data remains encrypted
// ✅ Memory is automatically managed
```

**Event-Driven Security:**

```typescript
// Automatic security event handling
user.addEventListener("memoryPressure", (event) => {
    console.log("Automatic cleanup triggered");
});

user.addEventListener("gc", (event) => {
    console.log(`Freed ${event.freedMemory} bytes`);
});

// Events automatically fired:
// ✅ Memory pressure detection
// ✅ Garbage collection completion
// ✅ Leak detection warnings
// ✅ Security violations
```

## fString Features

### Military-Grade String Protection

**Automatic Memory Fragmentation:**

```typescript
const creditCard = fString("4532-1234-5678-9012", {
    protectionLevel: "maximum",
    enableFragmentation: true, // ✅ Automatic memory fragmentation
});

// Behind the scenes:
// ✅ String split across multiple memory locations
// ✅ Fragments encrypted with different keys
// ✅ Memory locations randomized
// ✅ Reconstruction requires all fragments
// ✅ Automatic defragmentation on access
```

**Multi-Pass Secure Wiping:**

```typescript
const password = fString("super-secret-password");

// When destroyed or cleaned up:
// ✅ Pass 1: Fill with 0x00 (zeros)
// ✅ Pass 2: Fill with 0xFF (ones)
// ✅ Pass 3: Fill with 0xAA (alternating pattern)
// ✅ Pass 4: Fill with 0x55 (inverse pattern)
// ✅ Pass 5: Fill with 0x00 (zeros again)
// ✅ Pass 6: Fill with cryptographic random data
// ✅ Pass 7: Final zero pass

password.destroy(); // ✅ Automatic secure wiping
```

**Advanced String Operations with Security:**

```typescript
const sensitiveText = fString("Confidential Document Content");

// All operations maintain security:
const upperCase = sensitiveText.toUpperCase(); // ✅ Secure transformation
const substring = sensitiveText.substring(0, 12); // ✅ Secure extraction
const replaced = sensitiveText.replace("Confidential", "Public");

// Security features:
// ✅ Intermediate results are also secure
// ✅ Original data remains protected
// ✅ Memory pools used for efficiency
// ✅ Automatic cleanup of temporary buffers
```

**Enhanced Memory Statistics:**

```typescript
const memoryInfo = sensitiveText.getEnhancedMemoryUsage();

console.log({
    size: memoryInfo.formattedSize, // "1.2 KB"
    isEncrypted: memoryInfo.isEncrypted, // true
    isFragmented: memoryInfo.isFragmented, // true
    age: memoryInfo.age, // 5000 (ms)
    poolHitRate: memoryInfo.poolStats?.hitRate, // 0.92 (92%)
});

// Automatic monitoring:
// ✅ Real-time memory usage tracking
// ✅ Encryption status monitoring
// ✅ Fragmentation effectiveness
// ✅ Pool performance optimization
```

## Security Advantages

### Comprehensive Protection Matrix

| Feature                  | Standard JS | FortifyJS  | Benefit                    |
| ------------------------ | ----------- | ---------- | -------------------------- |
| **Memory Management**    | Manual      | Automatic  | Zero developer effort      |
| **Leak Detection**       | None        | Automatic  | Proactive prevention       |
| **Secure Wiping**        | Impossible  | Multi-pass | Military-grade cleanup     |
| **Encryption**           | Manual      | Automatic  | Transparent protection     |
| **Memory Fragmentation** | None        | Automatic  | Prevents reconstruction    |
| **Pool Optimization**    | None        | Automatic  | Performance + Security     |
| **Pressure Handling**    | None        | Automatic  | Prevents memory exhaustion |
| **Event Monitoring**     | None        | Built-in   | Real-time security alerts  |

### Real-World Security Scenarios

**Scenario 1: Credit Card Processing**

```typescript
// Standard JavaScript - VULNERABLE
let cardNumber = "4532-1234-5678-9012";
// ❌ Remains in memory indefinitely
// ❌ Vulnerable to memory dumps
// ❌ No encryption
// ❌ Multiple copies due to string immutability

// FortifyJS - SECURE
const cardNumber = fString("4532-1234-5678-9012", {
    protectionLevel: "maximum",
});
// ✅ Automatic encryption
// ✅ Memory fragmentation
// ✅ Secure wiping on destroy
// ✅ Leak detection
// ✅ Pool-based efficiency
```

**Scenario 2: API Key Management**

```typescript
// Standard JavaScript - VULNERABLE
const config = {
    apiKey: "sk-1234567890abcdef",
    secret: "super-secret-value",
};
// ❌ Plain text in memory
// ❌ No automatic cleanup
// ❌ Vulnerable to inspection

// FortifyJS - SECURE
const config = fObject({
    apiKey: "sk-1234567890abcdef",
    secret: "super-secret-value",
});
// ✅ Automatic sensitive key detection
// ✅ Automatic encryption
// ✅ Memory pressure handling
// ✅ Automatic cleanup
```

## Performance Benefits

### Memory Efficiency Improvements

**Pool-Based Memory Management:**

```typescript
// Standard JavaScript - Inefficient
for (let i = 0; i < 1000; i++) {
    const temp = "temporary string " + i;
    // ❌ 1000 individual allocations
    // ❌ No reuse
    // ❌ Garbage collection pressure
}

// FortifyJS - Optimized
for (let i = 0; i < 1000; i++) {
    const temp = fString("temporary string " + i);
    // ✅ Pool-based allocation
    // ✅ Buffer reuse (90%+ hit rate)
    // ✅ Reduced GC pressure
    temp.destroy();
}
```

**Automatic Optimization:**

```typescript
// Performance metrics available
const metrics = memoryManager.getPerformanceMetrics();

console.log({
    memoryEfficiency: metrics.memoryEfficiency, // 0.95 (95%)
    poolHitRates: metrics.poolHitRates, // { "secure-buffer-pool": 0.92 }
    gcFrequency: metrics.gcFrequency, // 2.5 GCs/hour
    averageGCTime: metrics.averageGCTime, // 15.2ms
});

// Automatic optimizations:
// ✅ Pool size adjustment based on usage
// ✅ Strategy optimization (LIFO/FIFO/LRU)
// ✅ Pressure-based cleanup
// ✅ Age-based buffer retirement
```

## API Reference

### fObject Methods

**Core Operations:**

-   `set(key, value)` - Store value with automatic security
-   `get(key)` - Retrieve value with automatic decryption
-   `has(key)` - Check if key exists
-   `delete(key)` - Remove key with secure wiping
-   `clear()` - Clear all data with secure wiping
-   `destroy()` - Destroy object and clean up memory

**Memory Management:**

-   `getMemoryUsage()` - Get detailed memory statistics
-   `forceGarbageCollection()` - Trigger manual cleanup
-   `enableMemoryTracking()` - Enable memory tracking
-   `disableMemoryTracking()` - Disable memory tracking

**Security Operations:**

-   `addSensitiveKeys(...keys)` - Mark keys as sensitive
-   `isSensitiveKey(key)` - Check if key is sensitive
-   `setEncryptionKey(key)` - Set encryption key
-   `toObject({ encryptSensitive: true })` - Secure serialization

**Data Transformation:**

-   `transform(mapper)` - Transform all values
-   `filter(predicate)` - Filter entries
-   `pick(...keys)` - Select specific keys
-   `omit(...keys)` - Exclude specific keys
-   `compact()` - Remove falsy values

### fString Methods

**Core Operations:**

-   `toString()` - Get string value (secure)
-   `length()` - Get string length
-   `charAt(index)` - Get character at index
-   `substring(start, end)` - Extract substring
-   `indexOf(searchValue)` - Find substring index
-   `replace(search, replace)` - Replace text
-   `toUpperCase()` - Convert to uppercase
-   `toLowerCase()` - Convert to lowercase
-   `trim()` - Remove whitespace
-   `split(separator)` - Split into array
-   `destroy()` - Destroy string and wipe memory

**Memory Management:**

-   `getEnhancedMemoryUsage()` - Get detailed memory info
-   `forceGarbageCollection()` - Trigger cleanup
-   `enableMemoryTracking()` - Enable tracking
-   `disableMemoryTracking()` - Disable tracking

**Security Operations:**

-   `compare(other)` - Secure string comparison
-   `hash(algorithm)` - Generate secure hash
-   `encrypt()` - Encrypt string content
-   `decrypt()` - Decrypt string content

## Migration Guide

### From Standard JavaScript Objects

**Before (Standard JavaScript):**

```javascript
const user = {
    username: "admin",
    password: "secret123",
    apiKey: "sk-1234567890",
};

// Manual cleanup (impossible for sensitive data)
user.password = null;
user.apiKey = null;
```

**After (FortifyJS):**

```typescript
import { fObject } "fortify2-js"

const user = fObject({
    username: "admin",
    password: "secret123",
    apiKey: "sk-1234567890",
});

// Automatic cleanup
user.destroy(); // ✅ Secure wiping, memory cleanup, leak prevention
```

### From Standard JavaScript Strings

**Before (Standard JavaScript):**

```javascript
let password = "super-secret-password";
let creditCard = "4532-1234-5678-9012";

// No secure cleanup possible
password = null; // ❌ Original still in memory
creditCard = null; // ❌ Original still in memory
```

**After (FortifyJS):**

```typescript
import { fString } "fortify2-js"

const password = fString("super-secret-password", {
    protectionLevel: "maximum",
});
const creditCard = fString("4532-1234-5678-9012", {
    enableFragmentation: true,
});

// Secure cleanup
password.destroy(); // ✅ Multi-pass secure wiping
creditCard.destroy(); // ✅ Fragment cleanup
```

### Configuration Options

**fObject Options:**

```typescript
const options = {
    enableMemoryTracking: true, // Enable automatic memory management
    autoCleanup: true, // Enable automatic cleanup
    enableEncryption: true, // Enable automatic encryption
    maxMemory: 50 * 1024 * 1024, // 50MB memory limit
    gcThreshold: 0.8, // GC trigger at 80% memory usage
};
```

**fString Options:**

```typescript
const options = {
    protectionLevel: "maximum", // basic | enhanced | maximum
    enableEncryption: true, // Enable AES encryption
    enableFragmentation: true, // Enable memory fragmentation
    enableMemoryTracking: true, // Enable memory tracking
    autoLock: true, // Auto-lock when not in use
    quantumSafe: true, // Quantum-resistant protection
};
```

### Best Practices

1. **Always use fObject for sensitive data:**

    ```typescript
    // Good
    const credentials = fObject({ password, apiKey });

    // Avoid
    const credentials = { password, apiKey };
    ```

2. **Always use fString for sensitive strings:**

    ```typescript
    // Good
    const token = fString(jwtToken);

    // Avoid
    const token = jwtToken;
    ```

3. **Always call destroy() when done:**

    ```typescript
    try {
        const result = processSecureData(secureObj);
        return result;
    } finally {
        secureObj.destroy(); // ✅ Always cleanup
    }
    ```

4. **Use maximum protection for highly sensitive data:**
    ```typescript
    const creditCard = fString(cardNumber, {
        protectionLevel: "maximum",
        enableFragmentation: true,
        quantumSafe: true,
    });
    ```

---

**FortifyJS provides enterprise-grade security with zero configuration required. The automatic memory management, leak detection, and cryptographic protection ensure your sensitive data remains secure without any developer effort.**
