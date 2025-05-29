/**
 * FortifyJS - Fortified Function Performance Monitor
 * Handles performance tracking and statistics
 */

import { FunctionStats, SecureExecutionContext, AuditEntry, CacheEntry } from "./types";

export class PerformanceMonitor {
    private readonly stats: FunctionStats;
    private readonly auditLog: AuditEntry[] = [];
    private readonly memoCache = new Map<string, CacheEntry<any>>();

    constructor() {
        this.stats = {
            executionCount: 0,
            totalExecutionTime: 0,
            averageExecutionTime: 0,
            memoryUsage: 0,
            cacheHits: 0,
            cacheMisses: 0,
            errorCount: 0,
            lastExecuted: new Date(),
            securityEvents: 0
        };
    }

    /**
     * Update execution statistics
     */
    public updateStats(context: SecureExecutionContext, success: boolean): void {
        const executionTime = performance.now() - context.startTime;
        
        this.stats.executionCount++;
        this.stats.totalExecutionTime += executionTime;
        this.stats.averageExecutionTime = this.stats.totalExecutionTime / this.stats.executionCount;
        this.stats.lastExecuted = new Date();
        this.stats.memoryUsage = this.getCurrentMemoryUsage();
        
        if (!success) {
            this.stats.errorCount++;
        }

        // Update audit entry
        context.auditEntry.executionTime = executionTime;
        context.auditEntry.success = success;
        context.auditEntry.memoryUsage = this.stats.memoryUsage;
    }

    /**
     * Add entry to audit log
     */
    public addAuditEntry(entry: AuditEntry): void {
        this.auditLog.push(entry);
        
        // Limit audit log size
        if (this.auditLog.length > 1000) {
            this.auditLog.splice(0, 100);
        }
    }

    /**
     * Increment security events counter
     */
    public incrementSecurityEvents(): void {
        this.stats.securityEvents++;
    }

    /**
     * Record cache hit
     */
    public recordCacheHit(): void {
        this.stats.cacheHits++;
    }

    /**
     * Record cache miss
     */
    public recordCacheMiss(): void {
        this.stats.cacheMisses++;
    }

    /**
     * Get cached result
     */
    public getCachedResult<R>(key: string): R | null {
        const entry = this.memoCache.get(key);
        if (entry) {
            entry.accessCount++;
            entry.lastAccessed = new Date();
            return entry.result;
        }
        return null;
    }

    /**
     * Cache result
     */
    public cacheResult<R>(key: string, result: R): void {
        this.memoCache.set(key, {
            result,
            timestamp: Date.now(),
            accessCount: 1,
            lastAccessed: new Date()
        });
    }

    /**
     * Clear cache
     */
    public clearCache(): void {
        this.memoCache.clear();
    }

    /**
     * Clean up old cache entries
     */
    public cleanupOldCacheEntries(maxAge: number = 300000): void {
        const now = Date.now();
        for (const [key, entry] of this.memoCache.entries()) {
            if (now - entry.timestamp > maxAge) {
                this.memoCache.delete(key);
            }
        }
    }

    /**
     * Get current statistics
     */
    public getStats(): FunctionStats {
        return { ...this.stats };
    }

    /**
     * Get audit log
     */
    public getAuditLog(): AuditEntry[] {
        return [...this.auditLog];
    }

    /**
     * Clear audit log
     */
    public clearAuditLog(): void {
        this.auditLog.length = 0;
    }

    /**
     * Get current memory usage
     */
    private getCurrentMemoryUsage(): number {
        return process.memoryUsage?.()?.heapUsed || 0;
    }

    /**
     * Get cache statistics
     */
    public getCacheStats() {
        return {
            size: this.memoCache.size,
            hitRate: this.stats.cacheHits / (this.stats.cacheHits + this.stats.cacheMisses) || 0,
            totalHits: this.stats.cacheHits,
            totalMisses: this.stats.cacheMisses
        };
    }
}
