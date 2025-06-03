/**
 * Ultra-Fast Express Server Factory
 * Provides production-ready Express applications with intelligent caching integration
 * Zero-async initialization for immediate use
 */

import express, {
    Express,
    Request,
    NextFunction,
    RequestHandler,
} from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import { createOptimalCache, CacheUtils } from "../cache/CacheFactory";
import { SecureCacheAdapter } from "../cache/SecureCacheAdapter";
import { CacheConfig } from "../types";
import { UltraFastServer } from "./FastApi";
import { DEFAULT_OPTIONS } from "./const/default";

export interface ServerOptions {
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
    start: (port?: number, callback?: () => void) => void;
    isReady: () => boolean;
}

/**
 * Create ultra-fast Express server (zero-async)
 * Returns app instance ready to use immediately
 */
export function createUltraFastServer(
    options: ServerOptions = {}
): UltraFastApp {
    const server = new UltraFastServer(options);
    return server.getApp();
}

/**
 * Create ultra-fast Express server class instance
 */
export function createServerInstance(
    options: ServerOptions = {}
): UltraFastServer {
    return new UltraFastServer(options);
}

// Export the main factory function as default
export { createUltraFastServer as createServer };

/**
 * Auto-detect optimal cache strategy based on environment
 */
function detectCacheStrategy(
    options: ServerOptions
): "memory" | "redis" | "hybrid" {
    if (options.cache?.strategy && options.cache.strategy !== "auto") {
        return options.cache.strategy as "memory" | "redis" | "hybrid";
    }

    // Check for Redis availability
    const hasRedis =
        options.cache?.redis?.host ||
        process.env.REDIS_URL ||
        process.env.REDIS_HOST;

    // Check memory constraints
    const memoryLimit = options.cache?.memory?.maxSize || 100;
    const isMemoryConstrained = memoryLimit < 50;

    if (hasRedis && !isMemoryConstrained) {
        return "hybrid"; // Best of both worlds
    } else if (hasRedis) {
        return "redis"; // Use Redis when memory constrained
    } else {
        return "memory"; // Fallback to memory
    }
}

/**
 * Generate cache key for request
 */
function generateCacheKey(
    req: Request,
    customKey?: string | ((req: Request) => string)
): string {
    if (typeof customKey === "function") {
        return customKey(req);
    }

    if (typeof customKey === "string") {
        return customKey;
    }

    // Auto-generate key based on route and params
    const baseKey = `${req.method}:${req.route?.path || req.path}`;
    const params =
        Object.keys(req.params).length > 0
            ? `:${JSON.stringify(req.params)}`
            : "";
    const query =
        Object.keys(req.query).length > 0
            ? `:${JSON.stringify(req.query)}`
            : "";

    return `${baseKey}${params}${query}`;
}

/**
 * Create cache middleware for routes
 */
function createCacheMiddleware(
    cache: SecureCacheAdapter,
    options: RouteOptions = {}
): RequestHandler {
    return async (req: any, res: any, next: NextFunction) => {
        // Skip caching if disabled
        if (options.cache?.enabled === false) {
            return next();
        }

        // Only cache GET requests by default
        if (req.method !== "GET") {
            return next();
        }

        try {
            const cacheKey = generateCacheKey(req, options.cache?.key);
            const startTime = Date.now();

            // Try to get from cache
            const cachedData = await cache.get(cacheKey);

            if (cachedData) {
                const cacheTime = Date.now() - startTime;

                // Log ultra-fast cache hits
                if (cacheTime < 5) {
                    console.log(` CACHE HIT (${cacheTime}ms): ${cacheKey}`);
                } else {
                    console.log(` CACHE HIT (${cacheTime}ms): ${cacheKey}`);
                }

                // Set cache headers
                res.set("X-Cache", "HIT");
                res.set("X-Cache-Time", `${cacheTime}ms`);

                return res.json(cachedData);
            }

            // Cache miss - continue to handler
            res.set("X-Cache", "MISS");

            // Override res.json to cache the response
            const originalJson = res.json.bind(res);
            res.json = function (data: any) {
                // Cache the response asynchronously
                setImmediate(async () => {
                    try {
                        const ttl = options.cache?.ttl || 300000; // 5 minutes default
                        await cache.set(cacheKey, data, {
                            ttl,
                            tags: options.cache?.tags,
                        });

                        console.log(` CACHED: ${cacheKey} (TTL: ${ttl}ms)`);
                    } catch (error: any) {
                        console.error("Cache set error:", error);
                    }
                });

                return originalJson(data);
            };

            next();
        } catch (error: any) {
            console.error("Cache middleware error:", error);
            next(); // Continue without caching on error
        }
    };
}

