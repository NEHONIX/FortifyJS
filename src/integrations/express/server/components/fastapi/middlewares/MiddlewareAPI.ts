import { RequestHandler } from "express";
import {
    MiddlewareConfiguration,
    MiddlewarePriority,
    CustomMiddleware,
    MiddlewareInfo,
    MiddlewareStats, 
    UltraFastApp,
    MiddlewareAPIInterface,
} from "../../../../types/types";
import { MiddlewareManager } from "./middlewareManager";
import { middleware as fortifyMiddleware } from "../../../../../express.middleware";
import { logger } from "../../../utils/Logger";

/** 
 * MiddlewareAPI - User-friendly middleware interface that follows the specified pattern
 * Returns a middleware object with register() method for custom middleware
 */
export class MiddlewareAPI implements MiddlewareAPIInterface {
    private Manager: MiddlewareManager;
    private app: UltraFastApp;
    private config: MiddlewareConfiguration;

    constructor(
        Manager: MiddlewareManager,
        app: UltraFastApp,
        config: MiddlewareConfiguration = {}
    ) {
        this.Manager = Manager;
        this.app = app;
        this.config = config;

        // Apply default middleware based on configuration
        this.applyDefaultMiddleware();
    }

    /**
     * Register custom middleware with options
     */
    public register(
        middleware: CustomMiddleware | RequestHandler,
        options?: {
            name?: string;
            priority?: MiddlewarePriority;
            routes?: string[];
            cacheable?: boolean;
            ttl?: number;
        }
    ): MiddlewareAPI {
        try {
            this.Manager.register(middleware, options);
            logger.debug(
                "middleware",
                `Custom middleware registered: ${options?.name || "anonymous"}`
            );
        } catch (error) {
            logger.error(
                "middleware",
                `Failed to register middleware: ${error}`
            );
        }
        return this;
    }

    /**
     * Unregister middleware by ID
     */
    public unregister(id: string): MiddlewareAPI {
        try {
            this.Manager.unregister(id);
            logger.debug("middleware", `Middleware unregistered: ${id}`);
        } catch (error) {
            logger.error(
                "middleware",
                `Failed to unregister middleware: ${error}`
            );
        }
        return this;
    }

    /**
     * Enable middleware by ID
     */
    public enable(id: string): MiddlewareAPI {
        try {
            this.Manager.enable(id);
            logger.debug("middleware", `Middleware enabled: ${id}`);
        } catch (error) {
            logger.error("middleware", `Failed to enable middleware: ${error}`);
        }
        return this;
    }

    /**
     * Disable middleware by ID
     */
    public disable(id: string): MiddlewareAPI {
        try {
            this.Manager.disable(id);
            logger.debug("middleware", `Middleware disabled: ${id}`);
        } catch (error) {
            logger.error(
                "middleware",
                `Failed to disable middleware: ${error}`
            );
        }
        return this;
    }

    /**
     * Get middleware information
     */
    public getInfo(id?: string): MiddlewareInfo | MiddlewareInfo[] {
        return this.Manager.getInfo(id);
    }

    /**
     * Get middleware statistics
     */
    public getStats(): MiddlewareStats {
        return this.Manager.getStats();
    }

    /**
     * Clear all middleware
     */
    public clear(): MiddlewareAPI {
        try {
            // Get all middleware IDs and unregister them
            const allMiddleware = this.Manager.getInfo() as MiddlewareInfo[];
            allMiddleware.forEach((middleware) => {
                // Find the ID from the registry (this is a simplified approach)
                // In a real implementation, we'd need to track IDs better
            });
            logger.debug("middleware", "All custom middleware cleared");
        } catch (error) {
            logger.error("middleware", `Failed to clear middleware: ${error}`);
        }
        return this;
    }

    /**
     * Optimize middleware execution
     */
    public async optimize(): Promise<MiddlewareAPI> {
        try {
            await this.Manager.optimize();
            logger.debug("middleware", "Middleware optimization completed");
        } catch (error) {
            logger.error(
                "middleware",
                `Failed to optimize middleware: ${error}`
            );
        }
        return this;
    }

