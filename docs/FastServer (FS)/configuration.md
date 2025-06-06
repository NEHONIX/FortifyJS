# Configuration Guide

## Overview

FastServer provides extensive configuration options to optimize performance, security, and functionality for different deployment scenarios. This guide covers all configuration options with practical examples.

## Basic Configuration

### Minimal Setup

```typescript
import { createServer } from "fortify2-js";

const app = createServer({
    server: {
        port: 3000,
        host: "localhost",
    },
});
```

### Development Configuration

```typescript
const app = createServer({
    env: "development",
    server: {
        port: 3000,
        host: "localhost",
        autoPortSwitch: {
            enabled: true,
            maxAttempts: 5,
            strategy: "increment",
        },
    },
    logging: {
        level: "debug",
        components: {
            server: true,
            cache: true,
            cluster: false,
            performance: true,
            fileWatcher: true,
            plugins: true,
            security: true,
            monitoring: true,
            routes: true,
        },
        format: {
            colors: true,
            timestamps: true,
            prefix: true,
        },
    },
    fileWatcher: {
        enabled: true,
        watchPaths: ["./src"],
        ignorePaths: ["./node_modules", "./dist"],
        extensions: [".ts", ".js", ".json"],
        debounceMs: 100,
        restartDelay: 1000,
    },
    cache: {
        enabled: true,
        strategy: "memory",
    },
    performance: {
        optimizationEnabled: false, // Disable for faster restarts
        preCompilerEnabled: false,
    },
});
```

### Production Configuration

```typescript
const app = createServer({
    env: "production",
    server: {
        port: process.env.PORT || 8080,
        host: "0.0.0.0",
        trustProxy: true,
        autoPortSwitch: {
            enabled: false, // Disable in production
        },
    },
    logging: {
        level: "warn",
        components: {
            server: true,
            cache: false,
            cluster: true,
            performance: false,
            fileWatcher: false,
            plugins: false,
            security: true,
            monitoring: true,
            routes: false,
        },
        types: {
            startup: true,
            warnings: true,
            errors: true,
            performance: false,
            debug: false,
            hotReload: false,
            portSwitching: false,
        },
        format: {
            colors: false,
            timestamps: true,
            prefix: true,
            compact: true,
        },
    },
    cluster: {
        enabled: true,
        config: {
            workers: "auto", // Use all CPU cores
            autoRestart: true,
            maxRestarts: 5,
            restartDelay: 1000,
            healthCheck: {
                enabled: true,
                interval: 30000,
                timeout: 5000,
                retries: 3,
            },
        },
    },
    cache: {
        enabled: true,
        strategy: "redis",
        redis: {
            host: process.env.REDIS_HOST || "localhost",
            port: parseInt(process.env.REDIS_PORT || "6379"),
            password: process.env.REDIS_PASSWORD,
            cluster: true,
            pool: {
                min: 5,
                max: 20,
                acquireTimeoutMillis: 30000,
                idleTimeoutMillis: 30000,
            },
        },
    },
    performance: {
        optimizationEnabled: true,
        requestClassification: true,
        predictivePreloading: true,
        aggressiveCaching: true,
        parallelProcessing: true,
        preCompilerEnabled: true,
        learningPeriod: 60000,
        optimizationThreshold: 1,
        aggressiveOptimization: true,
        cacheWarmupEnabled: true,
        warmupOnStartup: true,
    },
    security: {
        encryption: true,
        accessMonitoring: true,
        sanitization: true,
        auditLogging: true,
        cors: true,
        helmet: true,
    },
    monitoring: {
        enabled: true,
        healthChecks: true,
        metrics: true,
        detailed: false,
        alertThresholds: {
            memoryUsage: 85,
            hitRate: 70,
            errorRate: 5,
            latency: 100,
        },
    },
});
```

## Logging Configuration

### Log Levels

| Level     | Description            | Use Case              |
| --------- | ---------------------- | --------------------- |
| `silent`  | No logging output      | Testing environments  |
| `error`   | Error messages only    | Production (minimal)  |
| `warn`    | Warnings and errors    | Production (standard) |
| `info`    | Informational messages | Development/staging   |
| `debug`   | Debug information      | Development           |
| `verbose` | All logging output     | Debugging             |

### Component-Specific Logging

```typescript
logging: {
    level: "info",
    components: {
        server: true,      // Server startup/shutdown
        cache: false,      // Cache operations (can be noisy)
        cluster: true,     // Cluster management
        performance: false, // Performance metrics (verbose)
        fileWatcher: true, // File watching events
        plugins: false,    // Plugin system (verbose)
        security: true,    // Security warnings/events
        monitoring: true,  // Health monitoring
        routes: false      // Route compilation (verbose)
    }
}
```

### Log Type Controls

```typescript
logging: {
    types: {
        startup: true,        // Component initialization
        warnings: false,      // Warning messages (e.g., UFSIMC warnings)
        errors: true,         // Error messages (always recommended)
        performance: false,   // Performance measurements
        debug: false,         // Debug information
        hotReload: true,      // Hot reload notifications
        portSwitching: true   // Auto port switching logs
    }
}
```

### Custom Logger

```typescript
logging: {
    customLogger: (level, component, message, ...args) => {
        // Custom logging implementation
        const timestamp = new Date().toISOString();
        console.log(
            `[${timestamp}] [${level.toUpperCase()}] [${component}] ${message}`,
            ...args
        );
    };
}
```

## Auto Port Switching

### Basic Configuration

```typescript
server: {
    port: 3000,
    autoPortSwitch: {
        enabled: true,
        maxAttempts: 10,
        strategy: "increment"
    }
}
```

### Advanced Port Switching

```typescript
server: {
    port: 3000,
    autoPortSwitch: {
        enabled: true,
        maxAttempts: 5,
        strategy: "predefined",
        predefinedPorts: [3000, 3001, 8080, 8081, 9000],
        onPortSwitch: (originalPort, newPort) => {
            console.log(`Service moved from port ${originalPort} to ${newPort}`);
            // Update service discovery, load balancer, etc.
        }
    }
}
```

### Port Range Strategy

```typescript
server: {
    port: 3000,
    autoPortSwitch: {
        enabled: true,
        strategy: "random",
        portRange: [3000, 4000],
        maxAttempts: 20
    }
}
```

## Environment-Specific Configurations

### Environment Variables

```typescript
const app = createServer({
    env: process.env.NODE_ENV as "development" | "production" | "test",
    server: {
        port: parseInt(process.env.PORT || "3000"),
        host: process.env.HOST || "localhost",
    },
    cache: {
        strategy: (process.env.CACHE_STRATEGY as any) || "memory",
        redis: {
            host: process.env.REDIS_HOST,
            port: parseInt(process.env.REDIS_PORT || "6379"),
            password: process.env.REDIS_PASSWORD,
        },
    },
});
```

### Configuration Factory

```typescript
function createConfig(env: string) {
    const baseConfig = {
        server: { port: 3000 },
        cache: { enabled: true },
    };

    switch (env) {
        case "development":
            return {
                ...baseConfig,
                logging: { level: "debug" as const },
                fileWatcher: { enabled: true },
                performance: { optimizationEnabled: false },
            };

        case "production":
            return {
                ...baseConfig,
                server: { ...baseConfig.server, port: 8080 },
                logging: { level: "warn" as const },
                cluster: { enabled: true },
                performance: { optimizationEnabled: true },
            };

        default:
            return baseConfig;
    }
}

const app = createServer(createConfig(process.env.NODE_ENV || "development"));
```
