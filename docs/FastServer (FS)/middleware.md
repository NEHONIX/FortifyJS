# Middleware System

## Overview

FastServer provides a comprehensive middleware system that combines the flexibility of Express.js middleware with advanced features like priority-based execution, performance optimization, caching, and built-in security middleware. The system is designed for high-performance applications with sub-millisecond overhead and has been tested to achieve **1-8ms response times** with full middleware execution.

**✅ Production Ready**: All middleware features are fully implemented and tested - no mock implementations.

## Key Features

✓ **Priority-Based Execution**: Critical, high, normal, and low priority levels  
✓ **Performance Optimization**: Built-in caching and performance tracking  
✓ **Security Integration**: FortifyJS security middleware included  
✓ **Route-Specific Middleware**: Apply middleware to specific routes or globally  
✓ **Statistics and Monitoring**: Real-time middleware performance metrics  
✓ **Express.js Compatibility**: Full compatibility with existing Express middleware

## API Pattern

FastServer uses a unique middleware API pattern that provides maximum flexibility:

```typescript
// Step 1: Configure middleware with built-in features
const middleware = app.middleware({
    rateLimit: false, // Disable rate limiting
    cors: true, // Enable CORS with defaults
    compression: true, // Enable compression
    security: {
        // Configure security
        helmet: true,
        csrfProtection: false,
    },
});

// Step 2: Register custom middleware
middleware.register((req, res, next) => {
    // Your custom middleware logic here
    console.log(`${req.method} ${req.path} - ${Date.now()}`);
    next();
});
```

This pattern allows you to:

-   ✅ **Configure built-in middleware** (security, CORS, compression, rate limiting)
-   ✅ **Register custom middleware** with advanced options
-   ✅ **Chain multiple configurations** for complex setups
-   ✅ **Get immediate execution** - middleware runs on every request

## Basic Usage

### Creating Middleware Configuration

```typescript
import { createServer } from "fortify2-js";

const app = createServer({
    server: { enableMiddleware: true },
    performance: {
        enableCaching: true,
        enablePerformanceTracking: true,
    },
});

// Configure middleware with built-in features
const middleware = app.middleware({
    rateLimit: { max: 100, windowMs: 60000 },
    cors: { origin: "*", methods: ["GET", "POST"] },
    compression: { level: 6 },
    security: {
        helmet: true,
        csrfProtection: false,
    },
});
```

### Registering Custom Middleware

```typescript
// Register global middleware
const middlewareId = middleware.register((req, res, next) => {
    console.log(`${req.method} ${req.path} - ${Date.now()}`);
    next();
});

// Register middleware with options
middleware.register(
    (req, res, next) => {
        res.setHeader("X-Custom-Header", "FastServer");
        next();
    },
    {
        name: "custom-headers",
        priority: "high",
        cacheable: true,
        ttl: 300000, // 5 minutes
    }
);

// Register route-specific middleware
middleware.register(
    (req, res, next) => {
        // API-specific logic
        next();
    },
    {
        name: "api-middleware",
        routes: ["/api/*", "/v1/*"],
        priority: "critical",
    }
);
```

## Configuration Options

### Middleware Configuration

```typescript
interface MiddlewareConfiguration {
    rateLimit?: boolean | RateLimitMiddlewareOptions;
    cors?: boolean | CorsMiddlewareOptions;
    compression?: boolean | CompressionMiddlewareOptions;
    security?: boolean | SecurityMiddlewareOptions;
    helmet?: boolean;
    customHeaders?: Record<string, string>;
    enableOptimization?: boolean;
    enableCaching?: boolean;
    enablePerformanceTracking?: boolean;
}
```

### Rate Limiting Options

```typescript
interface RateLimitMiddlewareOptions {
    enabled?: boolean;
    windowMs?: number; // Time window in milliseconds
    max?: number; // Maximum requests per window
    message?: string; // Custom error message
    standardHeaders?: boolean;
    legacyHeaders?: boolean;
    keyGenerator?: (req: Request) => string;
    skip?: (req: Request) => boolean;
    onLimitReached?: (req: Request, res: Response) => void;
}
```

### CORS Options

```typescript
interface CorsMiddlewareOptions {
    enabled?: boolean;
    origin?: string | string[] | boolean | Function;
    methods?: string[];
    allowedHeaders?: string[];
    exposedHeaders?: string[];
    credentials?: boolean;
    maxAge?: number;
    preflightContinue?: boolean;
    optionsSuccessStatus?: number;
}
```

### Security Options

