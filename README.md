# 🔒 FortifyJS

[![npm version](https://badge.fury.io/js/FortifyJS.svg)](https://badge.fury.io/js/FortifyJS)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://badges.frapsoft.com/typescript/code/typescript.svg?v=101)](https://github.com/ellerbrock/typescript-badges/)
[![Build Status](https://github.com/nehonix/FortifyJS/workflows/CI/badge.svg)](https://github.com/nehonix/FortifyJS/actions)
[![codecov](https://codecov.io/gh/nehonix/FortifyJS/branch/main/graph/badge.svg)](https://codecov.io/gh/nehonix/FortifyJS)

> **Enterprise-grade cryptographic security library with zero dependencies**

FortifyJS is a comprehensive cryptographic security library that provides secure token generation, advanced hashing, key derivation, and password utilities. Built with TypeScript and designed for maximum security, performance, and developer experience.

## ✨ Features

### 🎯 **Core Security Operations**

-   **Secure Token Generation** - Cryptographically secure tokens with customizable entropy
-   **Advanced Hashing** - SHA-256/512 with salt, pepper, and iterations
-   **Key Derivation** - PBKDF2 implementation for password-based keys
-   **Password Security** - Strength validation and secure generation

### 🚀 **Specialized Generators**

-   **API Keys** - Timestamped and entropy-enhanced API keys
-   **JWT Secrets** - High-entropy secrets for JSON Web Tokens
-   **Session Tokens** - Secure session management tokens
-   **TOTP Secrets** - Time-based one-time password secrets

### 🛡️ **Advanced Security Features**

-   **Side-Channel Protection** - Constant-time operations to prevent timing attacks
-   **Memory-Hard Key Derivation** - Argon2 and Balloon algorithms resistant to hardware attacks
-   **Post-Quantum Cryptography** - Lamport signatures and Ring-LWE encryption
-   **Secure Memory Management** - Auto-zeroing buffers and explicit memory clearing
-   **Entropy Augmentation** - Enhanced randomness from multiple sources
-   **Canary Tokens** - Detect unauthorized access and data breaches
-   **Cryptographic Attestation** - Verify data authenticity and environment integrity
-   **Runtime Security Verification** - Detect debuggers, tampering, and security threats
-   **Secure Serialization** - Protection against prototype pollution and object injection
-   **Tamper-Evident Logging** - Cryptographically linked logs that detect modification

### 🔧 **Developer Experience**

-   **Zero Dependencies** - Pure JavaScript/TypeScript implementation
-   **Cross-Platform** - Works in Node.js, browsers, and edge environments
-   **TypeScript First** - Complete type definitions included
-   **Framework Integration** - Express, Fastify middleware included

### 📊 **Security & Monitoring**

-   **Built-in Testing** - Security validation and randomness tests
-   **Performance Monitoring** - Operation statistics and metrics
-   **Security Analysis** - Password strength and vulnerability assessment
-   **Health Checks** - Cryptographic integrity verification

## 📦 Installation

```bash
npm install fortify-js
```

```bash
yarn add FortifyJS
```

```bash
pnpm add FortifyJS
```

## 🚀 Quick Start

```typescript
import { FortifyJS } from "FortifyJS";

// Generate a secure token
const token = FortifyJS.generateSecureToken({
    length: 32,
    entropy: "maximum",
});
console.log(token);
// Output: "aK7mN9pQ2rS8tU3vW6xY1zB4cD5eF7gH"

// Create an API key
const apiKey = FortifyJS.generateAPIKey("myapp");
console.log(apiKey);
// Output: "myapp_1a2b3c4d_xY9zA8bC7dE6fG5hI4jK3lM"

// Hash with security
const hash = FortifyJS.secureHash("my-password", {
    algorithm: "sha256",
    iterations: 10000,
    salt: "random-salt",
});
console.log(hash);
// Output: "5e884898da28047151d0e56f8dc6292..."
```

## 📖 Complete API Reference

### 🔐 Token Generation

#### `generateSecureToken(options?)`

Generate cryptographically secure tokens with customizable options.

```typescript
const token = FortifyJS.generateSecureToken({
    length: 32, // Token length (default: 32)
    includeUppercase: true, // Include uppercase letters (default: true)
    includeLowercase: true, // Include lowercase letters (default: true)
    includeNumbers: true, // Include numbers (default: true)
    includeSymbols: false, // Include symbols (default: false)
    excludeSimilarCharacters: false, // Exclude similar characters (default: false)
    entropy: "high", // Entropy level: standard|high|maximum (default: high)
});
```

#### `generateAPIKey(prefix?)`

Generate API keys with timestamp and high entropy.

```typescript
const apiKey = FortifyJS.generateAPIKey("myservice");
// Returns: "myservice_1a2b3c4d_highEntropyRandomPart"
```

#### `generateJWTSecret(length?)`

Generate high-entropy secrets suitable for JWT signing.

```typescript
const secret = FortifyJS.generateJWTSecret(64);
// Returns 64-character secret with maximum entropy
```

#### `generateSessionToken()`

Generate secure session tokens with built-in signatures.

```typescript
const sessionToken = FortifyJS.generateSessionToken();
// Returns: "timestamp.nonce.entropy.signature"
```

#### `generateTOTPSecret()`

Generate TOTP secrets encoded in Base32 for authenticator apps.

```typescript
const totpSecret = FortifyJS.generateTOTPSecret();
// Returns: "JBSWY3DPEHPK3PXP" (Base32 encoded)
```

### 🔨 Hashing & Key Derivation

#### `secureHash(input, options?)`

Advanced hashing with multiple algorithms and security features.

```typescript
const hash = FortifyJS.secureHash("sensitive-data", {
    algorithm: "sha256", // Algorithm: sha256|sha512|sha3|blake3
    iterations: 100000, // Hash iterations (default: 1)
    salt: "custom-salt", // Salt for security (optional)
    pepper: "app-pepper", // Application pepper (optional)
    outputFormat: "hex", // Output: hex|base64|base58
});
```

#### `deriveKey(input, options?)`

Derive cryptographic keys from passwords or other inputs using industry-standard algorithms.

```typescript
const key = FortifyJS.deriveKey("password", {
    algorithm: "pbkdf2", // Algorithm: pbkdf2|scrypt|argon2
    iterations: 100000, // Iterations (default: 100000)
    salt: new TextEncoder().encode("salt"), // Salt (optional)
    keyLength: 32, // Key length in bytes (default: 32)
    hashFunction: "sha256", // Hash function: sha256|sha512
});

// The implementation uses real cryptographic libraries:
// - Node.js crypto for server environments
// - pbkdf2, scrypt-js, or argon2 packages when available
// - Pure JS implementation as fallback with security warnings
```

### 🛡️ Security Analysis

#### `calculatePasswordStrength(password)`

Comprehensive password strength analysis with crack time estimation.

```typescript
const analysis = FortifyJS.calculatePasswordStrength("MyP@ssw0rd123");

console.log(analysis);
// {
//   score: 85,
//   feedback: ['Consider using more symbols'],
//   estimatedCrackTime: 'Centuries'
// }
```

#### `runSecurityTests()`

Built-in security validation and randomness testing.

```typescript
const testResults = FortifyJS.runSecurityTests();

console.log(testResults);
// {
//   passed: 3,
//   failed: 0,
//   results: [
//     { test: 'Token Uniqueness', passed: true, message: 'All tokens unique' },
//     { test: 'Hash Consistency', passed: true, message: 'Hashes are consistent' },
//     { test: 'Randomness Distribution', passed: true, message: 'Good randomness distribution' }
//   ]
// }
```

### 📊 Monitoring & Statistics

#### `getStats()`

Get detailed cryptographic operation statistics.

```typescript
const stats = FortifyJS.getStats();

console.log(stats);
// {
//   tokensGenerated: 1250,
//   hashesComputed: 890,
//   keysDerivated: 45,
//   averageEntropyBits: 256.8,
//   lastOperationTime: '2025-05-20T10:30:00.000Z'
// }
```

### 🛡️ Advanced Security Features

#### Side-Channel Attack Protection

```typescript
// Constant-time comparison to prevent timing attacks
const isEqual = FortifyJS.constantTimeEqual("password123", userInput);

// Secure modular exponentiation for cryptographic operations
const result = FortifyJS.secureModPow(base, exponent, modulus);

// Fault-resistant comparison to prevent fault injection attacks
const isValid = FortifyJS.faultResistantEqual(buffer1, buffer2);
```

#### Memory-Hard Key Derivation

```typescript
// Derive a key using memory-hard Argon2
const argon2Result = FortifyJS.deriveKey("password", {
    algorithm: "argon2",
    iterations: 4, // Time cost parameter
    salt: FortifyJS.generateSecureToken({ length: 16, outputFormat: "buffer" }),
    keyLength: 32,
});

// Derive a key using memory-hard Scrypt
const scryptResult = FortifyJS.deriveKey("password", {
    algorithm: "scrypt",
    iterations: 14, // Cost parameter (N = 2^cost)
    salt: FortifyJS.generateSecureToken({ length: 16, outputFormat: "buffer" }),
    keyLength: 32,
});

// The implementation uses real cryptographic libraries:
// - argon2 package in Node.js environments
// - scrypt-js or Node.js crypto.scryptSync as alternatives
// - Automatic fallback to more secure options when available
```

#### Post-Quantum Cryptography

```typescript
// Generate a Lamport one-time signature key pair (hash-based)
const lamportKeypair = FortifyJS.generateLamportKeyPair();

// Sign a message with Lamport signature
const signature = FortifyJS.lamportSign(message, lamportKeypair.privateKey);

// Verify a Lamport signature
const isValid = FortifyJS.lamportVerify(
    message,
    signature,
    lamportKeypair.publicKey
);

// Generate a Kyber key pair (lattice-based)
const kyberKeypair = FortifyJS.generateKyberKeyPair({
    securityLevel: 3, // 1, 3, or 5 (higher = more security)
});

// Encapsulate a shared secret using Kyber
const encapsulation = FortifyJS.kyberEncapsulate(kyberKeypair.publicKey);
const ciphertext = encapsulation.ciphertext;
const sharedSecret = encapsulation.sharedSecret;

// Decapsulate a shared secret using Kyber
const decapsulation = FortifyJS.kyberDecapsulate(
    kyberKeypair.privateKey,
    ciphertext
);

// The implementation uses real cryptographic libraries:
// - kyber-crystals or pqc-kyber packages when available
// - Fallback implementations with proper lattice operations
// - Automatic security level selection based on requirements
```

#### Secure Memory Management

```typescript
// Create a secure buffer that auto-zeros when destroyed
const secureBuffer = FortifyJS.createSecureBuffer(32);
secureBuffer.getBuffer().set(sensitiveData);
// Use the buffer...
secureBuffer.destroy(); // Automatically zeros memory with multiple passes

// Create a secure string that can be explicitly cleared
const secureString = FortifyJS.createSecureString("sensitive password");
// Use the string...
secureString.clear(); // Explicitly clear from memory

// Create a secure object for sensitive data
const secureObject = FortifyJS.createSecureObject({
    username: "admin",
    password: "secret123",
    apiKey: "abcdef123456",
});
// Use the object...
secureObject.clear(); // Clear all sensitive data

// Securely wipe a buffer with multiple overwrite patterns
FortifyJS.secureWipe(buffer, 0, buffer.length, 3);

// The implementation uses real secure memory techniques:
// - Multi-pass overwriting with different patterns
// - Protection against compiler optimizations
// - Automatic cleanup with finalizers when possible
// - Constant-time operations to prevent timing attacks
```

#### Canary Tokens & Breach Detection

```typescript
// Create a canary token
const canaryToken = FortifyJS.createCanaryToken({
    callback: (context) => console.log("Canary triggered!", context),
});

// Create a canary object that triggers when accessed
const canaryObject = FortifyJS.createCanaryObject(sensitiveData);

// Create a canary function that triggers when called
const canaryFunction = FortifyJS.createCanaryFunction(originalFunction);

// Manually trigger a canary
FortifyJS.triggerCanaryToken(canaryToken, { source: "manual" });
```

#### Runtime Security Verification

```typescript
// Verify the security of the runtime environment
const securityResult = FortifyJS.verifyRuntimeSecurity({
    checkDebugger: true,
    checkExtensions: true,
    checkEnvironment: true,
    checkRandom: true,
});

console.log(`Security score: ${securityResult.score}/100`);
```

#### Tamper-Evident Logging

```typescript
// Create a tamper-evident logger
const logger = FortifyJS.createTamperEvidentLogger("secret-key");

// Log events with different levels
logger.info("System initialized");
logger.warning("Unusual login attempt", { ip: "192.168.1.100" });
logger.error("Database connection failed", { error: "Timeout" });

// Verify the integrity of the log chain
const verificationResult = logger.verify();
console.log(`Log chain valid: ${verificationResult.valid}`);
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run security tests
npm run test:security

# Run benchmarks
npm run benchmark
```

## 📝 License

MIT License - see the [LICENSE](LICENSE) file for details.

## 🙋 Support

-   📖 **Documentation**: [lab.nehonix.space/FortifyJS](https://lab.nehonix.space/FortifyJS)
-   🐛 **Bug Reports**: [GitHub Issues](https://github.com/nehonix/FortifyJS/issues)
-   💬 **Discussions**: [GitHub Discussions](https://github.com/nehonix/FortifyJS/discussions)
-   📧 **Email**: support@nehonix.com

## 🔮 Roadmap

### Version 1.1.0

-   [x] Argon2 key derivation
-   [ ] Ed25519 signature support
-   [ ] Hardware security module integration
-   [ ] WebCrypto API optimization

### Version 1.2.0

-   [x] Post-quantum cryptography algorithms
-   [x] Advanced entropy analysis
-   [ ] Performance optimizations
-   [ ] Mobile-specific optimizations

### Version 1.3.0

-   [ ] Homomorphic encryption support
-   [ ] Secure multi-party computation
-   [ ] Threshold cryptography
-   [ ] Zero-knowledge proofs

---

<div align="center">

**Built with ❤️ by [NEHONIX](https://nehonix.com)**

[⭐ Star us on GitHub](https://github.com/nehonix/FortifyJS) | [📦 View on npm](https://www.npmjs.com/package/FortifyJS) | [🌐 Visit our website](https://lab.nehonix.space)

</div>
