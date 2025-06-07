# Caching System

## Overview

FastServer provides a sophisticated multi-tier caching system designed for ultra-high performance. The caching system supports memory, Redis, and hybrid strategies with advanced features like encryption, compression, and intelligent cache warming.

## Cache Strategies

### Memory Cache (UFSIMC)

Ultra-Fast Secure In-Memory Cache with military-grade encryption and intelligent memory management.

**Features:**
- AES-256-GCM encryption
- LRU/LFU eviction policies
- Compression with adaptive algorithms
- Hotness tracking and priority queues
- Sub-millisecond access times

**Configuration:**
```typescript
cache: {
    enabled: true,
    strategy: "memory",
    memory: {
        maxSize: 100,              // 100MB
        algorithm: "lru",          // LRU eviction
        evictionPolicy: "lru",     // Eviction strategy
        checkPeriod: 60000,        // Cleanup interval
        preallocation: true        // Pre-allocate memory
    }
}
```

### Redis Cache

Distributed caching with Redis support including clustering and connection pooling.

**Features:**
- Redis cluster support
- Connection pooling
- Automatic failover
- Persistence options
- Cross-instance cache sharing

**Configuration:**
```typescript
cache: {
    enabled: true,
    strategy: "redis",
    redis: {
        host: "localhost",
        port: 6379,
        password: "your-password",
        db: 0,
        cluster: true,
        nodes: [
            { host: "redis-1", port: 6379 },
            { host: "redis-2", port: 6379 },
            { host: "redis-3", port: 6379 }
        ],
        pool: {
            min: 5,                    // Min connections
            max: 20,                   // Max connections
            acquireTimeoutMillis: 30000,
            idleTimeoutMillis: 30000
        }
    }
}
```

### Hybrid Cache

Multi-tier caching combining memory (L1) and Redis (L2) for optimal performance.

**Features:**
- L1 cache (memory) for ultra-fast access
- L2 cache (Redis) for larger capacity
- Automatic cache coherency
- Intelligent promotion/demotion
- Configurable tier thresholds

**Configuration:**
```typescript
cache: {
    enabled: true,
    strategy: "hybrid",
    memory: {
        maxSize: 50,               // 50MB L1 cache
        algorithm: "lru"
    },
    redis: {
        host: "localhost",
        port: 6379,
        pool: { min: 2, max: 10 }
    }
}
```

## Route-Level Caching

### Basic Route Caching

```typescript
app.getWithCache('/api/users', 
    {
        cache: {
            enabled: true,
            ttl: 300000,              // 5 minutes
            strategy: "memory"
        }
    },
    (req, res) => {
        res.json({ users: getUsersFromDB() });
    }
);
```

### Advanced Route Caching

```typescript
app.getWithCache('/api/user/:id',
    {
        cache: {
            enabled: true,
            ttl: 600000,              // 10 minutes
            key: (req) => `user:${req.params.id}:${req.query.include || 'basic'}`,
            tags: ['users', 'profiles'],
            invalidateOn: ['user:update', 'user:delete'],
            strategy: "hybrid"
        }
    },
    async (req, res) => {
        const user = await getUserById(req.params.id);
        res.json(user);
    }
);
```

### Dynamic Cache Keys

```typescript
app.getWithCache('/api/search',
    {
        cache: {
            enabled: true,
            ttl: 180000,              // 3 minutes
            key: (req) => {
                const { q, page = 1, limit = 10, sort = 'relevance' } = req.query;
                return `search:${q}:${page}:${limit}:${sort}`;
            },
            tags: ['search', 'content']
        }
    },
    async (req, res) => {
        const results = await searchContent(req.query);
        res.json(results);
    }
);
```

## Cache Management

### Manual Cache Operations

```typescript
// Set cache value
await app.cache.set('user:123', userData, { ttl: 300000 });

// Get cache value
const user = await app.cache.get('user:123');

// Delete cache value
await app.cache.del('user:123');

// Check if key exists
const exists = await app.cache.has('user:123');

// Get cache statistics
const stats = await app.getCacheStats();
```

### Cache Invalidation

```typescript
// Invalidate by pattern
await app.invalidateCache('user:*');

// Invalidate by tags
await app.cache.invalidateByTags(['users', 'profiles']);

// Invalidate specific keys
await app.cache.invalidateKeys(['user:123', 'user:456']);

// Clear all cache
await app.cache.clear();
```

### Cache Warming

```typescript
// Warm cache on startup
await app.warmUpCache([
    { key: 'config:app', value: appConfig, ttl: 3600000 },
    { key: 'users:active', value: activeUsers, ttl: 300000 },
    { key: 'products:featured', value: featuredProducts, ttl: 600000 }
]);

// Programmatic cache warming
async function warmUserCache() {
    const popularUsers = await getPopularUsers();
    
    for (const user of popularUsers) {
        await app.cache.set(`user:${user.id}`, user, { 
            ttl: 600000,
            tags: ['users', 'popular']
        });
    }
}
```

## Advanced Features

### Cache Compression

