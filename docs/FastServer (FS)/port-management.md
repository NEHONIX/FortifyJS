# Port Management

FastServer provides comprehensive port management methods to handle auto port switching scenarios and port conflicts gracefully.

## Overview

When `autoPortSwitch` is enabled, FastServer automatically finds available ports when the requested port is occupied. The port management methods help you work with these dynamic port assignments and manage port conflicts.

## Methods

### `getPort(): number`

Returns the actual running port number.

**Returns:** `number` - The current port the server is running on

**Example:**
```typescript
const app = createServer({
    server: {
        autoPortSwitch: { enabled: true }
    }
});

await app.start(3000);
console.log(`Server running on port: ${app.getPort()}`); // Might be 3001 if 3000 was taken
```

### `forceClosePort(port: number): Promise<boolean>`

Attempts to forcefully close/free up the specified port by terminating the process using it.

**Parameters:**
- `port: number` - The port number to force close

**Returns:** `Promise<boolean>` - `true` if successful, `false` if failed

**Platform Support:**
- ✅ Windows (uses `netstat` and `taskkill`)
- ✅ Unix/Linux/macOS (uses `lsof` and `kill`)

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

### `redirectFromPort(fromPort: number, toPort: number): Promise<boolean>`

Sets up automatic request redirection from one port to another using a proxy server.

**Parameters:**
- `fromPort: number` - The source port to redirect from
- `toPort: number` - The destination port to redirect to

**Returns:** `Promise<boolean>` - `true` if redirect setup successful

**Dependencies:**
- Requires `http-proxy-middleware` package: `npm install http-proxy-middleware`

**Example:**
```typescript
// Redirect all requests from port 3000 to the current running port
const redirectSuccess = await app.redirectFromPort(3000, app.getPort());
if (redirectSuccess) {
    console.log("Redirect active: 3000 → " + app.getPort());
    // Now requests to http://localhost:3000 will be forwarded to the actual port
}
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
    await app.forceClosePort(3000);  // Free up the original port
    await app.redirectFromPort(3000, actualPort);  // Redirect traffic
}
```

## Complete Example

```typescript
import { createServer } from "fortifyjs";

async function portManagementExample() {
    const app = createServer({
        server: {
            autoPortSwitch: {
                enabled: true,
                maxAttempts: 5,
                strategy: "increment",
                onPortSwitch: (originalPort, newPort) => {
                    console.log(`🔄 Auto-switched: ${originalPort} → ${newPort}`);
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
        });
    });

    try {
        // Start server
        await app.start(3000);
        const actualPort = app.getPort();
        
        console.log(`✅ Server running on port: ${actualPort}`);
        console.log(`🔗 API: http://localhost:${actualPort}/api/status`);

        // If port switched, set up redirect for convenience
        if (actualPort !== 3000) {
            console.log("Setting up redirect from original port...");
            
            // Try to free up the original port
            const closeSuccess = await app.forceClosePort(3000);
            if (closeSuccess) {
                // Set up redirect
                const redirectSuccess = await app.redirectFromPort(3000, actualPort);
                if (redirectSuccess) {
                    console.log(`🔄 Redirect active: 3000 → ${actualPort}`);
                    console.log(`🔗 Original URL still works: http://localhost:3000/api/status`);
                }
            }
        }

    } catch (error) {
        console.error("❌ Error:", error.message);
    }
}

portManagementExample();
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

All methods are fully typed:

```typescript
interface UltraFastApp {
    getPort(): number;
    forceClosePort(port: number): Promise<boolean>;
    redirectFromPort(fromPort: number, toPort: number): Promise<boolean>;
}
```
