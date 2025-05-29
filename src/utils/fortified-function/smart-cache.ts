/**
 * FortifyJS - Smart Cache System
 * Advanced caching with LRU, LFU, adaptive strategies and intelligent management
 */

import { CacheEntry, SmartCacheConfig, PerformanceMetrics } from "./types";
import { memoryManager } from "../memory";

export class SmartCache<K = string, V = any> {
    private cache = new Map<K, CacheEntry<V>>();
    private accessOrder: K[] = [];
    private frequencyMap = new Map<K, number>();
    private config: SmartCacheConfig;
    private cleanupInterval?: NodeJS.Timeout;
    private stats = {
        hits: 0,
        misses: 0,
        evictions: 0,
        totalSize: 0,
        compressionRatio: 0,
    };

    constructor(config: Partial<SmartCacheConfig> = {}) {
        this.config = {
            strategy: "adaptive",
            maxSize: 1000,
            ttl: 300000, // 5 minutes
            autoCleanup: true,
            compressionEnabled: false,
            persistToDisk: false,
            ...config,
        };

        if (this.config.autoCleanup) {
            this.setupAutoCleanup();
        }
    }

    /**
     * Get value from cache with smart access tracking
     */
    public get(key: K): V | null {
        const entry = this.cache.get(key);

        if (!entry) {
            this.stats.misses++;
            return null;
        }

        // Check TTL expiration
        if (this.isExpired(entry)) {
            this.delete(key);
            this.stats.misses++;
            return null;
        }

        // Update access patterns
        this.updateAccessPattern(key, entry);
        this.stats.hits++;

        return entry.result;
    }

    /**
     * Set value in cache with intelligent eviction
     */
    public set(key: K, value: V, ttl?: number): void {
        // Check if we need to evict entries
        if (this.cache.size >= this.config.maxSize) {
            this.evictEntries();
        }

        const entry: CacheEntry<V> = {
            result: value,
            timestamp: Date.now(),
            accessCount: 1,
            lastAccessed: new Date(),
            ttl: ttl || this.config.ttl,
            priority: this.calculatePriority(key, value),
            size: this.estimateSize(value),
            frequency: 1,
        };

        this.cache.set(key, entry);
        this.updateFrequency(key);
        this.updateAccessOrder(key);
        this.updateStats();
    }

    /**
     * Delete entry from cache
     */
    public delete(key: K): boolean {
        const deleted = this.cache.delete(key);
        if (deleted) {
            this.removeFromAccessOrder(key);
            this.frequencyMap.delete(key);
            this.updateStats();
        }
        return deleted;
    }

    /**
     * Clear all cache entries
     */
    public clear(): void {
        this.cache.clear();
        this.accessOrder = [];
        this.frequencyMap.clear();
        this.updateStats();
    }

    /**
     * Get cache statistics
     */
    public getStats() {
        const hitRate =
            this.stats.hits / (this.stats.hits + this.stats.misses) || 0;
        return {
            ...this.stats,
            hitRate,
            size: this.cache.size,
            maxSize: this.config.maxSize,
            strategy: this.config.strategy,
            averageAccessCount: this.getAverageAccessCount(),
            memoryUsage: this.estimateMemoryUsage(),
        };
    }

    /**
     * Intelligent cache warming based on patterns
     */
    public warmCache(
        patterns: Array<{ key: K; value: V; priority: number }>
    ): void {
        // Sort by priority and warm most important entries first
        patterns
            .sort((a, b) => b.priority - a.priority)
            .slice(0, Math.floor(this.config.maxSize * 0.3)) // Warm up to 30% of cache
            .forEach(({ key, value }) => {
                this.set(key, value);
            });
    }

    /**
     * Predictive cache preloading
     */
    public preloadPredictedEntries(
        predictions: Array<{ key: K; probability: number }>
    ): void {
        const highProbabilityPredictions = predictions
            .filter((p) => p.probability > 0.7)
            .slice(0, Math.floor(this.config.maxSize * 0.1)); // Preload up to 10% of cache

        // This would typically trigger async loading of predicted entries
        // For now, we mark them as high priority for future caching
        highProbabilityPredictions.forEach(({ key }) => {
            // Mark for priority caching when the value becomes available
            this.markForPriorityCache(key);
        });
    }

    /**
     * Adaptive strategy adjustment based on performance
     */
    public adaptStrategy(metrics: PerformanceMetrics): void {
        if (this.config.strategy !== "adaptive") return;

        const hitRate =
            this.stats.hits / (this.stats.hits + this.stats.misses) || 0;

        if (hitRate < 0.3) {
            // Low hit rate, switch to LFU to keep frequently used items
            this.config.strategy = "lfu";
        } else if (hitRate > 0.8 && metrics.memoryUsage > 0.8) {
            // High hit rate but memory pressure, switch to LRU for better memory management
            this.config.strategy = "lru";
        } else {
            // Balanced performance, use adaptive strategy
            this.config.strategy = "adaptive";
        }
    }