```typescript
cache: {
    enabled: true,
    strategy: "memory",
    compression: {
        enabled: true,
        algorithm: "gzip",         // gzip, deflate, brotli
        threshold: 1024,           // Compress if > 1KB
        level: 6                   // Compression level (1-9)
    }
}
```

### Cache Encryption

```typescript
cache: {
    enabled: true,
    strategy: "memory",
    encryption: {
        enabled: true,
        algorithm: "aes-256-gcm",
        key: process.env.CACHE_ENCRYPTION_KEY,
        rotationInterval: 86400000 // 24 hours
    }
}
```

### Cache Monitoring

```typescript
cache: {
    enabled: true,
    strategy: "hybrid",
    monitoring: {
        enabled: true,
        metricsInterval: 60000,    // 1 minute
        alertThresholds: {
            hitRate: 70,           // Alert if hit rate < 70%
            memoryUsage: 85,       // Alert if memory > 85%
            errorRate: 5           // Alert if error rate > 5%
        }
    }
}
```

## Performance Optimization

### Cache Performance Tuning

```typescript
cache: {
    enabled: true,
    strategy: "memory",
    performance: {
        batchSize: 100,            // Batch operations
        asyncWrite: true,          // Async write operations
        prefetchEnabled: true,     // Enable prefetching
        connectionPooling: true,   // Pool connections
        pipelining: true,          // Pipeline Redis commands
        lazyExpiration: true       // Lazy expiration cleanup
    }
}
```

### Memory Management

```typescript
cache: {
    enabled: true,
    strategy: "memory",
    memory: {
        maxSize: 200,              // 200MB limit
        gcInterval: 30000,         // Garbage collection interval
        memoryPressureThreshold: 0.8, // GC at 80% memory
        evictionBatchSize: 50,     // Evict in batches
        preallocation: true,       // Pre-allocate memory pools
        memoryMapping: true        // Use memory mapping
    }
}
```

### Cache Partitioning

```typescript
cache: {
    enabled: true,
    strategy: "memory",
    partitioning: {
        enabled: true,
        strategy: "hash",          // hash, range, consistent
        partitions: 8,             // Number of partitions
        keyExtractor: (key) => key.split(':')[0] // Extract partition key
    }
}
```

## Cache Statistics and Monitoring

### Basic Statistics

```typescript
const stats = await app.getCacheStats();
console.log({
    hitRate: stats.hitRate,
    missRate: stats.missRate,
    totalRequests: stats.totalRequests,
    memoryUsage: stats.memoryUsage,
    entryCount: stats.entryCount
});
```

### Detailed Monitoring

```typescript
// Enable detailed monitoring
cache: {
    monitoring: {
        enabled: true,
        detailed: true,
        trackHotKeys: true,
        trackSlowQueries: true,
        exportMetrics: true
    }
}

// Access detailed stats
const detailedStats = await app.cache.getDetailedStats();
console.log({
    hotKeys: detailedStats.hotKeys,
    coldKeys: detailedStats.coldKeys,
    slowQueries: detailedStats.slowQueries,
    memoryDistribution: detailedStats.memoryDistribution
});
```

### Real-time Monitoring

```typescript
// Set up real-time monitoring
app.cache.on('hit', (key, value) => {
    console.log(`Cache hit: ${key}`);
});

app.cache.on('miss', (key) => {
    console.log(`Cache miss: ${key}`);
});

app.cache.on('eviction', (key, reason) => {
    console.log(`Cache eviction: ${key} (${reason})`);
});

app.cache.on('error', (error) => {
    console.error(`Cache error:`, error);
});
```

## Best Practices

### Cache Key Design

```typescript
// Good: Hierarchical, predictable keys
const userKey = `user:${userId}:profile`;
const sessionKey = `session:${sessionId}:data`;
const searchKey = `search:${query}:${page}:${filters}`;

// Bad: Unpredictable, hard to invalidate keys
const badKey = `${Math.random()}_user_data`;
```

### TTL Strategy

```typescript
// Short TTL for frequently changing data
cache: { ttl: 60000 }      // 1 minute

// Medium TTL for semi-static data
cache: { ttl: 300000 }     // 5 minutes

// Long TTL for static data
cache: { ttl: 3600000 }    // 1 hour

// Very long TTL for configuration
cache: { ttl: 86400000 }   // 24 hours
```

### Cache Invalidation Patterns

```typescript
// Tag-based invalidation
app.postWithCache('/api/users', 
    {
        cache: {
            invalidateOn: ['user:create'],
            tags: ['users', 'user-list']
        }
    },
    async (req, res) => {
        const user = await createUser(req.body);
        
        // Invalidate related caches
        await app.cache.invalidateByTags(['users', 'user-list']);
        
        res.json(user);
    }
);
```

### Error Handling

```typescript
app.getWithCache('/api/data',
    {
        cache: {
            enabled: true,
            ttl: 300000,
            fallbackOnError: true,     // Serve stale data on error
            errorTTL: 60000           // Cache errors for 1 minute
        }
    },
    async (req, res) => {
        try {
            const data = await fetchData();
            res.json(data);
        } catch (error) {
            // Cache will serve stale data if available
            throw error;
        }
    }
);
```
