# SecureString Complete Guide

## 📖 Table of Contents
1. [Basic Usage](#basic-usage)
2. [Creating SecureStrings](#creating-securestrings)
3. [String Operations](#string-operations)
4. [Comparison & Search](#comparison--search)
5. [Cryptographic Operations](#cryptographic-operations)
6. [Validation & Analysis](#validation--analysis)
7. [Advanced Features](#advanced-features)
8. [Performance Monitoring](#performance-monitoring)
9. [Memory Management](#memory-management)
10. [Best Practices](#best-practices)

## Basic Usage

### Import and Create
```typescript
import { SecureString, createSecureString } from "fortify2-js";
// or
import { fString as String } from "fortify2-js";

// Basic creation
const password = String("my-secret-password");

// With factory function
const token = createSecureString("jwt-token-here");
```

## Creating SecureStrings

### 1. Basic Constructor
```typescript
const str = new SecureString("Hello, World!");
console.log(str.toString()); // "Hello, World!"
```

### 2. With Protection Options
```typescript
// Basic protection (default)
const basic = createSecureString("data", {
    protectionLevel: "basic",
    enableEncryption: false
});

// Enhanced protection
const enhanced = createEnhancedSecureString("sensitive-data");
// Equivalent to:
const enhanced2 = createSecureString("sensitive-data", {
    protectionLevel: "enhanced",
    enableEncryption: true,
    enableCanaries: true,
    enableObfuscation: true
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
    quantumSafe: true
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

// Replace entire content
str.replace("New content");
console.log(str.toString()); // "New content"

// Extract substring (returns new SecureString)
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

// Convert to uppercase (returns new SecureString)
const upper = str.toUpperCase();
console.log(upper.toString()); // "HELLO WORLD"

// Convert to lowercase (returns new SecureString)
const lower = str.toLowerCase();
console.log(lower.toString()); // "hello world"

// Original remains unchanged
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
    limit: 2,        // Only first 2 splits
    removeEmpty: true, // Remove empty strings
    trim: true       // Trim each part
});
```

## Comparison & Search

### Secure Comparison
```typescript
const password1 = createSecureString("secret123");
const password2 = createSecureString("secret123");
const password3 = createSecureString("different");

// Constant-time comparison (prevents timing attacks)
console.log(password1.equals(password2, true));  // true
console.log(password1.equals(password3, true));  // false

// Regular comparison (faster but potentially vulnerable)
console.log(password1.equals(password2, false)); // true

// Detailed comparison with timing info
const result = password1.compare(password2, true);
console.log(result);
// {
//   isEqual: true,
//   timeTaken: 0.123,
//   constantTime: true
// }
```

### String Search
```typescript
const text = createSecureString("Hello, World!");

// Check if contains substring
console.log(text.includes("World"));     // true
console.log(text.includes("world"));     // false

// Case-insensitive search
console.log(text.includes("world", { caseSensitive: false })); // true

// Check start/end
console.log(text.startsWith("Hello"));   // true
console.log(text.endsWith("World!"));    // true

// Search with options
const result = text.includes("WORLD", {
    caseSensitive: false,
    wholeWord: true,
    startPosition: 5,
    endPosition: -1
});
```

### Utility Functions
```typescript
// Constant-time comparison utility
const isMatch = constantTimeCompare("password123", "password123"); // true

// String similarity calculation
const similarity = calculateStringSimilarity("hello", "hallo"); // 0.8
const similarity2 = calculateStringSimilarity("cat", "dog", "jaro-winkler"); // 0.0
```

## Cryptographic Operations

### Hashing
```typescript
const data = createSecureString("sensitive data");

// Basic hash
const hash = await data.hash("SHA-256", "hex");
console.log(hash); // "abc123def456..."

// Different algorithms and formats
const sha512 = await data.hash("SHA-512", "base64");
const sha1 = await data.hash("SHA-1", "uint8array");

// Utility function
const quickHash = await hashString("data", "SHA-256", "hex");
```

### HMAC (Hash-based Message Authentication Code)
```typescript
const message = createSecureString("important message");

// HMAC with string key
const hmac1 = await message.hmac({
    key: "secret-key",
    algorithm: "HMAC-SHA-256"
}, "hex");

// HMAC with SecureString key
const secretKey = createSecureString("my-secret-key");
const hmac2 = await message.hmac({
    key: secretKey,
    algorithm: "HMAC-SHA-512"
}, "base64");

// HMAC with binary key
const binaryKey = new Uint8Array([1, 2, 3, 4, 5]);
const hmac3 = await message.hmac({
    key: binaryKey,
    algorithm: "HMAC-SHA-256"
}, "hex");
```

### Key Derivation
```typescript
const password = createSecureString("user-password");

// PBKDF2 key derivation
const derivedKey = await password.deriveKeyPBKDF2({
    salt: "random-salt",
    iterations: 100000,
    keyLength: 32,
    hash: "SHA-256"
}, "hex");

console.log(derivedKey); // "derived-key-hex-string"

// With binary salt
const binarySalt = new Uint8Array(16);
crypto.getRandomValues(binarySalt);

const derivedKey2 = await password.deriveKeyPBKDF2({
    salt: binarySalt,
    iterations: 150000,
    keyLength: 64,
    hash: "SHA-512"
}, "base64");
```

### Salt Generation
```typescript
// Generate random salt
const hexSalt = generateSalt(32, "hex");        // 64-char hex string
const base64Salt = generateSalt(32, "base64");  // base64 string
const binarySalt = generateSalt(32, "uint8array"); // Uint8Array

// Using SecureString static methods
const salt1 = SecureString.generateSalt(16, "hex");
const salt2 = SecureString.generateSalt(32, "base64");
```

## Validation & Analysis

### Password Validation
```typescript
const password = createSecureString("MyStr0ng!P@ssw0rd");

// Basic validation
const result = password.validatePassword();
console.log(result);
// {
//   isValid: true,
//   errors: [],
//   warnings: [],
//   score: 85.5
// }

// Custom validation rules
const customResult = password.validatePassword({
    minLength: 12,
    maxLength: 50,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    forbiddenPatterns: [/123/, /abc/],
    customRules: [
        (pwd) => pwd.includes("admin") ? "Cannot contain 'admin'" : null
    ]
});

// Utility function
const quickValidation = validatePassword("TestPass123!");
```

### Email Validation
```typescript
const email = createSecureString("user@example.com");

const validation = email.validateEmail();
console.log(validation);
// {
//   isValid: true,
//   errors: [],
//   warnings: []
// }

// Utility function
const quickEmailCheck = validateEmail("test@domain.com");
```

### String Statistics
```typescript
const text = createSecureString("Hello, World! 123");

const stats = text.getStatistics();
console.log(stats);
// {
//   length: 17,
//   byteLength: 17,
//   characterCount: { 'H': 1, 'e': 1, 'l': 3, ... },
//   hasUpperCase: true,
//   hasLowerCase: true,
//   hasNumbers: true,
//   hasSpecialChars: true,
//   entropy: 45.2
// }
```

## Advanced Features

### Entropy Analysis
```typescript
const password = createSecureString("MyComplexP@ssw0rd!");

// Comprehensive entropy analysis
const entropy = password.analyzeEntropy();
console.log(entropy);
// {
//   shannonEntropy: 4.2,
//   minEntropy: 3.8,
//   maxEntropy: 5.0,
//   compressionRatio: 0.85,
//   patternComplexity: 0.75,
//   bigramEntropy: 3.9,
//   trigramEntropy: 4.1,
//   predictability: 0.15,
//   randomnessScore: 0.82,
//   recommendations: ["Consider increasing length for better security"]
// }
```

### Pattern Analysis
```typescript
const weakPassword = createSecureString("password123qwerty");

const patterns = weakPassword.analyzePatterns();
console.log(patterns);
// {
//   repeatingPatterns: [{ pattern: "ss", count: 2, positions: [2, 3] }],
//   sequentialPatterns: [{ pattern: "123", type: "ascending" }],
//   keyboardPatterns: [{ pattern: "qwerty", layout: "qwerty" }],
//   dictionaryWords: [{ word: "password", position: 0, confidence: 0.5 }],
//   commonSubstitutions: [],
//   overallComplexity: 0.3
// }
```

### Quantum-Safe Operations
```typescript
const sensitiveData = createSecureString("top-secret-data");

// Quantum-safe hash
const quantumHash = await sensitiveData.createQuantumSafeHash({
    algorithm: "CRYSTALS-Dilithium",
    securityLevel: 256,
    useHybridMode: true,
    classicalFallback: "SHA-256"
}, "hex");

console.log(quantumHash);
// {
//   hash: "quantum-safe-hash-string",
//   algorithm: "CRYSTALS-Dilithium",
//   securityLevel: 256,
//   isQuantumSafe: true,
//   hybridMode: true,
//   metadata: { timestamp: Date, rounds: 200000, ... }
// }

// Quantum-safe key derivation
const quantumKey = await sensitiveData.deriveQuantumSafeKey({
    algorithm: "Post-Quantum-Hash",
    securityLevel: 192
}, 32, "hex");

// Verify quantum-safe hash
const isValid = await sensitiveData.verifyQuantumSafeHash(
    quantumHash.hash,
    { algorithm: "CRYSTALS-Dilithium", securityLevel: 256 },
    "hex"
);
```

## Performance Monitoring

### Basic Monitoring
```typescript
const str = createSecureString("performance-test-data");

// Start monitoring
str.startPerformanceMonitoring();

// Perform operations with automatic measurement
await str.measureOperation(async () => {
    return await str.hash("SHA-256", "hex");
}, "hash_operation");

await str.measureOperation(() => {
    const cloned = str.clone();
    cloned.append("-suffix");
    const result = cloned.toString();
    cloned.destroy();
    return result;
}, "string_manipulation");

// Get performance statistics
const stats = str.getPerformanceStats();
console.log(stats);
// {
//   totalOperations: 2,
//   averageDuration: 15.5,
//   minDuration: 12.3,
//   maxDuration: 18.7,
//   operationBreakdown: { hash_operation: 1, string_manipulation: 1 },
//   recommendations: ["Consider caching hash results"]
// }

// Stop monitoring
str.stopPerformanceMonitoring();
```

### Benchmarking
```typescript
const str = createSecureString("benchmark-data");

// Benchmark specific operation
const benchmark = await str.benchmarkOperation(
    async () => await str.hash("SHA-256", "hex"),
    "SHA-256 Hash",
    100  // 100 iterations
);

console.log(benchmark);
// {
//   operation: "SHA-256 Hash",
//   iterations: 100,
//   totalTime: 1250.5,
//   averageTime: 12.5,
//   operationsPerSecond: 80.0,
//   memoryEfficiency: 0.85,
//   scalabilityScore: 0.92,
//   recommendations: []
// }
```

## Memory Management

### Memory Usage Tracking
```typescript
const str = createSecureString("memory-test", {
    protectionLevel: "enhanced",
    enableEncryption: true,
    enableFragmentation: true
});

const usage = str.getMemoryUsage();
console.log(usage);
// {
//   bufferSize: 24,
//   actualLength: 11,
//   overhead: 13,
//   isFragmented: true,
//   isEncrypted: true
// }
```

### Protection Levels
```typescript
// Basic protection
const basic = createSecureString("data", {
    protectionLevel: "basic"
});

// Enhanced protection
const enhanced = createSecureString("data", {
    protectionLevel: "enhanced",
    enableEncryption: true,
    enableCanaries: true
});

// Maximum protection
const maximum = createSecureString("data", {
    protectionLevel: "maximum",
    enableEncryption: true,
    enableFragmentation: true,
    enableCanaries: true,
    enableObfuscation: true,
    autoLock: true,
    quantumSafe: true
});

// Check options
console.log(basic.getOptions());
console.log(enhanced.getOptions());
console.log(maximum.getOptions());
```

### Memory Operations
```typescript
const str = createSecureString("sensitive-data");

// Clone (creates new memory)
const cloned = str.clone();

// Wipe content (keeps object alive)
str.wipe();
console.log(str.toString()); // ""

// Destroy completely (frees memory)
str.destroy();
console.log(str.isDestroyed()); // true

// Use with auto-cleanup
const result = str.use(value => value.toUpperCase(), true);
// String is automatically destroyed after use
```

## Best Practices

### 1. Always Destroy When Done
```typescript
const password = createSecureString("secret");

// Use the string...

// Clean up
password.destroy();
```

### 2. Use Appropriate Protection Levels
```typescript
// For regular data
const username = createSecureString("john_doe");

// For sensitive data
const password = createEnhancedSecureString("secret123");

// For highly sensitive data
const apiKey = createMaximumSecureString("sk-1234567890");
```

### 3. Leverage Constant-Time Operations
```typescript
const userPassword = createSecureString("user-input");
const storedPassword = createSecureString("stored-hash");

// Always use constant-time comparison for passwords
const isValid = userPassword.equals(storedPassword, true);
```

### 4. Use Proper Key Derivation
```typescript
const password = createSecureString("user-password");

// Use strong parameters
const key = await password.deriveKeyPBKDF2({
    salt: generateSalt(32, "uint8array"),
    iterations: 100000, // High iteration count
    keyLength: 32,
    hash: "SHA-256"
}, "hex");
```

### 5. Monitor Performance in Production
```typescript
const criticalString = createSecureString("critical-data");
criticalString.startPerformanceMonitoring();

// Perform operations...

const stats = criticalString.getPerformanceStats();
if (stats.averageDuration > 100) {
    console.warn("Performance degradation detected");
}
```

### 6. Handle Events for Debugging
```typescript
const str = createSecureString("debug-data");

str.addEventListener("accessed", (event, details) => {
    console.log(`String accessed: ${details.operation}`);
});

str.addEventListener("modified", (event, details) => {
    console.log(`String modified: ${details.operation}`);
});
```

This comprehensive guide covers all SecureString functionality with practical examples!
