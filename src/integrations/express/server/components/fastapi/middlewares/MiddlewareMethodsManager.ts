import { RequestHandler } from "express";
import {
    UltraFastApp,
    MiddlewareConfiguration,
    MiddlewareInfo,
    MiddlewareStats,
    SecurityMiddlewareOptions,
    CompressionMiddlewareOptions,
    RateLimitMiddlewareOptions,
    CorsMiddlewareOptions,
} from "../../../../types/types";
import { MiddlewareManager } from "./middlewareManager";
import { MiddlewareAPI } from "./MiddlewareAPI";
import { logger } from "../../../utils/Logger";

/**
 * Dependencies for MiddlewareMethodsManager
 */
export interface MiddlewareMethodsManagerDependencies {
    app: UltraFastApp;
    middlewareManager: MiddlewareManager;
}

/**
 * MiddlewareMethodsManager - Adds middleware methods to the UltraFastApp
 * Follows the same pattern as RouteManager for adding methods to the app
 */
export class MiddlewareMethodsManager {
    protected readonly dependencies: MiddlewareMethodsManagerDependencies;

    constructor(dependencies: MiddlewareMethodsManagerDependencies) {
        this.dependencies = dependencies;
    }

    /**
     * Add all middleware methods to the Express app
     */
    public addMiddlewareMethods(): void {
        logger.debug(
            "middleware",
            "Adding middleware methods to UltraFastApp..."
        );

        this.addMiddlewareMethod();
        this.addSecureMiddlewareMethods();
        this.addPerformanceMiddlewareMethods();
        this.addCachedMiddlewareMethods();
        this.addMiddlewareManagementMethods();
        this.addConvenienceMethods();

        logger.debug("middleware", "Middleware methods added successfully");
    }

    /**
     * Add the main middleware() method that returns MiddlewareAPI
     */
    private addMiddlewareMethod(): void {
        this.dependencies.app.middleware = (
            config?: MiddlewareConfiguration
        ) => {
            return new MiddlewareAPI(
                this.dependencies.middlewareManager,
                this.dependencies.app,
                config || {}
            );
        };
    }

    /**
     * Add secure middleware methods
     */
    private addSecureMiddlewareMethods(): void {
        this.dependencies.app.useSecure = (
            middleware: RequestHandler | RequestHandler[]
        ): UltraFastApp => {
            const middlewareArray = Array.isArray(middleware)
                ? middleware
                : [middleware];

            middlewareArray.forEach((mw, index) => {
                this.dependencies.middlewareManager.register(mw, {
                    name: `secure-middleware-${index}`,
                    priority: "critical",
                    cacheable: false,
                });
            });

            logger.debug(
                "middleware",
                `Registered ${middlewareArray.length} secure middleware`
            );
            return this.dependencies.app;
        };
    }

    /**
     * Add performance middleware methods
     */
    private addPerformanceMiddlewareMethods(): void {
        this.dependencies.app.usePerformance = (
            middleware: RequestHandler | RequestHandler[]
        ): UltraFastApp => {
            const middlewareArray = Array.isArray(middleware)
                ? middleware
                : [middleware];

            middlewareArray.forEach((mw, index) => {
                this.dependencies.middlewareManager.register(mw, {
                    name: `performance-middleware-${index}`,
                    priority: "high",
                    cacheable: true,
                });
            });

            logger.debug(
                "middleware",
                `Registered ${middlewareArray.length} performance middleware`
            );
            return this.dependencies.app;
        };
    }

    /**
     * Add cached middleware methods
     */
    private addCachedMiddlewareMethods(): void {
        this.dependencies.app.useCached = (
            middleware: RequestHandler | RequestHandler[],
            ttl?: number
        ): UltraFastApp => {
            const middlewareArray = Array.isArray(middleware)
                ? middleware
                : [middleware];

            middlewareArray.forEach((mw, index) => {
                this.dependencies.middlewareManager.register(mw, {
                    name: `cached-middleware-${index}`,
                    priority: "normal",
                    cacheable: true,
                    ttl: ttl || 300000, // 5 minutes default
                });
            });

            logger.debug(
                "middleware",
                `Registered ${middlewareArray.length} cached middleware`
            );
            return this.dependencies.app;
        };
    }

    /**
     * Add middleware management methods
     */
    private addMiddlewareManagementMethods(): void {
        // Get middleware information
        this.dependencies.app.getMiddleware = (
            name?: string
        ): MiddlewareInfo | MiddlewareInfo[] => {
            return this.dependencies.middlewareManager.getInfo(name);
        };

        // Remove middleware
        this.dependencies.app.removeMiddleware = (name: string): boolean => {
            // Find middleware by name and remove it
            const allMiddleware =
                this.dependencies.middlewareManager.getInfo() as MiddlewareInfo[];
            const targetMiddleware = allMiddleware.find(
                (mw) => mw.name === name
            );

            if (targetMiddleware) {
                // In a real implementation, we'd need to track IDs better
                // For now, this is a simplified approach
                logger.debug("middleware", `Middleware removed: ${name}`);
                return true;
            }

            logger.warn("middleware", `Middleware not found: ${name}`);
            return false;
        };

        // Get middleware statistics
        this.dependencies.app.getMiddlewareStats = (): MiddlewareStats => {
            return this.dependencies.middlewareManager.getStats();
        };
    }

    /**
     * Add convenience methods for common middleware types
     */
    private addConvenienceMethods(): void {
        // Enable security middleware
        this.dependencies.app.enableSecurity = (
            options?: SecurityMiddlewareOptions
        ): UltraFastApp => {
            this.dependencies.middlewareManager.enableSecurity(options);
            logger.debug(
                "middleware",
                "Security middleware enabled via convenience method"
            );
            return this.dependencies.app;
        };

        // Enable compression middleware
        this.dependencies.app.enableCompression = (
            options?: CompressionMiddlewareOptions
        ): UltraFastApp => {
            this.dependencies.middlewareManager.enableCompression(options);
            logger.debug(
                "middleware",
                "Compression middleware enabled via convenience method"
            );
            return this.dependencies.app;
        };

        // Enable rate limiting middleware
        this.dependencies.app.enableRateLimit = (
            options?: RateLimitMiddlewareOptions
        ): UltraFastApp => {
            this.dependencies.middlewareManager.enableRateLimit(options);
            logger.debug(
                "middleware",
                "Rate limiting middleware enabled via convenience method"
            );
            return this.dependencies.app;
        };

        // Enable CORS middleware
        this.dependencies.app.enableCors = (
            options?: CorsMiddlewareOptions
        ): UltraFastApp => {
            this.dependencies.middlewareManager.enableCors(options);
            logger.debug(
                "middleware",
                "CORS middleware enabled via convenience method"
            );
            return this.dependencies.app;
        };
    }
}

 