/**
 * Legacy async createServer function (deprecated - use createServer instead)
 */
export async function createServerAsync(
    userOptions: ServerOptions = {}
): Promise<UltraFastApp> {
    // Merge with defaults
    const options: ServerOptions = {
        ...DEFAULT_OPTIONS,
        ...userOptions,
        cache: { ...DEFAULT_OPTIONS.cache, ...userOptions.cache },
        security: { ...DEFAULT_OPTIONS.security, ...userOptions.security },
        performance: {
            ...DEFAULT_OPTIONS.performance,
            ...userOptions.performance,
        },
        monitoring: {
            ...DEFAULT_OPTIONS.monitoring,
            ...userOptions.monitoring,
        },
        server: { ...DEFAULT_OPTIONS.server, ...userOptions.server },
    };

    console.log(" Creating ultra-fast Express server...");

    // Create Express app
    const app = express() as UltraFastApp;

    // Initialize cache
    const cacheStrategy = detectCacheStrategy(options);
    console.log(
        ` Auto-selected cache strategy: ${cacheStrategy.toUpperCase()}`
    );

    const cacheConfig: CacheConfig = {
        type: cacheStrategy,
        memory: options.cache?.memory,
        redis: options.cache?.redis,
        performance: {
            batchSize: options.performance?.batchSize,
            asyncWrite: options.performance?.asyncWrite,
            prefetchEnabled: options.performance?.prefetch,
            connectionPooling: options.performance?.connectionPooling,
        },
        security: {
            encryption: options.security?.encryption,
            accessMonitoring: options.security?.accessMonitoring,
            sanitization: options.security?.sanitization,
            auditLogging: options.security?.auditLogging,
        },
        monitoring: {
            enabled: options.monitoring?.enabled,
            detailed: options.monitoring?.detailed,
            alertThresholds: options.monitoring?.alertThresholds,
        },
    };

    const cache = createOptimalCache(cacheConfig);
    await cache.connect();

    app.cache = cache;

    console.log(" Cache initialized successfully");

    // Configure middleware
    await configureMiddleware(app, options);

    // Add enhanced methods
    addEnhancedMethods(app, cache, options);

    // Add monitoring endpoints
    if (options.monitoring?.enabled) {
        addMonitoringEndpoints(app, cache);
    }

    console.log("Ultra-fast Express server ready!");

    return app;
}

/**
 * Configure Express middleware
 */
async function configureMiddleware(app: Express, options: ServerOptions) {
    console.log("Configuring middleware...");

    // Trust proxy if configured
    if (options.server?.trustProxy) {
        app.set("trust proxy", true);
    }

    // Security middleware
    if (options.security?.helmet) {
        try {
            app.use(helmet());
        } catch (error: any) {
            console.warn("Helmet not available, skipping security headers");
        }
    }

    if (options.security?.cors) {
        try {
            app.use(cors());
        } catch (error: any) {
            console.warn("CORS not available, skipping CORS headers");
        }
    }

    // Performance middleware
    if (options.performance?.compression) {
        try {
            app.use(compression());
        } catch (error: any) {
            console.warn("Compression not available, skipping compression");
        }
    }

    // Body parsing middleware
    app.use(express.json({ limit: options.server?.jsonLimit }));
    app.use(
        express.urlencoded({
            extended: true,
            limit: options.server?.urlEncodedLimit,
        })
    );

    // Performance tracking middleware
    app.use((req: any, res, next) => {
        req.startTime = Date.now();

        res.on("finish", () => {
            const responseTime = Date.now() - req.startTime;

            // Log performance metrics
            if (responseTime < 5) {
                console.log(
                    `ULTRA-FAST: ${req.method} ${req.path} - ${responseTime}ms`
                );
            } else if (responseTime < 20) {
                console.log(
                    `FAST: ${req.method} ${req.path} - ${responseTime}ms`
                );
            } else if (responseTime > 100) {
                console.log(
                    `SLOW: ${req.method} ${req.path} - ${responseTime}ms`
                );
            }
        });

        next();
    });

    console.log("Middleware configured");
}

/**
 * Add enhanced methods to Express app
 */
