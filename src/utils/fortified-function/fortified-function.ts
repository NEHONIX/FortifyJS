/**
 * FortifyJS - Fortified Function Main Class
 * Revolutionary secure function wrapper using modular architecture
 */

import { EventEmitter } from "events";
import {
    FortifiedFunctionOptions,
    FunctionStats,
    AuditEntry,
    TimingStats,
} from "./types";
import { SecurityHandler } from "./security-handler";
import { PerformanceMonitor } from "./performance-monitor";
import { ExecutionEngine } from "./execution-engine";
import { PerformanceTimer } from "./performance-timer";
import { debugLog, generateSafeCacheKey } from "./safe-serializer";

/**
 * Fortified Function - Secure function wrapper using existing FortifyJS components
 */
export class FortifiedFunction<T extends any[], R> extends EventEmitter {
    private readonly originalFunction: (...args: T) => R | Promise<R>;
    private readonly options: Required<FortifiedFunctionOptions>;
    private readonly securityHandler: SecurityHandler;
    private readonly performanceMonitor: PerformanceMonitor;
    private readonly executionEngine: ExecutionEngine;
    private performanceTimer: PerformanceTimer | null = null;
    private isDestroyed = false;
    private cleanupInterval?: NodeJS.Timeout;

    constructor(
        fn: (...args: T) => R | Promise<R>,
        options: FortifiedFunctionOptions = {}
    ) {
        super();

        this.originalFunction = fn;

        // Optimal defaults for production use - balanced performance, security, and usability
        this.options = {
            // Performance Mode - Explicit opt-in for ultra-fast mode
            ultraFast: "maximum",

            // Security - Safe defaults for production
            autoEncrypt: false, // Explicit opt-in for encryption to avoid performance overhead
            secureParameters: [],
            memoryWipeDelay: 0,
            stackTraceProtection: true, // Essential for debugging
            smartSecurity: false, // Disable advanced security by default for performance
            threatDetection: false, // Disable by default, enable for high-security environments

            // Performance - Balanced defaults optimized for typical use cases
            memoize: true, // Enable caching for performance
            timeout: 30000, // 30 seconds - reasonable for most operations
            retries: 2, // Reasonable retry count
            maxRetryDelay: 5000, // 5 seconds max retry delay
            smartCaching: true, // Enable intelligent caching
            cacheStrategy: "adaptive", // Adaptive strategy for best performance
            cacheTTL: 300000, // 5 minutes - balanced TTL
            maxCacheSize: 1000, // Reasonable cache size
            precompile: false,
            optimizeExecution: true, // Enable basic optimizations

            // Smart Actions - Conservative defaults for stability
            autoTuning: false, // Disable auto-tuning by default for predictable behavior
            predictiveAnalytics: false, // Disable by default to reduce overhead
            adaptiveTimeout: false, // Use fixed timeouts by default
            intelligentRetry: true, // Enable smart retry logic
            anomalyDetection: false, // Disable by default, enable for monitoring environments
            performanceRegression: false, // Disable by default to reduce overhead

            // Monitoring - Essential tracking enabled for production insights
            auditLog: true, // Essential for production debugging and compliance
            performanceTracking: true, // Essential for performance monitoring
            debugMode: false, // Disabled in production
            detailedMetrics: false, // Disabled by default to reduce overhead

            // Memory Management - Conservative defaults
            memoryPool: true, // Enable object pooling for performance
            maxMemoryUsage: 100 * 1024 * 1024, // 100MB - conservative limit
            autoCleanup: true, // Enable automatic cleanup
            smartMemoryManagement: false, // Disable advanced memory management by default
            memoryPressureHandling: false, // Disable by default

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

        // **ULTRA-FAST OPTIMIZATION: Enable fast mode if performance is prioritized**
        if (options.ultraFast || options.performanceTracking === false) {
            this.executionEngine.enableFastMode(
                options.ultraFast === "minimal"
                    ? "minimal"
                    : options.ultraFast === "maximum"
                    ? "maximum"
                    : "standard"
            );
        }

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

        // **ULTRA-FAST BYPASS: Skip all overhead for maximum performance**
        if (this.options.ultraFast === "minimal") {
            return await this.executeUltraFast(...args);
        }

        // Initialize performance timer for this execution
        this.initializePerformanceTimer();

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
                    debugLog("Args", args);
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
                    debugLog("Result", result);
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
     * **ULTRA-FAST EXECUTION: Bypass all overhead for maximum performance**
     */
    private async executeUltraFast(...args: T): Promise<R> {
        // **ULTRA-FAST: Direct execution with minimal cache check**
        if (this.options.memoize) {
            // Safe cache key generation that handles cyclic structures
            const cacheKey = generateSafeCacheKey(args, "ultrafast");
            const cached = this.performanceMonitor.getCachedResult<R>(cacheKey);

            if (cached !== null) {
                return cached;
            }

            // Execute function directly
            const result = await this.originalFunction(...args);

            // Simple cache store
            this.performanceMonitor.cacheResult(
                cacheKey,
                result,
                this.options.cacheTTL
            );

            return result;
        }

        // **ULTRA-FAST: Direct execution without any overhead**
        return await this.originalFunction(...args);
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
        const stats = this.performanceMonitor.getStats();

        // Include timing data if available
        if (this.performanceTimer) {
            stats.timingStats = this.performanceTimer.getStats();
        }

        return stats;
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

        // Clear timing data
        if (this.performanceTimer) {
            this.performanceTimer.clear();
            this.performanceTimer = null;
        }

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

    /**
     * Update function options dynamically
     * @param newOptions - Partial options to update
     */
    public updateOptions(newOptions: Partial<FortifiedFunctionOptions>): void {
        if (this.isDestroyed) {
            throw new Error(
                "Cannot update options on destroyed fortified function"
            );
        }

        // Store previous options for comparison
        const previousOptions = { ...this.options };

        // Merge new options with existing ones
        Object.assign(this.options, newOptions);

        // Handle ultra-fast mode changes
        if (
            newOptions.ultraFast !== undefined &&
            newOptions.ultraFast !== previousOptions.ultraFast
        ) {
            if (newOptions.ultraFast) {
                this.executionEngine.enableFastMode(
                    newOptions.ultraFast === "minimal"
                        ? "minimal"
                        : newOptions.ultraFast === "maximum"
                        ? "maximum"
                        : "standard"
                );
            }
        }

        // Handle cache configuration changes
        if (
            newOptions.smartCaching !== undefined ||
            newOptions.maxCacheSize !== undefined ||
            newOptions.cacheTTL !== undefined ||
            newOptions.cacheStrategy !== undefined
        ) {
            // Clear existing cache when configuration changes
            this.performanceMonitor.clearCache();

            // Log cache configuration update
            console.log("Cache configuration updated:", {
                smartCaching: this.options.smartCaching,
                maxCacheSize: this.options.maxCacheSize,
                cacheTTL: this.options.cacheTTL,
                cacheStrategy: this.options.cacheStrategy,
            });
        }

        // Handle cleanup interval changes
        if (newOptions.autoCleanup !== undefined) {
            if (newOptions.autoCleanup && !previousOptions.autoCleanup) {
                // Start cleanup if it wasn't running
                this.setupAutoCleanup();
            } else if (!newOptions.autoCleanup && previousOptions.autoCleanup) {
                // Stop cleanup if it was running
                if (this.cleanupInterval) {
                    clearInterval(this.cleanupInterval);
                    this.cleanupInterval = undefined;
                }
            }
        }

        // Emit options updated event
        this.emit("options_updated", {
            previousOptions,
            newOptions: this.options,
            changedKeys: Object.keys(newOptions),
        });
    }

    /**
     * Optimize performance by applying recommended settings
     */
    public optimizePerformance(): void {
        if (this.isDestroyed) {
            throw new Error("Cannot optimize destroyed fortified function");
        }

        // Get current performance suggestions
        const suggestions = this.getOptimizationSuggestions();
        const stats = this.getStats();

        // Apply performance optimizations
        const optimizations: Partial<FortifiedFunctionOptions> = {};

        // Enable ultra-fast mode if not already enabled
        if (!this.options.ultraFast) {
            optimizations.ultraFast = "minimal";
        }

        // Optimize cache settings based on usage
        if (stats.executionCount > 10) {
            const cacheStats = this.getCacheStats();

            if (cacheStats.hitRate < 0.5) {
                // Increase cache size if hit rate is low
                optimizations.maxCacheSize = Math.min(
                    this.options.maxCacheSize * 1.5,
                    5000
                );
                optimizations.cacheTTL = Math.min(
                    this.options.cacheTTL * 1.2,
                    600000
                ); // Max 10 minutes
            }
        }

        // Optimize timeout based on average execution time
        if (stats.averageExecutionTime > 0) {
            const optimalTimeout = Math.max(
                stats.averageExecutionTime * 3,
                5000
            ); // At least 5 seconds
            if (optimalTimeout < this.options.timeout) {
                optimizations.timeout = optimalTimeout;
            }
        }

        // Disable heavy features for better performance
        optimizations.detailedMetrics = false;
        optimizations.anomalyDetection = false;
        optimizations.predictiveAnalytics = false;
        optimizations.autoTuning = false;

        // Apply optimizations
        if (Object.keys(optimizations).length > 0) {
            this.updateOptions(optimizations);

            this.emit("performance_optimized", {
                appliedOptimizations: optimizations,
                suggestions: suggestions.length,
                executionCount: stats.executionCount,
            });

            console.log("Performance optimizations applied:", optimizations);
        } else {
            console.log(
                "No performance optimizations needed - already optimized"
            );
        }
    }

    /**
     * **PERFORMANCE TIMING METHODS**
     */

    /**
     * Initialize performance timer for current execution
     */
    private initializePerformanceTimer(): void {
        if (!this.performanceTimer) {
            const executionId = `exec_${Date.now()}_${Math.random()
                .toString(36)
                .substring(2, 11)}`;
            const ultraFastMode = this.options.ultraFast === "minimal";
            this.performanceTimer = new PerformanceTimer(
                executionId,
                ultraFastMode
            );
        }
    }

    /**
     * Start timing a specific operation
     */
    public startTimer(label: string, metadata?: Record<string, any>): void {
        this.initializePerformanceTimer();
        this.performanceTimer!.startTimer(label, metadata);
    }

    /**
     * End timing for a specific operation
     */
    public endTimer(
        label: string,
        additionalMetadata?: Record<string, any>
    ): number {
        if (!this.performanceTimer) {
            console.warn(
                "Performance timer not initialized. Call startTimer first."
            );
            return 0;
        }
        return this.performanceTimer.endTimer(label, additionalMetadata);
    }

    /**
     * Measure delay between two points
     */
    public measureDelay(startPoint: string, endPoint: string): number {
        if (!this.performanceTimer) {
            console.warn("Performance timer not initialized.");
            return 0;
        }
        return this.performanceTimer.measureDelay(startPoint, endPoint);
    }

    /**
     * Time a function execution
     */
    public async timeFunction<U>(
        label: string,
        fn: () => U | Promise<U>,
        metadata?: Record<string, any>
    ): Promise<{ result: U; duration: number }> {
        this.initializePerformanceTimer();
        return await this.performanceTimer!.timeFunction(label, fn, metadata);
    }

    /**
     * Get timing statistics
     */
    public getTimingStats(): TimingStats {
        if (!this.performanceTimer) {
            return {
                totalMeasurements: 0,
                completedMeasurements: 0,
                activeMeasurements: 0,
                measurements: [],
                summary: {
                    totalDuration: 0,
                    averageDuration: 0,
                    minDuration: 0,
                    maxDuration: 0,
                    slowestOperation: "",
                    fastestOperation: "",
                },
            };
        }
        return this.performanceTimer.getStats();
    }

    /**
     * Clear all timing measurements
     */
    public clearTimings(): void {
        if (this.performanceTimer) {
            this.performanceTimer.clear();
        }
    }

    /**
     * Get measurements by pattern
     */
    public getMeasurementsByPattern(pattern: RegExp): any[] {
        if (!this.performanceTimer) {
            return [];
        }
        return this.performanceTimer.getMeasurementsByPattern(pattern);
    }

    /**
     * Check if a timer is active
     */
    public isTimerActive(label: string): boolean {
        if (!this.performanceTimer) {
            return false;
        }
        return this.performanceTimer.isTimerActive(label);
    }

    /**
     * Get active timers
     */
    public getActiveTimers(): string[] {
        if (!this.performanceTimer) {
            return [];
        }
        return this.performanceTimer.getActiveTimers();
    }
}
