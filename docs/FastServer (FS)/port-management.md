# Port Management

FortifyFortify FastServer (FFS) provides comprehensive port management methods to handle auto port switching scenarios and port conflicts gracefully.

## Overview

When `autoPortSwitch` is enabled, FFS automatically finds available ports when the requested port is occupied. The port management methods help you work with these dynamic port assignments and manage port conflicts.

## Methods

### `getPort(): number`

Returns the actual running port number.

**Returns:** `number` - The current port the server is running on

**Example:**

```typescript
const app = createServer({
    server: {
        autoPortSwitch: { enabled: true },
    },
});

await app.start(3000);
console.log(`Server running on port: ${app.getPort()}`); // Might be 3001 (or something like it) if 3000 was taken
```

### `forceClosePort(port: number): Promise<boolean>`

Attempts to forcefully close/free up the specified port by terminating the process using it.

**Parameters:**

-   `port: number` - The port number to force close

**Returns:** `Promise<boolean>` - `true` if successful, `false` if failed

**Platform Support:**

-   ✅ Windows (uses `netstat` and `taskkill`)
-   ✅ Unix/Linux/macOS (uses `lsof` and `kill`)

**Example:**

```typescript
// Force close port 3000 if it's occupied
const success = await app.forceClosePort(3000);
if (success) {
    console.log("Port 3000 is now available");
} else {
    console.log("Could not close port 3000");
}
```

**⚠️ Security Warning:** This method terminates processes forcefully. Use with caution in production environments.

### `redirectFromPort(fromPort: number, toPort: number, options?: RedirectOptions): Promise<RedirectServerInstance | boolean>`

Sets up automatic request redirection from one port to another with advanced configuration options.

**Parameters:**

-   `fromPort: number` - The source port to redirect from
-   `toPort: number` - The destination port to redirect to
-   `options?: RedirectOptions` - Advanced redirect configuration (optional)

**Returns:** `Promise<RedirectServerInstance | boolean>` - Redirect instance with control methods or boolean for backward compatibility

**Dependencies:**

-   Requires `http-proxy-middleware` package: `npm install http-proxy-middleware`

**Basic Example:**

```typescript
// Simple redirect (backward compatible)
const redirectSuccess = await app.redirectFromPort(3000, app.getPort());
if (redirectSuccess) {
    console.log("Redirect active: 3000 → " + app.getPort());
}
```

**Advanced Example with Options:**

```typescript
// Advanced redirect with custom options
const redirectInstance = await app.redirectFromPort(3000, app.getPort(), {
    mode: "message", // Show custom message instead of transparent proxy
    customMessage: "Server moved to new port!",
    enableLogging: true,
    enableStats: true,
    autoDisconnectAfter: 300000, // Auto-disconnect after 5 minutes
    rateLimit: {
        windowMs: 60000, // 1 minute
        maxRequests: 100, // Max 100 requests per minute
    },
    customHeaders: {
        "X-Redirect-Reason": "Port-Switch",
        "X-Original-Port": "3000",
    },
});

// Control the redirect instance
console.log("Redirect stats:", redirectInstance.getStats());
// Later: redirectInstance.disconnect();
```

## Advanced Redirect Management Methods

### `getRedirectInstance(fromPort: number): RedirectServerInstance | null`

Gets the redirect instance for a specific port.

**Parameters:**

-   `fromPort: number` - The source port of the redirect

**Returns:** `RedirectServerInstance | null` - The redirect instance or null if not found

**Example:**

```typescript
const instance = app.getRedirectInstance(3000);
if (instance) {
    console.log("Redirect stats:", instance.getStats());
    console.log("From port:", instance.fromPort);
    console.log("To port:", instance.toPort);
}
```

### `getAllRedirectInstances(): RedirectServerInstance[]`

Gets all active redirect instances.

**Returns:** `RedirectServerInstance[]` - Array of all active redirect instances

**Example:**

```typescript
const allRedirects = app.getAllRedirectInstances();
console.log(`Active redirects: ${allRedirects.length}`);
allRedirects.forEach((redirect) => {
    console.log(`${redirect.fromPort} → ${redirect.toPort}`);
});
```

### `disconnectRedirect(fromPort: number): Promise<boolean>`

Disconnects a specific redirect.

**Parameters:**

-   `fromPort: number` - The source port of the redirect to disconnect

**Returns:** `Promise<boolean>` - `true` if successfully disconnected

