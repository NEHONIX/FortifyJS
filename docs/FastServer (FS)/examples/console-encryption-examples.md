# Console Encryption Examples (v1)

Practical examples demonstrating different console encryption configurations and use cases.

## Basic Examples

### Example 1: Simple Development Setup

```typescript
import { createServer } "fortify2-js";

const app = createServer();
await app.waitForReady();

// Enable encryption for development
app.encrypt("dev-encryption-key");

console.log("User logged in:", { userId: 123, email: "user@example.com" });
console.error("Database connection failed");
console.warn("API rate limit approaching");

// Logs appear as encrypted hashes but encryption works in background
```

### Example 2: Production Silent Mode

```typescript
import { createServer } "fortify2-js";

const app = createServer({
    logging: {
        level: "info",
        consoleInterception: {
            enabled: true,
            preserveOriginal: false, // NO LOGS IN TERMINAL
            encryption: {
                enabled: false,
                algorithm: "aes-256-gcm",
                encoding: "base64",
            },
        },
    },
});

await app.waitForReady();

// Use environment variable for production key
app.encrypt(process.env.CONSOLE_ENCRYPTION_KEY || "fallback-key");

// These logs are completely invisible but encrypted in background
console.log("Processing payment:", { amount: 1000, cardLast4: "1234" });
console.log("User data:", { ssn: "xxx-xx-1234", address: "123 Main St" });

// Retrieve encrypted logs for external transmission
const encryptedLogs = app.getEncryptedLogs();
console.log(`Captured ${encryptedLogs.length} encrypted logs for transmission`);
```

## Advanced Configuration Examples

### Example 3: Multi-Environment Configuration

```typescript
import { createServer } "fortify2-js";

const isDevelopment = process.env.NODE_ENV === "development";
const isProduction = process.env.NODE_ENV === "production";

const app = createServer({
    logging: {
        level: isDevelopment ? "debug" : "info",
        consoleInterception: {
            enabled: true,
            preserveOriginal: isDevelopment, // Show logs in dev, hide in prod
            performanceMode: isProduction,   // Optimize for production
            encryption: {
                enabled: false, // Enable via app.encrypt()
                algorithm: "aes-256-gcm",
                displayMode: isDevelopment ? "readable" : "encrypted",
                showEncryptionStatus: isDevelopment,
                encoding: "base64",
            },
        },
    },
});

await app.waitForReady();

// Environment-specific encryption
if (isProduction) {
    app.encrypt(process.env.CONSOLE_ENCRYPTION_KEY);
} else {
    app.encrypt("development-key");
}

console.log("Application started in", process.env.NODE_ENV, "mode");
```

### Example 4: External Logging Integration

```typescript
import { createServer } "fortify2-js";

const app = createServer({
    logging: {
        consoleInterception: {
            enabled: true,
            preserveOriginal: false, // Silent local operation
            encryption: {
                enabled: false,
                algorithm: "aes-256-gcm",
                externalLogging: {
                    enabled: true,
                    endpoint: "https://logs.company.com/api/encrypted",
                    headers: {
                        "Authorization": `Bearer ${process.env.LOG_API_TOKEN}`,
                        "Content-Type": "application/json",
                    },
                    batchSize: 50,
                    flushInterval: 3000, // Send every 3 seconds
                },
            },
        },
    },
});

await app.waitForReady();
app.encrypt(process.env.EXTERNAL_LOG_ENCRYPTION_KEY);

// These logs are encrypted and sent to external service
console.log("User action:", { action: "purchase", userId: 123 });
console.error("Payment failed:", { error: "insufficient_funds" });
```

## Display Mode Examples

### Example 5: Development with Encryption Indicators

```typescript
const app = createServer({
    logging: {
        consoleInterception: {
            enabled: true,
            preserveOriginal: true,
            encryption: {
                enabled: false,
                displayMode: "readable",
                showEncryptionStatus: true, // Show 🔐 indicators
            },
        },
    },
});

await app.waitForReady();
app.encrypt("dev-key");

console.log("Debug info"); // Output: 🔐 Debug info
console.error("Error occurred"); // Output: 🔐 Error occurred
```

### Example 6: Security Audit Mode (Both Readable and Encrypted)

```typescript
const app = createServer({
    logging: {
        consoleInterception: {
            enabled: true,
            preserveOriginal: true,
            encryption: {
                enabled: false,
                displayMode: "both", // Show both formats
                showEncryptionStatus: true,
            },
        },
    },
});

await app.waitForReady();
app.encrypt("audit-key");

console.log("Audit event");
// Output: 🔐 Audit event [🔐 fgb2G3IvKrtjpCKqJBu1tzF8...]
```

