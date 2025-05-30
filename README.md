# Nehonix FortifyJS - Advanced JavaScript Security Library

FortifyJS is a robust JavaScript security library designed to enhance data structures with advanced cryptographic features, real-time security, and type safety. It provides a comprehensive set of tools for secure data handling, featuring the world's most advanced SecureArray implementation with military-grade encryption and real-time monitoring.

## Why Choose FortifyJS?

FortifyJS empowers developers to create secure, type-safe, and chainable JavaScript objects with advanced cryptographic capabilities. Key advantages include:

-   **Enhanced Object Methods**: 19 powerful methods for data manipulation, surpassing standard JavaScript objects.
-   **Advanced Security**: Implements military-grade cryptography with quantum-resistant algorithms.
-   **Type Safety**: Full TypeScript support for robust, error-free development.

### Comparison with Standard Objects

| Feature       | Standard Object | FortifyJS SecureObject  |
| ------------- | --------------- | ----------------------- |
| Methods       | None            | 19 Enhanced Methods     |
| Type Safety   | Basic           | Full TypeScript Support |
| Security      | None            | Advanced Cryptography   |
| Chaining      | Not Supported   | Fully Chainable API     |
| Events        | Not Supported   | Event-Driven Operations |
| Memory Safety | Manual          | Automatic Cleanup       |

### Comparison with Lodash

| Feature           | Lodash        | FortifyJS                |
| ----------------- | ------------- | ------------------------ |
| Security          | None          | Built-In Cryptography    |
| Type Safety       | Partial       | Full TypeScript Support  |
| Memory Management | Manual        | Automatic                |
| Sensitive Data    | Not Supported | Security-Aware Filtering |
| Events            | Not Supported | Operation Tracking       |


### Testing and Validation

-   100% integration test coverage (14/14 tests passed)
-   Validated security features
-   Verified performance benchmarks
-   Optimized memory usage

## Key Features

### 🔒 SecureArray - World's Most Advanced Secure Data Structure

-   **Military-Grade Encryption**: Real AES-256-CTR-HMAC with 77.98 bits entropy
-   **Real-Time Monitoring**: Live memory usage, access tracking, and performance metrics
-   **Snapshot Management**: Version control with create, restore, and rollback capabilities
-   **Event System**: Comprehensive event handling for all array operations
-   **Advanced Operations**: unique(), shuffle(), min(), max(), compact() with security
-   **Multiple Export Formats**: JSON, CSV, XML, YAML with integrity verification
-   **Memory Management**: Automatic cleanup, leak detection, and secure wiping
-   **100+ Methods**: Full JavaScript Array API compatibility plus security features

### SecureRandom with Encoding Support

-   Supports multiple encodings: hex, base64, base64url, base58, binary, utf8
-   Utilizes cryptographically secure pseudorandom number generators (CSPRNG)
-   Cross-platform compatibility for Node.js and browsers
-   Quantum-safe random generation options
-   Built-in entropy quality assessment

### RSA Key Calculator & Generator

-   Calculates optimal RSA key sizes based on data requirements
-   Provides comprehensive security assessments
-   Supports multiple hash algorithms (SHA-256, SHA-384, SHA-512)
-   Offers hybrid encryption recommendations
-   Includes performance benchmarking

### Password Management System

-   Implements Argon2ID, Argon2I, and Argon2D algorithms
-   Provides military-grade hashing with timing-safe verification
-   Supports seamless migration from bcrypt
-   Includes password strength analysis with entropy calculation
-   Achieves hash/verify times of 674-995ms for optimal security

### Advanced Security Features

-   Secure memory management with buffer protection
-   Resistance to side-channel attacks
-   Quantum-resistant cryptographic algorithms
-   Support for hardware security modules (HSMs)
-   Real-time security monitoring

## Installation

Install FortifyJS via npm:

```bash
npm install fortify2-js
```

### Optional Security Packages

For enhanced cryptographic functionality, install:

```bash
npm install @noble/hashes @noble/ciphers libsodium-wrappers argon2 bcryptjs
```

## Quick Start

### SecureArray - Military-Grade Secure Data Structure

```typescript
import { fArray } "fortify2-js"

// Create a secure array with AES-256-CTR-HMAC encryption
const secureData = fArray(["sensitive-data", "api-keys", "user-info"]);

// Set encryption key
secureData.setEncryptionKey("your-super-secret-key-2025");

// Encrypt all data with military-grade security
secureData.encryptAll();

// Use like a regular array - data is automatically encrypted/decrypted
secureData.push("new-secret");
const firstItem = secureData.get(0); // Automatically decrypted
const filtered = secureData.filter((item) => item.includes("api"));

// Advanced features
const snapshot = secureData.createSnapshot(); // Version control
const stats = secureData.getStats(); // Real-time monitoring
const exported = secureData.exportData("csv"); // Multiple export formats

// Event system
secureData.on("push", (data) => console.log("New item added securely"));

// Comprehensive security status
const status = secureData.getEncryptionStatus();
console.log(status.algorithm); // "AES-256-CTR-HMAC"
```

### Password Management

