/**
 * FortifyJS Express Types
 * Core type definitions for Express features (excluding cluster types)
 */

import {
    Request,
    type Express,
    Response,
    NextFunction,
    RequestHandler,
} from "express";
import { SecureCacheAdapter } from "../cache";
import { Server as HttpServer } from "http";
import { ClusterConfig } from "./cluster";
import type { RequestPreCompiler } from "../server/optimization/RequestPreCompiler";
import { OptimizedRoute } from "./UFOptimizer.type";

// ===== CORE CONFIGURATION TYPES =====

export interface ServerConfig {
    // Basic server settings
    port?: number;
    host?: string;
    environment?: "development" | "production" | "test";

    // Auto port switching configuration
    autoPortSwitch?: {
        enabled?: boolean;
        maxAttempts?: number; // Maximum number of ports to try (default: 10)
        startPort?: number; // Starting port for auto-switching (defaults to main port)
        portRange?: [number, number]; // Port range to search within [min, max]
        strategy?: "increment" | "random" | "predefined"; // Port selection strategy
        predefinedPorts?: number[]; // List of predefined ports to try
        onPortSwitch?: (originalPort: number, newPort: number) => void; // Callback when port is switched
    };

    // Security settings
    security?: SecurityConfig;

    // Cache settings
    cache?: CacheConfig;

    // Monitoring settings
    monitoring?: PerformanceConfig;

    // Custom middleware
    middleware?: MiddlewareConfig[];

    // SSL/TLS settings
    ssl?: SSLConfig;

    // CORS settings
    cors?: CORSConfig;

    // Rate limiting
    rateLimit?: RateLimitConfig;

    // Compression
    compression?: CompressionConfig;

    // Logging
    logging?: LoggingConfig;

    //cluster
    cluster?: {
        enabled?: boolean;
        config?: ClusterConfig;
    };
}

export interface SecurityConfig {
    level?: "basic" | "enhanced" | "maximum";
    csrf?: boolean;
    helmet?: boolean;
    xss?: boolean;
    sqlInjection?: boolean;
    bruteForce?: boolean;
    encryption?: {
        algorithm?: string;
        keySize?: number;
    };
    authentication?: {
        jwt?: JWTConfig;
        session?: SessionConfig;
    };
}

export interface CacheConfig {
    type?: "memory" | "redis" | "hybrid" | "distributed";
    redis?: RedisConfig;
    memory?: MemoryConfig;
    ttl?: number; // Default TTL in seconds
    maxSize?: number; // Max cache size
    maxEntries?: number; // Max number of entries
    compression?: boolean;
    encryption?: boolean; // Enable encryption for cached data
    serialization?: "json" | "msgpack" | "protobuf";
    strategies?: CacheStrategy[];
    singleton?: boolean; // Enable singleton pattern for instances

    // Enhanced configuration sections
    performance?: CachePerformanceConfig;
    security?: CacheSecurityConfig;
    monitoring?: CacheMonitoringConfig;
    resilience?: CacheResilienceConfig;
}

export interface RedisConfig {
    host?: string;
    port?: number;
    password?: string;
    db?: number;
    cluster?: boolean;
    nodes?: Array<{ host: string; port: number }>;
    shards?: Array<{ host: string; port: number; weight?: number }>;
    options?: {
        retryDelayOnFailover?: number;
        maxRetriesPerRequest?: number;
        lazyConnect?: boolean;
    };

    // Enhanced Redis configuration
    pool?: {
        min?: number;
        max?: number;
        acquireTimeoutMillis?: number;
        idleTimeoutMillis?: number;
    };

    sentinel?: {
        enabled?: boolean;
        masters?: string[];
        sentinels?: Array<{ host: string; port: number }>;
    };
}

export interface MemoryConfig {
    maxSize?: number;
    algorithm?: "lru" | "lfu" | "fifo";
    evictionPolicy?: "lru" | "lfu" | "fifo" | "ttl";
    checkPeriod?: number;
    preallocation?: boolean;
}