**Example:**

```typescript
const success = await app.disconnectRedirect(3000);
if (success) {
    console.log("Redirect from port 3000 disconnected");
}
```

### `disconnectAllRedirects(): Promise<boolean>`

Disconnects all active redirects.

**Returns:** `Promise<boolean>` - `true` if all redirects were successfully disconnected

**Example:**

```typescript
const success = await app.disconnectAllRedirects();
console.log(`All redirects disconnected: ${success}`);
```

### `getRedirectStats(fromPort: number): RedirectStats | null`

Gets statistics for a specific redirect.

**Parameters:**

-   `fromPort: number` - The source port of the redirect

**Returns:** `RedirectStats | null` - Statistics object or null if redirect not found

**Example:**

```typescript
const stats = app.getRedirectStats(3000);
if (stats) {
    console.log(`Total requests: ${stats.totalRequests}`);
    console.log(
        `Success rate: ${stats.successfulRedirects}/${stats.totalRequests}`
    );
    console.log(`Average response time: ${stats.averageResponseTime}ms`);
    console.log(`Uptime: ${stats.uptime}ms`);
}
```

## Redirect Options (RedirectOptions)

The `RedirectOptions` interface provides extensive configuration for redirect behavior:

```typescript
interface RedirectOptions {
    // Redirect behavior mode
    mode?: "transparent" | "message" | "redirect";

    // Custom message for 'message' mode
    customMessage?: string;

    // HTTP status code for 'redirect' mode (301 or 302)
    redirectStatusCode?: 301 | 302;

    // Enable/disable logging and statistics
    enableLogging?: boolean;
    enableStats?: boolean;

    // Auto-disconnect options
    autoDisconnectAfter?: number; // milliseconds
    autoDisconnectAfterRequests?: number; // request count

    // Rate limiting
    rateLimit?: {
        windowMs: number;
        maxRequests: number;
    };

    // Custom headers to add to responses
    customHeaders?: Record<string, string>;

    // Proxy configuration
    proxyTimeout?: number;
    enableCors?: boolean;

    // Advanced proxy features
    useAdvancedProxy?: boolean;
}
```

### Redirect Modes

#### 1. Transparent Mode (Default)

Seamlessly proxies requests to the target port without user awareness.

```typescript
await app.redirectFromPort(3000, 4000, {
    mode: "transparent",
    enableLogging: true,
});
// Users see content from port 4000 but URL stays localhost:3000
```

#### 2. Message Mode

Shows a custom message with information about the redirect.

```typescript
await app.redirectFromPort(3000, 4000, {
    mode: "message",
    customMessage: "🚀 Server has moved to a new port for better performance!",
    customHeaders: {
        "X-Redirect-Info": "Port-Migration",
    },
});
```

#### 3. Redirect Mode

Sends HTTP redirect responses to browsers.

```typescript
await app.redirectFromPort(3000, 4000, {
    mode: "redirect",
    redirectStatusCode: 301, // Permanent redirect
    enableLogging: true,
});
```

## Integration with Auto Port Switch

These methods work seamlessly with the `autoPortSwitch` configuration:

```typescript
const app = createServer({
    server: {
        autoPortSwitch: {
            enabled: true,
            maxAttempts: 5,
            strategy: "increment",
            onPortSwitch: (originalPort, newPort) => {
                console.log(`Port switched: ${originalPort} → ${newPort}`);
            },
        },
    },
});

await app.start(3000);

// Get the actual port (might be different due to auto-switching)
const actualPort = app.getPort();

// Optional: Set up redirect from original port to new port
if (actualPort !== 3000) {
    await app.forceClosePort(3000); // Free up the original port
    await app.redirectFromPort(3000, actualPort); // Redirect traffic
}
```

## Complete Example

