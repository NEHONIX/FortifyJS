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
        // Smart defaults for production-ready performance and security
        this.options = {
            // Security - Best practices enabled by default
            autoEncrypt: true,
            secureParameters: [],
            memoryWipeDelay: 0,
            stackTraceProtection: true,
            smartSecurity: true, //  Enable smart security by default
            threatDetection: true, //  Enable threat detection by default

            // Performance - Smart caching and optimization enabled by default
            memoize: true, //  Enable memoization by default for better performance
            timeout: 30000,
            retries: 2, //  Reasonable retry count by default
            maxRetryDelay: 5000,
            smartCaching: true, //  Smart caching enabled by default
            cacheStrategy: "adaptive", //  Best strategy by default
            cacheTTL: 600000, //  10 minutes - longer TTL for better performance
            maxCacheSize: 2000, //  Larger cache size for better hit rates
            precompile: false,
            optimizeExecution: true, //  Optimization enabled by default

            // Smart Actions - All intelligence features enabled by default
            autoTuning: true, //  Auto-optimization enabled
            predictiveAnalytics: true, //  Pattern learning enabled
            adaptiveTimeout: true, //  Smart timeout adjustment
            intelligentRetry: true, //  Smart retry strategy
            anomalyDetection: true, //  Anomaly detection enabled
            performanceRegression: true, //  Performance monitoring enabled

            // Monitoring - Comprehensive tracking enabled by default
            auditLog: true,
            performanceTracking: true,
            debugMode: false,
            detailedMetrics: true, //  Detailed metrics for optimization

            // Memory Management - Smart memory handling enabled by default
            memoryPool: true,
            maxMemoryUsage: 200 * 1024 * 1024, //  200MB - more generous limit
            autoCleanup: true,
            smartMemoryManagement: true, //  Smart memory management enabled
            memoryPressureHandling: true, //  Memory pressure handling enabled

            // Override with user options
            ...options,
        };

        // Initialize modular components with smart configurations
        this.securityHandler = new SecurityHandler();

        // Configure smart cache based on options
        const cacheConfig = this.options.smartCaching
            ? {
                  strategy: this.options.cacheStrategy,
                  maxSize: this.options.maxCacheSize,
                  ttl: this.options.cacheTTL,
                  autoCleanup: this.options.autoCleanup,
                  compressionEnabled: false,
                  persistToDisk: false,
              }
            : undefined;

        this.performanceMonitor = new PerformanceMonitor(cacheConfig);
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
            // Check cache (both memoization and smart caching)
            if (this.options.memoize || this.options.smartCaching) {
                const cacheKey = await this.securityHandler.generateCacheKey(
                    args
                );

                if (this.options.debugMode) {
                    console.log(
                        `[DEBUG] Cache lookup - Key: ${cacheKey.substring(
                            0,
                            16
                        )}...`
                    );
                    console.log(`[DEBUG] Args: ${JSON.stringify(args)}`);
                }

                const cached =
                    this.performanceMonitor.getCachedResult<R>(cacheKey);
                if (cached !== null) {
                    if (this.options.debugMode) {
                        console.log(
                            `[DEBUG] Cache HIT for key: ${cacheKey.substring(
                                0,
                                16
                            )}...`
                        );
                    }
                    this.performanceMonitor.recordCacheHit();
                    this.emit("cache_hit", {
                        executionId: context.executionId,
                        cacheKey,
                    });
                    return cached;
                }

                if (this.options.debugMode) {
                    console.log(
                        `[DEBUG] Cache MISS for key: ${cacheKey.substring(
                            0,
                            16
                        )}...`
                    );
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
            if (this.options.memoize || this.options.smartCaching) {
                const cacheKey = await this.securityHandler.generateCacheKey(
                    args
                );
                const ttl = this.options.smartCaching
                    ? this.options.cacheTTL
                    : undefined;

                if (this.options.debugMode) {
                    console.log(
                        `[DEBUG] Storing in cache - Key: ${cacheKey.substring(
                            0,
                            16
                        )}...`
                    );
                    console.log(
                        `[DEBUG] Result: ${JSON.stringify(result).substring(
                            0,
                            50
                        )}...`
                    );
                }

                this.performanceMonitor.cacheResult(cacheKey, result, ttl);
            }

            // Handle successful execution with enhanced metrics
            this.executionEngine.handleExecutionComplete(
                context,
                true,
                undefined,
                this.options
            );

            // Update performance metrics if detailed tracking is enabled
            if (this.options.detailedMetrics) {
                const executionTime = performance.now() - context.startTime;
                const memoryUsage = this.getCurrentMemoryUsage();
                const cacheStats = this.performanceMonitor.getCacheStats();

                const metrics = {
                    executionTime,
                    memoryUsage,
                    cpuUsage: 0, // Would need more sophisticated CPU tracking
                    cacheHitRate: cacheStats.hitRate,
                    errorRate: 0, // Success case
                    throughput: 1000 / executionTime, // Operations per second
                    latency: executionTime,
                };

                this.performanceMonitor.updatePerformanceMetrics(metrics);
            }

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

            // Smart cache warming if predictive analytics is enabled
            if (this.options.predictiveAnalytics) {
                this.warmCache();
            }

            // 🤖 Auto-apply optimization suggestions if auto-tuning is enabled
            if (this.options.autoTuning) {
                this.autoApplyOptimizations();
            }
        }, 60000); // Check every minute
    }

    /**
     * Get current memory usage
     */
    private getCurrentMemoryUsage(): number {
        return process.memoryUsage?.()?.heapUsed || 0;
    }

    /**
     * 🤖 Automatically apply optimization suggestions
     */
    private autoApplyOptimizations(): void {
        const suggestions = this.getOptimizationSuggestions();
        const stats = this.getStats();

        // Only auto-apply if we have enough execution data
        if (stats.executionCount < 10) return;

        for (const suggestion of suggestions) {
            // Only auto-apply high priority suggestions to avoid over-optimization
            if (
                suggestion.priority === "high" ||
                suggestion.priority === "critical"
            ) {
                this.applySuggestionAutomatically(suggestion);
            }
        }
    }

    /**
     * 🔧 Apply a specific optimization suggestion automatically
     */
    private applySuggestionAutomatically(suggestion: any): void {
        const cacheStats = this.getCacheStats();

        switch (suggestion.type) {
            case "cache":
                if (
                    suggestion.description.includes("cache size") &&
                    cacheStats.hitRate < 0.5
                ) {
                    // Increase cache size by 50% if hit rate is low
                    this.options.maxCacheSize = Math.min(
                        this.options.maxCacheSize * 1.5,
                        5000
                    );
                    this.emit("auto_optimization_applied", {
                        type: "cache_size_increased",
                        newValue: this.options.maxCacheSize,
                        reason: "Low cache hit rate detected",
                    });
                }

                if (
                    suggestion.description.includes("TTL") &&
                    cacheStats.hitRate < 0.4
                ) {
                    // Increase TTL by 50% if hit rate is very low
                    this.options.cacheTTL = Math.min(
                        this.options.cacheTTL * 1.5,
                        1800000
                    ); // Max 30 minutes
                    this.emit("auto_optimization_applied", {
                        type: "cache_ttl_increased",
                        newValue: this.options.cacheTTL,
                        reason: "Very low cache hit rate detected",
                    });
                }
                break;

            case "timeout":
                const avgExecutionTime = this.getStats().averageExecutionTime;
                if (
                    avgExecutionTime > 0 &&
                    this.options.timeout < avgExecutionTime * 5
                ) {
                    // Increase timeout to 5x average execution time
                    this.options.timeout = Math.min(
                        avgExecutionTime * 5,
                        120000
                    ); // Max 2 minutes
                    this.emit("auto_optimization_applied", {
                        type: "timeout_increased",
                        newValue: this.options.timeout,
                        reason: "Timeout too close to average execution time",
                    });
                }
                break;

            case "memory":
                const memoryStats =
                    this.performanceMonitor.getPerformanceTrends();
                if (memoryStats.length > 0) {
                    const latestMemory =
                        memoryStats[memoryStats.length - 1].memoryUsage;
                    if (latestMemory > this.options.maxMemoryUsage * 0.8) {
                        // Increase memory limit by 25%
                        this.options.maxMemoryUsage = Math.min(
                            this.options.maxMemoryUsage * 1.25,
                            500 * 1024 * 1024
                        ); // Max 500MB
                        this.emit("auto_optimization_applied", {
                            type: "memory_limit_increased",
                            newValue: this.options.maxMemoryUsage,
                            reason: "High memory usage detected",
                        });
                    }
                }
                break;
        }
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
     * Smart Actions and Analytics Methods
     */

    public getAnalyticsData() {
        return this.performanceMonitor.getAnalyticsData();
    }

    public getOptimizationSuggestions() {
        return this.performanceMonitor.getOptimizationSuggestions();
    }

    public getPerformanceTrends() {
        return this.performanceMonitor.getPerformanceTrends();
    }

    public warmCache(): void {
        if (this.options.smartCaching) {
            this.performanceMonitor.warmCache();
            this.emit("cache_warmed");
        }
    }

    public handleMemoryPressure(level: "low" | "medium" | "high"): void {
        if (this.options.memoryPressureHandling) {
            this.performanceMonitor.handleMemoryPressure(level);
            this.emit("memory_pressure_handled", { level });
        }
    }

    public detectAnomalies() {
        if (this.options.anomalyDetection) {
            const auditLog = this.performanceMonitor.getAuditLog();
            const latestEntry = auditLog[auditLog.length - 1];
            if (latestEntry) {
                return this.performanceMonitor.detectAnomalies(latestEntry);
            }
        }
        return [];
    }

    public getDetailedMetrics() {
        if (!this.options.detailedMetrics) return null;

        return {
            stats: this.getStats(),
            cacheStats: this.getCacheStats(),
            analytics: this.getAnalyticsData(),
            suggestions: this.getOptimizationSuggestions(),
            trends: this.getPerformanceTrends(),
            anomalies: this.detectAnomalies(),
        };
    }

    /**
     * Destroy the fortified function and clean up resources
     */
    public destroy(): void {
        if (this.isDestroyed) return;

        // Clean up all active executions
        this.executionEngine.cleanupAllExecutions();

        // Enhanced cleanup with smart components
        this.performanceMonitor.destroy();

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