export interface PerformanceConfig {
    enabled?: boolean;
    metrics?: string[];
    interval?: number;
    alerts?: AlertConfig[];
    dashboard?: boolean;
    export?: {
        custom?: (metrics: any) => void;
    };
}

// ===== CACHE-SPECIFIC CONFIGURATION TYPES =====

export interface CachePerformanceConfig {
    batchSize?: number;
    compressionThreshold?: number;
    hotDataThreshold?: number;
    prefetchEnabled?: boolean;
    asyncWrite?: boolean;
    pipeline?: boolean;
    connectionPooling?: boolean;
}

export interface CacheSecurityConfig {
    encryption?: boolean;
    keyRotation?: boolean;
    accessMonitoring?: boolean;
    sanitization?: boolean;
    auditLogging?: boolean;
}

export interface CacheMonitoringConfig {
    enabled?: boolean;
    metricsInterval?: number;
    alertThresholds?: {
        memoryUsage?: number;
        hitRate?: number;
        errorRate?: number;
        latency?: number;
    };
    detailed?: boolean;
}

export interface CacheResilienceConfig {
    retryAttempts?: number;
    retryDelay?: number;
    circuitBreaker?: boolean;
    fallback?: boolean;
    healthCheck?: boolean;
}

export interface CacheMetrics {
    hits: number;
    misses: number;
    sets: number;
    deletes: number;
    errors: number;
    operations: number;
    hitRate?: number;
    missRate?: number;
    errorRate?: number;
    totalMemory?: number;
}

// ===== ROUTE CONFIGURATION TYPES =====

export interface RouteConfig {
    path: string;
    method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "ALL";
    handler: RouteHandler;
    middleware?: MiddlewareFunction[];
    cache?: RouteCacheConfig;
    security?: RouteSecurityConfig;
    rateLimit?: RouteRateLimitConfig;
    validation?: {
        body?: any;
        query?: any;
        params?: any;
        required?: string[];
    };
}

export interface RouteCacheConfig {
    enabled?: boolean;
    ttl?: number;
    key?: string | ((req: Request) => string);
    tags?: string[];
    invalidateOn?: string[];
    compression?: boolean;
}

export interface RouteSecurityConfig {
    auth?: boolean;
    roles?: string[];
    permissions?: string[];
    encryption?: boolean;
    sanitization?: boolean;
    validation?: boolean;
}

// ===== FUNCTION TYPES =====

export type RouteHandler = (
    req: EnhancedRequest,
    res: EnhancedResponse,
    next: NextFunction
) => Promise<any> | any;

export type MiddlewareFunction = (
    req: EnhancedRequest,
    res: EnhancedResponse,
    next: NextFunction
) => Promise<void> | void;

export interface EnhancedRequest extends Request {
    // Cache utilities
    cache: {
        get: (key: string) => Promise<any>;
        set: (key: string, value: any, ttl?: number) => Promise<void>;
        del: (key: string) => Promise<void>;
        tags: (tags: string[]) => Promise<void>;
    };

    // Security utilities
    security: {
        encrypt: (data: any) => Promise<string>;
        decrypt: (data: string) => Promise<any>;
        hash: (data: string) => string;
        verify: (data: string, hash: string) => boolean;
        generateToken: () => string;
        sessionKey: string;
    };

    // Performance utilities
    performance: {
        start: () => void;
        end: () => number;
        mark: (name: string) => void;
        measure: (name: string, start: string, end: string) => number;
    };

    // Validation utilities
    validate: {
        body: (schema: any) => ValidationResult;
        query: (schema: any) => ValidationResult;
        params: (schema: any) => ValidationResult;
    };

    // User context
    user?: UserContext;
    session?: SessionData;
}

export interface EnhancedResponse extends Response {
    // Cache utilities
    cache: {
        set: (ttl?: number, tags?: string[]) => void;
        invalidate: (tags: string[]) => Promise<void>;
    };

