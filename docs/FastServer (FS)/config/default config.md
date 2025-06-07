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
        enableMiddleware: true,
        port: 8085,
        host: "localhost",
        trustProxy: false,
        jsonLimit: "10mb",
        urlEncodedLimit: "10mb",
        autoPortSwitch: {
            enabled: false,
            maxAttempts: 10,
            strategy: "random",
        },
    },
    fileWatcher: DEFAULT_FW_CONFIG,
    logging: {
        level: "info",
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
            middleware: false,
            userApp: true, // Enable user application console output
            console: false, // Disable console interception system logs
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
        // 🔐 Console Interception with Encryption Support
        consoleInterception: {
            ...DEFAULT_CONSOLE_CONFIG,
            enabled: false, // Disabled by default (user can enable when needed)
            preserveOriginal: true,
        },
    },
};
```

```ts
export const DEFAULT_CONSOLE_CONFIG: ConsoleInterceptionConfig = {
    enabled: false,
    interceptMethods: ["log", "error", "warn", "info", "debug"],
    preserveOriginal: false, // Only through logging system for clean output
    filterUserCode: true,
    performanceMode: true,
    sourceMapping: false,
    stackTrace: false,
    maxInterceptionsPerSecond: 1000,

    //  Encryption Configuration
    encryption: {
        enabled: false, // Disabled by default, enable for production
        algorithm: "aes-256-gcm",
        keyDerivation: "pbkdf2",
        iterations: 100000,
        saltLength: 32,
        ivLength: 16,
        tagLength: 16,
        encoding: "base64",
        key: undefined, // Set via environment variable or method

        //  Display behavior
        displayMode: "readable", // Show readable logs by default
        showEncryptionStatus: false, // Don't show encryption indicators by default

        externalLogging: {
            enabled: false,
            endpoint: undefined,
            headers: {},
            batchSize: 100,
            flushInterval: 5000,
        },
    },

    // Advanced Filtering and Categorization
    filters: {
        minLevel: "debug",
        maxLength: 1000,
        includePatterns: [],
        excludePatterns: ["node_modules", "fastserver", "express", "internal"],

        // User Application Patterns (emoji and common prefixes)
        userAppPatterns: [
            "⚡",
            "🛠️",
            "🔍", // Emoji patterns
            "DEBUG:",
            "INFO:",
            "WARN:",
            "ERROR:",
            "SUCCESS:",
            "FAIL:", // Common prefixes
            "Testing",
            "Starting",
            "Completed",
            "Failed",
            "Initializing", // Common words
        ],

        // System/FastServer Patterns
        systemPatterns: [
            "UFSIMC-",
            "FastServer",
            "[SERVER]",
            "[CACHE]",
            "[CLUSTER]", //Fortify FastServer (FFS)patterns
            "node_modules",
            "internal",
            "express",
            "middleware", // System patterns
        ],

        // Category Behavior Configuration
        categoryBehavior: {
            userApp: "intercept", // Route user app logs through logging system
            system: "intercept", // Route system logs through logging system
            unknown: "intercept", // Route unknown logs through logging system
        },
    },

    // Error Handling and Fallback
    fallback: {
        onError: "console",
        gracefulDegradation: true,
        maxErrors: 10,
    },
};
```
