# SecureArray - Advanced Secure Data Structure

## Overview

SecureArray is FortifyJS's flagship secure data structure that provides military-grade encryption, advanced memory management, and comprehensive security features while maintaining full compatibility with JavaScript's native Array API.

## Key Features

-   **🔐 Military-Grade Encryption**: AES-256-CTR-HMAC encryption with real cryptographic implementations
-   ** Secure Memory Management**: Automatic memory cleanup and leak detection
-   ** Real-time Analytics**: Live monitoring and performance metrics
-   ** Snapshot Management**: Create and restore array states
-   ** Advanced Operations**: Unique, shuffle, min/max, and more
-   ** Event System**: Comprehensive event handling and monitoring
-   ** Secure Serialization**: Multiple export formats with integrity verification
-   ** High Performance**: Optimized for speed and security

## Installation

```javascript
import { fArray } from "fortifyjs";
// or
const { fArray } = require("fortifyjs");
```

## Basic Usage

### Creating a SecureArray

```javascript
// Create from existing array
const secureArray = fArray(["item1", "item2", "item3"]);

// Create empty array
const emptyArray = fArray();

// Create with options
const configuredArray = fArray(["data"], {
    encryptionKey: "my-secret-key",
    maxLength: 1000,
    enableMemoryTracking: true,
});
```

### Basic Operations

```javascript
const arr = fArray(["apple", "banana", "cherry"]);

// Array manipulation
arr.push("date"); // Add to end
arr.unshift("elderberry"); // Add to beginning
const last = arr.pop(); // Remove from end
const first = arr.shift(); // Remove from beginning

// Access elements
console.log(arr.get(0)); // Get by index
arr.set(1, "blueberry"); // Set by index
console.log(arr.length); // Get length

// Convert to regular array
console.log(arr.toArray()); // ['elderberry', 'blueberry', 'cherry']
```

## Advanced Features

### Encryption and Security

```javascript
const secureData = fArray(["sensitive-data", "api-keys", "passwords"]);

// Set encryption key
secureData.setEncryptionKey("super-secret-key-2024");

// Encrypt all elements
secureData.encryptAll();

// Check encryption status
const status = secureData.getEncryptionStatus();
console.log(status);
// {
//   isInitialized: true,
//   hasEncryptionKey: true,
//   algorithm: "AES-256-CTR-HMAC"
// }
```

### Search and Filter Operations

```javascript
const numbers = fArray([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

// Find operations
const found = numbers.find((n) => n > 5); // 6
const foundIndex = numbers.findIndex((n) => n > 5); // 5
const includes = numbers.includes(7); // true
const indexOf = numbers.indexOf(8); // 7

// Filter and transform
const evens = numbers.filter((n) => n % 2 === 0); // [2, 4, 6, 8, 10]
const doubled = numbers.map((n) => n * 2); // [2, 4, 6, 8, 10, 12, 14, 16, 18, 20]
const sum = numbers.reduce((acc, n) => acc + n, 0); // 55

// Boolean operations
const hasLarge = numbers.some((n) => n > 8); // true
const allPositive = numbers.every((n) => n > 0); // true
```

### Advanced Array Operations

```javascript
const data = fArray([5, 2, 8, 1, 9, 2, 5, 3]);

// Sorting
data.sort(); // Sort in place
data.sort((a, b) => b - a); // Custom sort (descending)

// Unique values
const unique = data.unique(); // Remove duplicates

// Min/Max
const min = data.min(); // 1
const max = data.max(); // 9

// Shuffle
data.shuffle(); // Randomize order

// Sample
const sample = data.sample(3); // Get 3 random elements

// Compact (remove falsy values)
const mixed = fArray([1, null, 2, undefined, 3, "", 4]);
mixed.compact(); // [1, 2, 3, 4]
```

### Snapshot Management

```javascript
const versionedArray = fArray(["v1-data", "v1-config"]);

// Create snapshot
const snapshotId = versionedArray.createSnapshot();

// Modify array
versionedArray.push("v2-data");
versionedArray.set(0, "modified-data");

// Restore from snapshot
versionedArray.restoreFromSnapshot(snapshotId);
console.log(versionedArray.toArray()); // ['v1-data', 'v1-config']

// List all snapshots
const snapshots = versionedArray.listSnapshots();

// Delete snapshot
versionedArray.deleteSnapshot(snapshotId);
```

