import { SecureCacheAdapter } from "../cache";
import { CacheUtils, createOptimalCache } from "../cache/CacheFactory";
import { CacheConfig } from "../types/types";
import { DEFAULT_OPTIONS } from "./const/default";
import { RouteOptions, ServerOptions, UltraFastApp } from "../types/types";
import express, { Request, NextFunction, RequestHandler } from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import { ClusterManager } from "../cluster/cluster-manager";
import { UltraFastFileWatcher } from "./service/Reload/FileWatcher";
import { HotReloader } from "./service/Reload/HotReloader";
// import { PluginRegistry } from "./plugins/PluginRegistry";
// import { PluginEngine } from "./plugins/PluginEngine";
import {
    PluginExecutionContext,
    PluginType,
} from "./plugins/types/PluginTypes";
import { PluginEngine } from "./plugins/PluginEngine";
import { PluginRegistry } from "./plugins/PluginRegistry";

/**
 * Ultra-Fast Express Server
 */
export class UltraFastServer {
    // UFS
    private app: UltraFastApp;
    private cache: SecureCacheAdapter;
    private options: ServerOptions;
    private ready = false;
    private initPromise: Promise<void>;
    private cluster?: ClusterManager;
    private fileWatcher?: UltraFastFileWatcher;
    private hotReloader?: HotReloader;
    private httpServer?: any;
    private isMainProcess = true;

    // Plugin system
    private pluginRegistry: PluginRegistry;
    private pluginEngine: PluginEngine;

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

        // Initialize plugin system
        this.pluginRegistry = new PluginRegistry(this.cache, this.cluster);
        this.pluginEngine = new PluginEngine(
            this.pluginRegistry,
            this.cache,
            this.cluster
        );

        // Configure everything synchronously
        if (this.options.server?.enableMiddleware) {
            this.configureMiddleware();
        }
        this.addMethods();
        this.addMonitoringEndpoints();
        this.addStartMethod();

        // Initialize cache in background
        this.initPromise = this.initializeCache();

        // Initialize cluster in background
        if (this.options.cluster?.enabled) {
            this.cluster = new ClusterManager(
                this.options.cluster.config || {}
            );
            // Add cluster methods immediately when cluster is configured
            this.addClusterMethods();
        }

        // Initialize file watcher and hot reloader if enabled
        if (this.options.fileWatcher?.enabled) {
            // Check if we're in the main process or a child process
            this.isMainProcess = !process.env.FORTIFY_CHILD_PROCESS;

            if (this.isMainProcess) {
                // Main process: Initialize hot reloader for true process restart
                this.hotReloader = new HotReloader({
                    enabled: true,
                    script: process.argv[1] || "index.js",
                    args: process.argv.slice(2),
                    env: {
                        ...process.env,
                        FORTIFY_CHILD_PROCESS: "true", // Mark child processes
                    },
                    cwd: process.cwd(),
                    restartDelay: this.options.fileWatcher.restartDelay || 500,
                    maxRestarts: this.options.fileWatcher.maxRestarts || 10,
                    gracefulShutdownTimeout: 5000,
                    verbose: this.options.fileWatcher.verbose || false,
                });

                // Initialize file watcher for the main process
                this.fileWatcher = new UltraFastFileWatcher(
                    this.options.fileWatcher
                );
            } else {
                // Child process: Don't initialize file watcher to avoid conflicts
                console.log(
                    "Running in child process mode (hot reload enabled)"
                );
            }
        }

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
        // console.log(
        //     `Auto-selected cache strategy: ${cacheStrategy.toUpperCase()}`
        // );

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