    // Security utilities
    security: {
        encrypt: (data: any) => EnhancedResponse;
        sign: (data: any) => EnhancedResponse;
    };

    // Performance utilities
    performance: {
        timing: (name: string, value: number) => void;
        metric: (name: string, value: number) => void;
    };

    // Enhanced response methods
    success: (data?: any, message?: string) => void;
    error: (error: string | Error, code?: number) => void;
    paginated: (data: any[], pagination: PaginationInfo) => void;
}

// ===== SUPPORTING TYPES =====

export type CacheBackendStrategy =
    | "memory"
    | "redis"
    | "hybrid"
    | "distributed";

export interface CacheStrategy {
    name: string;
    condition: (req: Request) => boolean;
    ttl: number;
    tags?: string[];
}

export interface AlertConfig {
    metric: string;
    threshold: number;
    action: "log" | "email" | "webhook" | "custom";
    target?: string;
    cooldown?: number;
}

export interface ValidationResult {
    valid: boolean;
    errors: string[];
    data: any;
}

export interface UserContext {
    id: string;
    roles: string[];
    permissions: string[];
    metadata: Record<string, any>;
}

export interface SessionData {
    id: string;
    userId?: string;
    data: Record<string, any>;
    expires: Date;
}

export interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    pages: number;
}

// configuration interfaces
export interface MiddlewareConfig {
    name: string;
    handler: MiddlewareFunction;
    order?: number;
    routes?: string[];
}

export interface SSLConfig {
    key: string;
    cert: string;
    ca?: string;
    passphrase?: string;
}

export interface CORSConfig {
    origin?: string | string[] | boolean;
    methods?: string[];
    allowedHeaders?: string[];
    credentials?: boolean;
}

export interface RateLimitConfig {
    windowMs?: number;
    max?: number;
    message?: string;
    standardHeaders?: boolean;
    legacyHeaders?: boolean;
}

export interface RouteRateLimitConfig extends RateLimitConfig {
    keyGenerator?: (req: Request) => string;
    skip?: (req: Request) => boolean;
}

// ===== MIDDLEWARE SYSTEM TYPES =====

export type MiddlewarePriority = "critical" | "high" | "normal" | "low";

