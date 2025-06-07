# Console Encryption System

TheFortify FastServer (FFS)console encryption system provides enterprise-grade security for console output, enabling secure log transmission and protecting sensitive information in production environments.

## Overview

The console encryption system intercepts all `console.log()`, `console.error()`, `console.warn()`, and other console methods, encrypting the output using AES-256-GCM encryption while maintaining full application functionality.

### Key Features

-   ✓ **AES-256-GCM Encryption**: Military-grade encryption for console output
-   ✓ **Zero Performance Impact**: Background encryption with <0.1ms overhead
-   ✓ **Flexible Display Modes**: Choose between readable, encrypted, or both
-   ✓ **preserveOriginal Control**: Complete log suppression or dual output
-   ✓ **Simple API**: One-line encryption with `app.encrypt(key)`
-   ✓ **External Logging**: Secure transmission to external log services
-   ✓ **Key-Based Restoration**: Decrypt logs with the original encryption key

## Quick Start

### Basic Encryption

```typescript
import { createServer } "fortify2-js";

const app = createServer();
await app.waitForReady();

// Enable encryption with a simple method
app.encrypt("your-secret-key");

// All console logs are now encrypted
console.log("This message is encrypted!"); // Appears as: fgb2G3IvKrtjpCKqJBu1tzF8MkdVJoLcpd2iDR7XPRk=
```

### Production Configuration

```typescript
const app = createServer({
    logging: {
        consoleInterception: {
            enabled: true,
            preserveOriginal: false, // No logs in terminal (secure)
            encryption: {
                enabled: false, // Enable via app.encrypt()
                displayMode: "encrypted", // Show encrypted hashes
                encoding: "base64",
            },
        },
    },
});

await app.waitForReady();
app.encrypt(process.env.CONSOLE_ENCRYPTION_KEY);

// Console logs are encrypted but invisible in terminal
console.log("Sensitive production data"); // No output, but encrypted in background
```

## Configuration Options

### Console Interception Settings

```typescript
interface ConsoleInterceptionConfig {
    enabled: boolean; // Enable console interception
    preserveOriginal: boolean; // Show logs in terminal (true) or suppress (false)
    interceptMethods: string[]; // Methods to intercept ["log", "error", "warn", "info", "debug"]
    performanceMode: boolean; // Optimize for minimal overhead

    encryption?: {
        enabled: boolean; // Enable encryption
        algorithm: string; // "aes-128-gcm" | "aes-192-gcm" | "aes-256-gcm"
        keyDerivation: string; // "pbkdf2" | "scrypt" | "argon2"
        encoding: string; // "base64" | "hex"
        displayMode: string; // "readable" | "encrypted" | "both"
        showEncryptionStatus: boolean; // Show 🔐 indicators
        key?: string; // Encryption key

        externalLogging?: {
            enabled: boolean; // Enable external log transmission
            endpoint: string; // External logging endpoint URL
            batchSize: number; // Batch size for transmission
            flushInterval: number; // Flush interval in milliseconds
        };
    };
}
```

## Display Modes

### 1. Readable Mode (Development)

Shows original messages while encrypting in background:

```typescript
const app = createServer({
    logging: {
        consoleInterception: {
            enabled: true,
            preserveOriginal: true,
            encryption: {
                enabled: false,
                displayMode: "readable",
                showEncryptionStatus: true,
            },
        },
    },
});

app.encrypt("dev-key");
console.log("Debug message"); // Output: 🔐 Debug message
```

### 2. Encrypted Mode (Production)

Shows only encrypted hashes:

```typescript
const app = createServer({
    logging: {
        consoleInterception: {
            enabled: true,
            preserveOriginal: true,
            encryption: {
                enabled: false,
                displayMode: "encrypted",
            },
        },
    },
});

app.encrypt("prod-key");
console.log("Sensitive data"); // Output: fgb2G3IvKrtjpCKqJBu1tzF8MkdVJoLcpd2iDR7XPRk=
```

### 3. Both Mode (Debug)

Shows both readable and encrypted:

