# FortifyJS Quick Reference Guide

## Overview

The `fObject` and `fString` aliases provide concise, developer-friendly interfaces for FortifyJS's `SecureObject` and `SecureString` classes, enabling secure and efficient data handling with minimal syntax.

```typescript
import { fObject, fString } from "fortify2-js";

const user = fObject({ name: "John", password: "secret" });
const token = fString("jwt-token-here");
```

## Import Options

```typescript
// Preferred: Short aliases
import { fObject, fString } from "fortify2-js";

// Alternative: Full names
import { SecureObject, SecureString, createSecureObject, createSecureString } from "fortify2-js";

// Mixed approach
import { fObject, createSecureString } from "fortify2-js";
```

## SecureObject Examples

### Basic Usage

```typescript
import { fObject } from "fortify2-js";

// Create with data
const user = fObject({
    username: "john_doe",
    email: "john@example.com",
    password: "secret123",
});

// Basic operations
user.set("age", 30);
const name = user.get("username"); // "john_doe"
const hasEmail = user.has("email"); // true
user.delete("password");

// Retrieve all data
const allData = user.getAll();
console.log(allData);
```

### Sensitive Data Management

```typescript
const config = fObject({
    apiKey: "sk-1234567890",
    dbPassword: "db-secret",
    jwtSecret: "jwt-secret",
});

// Add sensitive keys
config.addSensitiveKeys("apiKey", "jwtSecret");

// Serialize with encryption
const safeData = config.getAll({ encryptSensitive: true });
console.log(safeData);
// { apiKey: "[ENCRYPTED:...]", dbPassword: "[ENCRYPTED:...]", jwtSecret: "[ENCRYPTED:...]" }
```

### Event Handling

```typescript
const user = fObject();

// Listen for set operations
user.addEventListener("set", (event, key, value) => {
    console.log(`${key} set to ${value}`);
});

user.set("name", "John"); // Triggers event
```

## SecureString Examples

### Basic Usage

```typescript
import { fString } from "fortify2-js";

// Create secure string
const password = fString("my-secret-password");
const token = fString("jwt-token-here");

// Basic operations
console.log(password.length()); // 18
console.log(password.toString()); // "my-secret-password"

// String manipulation
password.append("!");
password.prepend("Super-");
console.log(password.toString()); // "Super-my-secret-password!"
```

### Cryptographic Operations

```typescript
const data = fString("sensitive-information");

// Hash data
const hash = await data.hash("SHA-256", "hex");
console.log(hash); // "abc123def456..."

// HMAC
const hmac = await data.hmac({
    key: "secret-key",
    algorithm: "HMAC-SHA-256",
}, "hex");

// Key derivation
const derivedKey = await data.deriveKeyPBKDF2({
    salt: "random-salt",
    iterations: 100000,
    keyLength: 32,
    hash: "SHA-256",
}, "hex");
```

### Password Validation

```typescript
const password = fString("MyStr0ng!P@ssw0rd");

// Validate password strength
const validation = password.validatePassword({
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
});

console.log(validation.isValid); // true
console.log(validation.score); // 85.5
```

### Analysis

```typescript
const password = fString("password123");

// Entropy analysis
const entropy = password.analyzeEntropy();
console.log(entropy.randomnessScore); // 0.45

// Pattern analysis
const patterns = password.analyzePatterns();
console.log(patterns.dictionaryWords); // [{ word: "password", ... }]
```

## Security Levels

### SecureObject Security

```typescript
// Basic configuration
const basic = fObject({ data: "value" });

// With encryption
const secure = fObject({ secret: "value" }, {
    encryptionKey: "my-key",
});

// Read-only
const config = fObject({ setting: "value" }, {
    readOnly: true,
});
```

### SecureString Protection Levels

```typescript
// Basic protection
const basic = fString("data");

// Enhanced protection
const enhanced = fString("sensitive", {
    protectionLevel: "enhanced",
    enableEncryption: true,
});

// Maximum protection
const maximum = fString("top-secret", {
    protectionLevel: "maximum",
    enableEncryption: true,
    enableFragmentation: true,
    quantumSafe: true,
});
```

## Common Patterns

### User Authentication

```typescript
import { fObject, fString } from "fortify2-js";

const credentials = fObject({
    username: "john_doe",
    password: "user-password",
    apiKey: "sk-1234567890",
});

credentials.addSensitiveKeys("password", "apiKey");

const password = fString("user-input-password");
const validation = password.validatePassword();

if (validation.isValid) {
    const hashedPassword = await password.deriveKeyPBKDF2({
        salt: "random-salt",
        iterations: 100000,
        keyLength: 32,
        hash: "SHA-256",
    }, "hex");
    credentials.set("hashedPassword", hashedPassword);
}
```

### Configuration Management

```typescript
const config = fObject({
    database: {
        host: "localhost",
        port: 5432,
        password: "db-secret",
    },
    api: {
        key: "sk-1234567890",
        secret: "api-secret",
    },
});

config.addSensitiveKeys("password", "key", "secret");
const safeConfig = config.getAll({ encryptSensitive: true });
```

### Token Management

```typescript
const jwt = fString("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...");

const isValidJWT = jwt.toString().split('.').length === 3;
const tokenHash = await jwt.hash("SHA-256", "hex");

const tokenStore = fObject({
    token: jwt.toString(),
    hash: tokenHash,
    expires: Date.now() + 3600000,
});

tokenStore.addSensitiveKeys("token");
```

## Memory Management

### Cleanup

```typescript
const sensitiveData = fString("top-secret");
const userConfig = fObject({ password: "secret" });

// Clean up
sensitiveData.destroy();
userConfig.destroy();
```

### Auto-Cleanup

```typescript
const result = fString("data").use(str => {
    return str.toUpperCase();
}, true);

console.log(result); // "DATA"
```

## Performance Tips

### Monitor Performance

```typescript
const data = fString("performance-test");

data.startPerformanceMonitoring();

await data.measureOperation(async () => {
    return await data.hash("SHA-256", "hex");
}, "hash_operation");

const stats = data.getPerformanceStats();
console.log(stats.averageDuration);
data.stopPerformanceMonitoring();
```

### Benchmark Operations

```typescript
const benchmark = await data.benchmarkOperation(
    async () => await data.hash("SHA-256", "hex"),
    "SHA-256 Hash",
    100,
);

console.log(benchmark.operationsPerSecond);
```

## Best Practices

1. **Always Destroy Objects**:
   ```typescript
   const password = fString("secret");
   password.destroy();
   ```

2. **Handle Sensitive Keys Correctly**:
   ```typescript
   const user = fObject({ Password: "secret" });
   user.addSensitiveKeys("Password"); // Case-sensitive
   ```

3. **Use Constant-Time Comparison**:
   ```typescript
   const userPassword = fString("user-input");
   const storedPassword = fString("stored-hash");
   const isValid = userPassword.equals(storedPassword, true);
   ```