export interface MiddlewareConfiguration {
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

export interface SecurityMiddlewareOptions {
    helmet?: boolean | any;
    cors?: boolean | CorsMiddlewareOptions;
    rateLimit?: boolean | RateLimitMiddlewareOptions;
    customHeaders?: Record<string, string>;
    csrfProtection?: boolean;
    contentSecurityPolicy?: boolean | any;
    hsts?: boolean | any;
}

export interface CompressionMiddlewareOptions {
    enabled?: boolean;
    level?: number;
    threshold?: number;
    filter?: (req: Request, res: Response) => boolean;
    chunkSize?: number;
    windowBits?: number;
    memLevel?: number;
    strategy?: number;
}

export interface RateLimitMiddlewareOptions {
    enabled?: boolean;
    windowMs?: number;
    max?: number;
    message?: string;
    standardHeaders?: boolean;
    legacyHeaders?: boolean;
    keyGenerator?: (req: Request) => string;
    skip?: (req: Request) => boolean;
    onLimitReached?: (req: Request, res: Response) => void;
}

export interface CorsMiddlewareOptions {
    enabled?: boolean;
    origin?:
        | string
        | string[]
        | boolean
        | ((
              origin: string,
              callback: (err: Error | null, allow?: boolean) => void
          ) => void);
    methods?: string[];
    allowedHeaders?: string[];
    exposedHeaders?: string[];
    credentials?: boolean;
    maxAge?: number;
    preflightContinue?: boolean;
    optionsSuccessStatus?: number;
}

export interface MiddlewareInfo {
    name: string;
    priority: MiddlewarePriority;
    enabled: boolean;
    order: number;
    routes?: string[];
    executionCount: number;
    averageExecutionTime: number;
    lastExecuted?: Date;
    cacheEnabled?: boolean;
    optimized?: boolean;
}

export interface MiddlewareStats {
    totalMiddleware: number;
    enabledMiddleware: number;
    totalExecutions: number;
    averageExecutionTime: number;
    cacheHitRate: number;
    optimizationRate: number;
    byPriority: Record<MiddlewarePriority, number>;
    byType: Record<string, MiddlewareInfo>;
    performance: {
        fastestMiddleware: string;
        slowestMiddleware: string;
        mostUsedMiddleware: string;
        cacheEfficiency: number;
    };
}

export interface CustomMiddleware {
    name: string;
    handler: RequestHandler;
    priority?: MiddlewarePriority;
    routes?: string[];
    enabled?: boolean;
    cacheable?: boolean;
    ttl?: number;
    metadata?: Record<string, any>;
}

export interface MiddlewareExecutionContext {
    requestId: string;
    startTime: number;
    middleware: MiddlewareInfo;
    req: Request;
    res: Response;
    cached?: boolean;
    optimized?: boolean;
    executionPath: "critical" | "fast" | "standard";
}

export interface MiddlewareManager {
    register: (
        middleware: CustomMiddleware | RequestHandler,
        options?: {
            name?: string;
            priority?: MiddlewarePriority;
            routes?: string[];
            cacheable?: boolean;
            ttl?: number;
        }
    ) => string; // Returns middleware ID
    unregister: (id: string) => boolean;
    enable: (id: string) => boolean;
    disable: (id: string) => boolean;
    getInfo: (id?: string) => MiddlewareInfo | MiddlewareInfo[];
    getStats: () => MiddlewareStats;
    clear: () => void;
    optimize: () => Promise<void>;
    createCacheMiddleware: (options?: {
        ttl?: number;
        keyGenerator?: (req: any) => string;
    }) => RequestHandler;
}

export interface MiddlewareAPIInterface {
    register: (
        middleware: CustomMiddleware | RequestHandler,
        options?: {
            name?: string;
            priority?: MiddlewarePriority;
            routes?: string[];
            cacheable?: boolean;
            ttl?: number;
        }
    ) => MiddlewareAPIInterface;
    unregister: (id: string) => MiddlewareAPIInterface;
    enable: (id: string) => MiddlewareAPIInterface;
    disable: (id: string) => MiddlewareAPIInterface;
    getInfo: (id?: string) => MiddlewareInfo | MiddlewareInfo[];
    getStats: () => MiddlewareStats;
    getConfig: () => MiddlewareConfiguration;
    clear: () => MiddlewareAPIInterface;
    optimize: () => Promise<MiddlewareAPIInterface>;
}

export interface CompressionConfig {
    enabled?: boolean;
    level?: number;
    threshold?: number;
    filter?: (req: Request, res: Response) => boolean;
}

export interface LoggingConfig {
    level?: "error" | "warn" | "info" | "debug";
    format?: "json" | "combined" | "common" | "dev";
    destination?: "console" | "file" | "both";
    requests?: boolean;
    errors?: boolean;
    file?: {
        path: string;
        maxSize?: string;
        maxFiles?: number;
    };
}

export interface JWTConfig {
    secret: string;
    expiresIn?: string;
    algorithm?: string;
    issuer?: string;
    audience?: string;
}

export interface SessionConfig {
    secret: string;
    name?: string;
    cookie?: {
        maxAge?: number;
        secure?: boolean;
        httpOnly?: boolean;
        sameSite?: boolean | "lax" | "strict" | "none";
    };
    store?: "memory" | "redis" | "custom";
}

// =====================server factory
export interface ServerOptions {
    // Environment variables
    env?: "development" | "production" | "test";
    // Cache configuration
    cache?: {
        strategy?: "auto" | "memory" | "redis" | "hybrid" | "distributed";
        ttl?: number; // Default TTL in milliseconds
        redis?: {
            host?: string;
            port?: number;
            password?: string;
            cluster?: boolean;
            nodes?: Array<{ host: string; port: number }>;
        };
        memory?: {
            maxSize?: number; // MB
            algorithm?: "lru" | "lfu" | "fifo";
        };
        enabled?: boolean;
    };