```typescript
import { createServer } from "fortify2-js";

async function advancedPortManagementExample() {
    const app = createServer({
        server: {
            autoPortSwitch: {
                enabled: true,
                maxAttempts: 5,
                strategy: "increment",
                onPortSwitch: (originalPort, newPort) => {
                    console.log(
                        `🔄 Auto-switched: ${originalPort} → ${newPort}`
                    );
                },
            },
        },
    });

    // Add routes
    app.get("/api/status", (req, res) => {
        res.json({
            message: "Server is running!",
            port: app.getPort(),
            timestamp: Date.now(),
            redirects: app.getAllRedirectInstances().length,
        });
    });

    app.get("/api/redirects", (req, res) => {
        const redirects = app.getAllRedirectInstances();
        res.json({
            count: redirects.length,
            redirects: redirects.map((r) => ({
                from: r.fromPort,
                to: r.toPort,
                stats: r.getStats(),
            })),
        });
    });

    try {
        // Start server
        await app.start(3000);
        const actualPort = app.getPort();

        console.log(`✅ Server running on port: ${actualPort}`);
        console.log(`🔗 API: http://localhost:${actualPort}/api/status`);

        // If port switched, set up advanced redirect
        if (actualPort !== 3000) {
            console.log("Setting up advanced redirect from original port...");

            // Try to free up the original port
            const closeSuccess = await app.forceClosePort(3000);
            if (closeSuccess) {
                // Set up advanced redirect with custom options
                const redirectInstance = await app.redirectFromPort(
                    3000,
                    actualPort,
                    {
                        mode: "message",
                        customMessage: `🚀 Server moved to port ${actualPort} for better performance!`,
                        enableLogging: true,
                        enableStats: true,
                        autoDisconnectAfter: 300000, // 5 minutes
                        rateLimit: {
                            windowMs: 60000, // 1 minute
                            maxRequests: 100, // Max 100 requests per minute
                        },
                        customHeaders: {
                            "X-Redirect-Reason": "Auto-Port-Switch",
                            "X-Original-Port": "3000",
                            "X-New-Port": actualPort.toString(),
                        },
                    }
                );

                if (redirectInstance && typeof redirectInstance !== "boolean") {
                    console.log(
                        `🔄 Advanced redirect active: 3000 → ${actualPort}`
                    );
                    console.log(
                        `🔗 Original URL shows message: http://localhost:3000`
                    );

                    // Monitor redirect stats
                    setInterval(() => {
                        const stats = redirectInstance.getStats();
                        if (stats.totalRequests > 0) {
                            console.log(
                                `📊 Redirect stats: ${stats.totalRequests} requests, ${stats.averageResponseTime}ms avg`
                            );
                        }
                    }, 30000); // Every 30 seconds
                }
            }
        }

        // Set up additional redirects for common development ports
        const commonPorts = [8080, 8000, 5000];
        for (const port of commonPorts) {
            if (port !== actualPort) {
                try {
                    const redirectInstance = await app.redirectFromPort(
                        port,
                        actualPort,
                        {
                            mode: "transparent",
                            enableLogging: false,
                            enableStats: true,
                            autoDisconnectAfter: 600000, // 10 minutes
                        }
                    );

                    if (
                        redirectInstance &&
                        typeof redirectInstance !== "boolean"
                    ) {
                        console.log(
                            `🔄 Convenience redirect: ${port} → ${actualPort}`
                        );
                    }
                } catch (error) {
                    // Port might be in use, that's okay
                    console.log(
                        `⚠️ Could not set up redirect from port ${port}`
                    );
                }
            }
        }

        // Show all active redirects
        const allRedirects = app.getAllRedirectInstances();
        console.log(`📊 Total active redirects: ${allRedirects.length}`);
        allRedirects.forEach((redirect) => {
            console.log(
                `   ${redirect.fromPort} → ${redirect.toPort} (${redirect.options.mode} mode)`
            );
        });

        // Graceful shutdown handler
        process.on("SIGINT", async () => {
            console.log("\n🛑 Shutting down gracefully...");

            // Disconnect all redirects
            const disconnected = await app.disconnectAllRedirects();
            console.log(`🔄 Redirects disconnected: ${disconnected}`);

            process.exit(0);
        });
    } catch (error) {
        console.error("❌ Error:", error.message);
    }
}

advancedPortManagementExample();
```

## Best Practices

### 1. Always Use getPort()

```typescript
// ✅ Good - Use actual port
const port = app.getPort();
console.log(`Server running on: ${port}`);

// ❌ Bad - Assumes original port
console.log("Server running on: 3000");
```

### 2. Handle Port Switching Gracefully

```typescript
const app = createServer({
    server: {
        autoPortSwitch: {
            enabled: true,
            onPortSwitch: (original, actual) => {
                // Update any external references
                updateLoadBalancer(actual);
                notifyServices(actual);
            },
        },
    },
});
```

### 3. Use forceClosePort() Carefully

```typescript
// ✅ Good - Check if it's your own process first
if (await isOwnProcess(port)) {
    await app.forceClosePort(port);
}