```typescript
encryption: {
    displayMode: "both",
    showEncryptionStatus: true,
}

console.log("Test message");
// Output: 🔐 Test message [🔐 fgb2G3IvKrtjpCKqJBu1tzF8...]
```

## preserveOriginal Behavior

### preserveOriginal: false (Recommended for Production)

**Complete log suppression** - no console output appears in terminal:

```typescript
const app = createServer({
    logging: {
        consoleInterception: {
            enabled: true,
            preserveOriginal: false, // NO LOGS IN TERMINAL
            encryption: {
                enabled: false,
            },
        },
    },
});

app.encrypt("secret-key");
console.log("This will not appear anywhere"); // Completely invisible
console.error("Errors are also suppressed"); // No output

// But encryption works in background
const encryptedLogs = app.getEncryptedLogs(); // Contains encrypted data
```

### preserveOriginal: true (Development)

**Dual output** - logs appear in terminal AND get encrypted:

```typescript
const app = createServer({
    logging: {
        consoleInterception: {
            enabled: true,
            preserveOriginal: true, // SHOW LOGS IN TERMINAL
            encryption: {
                enabled: false,
                displayMode: "encrypted",
            },
        },
    },
});

app.encrypt("dev-key");
console.log("Visible message"); // Shows encrypted hash in terminal
```

## API Reference

### Core Methods

#### `app.encrypt(key: string)`

Simple method to enable encryption with a key:

```typescript
app.encrypt("your-encryption-key");
```

#### `app.enableConsoleEncryption(key?: string)`

Advanced encryption enablement:

```typescript
app.enableConsoleEncryption("custom-key");
// or use environment variable
app.enableConsoleEncryption(); // Uses CONSOLE_ENCRYPTION_KEY or ENC_SECRET_KEY
```

#### `app.disableConsoleEncryption()`

Disable encryption:

```typescript
app.disableConsoleEncryption();
```

### Configuration Methods

#### `app.setConsoleEncryptionDisplayMode(mode, showStatus?)`

Change display mode at runtime:

```typescript
app.setConsoleEncryptionDisplayMode("encrypted", true);
app.setConsoleEncryptionDisplayMode("readable", false);
app.setConsoleEncryptionDisplayMode("both", true);
```

#### `app.setConsoleEncryptionKey(key: string)`

Update encryption key:

```typescript
app.setConsoleEncryptionKey("new-encryption-key");
```

### Data Access Methods

#### `app.getEncryptedLogs(): string[]`

Get encrypted logs for external transmission:

```typescript
const encryptedLogs = app.getEncryptedLogs();
// Returns: ["fgb2G3IvKrtjpCKqJBu1tzF8...", "YKqFev14/vHiGeNFlbXa4K..."]
```

#### `app.restoreConsoleFromEncrypted(data, key): Promise<string[]>`

Decrypt logs with the original key:

```typescript
const encryptedLogs = app.getEncryptedLogs();
const decryptedMessages = await app.restoreConsoleFromEncrypted(
    encryptedLogs,
    "original-key"
);
// Returns: ["Original message 1", "Original message 2"]
```

### Status Methods

#### `app.isConsoleEncryptionEnabled(): boolean`

Check if encryption is active:

```typescript
if (app.isConsoleEncryptionEnabled()) {
    console.log("Encryption is active");
}
```

#### `app.getConsoleEncryptionStatus()`

Get detailed encryption status:

```typescript
const status = app.getConsoleEncryptionStatus();
// Returns: { enabled: true, algorithm: "aes-256-gcm", hasKey: true, externalLogging: false }
```

## Environment Variables

Set encryption keys via environment variables:

```bash
# Primary encryption key
export CONSOLE_ENCRYPTION_KEY="your-production-encryption-key"

# Alternative key (fallback)
export ENC_SECRET_KEY="fallback-encryption-key"

# Key derivation (optional)
export ENC_SECRET_SEED="your-seed"
export ENC_SECRET_SALT="your-salt"
```

## Use Cases

### 1. Development Environment

```typescript
const app = createServer({
    logging: {
        consoleInterception: {
            enabled: true,
            preserveOriginal: true, // Show logs for debugging
            encryption: {
                enabled: false,
                displayMode: "readable", // Keep logs readable
                showEncryptionStatus: true, // Show 🔐 indicators
            },
        },
    },
});

app.encrypt("dev-key");
```