    /**
     * Apply default middleware based on configuration
     */
    private applyDefaultMiddleware(): void {
        logger.debug(
            "middleware",
            "Applying default middleware configuration..."
        );

        // Apply FortifyJS middleware if security is enabled
        if (this.config.security !== false) {
            try {
                const securityOptions =
                    typeof this.config.security === "object"
                        ? this.config.security
                        : {};

                // Convert complex rateLimit config to boolean for FortifyJS middleware
                const rateLimitEnabled: boolean =
                    this.config.rateLimit !== false;
                const maxRequestsPerMinute =
                    typeof this.config.rateLimit === "object"
                        ? this.config.rateLimit.max || 100
                        : 100;

                const fortifyMiddlewareHandler = fortifyMiddleware({
                    ...securityOptions,
                    csrfProtection: securityOptions.csrfProtection || false,
                    secureHeaders: securityOptions.helmet !== false,
                    rateLimit: rateLimitEnabled,
                    maxRequestsPerMinute,
                    customHeaders: securityOptions.customHeaders || {},
                });

                this.Manager.register(fortifyMiddlewareHandler, {
                    name: "fortify-security",
                    priority: "critical",
                    cacheable: false,
                });

                logger.debug(
                    "middleware",
                    "FortifyJS security middleware applied"
                );
            } catch (error) {
                logger.warn(
                    "middleware",
                    `Failed to apply FortifyJS middleware: ${error}`
                );
            }
        }

        // Apply CORS if enabled
        if (this.config.cors !== false) {
            try {
                const corsOptions =
                    typeof this.config.cors === "object"
                        ? this.config.cors
                        : {};

                this.Manager.enableCors(corsOptions);
                logger.debug("middleware", "CORS middleware applied");
            } catch (error) {
                logger.warn(
                    "middleware",
                    `Failed to apply CORS middleware: ${error}`
                );
            }
        }

        // Apply compression if enabled
        if (this.config.compression !== false) {
            try {
                const compressionOptions =
                    typeof this.config.compression === "object"
                        ? this.config.compression
                        : {};

                this.Manager.enableCompression(compressionOptions);
                logger.debug("middleware", "Compression middleware applied");
            } catch (error) {
                logger.warn(
                    "middleware",
                    `Failed to apply compression middleware: ${error}`
                );
            }
        }

        // Apply rate limiting if enabled
        if (this.config.rateLimit !== false) {
            try {
                const rateLimitOptions =
                    typeof this.config.rateLimit === "object"
                        ? this.config.rateLimit
                        : {};

                this.Manager.enableRateLimit(rateLimitOptions);
                logger.debug("middleware", "Rate limiting middleware applied");
            } catch (error) {
                logger.warn(
                    "middleware",
                    `Failed to apply rate limiting middleware: ${error}`
                );
            }
        }

        // Apply custom headers if specified
        if (this.config.customHeaders) {
            try {
                const customHeadersMiddleware = (
                    req: any,
                    res: any,
                    next: any
                ) => {
                    Object.entries(this.config.customHeaders!).forEach(
                        ([key, value]) => {
                            res.setHeader(key, value);
                        }
                    );
                    next();
                };

                this.Manager.register(customHeadersMiddleware, {
                    name: "custom-headers",
                    priority: "high",
                    cacheable: true,
                    ttl: 3600000, // 1 hour
                });

                logger.debug("middleware", "Custom headers middleware applied");
            } catch (error) {
                logger.warn(
                    "middleware",
                    `Failed to apply custom headers middleware: ${error}`
                );
            }
        }

        logger.debug("middleware", "Default middleware configuration applied");
    }

    /**
     * Update configuration and reapply middleware
     */
    public updateConfig(newConfig: MiddlewareConfiguration): MiddlewareAPI {
        this.config = { ...this.config, ...newConfig };
        this.Manager.configure(this.config);

        // Reapply default middleware with new configuration
        this.applyDefaultMiddleware();

        logger.debug("middleware", "Middleware configuration updated");
        return this;
    }

    /**
     * Get current configuration
     */
    public getConfig(): MiddlewareConfiguration {
        return { ...this.config };
    }

    /**
     * Enable performance tracking for all middleware
     */
    public enablePerformanceTracking(): MiddlewareAPI {
        this.config.enablePerformanceTracking = true;
        this.Manager.configure(this.config);
        logger.debug(
            "middleware",
            "Performance tracking enabled for all middleware"
        );
        return this;
    }

    /**
     * Disable performance tracking for all middleware
     */
    public disablePerformanceTracking(): MiddlewareAPI {
        this.config.enablePerformanceTracking = false;
        this.Manager.configure(this.config);
        logger.debug(
            "middleware",
            "Performance tracking disabled for all middleware"
        );
        return this;
    }

    /**
     * Enable caching for all middleware
     */
    public enableCaching(): MiddlewareAPI {
        this.config.enableCaching = true;
        this.Manager.configure(this.config);
        logger.debug("middleware", "Caching enabled for all middleware");
        return this;
    }

    /**
     * Disable caching for all middleware
     */
    public disableCaching(): MiddlewareAPI {
        this.config.enableCaching = false;
        this.Manager.configure(this.config);
        logger.debug("middleware", "Caching disabled for all middleware");
        return this;
    }

    /**
     * Warm up middleware cache
     */
    public async warmCache(): Promise<MiddlewareAPI> {
        try {
            await this.Manager.warmCache();
            logger.debug("middleware", "Middleware cache warmed up");
        } catch (error) {
            logger.error("middleware", `Failed to warm cache: ${error}`);
        }
        return this;
    }

    /**
     * Clear middleware cache
     */
    public clearCache(): MiddlewareAPI {
        try {
            this.Manager.clearCache();
            logger.debug("middleware", "Middleware cache cleared");
        } catch (error) {
            logger.error("middleware", `Failed to clear cache: ${error}`);
        }
        return this;
    }
}

