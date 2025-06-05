/**
 * FortifyJS Express Quick Start
 * Pre-configured server instances for rapid development and production deployment
 */

import { createServer, createSecureServer } from "./server-factory";
import { ServerConfig } from "./types/types";

/**
 * Quick development server with sensible defaults
 */
export function quickServer(
    port: number = 3000,
    options: Partial<ServerConfig> = {}
) {
    const config: ServerConfig = {
        port,
        host: "0.0.0.0",
        environment: "development",
        security: {
            level: "basic",
            csrf: true,
            helmet: true,
        },
        rateLimit: {
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 1000, // requests per window
        },
        cache: {
            type: "memory",
            encryption: false,
            compression: false,
            maxSize: 50, // 50MB
        },
        monitoring: {
            enabled: true,
            metrics: ["cpu", "memory", "responseTime"],
            dashboard: true,
        },
        ...options,
    };

    return createServer(config);
}

/**
 * Development server with enhanced debugging
 */
export function devServer(
    port: number = 3000,
    options: Partial<ServerConfig> = {}
) {
    const config: ServerConfig = {
        port,
        host: "0.0.0.0",
        environment: "development",
        security: {
            level: "basic",
            csrf: true,
            helmet: true,
        },
        rateLimit: {
            windowMs: 15 * 60 * 1000,
            max: 10000, // Higher limit for development
        },
        cache: {
            type: "memory",
            encryption: false,
            compression: false,
            maxSize: 100, // 100MB for development
            ttl: 300, // 5 minutes
        },
        monitoring: {
            enabled: true,
            metrics: ["cpu", "memory", "responseTime", "requests"],
            dashboard: true,
        },
        logging: {
            level: "debug",
            format: "dev",
            requests: true,
        },
        ...options,
    };

    const server = createServer(config);

    // Add development-specific middleware
    server.use((req: any, _res: any, next: any) => {
        console.log(
            `[DEV] ${req.method} ${req.path} - ${new Date().toISOString()}`
        );
        next();
    });

    return server;
}

/**
 * Production server with maximum security and performance
 */
export function prodServer(
    port: number = 3000,
    options: Partial<ServerConfig> = {}
) {
    const config: ServerConfig = {
        port,
        host: options.host || "0.0.0.0",
        environment: "production",
        security: {
            level: "maximum",
            csrf: true,
            helmet: true,
            xss: true,
            sqlInjection: true,
            bruteForce: true,
            encryption: {
                algorithm: "aes-256-gcm",
                keySize: 256,
            },
        },
        rateLimit: {
            windowMs: 15 * 60 * 1000,
            max: 100, // Strict limit for production
            message: "Too many requests from this IP",
        },
        cache: {
            type: "hybrid", // Memory + Redis for production
            encryption: true,
            compression: true,
            maxSize: 200, // 200MB
            ttl: 3600, // 1 hour
            redis: {
                host: process.env.REDIS_HOST || "localhost",
                port: parseInt(process.env.REDIS_PORT || "6379"),
                password: process.env.REDIS_PASSWORD,
                db: parseInt(process.env.REDIS_DB || "0"),
                cluster: process.env.REDIS_CLUSTER === "true",
            },
        },
        monitoring: {
            enabled: true,
            metrics: ["cpu", "memory", "responseTime", "requests", "errors"],
            dashboard: true,
        },
        logging: {
            level: "info",
            format: "combined",
            requests: true,
            errors: true,
        },
        compression: {
            enabled: true,
            level: 6,
            threshold: 1024,
        },
        ...options,
    };

    return createSecureServer(config);
}

/**
 * Microservice server optimized for containerized environments
 */
export function microservice(
    port: number = 3000,
    options: Partial<ServerConfig> = {}
) {
    const config: ServerConfig = {
        port,
        host: "0.0.0.0",
        environment: "production",
        security: {
            level: "enhanced",
            csrf: true,
            helmet: true,
            xss: true,
        },
        rateLimit: {
            windowMs: 1 * 60 * 1000, // 1 minute
            max: 60, // 1 request per second
        },
        cache: {
            type: "memory", // Lightweight for microservices
            encryption: true,
            compression: true,
            maxSize: 50, // 50MB
            ttl: 600, // 10 minutes
        },
        monitoring: {
            enabled: true,
            metrics: ["cpu", "memory", "responseTime"],
            dashboard: false, // Reduce overhead
        },
        logging: {
            level: "warn",
            format: "json", // Structured logging for containers
            requests: false, // Reduce noise in container logs
        },
        ...options,
    };

    const server = createSecureServer(config);

    // Add microservice-specific health endpoints
    server.get("/health", (_req: any, res: any) => {
        res.json({
            status: "healthy",
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            version: process.env.npm_package_version || "1.0.0",
        });
    });

    server.get("/ready", (_req: any, res: any) => {
        // Check if all dependencies are ready
        const isReady = true; // Implement actual readiness checks

        if (isReady) {
            res.json({ status: "ready", timestamp: new Date().toISOString() });
        } else {
            res.status(503).json({
                status: "not ready",
                timestamp: new Date().toISOString(),
            });
        }
    });

    return server;
}

/**
 * API Gateway server with advanced routing
 */
export function apiGateway(
    port: number = 3000,
    options: Partial<ServerConfig> = {}
) {
    const config: ServerConfig = {
        port,
        host: "0.0.0.0",
        environment: "production",
        security: {
            level: "maximum",
            csrf: true,
            helmet: true,
            xss: true,
            sqlInjection: true,
            bruteForce: true,
        },
        rateLimit: {
            windowMs: 1 * 60 * 1000,
            max: 1000, // High throughput for gateway
        },
        cache: {
            type: "redis", // Centralized cache for gateway
            encryption: true,
            compression: true,
            ttl: 300, // 5 minutes for API responses
            redis: {
                host: process.env.REDIS_HOST || "localhost",
                port: parseInt(process.env.REDIS_PORT || "6379"),
                password: process.env.REDIS_PASSWORD,
                cluster: true, // Use cluster for high availability
            },
        },
        monitoring: {
            enabled: true,
            metrics: ["cpu", "memory", "responseTime", "requests", "errors"],
            dashboard: true,
        },
        logging: {
            level: "info",
            format: "json",
            requests: true,
            errors: true,
        },
        ...options,
    };

    const server = createSecureServer(config);

    // Add gateway-specific middleware
    server.use("/api", (req: any, res: any, next: any) => {
        // Add API versioning support
        req.apiVersion = req.headers["api-version"] || "v1";

        // Add request ID for tracing
        req.requestId =
            req.headers["x-request-id"] || require("crypto").randomUUID();

        res.set("X-Request-ID", req.requestId);
        next();
    });

    return server;
}

/**
 * Create a server with custom configuration
 */
export function customServer(config: ServerConfig) {
    if (
        config.security?.level === "maximum" ||
        config.environment === "production"
    ) {
        return createSecureServer(config);
    } else {
        return createServer(config);
    }
}