### 2. Production Environment

```typescript
const app = createServer({
    logging: {
        consoleInterception: {
            enabled: true,
            preserveOriginal: false, // No logs in terminal (secure)
            encryption: {
                enabled: false,
                displayMode: "encrypted", // If logs appear, show encrypted
            },
        },
    },
});

app.encrypt(process.env.CONSOLE_ENCRYPTION_KEY);
```

### 3. External Logging Service

```typescript
const app = createServer({
    logging: {
        consoleInterception: {
            enabled: true,
            preserveOriginal: false,
            encryption: {
                enabled: false,
                externalLogging: {
                    enabled: true,
                    endpoint: "https://logs.company.com/api/encrypted",
                    batchSize: 100,
                    flushInterval: 5000,
                },
            },
        },
    },
});

app.encrypt("external-logging-key");

// Logs are automatically sent encrypted to external service
console.log("This goes to external logging service encrypted");
```

## Security Considerations

### Encryption Strength

-   **Algorithm**: AES-256-GCM (authenticated encryption)
-   **Key Derivation**: PBKDF2 with 100,000 iterations
-   **Salt Length**: 32 bytes (cryptographically secure)
-   **IV Length**: 16 bytes (unique per message)
-   **Auth Tag**: 16 bytes (integrity verification)

### Key Management

```typescript
// ✓ Good: Use environment variables
app.encrypt(process.env.CONSOLE_ENCRYPTION_KEY);

// ✓ Good: Use secure key generation
const secureKey = require("crypto").randomBytes(32).toString("base64");
app.encrypt(secureKey);

// ❌ Bad: Hardcoded keys
app.encrypt("hardcoded-key"); // Never do this in production
```

### Production Recommendations

1. **Always use `preserveOriginal: false`** in production
2. **Set encryption keys via environment variables**
3. **Use strong, randomly generated keys** (32+ characters)
4. **Rotate encryption keys regularly**
5. **Monitor encryption status** in health checks
6. **Test key restoration** in staging environments

## Troubleshooting

### Common Issues

#### Logs Still Appearing with preserveOriginal: false

```typescript
// Check if console interception is enabled
const stats = app.getConsoleStats();
console.log("Interception active:", stats.isActive);

// Verify configuration
const status = app.getConsoleEncryptionStatus();
console.log("Encryption status:", status);
```

#### Encryption Not Working

```typescript
// Check if encryption is enabled
if (!app.isConsoleEncryptionEnabled()) {
    console.log("Encryption is not enabled");
    app.encrypt("your-key");
}

// Verify encrypted logs are being created
const encryptedLogs = app.getEncryptedLogs();
console.log(`${encryptedLogs.length} logs encrypted`);
```

#### Performance Issues

```typescript
// Check console interception overhead
const stats = app.getConsoleStats();
console.log(`Average overhead: ${stats.averageOverhead}ms`);

// Enable performance mode
const app = createServer({
    logging: {
        consoleInterception: {
            enabled: true,
            performanceMode: true, // Optimize for speed
        },
    },
});
```

### Error Messages

| Error                             | Cause                                          | Solution                                |
| --------------------------------- | ---------------------------------------------- | --------------------------------------- |
| "Encryption is not enabled"       | Called `getEncryptedLogs()` without encryption | Call `app.encrypt(key)` first           |
| "Failed to decrypt log entry"     | Wrong decryption key                           | Use the original encryption key         |
| "Console interception not active" | Interception disabled                          | Set `consoleInterception.enabled: true` |

## Performance Metrics

-   **Encryption Overhead**: <0.1ms per log entry
-   **Memory Usage**: ~1KB per 100 encrypted logs
-   **CPU Impact**: <1% additional CPU usage
-   **Throughput**: 10,000+ logs/second encryption rate

## Next Steps

-   [Logging Configuration](./logging.md) - Configure the logging system
-   [Performance Optimization](./performance.md) - Optimize server performance
-   [Security Features](./security.md) - Additional security features
-   [API Reference](./api-reference.md) - Complete API documentation