    // Security configuration
    security?: {
        encryption?: boolean;
        accessMonitoring?: boolean;
        sanitization?: boolean;
        auditLogging?: boolean;
        cors?: boolean;
        helmet?: boolean;
    };

    // Performance configuration
    performance?: {
        compression?: boolean;
        batchSize?: number;
        connectionPooling?: boolean;
        asyncWrite?: boolean;
        prefetch?: boolean;

        // Ultra-performance optimization settings (optimized for ≤7ms targets)
        optimizationEnabled?: boolean;
        requestClassification?: boolean;
        predictivePreloading?: boolean;
        aggressiveCaching?: boolean;
        parallelProcessing?: boolean;

        // RequestPreCompiler optimal settings
        preCompilerEnabled?: boolean;
        learningPeriod?: number; // milliseconds
        optimizationThreshold?: number; // requests before optimization
        aggressiveOptimization?: boolean;
        maxCompiledRoutes?: number;

        // ExecutionPredictor settings
        ultraFastRulesEnabled?: boolean;
        staticRouteOptimization?: boolean;
        patternRecognitionEnabled?: boolean;

        // Cache warming settings
        cacheWarmupEnabled?: boolean;
        warmupOnStartup?: boolean;
        precomputeCommonResponses?: boolean;

        // Custom response generators for library-agnostic system
        customHealthData?: () => any | Promise<any>;
        customStatusData?: () => any | Promise<any>;
    };

    // Monitoring configuration
    monitoring?: {
        enabled?: boolean;
        healthChecks?: boolean;
        metrics?: boolean;
        detailed?: boolean;
        alertThresholds?: {
            memoryUsage?: number;
            hitRate?: number;
            errorRate?: number;
            latency?: number;
        };
    };

    // Server configuration
    server?: {
        port?: number;
        host?: string;
        trustProxy?: boolean;
        jsonLimit?: string;
        urlEncodedLimit?: string;
        enableMiddleware?: boolean;
        logPerfomances?: boolean;
        // Service identification for optimization system
        serviceName?: string;
        version?: string;
        // cluster?: boolean;

        // Auto port switching configuration
        autoPortSwitch?: {
            enabled?: boolean;
            maxAttempts?: number; // Maximum number of ports to try (default: 10)
            startPort?: number; // Starting port for auto-switching (defaults to main port)
            portRange?: [number, number]; // Port range to search within [min, max]
            strategy?: "increment" | "random" | "predefined"; // Port selection strategy
            predefinedPorts?: number[]; // List of predefined ports to try
            onPortSwitch?: (originalPort: number, newPort: number) => void; // Callback when port is switched
        };
    };
    cluster?: {
        enabled?: boolean;
        config?: Omit<ClusterConfig, "enabled">;
    };

    // File watcher configuration for auto-reload
    fileWatcher?: {
        enabled?: boolean;
        watchPaths?: string[];
        ignorePaths?: string[];
        extensions?: string[];
        debounceMs?: number;
        restartDelay?: number;
        maxRestarts?: number;
        gracefulShutdown?: boolean;
        verbose?: boolean;
    };

    // Middleware configuration
    middleware?: MiddlewareConfiguration;

