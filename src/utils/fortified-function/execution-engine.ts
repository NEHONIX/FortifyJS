/**
 * FortifyJS - Fortified Function Execution Engine
 * Handles secure function execution with retry logic and error handling
 */

import { EventEmitter } from "events";
import { SecureExecutionContext, FortifiedFunctionOptions } from "./types";
import { SecurityHandler } from "./security-handler";
import { PerformanceMonitor } from "./performance-monitor";
import { createOptimalCache } from "../../integrations/express/cache/CacheFactory";
import { SecureCacheAdapter } from "../../integrations/express/cache/SecureCacheAdapter";
import { generateSafeCacheKey } from "./safe-serializer";

export class ExecutionEngine extends EventEmitter {
    private readonly securityHandler: SecurityHandler;
    private readonly performanceMonitor: PerformanceMonitor;
    private readonly activeExecutions = new Map<
        string,
        SecureExecutionContext
    >();
    private ultraFastCache?: SecureCacheAdapter;
    private cacheInitialized = false;

    // **ULTRA-FAST OPTIMIZATION: Pre-allocated pools and caches**
    private readonly executionIdPool: string[] = [];
    private readonly contextPool: SecureExecutionContext[] = [];
    private readonly hashCache = new Map<string, string>();
    private readonly encryptionCache = new Map<string, string>();
    private executionCounter = 0;

    // **PERFORMANCE OPTIMIZATION: Disable heavy operations in fast mode**
    private fastMode = false;
    private securityLevel: "minimal" | "standard" | "maximum" = "standard";

    constructor(
        securityHandler: SecurityHandler,
        performanceMonitor: PerformanceMonitor
    ) {
        super();
        this.securityHandler = securityHandler;
        this.performanceMonitor = performanceMonitor;

        // Initialize  cache for function execution
        this.initializeUltraFastCache();

        // **ULTRA-FAST OPTIMIZATION: Pre-populate pools**
        this.prePopulatePools();
    }

    /**
     * **ULTRA-FAST OPTIMIZATION: Pre-populate object pools for zero-allocation execution**
     */
    private prePopulatePools(): void {
        // Pre-generate execution IDs
        for (let i = 0; i < 100; i++) {
            this.executionIdPool.push(
                `exec_${Date.now()}_${i}_${Math.random()
                    .toString(36)
                    .substr(2, 9)}`
            );
        }

        // Pre-allocate execution contexts
        for (let i = 0; i < 50; i++) {
            this.contextPool.push(this.createEmptyContext());
        }

        console.log(" Ultra-fast execution pools pre-populated");
    }

    /**
     * **ULTRA-FAST OPTIMIZATION: Create empty context for pooling**
     */
    private createEmptyContext(): SecureExecutionContext {
        return {
            executionId: "",
            encryptedParameters: new Map(),
            secureBuffers: new Map(),
            startTime: 0,
            memorySnapshot: 0,
            auditEntry: {
                timestamp: new Date(),
                executionId: "",
                parametersHash: "",
                executionTime: 0,
                memoryUsage: 0,
                success: false,
                securityFlags: [],
            },
        };
    }

    /**
     * **ULTRA-FAST OPTIMIZATION: Enable fast mode for maximum performance**
     */
    public enableFastMode(
        level: "minimal" | "standard" | "maximum" = "minimal"
    ): void {
        this.fastMode = true;
        this.securityLevel = level;
        console.log(`Ultra-fast mode enabled (security level: ${level})`);
    }

    /**
     * **ULTRA-FAST OPTIMIZATION: Get pooled execution ID**
     */
    private getPooledExecutionId(): string {
        if (this.executionIdPool.length > 0) {
            return this.executionIdPool.pop()!;
        }
        // Fallback to simple counter-based ID
        return `exec_${++this.executionCounter}`;
    }

    /**
     * **ULTRA-FAST OPTIMIZATION: Get pooled context**
     */
    private getPooledContext(): SecureExecutionContext {
        if (this.contextPool.length > 0) {
            const context = this.contextPool.pop()!;
            // Reset context
            context.executionId = this.getPooledExecutionId();
            context.startTime = performance.now();
            context.memorySnapshot = this.fastMode
                ? 0
                : this.getCurrentMemoryUsage();
            context.encryptedParameters.clear();
            context.secureBuffers.clear();
            context.auditEntry.timestamp = new Date();
            context.auditEntry.executionId = context.executionId;
            context.auditEntry.success = false;
            context.auditEntry.securityFlags.length = 0;
            return context;
        }
        // Fallback to new context
        return this.createEmptyContext();
    }

