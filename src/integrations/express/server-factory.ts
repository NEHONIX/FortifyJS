/**
 * FortifyJS Express Server Factory
 * Revolutionary zero-configuration Express server with Redis caching and military-grade security
 */

import express, { Express } from "express";
import { ServerConfig, EnhancedRequest, EnhancedResponse } from "./types";
import { createOptimalCache } from "./cache/CacheFactory";
import { SecurityMiddleware } from "./security-middleware";
import { PerformanceMonitor } from "./performance-monitor";
import { ClusterManager } from "./cluster-manager";
import { func } from "../../utils/fortified-function";
import { Hash } from "../../core/hash";
import { FortifyJS } from "../../core/crypto";

import { SecureRandom } from "../../core/random";
import { EncryptionService } from "./encryption";
import { SecureCacheAdapter } from "./cache";

/**
 * Create a FortifyJS Express server with zero configuration
 *
 * @example
 * ```typescript
 * import { createServer } from 'fortifyjs2-js';
 *
 * const app = createServer({
 *   port: 7689,
 *   cache: { type: 'redis' },
 *   security: { level: 'maximum' }
 * });
 *
 * app.get('/users', async (req, res) => {
 *   const users = await getUsers();
 *   res.success(users);
 * });
 *
 * app.start();
 * ```
 */
export function createServer(config: ServerConfig = {}): FortifyExpressApp {
    const app = new FortifyExpressApp(config);
    return app;
}

/**
 * Create a secure Express server with maximum protection
 */
export function createSecureServer(
    config: Partial<ServerConfig> = {}
): FortifyExpressApp {
    const secureConfig: ServerConfig = {
        ...config,
        security: {
            level: "maximum",
            csrf: true,
            helmet: true,
            xss: true,
            sqlInjection: true,
            bruteForce: true,
            ...config.security,
        },
        cache: {
            type: "redis",
            ttl: 300,
            compression: true,
            ...config.cache,
        },
        monitoring: {
            enabled: true,
            dashboard: true,
            ...config.monitoring,
        },
    };

    return createServer(secureConfig);
}

/**
 * Revolutionary FortifyJS Express Application
 */
export class FortifyExpressApp {
    private app: Express;
    private config: ServerConfig;
    private cache!: SecureCacheAdapter;
    private security!: SecurityMiddleware;
    private monitor!: PerformanceMonitor;
    private cluster?: ClusterManager;
    private server: any;
    private isStarted = false;

    constructor(config: ServerConfig = {}) {
        this.config = this.mergeDefaultConfig(config);
        this.app = express();

        // Initialize core components
        this.initializeCache();
        this.initializeSecurity();
        this.initializeMonitoring();
        this.initializeMiddleware();

        // Setup cluster if enabled
        if (this.config.cluster) {
            this.cluster = new ClusterManager(this.config);
        }
    }

    /**
     * Merge user config with intelligent defaults
     */
    private mergeDefaultConfig(config: ServerConfig): ServerConfig {
        return {
            port: 7689,
            host: "0.0.0.0",
            environment: (process.env.NODE_ENV as any) || "development",
            cluster: process.env.NODE_ENV === "production",
            workers: require("os").cpus().length,
            maxMemory: "512MB",

            security: {
                level: "enhanced",
                csrf: true,
                helmet: true,
                xss: true,
                sqlInjection: true,
                bruteForce: true,
                ...config.security,
            },

            cache: {
                type: "memory",
                ttl: 300,
                maxSize: 1000,
                compression: false,
                ...config.cache,
            },

            monitoring: {
                enabled: true,
                interval: 5000,
                dashboard: config.environment === "development",
                ...config.monitoring,
            },

            cors: {
                origin: true,
                credentials: true,
                ...config.cors,
            },

            rateLimit: {
                windowMs: 15 * 60 * 1000, // 15 minutes
                max: 100,
                ...config.rateLimit,
            },

            compression: {
                level: 6,
                threshold: 1024,
                ...config.compression,
            },

            logging: {
                level: config.environment === "production" ? "info" : "debug",
                format: "json",
                destination: "console",
                ...config.logging,
            },

            ...config,
        };
    }

    /**
     * Initialize ultra-fast secure caching system
     */
    private initializeCache(): void {
        this.cache = createOptimalCache(this.config.cache || {});
    }

    /**
     * Initialize military-grade security
     */
    private initializeSecurity(): void {
        this.security = new SecurityMiddleware(this.config.security!);
    }

