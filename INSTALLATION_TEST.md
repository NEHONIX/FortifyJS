# FortifyJS v4.0.2 Installation & Testing Guide

## Installation

### Install the latest version:

```bash
npm install fortify2-js@4.0.4
```

### Or install the latest:

```bash
npm install fortify2-js@latest //(recommanded)
```

## Quick Test

### 1. Create a test file:

```javascript
// test.js
const { fArray, fObject } = require("fortify2-js");

// Test the critical valueOf fix
console.log("Testing EnhancedUint8Array valueOf fix...");
const arr = fArray([1, 2, 3]);
arr.setEncryptionKey("test-key");
arr.encryptAll(); // This should work without errors!
console.log("valueOf fix working!");

// Test new serialize method
const obj = fObject({ test: "data" });
const serialized = obj.serialize({ includeMetadata: true });
console.log("Serialize method working!");
console.log("Serialized length:", serialized.length);
```

### 2. Run the test:

```bash
node test.js
```

## What's Fixed in v4.0.2

### Critical Production Fix

-   **EnhancedUint8Array valueOf Error**: Fixed the production-breaking error when using encryption
-   **Root Cause**: `SecureRandom.getRandomBytes()` returned `EnhancedUint8Array` with protective `valueOf()`
-   **Solution**: Added `toUint8Array()` method and updated all crypto handlers

### New Features

-   **SecureObject.serialize()**: Complete serialization with metadata and encryption
-   **SecureObject.exportData()**: Export to JSON, CSV, XML, YAML formats
-   **Enhanced Error Handling**: Better error messages and debugging

### Technical Improvements

-   **ArrayCryptoHandler**: Fixed EnhancedUint8Array conversion
-   **SecureObject CryptoHandler**: Fixed crypto operations
-   **Hash Utilities**: Enhanced Buffer conversion safety

## Usage Examples

### Basic SecureArray:

```javascript
const { fArray } = require("fortify2-js");

const arr = fArray([1, 2, 3]);
arr.push(4);
console.log(arr.compact()); // [1, 2, 3, 4]
```

### SecureArray with Encryption:

```javascript
const { fArray } = require("fortify2-js");

const arr = fArray(["sensitive", "data"]);
arr.setEncryptionKey("your-secret-key");
arr.encryptAll();
console.log(arr.get(0)); // 'sensitive' (auto-decrypted)
```

### SecureObject with Serialization:

```javascript
const { fObject } = require("fortify2-js");

const obj = fObject({
    username: "user",
    password: "secret",
});

obj.addSensitiveKeys("password");
obj.setEncryptionKey("encryption-key");

const serialized = obj.serialize({
    encryptSensitive: true,
    includeMetadata: true,
    format: "json",
});

console.log("Serialized:", serialized.length, "characters");
```

## Verification

### Check if the fix is working:

```javascript
const { fArray } = require("fortify2-js");

try {
    const arr = fArray([234, 45]);
    arr.setEncryptionKey("test");
    arr.encryptAll();

    // This should work without throwing valueOf errors
    arr.compact().forEach((x) => console.log("Item:", x));

    console.log("FortifyJS v4.0.2 is working correctly!");
} catch (error) {
    console.error("Error:", error.message);
}
```

## Performance

### Memory Usage:

-   **SecureArray**: ~34 bytes for 3 elements
-   **Serialization**: ~1564 characters for complex objects
-   **Encryption**: Production-ready AES-256-CTR-HMAC

### Features:

-   Real cryptographic operations (no mocks)
-   Memory management and cleanup
-   Event system and monitoring
-   Multiple export formats
-   TypeScript support

## Troubleshooting

### If you encounter issues:

1. **Check Node.js version**: Requires Node.js >= 22.12.0
2. **Clear npm cache**: `npm cache clean --force`
3. **Reinstall**: `npm uninstall fortify2-js && npm install fortify2-js@4.0.3`
4. **Check imports**: Use `const { fArray, fObject } = require('fortify2-js')`

### Common Issues:

-   **valueOf errors**: Fixed in v4.0.2
-   **Serialize not found**: Fixed in v4.0.2
-   **Memory issues**: Use proper cleanup with `.destroy()`

## Success Indicators

You'll know it's working when:

-   No `valueOf()` errors during encryption
-   `serialize()` method available on SecureObject
-   Memory usage properly tracked
-   All crypto operations functional

## Support

-   **Issues**: https://github.com/nehonix/FortifyJS/issues
-   **Documentation**: https://lab.nehonix.space/nehonix_viewer/_doc/Nehonix%20FortifyJs/readme.md
-   **Changelog**: https://github.com/nehonix/FortifyJS/blob/main/CHANGELOG.md

---

**FortifyJS v4.0.2 - Production Ready!**