    /**
     * **ULTRA-FAST OPTIMIZATION: Return context to pool**
     */
    private returnContextToPool(context: SecureExecutionContext): void {
        if (this.contextPool.length < 50) {
            // Clean sensitive data before returning to pool
            context.encryptedParameters.clear();
            context.secureBuffers.clear();
            this.contextPool.push(context);
        }
    }

    /**
     * Initialize  cache for function execution optimization
     */
    private async initializeUltraFastCache(): Promise<void> {
        try {
            this.ultraFastCache = createOptimalCache({
                type: "memory",
                memory: {
                    maxSize: 50, // 50MB for function execution cache
                    algorithm: "lru",
                    evictionPolicy: "lru",
                },
                performance: {
                    batchSize: 50,
                    asyncWrite: true,
                    prefetchEnabled: true,
                },
                security: {
                    encryption: true,
                    accessMonitoring: true,
                },
                monitoring: {
                    enabled: true,
                    detailed: false, // Keep lightweight for performance
                },
            });

            await this.ultraFastCache.connect();
            this.cacheInitialized = true;

            // console.log(" execution cache initialized");
        } catch (error) {
            console.warn(
                "Failed to initialize  cache, continuing without cache:",
                error
            );
            this.cacheInitialized = false;
        }
    }

    /**
     * **ULTRA-FAST OPTIMIZATION: Create secure execution context with minimal overhead**
     */
    public async createSecureExecutionContext<T extends any[]>(
        args: T,
        options: Required<FortifiedFunctionOptions>
    ): Promise<SecureExecutionContext> {
        // **ULTRA-FAST: Use pooled context if available**
        const context = this.fastMode
            ? this.getPooledContext()
            : await this.createStandardContext(args, options);

        // **ULTRA-FAST: Skip expensive operations in fast mode**
        if (this.fastMode && this.securityLevel === "minimal") {
            // Minimal security - just basic context
            context.auditEntry.parametersHash =
                this.getCachedHash(args) || "fast_mode_hash";
        } else {
            // Standard security processing
            context.auditEntry.parametersHash =
                await this.securityHandler.hashParameters(args);

            // Encrypt sensitive parameters if enabled
            if (options.autoEncrypt) {
                await this.securityHandler.encryptParameters(
                    context,
                    args,
                    options
                );
                this.performanceMonitor.incrementSecurityEvents();
            }
        }

        this.activeExecutions.set(context.executionId, context);
        this.emit("context_created", { executionId: context.executionId });

        return context;
    }

    /**
     * **ULTRA-FAST OPTIMIZATION: Standard context creation (fallback)**
     */
    private async createStandardContext<T extends any[]>(
        args: T,
        options: Required<FortifiedFunctionOptions>
    ): Promise<SecureExecutionContext> {
        const executionId = this.securityHandler.generateExecutionId();
        const startTime = performance.now();
        const memorySnapshot = this.getCurrentMemoryUsage();

        return {
            executionId,
            encryptedParameters: new Map(),
            secureBuffers: new Map(),
            startTime,
            memorySnapshot,
            auditEntry: {
                timestamp: new Date(),
                executionId,
                parametersHash: "",
                executionTime: 0,
                memoryUsage: memorySnapshot,
                success: false,
                securityFlags: [],
            },
        };
    }

    /**
     * **ULTRA-FAST OPTIMIZATION: Get cached hash for arguments**
     */
    private getCachedHash<T extends any[]>(args: T): string | undefined {
        const key = generateSafeCacheKey(args, "hash");
        return this.hashCache.get(key);
    }

    /**
     * **ULTRA-FAST OPTIMIZATION: Cache hash for future use**
     */
    private setCachedHash<T extends any[]>(args: T, hash: string): void {
        const key = generateSafeCacheKey(args, "hash");
        if (this.hashCache.size < 1000) {
            // Limit cache size
            this.hashCache.set(key, hash);
        }
    }