    /**
     * Initialize performance monitoring
     */
    private initializeMonitoring(): void {
        this.monitor = new PerformanceMonitor(this.config.monitoring!);
    }

    /**
     * Setup core middleware stack
     */
    private initializeMiddleware(): void {
        // Security middleware (first priority)
        this.app.use(this.security.getMiddleware());

        // Performance monitoring
        this.app.use(this.monitor.getMiddleware());

        // Enhanced request/response objects
        this.app.use(this.enhanceRequestResponse.bind(this));

        // Built-in middleware
        this.setupBuiltinMiddleware();
    }

    /**
     * Setup built-in Express middleware with optimizations
     */
    private setupBuiltinMiddleware(): void {
        // JSON parsing with security
        this.app.use(
            express.json({
                limit: "10mb",
                verify: (req: any, _res, buf) => {
                    // Add request signature for security
                    req.rawBody = buf;
                    req.signature = Hash.create(buf.toString(), {
                        algorithm: "sha256",
                        outputFormat: "hex",
                    });
                },
            })
        );

        // URL encoding
        this.app.use(express.urlencoded({ extended: true, limit: "10mb" }));

        // Static files with caching
        if (this.config.environment === "production") {
            this.app.use(
                express.static("public", {
                    maxAge: "1d",
                    etag: true,
                    lastModified: true,
                })
            );
        }
    }

    /**
     * Enhance request and response objects with FortifyJS utilities
     */
    private enhanceRequestResponse(req: any, res: any, next: any): void {
        // Enhance request object
        req.cache = {
            get: (key: string) => this.cache.get(key),
            set: (key: string, value: any, ttl?: number) =>
                this.cache.set(key, value, {
                    ttl: ttl ? ttl * 1000 : undefined,
                }),
            del: (key: string) => this.cache.delete(key),
            tags: (tags: string[]) =>
                this.cache.set(req.path, req.body || {}, { tags }),
        };

        // Generate a secure session-specific encryption key for this request
        const sessionKey = EncryptionService.generateSessionKey();

        req.security = {
            encrypt: async (data: any) => {
                try {
                    // Encryption using EncryptionService
                    return await EncryptionService.encrypt(data, sessionKey, {
                        algorithm: "aes-256-gcm",
                        quantumSafe: false,
                    });
                } catch (error) {
                    throw new Error(
                        `Encryption failed: ${
                            error instanceof Error
                                ? error.message
                                : "Unknown error"
                        }`
                    );
                }
            },
            decrypt: async (encryptedData: string) => {
                try {
                    // decryption using EncryptionService
                    return await EncryptionService.decrypt(
                        encryptedData,
                        sessionKey
                    );
                } catch (error) {
                    throw new Error(
                        `Decryption failed: ${
                            error instanceof Error
                                ? error.message
                                : "Invalid encrypted data"
                        }`
                    );
                }
            },
            hash: (data: string) => {
                // hashing with cryptographically secure salt
                const salt = SecureRandom.getRandomBytes(16);
                return Hash.createSecureHash(data, salt, {
                    algorithm: "sha256",
                    outputFormat: "hex",
                }) as string;
            },
            verify: (data: string, hash: string) => {
                // Timing-attack resistant verification
                const computedHash = Hash.createSecureHash(data, undefined, {
                    algorithm: "sha256",
                    outputFormat: "hex",
                }) as string;
                return FortifyJS.constantTimeEqual(computedHash, hash);
            },
            generateToken: () => {
                // Generate cryptographically secure tokens for sessions, CSRF, etc.
                return FortifyJS.generateSecureToken({
                    length: 32,
                    entropy: "high",
                });
            },
            sessionKey: sessionKey, // Expose session key for middleware use
        };

        req.performance = {
            start: () => {
                req._startTime = process.hrtime.bigint();
            },
            end: () =>
                Number(process.hrtime.bigint() - req._startTime) / 1000000,
            mark: (name: string) => {
                req._marks = req._marks || {};
                req._marks[name] = process.hrtime.bigint();
            },
            measure: (name: string, start: string, end: string) => {
                const marks = req._marks || {};
                return Number(marks[end] - marks[start]) / 1000000;
            },
        };

        // Enhance response object
        res.cache = {
            set: (ttl?: number, tags?: string[]) => {
                res.set(
                    "Cache-Control",
                    `max-age=${ttl || this.config.cache?.ttl || 300}`
                );
                if (tags) {
                    res.set("Cache-Tags", tags.join(","));
                }
            },
            invalidate: (tags: string[]) => this.cache.invalidateByTags(tags),
        };

        res.success = (data?: any, message?: string) => {
            res.json({
                success: true,
                message: message || "Operation completed successfully",
                data: data || null,
                timestamp: new Date().toISOString(),
            });
        };

        res.error = (error: string | Error, code = 500) => {
            const message = error instanceof Error ? error.message : error;
            res.status(code).json({
                success: false,
                error: message,
                timestamp: new Date().toISOString(),
                ...(this.config.environment === "development" &&
                    error instanceof Error && {
                        stack: error.stack,
                    }),
            });
        };

        res.paginated = (data: any[], pagination: any) => {
            res.json({
                success: true,
                data,
                pagination,
                timestamp: new Date().toISOString(),
            });
        };

        next();
    }

