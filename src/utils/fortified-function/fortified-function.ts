/**
 * FortifyJS - Fortified Function Main Class
 * Revolutionary secure function wrapper using modular architecture
 */

import { EventEmitter } from "events";
import { FortifiedFunctionOptions, FunctionStats, AuditEntry } from "./types";
import { SecurityHandler } from "./security-handler";
import { PerformanceMonitor } from "./performance-monitor";
import { ExecutionEngine } from "./execution-engine";

/**
 * Fortified Function - Secure function wrapper using existing FortifyJS components
 */
export class FortifiedFunction<T extends any[], R> extends EventEmitter {
    private readonly originalFunction: (...args: T) => R | Promise<R>;
    private readonly options: Required<FortifiedFunctionOptions>;
    private readonly securityHandler: SecurityHandler;
    private readonly performanceMonitor: PerformanceMonitor;
    private readonly executionEngine: ExecutionEngine;
    private isDestroyed = false;
    private cleanupInterval?: NodeJS.Timeout;

    constructor(
        fn: (...args: T) => R | Promise<R>,
        options: FortifiedFunctionOptions = {}
    ) {
        super();

        this.originalFunction = fn;
        this.options = {
            autoEncrypt: true,
            secureParameters: [],
            memoryWipeDelay: 0,
            stackTraceProtection: true,
            memoize: false,
            timeout: 30000,
            retries: 0,
            maxRetryDelay: 5000,
            auditLog: true,
            performanceTracking: true,
            debugMode: false,
            memoryPool: true,
            maxMemoryUsage: 100 * 1024 * 1024, // 100MB
            autoCleanup: true,
            ...options,
        };

        // Initialize modular components
        this.securityHandler = new SecurityHandler();
        this.performanceMonitor = new PerformanceMonitor();
        this.executionEngine = new ExecutionEngine(
            this.securityHandler,
            this.performanceMonitor
        );

        // Forward events from execution engine
        this.executionEngine.on("execution_success", (data) =>
            this.emit("execution_success", data)
        );
        this.executionEngine.on("execution_error", (data) =>
            this.emit("execution_error", data)
        );
        this.executionEngine.on("execution_failed", (data) =>
            this.emit("execution_failed", data)
        );
        this.executionEngine.on("context_created", (data) =>
            this.emit("context_created", data)
        );
        this.executionEngine.on("context_cleaned", (data) =>
            this.emit("context_cleaned", data)
        );

        // Set up automatic cleanup
        if (this.options.autoCleanup) {
            this.setupAutoCleanup();
        }
    }

    /**
     * Execute the fortified function with full security and memory management
     */
    public async execute(...args: T): Promise<R> {
        if (this.isDestroyed) {
            throw new Error("Cannot execute destroyed fortified function");
        }

        // Create secure execution context
        const context = await this.executionEngine.createSecureExecutionContext(
            args,
            this.options
        );

        try {
            // Check memoization cache
            if (this.options.memoize) {
                const cacheKey = await this.securityHandler.generateCacheKey(
                    args
                );
                const cached =
                    this.performanceMonitor.getCachedResult<R>(cacheKey);
                if (cached !== null) {
                    this.performanceMonitor.recordCacheHit();
                    this.emit("cache_hit", {
                        executionId: context.executionId,
                        cacheKey,
                    });
                    return cached;
                }
                this.performanceMonitor.recordCacheMiss();
            }

            // Execute with security and monitoring
            const result = await this.executionEngine.executeWithSecurity(
                this.originalFunction,
                context,
                args,
                this.options
            );

            // Cache result if memoization is enabled
            if (this.options.memoize) {
                const cacheKey = await this.securityHandler.generateCacheKey(
                    args
                );
                this.performanceMonitor.cacheResult(cacheKey, result);
            }

            // Handle successful execution
            this.executionEngine.handleExecutionComplete(
                context,
                true,
                undefined,
                this.options
            );

            return result;
        } catch (error) {
            // Handle failed execution
            this.executionEngine.handleExecutionComplete(
                context,
                false,
                error as Error,
                this.options
            );
            throw error;
        }
    }

    /**
     * Set up automatic cleanup of old cache entries
     */
    private setupAutoCleanup(): void {
        this.cleanupInterval = setInterval(() => {
            this.performanceMonitor.cleanupOldCacheEntries(300000); // 5 minutes
        }, 60000); // Check every minute
    }

    /**
     * Public API methods
     */
    public getStats(): FunctionStats {
        return this.performanceMonitor.getStats();
    }

    public getAuditLog(): AuditEntry[] {
        return this.performanceMonitor.getAuditLog();
    }

    public getCacheStats() {
        return this.performanceMonitor.getCacheStats();
    }

    public clearCache(): void {
        this.performanceMonitor.clearCache();
        this.emit("cache_cleared");
    }

    public clearAuditLog(): void {
        this.performanceMonitor.clearAuditLog();
        this.emit("audit_log_cleared");
    }

    public getActiveExecutionsCount(): number {
        return this.executionEngine.getActiveExecutionsCount();
    }

    /**
     * Destroy the fortified function and clean up resources
     */
    public destroy(): void {
        if (this.isDestroyed) return;

        // Clean up all active executions
        this.executionEngine.cleanupAllExecutions();

        // Clear caches and logs
        this.performanceMonitor.clearCache();
        this.performanceMonitor.clearAuditLog();

        // Clear cleanup interval
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }

        // Mark as destroyed
        this.isDestroyed = true;

        this.emit("destroyed");
        this.removeAllListeners();
        this.executionEngine.removeAllListeners();
    }
}