    /**
     * Execute function with security monitoring and error handling
     */
    public async executeWithSecurity<T extends any[], R>(
        fn: (...args: T) => R | Promise<R>,
        context: SecureExecutionContext,
        args: T,
        options: Required<FortifiedFunctionOptions>
    ): Promise<R> {
        const { executionId } = context;

        //  cache lookup for function execution results
        if (this.cacheInitialized && this.ultraFastCache && options.memoize) {
            const cacheKey = await this.generateExecutionCacheKey(fn, args);
            const startCacheTime = performance.now();

            try {
                const cachedResult = await this.ultraFastCache.get(cacheKey);
                if (cachedResult !== null) {
                    const cacheTime = performance.now() - startCacheTime;

                    // Log  cache hits
                    if (cacheTime < 5) {
                        console.log(
                            ` EXECUTION CACHE HIT: ${cacheTime.toFixed(2)}ms`
                        );
                    }

                    this.emit("execution_cache_hit", {
                        executionId,
                        cacheKey: cacheKey.substring(0, 16) + "...",
                        cacheTime,
                    });

                    return cachedResult as R;
                }
            } catch (cacheError) {
                console.warn(
                    "Cache lookup failed, continuing with execution:",
                    cacheError
                );
            }
        }

        // Set up timeout
        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => {
                reject(
                    new Error(
                        `Function execution timeout after ${options.timeout}ms`
                    )
                );
            }, options.timeout);
        });

        // Execute with retry logic
        let lastError: Error | null = null;
        for (let attempt = 0; attempt <= options.retries; attempt++) {
            try {
                const executionPromise = this.executeWithStackProtection(
                    fn,
                    args,
                    options
                );
                const result = await Promise.race([
                    executionPromise,
                    timeoutPromise,
                ]);

                // Cache the successful result for  future access
                if (
                    this.cacheInitialized &&
                    this.ultraFastCache &&
                    options.memoize
                ) {
                    const cacheKey = await this.generateExecutionCacheKey(
                        fn,
                        args
                    );
                    await this.cacheExecutionResult(cacheKey, result, options);
                }

                this.emit("execution_success", { executionId, attempt });
                return result;
            } catch (error) {
                lastError = error as Error;
                this.emit("execution_error", { executionId, attempt, error });

                if (attempt < options.retries) {
                    const delay = Math.min(
                        1000 * Math.pow(2, attempt),
                        options.maxRetryDelay
                    );
                    await this.sleep(delay);
                }
            }
        }

        throw lastError;
    }

    /**
     * Execute function with stack trace protection
     */
    private async executeWithStackProtection<T extends any[], R>(
        fn: (...args: T) => R | Promise<R>,
        args: T,
        options: Required<FortifiedFunctionOptions>
    ): Promise<R> {
        if (!options.stackTraceProtection) {
            return await fn(...args);
        }

        try {
            return await fn(...args);
        } catch (error) {
            // Sanitize stack trace to remove sensitive parameter information
            if (error instanceof Error && error.stack) {
                error.stack = this.securityHandler.sanitizeStackTrace(
                    error.stack
                );
            }
            throw error;
        }
    }

    /**
     * Handle execution completion (success or failure)
     */
    public handleExecutionComplete(
        context: SecureExecutionContext,
        success: boolean,
        error?: Error,
        options?: Required<FortifiedFunctionOptions>
    ): void {
        // Update performance statistics
        this.performanceMonitor.updateStats(context, success);

        // Handle error case
        if (!success && error) {
            context.auditEntry.errorMessage = error.message;
            context.auditEntry.securityFlags.push("execution_error");

            this.emit("execution_failed", {
                executionId: context.executionId,
                error: error.message,
                memoryUsage: context.auditEntry.memoryUsage,
            });
        }

        // Add to audit log if enabled
        if (options?.auditLog) {
            this.performanceMonitor.addAuditEntry(context.auditEntry);
        }

        // Schedule cleanup
        this.scheduleCleanup(context, options?.memoryWipeDelay || 0);
    }

    /**
     * Schedule cleanup of execution context
     */
    private scheduleCleanup(
        context: SecureExecutionContext,
        memoryWipeDelay: number
    ): void {
        this.securityHandler.scheduleCleanup(
            context,
            memoryWipeDelay,
            (executionId) => {
                this.activeExecutions.delete(executionId);
                this.emit("context_cleaned", { executionId });
            }
        );
    }

    /**
     * Get active executions count
     */
    public getActiveExecutionsCount(): number {
        return this.activeExecutions.size;
    }

    /**
     * Clean up all active executions
     */
    public cleanupAllExecutions(): void {
        for (const context of this.activeExecutions.values()) {
            this.scheduleCleanup(context, 0);
        }
    }

    /**
     * Utility methods
     */
    private getCurrentMemoryUsage(): number {
        return process.memoryUsage?.()?.heapUsed || 0;
    }

    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    /**
     * Generate cache key for function execution
     */
    private async generateExecutionCacheKey<T extends any[]>(
        fn: (...args: T) => any,
        args: T
    ): Promise<string> {
        // Create a unique key based on function signature and arguments
        const fnString = fn.toString();
        const fnHash = await this.securityHandler.hashParameters([fnString]);
        const argsHash = await this.securityHandler.hashParameters(args);

        return `exec:${fnHash.substring(0, 16)}:${argsHash.substring(0, 16)}`;
    }

    /**
     * Cache execution result for  future access
     */
    private async cacheExecutionResult<R>(
        cacheKey: string,
        result: R,
        options: Required<FortifiedFunctionOptions>
    ): Promise<void> {
        if (!this.cacheInitialized || !this.ultraFastCache) return;

        try {
            const ttl = options.cacheTTL || 300000; // 5 minutes default
            await this.ultraFastCache.set(cacheKey, result, {
                ttl,
                tags: ["execution", "function-result"],
            });

            if (options.debugMode) {
                console.log(
                    `Cached execution result: ${cacheKey.substring(
                        0,
                        16
                    )}... (TTL: ${ttl}ms)`
                );
            }
        } catch (error) {
            console.warn("Failed to cache execution result:", error);
        }
    }

    /**
     * Get  cache statistics
     */
    public async getUltraFastCacheStats(): Promise<any> {
        if (!this.cacheInitialized || !this.ultraFastCache) {
            return {
                enabled: false,
                message: "Cache not initialized",
            };
        }

        try {
            const stats = await this.ultraFastCache.getStats();
            return {
                enabled: true,
                memory: stats.memory,
                performance: stats.performance,
                hitRate: stats.memory.hitRate,
                operations: stats.performance.totalOperations,
            };
        } catch (error: any) {
            return { enabled: false, error: error.message };
        }
    }

    /**
     * Clear  execution cache
     */
    public async clearUltraFastCache(): Promise<void> {
        if (this.cacheInitialized && this.ultraFastCache) {
            try {
                await this.ultraFastCache.clear();
                console.log("Execution cache cleared");
            } catch (error) {
                console.warn("Failed to clear  cache:", error);
            }
        }
    }

    /**
     * Destroy  cache on cleanup
     */
    public async destroy(): Promise<void> {
        if (this.cacheInitialized && this.ultraFastCache) {
            try {
                await this.ultraFastCache.disconnect();
                console.log(" execution cache disconnected");
            } catch (error) {
                console.warn("Error disconnecting  cache:", error);
            }
        }
    }

    /**
     * **ULTRA-FAST OPTIMIZATION: Generate fast cache key without hashing**
     */
    private generateFastCacheKey<T extends any[]>(args: T): string {
        // Safe string-based key for maximum speed
        return generateSafeCacheKey(args, "fast");
    }

    /**
     * **ULTRA-FAST OPTIMIZATION: Execute with minimal overhead**
     */
    public async executeUltraFast<T extends any[], R>(
        fn: (...args: T) => R | Promise<R>,
        args: T,
        options: Required<FortifiedFunctionOptions>
    ): Promise<R> {
        // **ULTRA-FAST: Skip all security and monitoring for maximum speed**
        if (this.fastMode && this.securityLevel === "minimal") {
            return await fn(...args);
        }

        // **FAST: Minimal cache check**
        if (options.memoize && this.ultraFastCache) {
            const cacheKey = this.generateFastCacheKey(args);
            try {
                const cached = await this.ultraFastCache.get(cacheKey);
                if (cached !== null) return cached as R;
            } catch {
                // Ignore cache errors in fast mode
            }
        }

        // Execute function
        const result = await fn(...args);

        // **FAST: Minimal cache store**
        if (options.memoize && this.ultraFastCache) {
            const cacheKey = this.generateFastCacheKey(args);
            try {
                await this.ultraFastCache.set(cacheKey, result, {
                    ttl: options.cacheTTL || 300000,
                });
            } catch {
                // Ignore cache errors in fast mode
            }
        }

        return result;
    }

    /**
     * **ULTRA-FAST OPTIMIZATION: Get performance mode info**
     */
    public getPerformanceMode(): {
        fastMode: boolean;
        securityLevel: string;
        poolSizes: any;
    } {
        return {
            fastMode: this.fastMode,
            securityLevel: this.securityLevel,
            poolSizes: {
                executionIds: this.executionIdPool.length,
                contexts: this.contextPool.length,
                hashCache: this.hashCache.size,
                encryptionCache: this.encryptionCache.size,
            },
        };
    }
}