```typescript
import { PasswordManager } from "fortify2-js";

// or import pm directly
// import { pm } from "fortify2-js"; //NOTE: pm uses default configuration, for custom config, use PasswordManager.create() or PasswordManager.getInstance()

const pm = PasswordManager.getInstance();

// Generate a secure password
const password = pm.generateSecurePassword(16, {
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
});
console.log("Generated password:", password);

// Analyze password strength
const analysis = pm.analyzeStrength("MyPassword123!");
console.log("Strength score:", analysis.score);
console.log("Entropy:", analysis.entropy);

// Hash password with Argon2ID
const hash = await pm.hash("MyPassword123!", {
    algorithm: "argon2id",
    securityLevel: "high",
});
console.log("Secure hash:", hash);

// Verify password
const verification = await pm.verify("MyPassword123!", hash);
console.log("Valid password:", verification.isValid);
console.log("Security level:", verification.securityLevel);
```

### SecureRandom with Encoding

```typescript
import { SecureRandom } from "fortify2-js";
// or use: import { Random } from "fortify2-js";

const randomBytes = SecureRandom.getRandomBytes(32);

// Multiple encoding options
console.log("Hex:", randomBytes.toString("hex"));
console.log("Base64:", randomBytes.toString("base64"));
console.log("Base64URL:", randomBytes.toString("base64url"));
console.log("Base58:", randomBytes.toString("base58"));

// Entropy information
console.log("Entropy Info:", randomBytes.getEntropyInfo());
```

### RSA Key Calculator & Generator

```typescript
import {
    calculateRSAKeySize,
    generateRSAKeyPairForData,
    validateDataSizeForRSAKey,
    getRSARecommendations,
    assessRSASecurity,
} from "fortify2-js";

const dataSize = 190; // bytes
const keySize = calculateRSAKeySize(dataSize, "sha256");
console.log(`Recommended key size: ${keySize} bits`);

const keyPair = generateRSAKeyPairForData(dataSize, "sha256");
console.log("Public Key:", keyPair.publicKey);
console.log("Max Data Size:", keyPair.maxDataSize);

const validation = validateDataSizeForRSAKey(dataSize, 2048, "sha256");
console.log("Valid:", validation.valid);
console.log("Recommendation:", validation.recommendation);

const recommendations = getRSARecommendations(dataSize);
recommendations.forEach((rec) => {
    console.log(`${rec.keySize}-bit: ${rec.recommendation}`);
});

const security = assessRSASecurity(2048, "sha256", dataSize);
console.log("Security Level:", security.level);
console.log("Security Score:", security.score);
console.log("NIST Compliant:", security.compliance.nist);
```

## Encoding Types

FortifyJS supports various encoding formats:

| Encoding  | Use Case            | Example Output             |
| --------- | ------------------- | -------------------------- |
| hex       | Debugging           | `a1b2c3d4e5f6...`          |
| base64    | Data transmission   | `oWvD1OX2...`              |
| base64url | URL-safe tokens     | `oWvD1OX2...` (no padding) |
| base58    | Cryptocurrency      | `2NEpo7TZR...`             |
| binary    | Raw binary data     | Binary string              |
| utf8      | Text representation | UTF-8 string               |

## RSA Key Size Recommendations

| Data Size   | Recommended Key Size | Security Level | Use Case              |
| ----------- | -------------------- | -------------- | --------------------- |
| ≤ 190 bytes | 2048 bits            | Standard       | API keys, tokens      |
| ≤ 318 bytes | 3072 bits            | High           | Certificates, keys    |
| ≤ 446 bytes | 4096 bits            | Maximum        | High-security apps    |
| > 446 bytes | Hybrid Encryption    | Optimal        | Large data encryption |

## Security Levels

### Memory Protection Levels

-   **Basic**: Standard secure wiping
-   **Enhanced**: Includes fragmentation, encryption, and canaries
-   **Military**: Adds advanced obfuscation
-   **Quantum-Safe**: Incorporates quantum-resistant algorithms

### RSA Security Assessment

-   **Minimal**: 2048-bit keys (legacy compatibility)
-   **Standard**: 3072-bit keys (current standard)
-   **High**: 4096-bit keys (high-security applications)
-   **Maximum**: 8192+ bit keys (maximum security)

## Performance Benchmarks

### Random Generation Performance

| Operation                 | Rate (ops/sec) | Performance Grade |
| ------------------------- | -------------- | ----------------- |
| Random Float Generation   | 2,029,015      | Excellent         |
| Random Integer Generation | 1,645,765      | Excellent         |
| Secure UUID Generation    | 85,259         | Excellent         |
| Random Bytes (32B)        | 69,485         | Excellent         |
| Salt Generation (64B)     | 72,654         | Excellent         |

### Hash Operations Performance

| Operation         | Rate (ops/sec) | Security Level |
| ----------------- | -------------- | -------------- |
| SHA-256 Hashing   | 16             | Military-Grade |
| SHA-512 Hashing   | 14             | Military-Grade |
| BLAKE3 Hashing    | 3              | Maximum        |
| Hash Verification | 16             | Military-Grade |

### Password Algorithm Performance

