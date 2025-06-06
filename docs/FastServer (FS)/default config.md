By default createServer() is called with the following options:

```ts
export const DEFAULT_OPTIONS: ServerOptions = {
    cache: {
        strategy: "auto",
        ttl: 300000, // 5 minutes
        enabled: true,
        memory: {
            maxSize: 100,
            algorithm: "lru",
        },
    },
    security: {
        encryption: true,
        accessMonitoring: true,
        sanitization: true,
        auditLogging: false,
        cors: true,
        helmet: true,
    },
    performance: {
        compression: true,
        batchSize: 100,
        connectionPooling: true,
        asyncWrite: true,
        prefetch: true,
        // Ultra-performance optimization settings (optimized for ≤7ms targets)
        optimizationEnabled: true,
        requestClassification: true,
        predictivePreloading: true,
        aggressiveCaching: true,
        parallelProcessing: true,
        // RequestPreCompiler optimal settings from testing
        preCompilerEnabled: true,
        learningPeriod: 60000, // 1 minute for faster learning
        optimizationThreshold: 1, // Optimize after just 1 request
        aggressiveOptimization: true, // Always use aggressive optimization
        maxCompiledRoutes: 1000,
        // ExecutionPredictor aggressive settings
        ultraFastRulesEnabled: true,
        staticRouteOptimization: true,
        patternRecognitionEnabled: true,
        // Cache warming settings
        cacheWarmupEnabled: true,
        warmupOnStartup: true,
        precomputeCommonResponses: true,
    },
    monitoring: {
        enabled: true,
        healthChecks: true,
        metrics: true,
        detailed: false,
        alertThresholds: {
            memoryUsage: 85,
            hitRate: 0.8,
            errorRate: 0.02,
            latency: 50,
        },
    },
    server: {
        port: 3000,
        host: "localhost",
        trustProxy: false,
        jsonLimit: "10mb",
        urlEncodedLimit: "10mb",
    },
    fileWatcher: DEFAULT_FW_CONFIG,
    logging: {
        components: {
            server: true,
            cache: false, // Disable cache logs
            cluster: true,
            performance: false, // Disable performance logs
            fileWatcher: true,
            plugins: false, // Disable plugin logs
            security: false, // Disable security warnings
            monitoring: false,
            routes: false,
        },
        types: {
            startup: true,
            warnings: false, // No UFSIMC warnings!
            errors: true,
            performance: false,
            debug: false,
            hotReload: true,
            portSwitching: true,
        },
        format: {
            prefix: true,
            colors: true,
            compact: false,
            timestamps: false,
        },
    },
};
```
