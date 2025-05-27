# Encoding Utilities Documentation

## Overview

The FortifyJS encoding utilities (`src/utils/encoding.ts`) provide secure, cross-platform functions for encoding and decoding data in various formats. These utilities are optimized for performance, compatibility, and security across Node.js and browser environments.

## Key Features

- **Cross-Platform Compatibility**: Supports Node.js, browsers, and other JavaScript environments.
- **Multiple Encoding Formats**: Includes Hex, Binary, Base64, Base58, Base32, and Octal.
- **Security**: Implements input validation and error handling for all operations.
- **Performance**: Utilizes native implementations with secure fallbacks.
- **Flexibility**: Offers customizable options for separators, padding, and case sensitivity.

## Supported Encoding Formats

- **Hexadecimal (Hex)**: Suitable for cryptographic keys and binary data representation.
- **Binary**: Useful for bit manipulation and debugging.
- **Base64**: Standard for data transmission and storage.
- **Base58**: Ideal for user-friendly identifiers, such as in cryptocurrency applications.
- **Base32**: RFC 4648 compliant, designed for case-insensitive systems.
- **Octal**: Base-8 encoding for specific use cases.

## Quick Start

```typescript
import {
    bufferToHex,
    hexToBuffer,
    bufferToBase64,
    base64ToBuffer,
    bufferToBase58,
    base58ToBuffer,
    stringToBuffer,
    bufferToString,
} from "fortify2-js/utils/encoding";

const data = stringToBuffer("Hello, World!");
const hex = bufferToHex(data);
const base64 = bufferToBase64(data);
const base58 = bufferToBase58(data);

console.log("Hex:", hex); // "48656c6c6f2c20576f726c6421"
console.log("Base64:", base64); // "SGVsbG8sIFdvcmxkIQ=="
console.log("Base58:", base58); // "72k1xXWG59fYdzuwFe7v"
```

## API Reference

### Hexadecimal Utilities

#### `bufferToHex(buffer, uppercase?, separator?)`

Converts a buffer to a hexadecimal string.

**Parameters:**
- `buffer: Uint8Array` - Input buffer
- `uppercase?: boolean` - Use uppercase letters (default: false)
- `separator?: string` - Optional byte separator

**Examples:**
```typescript
const data = new Uint8Array([72, 101, 108, 108, 111]);

bufferToHex(data); // "48656c6c6f"
bufferToHex(data, true); // "48656C6C6F"
bufferToHex(data, false, ":"); // "48:65:6c:6c:6f"
```

#### `hexToBuffer(hex)`

Converts a hexadecimal string to a buffer.

**Parameters:**
- `hex: string` - Hexadecimal string

**Examples:**
```typescript
hexToBuffer("48656c6c6f"); // Uint8Array([72, 101, 108, 108, 111])
hexToBuffer("48:65:6c:6c:6f"); // Uint8Array([72, 101, 108, 108, 111])
```

### Base64 Utilities

#### `bufferToBase64(buffer, urlSafe?)`

Converts a buffer to a Base64 string.

**Parameters:**
- `buffer: Uint8Array` - Input buffer
- `urlSafe?: boolean` - Use URL-safe Base64 (default: false)

**Examples:**
```typescript
const data = stringToBuffer("Hello, World!");

bufferToBase64(data); // "SGVsbG8sIFdvcmxkIQ=="
bufferToBase64(data, true); // "SGVsbG8sIFdvcmxkIQ"
```

#### `base64ToBuffer(base64, urlSafe?)`

Converts a Base64 string to a buffer.

**Parameters:**
- `base64: string` - Base64 string
- `urlSafe?: boolean` - Input is URL-safe (default: false)

### Base58 Utilities

#### `bufferToBase58(buffer)`

Converts a buffer to a Base58 string.

**Examples:**
```typescript
const data = stringToBuffer("Hello");
bufferToBase58(data); // "9Ajdvzr"
```

#### `base58ToBuffer(base58)`

Converts a Base58 string to a buffer.

### Base32 Utilities

#### `bufferToBase32(buffer, padding?)`

Converts a buffer to a Base32 string (RFC 4648).

**Parameters:**
- `buffer: Uint8Array` - Input buffer
- `padding?: boolean` - Include padding (default: true)

**Examples:**
```typescript
const data = stringToBuffer("Hello");
bufferToBase32(data); // "JBSWY3DP"
```

### Binary Utilities

#### `bufferToBinary(buffer, separator?)`

Converts a buffer to a binary string.

**Examples:**
```typescript
const data = new Uint8Array([72, 101]);
bufferToBinary(data); // "0100100001100101"
bufferToBinary(data, " "); // "01001000 01100101"
```

#### `numberToBinary(num, bits?)`

Converts a number to a binary string.

**Parameters:**
- `num: number` - Input number
- `bits?: number` - Number of bits (default: 8)

**Examples:**
```typescript
numberToBinary(42); // "00101010"
numberToBinary(42, 16); // "0000000000101010"
```

### String Utilities

#### `stringToBuffer(str)`

Converts a string to a buffer using UTF-8 encoding.

#### `bufferToString(buffer)`

Converts a buffer to a string using UTF-8 decoding.

#### `stringToHex(str, uppercase?, separator?)`

Converts a string directly to hexadecimal.

#### `hexToString(hex)`

Converts hexadecimal to a string.

## Security Features

- **Input Validation**: Ensures correct format, length, and character set.
- **Cross-Platform Safety**: Consistent behavior across environments with secure fallbacks.
- **Memory Safety**: Prevents leaks and ensures proper buffer management.

## Performance Optimizations

- **Native Implementations**: Uses `Buffer` in Node.js and `btoa`/`atob` in browsers.
- **Efficient Algorithms**: Optimized for Base58 and binary conversions.
- **Minimal Memory Usage**: Reduces allocation overhead.

## Advanced Usage

### Custom Separators

```typescript
bufferToHex(macBytes, false, ":"); // "aa:bb:cc:dd:ee:ff"
bufferToBinary(data, " "); // "01001000 01100101"
```

### URL-Safe Base64

```typescript
const standard = bufferToBase64(data); // "SGVsbG8+/w=="
const urlSafe = bufferToBase64(data, true); // "SGVsbG8-_w"
```

### Error Handling

```typescript
try {
    const buffer = hexToBuffer("invalid-hex");
} catch (error) {
    console.error("Invalid hex string:", error.message);
}
```

## Testing and Validation

- Comprehensive unit tests
- Round-trip conversion validation
- Cross-platform compatibility tests
- Performance benchmarks
- Security validation

## Best Practices

1. Validate input before encoding/decoding.
2. Choose appropriate encoding for the use case (e.g., Base64 for APIs, Base58 for identifiers).
3. Use try-catch blocks for error handling.
4. Consider performance for large datasets.
5. Use URL-safe Base64 for web applications.

## Integration with FortifyJS

```typescript
import { SecureRandom, Hash } from "fortify2-js";
import { bufferToHex, bufferToBase58 } from "fortify2-js/utils/encoding";

const randomBytes = SecureRandom.getRandomBytes(32);
const hexKey = bufferToHex(randomBytes);
const base58Id = bufferToBase58(randomBytes);

const hash = Hash.createSecureHash("data", randomBytes, {
    outputFormat: "hex",
});
```