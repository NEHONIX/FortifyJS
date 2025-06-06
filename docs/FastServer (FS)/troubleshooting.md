# Troubleshooting Guide

## Common Issues and Solutions

### Server Startup Issues

#### Port Already in Use (EADDRINUSE)

**Problem**: Server fails to start with "EADDRINUSE" error.

**Solution**: Enable auto port switching or manually specify a different port.

```typescript
// Enable auto port switching
const app = createServer({
    server: {
        port: 3000,
        autoPortSwitch: {
            enabled: true,
            maxAttempts: 5,
            strategy: "increment",
        },
    },
});

// Or use environment variable
const port = process.env.PORT || 3000;
```

**Diagnostic Commands**:

```bash
# Check what's using the port
netstat -tulpn | grep :3000
lsof -i :3000

# Kill process using port
kill -9 $(lsof -t -i:3000)
```

#### Memory Allocation Errors

**Problem**: "Cannot allocate memory" or "Out of memory" errors.

**Solution**: Adjust memory limits and enable memory optimization.

```typescript
const app = createServer({
    performance: {
        memoryOptimization: {
            enabled: true,
            gcInterval: 30000,
            memoryThreshold: 0.8,
            objectPooling: true,
        },
    },
    cache: {
        memory: {
            maxSize: 100, // Reduce cache size
        },
    },
});
```

**Node.js Memory Flags**:

```bash
# Increase heap size
node --max-old-space-size=4096 server.js

# Enable memory monitoring
node --inspect --max-old-space-size=2048 server.js
```

### Performance Issues

#### Slow Response Times

**Problem**: Response times exceed target thresholds.

**Diagnostic Steps**:

1. **Check Performance Stats**:

```typescript
const stats = await app.getPerformanceStats();
console.log({
    averageResponseTime: stats.averageResponseTime,
    p95ResponseTime: stats.p95ResponseTime,
    cacheHitRate: stats.cacheHitRate,
    throughput: stats.throughput,
});
```

2. **Enable Performance Profiling**:

```typescript
const app = createServer({
    performance: {
        profiling: {
            enabled: true,
            sampleRate: 0.1,
            stackTraces: true,
        },
    },
});
```

3. **Analyze Bottlenecks**:

```typescript
const bottlenecks = await app.analyzeBottlenecks();
console.log(bottlenecks.slowestRoutes);
```

**Solutions**:

-   Enable caching for slow routes
-   Increase cache size
-   Enable request pre-compilation
-   Use parallel processing
-   Optimize database queries

#### High Memory Usage

**Problem**: Memory usage continuously increases or exceeds limits.

**Diagnostic Steps**:

1. **Monitor Memory Usage**:

```typescript
setInterval(() => {
    const usage = process.memoryUsage();
    console.log({
        heapUsed: Math.round(usage.heapUsed / 1024 / 1024) + "MB",
        heapTotal: Math.round(usage.heapTotal / 1024 / 1024) + "MB",
        external: Math.round(usage.external / 1024 / 1024) + "MB",
    });
}, 5000);
```

2. **Check Cache Statistics**:

```typescript
const cacheStats = await app.getCacheStats();
console.log({
    memoryUsage: cacheStats.memoryUsage,
    entryCount: cacheStats.entryCount,
    totalSize: cacheStats.totalSize,
});
```

**Solutions**:

```typescript
// Reduce cache size
cache: {
    memory: {
        maxSize: 50,  // Reduce from default
        gcInterval: 15000,  // More frequent cleanup
        evictionPolicy: "lru"
    }
}

// Enable memory optimization
performance: {
    memoryOptimization: {
        enabled: true,
        gcInterval: 30000,
        memoryThreshold: 0.7,  // Lower threshold
        objectPooling: true
    }
}
```

### Clustering Issues

#### Workers Not Starting

**Problem**: Cluster workers fail to start or immediately exit.

**Diagnostic Steps**:

1. **Check Worker Logs**:

```typescript
cluster: {
    config: {
        logging: {
            enabled: true,
            includeWorkerLogs: true
        }
    }
}
```

2. **Monitor Worker Health**:

```typescript
const health = await app.getClusterHealth();
console.log({
    totalWorkers: health.totalWorkers,
    healthyWorkers: health.healthyWorkers,
    unhealthyWorkers: health.unhealthyWorkers,
});
```

**Common Causes and Solutions**:

-   **Resource Limits**: Reduce worker count or increase system resources
-   **Port Conflicts**: Ensure workers use different ports or shared port
-   **Memory Limits**: Reduce per-worker memory allocation
-   **Initialization Errors**: Check worker initialization code

#### Worker Crashes

**Problem**: Workers frequently crash and restart.

**Solution**: Implement proper error handling and resource management.

```typescript
// Graceful error handling
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    // Graceful shutdown
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection:', reason);
    // Graceful shutdown
    process.exit(1);
});

// Resource limits
cluster: {
    config: {
        limits: {
            memory: 512,  // 512MB per worker
            cpu: 80,      // 80% CPU limit
            requests: 1000 // Max requests per worker
        },
        autoRestart: true,
        maxRestarts: 3,
        restartDelay: 2000
    }
}
```

### Cache Issues

#### Low Cache Hit Rate

**Problem**: Cache hit rate is below expected levels.

**Diagnostic Steps**:

1. **Analyze Cache Patterns**:

```typescript
const stats = await app.cache.getDetailedStats();
console.log({
    hitRate: stats.hitRate,
    hotKeys: stats.hotKeys,
    coldKeys: stats.coldKeys,
    evictionRate: stats.evictionRate,
});
```

