#Fortify FastServer (FFS)API Reference

## createServer Function

The `createServer` function is the primary entry point for creatingFortify FastServer (FFS)instances.

### Signature

```typescript
function createServer(options?: ServerOptions): UltraFastApp;
```

### Parameters

| Parameter | Type            | Required | Description                  |
| --------- | --------------- | -------- | ---------------------------- |
| `options` | `ServerOptions` | No       | Server configuration options |

### Returns

Returns an `UltraFastApp` instance that extends Express.js with additional high-performance features.

## ServerOptions Interface

Complete configuration interface forFortify FastServer (FFS)instances.

```typescript
interface ServerOptions {
    env?: "development" | "production" | "test";
    cache?: CacheOptions;
    security?: SecurityOptions;
    performance?: PerformanceOptions;
    monitoring?: MonitoringOptions;
    server?: ServerConfig;
    cluster?: ClusterOptions;
    fileWatcher?: FileWatcherOptions;
    logging?: LoggingOptions;
}
```

## Server Configuration

### ServerConfig

```typescript
interface ServerConfig {
    port?: number; // Default: 3000
    host?: string; // Default: "localhost"
    trustProxy?: boolean; // Default: false
    jsonLimit?: string; // Default: "10mb"
    urlEncodedLimit?: string; // Default: "10mb"
    enableMiddleware?: boolean; // Default: true
    logPerfomances?: boolean; // Default: false
    serviceName?: string; // Service identifier
    version?: string; // Service version

    // Auto port switching configuration
    autoPortSwitch?: {
        enabled?: boolean; // Default: false
        maxAttempts?: number; // Default: 10
        startPort?: number; // Default: main port
        portRange?: [number, number]; // Port range [min, max]
        strategy?: "increment" | "random" | "predefined";
        predefinedPorts?: number[]; // Custom port list
        onPortSwitch?: (originalPort: number, newPort: number) => void;
    };
}
```

### Example

```typescript
const app = createServer({
    server: {
        port: 8080,
        host: "0.0.0.0",
        autoPortSwitch: {
            enabled: true,
            maxAttempts: 5,
            strategy: "increment",
            onPortSwitch: (original, newPort) => {
                console.log(`Port switched from ${original} to ${newPort}`);
            },
        },
    },
});
```

## Cache Configuration

### CacheOptions

```typescript
interface CacheOptions {
    enabled?: boolean; // Default: true
    strategy?: "auto" | "memory" | "redis" | "hybrid" | "distributed";
    ttl?: number; // Default TTL in milliseconds
    redis?: RedisConfig; // Redis configuration
    memory?: MemoryConfig; // Memory cache configuration
}
```

### Memory Cache Configuration

```typescript
interface MemoryConfig {
    maxSize?: number; // Max size in MB
    algorithm?: "lru" | "lfu" | "fifo";
    evictionPolicy?: "lru" | "lfu" | "fifo" | "ttl";
    checkPeriod?: number; // Cleanup interval in ms
    preallocation?: boolean; // Pre-allocate memory
}
```

### Redis Configuration

```typescript
interface RedisConfig {
    host?: string; // Default: "localhost"
    port?: number; // Default: 6379
    password?: string;
    db?: number; // Database number
    cluster?: boolean; // Enable cluster mode
    nodes?: Array<{ host: string; port: number }>;
    pool?: {
        min?: number; // Min connections
        max?: number; // Max connections
        acquireTimeoutMillis?: number;
        idleTimeoutMillis?: number;
    };
}
```

## Performance Configuration

### PerformanceOptions

```typescript
interface PerformanceOptions {
    compression?: boolean; // Enable compression
    batchSize?: number; // Batch processing size
    connectionPooling?: boolean; // Enable connection pooling
    asyncWrite?: boolean; // Async write operations
    prefetch?: boolean; // Enable prefetching

    // Ultra-performance optimization
    optimizationEnabled?: boolean; // Master optimization switch
    requestClassification?: boolean; // Request type classification
    predictivePreloading?: boolean; // Predictive content loading
    aggressiveCaching?: boolean; // Aggressive cache strategies
    parallelProcessing?: boolean; // Parallel request processing

    // RequestPreCompiler settings
    preCompilerEnabled?: boolean; // Enable request pre-compilation
    learningPeriod?: number; // Learning period in ms
    optimizationThreshold?: number; // Requests before optimization
    aggressiveOptimization?: boolean; // Aggressive optimization mode
    maxCompiledRoutes?: number; // Max pre-compiled routes

    // ExecutionPredictor settings
    ultraFastRulesEnabled?: boolean; // Ultra-fast execution rules
    staticRouteOptimization?: boolean; // Static route optimization
    patternRecognitionEnabled?: boolean; // Pattern recognition

    // Cache warming
    cacheWarmupEnabled?: boolean; // Enable cache warming
    warmupOnStartup?: boolean; // Warm cache on startup
    precomputeCommonResponses?: boolean; // Precompute responses
}
```

