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

// ===== CORE CONFIGURATION TYPES =====

export interface ServerConfig {
    // Basic server settings
    port?: number;
    host?: string;
    environment?: "development" | "production" | "test";

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
        // cluster?: boolean;
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