### State Management

```javascript
const stateArray = fArray(["mutable", "data"]);

// Make read-only
stateArray.makeReadOnly();
// stateArray.push('new'); // Throws error

// Make writable again
stateArray.makeWritable();
stateArray.push("new"); // Works

// Freeze (immutable)
stateArray.freeze();
// stateArray.push('another'); // Throws error

// Unfreeze
stateArray.unfreeze();
```

### Event System

```javascript
const eventArray = fArray(["initial"]);

// Listen to events
eventArray.on("push", (data) => {
    console.log("Item pushed:", data);
});

eventArray.on("set", (data) => {
    console.log("Item set");
});

// One-time listener
eventArray.once("clear", () => {
    console.log("Array cleared!");
});

// Trigger events
eventArray.push("new-item"); // Fires 'push' event
eventArray.set(0, "updated"); // Fires 'set' event

// Remove listener
eventArray.off("push");
```

### Serialization and Export

```javascript
const exportArray = fArray(["data1", 42, true, { key: "value" }]);

// Serialize with options
const serialized = exportArray.serialize({
    includeMetadata: true,
    encryptSensitive: true,
    format: "json",
    compression: true,
    includeChecksum: true,
});

// Export to different formats
const jsonExport = exportArray.exportData("json");
const csvExport = exportArray.exportData("csv");

console.log("CSV Export:");
console.log(csvExport);
// Index,Value,Type
// 0,"data1",string
// 1,42,number
// 2,true,boolean
// 3,"{""key"":""value""}",object
```

### Memory Management and Statistics

```javascript
const monitoredArray = fArray(["item1", "item2", "item3"]);

// Get comprehensive statistics
const stats = monitoredArray.getStats();
console.log(stats);
// {
//   length: 3,
//   secureElements: 1,
//   totalAccesses: 5,
//   memoryUsage: 156,
//   lastModified: 1748480356504,
//   version: 3,
//   createdAt: 1748480356500,
//   isReadOnly: false,
//   isFrozen: false
// }

// Validate integrity
const isValid = monitoredArray.validateIntegrity();
console.log("Array integrity:", isValid);
```

## Configuration Options

```javascript
const configuredArray = fArray([], {
    // Security options
    encryptionKey: "my-secret-key",

    // Memory management
    maxMemory: 100 * 1024 * 1024, // 100MB
    maxLength: 10000, // Max elements
    maxSize: Number.MAX_SAFE_INTEGER, // Max size
    gcThreshold: 0.8, // GC trigger threshold

    // Features
    enableMemoryTracking: true, // Track memory usage
    autoCleanup: true, // Auto cleanup
    enableIndexValidation: true, // Validate indices
    enableTypeValidation: true, // Validate types

    // State
    readOnly: false, // Initial read-only state
    autoDestroy: false, // Auto destroy on GC
});
```

## Performance Best Practices

1. **Use encryption selectively**: Only encrypt sensitive data
2. **Monitor memory usage**: Check stats regularly for large arrays
3. **Cleanup snapshots**: Delete unused snapshots to free memory
4. **Batch operations**: Use efficient bulk operations
5. **Event listeners**: Remove unused event listeners

## Error Handling

```javascript
const errorArray = fArray(["test"]);

try {
    // Invalid operations
    errorArray.get(-1); // Throws for negative index

    // Read-only violations
    errorArray.makeReadOnly();
    errorArray.push("fail"); // Throws error
} catch (error) {
    console.error("SecureArray error:", error.message);
}
```

## Security Notes

-   **Encryption keys**: Store encryption keys securely, never in code
-   **Memory cleanup**: Always call `destroy()` when done with sensitive data
-   **Event listeners**: Remove listeners to prevent memory leaks
-   **Snapshots**: Delete unused snapshots containing sensitive data
-   **Serialization**: Be careful when serializing encrypted data

## Next Steps

-   [API Reference](./api/secure-array-api.md)