// ⚠️ Caution - Could terminate other applications
await app.forceClosePort(port);
```

### 4. Set Up Redirects for User Convenience

```typescript
// Help users who bookmarked the original URL
if (app.getPort() !== originalPort) {
    await app.redirectFromPort(originalPort, app.getPort());
}
```

## Error Handling

All port management methods include comprehensive error handling:

```typescript
try {
    const success = await app.forceClosePort(3000);
    if (!success) {
        console.log("Port was not in use or couldn't be closed");
    }
} catch (error) {
    console.error("Error managing port:", error.message);
}
```

## TypeScript Support

All methods are fully typed with comprehensive interfaces:

```typescript
interface UltraFastApp {
    // Basic port management
    getPort(): number;
    forceClosePort(port: number): Promise<boolean>;

    // Advanced redirect management
    redirectFromPort(
        fromPort: number,
        toPort: number,
        options?: RedirectOptions
    ): Promise<RedirectServerInstance | boolean>;

    // Redirect instance management
    getRedirectInstance(fromPort: number): RedirectServerInstance | null;
    getAllRedirectInstances(): RedirectServerInstance[];
    disconnectRedirect(fromPort: number): Promise<boolean>;
    disconnectAllRedirects(): Promise<boolean>;
    getRedirectStats(fromPort: number): RedirectStats | null;
}

interface RedirectServerInstance {
    fromPort: number;
    toPort: number;
    options: RedirectOptions;
    server: any;
    stats: RedirectStats;
    disconnect: () => Promise<boolean>;
    getStats: () => RedirectStats;
    updateOptions: (newOptions: Partial<RedirectOptions>) => void;
}

interface RedirectStats {
    totalRequests: number;
    successfulRedirects: number;
    failedRedirects: number;
    averageResponseTime: number;
    lastRequestTime?: Date;
    startTime: Date;
    uptime: number;
    requestTimes: number[];
}

type RedirectMode = "transparent" | "message" | "redirect";

interface RedirectOptions {
    mode?: RedirectMode;
    customMessage?: string;
    redirectStatusCode?: 301 | 302;
    enableLogging?: boolean;
    enableStats?: boolean;
    autoDisconnectAfter?: number;
    autoDisconnectAfterRequests?: number;
    rateLimit?: {
        windowMs: number;
        maxRequests: number;
    };
    customHeaders?: Record<string, string>;
    proxyTimeout?: number;
    enableCors?: boolean;
    useAdvancedProxy?: boolean;
}
```

## Real-World Use Cases

### 1. Development Environment with Multiple Services

```typescript
// Set up redirects for a microservices development environment
const app = createServer({
    /* config */
});
await app.start(3000);

// Redirect common service ports to main server
await app.redirectFromPort(3001, 3000, { mode: "transparent" }); // API service
await app.redirectFromPort(3002, 3000, { mode: "transparent" }); // Auth service
await app.redirectFromPort(3003, 3000, { mode: "transparent" }); // File service

console.log(`All services accessible through http://localhost:3000`);
```

### 2. Production Port Migration

```typescript
// Gracefully migrate from old port to new port
const app = createServer({
    /* config */
});
await app.start(8080); // New port

// Set up temporary redirect from old port with informative message
await app.redirectFromPort(3000, 8080, {
    mode: "message",
    customMessage:
        "🚀 Service has been upgraded! Please update your bookmarks to use port 8080.",
    autoDisconnectAfter: 86400000, // 24 hours
    enableStats: true,
});

// Monitor migration progress
setInterval(() => {
    const stats = app.getRedirectStats(3000);
    if (stats) {
        console.log(
            `Migration progress: ${stats.totalRequests} requests redirected`
        );
    }
}, 3600000); // Every hour
```

### 3. Load Balancing Simulation

```typescript
// Simulate load balancing across multiple ports
const app = createServer({
    /* config */
});
const ports = [3000, 3001, 3002, 3003];
let currentIndex = 0;

// Start main server
await app.start(ports[0]);

// Set up round-robin redirects
for (let i = 1; i < ports.length; i++) {
    await app.redirectFromPort(ports[i], ports[0], {
        mode: "transparent",
        enableStats: true,
        rateLimit: {
            windowMs: 60000,
            maxRequests: 50, // Distribute load
        },
    });
}
```

