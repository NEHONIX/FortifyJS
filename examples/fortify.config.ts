/**
 * FortifyJS TypeScript Configuration File
 *
 * This file provides type-safe configuration for FortifyJS.
 * Place this file in your project root or in a 'config' folder.
 */
// @ts-ignore
import { ServerOptions } from "fortify2-js";

const config: ServerOptions = {
    // Server configuration
    server: {
        port: 3000,
        host: "localhost",
        enableMiddleware: true,
        autoPortSwitch: {
            enabled: true,
            maxAttempts: 10,
            strategy: "increment",
        },
    },

    // File watcher configuration (Hot reload with TypeScript support)
    fileWatcher: {
        enabled: true,
        extensions: [".ts", ".js", ".json"],
        ignorePaths: [
            "**/node_modules/**",
            "**/dist/**",
            "**/*.test.ts",
            "**/*.spec.ts",
            "**/logs/**",
            "**/data/**",
        ],
        debounceMs: 100,
        restartDelay: 500,
        maxRestarts: 10,
        gracefulShutdown: true,
        verbose: true,

        // TypeScript execution configuration
        typescript: {
            enabled: true,
            runner: "tsx", // Perfect for TypeScript projects
            runnerArgs: [],
            fallbackToNode: false,
            autoDetectRunner: false,
        },

        // TypeScript type checking configuration
        typeCheck: {
            enabled: true, // Enable type checking for TypeScript projects
            configFile: "tsconfig.json",
            checkOnSave: true,
            checkBeforeRestart: true,
            showWarnings: true,
            showInfos: false,
            maxErrors: 50,
            failOnError: false, // Don't block restart on type errors
            verbose: false,
        },
    },

    // Performance optimization
    performance: {
        compression: true,
    },

    // Security configuration
    security: {
        helmet: true,
        cors: true,
    },

    // Cache configuration
    cache: {
        enabled: true,
        ttl: 300000,
    },

    // Logging configuration
    logging: {
        enabled: true,
        level: "info",

        components: {
            server: true,
            cache: true,
            cluster: true,
            performance: true,
            fileWatcher: true,
            plugins: true,
            security: true,
            monitoring: true,
            routes: true,
            userApp: true,
            console: true,
            middleware: true,
            router: true,
            typescript: true, // Enable TypeScript-specific logs
        },

        types: {
            startup: true,
            warnings: true,
            errors: true,
            performance: true,
            debug: false,
            hotReload: true,
            portSwitching: true,
        },

        format: {
            timestamps: false,
            colors: true,
            prefix: true,
            compact: false,
        },

        consoleInterception: {
            enabled: false,
            preserveOriginal: {
                enabled: true,
            },

            encryption: {
                enabled: false,
                algorithm: "aes-256-gcm",
                encoding: "base64",
                displayMode: "readable",
                showEncryptionStatus: false,
            },
        },
    },

    // Router configuration with TypeScript-optimized settings
    router: {
        enabled: true,
        precompileCommonRoutes: true,
        enableSecurity: true,
        enableCaching: true,
        warmUpOnStart: true,
        performance: {
            targetResponseTime: 1, // Ultra-fast for TypeScript projects
            complexRouteTarget: 5,
            enableProfiling: true,
            enableOptimizations: true,
        },
        security: {
            enableValidation: true,
            enableSanitization: true,
            enableRateLimit: true,
            defaultRateLimit: 1000,
        },
        cache: {
            enabled: true,
            defaultTTL: 60000,
            maxCacheSize: 1000,
        },
    },
};

export default config;