    /**
     * Add a smart route with automatic optimization
     */
    public get(path: string, ...handlers: any[]): this {
        const optimizedHandlers = handlers.map((handler) =>
            typeof handler === "function" ? func(handler) : handler
        );
        this.app.get(path, ...optimizedHandlers);
        return this;
    }

    public post(path: string, ...handlers: any[]): this {
        const optimizedHandlers = handlers.map((handler) =>
            typeof handler === "function" ? func(handler) : handler
        );
        this.app.post(path, ...optimizedHandlers);
        return this;
    }

    public put(path: string, ...handlers: any[]): this {
        const optimizedHandlers = handlers.map((handler) =>
            typeof handler === "function" ? func(handler) : handler
        );
        this.app.put(path, ...optimizedHandlers);
        return this;
    }

    public delete(path: string, ...handlers: any[]): this {
        const optimizedHandlers = handlers.map((handler) =>
            typeof handler === "function" ? func(handler) : handler
        );
        this.app.delete(path, ...optimizedHandlers);
        return this;
    }

    public patch(path: string, ...handlers: any[]): this {
        const optimizedHandlers = handlers.map((handler) =>
            typeof handler === "function" ? func(handler) : handler
        );
        this.app.patch(path, ...optimizedHandlers);
        return this;
    }

    /**
     * Add middleware
     */
    public use(...args: any[]): this {
        this.app.use(...args);
        return this;
    }

    /**
     * Start the revolutionary server
     */
    public async start(): Promise<void> {
        if (this.isStarted) {
            throw new Error("Server is already started");
        }

        try {
            // Initialize cache connection
            await this.cache.connect();

            // Start cluster if enabled
            if (this.cluster) {
                await this.cluster.start(() => this.startSingleInstance());
            } else {
                await this.startSingleInstance();
            }

            this.isStarted = true;

            console.log(`FortifyJS Express Server started, happy coding 😎!`);
            console.log(` URL: http://${this.config.host}:${this.config.port}`);
            console.log(` Security: ${this.config.security?.level}`);
            console.log(` Cache: ${this.config.cache?.type}`);
            console.log(
                ` Monitoring: ${
                    this.config.monitoring?.enabled ? "enabled" : "disabled"
                }`
            );
        } catch (error) {
            console.error("❌ Failed to start server:", error);
            throw error;
        }
    }

    /**
     * Start single server instance
     */
    private async startSingleInstance(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.server = this.app.listen(
                this.config.port!,
                this.config.host!,
                () => {
                    resolve();
                }
            );

            this.server.on("error", reject);
        });
    }

    /**
     * Stop the server gracefully
     */
    public async stop(): Promise<void> {
        if (!this.isStarted) {
            return;
        }

        try {
            // Close server
            if (this.server) {
                await new Promise<void>((resolve) => {
                    this.server.close(() => resolve());
                });
            }

            // Disconnect cache
            await this.cache.disconnect();

            // Stop cluster
            if (this.cluster) {
                await this.cluster.stop();
            }

            this.isStarted = false;
            console.log(" Server stopped gracefully");
        } catch (error) {
            console.error("❌ Error stopping server:", error);
            throw error;
        }
    }

    /**
     * Get the underlying Express app
     */
    public getApp(): Express {
        return this.app;
    }

    /**
     * Get server configuration
     */
    public getConfig(): ServerConfig {
        return this.config;
    }

    /**
     * Get performance metrics
     */
    public getMetrics(): any {
        return this.monitor.getMetrics();
    }

    /**
     * Get cache statistics
     */
    public getCacheStats(): any {
        return this.cache.getStats();
    }
}

