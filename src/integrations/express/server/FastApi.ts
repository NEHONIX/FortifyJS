import { SecureCacheAdapter } from "../cache";
import { CacheUtils, createOptimalCache } from "../cache/CacheFactory";
import { CacheConfig } from "../types";
import { DEFAULT_OPTIONS } from "./const/default";
import { RouteOptions, ServerOptions, UltraFastApp } from "./ServerFactory";
import express, {
    Express,
    Request,
    NextFunction,
    RequestHandler,
} from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";

/**
 * Ultra-Fast Express Server Class
 */
export class UltraFastServer {
    // UFS
    private app: UltraFastApp;
    private cache: SecureCacheAdapter;
    private options: ServerOptions;
    private ready = false;
    private initPromise: Promise<void>;

    constructor(
        userOptions: ServerOptions = {
            server: {
                enableMiddleware: true,
            },
        }
    ) {
        console.log("Creating fast server...");

        // Merge with defaults
        this.options = this.mergeWithDefaults(userOptions);

        // Create Express app immediately
        this.app = express() as UltraFastApp;

        // Initialize cache synchronously (will connect in background)
        this.cache = this.createCache();
        this.app.cache = this.cache;

        // Configure everything synchronously
        if (this.options.server?.enableMiddleware) {
            this.configureMiddleware();
        }
        this.addEnhancedMethods();
        this.addMonitoringEndpoints();
        this.addStartMethod();

        // Initialize cache in background
        this.initPromise = this.initializeCache();

        // console.log(
        //     "Ultra-fast Express server created (cache initializing in background)"
        // );
    }

    /**
     * Get the Express app instance (ready to use immediately)
     */
    public getApp(): UltraFastApp {
        return this.app;
    }

    /**
     * Check if cache is fully initialized
     */
    public isReady(): boolean {
        return this.ready;
    }

    /**
     * Wait for full initialization
     */
    public async waitForReady(): Promise<void> {
        await this.initPromise;
    }

    /**
     * Merge user options with defaults
     */
    private mergeWithDefaults(userOptions: ServerOptions): ServerOptions {
        const defaults = DEFAULT_OPTIONS;
        return {
            ...defaults,
            ...userOptions,
            cache: { ...defaults.cache, ...userOptions.cache },
            security: { ...defaults.security, ...userOptions.security },
            performance: {
                ...defaults.performance,
                ...userOptions.performance,
            },
            monitoring: { ...defaults.monitoring, ...userOptions.monitoring },
            server: { ...defaults.server, ...userOptions.server },
        };
    }

    /**
     * Create cache instance
     */
    private createCache(): SecureCacheAdapter {
        const cacheStrategy = this.detectCacheStrategy();
        console.log(
            `Auto-selected cache strategy: ${cacheStrategy.toUpperCase()}`
        );

        const cacheConfig: CacheConfig = {
            type: cacheStrategy,
            memory: this.options.cache?.memory,
            redis: this.options.cache?.redis,
            performance: {
                batchSize: this.options.performance?.batchSize,
                asyncWrite: this.options.performance?.asyncWrite,
                prefetchEnabled: this.options.performance?.prefetch,
                connectionPooling: this.options.performance?.connectionPooling,
            },
            security: {
                encryption: this.options.security?.encryption,
                accessMonitoring: this.options.security?.accessMonitoring,
                sanitization: this.options.security?.sanitization,
                auditLogging: this.options.security?.auditLogging,
            },
            monitoring: {
                enabled: this.options.monitoring?.enabled,
                detailed: this.options.monitoring?.detailed,
                alertThresholds: this.options.monitoring?.alertThresholds,
            },
        };

        return createOptimalCache(cacheConfig);
    }

    /**
     * Auto-detect optimal cache strategy
     */
    private detectCacheStrategy(): "memory" | "redis" | "hybrid" {
        if (
            this.options.cache?.strategy &&
            this.options.cache.strategy !== "auto"
        ) {
            return this.options.cache.strategy as "memory" | "redis" | "hybrid";
        }

        const hasRedis =
            this.options.cache?.redis?.host ||
            process.env.REDIS_URL ||
            process.env.REDIS_HOST;

        const memoryLimit = this.options.cache?.memory?.maxSize || 100;
        const isMemoryConstrained = memoryLimit < 50;

        if (hasRedis && !isMemoryConstrained) {
            return "hybrid";
        } else if (hasRedis) {
            return "redis";
        } else {
            return "memory";
        }
    }

    /**
     * Initialize cache in background
     */
    private async initializeCache(): Promise<void> {
        try {
            await this.cache.connect();
            this.ready = true;
            console.log("Cache initialized successfully");
        } catch (error) {
            console.error("Cache initialization failed:", error);
            this.ready = false;
        }
    }

