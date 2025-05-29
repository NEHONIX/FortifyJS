# FortifyJS Encryption Enhancements

## Overview

FortifyJS v4.0.4 introduces comprehensive encryption capabilities across all core components, providing enterprise-grade security for JavaScript applications. This document outlines the enhanced encryption features and implementation details.

## Enhanced Encryption Architecture

### Core Components

#### SecureArray Encryption
- **AES-256-CTR-HMAC**: Industry-standard encryption with authentication
- **Transparent Operations**: Automatic encryption/decryption during data access
- **Type Preservation**: Maintains original data types through encryption cycles
- **Memory Efficiency**: Optimized memory usage during cryptographic operations

#### SecureObject Encryption
- **Property-Level Encryption**: Individual property encryption with metadata preservation
- **Complex Data Support**: Full support for nested objects, arrays, and primitive types
- **Serialization Integration**: Seamless encryption during serialization processes
- **Multi-Format Export**: Encrypted data export in JSON, CSV, XML, and YAML formats

### Security Features

#### Cryptographic Standards
- **Algorithm**: AES-256-CTR with HMAC-SHA256 authentication
- **Key Derivation**: PBKDF2 with configurable iterations
- **Initialization Vectors**: Unique IV generation for each encryption operation
- **Data Integrity**: HMAC-based authentication prevents tampering

#### Memory Protection
- **Secure Allocation**: Protected memory allocation for sensitive data
- **Automatic Cleanup**: Secure memory wiping after use
- **Buffer Management**: Enhanced buffer handling for cryptographic operations
- **Side-Channel Protection**: Constant-time operations where applicable

## API Reference

### SecureArray Encryption

#### Basic Usage
```typescript
import { fArray } from 'fortifyjs';

const secureData = fArray(['sensitive1', 'sensitive2', 'sensitive3']);
secureData.setEncryptionKey('your-encryption-key');
secureData.encryptAll();

// Data is automatically decrypted on access
console.log(secureData.get(0)); // 'sensitive1'
```

#### Advanced Operations
```typescript
// Check encryption status
const status = secureData.getEncryptionStatus();
console.log(status.hasEncryptionKey); // true
console.log(status.algorithm); // 'AES-256-CTR-HMAC'

// Access raw encrypted data for verification
const rawData = secureData.getRawEncryptedData();
console.log(rawData[0]); // '[ENCRYPTED:base64data...]'

// Get specific encrypted element
const encryptedElement = secureData.getRawEncryptedElement(0);
```

### SecureObject Encryption

#### Basic Usage
```typescript
import { fObject } from 'fortifyjs';

const secureObj = fObject({
    username: 'admin',
    password: 'secret123',
    apiKey: 'abc-def-ghi'
});

secureObj.setEncryptionKey('your-encryption-key');
secureObj.encryptAll();

// Transparent access to encrypted data
console.log(secureObj.get('username')); // 'admin'
```

#### Advanced Features
```typescript
// Serialization with encryption
const serialized = secureObj.serialize({
    encryptSensitive: true,
    includeMetadata: true,
    format: 'json'
});

// Multi-format export
const csvData = secureObj.exportData({
    format: 'csv',
    encryptSensitive: true
});

// Raw encrypted data access
const rawData = secureObj.getRawEncryptedData();
const rawValue = secureObj.getRawEncryptedValue('password');
```

## Implementation Details

### Encryption Process

#### Data Flow
1. **Key Setup**: Encryption key is derived using PBKDF2
2. **IV Generation**: Unique initialization vector created for each operation
3. **Encryption**: Data encrypted using AES-256-CTR
4. **Authentication**: HMAC-SHA256 signature generated
5. **Packaging**: Encrypted data packaged with metadata
6. **Storage**: Encrypted package stored with identification markers

#### Data Format
```json
{
  "iv": "hexadecimal_initialization_vector",
  "data": "base64_encrypted_data",
  "algorithm": "AES-256-CTR-HMAC",
  "timestamp": 1748513274023
}
```

### Performance Characteristics

#### Memory Usage
- **Encryption Overhead**: Minimal memory increase (typically <10%)
- **Processing Speed**: Optimized for real-time applications
- **Scalability**: Efficient handling of large datasets
- **Resource Management**: Automatic cleanup and garbage collection

#### Benchmarks
- **Small Data (< 1KB)**: < 1ms encryption time
- **Medium Data (1-100KB)**: < 10ms encryption time
- **Large Data (> 100KB)**: Linear scaling with data size
- **Memory Overhead**: 5-15% increase depending on data type

## Security Considerations

### Best Practices

#### Key Management
- Use strong, randomly generated encryption keys
- Implement proper key rotation policies
- Store keys securely, separate from encrypted data
- Consider using key derivation from user credentials

#### Data Handling
- Encrypt sensitive data immediately after creation
- Use secure channels for key transmission
- Implement proper access controls
- Regular security audits and updates

#### Production Deployment
- Enable encryption for all sensitive data
- Monitor encryption status and performance
- Implement proper error handling
- Regular backup and recovery testing

### Threat Model

#### Protected Against
- **Data Breaches**: Encrypted data remains protected even if compromised
- **Memory Dumps**: Sensitive data encrypted in memory
- **Side-Channel Attacks**: Constant-time operations where applicable
- **Tampering**: HMAC authentication detects data modification

#### Considerations
- **Key Compromise**: Encrypted data vulnerable if keys are compromised
- **Implementation Bugs**: Regular updates and security patches required
- **Physical Access**: Additional protections needed for physical security
- **Social Engineering**: User education and access controls important

## Migration Guide

### From Previous Versions

#### Compatibility
- Existing applications continue to work without changes
- New encryption features are opt-in
- Gradual migration path available
- Backward compatibility maintained

#### Upgrade Steps
1. Update to FortifyJS v4.0.4
2. Add encryption keys to existing SecureArray/SecureObject instances
3. Call `encryptAll()` method to enable encryption
4. Update serialization calls to include encryption options
5. Test thoroughly in development environment

### Code Examples

#### Before (v4.0.3)
```typescript
const data = fArray(['item1', 'item2']);
const serialized = data.serialize();
```

#### After (v4.0.4)
```typescript
const data = fArray(['item1', 'item2']);
data.setEncryptionKey('secure-key');
data.encryptAll();
const serialized = data.serialize({
    encryptSensitive: true,
    includeMetadata: true
});
```

## Troubleshooting

### Common Issues

#### Encryption Key Not Set
```
Error: Encryption key must be set before calling encryptAll()
```
**Solution**: Call `setEncryptionKey()` before `encryptAll()`

#### Decryption Failures
```
Error: Failed to decrypt value at index 0
```
**Solution**: Verify encryption key matches the key used for encryption

#### Memory Issues
```
Error: Insufficient memory for encryption operation
```
**Solution**: Optimize data size or increase available memory

### Performance Optimization

#### Large Datasets
- Process data in chunks for very large datasets
- Use streaming operations where possible
- Monitor memory usage during encryption
- Implement proper cleanup procedures

#### High-Frequency Operations
- Cache encryption keys to avoid repeated derivation
- Use batch operations where possible
- Monitor performance metrics
- Optimize based on usage patterns

## Support

For technical support and questions:
- Review the [API Documentation](./API.md)
- Check the [FAQ](./FAQ.md)
- Submit issues on GitHub
- Contact the development team

## Changelog

See [CHANGELOG.md](../CHANGELOG.md) for detailed version history and updates.
