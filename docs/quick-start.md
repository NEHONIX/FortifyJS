# FortifyJS SecureArray - Quick Start Guide

## 🚀 Get Started in 5 Minutes

Welcome to FortifyJS SecureArray! This guide will get you up and running with secure, encrypted arrays in just a few minutes.

## 📦 Installation

```bash
npm install fortify2-js
# or
yarn install fortify2-js
# or
bun add fortify2-js
```

## 🔥 Basic Usage

### 1. Create Your First SecureArray

```javascript
import { fArray } "fortify2-js"

// Create a secure array
const secureData = fArray(["user1", "user2", "user3"]);

console.log(secureData.length); // 3
console.log(secureData.get(0)); // 'user1'
```

### 2. Add Security with Encryption

```javascript
// Set encryption key
secureData.setEncryptionKey("my-super-secret-key-2024");

// Encrypt all data
secureData.encryptAll();

// Data is now encrypted but still accessible
console.log(secureData.get(0)); // 'user1' (automatically decrypted)

// Check encryption status
const status = secureData.getEncryptionStatus();
console.log(status.algorithm); // "AES-256-CTR-HMAC"
```

### 3. Use Like a Regular Array

```javascript
// All standard array methods work
secureData.push("user4");
secureData.pop();
secureData.forEach((user) => console.log(user));

const activeUsers = secureData.filter((user) => user.startsWith("user"));
const userCount = secureData.reduce((count) => count + 1, 0);
```

## 🛡️ Security Features

### Automatic Memory Management

```javascript
const sensitiveData = fArray(["password123", "api-key-xyz"]);

// Set encryption
sensitiveData.setEncryptionKey("encryption-key");
sensitiveData.encryptAll();

// When done, secure cleanup
sensitiveData.destroy(); // Automatically wipes memory
```

### Snapshot Management

```javascript
const versionedData = fArray(["v1-config", "v1-settings"]);

// Create a snapshot
const snapshotId = versionedData.createSnapshot();

// Make changes
versionedData.push("v2-config");
versionedData.set(0, "modified-config");

// Restore to previous state
versionedData.restoreFromSnapshot(snapshotId);
console.log(versionedData.toArray()); // ['v1-config', 'v1-settings']
```

## 📊 Advanced Features

### Real-time Monitoring

```javascript
const monitoredArray = fArray(["data1", "data2"]);

// Listen to changes
monitoredArray.on("push", (data) => {
    console.log("New item added:", data);
});

monitoredArray.on("set", () => {
    console.log("Item modified");
});

// Get comprehensive statistics
const stats = monitoredArray.getStats();
console.log("Memory usage:", stats.memoryUsage, "bytes");
console.log("Total accesses:", stats.totalAccesses);
```

### Data Export

```javascript
const exportData = fArray(["item1", 42, true, { key: "value" }]);

// Export to different formats
const json = exportData.exportData("json");
const csv = exportData.exportData("csv");

console.log("CSV Export:");
console.log(csv);
// Index,Value,Type
// 0,"item1",string
// 1,42,number
// 2,true,boolean
// 3,"{""key"":""value""}",object
```

## 🔧 Configuration Options

### Custom Configuration

```javascript
const configuredArray = fArray(["data"], {
    // Security
    encryptionKey: "your-encryption-key",

    // Memory management
    maxMemory: 50 * 1024 * 1024, // 50MB limit
    maxLength: 10000, // Max 10k elements

    // Features
    enableMemoryTracking: true, // Track memory usage
    autoCleanup: true, // Auto cleanup

    // Validation
    enableIndexValidation: true, // Validate array indices
    enableTypeValidation: true, // Validate data types
});
```

### Read-only Arrays

```javascript
const readOnlyData = fArray(["constant1", "constant2"]);

// Make read-only
readOnlyData.makeReadOnly();

try {
    readOnlyData.push("new"); // Throws error
} catch (error) {
    console.log("Cannot modify read-only array");
}

// Make writable again
readOnlyData.makeWritable();
readOnlyData.push("new"); // Works now
```

## 🎯 Common Use Cases

### 1. Secure User Data

```javascript
const userData = fArray([]);
userData.setEncryptionKey(process.env.USER_DATA_KEY);

// Store sensitive user information
userData.push({
    id: "user123",
    email: "user@example.com",
    preferences: { theme: "dark" },
});

// Data is automatically encrypted
const user = userData.get(0); // Automatically decrypted
```

### 2. API Key Management

```javascript
const apiKeys = fArray([]);
apiKeys.setEncryptionKey(process.env.MASTER_KEY);

// Store API keys securely
apiKeys.push("sk-1234567890abcdef");
apiKeys.push("pk-abcdef1234567890");

// Export for backup (encrypted)
const backup = apiKeys.serialize({
    encryptSensitive: true,
    includeChecksum: true,
});
```

### 3. Session Management

```javascript
const activeSessions = fArray([]);

// Track active sessions
activeSessions.on("push", (session) => {
    console.log("New session started:", session.id);
});

activeSessions.on("splice", () => {
    console.log("Session ended");
});

// Add session
activeSessions.push({
    id: "sess_123",
    userId: "user_456",
    createdAt: Date.now(),
});
```

## 🚨 Error Handling

```javascript
const safeArray = fArray(["data"]);

try {
    // Safe operations
    const item = safeArray.get(0);
    safeArray.set(0, "new-data");

    // This will throw for negative indices
    safeArray.get(-1);
} catch (error) {
    console.error("SecureArray error:", error.message);
}
```

## 📈 Performance Tips

### 1. Batch Operations

```javascript
// Instead of multiple push operations
const data = fArray([]);
data.push("item1");
data.push("item2");
data.push("item3");

// Use batch operations when possible
const batchData = fArray(["item1", "item2", "item3"]);
```

### 2. Memory Management

```javascript
const largeArray = fArray([]);

// Monitor memory usage
setInterval(() => {
    const stats = largeArray.getStats();
    if (stats.memoryUsage > 10 * 1024 * 1024) {
        // 10MB
        console.warn("High memory usage detected");
    }
}, 5000);
```

### 3. Cleanup

```javascript
const temporaryArray = fArray(["temp-data"]);

// Always cleanup when done
window.addEventListener("beforeunload", () => {
    temporaryArray.destroy();
});
```

## 🔗 Next Steps

Now that you're up and running, explore more advanced features:

-   **[Complete Documentation](./secure-array.md)** - Full feature guide
-   **[API Reference](./api/secure-array-api.md)** - Complete API documentation
-   **[Security Best Practices](./security/secure-array-security.md)** - Security guidelines
-   **[Performance Guide](./performance/secure-array-performance.md)** - Optimization tips

## 💡 Need Help?

-   **Issues**: Report bugs on [GitHub Issues](https://github.com/your-org/fortifyjs/issues)
-   **Discussions**: Join the community discussions
-   **Documentation**: Check the complete docs for detailed information

## 🎉 You're Ready!

You now have a secure, encrypted array with military-grade security features. Start building secure applications with confidence!

```javascript
// Your secure application starts here
const mySecureApp = fArray([]);
mySecureApp.setEncryptionKey("your-app-key");

// Build something amazing! 🚀
```