    /**
     * Memory pressure handling
     */
    public handleMemoryPressure(
        pressureLevel: "low" | "medium" | "high"
    ): void {
        switch (pressureLevel) {
            case "high":
                // Aggressive cleanup - remove 50% of cache
                this.evictEntries(Math.floor(this.cache.size * 0.5));
                break;
            case "medium":
                // Moderate cleanup - remove 25% of cache
                this.evictEntries(Math.floor(this.cache.size * 0.25));
                break;
            case "low":
                // Light cleanup - remove expired entries only
                this.cleanupExpiredEntries();
                break;
        }
    }

    /**
     * Private helper methods
     */
    private isExpired(entry: CacheEntry<V>): boolean {
        if (!entry.ttl) return false;
        return Date.now() - entry.timestamp > entry.ttl;
    }

    private updateAccessPattern(key: K, entry: CacheEntry<V>): void {
        entry.accessCount++;
        entry.lastAccessed = new Date();
        this.updateFrequency(key);
        this.updateAccessOrder(key);
    }

    private updateFrequency(key: K): void {
        const current = this.frequencyMap.get(key) || 0;
        this.frequencyMap.set(key, current + 1);
    }

    private updateAccessOrder(key: K): void {
        // Remove from current position and add to end (most recent)
        this.removeFromAccessOrder(key);
        this.accessOrder.push(key);
    }

    private removeFromAccessOrder(key: K): void {
        const index = this.accessOrder.indexOf(key);
        if (index > -1) {
            this.accessOrder.splice(index, 1);
        }
    }

    private calculatePriority(key: K, value: V): number {
        // Calculate priority based on various factors
        const frequency = this.frequencyMap.get(key) || 0;
        const size = this.estimateSize(value);
        const recency = 1; // New entries get base recency score

        // Higher frequency and recency increase priority, larger size decreases it
        return (
            ((frequency * 0.4 + recency * 0.4) / Math.max(size / 1000, 1)) * 0.2
        );
    }

    private estimateSize(value: V): number {
        try {
            return JSON.stringify(value).length * 2; // Rough estimate
        } catch {
            return 1000; // Default size for non-serializable objects
        }
    }

    private evictEntries(count?: number): void {
        const entriesToEvict =
            count || Math.max(1, Math.floor(this.config.maxSize * 0.1));

        switch (this.config.strategy) {
            case "lru":
                this.evictLRU(entriesToEvict);
                break;
            case "lfu":
                this.evictLFU(entriesToEvict);
                break;
            case "adaptive":
                this.evictAdaptive(entriesToEvict);
                break;
        }

        this.stats.evictions += entriesToEvict;
    }

    private evictLRU(count: number): void {
        // Remove least recently used entries
        const toRemove = this.accessOrder.slice(0, count);
        toRemove.forEach((key) => this.delete(key));
    }

    private evictLFU(count: number): void {
        // Remove least frequently used entries
        const entries = Array.from(this.cache.entries())
            .sort((a, b) => (a[1].frequency || 0) - (b[1].frequency || 0))
            .slice(0, count);

        entries.forEach(([key]) => this.delete(key));
    }

    private evictAdaptive(count: number): void {
        // Adaptive eviction based on priority score
        const entries = Array.from(this.cache.entries())
            .sort((a, b) => (a[1].priority || 0) - (b[1].priority || 0))
            .slice(0, count);

        entries.forEach(([key]) => this.delete(key));
    }

    private cleanupExpiredEntries(): void {
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (this.isExpired(entry)) {
                this.delete(key);
            }
        }
    }

    private setupAutoCleanup(): void {
        this.cleanupInterval = setInterval(() => {
            this.cleanupExpiredEntries();

            // Adaptive cleanup based on memory pressure
            const memoryStats = memoryManager.getStats();
            const memoryPressure = memoryStats.pressure; // 0-1 scale
            if (memoryPressure > 0.8) {
                this.handleMemoryPressure("high");
            } else if (memoryPressure > 0.6) {
                this.handleMemoryPressure("medium");
            }
        }, 60000); // Check every minute
    }

    private updateStats(): void {
        this.stats.totalSize = this.cache.size;
    }

    private getAverageAccessCount(): number {
        if (this.cache.size === 0) return 0;
        const total = Array.from(this.cache.values()).reduce(
            (sum, entry) => sum + entry.accessCount,
            0
        );
        return total / this.cache.size;
    }

    private estimateMemoryUsage(): number {
        return Array.from(this.cache.values()).reduce(
            (total, entry) => total + (entry.size || 0),
            0
        );
    }

    private markForPriorityCache(key: K): void {
        // Implementation for marking entries for priority caching
        // This could be used by predictive systems
    }

    /**
     * Cleanup resources
     */
    public destroy(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        this.clear();
    }
}

