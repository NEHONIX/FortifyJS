# 🔧 Encoding Utilities Documentation

## Overview

The FortifyJS encoding utilities (`src/utils/encoding.ts`) provide comprehensive, secure, and cross-platform encoding/decoding functions for various data formats. These utilities are designed for maximum compatibility across Node.js and browser environments.

## 🎯 Key Features

- **Cross-Platform Compatibility** - Works in Node.js, browsers, and other JavaScript environments
- **Multiple Encoding Formats** - Supports Hex, Binary, Base64, Base58, Base32, and Octal
- **Enhanced Security** - Includes validation and error handling for all operations
- **Performance Optimized** - Uses native implementations when available, with secure fallbacks
- **Flexible Options** - Customizable separators, padding, case sensitivity, and URL-safe variants

## 📚 Available Encoding Formats

### 🔢 Hexadecimal (Hex)
Perfect for cryptographic keys, hashes, and binary data representation.

### 🔢 Binary
Useful for bit manipulation, debugging, and educational purposes.

### 🔢 Base64
Standard encoding for data transmission and storage.

### 🔢 Base58
Bitcoin-style encoding, ideal for user-friendly identifiers.

### 🔢 Base32
RFC 4648 compliant, great for case-insensitive systems.

### 🔢 Octal
Traditional base-8 encoding for specific use cases.

## 🚀 Quick Start

```typescript
import {
    bufferToHex,
    hexToBuffer,
    bufferToBase64,
    base64ToBuffer,
    bufferToBase58,
    base58ToBuffer,
    stringToBuffer,
    bufferToString
} from "fortify2-js/utils/encoding";

// Basic usage
const data = stringToBuffer("Hello, World!");
const hex = bufferToHex(data);
const base64 = bufferToBase64(data);
const base58 = bufferToBase58(data);

console.log("Hex:", hex);        // "48656c6c6f2c20576f726c6421"
console.log("Base64:", base64);  // "SGVsbG8sIFdvcmxkIQ=="
console.log("Base58:", base58);  // "72k1xXWG59fYdzuwFe7v"
```

## 📖 Detailed API Reference

### Hexadecimal Utilities

#### `bufferToHex(buffer, uppercase?, separator?)`
Converts a buffer to hexadecimal string.

**Parameters:**
- `buffer: Uint8Array` - The buffer to convert
- `uppercase?: boolean` - Use uppercase letters (default: false)
- `separator?: string` - Optional separator between bytes

**Examples:**
```typescript
const data = new Uint8Array([72, 101, 108, 108, 111]);

bufferToHex(data);                    // "48656c6c6f"
bufferToHex(data, true);              // "48656C6C6F"
bufferToHex(data, false, ":");        // "48:65:6c:6c:6f"
bufferToHex(data, true, " ");         // "48 65 6C 6C 6F"
```

#### `hexToBuffer(hex)`
Converts a hexadecimal string to buffer.

**Parameters:**
- `hex: string` - The hexadecimal string to convert

**Examples:**
```typescript
hexToBuffer("48656c6c6f");           // Uint8Array([72, 101, 108, 108, 111])
hexToBuffer("48:65:6c:6c:6f");       // Uint8Array([72, 101, 108, 108, 111])
hexToBuffer("48 65 6C 6C 6F");       // Uint8Array([72, 101, 108, 108, 111])
```

### Base64 Utilities

#### `bufferToBase64(buffer, urlSafe?)`
Converts a buffer to Base64 string.

**Parameters:**
- `buffer: Uint8Array` - The buffer to convert
- `urlSafe?: boolean` - Use URL-safe Base64 (default: false)

**Examples:**
```typescript
const data = stringToBuffer("Hello, World!");

bufferToBase64(data);                 // "SGVsbG8sIFdvcmxkIQ=="
bufferToBase64(data, true);           // "SGVsbG8sIFdvcmxkIQ"  (URL-safe, no padding)
```

#### `base64ToBuffer(base64, urlSafe?)`
Converts a Base64 string to buffer.

**Parameters:**
- `base64: string` - The Base64 string to convert
- `urlSafe?: boolean` - Input is URL-safe Base64 (default: false)

### Base58 Utilities

#### `bufferToBase58(buffer)`
Converts a buffer to Base58 string (Bitcoin-style).

**Examples:**
```typescript
const data = stringToBuffer("Hello");
bufferToBase58(data);                 // "9Ajdvzr"
```

#### `base58ToBuffer(base58)`
Converts a Base58 string to buffer.

### Base32 Utilities

#### `bufferToBase32(buffer, padding?)`
Converts a buffer to Base32 string (RFC 4648).

