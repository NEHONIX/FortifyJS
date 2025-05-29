# FortifyJS API Documentation

## Overview

FortifyJS provides a comprehensive suite of security utilities for JavaScript applications with enterprise-grade encryption capabilities. This document covers the complete API reference for all components.

## Core Components

### SecureArray

The `SecureArray` class provides a secure, encrypted array implementation with automatic memory management and transparent encryption/decryption.

#### Constructor

```typescript
fArray<T>(initialData?: T[]): SecureArray<T>
```

Creates a new SecureArray instance with optional initial data.

**Parameters:**

-   `initialData` (optional): Array of initial values

**Example:**

```typescript
import { fArray } from "fortify2-js";

const secureData = fArray(["item1", "item2", "item3"]);
```

#### Encryption Methods

##### setEncryptionKey(key: string): void

Sets the encryption key for the array. Required before calling encryption methods.

**Parameters:**

-   `key`: Encryption key string

**Example:**

```typescript
secureData.setEncryptionKey("my-secure-key-2025");
```

##### encryptAll(): this

Encrypts all elements in the array using AES-256-CTR-HMAC encryption.

**Returns:** The SecureArray instance for method chaining

**Throws:** Error if encryption key is not set

**Example:**

```typescript
secureData.setEncryptionKey("my-key");
secureData.encryptAll();
```

##### getEncryptionStatus(): EncryptionStatus

Returns the current encryption status and configuration.

**Returns:** Object containing encryption information

**Example:**

```typescript
const status = secureData.getEncryptionStatus();
console.log(status.hasEncryptionKey); // true
console.log(status.algorithm); // 'AES-256-CTR-HMAC'
```

#### Data Access Methods

##### get(index: number): T | undefined

Gets an element at the specified index with automatic decryption.

**Parameters:**

-   `index`: Array index

**Returns:** The decrypted element or undefined

**Example:**

```typescript
const value = secureData.get(0); // Automatically decrypted
```

##### set(index: number, value: T): this

Sets an element at the specified index.

**Parameters:**

-   `index`: Array index
-   `value`: Value to set

**Returns:** The SecureArray instance

**Example:**

```typescript
secureData.set(0, "new value");
```

##### push(...items: T[]): number

Adds elements to the end of the array.

**Parameters:**

-   `items`: Elements to add

**Returns:** New array length

**Example:**

```typescript
const newLength = secureData.push("item4", "item5");
```

#### Raw Data Access (for verification)

##### getRawEncryptedData(): any[]

Returns the raw encrypted data array for verification purposes.

**Returns:** Array containing encrypted data

**Example:**

```typescript
const rawData = secureData.getRawEncryptedData();
console.log(rawData[0]); // '[ENCRYPTED:base64data...]'
```

##### getRawEncryptedElement(index: number): any

Returns the raw encrypted form of a specific element.

**Parameters:**

-   `index`: Array index

**Returns:** Raw encrypted data

**Example:**

```typescript
const encrypted = secureData.getRawEncryptedElement(0);
```

#### Serialization Methods

##### serialize(options?: SerializationOptions): string

Serializes the array with optional encryption and metadata.

**Parameters:**

-   `options` (optional): Serialization configuration

**Returns:** Serialized string

**Example:**

```typescript
const serialized = secureData.serialize({
    encryptSensitive: true,
    includeMetadata: true,
    format: "json",
});
```

##### toArray(): T[]

Converts the SecureArray to a regular array with automatic decryption.

**Returns:** Array of decrypted values

**Example:**

```typescript
const plainArray = secureData.toArray();
```

#### Utility Methods

##### getStats(): ArrayStats

Returns statistics about the array including memory usage and security status.

**Returns:** Statistics object

**Example:**

```typescript
const stats = secureData.getStats();
console.log(stats.memoryUsage); // Memory usage in bytes
console.log(stats.secureElements); // Number of secure elements
```

### SecureObject

The `SecureObject` class provides secure object storage with property-level encryption and comprehensive data protection.

#### Constructor

```typescript
fObject<T extends Record<string, any>>(initialData?: T): SecureObject<T>
```

Creates a new SecureObject instance with optional initial data.

**Parameters:**

-   `initialData` (optional): Initial object data

**Example:**

```typescript
import { fObject } from "fortify2-js";

const secureObj = fObject({
    username: "admin",
    password: "secret123",
    apiKey: "abc-def-ghi",
});
```

#### Encryption Methods

##### setEncryptionKey(key: string): void

Sets the encryption key for the object.

**Parameters:**

-   `key`: Encryption key string

**Example:**

```typescript
secureObj.setEncryptionKey("my-secure-key-2025");
```

##### encryptAll(): this

Encrypts all properties in the object using AES-256-CTR-HMAC encryption.

**Returns:** The SecureObject instance

**Example:**