2. **Check Cache Configuration**:

```typescript
// Increase cache size
cache: {
    memory: {
        maxSize: 200,  // Increase cache size
        algorithm: "lru"
    },
    ttl: 600000  // Increase TTL
}
```

**Solutions**:

-   Increase cache size
-   Optimize cache keys
-   Increase TTL for stable data
-   Use cache warming
-   Implement cache hierarchies

#### Cache Memory Leaks

**Problem**: Cache memory usage continuously grows.

**Solution**: Implement proper cache cleanup and monitoring.

```typescript
cache: {
    memory: {
        maxSize: 100,
        gcInterval: 30000,  // Frequent cleanup
        memoryPressureThreshold: 0.8,
        evictionBatchSize: 50
    },
    monitoring: {
        enabled: true,
        alertThresholds: {
            memoryUsage: 85,
            entryCount: 10000
        }
    }
}
```

### Logging Issues

#### Too Many Logs

**Problem**: Excessive logging output affecting performance.

**Solution**: Configure granular logging controls.

```typescript
logging: {
    level: "warn",  // Reduce log level
    components: {
        server: true,
        cache: false,     // Disable noisy components
        performance: false,
        plugins: false
    },
    types: {
        warnings: false,  // Disable warnings
        debug: false,
        performance: false
    }
}
```

#### Missing Important Logs

**Problem**: Critical information not being logged.

**Solution**: Enable specific logging components and types.

```typescript
logging: {
    level: "info",
    components: {
        server: true,
        security: true,   // Enable security logs
        monitoring: true, // Enable monitoring logs
        cluster: true     // Enable cluster logs
    },
    types: {
        errors: true,     // Always enable errors
        warnings: true,   // Enable warnings
        startup: true     // Enable startup logs
    }
}
```

### Security Issues

#### UFSIMC Encryption Warnings

**Problem**: Repeated "UFSIMC-WARNING: Using generated key" messages.

**Solution**: Set proper encryption environment variables.

```bash
# Set encryption key
export ENC_SECRET_KEY="your-32-character-secret-key-here"

# Or use seed and salt
export ENC_SECRET_SEED="your-secret-seed"
export ENC_SECRET_SALT="your-secret-salt"
```

**Alternative**: Disable security warnings in development.

```typescript
logging: {
    types: {
        warnings: false; // Disable security warnings
    }
}
```

### Network Issues

#### Connection Timeouts

**Problem**: Requests timing out or connections being refused.

**Solution**: Optimize network configuration.

```typescript
server: {
    timeout: 30000,  // 30 second timeout
    keepAliveTimeout: 65000,
    headersTimeout: 66000
}

performance: {
    network: {
        keepAlive: true,
        maxSockets: 100,
        timeout: 30000
    }
}
```

#### High Connection Count

**Problem**: Too many concurrent connections.

**Solution**: Implement connection limits and pooling.

```typescript
cluster: {
    config: {
        limits: {
            connections: 100  // Limit per worker
        }
    }
}

performance: {
    connectionPooling: true,
    maxConcurrency: 50
}
```

## Debugging Tools

### Performance Monitoring

```typescript
// Enable comprehensive monitoring
const app = createServer({
    monitoring: {
        enabled: true,
        detailed: true,
        healthChecks: true,
        metrics: true,
        alertThresholds: {
            memoryUsage: 85,
            hitRate: 70,
            errorRate: 5,
            latency: 100,
        },
    },
});
```

### Debug Logging

```typescript
// Enable debug logging
const app = createServer({
    logging: {
        level: "debug",
        components: {
            server: true,
            cache: true,
            performance: true,
        },
        format: {
            timestamps: true,
            colors: true,
        },
    },
});
```

### Health Checks

```typescript
// Comprehensive health endpoint
app.get("/health/detailed", async (req, res) => {
    const health = {
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        cache: await app.getCacheStats(),
        cluster: await app.getClusterHealth(),
        performance: await app.getPerformanceStats(),
    };

    res.json(health);
});
```

## Environment-Specific Troubleshooting

### Development Environment

```typescript
// Development debugging configuration
const developmentConfig = {
    logging: {
        level: "debug",
        components: {
            /* all enabled */
        },
        format: { colors: true, timestamps: true },
    },
    performance: {
        optimizationEnabled: false, // Disable for faster restarts
        profiling: { enabled: true },
    },
    fileWatcher: {
        enabled: true,
        verbose: true,
    },
};
```

### Production Environment

```typescript
// Production monitoring configuration
const productionConfig = {
    logging: {
        level: "warn",
        customLogger: (level, component, message, ...args) => {
            // Send to external logging service
            externalLogger.log({ level, component, message, args });
        },
    },
    monitoring: {
        enabled: true,
        detailed: false,
        alerting: true,
    },
};
```

## Getting Help

### Diagnostic Information

When reporting issues, include:

1. **System Information**:

```bash
node --version
npm --version
uname -a
```

2. **Application Configuration**:

```typescript
console.log(JSON.stringify(serverConfig, null, 2));
```

3. **Performance Stats**:

```typescript
const stats = await app.getPerformanceStats();
console.log(JSON.stringify(stats, null, 2));
```

4. **Error Logs**:

```typescript
// Enable error logging
logging: {
    level: "error",
    types: { errors: true }
}
```

### Support Channels

-   GitHub Issues: [https://github.com/NEHONIX/fortifyjs/issues](https://github.com/NEHONIX/fortifyjs/issues)
-   Documentation: [FastServer Documentation](./README.md)
-   Performance Guide: [Performance Optimization](./performance.md)