function addEnhancedMethods(
    app: UltraFastApp,
    cache: SecureCacheAdapter,
    options: ServerOptions
) {
    // console.log("Adding enhanced methods...");

    // Enhanced GET with caching
    app.getWithCache = function (
        path: string,
        routeOptions: RouteOptions,
        handler: RequestHandler
    ) {
        const cacheMiddleware = createCacheMiddleware(cache, routeOptions);
        this.get(path, cacheMiddleware, handler);
    };

    // Enhanced POST with cache invalidation
    app.postWithCache = function (
        path: string,
        routeOptions: RouteOptions,
        handler: RequestHandler
    ) {
        const wrappedHandler: RequestHandler = async (req, res, next) => {
            try {
                await handler(req, res, next);

                // Invalidate cache if specified
                if (routeOptions.cache?.invalidateOn) {
                    // Use tags for invalidation since pattern invalidation isn't available
                    await cache.invalidateByTags(
                        routeOptions.cache.invalidateOn
                    );
                }
            } catch (error: any) {
                next(error);
            }
        };

        this.post(path, wrappedHandler);
    };

    // Enhanced PUT with cache invalidation
    app.putWithCache = function (
        path: string,
        routeOptions: RouteOptions,
        handler: RequestHandler
    ) {
        const wrappedHandler: RequestHandler = async (req, res, next) => {
            try {
                await handler(req, res, next);

                // Invalidate cache if specified
                if (routeOptions.cache?.invalidateOn) {
                    await cache.invalidateByTags(
                        routeOptions.cache.invalidateOn
                    );
                }
            } catch (error: any) {
                next(error);
            }
        };

        this.put(path, wrappedHandler);
    };

    // Enhanced DELETE with cache invalidation
    app.deleteWithCache = function (
        path: string,
        routeOptions: RouteOptions,
        handler: RequestHandler
    ) {
        const wrappedHandler: RequestHandler = async (req, res, next) => {
            try {
                await handler(req, res, next);

                // Invalidate cache if specified
                if (routeOptions.cache?.invalidateOn) {
                    await cache.invalidateByTags(
                        routeOptions.cache.invalidateOn
                    );
                }
            } catch (error: any) {
                next(error);
            }
        };

        this.delete(path, wrappedHandler);
    };

    // Cache management methods
    app.invalidateCache = async function (pattern: string) {
        // Use tags for invalidation since pattern invalidation isn't available
        await cache.invalidateByTags([pattern]);
    };

    app.getCacheStats = async function () {
        return await cache.getStats();
    };

    app.warmUpCache = async function (
        data: Array<{ key: string; value: any; ttl?: number }>
    ) {
        await CacheUtils.warmUp(cache, data);
    };

    console.log("Enhanced methods added");
}

/**
 * Add monitoring endpoints
 */
function addMonitoringEndpoints(app: Express, cache: SecureCacheAdapter) {
    console.log("Adding monitoring endpoints...");
    const basePoint = "/fortify";

    // Health check endpoint
    app.get(basePoint + "/health", async (req, res) => {
        try {
            const health = cache.getHealth();
            const stats = await cache.getStats();

            const healthStatus = {
                status: health.status,
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                cache: {
                    connected: health.details.redisConnected || true,
                    hitRate: stats.memory.hitRate,
                    memoryUsage: stats.memory.memoryUsage?.percentage || 0,
                    operations: stats.performance.totalOperations,
                },
                performance: {
                    averageResponseTime: stats.performance.averageResponseTime,
                    totalOperations: stats.performance.totalOperations,
                    networkLatency: stats.performance.networkLatency,
                },
            };

            const statusCode =
                health.status === "healthy"
                    ? 200
                    : health.status === "degraded"
                    ? 200
                    : 503;

            res.status(statusCode).json(healthStatus);
        } catch (error: any) {
            res.status(503).json({
                status: "unhealthy",
                error: error.message,
                timestamp: new Date().toISOString(),
            });
        }
    });

    // Cache statistics endpoint
    app.get(basePoint + "/health/cache", async (req, res) => {
        try {
            const stats = await cache.getStats();
            res.json({
                timestamp: new Date().toISOString(),
                cache: stats,
            });
        } catch (error: any) {
            res.status(500).json({
                error: "Failed to get cache statistics",
                message: error.message,
            });
        }
    });

    // Cache management endpoints
    app.post(basePoint + "/admin/cache/clear", async (req, res) => {
        try {
            await cache.clear();
            res.json({
                success: true,
                message: "Cache cleared successfully",
                timestamp: new Date().toISOString(),
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    });

    app.post(basePoint + "/admin/cache/invalidate", async (req, res) => {
        try {
            const { tags } = req.body;
            if (tags && Array.isArray(tags)) {
                await cache.invalidateByTags(tags);
                res.json({
                    success: true,
                    message: `Invalidated cache entries with tags: ${tags.join(
                        ", "
                    )}`,
                    tags,
                });
            } else {
                res.status(400).json({
                    success: false,
                    error: "Tags array is required",
                });
            }
        } catch (error: any) {
            res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    });

    console.log("Monitoring endpoints added");
}

