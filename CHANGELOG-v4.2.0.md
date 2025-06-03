# Changelog - FortifyJS v4.2.0

All notable changes to FortifyJS for version 4.2.0 are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [4.2.0] - 2024-12-19

### Added

#### Express Integration

-   **createServer()** - Zero-configuration Express server factory with built-in security
    -   Auto-configured security middleware integration
    -   Built-in caching system integration
    -   Performance monitoring and logging
    -   Smart defaults with optional customization
    -   Full Express compatibility with enhanced features
-   **func() wrapper** - Ultra-fast function wrapper for Express routes
    -   Performance optimization modes: 'none', 'basic', 'maximum'
    -   Automatic cache middleware integration
    -   Route-level caching with configurable TTL
    -   Security wrapper with minimal overhead
    -   Performance timing and monitoring integration
    -   Auto-detection of optimal cache strategies

#### Hash Module

-   **Hash.pbkdf2()** - New dedicated PBKDF2 method using Node.js crypto.pbkdf2Sync
    -   Supports configurable iterations, key length, hash functions (sha256/sha512)
    -   Multiple output formats: hex, base64, buffer
    -   Provides consistent, reliable PBKDF2 implementation
    -   Default parameters: 100000 iterations, 32 bytes, sha256, hex output

#### Sensitive Key Filtering

-   **Custom sensitive pattern support** in fObject
    -   `addSensitivePatterns()` - Add custom regex patterns for sensitive data detection
    -   `removeSensitivePatterns()` - Remove specific custom patterns
    -   `clearSensitivePatterns()` - Clear all custom patterns
    -   `getSensitivePatterns()` - Retrieve current custom patterns
-   **Enhanced strict mode filtering** with comprehensive pattern matching
    -   Filters all keys ending with: password, token, secret, key
    -   Configurable via `strictMode` parameter in `filterNonSensitive()`

#### Documentation

-   **Comprehensive JSDoc enhancements** for Hash methods
    -   Clear behavioral differences from CryptoJS highlighted
    -   Usage examples and best practices included
    -   Migration guidance for method changes

### Changed

#### Hash Module

-   **Hash.secureHash renamed to Hash.create()**
    -   Maintains backward compatibility (Hash.secureHash still available)
    -   Clearer naming convention for consistent hashing behavior
    -   Enhanced documentation explaining deterministic behavior
-   **Enhanced Hash.createSecureHash() documentation**
    -   Clarified auto-salt generation behavior
    -   Added warnings about behavioral differences from CryptoJS
    -   Improved parameter documentation

#### Sensitive Key Filtering

-   **fObject.filterNonSensitive() default behavior**
    -   Default mode changed to non-strict (strictMode: false)
    -   Non-strict mode uses only exact matches from DEFAULT_SENSITIVE_KEYS
    -   Strict mode applies additional pattern matching for maximum security
-   **Improved nested object processing**
    -   Consistent strictMode application across all nesting levels
    -   Enhanced recursive filtering for complex object structures

### Fixed

#### TypeScript Compatibility

-   **Resolved compilation errors in src/core/keys.ts**
    -   Fixed missing await for async argon2.hash operation
    -   Removed duplicate memoryCost property in argon2 configuration
    -   Replaced deprecated substr() method with substring()
    -   Cleaned up unused import declarations
-   **Fixed Hash method parameter types**
    -   Corrected HashStrength enum usage in method signatures
    -   Resolved parameter mismatch in Hash.deriveKeyPBKDF2()
    -   Enhanced type safety for all Hash methods

#### Sensitive Key Detection

-   **Resolved false positive filtering issues**
    -   Fixed secureSKey and secureSensitiveKey being incorrectly filtered
    -   Improved pattern matching logic to avoid legitimate key names
    -   Enhanced exclusion patterns for non-strict mode