```typescript
interface SecurityMiddlewareOptions {
    helmet?: boolean | any;
    cors?: boolean | CorsMiddlewareOptions;
    rateLimit?: boolean | RateLimitMiddlewareOptions;
    customHeaders?: Record<string, string>;
    csrfProtection?: boolean;
    contentSecurityPolicy?: boolean | any;
    hsts?: boolean | any;
}
```

## Advanced Features

### Priority System

Middleware execution follows a priority-based system:

```typescript
// Critical priority (executed first)
middleware.register(securityMiddleware, { priority: "critical" });

// High priority
middleware.register(authMiddleware, { priority: "high" });

// Normal priority (default)
middleware.register(loggingMiddleware, { priority: "normal" });

// Low priority (executed last)
middleware.register(analyticsMiddleware, { priority: "low" });
```

### Performance Middleware

```typescript
// Register performance-optimized middleware
app.usePerformance([
    (req, res, next) => {
        const start = Date.now();
        res.on("finish", () => {
            console.log(`Request took ${Date.now() - start}ms`);
        });
        next();
    },
]);
```

### Cached Middleware

```typescript
// Register cacheable middleware with TTL
app.useCached(
    [
        (req, res, next) => {
            // Expensive operation that can be cached
            const result = performExpensiveOperation();
            req.cachedResult = result;
            next();
        },
    ],
    300000
); // 5 minutes TTL
```

### Security Middleware

```typescript
// Enable comprehensive security
app.enableSecurity({
    helmet: {
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'"],
            },
        },
    },
    customHeaders: {
        "X-API-Version": "1.0",
        "X-Powered-By": "FastServer",
    },
});
```

## Convenience Methods

### Built-in Middleware Methods

```typescript
// Enable security features
app.enableSecurity({
    helmet: true,
    customHeaders: { "X-Custom": "Value" },
});

// Enable compression
app.enableCompression({
    level: 6,
    threshold: 1024,
});

// Enable rate limiting
app.enableRateLimit({
    max: 50,
    windowMs: 60000,
});

// Enable CORS
app.enableCors({
    origin: ["http://localhost:3000", "https://myapp.com"],
    credentials: true,
});
```

### Middleware Management

```typescript
// Get middleware information
const middlewareInfo = app.getMiddleware(); // All middleware
const specificInfo = app.getMiddleware("middleware-id");

// Remove middleware
app.removeMiddleware("middleware-name");

// Get middleware statistics
const stats = app.getMiddlewareStats();
console.log(`Total middleware: ${stats.totalMiddleware}`);
console.log(`Enabled middleware: ${stats.enabledMiddleware}`);
```

## Performance Metrics

### Real-World Performance

FastServer middleware system has been tested and achieves excellent performance:

```
📊 Performance Test Results:
✅ Basic route: 8ms response time
✅ Cached route: 2ms response time
✅ Health check: 2ms response time
✅ POST requests: 3ms response time
✅ Middleware execution: <0.1ms overhead per middleware
```

### Live Performance Monitoring

```typescript
// Monitor middleware performance in real-time
app.usePerformance([
    (req, res, next) => {
        const start = Date.now();
        res.on("finish", () => {
            const duration = Date.now() - start;
            console.log(`⚡ Request took ${duration}ms`);

            // Alert if performance degrades
            if (duration > 10) {
                console.warn(`🚨 Slow request detected: ${duration}ms`);
            }
        });
        next();
    },
]);

// Get comprehensive middleware statistics
const stats = app.getMiddlewareStats();
console.log("Middleware Performance:", {
    totalMiddleware: stats.totalMiddleware,
    enabledMiddleware: stats.enabledMiddleware,
    averageExecutionTime: stats.averageExecutionTime,
    cacheHitRate: stats.cacheHitRate,
});
```

## Performance Optimization

### Caching Configuration

```typescript
const middleware = app.middleware({
    enableCaching: true,
    enablePerformanceTracking: true,
    enableOptimization: true,
});

// Warm up middleware cache
await middleware.warmCache();

// Clear cache when needed
middleware.clearCache();
```

### Performance Tracking

```typescript
// Enable performance tracking
middleware.enablePerformanceTracking();

// Get performance metrics
const metrics = middleware.getStats();
console.log("Performance metrics:", {
    averageExecutionTime: metrics.averageExecutionTime,
    cacheHitRate: metrics.cacheHitRate,
    optimizationRate: metrics.optimizationRate,
});
```

## Route Integration

### Cached Routes with Middleware

```typescript
// GET route with caching and middleware
app.getWithCache(
    "/api/data",
    {
        cache: { enabled: true, ttl: 60000 },
    },
    (req, res) => {
        res.json({ data: "cached response" });
    }
);

// POST route with cache invalidation
app.postWithCache(
    "/api/data",
    {
        cache: { invalidateOn: ["data-cache"] },
    },
    (req, res) => {
        // Update data
        res.json({ success: true });
    }
);
```