## Runtime Configuration Examples

### Example 7: Dynamic Display Mode Changes

```typescript
const app = createServer({
    logging: {
        consoleInterception: {
            enabled: true,
            preserveOriginal: true,
        },
    },
});

await app.waitForReady();
app.encrypt("dynamic-key");

// Start in readable mode
app.setConsoleEncryptionDisplayMode("readable", true);
console.log("Readable message"); // Output: 🔐 Readable message

// Switch to encrypted mode
app.setConsoleEncryptionDisplayMode("encrypted", false);
console.log("Encrypted message"); // Output: fgb2G3IvKrtjpCKqJBu1tzF8...

// Switch to both mode
app.setConsoleEncryptionDisplayMode("both", true);
console.log("Both formats"); // Output: 🔐 Both formats [🔐 abc123...]
```

### Example 8: Key Rotation

```typescript
const app = createServer({
    logging: {
        consoleInterception: {
            enabled: true,
            preserveOriginal: false,
        },
    },
});

await app.waitForReady();

// Initial encryption
app.encrypt("initial-key");
console.log("Message with initial key");

// Rotate key
app.setConsoleEncryptionKey("rotated-key");
console.log("Message with rotated key");

// Get logs encrypted with different keys
const allEncryptedLogs = app.getEncryptedLogs();
console.log(`Total encrypted logs: ${allEncryptedLogs.length}`);
```

## Data Recovery Examples

### Example 9: Log Restoration

```typescript
const app = createServer({
    logging: {
        consoleInterception: {
            enabled: true,
            preserveOriginal: false, // Silent operation
        },
    },
});

await app.waitForReady();

const encryptionKey = "recovery-test-key";
app.encrypt(encryptionKey);

// Generate some encrypted logs
console.log("Important business data");
console.error("Critical error occurred");
console.warn("Performance warning");

// Wait for encryption processing
await new Promise((resolve) => setTimeout(resolve, 100));

// Retrieve encrypted logs
const encryptedLogs = app.getEncryptedLogs();
console.log(`Retrieved ${encryptedLogs.length} encrypted logs`);

// Restore original messages
const restoredMessages = await app.restoreConsoleFromEncrypted(
    encryptedLogs,
    encryptionKey
);

console.log("Restored messages:");
restoredMessages.forEach((message, index) => {
    console.log(`${index + 1}: ${message}`);
});
```

### Example 10: Cross-Session Log Recovery

```typescript
// Session 1: Generate and store encrypted logs
async function generateLogs() {
    const app = createServer({
        logging: {
            consoleInterception: {
                enabled: true,
                preserveOriginal: false,
            },
        },
    });

    await app.waitForReady();
    app.encrypt("session-key-123");

    console.log("Session 1 log entry 1");
    console.log("Session 1 log entry 2");
    console.error("Session 1 error");

    await new Promise((resolve) => setTimeout(resolve, 100));

    const encryptedLogs = app.getEncryptedLogs();

    // Store encrypted logs (e.g., in database, file, or external service)
    require("fs").writeFileSync(
        "encrypted-logs.json",
        JSON.stringify(encryptedLogs)
    );

    return encryptedLogs;
}

// Session 2: Restore logs from storage
async function restoreLogs() {
    const app = createServer();
    await app.waitForReady();

    // Load encrypted logs from storage
    const encryptedLogs = JSON.parse(
        require("fs").readFileSync("encrypted-logs.json", "utf8")
    );

    // Restore with original key
    const restoredMessages = await app.restoreConsoleFromEncrypted(
        encryptedLogs,
        "session-key-123"
    );

    console.log("Restored from previous session:");
    restoredMessages.forEach((message) => console.log(`- ${message}`));
}

// Usage
await generateLogs();
await restoreLogs();
```

## Error Handling Examples

### Example 11: Graceful Encryption Failure

```typescript
const app = createServer({
    logging: {
        consoleInterception: {
            enabled: true,
            preserveOriginal: true, // Fallback to normal logs if encryption fails
            encryption: {
                enabled: false,
            },
            fallback: {
                onError: "console", // Continue with normal console on errors
                gracefulDegradation: true,
                maxErrors: 5,
            },
        },
    },
});

await app.waitForReady();

try {
    app.encrypt("test-key");
    console.log("This should be encrypted");
} catch (error) {
    console.log("Encryption failed, but logs still work:", error.message);
}
```

