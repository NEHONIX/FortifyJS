# FortifyJS Quick Reference Guide

## 🚀 Why `fObject` and `fString`?

**Short, memorable, and easy to type!** Perfect for developers who want powerful security without verbose syntax.

```typescript
// 💚 Love this simplicity!
import { fObject, fString } from "fortify2-js";

const user = fObject({ name: "John", password: "secret" });
const token = fString("jwt-token-here");
```

## 📦 Quick Import Guide

```typescript
// 🚀 RECOMMENDED: Short aliases
import { fObject, fString } from "fortify2-js";

// Alternative: Full names
import { 
    SecureObject, 
    SecureString, 
    createSecureObject, 
    createSecureString 
} from "fortify2-js";

// Mixed approach
import { fObject, createSecureString } from "fortify2-js";
```

## 🔥 fObject Quick Examples

### Basic Usage
```typescript
import { fObject } from "fortify2-js";

// Create with data
const user = fObject({
    username: "john_doe",
    email: "john@example.com",
    password: "secret123"
});

// Basic operations
user.set("age", 30);
const name = user.get("username");
const hasEmail = user.has("email");
user.delete("password");

// Get all data
const allData = user.getAll();
console.log(allData);
```

### Sensitive Data Management
```typescript
const config = fObject({
    apiKey: "sk-1234567890",
    dbPassword: "db-secret",
    jwtSecret: "jwt-secret"
});

// Add custom sensitive keys
config.addSensitiveKeys("apiKey", "jwtSecret");

// Encrypt sensitive data when serializing
const safeData = config.getAll({ encryptSensitive: true });
console.log(safeData);
// { apiKey: "[ENCRYPTED:...]", dbPassword: "[ENCRYPTED:...]", jwtSecret: "[ENCRYPTED:...]" }
```

### Event Handling
```typescript
const user = fObject();

// Listen for changes
user.addEventListener("set", (event, key, value) => {
    console.log(`${key} was set to ${value}`);
});

user.set("name", "John"); // Triggers event
```

## ⚡ fString Quick Examples

### Basic Usage
```typescript
import { fString } from "fortify2-js";

// Create secure string
const password = fString("my-secret-password");
const token = fString("jwt-token-here");

// Basic operations
console.log(password.length());     // 18
console.log(password.toString());   // "my-secret-password"

// String manipulation
password.append("!");
password.prepend("Super-");
console.log(password.toString());   // "Super-my-secret-password!"
```

### Cryptographic Operations
```typescript
const data = fString("sensitive-information");

// Hash the data
const hash = await data.hash("SHA-256", "hex");
console.log(hash); // "abc123def456..."

// HMAC
const hmac = await data.hmac({
    key: "secret-key",
    algorithm: "HMAC-SHA-256"
}, "hex");

// Key derivation
const derivedKey = await data.deriveKeyPBKDF2({
    salt: "random-salt",
    iterations: 100000,
    keyLength: 32,
    hash: "SHA-256"
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
    requireSpecialChars: true
});

console.log(validation.isValid); // true
console.log(validation.score);   // 85.5
```

### Advanced Analysis
```typescript
const password = fString("password123");

// Entropy analysis
const entropy = password.analyzeEntropy();
console.log(entropy.randomnessScore); // 0.45 (weak)

// Pattern analysis
const patterns = password.analyzePatterns();
console.log(patterns.dictionaryWords); // [{ word: "password", ... }]
```

## 🛡️ Security Levels

### fObject Security
```typescript
// Basic (default)
const basic = fObject({ data: "value" });

// With encryption
const secure = fObject({ secret: "value" }, {
    encryptionKey: "my-key"
});

// Read-only
const config = fObject({ setting: "value" }, {
    readOnly: true
});
```