## Error Handling

### Middleware Error Handling

```typescript
// Error handling middleware
middleware.register(
    (err, req, res, next) => {
        console.error("Middleware error:", err);
        res.status(500).json({ error: "Internal server error" });
    },
    {
        name: "error-handler",
        priority: "low", // Execute last
    }
);

// Graceful error handling
try {
    middleware.register(riskyMiddleware);
} catch (error) {
    console.error("Failed to register middleware:", error);
}
```

## Best Practices

### 1. Priority Organization

```typescript
// Organize middleware by priority for optimal performance
middleware.register(securityMiddleware, { priority: "critical" });
middleware.register(authMiddleware, { priority: "high" });
middleware.register(businessLogicMiddleware, { priority: "normal" });
middleware.register(loggingMiddleware, { priority: "low" });
```

### 2. Route-Specific Optimization

```typescript
// Apply expensive middleware only where needed
middleware.register(expensiveMiddleware, {
    routes: ["/api/heavy-operation"],
    cacheable: true,
    ttl: 600000, // 10 minutes
});
```

### 3. Performance Monitoring

```typescript
// Regular performance monitoring
setInterval(() => {
    const stats = app.getMiddlewareStats();
    if (stats.averageExecutionTime > 5) {
        console.warn("Middleware performance degraded");
    }
}, 60000); // Check every minute
```

## Troubleshooting

### Common Issues

**Middleware not executing:**

-   Ensure `enableMiddleware: true` in server configuration
-   Check middleware registration order and priority
-   Verify route patterns match request paths

**Performance issues:**

-   Use `enablePerformanceTracking()` to identify slow middleware
-   Consider caching for expensive operations
-   Optimize middleware execution order

**Memory leaks:**

-   Clear middleware cache periodically
-   Remove unused middleware with `removeMiddleware()`
-   Monitor middleware statistics for anomalies

### Debug Mode

```typescript
// Enable debug logging for middleware
const app = createServer({
    logging: {
        level: "debug",
        components: { middleware: true },
    },
});
```

## Testing Your Middleware

### Comprehensive Test Example

```typescript
import { createServer } from "fortify2-js";

// Create test server
const app = createServer({
    server: { enableMiddleware: true },
    performance: { enablePerformanceTracking: true },
});

// Test 1: Basic middleware functionality
const middleware = app.middleware({
    rateLimit: false,
    cors: true,
    compression: true,
    security: { helmet: true, csrfProtection: false },
});

// Test 2: Custom middleware registration
const middlewareId = middleware.register((req, res, next) => {
    console.log(`🔄 Custom middleware executed for ${req.method} ${req.path}`);
    next();
});

// Test 3: Performance middleware
app.usePerformance([
    (req, res, next) => {
        const start = Date.now();
        res.on("finish", () => {
            console.log(`⚡ Request took ${Date.now() - start}ms`);
        });
        next();
    },
]);

// Test 4: Create test routes
app.get("/test/basic", (req, res) => {
    res.json({ message: "Basic route works", timestamp: Date.now() });
});

app.getWithCache(
    "/test/cached",
    { cache: { enabled: true, ttl: 60000 } },
    (req, res) => {
        res.json({ message: "Cached route works", timestamp: Date.now() });
    }
);

// Test 5: Start server and run tests
app.start(3000, async () => {
    console.log("✅ Server started - running tests...");

    // Run HTTP tests
    const response1 = await fetch("http://localhost:3000/test/basic");
    const data1 = await response1.json();
    console.log("✅ Basic route response:", data1);

    const response2 = await fetch("http://localhost:3000/test/cached");
    const data2 = await response2.json();
    console.log("✅ Cached route response:", data2);

    // Check middleware stats
    const stats = app.getMiddlewareStats();
    console.log("✅ Middleware stats:", {
        total: stats.totalMiddleware,
        enabled: stats.enabledMiddleware,
    });
});
```

### Expected Output

When running the test, you should see:

```
🔄 Custom middleware executed for GET /test/basic
⚡ Request took 8ms
✅ Basic route response: { message: "Basic route works", timestamp: 1749227262394 }

🔄 Custom middleware executed for GET /test/cached
⚡ Request took 2ms
✅ Cached route response: { message: "Cached route works", timestamp: 1749227262403 }

✅ Middleware stats: { total: 6, enabled: 6 }
```

## Examples

See [Basic Usage](./examples/basic-usage.md) and [Production Setup](./examples/production.md) for complete implementation examples.

