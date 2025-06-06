# Quick Start Guide

## Installation

```bash
npm install fortifyjs
# or
yarn add fortifyjs
# or
bun add fortifyjs
```

## Basic Server

```typescript
import { createServer } from "fortify2-js";

const app = createServer();

app.get("/", (req, res) => {
    res.json({ message: "Hello, FastServer!" });
});

app.start(3000);
```

## Development Setup

```typescript
import { createServer } from "fortify2-js";

const app = createServer({
    // Clean logging for development
    logging: {
        level: "info",
        components: {
            server: true,
            cache: false, // Reduce noise
            performance: false, // Reduce noise
            security: false, // Hide UFSIMC warnings
            fileWatcher: true, // Show hot reload
            cluster: false, // Disable cluster logs
        },
        format: {
            colors: true,
            prefix: true,
        },
    },

    // Auto port switching for convenience
    server: {
        autoPortSwitch: {
            enabled: true,
            maxAttempts: 5,
            strategy: "increment",
        },
    },

    // Hot reload for development
    fileWatcher: {
        enabled: true,
        watchPaths: ["./src"],
        extensions: [".ts", ".js"],
    },

    // Basic caching
    cache: {
        enabled: true,
        strategy: "memory",
    },
});

// Your routes here
app.get("/api/users", (req, res) => {
    res.json([{ id: 1, name: "John" }]);
});

app.start(3000);
```

## Production Setup

```typescript
import { createServer } from "fortify2-js";

const app = createServer({
    env: "production",

    // Production logging
    logging: {
        level: "warn",
        components: {
            server: true,
            security: true,
            monitoring: true,
            cluster: true,
        },
        format: {
            timestamps: true,
            colors: false,
            compact: true,
        },
    },

    // Clustering for scalability
    cluster: {
        enabled: true,
        config: {
            workers: "auto",
            autoRestart: true,
            healthCheck: { enabled: true },
        },
    },

    // Redis cache for production
    cache: {
        enabled: true,
        strategy: "redis",
        redis: {
            host: process.env.REDIS_HOST || "localhost",
            port: parseInt(process.env.REDIS_PORT || "6379"),
        },
    },

    // Performance optimization
    performance: {
        optimizationEnabled: true,
        preCompilerEnabled: true,
        aggressiveOptimization: true,
    },
});

app.start(process.env.PORT || 8080);
```

## Cached Routes

```typescript
// Cache GET requests
app.getWithCache(
    "/api/users",
    {
        cache: {
            enabled: true,
            ttl: 300000, // 5 minutes
            tags: ["users"],
        },
    },
    (req, res) => {
        res.json(users);
    }
);

// Cache with custom key
app.getWithCache(
    "/api/user/:id",
    {
        cache: {
            enabled: true,
            ttl: 600000, // 10 minutes
            key: (req) => `user:${req.params.id}`,
            tags: ["users"],
        },
    },
    (req, res) => {
        const user = findUser(req.params.id);
        res.json(user);
    }
);

// Invalidate cache on updates
app.post("/api/users", async (req, res) => {
    const newUser = createUser(req.body);

    // Invalidate users cache
    await app.invalidateCache("users:*");

    res.json(newUser);
});
```

## Common Configurations

### Silent Mode (Testing)

```typescript
const app = createServer({
    logging: { level: "silent" },
});
```

### Debug Mode

```typescript
const app = createServer({
    logging: {
        level: "debug",
        components: {
            /* all enabled */
        },
    },
});
```

### High Performance

```typescript
const app = createServer({
    performance: {
        optimizationEnabled: true,
        preCompilerEnabled: true,
        aggressiveOptimization: true,
        parallelProcessing: true,
    },
    cache: {
        strategy: "hybrid",
        memory: { maxSize: 200 },
    },
});
```

### Minimal Logging

```typescript
const app = createServer({
    logging: {
        level: "info",
        components: {
            server: true,
            cache: false,
            cluster: false,
            performance: false,
            fileWatcher: false,
            plugins: false,
            security: false,
            monitoring: false,
            routes: false,
        },
        types: {
            warnings: false, // Hide UFSIMC warnings
            startup: true,
            errors: true,
        },
    },
});
```

## Environment Variables

```bash
# Server configuration
PORT=3000
HOST=localhost
NODE_ENV=production

# Cache configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-password

# Security (to avoid UFSIMC warnings)
ENC_SECRET_KEY=your-32-character-secret-key-here
# or
ENC_SECRET_SEED=your-secret-seed
ENC_SECRET_SALT=your-secret-salt

# Logging
LOG_LEVEL=info
```

## Health Checks

```typescript
// Built-in health endpoint
app.get("/health", (req, res) => {
    res.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

// Custom health check
app.get("/health/detailed", async (req, res) => {
    const health = {
        status: "healthy",
        cache: await app.getCacheStats(),
        performance: await app.getPerformanceStats(),
    };
    res.json(health);
});
```

## Error Handling

```typescript
// Global error handler
app.use((error, req, res, next) => {
    console.error("Error:", error.message);

    res.status(500).json({
        error: "Internal Server Error",
        ...(process.env.NODE_ENV === "development" && {
            details: error.message,
        }),
    });
});

// Graceful shutdown
process.on("SIGTERM", async () => {
    console.log("Shutting down gracefully...");
    await app.stopCluster?.(true);
    process.exit(0);
});
```

## Next Steps

1. **Read the [Configuration Guide](./configuration.md)** for detailed options
2. **Check [Performance Optimization](./performance.md)** for ultra-fast setup
3. **Review [Production Setup](./examples/production.md)** for deployment
4. **See [Troubleshooting](./troubleshooting.md)** for common issues

## Common Issues

### Port Already in Use

```typescript
server: {
    autoPortSwitch: {
        enabled: true;
    }
}
```

### Too Many Logs

```typescript
logging: {
    level: "warn",
    types: { warnings: false }
}
```

### Memory Issues

```typescript
cache: {
    memory: {
        maxSize: 50;
    } // Reduce cache size
}
```

### Performance Issues

```typescript
performance: {
    optimizationEnabled: true,
    preCompilerEnabled: true
}
```