-   **Fixed inconsistent strict/non-strict mode behavior**
    -   Ensured different results between strict and non-strict modes
    -   Corrected nested object processing with proper mode inheritance
    -   Resolved pattern matching conflicts

### Security

#### Enhanced Key Derivation

-   **Improved PBKDF2 implementation security**
    -   Uses proven Node.js crypto.pbkdf2Sync for reliability
    -   Configurable iteration counts with secure defaults (100,000+)
    -   Support for stronger hash functions (SHA-512)
-   **Memory-hard algorithm integration**
    -   Enhanced Hash.deriveKeyPBKDF2() with Argon2 support
    -   Fallback mechanisms for environments without Argon2
    -   Improved resistance to hardware-based attacks

#### Sensitive Data Protection

-   **Strengthened sensitive key detection**
    -   Comprehensive pattern matching for common sensitive terms
    -   Configurable security levels (strict/non-strict modes)
    -   Custom pattern support for application-specific protection

### Deprecated

-   **Hash.secureHash** - Use Hash.create() instead
    -   Maintains full backward compatibility
    -   Will be marked for removal in future major version
    -   Migration path clearly documented

### Performance

#### Hash Operations

-   **Optimized Hash.create() performance**
    -   Streamlined algorithm selection
    -   Reduced overhead for common operations
    -   Improved memory usage patterns
-   **Enhanced PBKDF2 performance**
    -   Native Node.js crypto integration
    -   Eliminated unnecessary abstraction layers
    -   Faster execution for standard PBKDF2 operations

#### Sensitive Key Filtering

-   **Improved filtering algorithm efficiency**
    -   Optimized pattern matching logic
    -   Reduced redundant checks in non-strict mode
    -   Better performance for large object structures

### Breaking Changes

#### Minor Breaking Changes

-   **fObject.filterNonSensitive() default mode**
    -   Default changed from strict (true) to non-strict (false)
    -   **Migration**: Explicitly set `{ strictMode: true }` if strict filtering is required
    -   **Rationale**: Reduces false positives in general use cases

#### Method Signature Changes

-   **Hash.deriveKeyPBKDF2() parameters**
    -   Updated to use MemoryHardOptions interface
    -   **Migration**: Update parameter structure to match new interface
    -   **Rationale**: Improved consistency with Argon2 implementation

### Developer Experience

#### Documentation

-   **Enhanced method documentation**
    -   Clear behavioral explanations for all Hash methods
    -   Comprehensive usage examples
    -   Migration guides for version changes
-   **Improved TypeScript definitions**
    -   Better type inference for method parameters
    -   Enhanced IDE support and autocomplete
    -   Clearer error messages for type mismatches

#### Testing

-   **Expanded test coverage**
    -   Comprehensive PBKDF2 functionality tests
    -   Sensitive key filtering edge cases
    -   Cross-platform compatibility validation

### Migration Notes

#### From v4.1.x to v4.2.0

1. **Update Hash method calls**:

    ```typescript
    // Before
    const hash = Hash.secureHash("data");

    // After (recommended)
    const hash = Hash.create("data");
    ```

2. **Update PBKDF2 usage**:

    ```typescript
    // Before (complex pbkdf2)
    Hash.createSecureHash(password, salt, { algorithm: "pbkdf2", ... });

    // After (simple (for performance))
    Hash.pbkdf2(password, salt, 100000, 32, "sha256", "hex");
    ```

3. **Review sensitive key filtering**:
    ```typescript
    // If you relied on strict mode being default
    const filtered = user.filterNonSensitive({ strictMode: true }); //default false
    ```

### Compatibility

-   **Node.js**: 16.x, 18.x, 20.x, 21.x
-   **TypeScript**: 4.5+, 5.x
-   **Browsers**: Modern browsers with ES2020 support

### Contributors

This release includes contributions focused on security enhancements, TypeScript compatibility, and developer experience improvements.

---

For detailed usage examples and API documentation, see [v4.2.0 Documentation](docs/v4.2.0-documentation.md).