    // Logging configuration
    logging?: {
        enabled?: boolean; // Master switch for all logging (default: true)
        level?: "silent" | "error" | "warn" | "info" | "debug" | "verbose"; // Log level (default: "info")

        // Component-specific logging controls
        components?: {
            server?: boolean; // Server startup/shutdown logs
            cache?: boolean; // Cache initialization and operations
            cluster?: boolean; // Cluster management logs
            performance?: boolean; // Performance optimization logs
            fileWatcher?: boolean; // File watcher logs
            plugins?: boolean; // Plugin system logs
            security?: boolean; // Security warnings and logs
            monitoring?: boolean; // Monitoring and metrics logs
            routes?: boolean; // Route compilation and handling logs
            other?: boolean;
            middleware?: boolean;
        };

        // Specific log type controls
        types?: {
            startup?: boolean; // Component initialization logs
            warnings?: boolean; // Warning messages (like UFSIMC warnings)
            errors?: boolean; // Error messages (always shown unless silent)
            performance?: boolean; // Performance measurements
            debug?: boolean; // Debug information
            hotReload?: boolean; // Hot reload notifications
            portSwitching?: boolean; // Auto port switching logs
        };

        // Output formatting
        format?: {
            timestamps?: boolean; // Show timestamps (default: false)
            colors?: boolean; // Use colors in output (default: true)
            prefix?: boolean; // Show component prefixes (default: true)
            compact?: boolean; // Use compact format (default: false)
        };

        // Custom logger function
        customLogger?: (
            level: string,
            component: string,
            message: string,
            ...args: any[]
        ) => void;
    };
}

export interface RouteOptions {
    cache?: {
        enabled?: boolean;
        ttl?: number;
        key?: string | ((req: Request) => string);
        tags?: string[];
        invalidateOn?: string[];
        strategy?: "memory" | "redis" | "hybrid";
    };
    security?: {
        auth?: boolean;
        roles?: string[];
        encryption?: boolean;
        sanitization?: boolean;
    };
    performance?: {
        compression?: boolean;
        timeout?: number;
    };
}

// Port management types
export type RedirectMode = "transparent" | "message" | "redirect";

export interface RedirectStats {
    totalRequests: number;
    successfulRedirects: number;
    failedRedirects: number;
    averageResponseTime: number;
    lastRequestTime?: Date;
    startTime: Date;
    uptime: number;
    requestTimes: number[];
}

export interface RedirectOptions {
    /**
     * Redirect behavior mode
     * - transparent: Proxy requests seamlessly (default)
     * - message: Show custom message with new URL
     * - redirect: Send HTTP 301/302 redirect responses
     */
    mode?: RedirectMode;

    /**
     * Custom message to display when mode is 'message'
     */
    customMessage?: string;

    /**
     * HTTP status code for redirect mode (301 or 302)
     */
    redirectStatusCode?: 301 | 302;

    /**
     * Enable/disable redirect logging
     */
    enableLogging?: boolean;

    /**
     * Enable/disable usage statistics tracking
     */
    enableStats?: boolean;

    /**
     * Auto-disconnect after specified time (in milliseconds)
     */
    autoDisconnectAfter?: number;

    /**
     * Auto-disconnect after specified number of requests
     */
    autoDisconnectAfterRequests?: number;

    /**
     * Custom response headers to add to all responses
     */
    customHeaders?: Record<string, string>;

    /**
     * Custom HTML template for message mode
     */
    customHtmlTemplate?: string;

    /**
     * Timeout for proxy requests in milliseconds
     */
    proxyTimeout?: number;

    /**
     * Enable CORS headers for cross-origin requests
     */
    enableCors?: boolean;

    /**
     * Custom error message for failed redirects
     */
    customErrorMessage?: string;

    /**
     * Rate limiting for redirect requests
     */
    rateLimit?: {
        maxRequests: number;
        windowMs: number;
    };
}

export interface RedirectServerInstance {
    fromPort: number;
    toPort: number;
    options: RedirectOptions;
    server: any;
    stats: RedirectStats;
    disconnect: () => Promise<boolean>;
    getStats: () => RedirectStats;
    updateOptions: (newOptions: Partial<RedirectOptions>) => void;
}

export interface UltraFastApp extends Express {
    cache: SecureCacheAdapter;
    getWithCache: (
        path: string,
        options: RouteOptions,
        handler: RequestHandler
    ) => void;
    postWithCache: (
        path: string,
        options: RouteOptions,
        handler: RequestHandler
    ) => void;
    putWithCache: (
        path: string,
        options: RouteOptions,
        handler: RequestHandler
    ) => void;
    deleteWithCache: (
        path: string,
        options: RouteOptions,
        handler: RequestHandler
    ) => void;
    invalidateCache: (pattern: string) => Promise<void>;
    getCacheStats: () => Promise<any>;
    warmUpCache: (
        data: Array<{ key: string; value: any; ttl?: number }>
    ) => Promise<void>;
    start: (
        port?: number,
        callback?: () => void
    ) => Promise<HttpServer> | HttpServer;
    isReady: () => boolean;