**Parameters:**
- `buffer: Uint8Array` - The buffer to convert
- `padding?: boolean` - Include padding (default: true)

**Examples:**
```typescript
const data = stringToBuffer("Hello");

bufferToBase32(data);                 // "JBSWY3DP"
bufferToBase32(data, false);          // "JBSWY3DP"  (no padding needed)
```

### Binary Utilities

#### `bufferToBinary(buffer, separator?)`
Converts a buffer to binary string.

**Examples:**
```typescript
const data = new Uint8Array([72, 101]);

bufferToBinary(data);                 // "0100100001100101"
bufferToBinary(data, " ");            // "01001000 01100101"
```

#### `numberToBinary(num, bits?)`
Converts a number to binary string.

**Parameters:**
- `num: number` - The number to convert
- `bits?: number` - Number of bits (default: 8)

**Examples:**
```typescript
numberToBinary(42);                   // "00101010"
numberToBinary(42, 16);               // "0000000000101010"
```

### String Utilities

#### `stringToBuffer(str)`
Converts a string to buffer using UTF-8 encoding.

#### `bufferToString(buffer)`
Converts a buffer to string using UTF-8 decoding.

#### `stringToHex(str, uppercase?, separator?)`
Directly converts a string to hexadecimal.

#### `hexToString(hex)`
Directly converts hexadecimal to string.

## 🔒 Security Features

### Input Validation
All functions include comprehensive input validation:
- Format validation (even hex length, valid characters, etc.)
- Range checking for numeric inputs
- Proper error messages for debugging

### Cross-Platform Safety
- Automatic environment detection (Node.js vs Browser)
- Secure fallback implementations when native functions unavailable
- Consistent behavior across all platforms

### Memory Safety
- Proper buffer allocation and bounds checking
- No memory leaks in conversion operations
- Efficient algorithms for large data processing

## 🚀 Performance Optimizations

### Native Implementation Priority
1. **Node.js**: Uses `Buffer` class for optimal performance
2. **Browser**: Uses `btoa`/`atob` and `TextEncoder`/`TextDecoder`
3. **Fallback**: Pure JavaScript implementations

### Efficient Algorithms
- Optimized Base58 encoding using proper mathematical operations
- Efficient bit manipulation for binary conversions
- Minimal memory allocation during conversions

## 🔧 Advanced Usage

### Custom Separators
```typescript
// MAC address format
bufferToHex(macBytes, false, ":");     // "aa:bb:cc:dd:ee:ff"

// Windows registry format
bufferToHex(data, true, " ");          // "AA BB CC DD"

// Binary with spaces
bufferToBinary(data, " ");             // "01001000 01100101"
```

### URL-Safe Base64
```typescript
// Standard Base64 (with padding)
const standard = bufferToBase64(data); // "SGVsbG8+/w=="

// URL-safe Base64 (no padding, URL-safe characters)
const urlSafe = bufferToBase64(data, true); // "SGVsbG8-_w"
```

### Error Handling
```typescript
try {
    const buffer = hexToBuffer("invalid-hex");
} catch (error) {
    console.error("Invalid hex string:", error.message);
}

try {
    const buffer = base58ToBuffer("invalid0base58");
} catch (error) {
    console.error("Invalid Base58 character:", error.message);
}
```

## 🧪 Testing and Validation

All encoding utilities include:
- Comprehensive unit tests
- Round-trip conversion validation
- Cross-platform compatibility tests
- Performance benchmarks
- Security validation tests

## 📋 Best Practices

1. **Always validate input** before encoding/decoding
2. **Use appropriate encoding** for your use case:
   - Hex: Cryptographic data, debugging
   - Base64: Data transmission, APIs
   - Base58: User-friendly identifiers
   - Base32: Case-insensitive systems
3. **Handle errors gracefully** with try-catch blocks
4. **Consider performance** for large data operations
5. **Use URL-safe variants** when needed for web applications

## 🔗 Integration with FortifyJS

The encoding utilities are seamlessly integrated with other FortifyJS components:

```typescript
import { SecureRandom, Hash } from "fortify2-js";
import { bufferToHex, bufferToBase58 } from "fortify2-js/utils/encoding";

// Generate secure random data
const randomBytes = SecureRandom.getRandomBytes(32);

// Convert to different formats
const hexKey = bufferToHex(randomBytes);
const base58Id = bufferToBase58(randomBytes);

// Use in hashing
const hash = Hash.createSecureHash("data", randomBytes, {
    outputFormat: "hex" // Uses internal encoding utilities
});
```

This comprehensive encoding utility suite provides the foundation for secure, reliable data transformation across the entire FortifyJS ecosystem.