## UltraFastApp Interface

The enhanced Express.js application interface with additional methods.

### Core Methods

```typescript
interface UltraFastApp extends Express {
    // Cache methods
    cache: SecureCacheAdapter;
    getWithCache(
        path: string,
        options: RouteOptions,
        handler: RequestHandler
    ): void;
    postWithCache(
        path: string,
        options: RouteOptions,
        handler: RequestHandler
    ): void;
    putWithCache(
        path: string,
        options: RouteOptions,
        handler: RequestHandler
    ): void;
    deleteWithCache(
        path: string,
        options: RouteOptions,
        handler: RequestHandler
    ): void;
    invalidateCache(pattern: string): Promise<void>;
    getCacheStats(): Promise<any>;
    warmUpCache(
        data: Array<{ key: string; value: any; ttl?: number }>
    ): Promise<void>;

    // Server lifecycle
    start(
        port?: number,
        callback?: () => void
    ): Promise<HttpServer> | HttpServer;
    waitForReady(): Promise<void>;

    // Performance optimization
    getRequestPreCompiler(): RequestPreCompiler;
    registerRouteTemplate?(template: OptimizedRoute): void;
    unregisterRouteTemplate?(route: string | RegExp, method?: string): void;
    getOptimizerStats?(): any;
}
```

### Cluster Methods (when clustering enabled)

```typescript
interface ClusterMethods {
    scaleUp?(count?: number): Promise<void>;
    scaleDown?(count?: number): Promise<void>;
    autoScale?(): Promise<void>;
    getClusterMetrics?(): Promise<any>;
    getClusterHealth?(): Promise<any>;
    getAllWorkers?(): any[];
    getOptimalWorkerCount?(): Promise<number>;
    restartCluster?(): Promise<void>;
    stopCluster?(graceful?: boolean): Promise<void>;
    broadcastToWorkers?(message: any): Promise<void>;
    sendToRandomWorker?(message: any): Promise<void>;
}
```

### Plugin Methods

```typescript
interface PluginMethods {
    registerPlugin?(plugin: any): Promise<void>;
    unregisterPlugin?(pluginId: string): Promise<void>;
    getPlugin?(pluginId: string): any;
    getAllPlugins?(): any[];
    getPluginsByType?(type: any): any[];
    getPluginStats?(pluginId?: string): any;
    initializeBuiltinPlugins?(): Promise<void>;
}
```

## Route Options

Configuration options for cached routes.

```typescript
interface RouteOptions {
    cache?: {
        enabled?: boolean; // Enable caching for this route
        ttl?: number; // Cache TTL in milliseconds
        key?: string | ((req: Request) => string); // Custom cache key
        tags?: string[]; // Cache tags for invalidation
        invalidateOn?: string[]; // Auto-invalidation triggers
        strategy?: "memory" | "redis" | "hybrid";
    };
    security?: {
        auth?: boolean; // Require authentication
        roles?: string[]; // Required roles
        encryption?: boolean; // Encrypt response
        sanitization?: boolean; // Sanitize input
    };
    performance?: {
        compression?: boolean; // Enable compression
        timeout?: number; // Request timeout
    };
}
```

## Enhanced Request/Response Objects

### EnhancedRequest

```typescript
interface EnhancedRequest extends Request {
    cache: {
        get: (key: string) => Promise<any>;
        set: (key: string, value: any, ttl?: number) => Promise<void>;
        del: (key: string) => Promise<void>;
        tags: (tags: string[]) => Promise<void>;
    };

    security: {
        encrypt: (data: any) => Promise<string>;
        decrypt: (data: string) => Promise<any>;
        hash: (data: string) => string;
        verify: (data: string, hash: string) => boolean;
        generateToken: () => string;
        sessionKey: string;
    };

    performance: {
        start: () => void;
        end: () => number;
        mark: (name: string) => void;
        measure: (name: string, start: string, end: string) => number;
    };

    validate: {
        body: (schema: any) => ValidationResult;
        query: (schema: any) => ValidationResult;
        params: (schema: any) => ValidationResult;
    };

    user?: UserContext;
    session?: SessionData;
}
```

### EnhancedResponse

```typescript
interface EnhancedResponse extends Response {
    cache: {
        set: (ttl?: number, tags?: string[]) => void;
        invalidate: (tags: string[]) => Promise<void>;
    };

    security: {
        encrypt: (data: any) => EnhancedResponse;
        sign: (data: any) => EnhancedResponse;
    };

    performance: {
        timing: (name: string, value: number) => void;
        metric: (name: string, value: number) => void;
    };

    success: (data?: any, message?: string) => void;
    error: (error: string | Error, code?: number) => void;
    paginated: (data: any[], pagination: PaginationInfo) => void;
}
```
