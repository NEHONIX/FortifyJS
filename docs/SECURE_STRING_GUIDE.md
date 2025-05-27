# SecureString Guide

## Table of Contents

1. [Basic Usage](#basic-usage)
2. [Creating SecureStrings](#creating-securestrings)
3. [String Operations](#string-operations)
4. [Comparison and Search](#comparison-and-search)
5. [Cryptographic Operations](#cryptographic-operations)
6. [Validation and Analysis](#validation-and-analysis)
7. [Advanced Features](#advanced-features)
8. [Performance Monitoring](#performance-monitoring)
9. [Memory Management](#memory-management)
10. [Best Practices](#best-practices)

## Basic Usage

### Import and Create

```typescript
import { SecureString, createSecureString } from "fortify2-js";

// Basic creation
const password = createSecureString("my-secret-password");

// With alias
import { fString } from "fortify2-js";
const token = fString("jwt-token-here");
```

## Creating SecureStrings

### 1. Basic Constructor

```typescript
const str = new SecureString("Hello, World!");
console.log(str.toString()); // "Hello, World!"
```

### 2. With Protection Options

```typescript
// Basic protection
const basic = createSecureString("data", {
    protectionLevel: "basic",
    enableEncryption: false,
});

// Enhanced protection
const enhanced = createEnhancedSecureString("sensitive-data");
// Equivalent to:
const enhanced2 = createSecureString("sensitive-data", {
    protectionLevel: "enhanced",
    enableEncryption: true,
    enableCanaries: true,
    enableObfuscation: true,
});

// Maximum protection
const maximum = createMaximumSecureString("top-secret");
// Equivalent to:
const maximum2 = createSecureString("top-secret", {
    protectionLevel: "maximum",
    enableEncryption: true,
    enableFragmentation: true,
    enableCanaries: true,
    enableObfuscation: true,
    autoLock: true,
    quantumSafe: true,
});
```

### 3. From Buffer

```typescript
const buffer = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
const str = createSecureStringFromBuffer(buffer);
console.log(str.toString()); // "Hello"
```

### 4. Copy Constructor

```typescript
const original = createSecureString("original data");
const copy = SecureString.from(original);
// or
const copy2 = cloneSecureString(original);
```

## String Operations

### Basic Properties

```typescript
const str = createSecureString("Hello, World!");

console.log(str.length());      // 13
console.log(str.byteLength());  // 13 (UTF-8 bytes)
console.log(str.isEmpty());     // false
console.log(str.toString());    // "Hello, World!"
```

### String Manipulation

```typescript
const str = createSecureString("Hello");

// Append text
str.append(", World!");
console.log(str.toString()); // "Hello, World!"

// Prepend text
str.prepend("Say: ");
console.log(str.toString()); // "Say: Hello, World!"

// Replace content
str.replace("New content");
console.log(str.toString()); // "New content"

// Extract substring
const substr = str.substring(0, 3);
console.log(substr.toString()); // "New"

// Trim whitespace
const padded = createSecureString("  spaced  ");
padded.trim();
console.log(padded.toString()); // "spaced"
```

### Case Conversion

```typescript
const str = createSecureString("Hello World");

// Convert to uppercase
const upper = str.toUpperCase();
console.log(upper.toString()); // "HELLO WORLD"

// Convert to lowercase
const lower = str.toLowerCase();
console.log(lower.toString()); // "hello world"

// Original unchanged
console.log(str.toString()); // "Hello World"
```

### String Splitting

```typescript
const str = createSecureString("apple,banana,cherry");

// Basic split
const fruits = str.split(",");
fruits.forEach(fruit => {
    console.log(fruit.toString());
});
// "apple"
// "banana"
// "cherry"

// Split with options
const text = createSecureString("  word1  ,  word2  ,  word3  ");
const words = text.split(",", {
    limit: 2,
    removeEmpty: true,
    trim: true,
});
```

## Comparison and Search

### Secure Comparison

```typescript
const password1 = createSecureString("secret123");
const password2 = createSecureString("secret123");
const password3 = createSecureString("different");

// Constant-time comparison
console.log(password1.equals(password2, true));  // true
console.log(password1.equals(password3, true));  // false

// Detailed comparison
const result = password1.compare(password2, true);
console.log(result);
// { isEqual: true, timeTaken: 0.123, constantTime: true }
```

### String Search

```typescript
const text = createSecureString("Hello, World!");

// Check for substring
console.log(text.includes("World"));     // true
console.log(text.includes("world"));     // false

// Case-insensitive search
console.log(text.includes("world", { caseSensitive: false })); // true

// Check start/end
console.log(text.startsWith("Hello"));   // true
console.log(text.endsWith("World!"));    // true
```

### Utility Functions

```typescript
// Constant-time comparison
const isMatch = constantTimeCompare("password123", "password123"); // true

// String similarity
const similarity = calculateStringSimilarity("hello", "hallo"); // 0.8
```

## Cryptographic Operations

### Hashing

```typescript
const data = createSecureString("sensitive data");

// Basic hash
const hash = await data.hash("SHA-256", "hex");
console.log(hash); // "abc123def456..."

// Different formats
const sha512 = await data.hash("SHA-512", "base64");
```

### HMAC

```typescript
const message = createSecureString("important message");

// HMAC with string key
const hmac1 = await message.hmac({
    key: "secret-key",
    algorithm: "HMAC-SHA-256",
}, "hex");

// HMAC with SecureString key
const secretKey = createSecureString("my-secret-key");
const hmac2 = await message.hmac({
    key: secretKey,
    algorithm: "HMAC-SHA-512",
}, "base64");
```

### Key Derivation

```typescript
const password = createSecureString("user-password");

// PBKDF2 key derivation
const derivedKey = await password.deriveKeyPBKDF2({
    salt: "random-salt",
    iterations: 100000,
    keyLength: 32,
    hash: "SHA-256",
}, "hex");

console.log(derivedKey); // "derived-key-hex-string"
```

### Salt Generation

```typescript
// Generate random salt
const hexSalt = generateSalt(32, "hex");
const base64Salt = generateSalt(32, "base64");

// Using SecureString
const salt1 = SecureString.generateSalt(16, "hex");
```

## Validation and Analysis

### Password Validation

```typescript
const password = createSecureString("MyStr0ng!P@ssw0rd");

// Basic validation
const result = password.validatePassword();
console.log(result);
// { isValid: true, errors: [], warnings: [], score: 85.5 }

// Custom validation
const customResult = password.validatePassword({
    minLength: 12,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
});
```

### Email Validation

```typescript
const email = createSecureString("user@example.com");

const validation = email.validateEmail();
console.log(validation);
// { isValid: true, errors: [], warnings: [] }
```

### String Statistics

```typescript
const text = createSecureString("Hello, World! 123");

const stats = text.getStatistics();
console.log(stats);
// { length: 17, byteLength: 17, characterCount: { 'H': 1, ... }, ... }
```

## Advanced Features

### Entropy Analysis

```typescript
const password = createSecureString("MyComplexP@ssw0rd!");

const entropy = password.analyzeEntropy();
console.log(entropy);
// { shannonEntropy: 4.2, minEntropy: 3.8, maxEntropy: 5.0, ... }
```

### Pattern Analysis

```typescript
const weakPassword = createSecureString("password123qwerty");

const patterns = weakPassword.analyzePatterns();
console.log(patterns);
// { repeatingPatterns: [{ pattern: "ss", count: 2, ... }], ... }
```

### Quantum-Safe Operations

```typescript
const sensitiveData = createSecureString("top-secret-data");

// Quantum-safe hash
const quantumHash = await sensitiveData.createQuantumSafeHash({
    algorithm: "CRYSTALS-Dilithium",
    securityLevel: 256,
    useHybridMode: true,
    classicalFallback: "SHA-256",
}, "hex");

console.log(quantumHash);
// { hash: "quantum-safe-hash-string", algorithm: "CRYSTALS-Dilithium", ... }
```

## Performance Monitoring

### Basic Monitoring

```typescript
const str = createSecureString("performance-test-data");

// Start monitoring
str.startPerformanceMonitoring();

// Measure operations
await str.measureOperation(async () => {
    return await str.hash("SHA-256", "hex");
}, "hash_operation");

// Get statistics
const stats = str.getPerformanceStats();
console.log(stats);
// { totalOperations: 1, averageDuration: 15.5, ... }
```

### Benchmarking

```typescript
const str = createSecureString("benchmark-data");

const benchmark = await str.benchmarkOperation(
    async () => await str.hash("SHA-256", "hex"),
    "SHA-256 Hash",
    100
);

console.log(benchmark);
// { operation: "SHA-256 Hash", iterations: 100, totalTime: 1250.5, ... }
```

## Memory Management

### Memory Usage Tracking

```typescript
const str = createSecureString("memory-test", {
    protectionLevel: "enhanced",
    enableEncryption: true,
    enableFragmentation: true,
});

const usage = str.getMemoryUsage();
console.log(usage);
// { bufferSize: 24, actualLength: 11, overhead: 13, ... }
```

### Protection Levels

```typescript
// Basic protection
const basic = createSecureString("data", { protectionLevel: "basic" });

// Enhanced protection
const enhanced = createSecureString("data", {
    protectionLevel: "enhanced",
    enableEncryption: true,
    enableCanaries: true,
});

// Maximum protection
const maximum = createSecureString("data", {
    protectionLevel: "maximum",
    enableEncryption: true,
    enableFragmentation: true,
    enableCanaries: true,
    enableObfuscation: true,
    autoLock: true,
    quantumSafe: true,
});
```

### Memory Operations

```typescript
const str = createSecureString("sensitive-data");

// Clone
const cloned = str.clone();

// Wipe content
str.wipe();
console.log(str.toString()); // ""

// Destroy
str.destroy();
console.log(str.isDestroyed()); // true
```

## Best Practices

1. **Destroy Strings After Use**:
   ```typescript
   const password = createSecureString("secret");
   password.destroy();
   ```

2. **Select Appropriate Protection Levels**:
   ```typescript
   const username = createSecureString("john_doe");
   const password = createEnhancedSecureString("secret123");
   const apiKey = createMaximumSecureString("sk-1234567890");
   ```

3. **Use Constant-Time Operations**:
   ```typescript
   const userPassword = createSecureString("user-input");
   const storedPassword = createSecureString("stored-hash");
   const isValid = userPassword.equals(storedPassword, true);
   ```

4. **Implement Strong Key Derivation**:
   ```typescript
   const password = createSecureString("user-password");
   const key = await password.deriveKeyPBKDF2({
       salt: generateSalt(32, "uint8array"),
       iterations: 100000,
       keyLength: 32,
       hash: "SHA-256",
   }, "hex");
   ```

5. **Monitor Performance**:
   ```typescript
   const criticalString = createSecureString("critical-data");
   criticalString.startPerformanceMonitoring();
   const stats = criticalString.getPerformanceStats();
   ```