### Example 12: Encryption Status Monitoring

```typescript
const app = createServer({
    logging: {
        consoleInterception: {
            enabled: true,
            preserveOriginal: false,
        },
    },
});

await app.waitForReady();

// Monitor encryption status
function monitorEncryption() {
    const status = app.getConsoleEncryptionStatus();
    const stats = app.getConsoleStats();

    console.log("Encryption Status:", {
        enabled: status.enabled,
        hasKey: status.hasKey,
        algorithm: status.algorithm,
        totalInterceptions: stats.totalInterceptions,
        errorCount: stats.errorCount,
        averageOverhead: stats.averageOverhead,
    });
}

app.encrypt("monitoring-key");

// Log some data
console.log("Monitored log entry 1");
console.log("Monitored log entry 2");

// Check status
setTimeout(monitorEncryption, 1000);
```

## Performance Optimization Examples

### Example 13: High-Throughput Logging

```typescript
const app = createServer({
    logging: {
        consoleInterception: {
            enabled: true,
            preserveOriginal: false,
            performanceMode: true, // Optimize for speed
            maxInterceptionsPerSecond: 10000, // High throughput
            encryption: {
                enabled: false,
                algorithm: "aes-256-gcm",
            },
        },
    },
});

await app.waitForReady();
app.encrypt("high-throughput-key");

// Simulate high-volume logging
const startTime = Date.now();
for (let i = 0; i < 1000; i++) {
    console.log(`High volume log entry ${i}`);
}
const endTime = Date.now();

console.log(`Processed 1000 logs in ${endTime - startTime}ms`);

const stats = app.getConsoleStats();
console.log(`Average overhead: ${stats.averageOverhead}ms per log`);
```

### Example 14: Memory-Efficient Logging

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
                    endpoint: "https://logs.example.com/api",
                    batchSize: 10, // Small batches for memory efficiency
                    flushInterval: 1000, // Frequent flushing
                },
            },
            filters: {
                maxLength: 500, // Limit message length
            },
        },
    },
});

await app.waitForReady();
app.encrypt("memory-efficient-key");

// Logs are automatically batched and sent to external service
// Memory usage remains low due to frequent flushing
for (let i = 0; i < 100; i++) {
    console.log(`Memory efficient log ${i}`);
}
```

## Integration Examples

### Example 15: Express.js Middleware Integration

```typescript
import express from "express";
import { createServer } "fortify2-js";

const app = createServer({
    logging: {
        consoleInterception: {
            enabled: true,
            preserveOriginal: false, // Silent in production
        },
    },
});

await app.waitForReady();
app.encrypt(process.env.ENCRYPTION_KEY);

// Express middleware that logs requests
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString(),
    });
    next();
});

app.get('/api/users', (req, res) => {
    console.log("Fetching users from database");
    res.json({ users: [] });
});

app.post('/api/users', (req, res) => {
    console.log("Creating new user:", { email: req.body.email });
    res.json({ success: true });
});
```

### Example 16: Database Query Logging

```typescript
const app = createServer({
    logging: {
        consoleInterception: {
            enabled: true,
            preserveOriginal: false,
        },
    },
});

await app.waitForReady();
app.encrypt("db-logging-key");

// Database wrapper with encrypted logging
class DatabaseLogger {
    async query(sql, params) {
        const startTime = Date.now();

        console.log("Executing query:", {
            sql: sql.substring(0, 100) + "...",
            params: params,
            timestamp: new Date().toISOString(),
        });

        try {
            // Simulate database query
            const result = await this.executeQuery(sql, params);
            const duration = Date.now() - startTime;

            console.log("Query completed:", {
                duration: `${duration}ms`,
                rowCount: result.length,
            });

            return result;
        } catch (error) {
            console.error("Query failed:", {
                error: error.message,
                sql: sql,
                params: params,
            });
            throw error;
        }
    }

    async executeQuery(sql, params) {
        // Simulate database operation
        await new Promise((resolve) => setTimeout(resolve, 50));
        return [{ id: 1, name: "Test" }];
    }
}

const db = new DatabaseLogger();
await db.query("SELECT * FROM users WHERE id = ?", [123]);
```

These examples demonstrate the flexibility and power of theFortify FastServer (FFS)console encryption system across different use cases, from simple development setups to complex production environments with external logging integration.