### fString Protection Levels
```typescript
// Basic protection
const basic = fString("data");

// Enhanced protection
const enhanced = fString("sensitive", {
    protectionLevel: "enhanced",
    enableEncryption: true
});

// Maximum protection
const maximum = fString("top-secret", {
    protectionLevel: "maximum",
    enableEncryption: true,
    enableFragmentation: true,
    quantumSafe: true
});
```

## 🔄 Common Patterns

### User Authentication
```typescript
import { fObject, fString } from "fortify2-js";

// Store user credentials securely
const credentials = fObject({
    username: "john_doe",
    password: "user-password",
    apiKey: "sk-1234567890"
});

// Add sensitive keys
credentials.addSensitiveKeys("password", "apiKey");

// Validate password
const password = fString("user-input-password");
const validation = password.validatePassword();

if (validation.isValid) {
    // Hash for storage
    const hashedPassword = await password.deriveKeyPBKDF2({
        salt: "random-salt",
        iterations: 100000,
        keyLength: 32,
        hash: "SHA-256"
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
        password: "db-secret"
    },
    api: {
        key: "sk-1234567890",
        secret: "api-secret"
    }
});

// Mark sensitive fields
config.addSensitiveKeys("password", "key", "secret");

// Export safely
const safeConfig = config.getAll({ encryptSensitive: true });
```

### Token Management
```typescript
const jwt = fString("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...");

// Validate token format
const isValidJWT = jwt.toString().split('.').length === 3;

// Hash for comparison
const tokenHash = await jwt.hash("SHA-256", "hex");

// Store securely
const tokenStore = fObject({
    token: jwt.toString(),
    hash: tokenHash,
    expires: Date.now() + 3600000
});

tokenStore.addSensitiveKeys("token");
```

## 🧹 Memory Management

### Always Clean Up
```typescript
const sensitiveData = fString("top-secret");
const userConfig = fObject({ password: "secret" });

// Use the data...

// Clean up when done
sensitiveData.destroy();
userConfig.destroy();
```

### Auto-cleanup Pattern
```typescript
const result = fString("data").use(str => {
    return str.toUpperCase();
}, true); // Auto-destroy after use

console.log(result); // "DATA"
// String is automatically destroyed
```

## 🎯 Performance Tips

### Monitor Performance
```typescript
const data = fString("performance-test");

// Start monitoring
data.startPerformanceMonitoring();

// Perform operations
await data.measureOperation(async () => {
    return await data.hash("SHA-256", "hex");
}, "hash_operation");

// Get stats
const stats = data.getPerformanceStats();
console.log(stats.averageDuration); // ms

data.stopPerformanceMonitoring();
```

### Benchmark Operations
```typescript
const benchmark = await data.benchmarkOperation(
    async () => await data.hash("SHA-256", "hex"),
    "SHA-256 Hash",
    100 // iterations
);

console.log(benchmark.operationsPerSecond);
```

## 🚨 Common Gotchas

### 1. Remember to Destroy
```typescript
// ❌ Memory leak
const password = fString("secret");
// ... use password but never destroy

// ✅ Proper cleanup
const password = fString("secret");
// ... use password
password.destroy();
```

### 2. Sensitive Keys Are Case-Sensitive
```typescript
const user = fObject({ Password: "secret" });

// ❌ Won't match
user.addSensitiveKeys("password"); // lowercase

// ✅ Correct
user.addSensitiveKeys("Password"); // matches case
```

### 3. Constant-Time Comparison for Security
```typescript
const userPassword = fString("user-input");
const storedPassword = fString("stored-hash");

// ❌ Vulnerable to timing attacks
const isValid = userPassword.equals(storedPassword, false);

// ✅ Secure constant-time comparison
const isValid = userPassword.equals(storedPassword, true);
```

## 🎉 That's It!

With `fObject` and `fString`, you get enterprise-grade security with simple, memorable syntax. Perfect for developers who want powerful features without complexity!

```typescript
import { fObject, fString } from "fortify2-js";

// Simple, secure, and powerful! 🚀
const user = fObject({ name: "John", password: "secret" });
const token = fString("jwt-token");
```
