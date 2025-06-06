# FastServer Documentation

## Overview

FastServer (FS) is a high-performance Express.js server implementation built on the UltraFastServer (UFS) architecture. It provides enterprise-grade features including advanced caching, clustering, performance optimization, and comprehensive logging control while maintaining full Express.js compatibility.

## Key Features

-   **Ultra-Fast Performance**: Optimized for ≤20ms response times for simple requests
-   **Advanced Middleware System**: Priority-based middleware with caching and performance tracking
-   **Advanced Caching**: Multi-tier caching with encryption and compression
-   **Intelligent Clustering**: Auto-scaling cluster management with health monitoring
-   **Performance Optimization**: Request pre-compilation and predictive preloading
-   **Auto Port Switching**: Automatic port conflict resolution with port management methods
-   **Port Management**: Get running port, force close ports, and set up redirections
-   **Hot Reload**: Development-friendly file watching with instant restarts
-   **Comprehensive Logging**: Granular logging control with component-specific settings
-   **Security**: Built-in encryption, rate limiting, and security monitoring
-   **Modular Architecture**: Component-based design for maintainability and extensibility

## Quick Start

```typescript
import { createServer } from "fortify2-js";

const app = createServer({
    server: {
        port: 3000,
        host: "localhost",
        enableMiddleware: true,
    },
    performance: {
        optimizationEnabled: true,
        enablePerformanceTracking: true,
    },
    cache: {
        enabled: true,
        strategy: "memory",
    },
});

// Configure middleware with built-in features
const middleware = app.middleware({
    rateLimit: { max: 100, windowMs: 60000 },
    cors: true,
    compression: true,
    security: { helmet: true },
});

// Register custom middleware
middleware.register((req, res, next) => {
    console.log(`${req.method} ${req.path} - ${Date.now()}`);
    next();
});

app.get("/api/users", (req, res) => {
    res.json({ users: [] });
});

await app.start(3000);

// Get the actual running port (useful with autoPortSwitch)
console.log(`Server running on port: ${app.getPort()}`);

// Optional: Port management methods
// await app.forceClosePort(3001);  // Force close occupied port
// await app.redirectFromPort(3001, app.getPort());  // Redirect traffic
```

## Documentation Structure

### Core Documentation

-   [API Reference](./api-reference.md) - Complete API documentation for createServer function
-   [Configuration Guide](./configuration.md) - Detailed configuration options and examples
-   [Architecture Overview](./architecture.md) - System architecture and component design
-   [Component System](./components.md) - Modular component architecture details

### Feature Guides

-   [Middleware System](./middleware.md) - Priority-based middleware with performance optimization
-   [Caching System](./caching.md) - Multi-tier caching with UFSIMC and Redis
-   [Clustering](./clustering.md) - Auto-scaling cluster management
-   [Performance Optimization](./performance.md) - Ultra-fast performance tuning
-   [Logging System](./logging.md) - Granular logging control system

### Practical Examples

-   [Basic Usage](./examples/basic-usage.md) - Simple server setup and REST APIs
-   [Production Setup](./examples/production.md) - Enterprise deployment configurations
-   [Troubleshooting](./troubleshooting.md) - Common issues and diagnostic solutions

### Quick Reference

-   **Performance Targets**: ≤7ms simple requests, ≤20ms hot requests
-   **Middleware Overhead**: <0.1ms per middleware
-   **Default Port**: 3000 (auto-switching available)
-   **Cache Strategies**: Memory (UFSIMC), Redis, Hybrid
-   **Middleware Priorities**: Critical, High, Normal, Low
-   **Clustering**: Auto-scaling with health monitoring
-   **Logging Levels**: silent, error, warn, info, debug, verbose

## System Requirements

-   Node.js 16+ or Bun runtime
-   TypeScript 4.5+ (for TypeScript projects)
-   Memory: 512MB minimum, 2GB+ recommended for production
-   CPU: Multi-core recommended for clustering features

## Installation

```bash
npm install fortifyjs
# or
yarn add fortifyjs
# or
bun add fortifyjs
```

## Support

For issues, questions, or contributions, please refer to:

-   [Troubleshooting Guide](./troubleshooting.md)
-   [GitHub Issues](https://github.com/NEHONIX/fortifyjs/issues)
-   [API Reference](./api-reference.md)

## License

MIT License - see LICENSE file for details.