    /**
     * Configure Express middleware
     */
    private configureMiddleware(): void {
        console.log("Configuring middleware...");

        // Trust proxy if configured
        if (this.options.server?.trustProxy) {
            this.app.set("trust proxy", true);
        }

        // Security middleware
        if (this.options.security?.helmet) {
            try {
                this.app.use(helmet());
            } catch (error) {
                console.warn("Helmet not available, skipping security headers");
            }
        }

        if (this.options.security?.cors) {
            try {
                this.app.use(cors());
            } catch (error) {
                console.warn("CORS not available, skipping CORS headers");
            }
        }

        // Performance middleware
        if (this.options.performance?.compression) {
            try {
                this.app.use(compression());
            } catch (error) {
                console.warn("Compression not available, skipping compression");
            }
        }

        // Body parsing middleware
        this.app.use(express.json({ limit: this.options.server?.jsonLimit }));
        this.app.use(
            express.urlencoded({
                extended: true,
                limit: this.options.server?.urlEncodedLimit,
            })
        );

        // Performance tracking middleware
        this.app.use((req: any, res, next) => {
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
    private addEnhancedMethods(): void {
        // console.log("Adding enhanced methods...");

        // Enhanced GET with caching
        this.app.getWithCache = (
            path: string,
            routeOptions: RouteOptions,
            handler: RequestHandler
        ) => {
            const cacheMiddleware = this.createCacheMiddleware(routeOptions);
            this.app.get(path, cacheMiddleware, handler);
        };

        // Enhanced POST with cache invalidation
        this.app.postWithCache = (
            path: string,
            routeOptions: RouteOptions,
            handler: RequestHandler
        ) => {
            const wrappedHandler: RequestHandler = async (req, res, next) => {
                try {
                    await handler(req, res, next);

                    // Invalidate cache if specified
                    if (routeOptions.cache?.invalidateOn) {
                        await this.cache.invalidateByTags(
                            routeOptions.cache.invalidateOn
                        );
                    }
                } catch (error) {
                    next(error);
                }
            };

            this.app.post(path, wrappedHandler);
        };

        // Enhanced PUT with cache invalidation
        this.app.putWithCache = (
            path: string,
            routeOptions: RouteOptions,
            handler: RequestHandler
        ) => {
            const wrappedHandler: RequestHandler = async (req, res, next) => {
                try {
                    await handler(req, res, next);

                    // Invalidate cache if specified
                    if (routeOptions.cache?.invalidateOn) {
                        await this.cache.invalidateByTags(
                            routeOptions.cache.invalidateOn
                        );
                    }
                } catch (error) {
                    next(error);
                }
            };

            this.app.put(path, wrappedHandler);
        };

        // Enhanced DELETE with cache invalidation
        this.app.deleteWithCache = (
            path: string,
            routeOptions: RouteOptions,
            handler: RequestHandler
        ) => {
            const wrappedHandler: RequestHandler = async (req, res, next) => {
                try {
                    await handler(req, res, next);

                    // Invalidate cache if specified
                    if (routeOptions.cache?.invalidateOn) {
                        await this.cache.invalidateByTags(
                            routeOptions.cache.invalidateOn
                        );
                    }
                } catch (error) {
                    next(error);
                }
            };

            this.app.delete(path, wrappedHandler);
        };

        // Cache management methods
        this.app.invalidateCache = async (pattern: string) => {
            await this.cache.invalidateByTags([pattern]);
        };

        this.app.getCacheStats = async () => {
            return await this.cache.getStats();
        };

        this.app.warmUpCache = async (
            data: Array<{ key: string; value: any; ttl?: number }>
        ) => {
            await CacheUtils.warmUp(this.cache, data);
        };

        console.log("Enhanced methods added");
    }

    /**
     * Create cache middleware for routes
     */
    private createCacheMiddleware(options: RouteOptions = {}): RequestHandler {
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
                const cacheKey = this.generateCacheKey(req, options.cache?.key);
                const startTime = Date.now();

                // Try to get from cache
                const cachedData = await this.cache.get(cacheKey);

                if (cachedData) {
                    const cacheTime = Date.now() - startTime;

                    // Log ultra-fast cache hits
                    if (cacheTime < 5) {
                        console.log(
                            `ULTRA-FAST CACHE HIT (${cacheTime}ms): ${cacheKey}`
                        );
                    } else {
                        console.log(`CACHE HIT (${cacheTime}ms): ${cacheKey}`);
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
                res.json = (data: any) => {
                    // Cache the response asynchronously
                    setImmediate(async () => {
                        try {
                            const ttl = options.cache?.ttl || 300000; // 5 minutes default
                            await this.cache.set(cacheKey, data, {
                                ttl,
                                tags: options.cache?.tags,
                            });

                            console.log(`CACHED: ${cacheKey} (TTL: ${ttl}ms)`);
                        } catch (error) {
                            console.error("Cache set error:", error);
                        }
                    });

                    return originalJson(data);
                };

                next();
            } catch (error) {
                console.error("Cache middleware error:", error);
                next(); // Continue without caching on error
            }
        };
    }

    /**
     * Generate cache key for request
     */
    private generateCacheKey(
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
     * Add monitoring endpoints
     */
    private addMonitoringEndpoints(): void {
        if (!this.options.monitoring?.enabled) return;

        console.log("Adding monitoring endpoints...");

        const basePoint = "/fortify";

        // Health check endpoint
        this.app.get(basePoint + "/health", async (req, res) => {
            try {
                const health = this.cache.getHealth();
                const stats = await this.cache.getStats();

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
                        averageResponseTime:
                            stats.performance.averageResponseTime,
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
        this.app.get(basePoint + "/health/cache", async (req, res) => {
            try {
                const stats = await this.cache.getStats();
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

        console.log("Monitoring endpoints added");
    }

    /**
     * Add start method to app
     */
    private addStartMethod(): void {
        this.app.start = (port?: number, callback?: () => void) => {
            const serverPort = port || this.options.server?.port || 3000;
            const host = this.options.server?.host || "localhost";

            this.app.listen(serverPort, host, () => {
                console.log(`Server running on ${host}:${serverPort}`);
                console.log(
                    `Performance targets: <50ms set, <20ms get, <5ms cache hits`
                );
                console.log(
                    `Cache ready: ${this.ready ? "Yes" : "Initializing..."}`
                );

                if (callback) callback();
            });
        };

        this.app.isReady = () => this.ready;
    }
}
