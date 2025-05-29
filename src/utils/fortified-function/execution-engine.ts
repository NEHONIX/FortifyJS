/**
 * FortifyJS - Fortified Function Execution Engine
 * Handles secure function execution with retry logic and error handling
 */

import { EventEmitter } from "events";
import { SecureExecutionContext, FortifiedFunctionOptions } from "./types";
import { SecurityHandler } from "./security-handler";
import { PerformanceMonitor } from "./performance-monitor";

export class ExecutionEngine extends EventEmitter {
    private readonly securityHandler: SecurityHandler;
    private readonly performanceMonitor: PerformanceMonitor;
    private readonly activeExecutions = new Map<string, SecureExecutionContext>();

    constructor(
        securityHandler: SecurityHandler,
        performanceMonitor: PerformanceMonitor
    ) {
        super();
        this.securityHandler = securityHandler;
        this.performanceMonitor = performanceMonitor;
    }

    /**
     * Create secure execution context
     */
    public async createSecureExecutionContext<T extends any[]>(
        args: T,
        options: Required<FortifiedFunctionOptions>
    ): Promise<SecureExecutionContext> {
        const executionId = this.securityHandler.generateExecutionId();
        const startTime = performance.now();
        const memorySnapshot = this.getCurrentMemoryUsage();
        
        const context: SecureExecutionContext = {
            executionId,
            encryptedParameters: new Map(),
            secureBuffers: new Map(),
            startTime,
            memorySnapshot,
            auditEntry: {
                timestamp: new Date(),
                executionId,
                parametersHash: await this.securityHandler.hashParameters(args),
                executionTime: 0,
                memoryUsage: memorySnapshot,
                success: false,
                securityFlags: []
            }
        };

        // Encrypt sensitive parameters if enabled
        if (options.autoEncrypt) {
            await this.securityHandler.encryptParameters(context, args, options);
            this.performanceMonitor.incrementSecurityEvents();
        }

        this.activeExecutions.set(executionId, context);
        this.emit('context_created', { executionId });
        
        return context;
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

        // Set up timeout
        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => {
                reject(new Error(`Function execution timeout after ${options.timeout}ms`));
            }, options.timeout);
        });

        // Execute with retry logic
        let lastError: Error | null = null;
        for (let attempt = 0; attempt <= options.retries; attempt++) {
            try {
                const executionPromise = this.executeWithStackProtection(fn, args, options);
                const result = await Promise.race([executionPromise, timeoutPromise]);
                
                this.emit('execution_success', { executionId, attempt });
                return result;
                
            } catch (error) {
                lastError = error as Error;
                this.emit('execution_error', { executionId, attempt, error });
                
                if (attempt < options.retries) {
                    const delay = Math.min(1000 * Math.pow(2, attempt), options.maxRetryDelay);
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
                error.stack = this.securityHandler.sanitizeStackTrace(error.stack);
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
            context.auditEntry.securityFlags.push('execution_error');
            
            this.emit('execution_failed', {
                executionId: context.executionId,
                error: error.message,
                memoryUsage: context.auditEntry.memoryUsage
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
    private scheduleCleanup(context: SecureExecutionContext, memoryWipeDelay: number): void {
        this.securityHandler.scheduleCleanup(
            context,
            memoryWipeDelay,
            (executionId) => {
                this.activeExecutions.delete(executionId);
                this.emit('context_cleaned', { executionId });
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
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