```typescript
secureObj.setEncryptionKey("my-key");
secureObj.encryptAll();
```

##### getEncryptionStatus(): EncryptionStatus

Returns the current encryption status and configuration.

**Returns:** Object containing encryption information

#### Data Access Methods

##### get<K extends keyof T>(key: K): T[K]

Gets a property value with automatic decryption.

**Parameters:**

-   `key`: Property key

**Returns:** The decrypted property value

**Example:**

```typescript
const username = secureObj.get("username"); // Automatically decrypted
```

##### set<K extends keyof T>(key: K, value: T[K]): this

Sets a property value.

**Parameters:**

-   `key`: Property key
-   `value`: Value to set

**Returns:** The SecureObject instance

**Example:**

```typescript
secureObj.set("password", "new-password");
```

#### Raw Data Access

##### getRawEncryptedData(): Map<string, any>

Returns the raw encrypted data map for verification.

**Returns:** Map containing encrypted data

**Example:**

```typescript
const rawData = secureObj.getRawEncryptedData();
```

##### getRawEncryptedValue(key: string): any

Returns the raw encrypted form of a specific property.

**Parameters:**

-   `key`: Property key

**Returns:** Raw encrypted data

**Example:**

```typescript
const encrypted = secureObj.getRawEncryptedValue("password");
```

#### Serialization Methods

##### serialize(options?: SerializationOptions): string

Serializes the object with optional encryption and metadata.

**Parameters:**

-   `options` (optional): Serialization configuration

**Returns:** Serialized string

**Example:**

```typescript
const serialized = secureObj.serialize({
    encryptSensitive: true,
    includeMetadata: true,
});
```

##### exportData(options?: ExportOptions): string

Exports object data in various formats (JSON, CSV, XML, YAML).

**Parameters:**

-   `options` (optional): Export configuration

**Returns:** Exported data string

**Example:**

```typescript
const csvData = secureObj.exportData({
    format: "csv",
    encryptSensitive: true,
});
```

##### toObject(): T

Converts the SecureObject to a regular object with automatic decryption.

**Returns:** Plain object with decrypted values

**Example:**

```typescript
const plainObject = secureObj.toObject();
```

## Type Definitions

### SerializationOptions

```typescript
interface SerializationOptions {
    encryptSensitive?: boolean;
    includeMetadata?: boolean;
    format?: "json" | "binary";
}
```

### ExportOptions

```typescript
interface ExportOptions {
    format: "json" | "csv" | "xml" | "yaml";
    encryptSensitive?: boolean;
    includeHeaders?: boolean;
}
```

### EncryptionStatus

```typescript
interface EncryptionStatus {
    hasEncryptionKey: boolean;
    algorithm: string;
    keyDerivationRounds: number;
    encryptedElements: number;
}
```

### ArrayStats

```typescript
interface ArrayStats {
    length: number;
    memoryUsage: number;
    secureElements: number;
    lastAccessed: Date;
    lastModified: Date;
}
```

## Error Handling

### Common Errors

#### EncryptionKeyNotSetError

Thrown when attempting encryption operations without setting an encryption key.

#### DecryptionFailedError

Thrown when decryption fails due to invalid key or corrupted data.

#### InvalidIndexError

Thrown when accessing array elements with invalid indices.

#### ReadOnlyError

Thrown when attempting to modify read-only instances.

### Error Handling Best Practices

```typescript
try {
    secureData.encryptAll();
} catch (error) {
    if (error.message.includes("Encryption key must be set")) {
        console.error("Please set encryption key first");
        secureData.setEncryptionKey("your-key");
        secureData.encryptAll();
    }
}
```

## Performance Considerations

### Memory Usage

-   Encryption adds 5-15% memory overhead
-   Automatic cleanup prevents memory leaks
-   Optimized for large datasets

### Processing Speed

-   Real-time encryption/decryption
-   Minimal performance impact for typical use cases
-   Scales linearly with data size

### Best Practices

-   Set encryption keys once and reuse
-   Use batch operations for multiple changes
-   Monitor memory usage in production
-   Implement proper error handling

## Security Notes

### Encryption Details

-   **Algorithm**: AES-256-CTR with HMAC-SHA256
-   **Key Derivation**: PBKDF2 with configurable rounds
-   **IV Generation**: Cryptographically secure random IVs
-   **Authentication**: HMAC prevents tampering

### Security Best Practices

-   Use strong, randomly generated keys
-   Implement proper key management
-   Regular security audits
-   Keep FortifyJS updated

## Version Compatibility

This API documentation is for FortifyJS v4.0.4 and later. For previous versions, please refer to the version-specific documentation.

## Support

For additional support:

-   Check the [Encryption Enhancements Guide](./ENCRYPTION_ENHANCEMENTS.md)
-   Review the [Changelog](../CHANGELOG.md)
-   Submit issues on GitHub
-   Contact the development team