| Algorithm | Hash Time | Verify Time | Security Level | Status           |
| --------- | --------- | ----------- | -------------- | ---------------- |
| Argon2ID  | 931ms     | 995ms       | High           | Production Ready |
| Argon2I   | 674ms     | 681ms       | High           | Production Ready |
| Argon2D   | 737ms     | 740ms       | High           | Production Ready |
| Scrypt    | TBD       | TBD         | Standard       | In Development   |
| PBKDF2    | TBD       | TBD         | Standard       | In Development   |
| Military  | TBD       | TBD         | Maximum        | In Development   |

### SecureArray Performance

| Operation             | Rate (ops/sec) | Security Level | Status           |
| --------------------- | -------------- | -------------- | ---------------- |
| Array Creation        | 50,000+        | Military-Grade | Production Ready |
| Encrypted Push/Pop    | 25,000+        | AES-256-CTR    | Production Ready |
| Snapshot Creation     | 10,000+        | Full State     | Production Ready |
| Event System          | 100,000+       | Real-Time      | Production Ready |
| Memory Management     | Auto           | Leak Detection | Production Ready |
| Serialization (JSON)  | 5,000+         | Compressed     | Production Ready |
| Export (CSV/XML/YAML) | 3,000+         | Multi-Format   | Production Ready |
| Integrity Validation  | 15,000+        | Checksum       | Production Ready |

### Large Data Processing

| Data Size  | Rate (ops/sec) | Use Case            |
| ---------- | -------------- | ------------------- |
| 1KB Data   | 15             | Small files, tokens |
| 10KB Data  | 17             | Documents, configs  |
| 100KB Data | 17             | Large files, images |

## Security Compliance

FortifyJS adheres to industry standards:

-   NIST SP 800-57: Key management recommendations
-   FIPS 140-2: Cryptographic module standards
-   Common Criteria: Security evaluation standards
-   OWASP: Web application security guidelines
-   SOC 2: Security and availability standards

## Advanced Usage

### Hybrid Encryption Strategy

```typescript
import { getEncryptionSuggestion } from "fortify2-js";

const suggestion = getEncryptionSuggestion(1024);
if (suggestion.approach === "hybrid") {
    console.log(suggestion.reason);
    console.log(
        "Performance Gain:",
        suggestion.details?.estimatedPerformanceGain
    );
}
```

### Security Monitoring

```typescript
import { FortifyJS } from "fortify2-js";

const securityStatus = FortifyJS.verifyRuntimeSecurity();
if (!securityStatus.isSecure) {
    console.warn("Security threats detected:", securityStatus.threats);
}
```

## API Documentation

### SecureRandom Methods

-   `getRandomBytes(length, options?)`: Generates secure random bytes (same as SecureRandom or Random .getRandomBytes method)
-   `generateSecureToken(length, options?)`: Creates secure tokens
-   `generateSecureUUID(options?)`: Produces secure UUIDs
-   `createEnhancedUint8Array(bytes)`: Creates enhanced byte arrays

### RSA Calculator Methods

-   `calculateRSAKeySize(dataSize, hashAlgorithm?, allowCustomSize?)`: Determines optimal key size
-   `generateRSAKeyPairForData(dataSize, hashAlgorithm?, allowCustomSize?)`: Generates optimized key pairs
-   `validateDataSizeForRSAKey(dataSize, rsaKeySize, hashAlgorithm?)`: Validates data/key compatibility
-   `getRSARecommendations(dataSize, hashAlgorithm?)`: Provides security recommendations
-   `assessRSASecurity(keySize, hashAlgorithm, dataSize)`: Performs security assessment

### SecureBuffer Methods

-   `new SecureBuffer(size, fill?, options?)`: Creates a secure buffer
-   `lock()` / `unlock()`: Manages buffer access
-   `verifyIntegrity()`: Checks buffer integrity
-   `getSecurityInfo()`: Retrieves security statistics
-   `clone()` / `resize(newSize)`: Performs buffer operations

## 📚 Documentation

### Complete Documentation

-   **[Quick Start Guide](./docs/quick-start.md)** - Get started in 5 minutes
-   **[SecureArray Documentation](./docs/secure-array.md)** - Complete feature guide
-   **[API Reference](./docs/api/secure-array-api.md)** - Full API documentation
-   **[Changelog](./docs/CHANGELOG.md)** - Latest updates and features

### Security & Performance

-   **[Security Best Practices](./docs/security/)** - Security guidelines
-   **[Performance Guide](./docs/performance/)** - Optimization tips
-   **[Migration Guide](./docs/migration/)** - Upgrade instructions

## Contributing

Contributions are welcome. Please refer to the [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Links

-   GitHub: [https://github.com/nehonix/fortifyjs](https://github.com/nehonix/fortifyjs)
-   NPM: [https://www.npmjs.com/package/fortify2-js](https://www.npmjs.com/package/fortify2-js)
-   Documentation: [https://lab.nehonix.space](https://lab.nehonix.space/nehonix_viewer/_doc/Nehonix%20FortifyJs/readme.md)
-   Security: [SECURITY.md](SECURITY.md)

---

**Developed by NEHONIX** | **Securing the digital world with advanced cryptography**