    // Port management methods
    getPort: () => number;
    forceClosePort: (port: number) => Promise<boolean>;
    redirectFromPort: (
        fromPort: number,
        toPort: number,
        options?: RedirectOptions
    ) => Promise<RedirectServerInstance | boolean>;

    // Advanced redirect management methods
    getRedirectInstance: (fromPort: number) => RedirectServerInstance | null;
    getAllRedirectInstances: () => RedirectServerInstance[];
    disconnectRedirect: (fromPort: number) => Promise<boolean>;
    disconnectAllRedirects: () => Promise<boolean>;
    getRedirectStats: (fromPort: number) => RedirectStats | null;

    // Performance optimization methods
    getRequestPreCompiler: () => RequestPreCompiler;

    // Ultra-fast optimization methods
    registerRouteTemplate?: (template: OptimizedRoute) => void;
    unregisterRouteTemplate?: (route: string | RegExp, method?: string) => void;
    registerOptimizationPattern?: (pattern: OptimizedRoute) => void;
    getOptimizerStats?: () => any;

    // Middleware management methods
    middleware: (config?: MiddlewareConfiguration) => MiddlewareAPIInterface;
    useSecure: (middleware: RequestHandler | RequestHandler[]) => UltraFastApp;
    usePerformance: (
        middleware: RequestHandler | RequestHandler[]
    ) => UltraFastApp;
    useCached: (
        middleware: RequestHandler | RequestHandler[],
        ttl?: number
    ) => UltraFastApp;
    getMiddleware: (name?: string) => MiddlewareInfo | MiddlewareInfo[];
    removeMiddleware: (name: string) => boolean;
    enableSecurity: (options?: SecurityMiddlewareOptions) => UltraFastApp;
    enableCompression: (options?: CompressionMiddlewareOptions) => UltraFastApp;
    enableRateLimit: (options?: RateLimitMiddlewareOptions) => UltraFastApp;
    enableCors: (options?: CorsMiddlewareOptions) => UltraFastApp;
    getMiddlewareStats: () => MiddlewareStats;

    // Cluster management methods (optional - only available when cluster is enabled)
    scaleUp?: (count?: number) => Promise<void>;
    scaleDown?: (count?: number) => Promise<void>;
    autoScale?: () => Promise<void>;
    getClusterMetrics?: () => Promise<any>;
    getClusterHealth?: () => Promise<any>;
    getAllWorkers?: () => any[];
    getOptimalWorkerCount?: () => Promise<number>;
    restartCluster?: () => Promise<void>;
    stopCluster?: (graceful?: boolean) => Promise<void>;
    broadcastToWorkers?: (message: any) => Promise<void>;
    sendToRandomWorker?: (message: any) => Promise<void>;

    // Plugin management methods
    registerPlugin?: (plugin: any) => Promise<void>;
    unregisterPlugin?: (pluginId: string) => Promise<void>;
    getPlugin?: (pluginId: string) => any;
    getAllPlugins?: () => any[];
    getPluginsByType?: (type: any) => any[];
    getPluginStats?: (pluginId?: string) => any;
    getPluginRegistryStats?: () => any;
    getPluginEngineStats?: () => any;
    initializeBuiltinPlugins?: () => Promise<void>;
    getServerStats?: () => Promise<any>;
}