        // Plugin-powered performance tracking middleware
        this.app.use(async (req: any, res: any, next: NextFunction) => {
            req.startTime = Date.now();

            // Execute pre-request plugins
            const preRequestSuccess = await this.pluginEngine.executePlugins(
                PluginType.PRE_REQUEST,
                req,
                res,
                next
            );

            if (!preRequestSuccess) {
                return; // Plugin stopped execution
            }

            // Execute security plugins
            const securitySuccess = await this.pluginEngine.executePlugins(
                PluginType.SECURITY,
                req,
                res,
                next
            );

            if (!securitySuccess) {
                return res
                    .status(401)
                    .json({ error: "Security validation failed" });
            }

            // Execute cache plugins
            await this.pluginEngine.executePlugins(
                PluginType.CACHE,
                req,
                res,
                next
            );

            // Execute performance monitoring plugins
            await this.pluginEngine.executePlugins(
                PluginType.PERFORMANCE,
                req,
                res,
                next
            );

            res.on("finish", async () => {
                const responseTime = Date.now() - req.startTime;

                // Execute post-response plugins
                await this.pluginEngine.executePlugins(
                    PluginType.POST_RESPONSE,
                    req,
                    res,
                    next
                );

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
     * Add methods to Express app
     */
    private addMethods(): void {
        // console.log("Adding methods...");

        // GET with caching
        this.app.getWithCache = (
            path: string,
            routeOptions: RouteOptions,
            handler: RequestHandler
        ) => {
            const cacheMiddleware = this.createCacheMiddleware(routeOptions);
            this.app.get(path, cacheMiddleware, handler);
        };

        // POST with cache invalidation
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

        // PUT with cache invalidation
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

        // DELETE with cache invalidation
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

        console.log("methods added");
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

        // Cluster monitoring endpoints (if cluster is enabled)
        if (this.cluster && this.options.cluster?.enabled) {
            // Cluster health endpoint
            this.app.get(basePoint + "/health/cluster", async (req, res) => {
                try {
                    const clusterHealth = await this.cluster!.checkHealth();
                    const clusterMetrics = await this.cluster!.getMetrics();

                    res.json({
                        timestamp: new Date().toISOString(),
                        cluster: {
                            health: clusterHealth,
                            metrics: clusterMetrics,
                            workers: this.cluster!.getAllWorkers(),
                        },
                    });
                } catch (error: any) {
                    res.status(500).json({
                        error: "Failed to get cluster statistics",
                        message: error.message,
                    });
                }
            });

            // Cluster scaling endpoint
            this.app.post(basePoint + "/cluster/scale", async (req, res) => {
                try {
                    const { action, count = 1 } = req.body;

                    if (action === "up") {
                        await this.cluster!.scaleUp(count);
                        res.json({
                            success: true,
                            message: `Scaled up by ${count} workers`,
                            workers: this.cluster!.getAllWorkers().length,
                        });
                    } else if (action === "down") {
                        await this.cluster!.scaleDown(count);
                        res.json({
                            success: true,
                            message: `Scaled down by ${count} workers`,
                            workers: this.cluster!.getAllWorkers().length,
                        });
                    } else if (action === "auto") {
                        await this.cluster!.autoScale();
                        res.json({
                            success: true,
                            message: "Auto-scaling triggered",
                            workers: this.cluster!.getAllWorkers().length,
                        });
                    } else {
                        res.status(400).json({
                            error: "Invalid action. Use 'up', 'down', or 'auto'",
                        });
                    }
                } catch (error: any) {
                    res.status(500).json({
                        error: "Failed to scale cluster",
                        message: error.message,
                    });
                }
            });

            // Cluster restart endpoint
            this.app.post(basePoint + "/cluster/restart", async (req, res) => {
                try {
                    await this.cluster!.restart();
                    res.json({
                        success: true,
                        message: "Cluster restart initiated",
                    });
                } catch (error: any) {
                    res.status(500).json({
                        error: "Failed to restart cluster",
                        message: error.message,
                    });
                }
            });

            // Cluster broadcast endpoint
            this.app.post(
                basePoint + "/cluster/broadcast",
                async (req, res) => {
                    try {
                        const { message } = req.body;
                        await this.cluster!.broadcast(message);
                        res.json({
                            success: true,
                            message: "Message broadcasted to all workers",
                        });
                    } catch (error: any) {
                        res.status(500).json({
                            error: "Failed to broadcast message",
                            message: error.message,
                        });
                    }
                }
            );
        }

        // File watcher monitoring endpoints (if file watcher is enabled)
        if (this.fileWatcher && this.options.fileWatcher?.enabled) {
            // File watcher status endpoint
            this.app.get(
                basePoint + "/health/filewatcher",
                async (req, res) => {
                    try {
                        const status = this.getFileWatcherStatus();
                        const stats = this.getFileWatcherStats();

                        res.json({
                            timestamp: new Date().toISOString(),
                            fileWatcher: {
                                status,
                                stats,
                            },
                        });
                    } catch (error: any) {
                        res.status(500).json({
                            error: "Failed to get file watcher status",
                            message: error.message,
                        });
                    }
                }
            );

            // File watcher control endpoint
            this.app.post(
                basePoint + "/filewatcher/control",
                async (req, res) => {
                    try {
                        const { action } = req.body;

                        if (action === "stop") {
                            await this.stopFileWatcher();
                            res.json({
                                success: true,
                                message: "File watcher stopped",
                            });
                        } else if (action === "start") {
                            await this.startFileWatcher();
                            res.json({
                                success: true,
                                message: "File watcher started",
                            });
                        } else if (action === "restart") {
                            await this.stopFileWatcher();
                            await this.startFileWatcher();
                            res.json({
                                success: true,
                                message: "File watcher restarted",
                            });
                        } else if (action === "reset-stats") {
                            if (this.fileWatcher) {
                                this.fileWatcher.resetStats();
                            }
                            res.json({
                                success: true,
                                message: "File watcher stats reset",
                            });
                        } else {
                            res.status(400).json({
                                error: "Invalid action. Use 'start', 'stop', 'restart', or 'reset-stats'",
                            });
                        }
                    } catch (error: any) {
                        res.status(500).json({
                            error: "Failed to control file watcher",
                            message: error.message,
                        });
                    }
                }
            );
        }

        // Plugin monitoring endpoints
        this.addPluginMonitoringEndpoints(basePoint);

        console.log("Monitoring endpoints added");
    }

    /**
     * Add plugin monitoring endpoints
     */
    private addPluginMonitoringEndpoints(basePoint: string): void {
        // Plugin registry status endpoint
        this.app.get(basePoint + "/health/plugins", async (req, res) => {
            try {
                const registryStats = this.getPluginRegistryStats();
                const engineStats = this.getPluginEngineStats();

                res.json({
                    timestamp: new Date().toISOString(),
                    plugins: {
                        registry: registryStats,
                        engine: engineStats,
                        status: "healthy",
                    },
                });
            } catch (error: any) {
                res.status(500).json({
                    error: "Failed to get plugin statistics",
                    message: error.message,
                });
            }
        });

        // Individual plugin statistics endpoint
        this.app.get(
            basePoint + "/plugins/:pluginId/stats",
            async (req: any, res: any) => {
                try {
                    const { pluginId } = req.params;
                    const stats = this.getPluginStats(pluginId);

                    if (!stats) {
                        return res.status(404).json({
                            error: "Plugin not found",
                            pluginId,
                        });
                    }

                    res.json({
                        timestamp: new Date().toISOString(),
                        pluginId,
                        stats,
                    });
                } catch (error: any) {
                    res.status(500).json({
                        error: "Failed to get plugin statistics",
                        message: error.message,
                    });
                }
            }
        );

        // Plugin management endpoint - register plugin
        this.app.post(
            basePoint + "/plugins/register",
            async (req: any, res: any) => {
                try {
                    const { pluginConfig } = req.body;

                    if (!pluginConfig) {
                        return res.status(400).json({
                            error: "Plugin configuration is required",
                        });
                    }

                    // Validate plugin configuration
                    if (
                        !pluginConfig.id ||
                        !pluginConfig.name ||
                        !pluginConfig.version
                    ) {
                        return res.status(400).json({
                            error: "Plugin must have id, name, and version",
                        });
                    }

                    // Check if plugin already exists
                    const existingPlugin = this.getPlugin(pluginConfig.id);
                    if (existingPlugin) {
                        return res.status(409).json({
                            error: "Plugin already registered",
                            pluginId: pluginConfig.id,
                        });
                    }

                    // For security, only allow registration of pre-approved plugin types
                    const allowedPluginTypes = [
                        "performance",
                        "cache",
                        "monitoring",
                    ];
                    if (!allowedPluginTypes.includes(pluginConfig.type)) {
                        return res.status(403).json({
                            error: "Plugin type not allowed for dynamic registration",
                            allowedTypes: allowedPluginTypes,
                        });
                    }

                    // Create a simple plugin instance from configuration
                    const dynamicPlugin = {
                        id: pluginConfig.id,
                        name: pluginConfig.name,
                        version: pluginConfig.version,
                        type: pluginConfig.type,
                        priority: pluginConfig.priority || 2,
                        isAsync: pluginConfig.isAsync !== false,
                        isCacheable: pluginConfig.isCacheable === true,
                        maxExecutionTime: pluginConfig.maxExecutionTime || 1000,
                        execute: async (context: any) => {
                            // Simple execution logic for dynamic plugins
                            const startTime = performance.now();

                            // Basic plugin functionality based on type
                            let result: any = { success: true };

                            if (pluginConfig.type === "performance") {
                                result.metrics = {
                                    executionTime:
                                        performance.now() - startTime,
                                    timestamp: Date.now(),
                                    route: context.req.path,
                                };
                            } else if (pluginConfig.type === "cache") {
                                result.cacheKey = `dynamic:${context.req.path}`;
                                result.cacheable = true;
                            } else if (pluginConfig.type === "monitoring") {
                                result.monitoring = {
                                    requestId: context.executionId,
                                    userAgent:
                                        context.req.headers["user-agent"],
                                    ip: context.req.ip,
                                };
                            }

                            return {
                                success: true,
                                executionTime: performance.now() - startTime,
                                data: result,
                                shouldContinue: true,
                            };
                        },
                    };

                    // Register the dynamic plugin
                    await this.registerPlugin(dynamicPlugin);

                    res.json({
                        success: true,
                        message: `Plugin ${pluginConfig.id} registered successfully`,
                        pluginId: pluginConfig.id,
                        type: pluginConfig.type,
                        registeredAt: new Date().toISOString(),
                    });
                } catch (error: any) {
                    res.status(500).json({
                        error: "Failed to register plugin",
                        message: error.message,
                    });
                }
            }
        );

        // Plugin management endpoint - unregister plugin
        this.app.delete(basePoint + "/plugins/:pluginId", async (req, res) => {
            try {
                const { pluginId } = req.params;
                await this.unregisterPlugin(pluginId);

                res.json({
                    success: true,
                    message: `Plugin ${pluginId} unregistered successfully`,
                });
            } catch (error: any) {
                res.status(500).json({
                    error: "Failed to unregister plugin",
                    message: error.message,
                });
            }
        });

        // Comprehensive server statistics endpoint
        this.app.get(basePoint + "/stats/comprehensive", async (_req, res) => {
            try {
                const stats = await this.getServerStats();
                res.json({
                    timestamp: new Date().toISOString(),
                    stats,
                });
            } catch (error: any) {
                res.status(500).json({
                    error: "Failed to get comprehensive statistics",
                    message: error.message,
                });
            }
        });
    }

    /**
     * Add start method to app with cluster support
     */
    private addStartMethod(): void {
        this.app.start = async (port?: number, callback?: () => void) => {
            const serverPort = port || this.options.server?.port || 3000;
            const host = this.options.server?.host || "localhost";

            // If we're in main process and hot reloader is enabled, start it first
            if (this.isMainProcess && this.hotReloader) {
                console.log("Starting with hot reload support...");

                try {
                    // Start the hot reloader (which will spawn child process)
                    await this.hotReloader.start();

                    // Start file watcher in main process to monitor changes
                    if (this.fileWatcher) {
                        await this.startFileWatcherWithHotReload();
                    }

                    console.log(`Hot reload system started`);
                    console.log(
                        `Server will be available on ${host}:${serverPort}`
                    );
                    console.log(`Edit files to see instant hot reload!`);

                    if (callback) callback();

                    // Return a mock server object for compatibility
                    return {
                        close: () => this.hotReloader?.stop(),
                        address: () => ({ port: serverPort, address: host }),
                    };
                } catch (error: any) {
                    console.error("Hot reload startup failed:", error.message);
                    console.log("Falling back to regular mode...");
                    // Fall through to regular startup
                }
            }

            // Regular startup (child process or hot reload disabled)

            // If cluster is enabled, use cluster manager
            if (this.cluster && this.options.cluster?.enabled) {
                console.log("Starting FortifyJS cluster...");

                try {
                    // Start cluster manager
                    await this.cluster.start();

                    // Check if we're in master or worker process
                    if (process.env.NODE_ENV !== "worker") {
                        console.log("Starting as cluster master process");

                        // Setup cluster event handlers
                        this.setupClusterEventHandlers();

                        // Start HTTP server in master process
                        this.httpServer = this.app.listen(
                            serverPort,
                            host,
                            async () => {
                                console.log(
                                    `Cluster master started with ${
                                        this.cluster?.getAllWorkers().length ||
                                        0
                                    } workers`
                                );
                                console.log(
                                    `Server running on ${host}:${serverPort}`
                                );
                                console.log(
                                    `State: ${
                                        this.ready ? "Ready" : "Initializing..."
                                    }`
                                );

                                // Start file watcher if enabled (child process only)
                                if (this.fileWatcher && !this.isMainProcess) {
                                    await this.startFileWatcher();
                                }

                                if (callback) callback();
                            }
                        );

                        return this.httpServer;
                    } else {
                        // Worker process
                        console.log(`Worker ${process.pid} started`);

                        const httpServer = this.app.listen(
                            serverPort,
                            host,
                            () => {
                                console.log(
                                    `Worker ${process.pid} listening on ${host}:${serverPort}`
                                );
                                if (callback) callback();
                            }
                        );

                        return httpServer;
                    }
                } catch (error: any) {
                    console.error("Failed to start cluster:", error.message);
                    // Fallback to single process
                    console.log("Falling back to single process mode");
                }
            }

            // Single process mode (default)
            this.httpServer = this.app.listen(serverPort, host, async () => {
                console.log(`Server running on ${host}:${serverPort}`);
                console.log(
                    `State: ${this.ready ? "Ready" : "Initializing..."}`
                );

                // Start file watcher if enabled (child process only)
                if (this.fileWatcher && !this.isMainProcess) {
                    await this.startFileWatcher();
                }

                if (callback) callback();
            });

            return this.httpServer;
        };

        this.app.isReady = () => this.ready;

        // Cluster methods are already added in constructor if cluster is enabled
    }

    /**
     * Setup cluster event handlers
     */
    private setupClusterEventHandlers(): void {
        if (!this.cluster) return;

        // Handle worker events
        this.cluster.on("worker:started", (workerId: string, pid: number) => {
            console.log(`Started worker ${workerId} (PID: ${pid})`);
        });

        this.cluster.on(
            "worker:died",
            (workerId: string, code: number, signal: string) => {
                console.log(
                    `Worker ${workerId} died (code: ${code}, signal: ${signal})`
                );
            }
        );

        this.cluster.on(
            "worker:restarted",
            (workerId: string, reason: string) => {
                console.log(`Worker ${workerId} restarted (reason: ${reason})`);
            }
        );

        // Handle scaling events
        this.cluster.on(
            "cluster:scaled",
            (action: string, workerCount: number) => {
                console.log(
                    `Cluster ${action}: now running ${workerCount} workers`
                );
            }
        );

        // Handle health events
        this.cluster.on("health:status", (status: any) => {
            if (status.status === "critical") {
                console.warn(`Cluster health critical: ${status.message}`);
            }
        });
    }

    /**
     * Add cluster management methods to app
     */
    private addClusterMethods(): void {
        if (!this.cluster) return;

        console.log("Adding cluster methods to app...");

        // Cluster scaling methods
        this.app.scaleUp = async (count: number = 1) => {
            return await this.cluster!.scaleUp(count);
        };

        this.app.scaleDown = async (count: number = 1) => {
            return await this.cluster!.scaleDown(count);
        };

        this.app.autoScale = async () => {
            return await this.cluster!.autoScale();
        };

        // Cluster information methods
        this.app.getClusterMetrics = async () => {
            return await this.cluster!.getMetrics();
        };

        this.app.getClusterHealth = async () => {
            return await this.cluster!.checkHealth();
        };

        this.app.getAllWorkers = () => {
            return this.cluster!.getAllWorkers();
        };

        this.app.getOptimalWorkerCount = async () => {
            return await this.cluster!.getOptimalWorkerCount();
        };

        // Cluster management methods
        this.app.restartCluster = async () => {
            return await this.cluster!.restart();
        };

        this.app.stopCluster = async (graceful: boolean = true) => {
            return await this.cluster!.stop(graceful);
        };

        // IPC methods
        this.app.broadcastToWorkers = async (message: any) => {
            return await this.cluster!.broadcast(message);
        };

        this.app.sendToRandomWorker = async (message: any) => {
            return await this.cluster!.sendToRandomWorker(message);
        };

        console.log("Cluster methods added to app");
    }

    /**
     * Start file watcher for auto-reload (main process only)
     */
    private async startFileWatcher(): Promise<void> {
        if (!this.fileWatcher) return;

        try {
            console.log("🔍 Starting file watcher for auto-reload...");

            // Setup file watcher event handlers
            this.setupFileWatcherEventHandlers();

            // Start watching with restart callback
            await this.fileWatcher.startWatching(async () => {
                await this.restartServer();
            });

            console.log("File watcher started successfully");
        } catch (error: any) {
            console.error("Failed to start file watcher:", error.message);
        }
    }

    /**
     * Start file watcher with hot reload (main process)
     */
    private async startFileWatcherWithHotReload(): Promise<void> {
        if (!this.fileWatcher || !this.hotReloader) return;

        try {
            console.log("Starting file watcher with hot reload...");

            // Setup file watcher event handlers for hot reload
            this.setupHotReloadEventHandlers();

            // Start watching with hot reload callback
            await this.fileWatcher.startWatching(async () => {
                await this.triggerHotReload();
            });

            console.log("File watcher with hot reload started successfully");
        } catch (error: any) {
            console.error(
                "Failed to start file watcher with hot reload:",
                error.message
            );
        }
    }

    /**
     * Setup hot reload event handlers
     */
    private setupHotReloadEventHandlers(): void {
        if (!this.fileWatcher || !this.hotReloader) return;

        this.fileWatcher.on("file:changed", (event: any) => {
            if (this.options.fileWatcher?.verbose) {
                console.log(`File changed: ${event.filename}`);
            }
        });

        this.fileWatcher.on("restart:starting", (event: any) => {
            console.log(`Hot reloading due to: ${event.filename}`);
        });

        this.hotReloader.on("restart:completed", (data: any) => {
            console.log(`Hot reload completed in ${data.duration}ms`);
        });

        this.hotReloader.on("restart:failed", (data: any) => {
            console.error(`Hot reload failed: ${data.error}`);
        });
    }

    /**
     * Trigger hot reload (true process restart)
     */
    private async triggerHotReload(): Promise<void> {
        if (!this.hotReloader) {
            console.warn(
                "Hot reloader not available, falling back to regular restart"
            );
            await this.restartServer();
            return;
        }

        try {
            console.log("Triggering hot reload (process restart)...");
            await this.hotReloader.restart();
        } catch (error: any) {
            console.error("Hot reload failed:", error.message);
            // Fallback to regular restart
            console.log("Falling back to regular restart...");
            await this.restartServer();
        }
    }

    /**
     * Setup file watcher event handlers
     */
    private setupFileWatcherEventHandlers(): void {
        if (!this.fileWatcher) return;

        this.fileWatcher.on("file:changed", (event: any) => {
            if (this.options.fileWatcher?.verbose) {
                console.log(`File changed: ${event.filename}`);
            }
        });

        this.fileWatcher.on("restart:starting", (event: any) => {
            console.log(`Restarting due to: ${event.filename}`);
        });

        this.fileWatcher.on("restart:completed", (data: any) => {
            console.log(`Restart completed in ${data.duration}ms`);
        });

        this.fileWatcher.on("restart:failed", (data: any) => {
            console.error(`Restart failed: ${data.error}`);
        });
    }

    /**
     * Restart server (for file watcher) with hot reload
     */
    private async restartServer(): Promise<void> {
        try {
            console.log("Hot reloading server...");

            // Close current server
            if (this.httpServer) {
                await new Promise<void>((resolve) => {
                    this.httpServer.close(() => {
                        console.log("Server closed");
                        resolve();
                    });
                });
            }

            // Stop cluster if running
            if (this.cluster && this.options.cluster?.enabled) {
                await this.cluster.stop(true);
                console.log("Cluster stopped");
            }

            // Clear module cache for hot reload
            this.clearModuleCache();

            // Small delay before restart
            await new Promise((resolve) => setTimeout(resolve, 200));

            // For true hot reload, we need to restart the entire process
            // But for now, let's restart the server with cleared cache
            await this.reinitializeServer();
        } catch (error: any) {
            console.error("Server hot reload failed:", error.message);
            throw error;
        }
    }

    /**
     * Reinitialize server with fresh configuration
     */
    private async reinitializeServer(): Promise<void> {
        try {
            console.log("Reinitializing server with fresh config...");

            // Re-read configuration from environment or files
            const port = process.env.PORT
                ? parseInt(process.env.PORT)
                : this.options.server?.port || 3000;
            const host =
                process.env.HOST || this.options.server?.host || "localhost";

            console.log(`📡 Using port: ${port}, host: ${host}`);

            // Restart cluster if enabled
            if (this.cluster && this.options.cluster?.enabled) {
                await this.cluster.start();
                console.log("🚀 Cluster restarted");
            }

            // Start HTTP server with potentially updated config
            this.httpServer = this.app.listen(port, host, async () => {
                console.log(`Server hot-reloaded on ${host}:${port}`);

                // Restart file watcher if it was stopped
                if (
                    this.fileWatcher &&
                    !this.fileWatcher.getStatus().isWatching
                ) {
                    await this.startFileWatcher();
                }
            });
        } catch (error: any) {
            console.error("Server reinitialization failed:", error.message);
            throw error;
        }
    }

    /**
     * Clear Node.js module cache for hot reload
     */
    private clearModuleCache(): void {
        try {
            console.log("🧹 Clearing module cache for hot reload...");

            const cacheKeys = Object.keys(require.cache);
            let clearedCount = 0;

            for (const key of cacheKeys) {
                // Only clear modules from our project (not node_modules)
                if (
                    key.includes(process.cwd()) &&
                    !key.includes("node_modules") &&
                    !key.includes(".node") &&
                    !key.endsWith(".json")
                ) {
                    delete require.cache[key];
                    clearedCount++;
                }
            }

            console.log(`Cleared ${clearedCount} modules from cache`);
        } catch (error: any) {
            console.warn("Module cache clearing failed:", error.message);
        }
    }

    /**
     * Stop file watcher
     */
    public async stopFileWatcher(): Promise<void> {
        if (this.fileWatcher) {
            await this.fileWatcher.stopWatching();
            console.log("File watcher stopped");
        }
    }

    /**
     * Get file watcher status
     */
    public getFileWatcherStatus(): any {
        return this.fileWatcher?.getStatus() || null;
    }

    /**
     * Get file watcher restart stats
     */
    public getFileWatcherStats(): any {
        return this.fileWatcher?.getRestartStats() || null;
    }

    // ===== PLUGIN MANAGEMENT METHODS =====

    /**
     * Register a plugin with the server
     */
    public async registerPlugin(plugin: any): Promise<void> {
        await this.pluginRegistry.register(plugin);
    }

    /**
     * Unregister a plugin from the server
     */
    public async unregisterPlugin(pluginId: string): Promise<void> {
        await this.pluginRegistry.unregister(pluginId);
    }

    /**
     * Get plugin by ID
     */
    public getPlugin(pluginId: string): any {
        return this.pluginRegistry.getPlugin(pluginId);
    }

    /**
     * Get all registered plugins
     */
    public getAllPlugins(): any[] {
        return this.pluginRegistry.getAllPlugins();
    }

    /**
     * Get plugins by type
     */
    public getPluginsByType(type: PluginType): any[] {
        return this.pluginRegistry.getPluginsByType(type);
    }

    /**
     * Get plugin execution statistics
     */
    public getPluginStats(pluginId?: string): any {
        if (pluginId) {
            return this.pluginRegistry.getPluginStats(pluginId);
        }
        return this.pluginRegistry.getAllStats();
    }

    /**
     * Get plugin registry statistics
     */
    public getPluginRegistryStats(): any {
        return this.pluginRegistry.getRegistryStats();
    }

    /**
     * Get plugin engine statistics
     */
    public getPluginEngineStats(): any {
        return this.pluginEngine.getEngineStats();
    }

    /**
     * Initialize built-in plugins
     */
    public async initializeBuiltinPlugins(): Promise<void> {
        try {
            // Import and register built-in plugins
            const { JWTAuthPlugin } = await import(
                "./plugins/builtin/JWTAuthPlugin"
            );
            const { ResponseTimePlugin } = await import(
                "./plugins/builtin/ResponseTimePlugin"
            );
            const { SmartCachePlugin } = await import(
                "./plugins/builtin/SmartCachePlugin"
            );

            // Register security plugins
            await this.registerPlugin(new JWTAuthPlugin());

            // Register performance plugins
            await this.registerPlugin(new ResponseTimePlugin());

            // Register cache plugins
            await this.registerPlugin(new SmartCachePlugin());

            console.log("Built-in plugins initialized successfully");
        } catch (error: any) {
            console.error(
                "Failed to initialize built-in plugins:",
                error.message
            );
        }
    }

    /**
     * Get comprehensive server statistics including plugins
     */
    public async getServerStats(): Promise<any> {
        const cacheStats = await this.cache.getStats();
        const pluginRegistryStats = this.getPluginRegistryStats();
        const pluginEngineStats = this.getPluginEngineStats();

        return {
            server: {
                ready: this.ready,
                uptime: process.uptime(),
                memoryUsage: process.memoryUsage(),
                cpuUsage: process.cpuUsage(),
            },
            cache: cacheStats,
            plugins: {
                registry: pluginRegistryStats,
                engine: pluginEngineStats,
                totalPlugins: pluginRegistryStats.totalPlugins,
                averageExecutionTime: pluginRegistryStats.averageExecutionTime,
            },
            cluster: this.cluster ? await this.cluster.getMetrics() : null,
            fileWatcher: this.getFileWatcherStats(),
        };
    }
}
