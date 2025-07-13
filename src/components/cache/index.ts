/***************************************************************************
 * FortifyJS - Secure Array Types
 *
 * This file contains type definitions for the SecureArray modular architecture
 *
 * @author Nehonix
 * @license MIT
 *
 * Copyright (c) 2025 Nehonix. All rights reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 ***************************************************************************** */

import path from "path";

// FortifyJS Core imports
import { Hash } from "../../core";

// Type definitions
import {
    CachedData,
    CacheStats,
    CacheOptions,
    FileCacheOptions,
    FileCacheStats,
    FileCacheMetadata,
    FileCacheCleanupOptions,
    FileCacheStrategy,
} from "./types/cache.type";

// UFSIMC type definitions
import {
    UltraStats,
    UltraCacheOptions,
    UltraMemoryCacheEntry,
} from "./types/UFSIMC.type";

// Cache implementation
import { SecureInMemoryCache } from "./useCache";
import { UltraFastSecureInMemoryCache } from "./UFSIMC";

// Configuration
import { DEFAULT_FILE_CACHE_CONFIG } from "./config/cache.config";
export {
    CONFIG as DEFAULT_CACHE_CONFIG,
    DEFAULT_FILE_CACHE_CONFIG,
} from "./config/cache.config";
import { FileCache } from "./cacheSys";

// Import SecureCacheAdapter type for FastCache implementation
import type { SecureCacheAdapter as SecureCacheAdapterType } from "../../integrations/express/cache/SecureCacheAdapter";

/**
 * @fileoverview FortifyJS Unified Cache System - Enterprise-Grade Caching Solution
 *
 * A comprehensive,  caching solution combining multiple strategies
 * with military-grade security and ultra-fast performance optimization.
 *
 * ## Cache Strategies
 * - **Memory Cache**: Ultra-fast in-process storage with LRU eviction
 * - **File Cache**: Persistent cross-process storage with real disk monitoring
 * - **Hybrid Cache**: Automatic optimization between memory and file storage
 * - **Redis Cache**: Distributed scalable storage (via integrations)
 *
 * ## Security Features
 * - AES-256-GCM encryption for all cached data
 * - PBKDF2 key derivation with automatic key rotation
 * - Tamper-evident storage with integrity verification
 * - Secure key management and access pattern monitoring
 * - Memory-safe operations with automatic cleanup
 *
 * ## Performance Features
 * - Zlib compression for large values (configurable threshold)
 * - LRU eviction with intelligent memory pressure management
 * - Real-time disk space monitoring and automatic cleanup
 * - Atomic file operations for data consistency
 * - Sub-millisecond cache hits with object pooling
 * - Configurable TTL with background expiration cleanup
 *
 * ## Production Features
 * - Comprehensive error handling with graceful degradation
 * - Real-time performance metrics and health monitoring
 * - Configurable naming strategies (flat, hierarchical, dated, direct)
 * - Cross-platform compatibility (Windows, macOS, Linux)
 * - Zero-dependency core with optional integrations
 * - TypeScript support with complete type definitions
 *
 * @example
 * ```typescript
 * // Quick start with default memory cache
 * import { Cache } from "fortify2-js";
 *
 * await Cache.set('user:123', { name: 'John', role: 'admin' }, { ttl: 3600000 });
 * const user = await Cache.get('user:123');
 *
 * // File-based persistent cache
 * import { FileCache } from "fortify2-js";
 *
 * const fileCache = new FileCache({
 *   directory: './cache',
 *   encrypt: true,
 *   compress: true,
 *   maxCacheSize: 1024 * 1024 * 100 // 100MB
 * });
 *
 * await fileCache.set('session:abc', sessionData, { ttl: 86400000 });
 *
 * // Hybrid cache for optimal performance
 * import { createOptimalCache } from "fortify2-js";
 *
 * const hybridCache = createOptimalCache({
 *   type: 'hybrid',
 *   config: { encrypt: true, compress: true }
 * });
 * ```
 *
 * @version 4.2.3
 * @author FortifyJS Team
 * @since 2024-12-19
 * @license MIT
 */

// ========================================
// MAIN CACHE EXPORTS
// ========================================

/**
 * Default secure in-memory cache instance
 *
 * Pre-configured singleton instance with optimal security settings for immediate use.
 * Features AES-256-GCM encryption, LRU eviction, and automatic memory management.
 *
 * @example
 * ```typescript
 * import { Cache } from "fortify2-js";
 *
 * // Store user session with 1-hour TTL
 * await Cache.set('session:user123', {
 *   userId: 123,
 *   permissions: ['read', 'write'],
 *   loginTime: Date.now()
 * }, { ttl: 3600000 });
 *
 * // Retrieve cached data
 * const session = await Cache.get('session:user123');
 *
 * // Check cache statistics
 * const stats = Cache.getStats();
 * console.log(`Hit rate: ${stats.hitRate}%`);
 * ```
 *
 * @since 4.2.2
 */
export const Cache = new SecureInMemoryCache();
/**
 * SecureInMemoryCache class for creating custom cache instances
 *
 * Advanced in-memory cache with military-grade encryption and intelligent
 * memory management. Ideal for high-performance applications requiring
 * secure temporary storage.
 *
 * @example
 * ```typescript
 * import { SecureInMemoryCache } from "fortify2-js";
 *
 * const customCache = new SecureInMemoryCache({
 *   maxSize: 1000,
 *   defaultTTL: 300000, // 5 minutes
 *   encryptionKey: 'your-secret-key',
 *   compressionThreshold: 1024
 * });
 *
 * await customCache.set('api:response', largeDataObject);
 * ```
 *
 * @since 4.2.2
 */
export { SecureInMemoryCache };

/**
 * UltraFastSecureInMemoryCache class for ultra-high performance caching
 *
 * Advanced ultra-fast cache with military-grade encryption, intelligent
 * memory management, and performance optimizations. Ideal for high-throughput
 * applications requiring maximum performance with security.
 *
 * @example
 * ```typescript
 * import { UltraFastSecureInMemoryCache } from "fortify2-js";
 *
 * const ultraCache = new UltraFastSecureInMemoryCache(10000);
 * await ultraCache.set('high-freq-data', data, { priority: 10 });
 * const stats = ultraCache.getUltraStats;
 * ```
 *
 * @since 4.2.3
 */
export { UltraFastSecureInMemoryCache };

/**
 * FileCache class for persistent storage
 *
 * Enterprise-grade file-based cache with real disk space monitoring,
 * atomic operations, and configurable storage strategies.
 *
 * @example
 * ```typescript
 * import { FileCache } from "fortify2-js";
 *
 * const fileCache = new FileCache({
 *   directory: './app-cache',
 *   encrypt: true,
 *   compress: true,
 *   namingStrategy: 'hierarchical',
 *   maxCacheSize: 500 * 1024 * 1024 // 500MB
 * });
 *
 * // Get real-time cache statistics including disk usage
 * const stats = await fileCache.getStats();
 * console.log(`Disk usage: ${stats.diskUsage.percentage}%`);
 * ```
 *
 * @since 4.2.0
 */
export { FileCache };

/**
 * TypeScript type definitions for cache operations
 *
 * Complete type definitions for all cache interfaces, ensuring
 * type safety and excellent developer experience.
 *
 * @since 4.2.2
 */
export type {
    CachedData,
    CacheStats,
    CacheOptions,
    FileCacheOptions,
    FileCacheStats,
    FileCacheMetadata,
    FileCacheCleanupOptions,
    FileCacheStrategy,
    UltraStats,
    UltraCacheOptions,
    UltraMemoryCacheEntry,
};

// ========================================
// FILE CACHE UTILITIES
// ========================================

/**
 * Generate a secure file path for cache storage
 *
 * Creates secure, collision-resistant file paths using configurable naming strategies.
 * All keys are hashed using SHA-256 to prevent directory traversal attacks and
 * ensure consistent path generation across platforms.
 *
 * @param key - The cache key to generate a path for
 * @param options - Optional configuration for path generation
 * @returns Secure file path for the given key
 *
 * @example
 * ```typescript
 * import { generateFilePath } from "fortify2-js";
 *
 * // Hierarchical structure (recommended for large caches)
 * const path1 = generateFilePath('user:123', {
 *   namingStrategy: 'hierarchical',
 *   directory: './cache'
 * });
 * // Result: ./cache/a1/b2/a1b2c3d4...cache
 *
 * // Date-based organization (good for time-series data)
 * const path2 = generateFilePath('daily-report', {
 *   namingStrategy: 'dated',
 *   directory: './reports'
 * });
 * // Result: ./reports/2024/12/19/hash...cache
 *
 * // Direct naming (human-readable, limited special chars)
 * const path3 = generateFilePath('config-settings', {
 *   namingStrategy: 'direct',
 *   directory: './config'
 * });
 * // Result: ./config/config-settings.cache
 * ```
 *
 * @since 4.2.2
 */
export const generateFilePath = (
    key: string,
    options: Partial<FileCacheOptions> = {}
): string => {
    const config = { ...DEFAULT_FILE_CACHE_CONFIG, ...options };
    const sanitized = Hash.create(key, { outputFormat: "hex" }) as string;

    let filePath: string;

    switch (config.namingStrategy) {
        case "hierarchical":
            const dir = sanitized.substring(0, 2);
            const subdir = sanitized.substring(2, 4);
            filePath = path.resolve(
                config.directory,
                dir,
                subdir,
                `${sanitized}${config.extension}`
            );
            break;

        case "dated":
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, "0");
            const day = String(now.getDate()).padStart(2, "0");
            filePath = path.resolve(
                config.directory,
                String(year),
                month,
                day,
                `${sanitized}${config.extension}`
            );
            break;

        case "direct":
            const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, "_");
            filePath = path.resolve(
                config.directory,
                `${safeKey}${config.extension}`
            );
            break;

        case "flat":
        default:
            filePath = path.resolve(
                config.directory,
                `${sanitized}${config.extension}`
            );
            break;
    }

    return filePath;
};

// ========================================
// FILE CACHE EXPORTS
// ========================================

/**
 * Default FileCache instance with lazy initialization
 *
 * Pre-configured file cache instance optimized for general use cases.
 * Features encryption, compression, and real disk space monitoring.
 * Uses lazy initialization to avoid circular dependency issues.
 *
 * @example
 * ```typescript
 * import { defaultFileCache } from "fortify2-js";
 *
 * // Store large dataset with compression
 * await defaultFileCache.set('analytics:daily', bigDataSet, {
 *   ttl: 86400000, // 24 hours
 *   compress: true
 * });
 *
 * // Check cache health
 * const info = await defaultFileCache.getCacheInfo();
 * if (!info.health.healthy) {
 *   console.warn('Cache issues:', info.health.issues);
 * }
 * ```
 *
 * @since 4.2.0
 */
let _defaultFileCache: FileCache | null = null;
export const defaultFileCache = new Proxy({} as FileCache, {
    get(target, prop) {
        if (!_defaultFileCache) {
            _defaultFileCache = new FileCache();
        }
        const value = (_defaultFileCache as any)[prop];
        return typeof value === "function"
            ? value.bind(_defaultFileCache)
            : value;
    },
});

/**
 * Write data to file cache with automatic optimization
 *
 * Stores data in the file cache with intelligent compression and encryption.
 * Automatically handles large objects and provides atomic write operations.
 *
 * @param key - Unique identifier for the cached data
 * @param data - Data to cache (any serializable type)
 * @param options - Optional cache configuration
 * @returns Promise resolving to true if successful
 *
 * @example
 * ```typescript
 * import { writeFileCache } from "fortify2-js";
 *
 * // Cache user profile with encryption
 * const success = await writeFileCache('profile:user123', {
 *   name: 'John Doe',
 *   preferences: { theme: 'dark', lang: 'en' }
 * }, {
 *   encrypt: true,
 *   ttl: 3600000 // 1 hour
 * });
 * ```
 *
 * @since 4.2.2
 */
export const writeFileCache = async (
    key: string,
    data: CachedData,
    options?: Partial<FileCacheOptions>
): Promise<boolean> => {
    return defaultFileCache.set(key, data, options);
};

/**
 * Read data from file cache with automatic decryption
 *
 * Retrieves and automatically decrypts/decompresses cached data.
 * Returns null for expired or non-existent entries.
 *
 * @param key - Unique identifier for the cached data
 * @returns Promise resolving to cached data or null
 *
 * @example
 * ```typescript
 * import { readFileCache } from "fortify2-js";
 *
 * const userData = await readFileCache('profile:user123');
 * if (userData) {
 *   console.log('Welcome back,', userData.name);
 * } else {
 *   console.log('Cache miss - loading from database');
 * }
 * ```
 *
 * @since 4.2.2
 */
export const readFileCache = async (
    key: string
): Promise<CachedData | null> => {
    return defaultFileCache.get(key);
};

/**
 * Remove specific entry from file cache
 *
 * Permanently deletes a cache entry and updates disk usage statistics.
 * Safe to call on non-existent keys.
 *
 * @param key - Unique identifier for the cached data
 * @returns Promise resolving to true if entry was deleted
 *
 * @example
 * ```typescript
 * import { removeFileCache } from "fortify2-js";
 *
 * // Remove expired session
 * const removed = await removeFileCache('session:expired123');
 * console.log(removed ? 'Session cleared' : 'Session not found');
 * ```
 *
 * @since 4.2.2
 */
export const removeFileCache = async (key: string): Promise<boolean> => {
    return defaultFileCache.delete(key);
};

/**
 * Check if file cache entry exists and is valid
 *
 * Verifies cache entry existence without loading the data.
 * Automatically removes expired entries during check.
 *
 * @param key - Unique identifier for the cached data
 * @returns Promise resolving to true if entry exists and is valid
 *
 * @example
 * ```typescript
 * import { hasFileCache } from "fortify2-js";
 *
 * if (await hasFileCache('config:app-settings')) {
 *   const config = await readFileCache('config:app-settings');
 * } else {
 *   // Load from default configuration
 * }
 * ```
 *
 * @since 4.2.2
 */
export const hasFileCache = async (key: string): Promise<boolean> => {
    return defaultFileCache.has(key);
};

/**
 * Clear all file cache entries
 *
 * Removes all cached files and resets statistics.
 * Use with caution in production environments.
 *
 * @example
 * ```typescript
 * import { clearFileCache } from "fortify2-js";
 *
 * // Clear cache during maintenance
 * await clearFileCache();
 * console.log('Cache cleared successfully');
 * ```
 *
 * @since 4.2.2
 */
export const clearFileCache = async (): Promise<void> => {
    return defaultFileCache.clear();
};

/**
 * Get comprehensive file cache statistics
 *
 * Returns real-time statistics including disk usage, hit rates,
 * and performance metrics with health assessment.
 *
 * @returns Promise resolving to detailed cache statistics
 *
 * @example
 * ```typescript
 * import { getFileCacheStats } from "fortify2-js";
 *
 * const stats = await getFileCacheStats();
 * console.log(`Cache efficiency: ${stats.hitRate}%`);
 * console.log(`Disk usage: ${stats.diskUsage.percentage}%`);
 * console.log(`Average response time: ${stats.avgResponseTime}ms`);
 * ```
 *
 * @since 4.2.2
 */
export const getFileCacheStats = async (): Promise<FileCacheStats> => {
    return defaultFileCache.getStats();
};

/**
 * Clean up expired file cache entries
 *
 * Removes expired entries and optimizes disk usage.
 * Automatically runs in background but can be triggered manually.
 *
 * @param options - Optional cleanup configuration
 * @returns Promise resolving to cleanup results
 *
 * @example
 * ```typescript
 * import { cleanupFileCache } from "fortify2-js";
 *
 * const result = await cleanupFileCache();
 * console.log(`Cleaned ${result.cleaned} files, freed ${result.totalSize} bytes`);
 * ```
 *
 * @since 4.2.2
 */
export const cleanupFileCache = async (
    options?: Partial<FileCacheCleanupOptions>
) => {
    return defaultFileCache.cleanup(options);
};

// ========================================
// MEMORY CACHE API
// ========================================

/**
 * Read data from memory cache with fallback
 *
 * Retrieves data from the default memory cache instance.
 * Returns empty object if key is not found (legacy behavior).
 *
 * @param args - Arguments passed to Cache.get()
 * @returns Promise resolving to cached data or empty object
 *
 * @example
 * ```typescript
 * import { readCache } from "fortify2-js";
 *
 * const sessionData = await readCache('session:user123');
 * console.log('User ID:', sessionData.userId || 'Not found');
 * ```
 *
 * @since 4.2.2
 */
export const readCache = async (...args: Parameters<typeof Cache.get>) => {
    const result = await Cache.get(...args);
    return result || {};
};

/**
 * Write data to memory cache
 *
 * Stores data in the default memory cache instance with encryption
 * and automatic compression for large values.
 *
 * @param args - Arguments passed to Cache.set()
 * @returns Promise resolving to true if successful
 *
 * @example
 * ```typescript
 * import { writeCache } from "fortify2-js";
 *
 * await writeCache('user:profile', userData, { ttl: 1800000 }); // 30 min
 * ```
 *
 * @since 4.2.2
 */
export const writeCache = async (...args: Parameters<typeof Cache.set>) => {
    return Cache.set(...args);
};

/**
 * Get memory cache performance statistics
 *
 * Returns comprehensive statistics including hit rates, memory usage,
 * and performance metrics for the default cache instance.
 *
 * @returns Current cache statistics
 *
 * @example
 * ```typescript
 * import { getCacheStats } from "fortify2-js";
 *
 * const stats = getCacheStats();
 * console.log(`Hit rate: ${stats.hitRate}%`);
 * console.log(`Memory usage: ${stats.memoryUsage} bytes`);
 * ```
 *
 * @since 4.2.2
 */
export const getCacheStats = (): CacheStats => {
    return Cache.getStats;
};

/**
 * Remove entry from memory cache
 *
 * Immediately removes a cache entry and frees associated memory.
 * Safe to call on non-existent keys.
 *
 * @param key - Cache key to remove
 * @returns Promise that resolves when deletion is complete
 *
 * @example
 * ```typescript
 * import { expireCache } from "fortify2-js";
 *
 * await expireCache('session:expired123');
 * console.log('Session removed from cache');
 * ```
 *
 * @since 4.2.2
 */
export const expireCache = (key: string): Promise<void> => {
    Cache.delete(key);
    return Promise.resolve();
};

/**
 * Clear all memory cache entries
 *
 * Removes all cached data and resets statistics.
 * Use with caution in production environments.
 *
 * @returns Promise that resolves when cache is cleared
 *
 * @example
 * ```typescript
 * import { clearAllCache } from "fortify2-js";
 *
 * await clearAllCache();
 * console.log('Memory cache cleared');
 * ```
 *
 * @since 4.2.2
 */
export const clearAllCache = (): Promise<void> => {
    Cache.clear();
    return Promise.resolve();
};

/**
 * Legacy filepath function
 * @deprecated use generateFilePath instead
 */
export const filepath = (origin: string): string => {
    return generateFilePath(origin, { namingStrategy: "hierarchical" });
};

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Create optimal cache instance based on performance requirements
 *
 * Factory function that creates the most suitable cache instance for your use case.
 * Automatically configures security settings and performance optimizations.
 *
 * @param options - Cache configuration options
 * @param options.type - Cache strategy: 'memory' (fastest), 'file' (persistent), 'hybrid' (balanced)
 * @param options.config - Optional file cache configuration (ignored for memory-only)
 * @returns Configured cache instance optimized for the specified requirements
 *
 * @example
 * ```typescript
 * import { createOptimalCache } from "fortify2-js";
 *
 * // Ultra-fast memory cache for session data
 * const sessionCache = createOptimalCache({ type: 'memory' });
 *
 * // Persistent file cache for application data
 * const appCache = createOptimalCache({
 *   type: 'file',
 *   config: {
 *     directory: './app-cache',
 *     encrypt: true,
 *     maxCacheSize: 100 * 1024 * 1024 // 100MB
 *   }
 * });
 *
 * // Hybrid cache for optimal performance and persistence
 * const hybridCache = createOptimalCache({
 *   type: 'hybrid',
 *   config: { encrypt: true, compress: true }
 * });
 *
 * // Use hybrid cache (memory-first with file backup)
 * await hybridCache.set('user:123', userData);
 * const user = await hybridCache.get('user:123'); // Served from memory
 * ```
 *
 * @since 4.2.2
 */
export const createOptimalCache = (options: {
    type: "memory" | "file" | "hybrid";
    config?: Partial<FileCacheOptions>;
}) => {
    switch (options.type) {
        case "memory":
            return new SecureInMemoryCache();
        case "file":
            return new FileCache(options.config);
        case "hybrid":
            // Return both memory cache and file cache in a wrapper
            return {
                memory: new SecureInMemoryCache(),
                file: new FileCache(options.config),
                async get(key: string) {
                    // Try memory first, then file
                    let result = await this.memory.get(key);
                    if (!result) {
                        result = await this.file.get(key);
                        if (result) {
                            // Cache in memory for faster access
                            await this.memory.set(key, result);
                        }
                    }
                    return result;
                },
                async set(key: string, value: CachedData, options?: any) {
                    // Set in both caches
                    const memoryResult = await this.memory.set(
                        key,
                        value,
                        options
                    );
                    const fileResult = await this.file.set(key, value, options);
                    return memoryResult && fileResult;
                },
            };
        default:
            return new SecureInMemoryCache();
    }
};

// ========================================
// ADDITIONAL EXPORTS
// ========================================

/**
 * Legacy file cache function names for backward compatibility
 * @deprecated Use the new function names for better clarity
 */
export const deleteFileCache = removeFileCache;

// ========================================
// GRACEFUL SHUTDOWN HANDLING
// ========================================

/**
 * Graceful shutdown handler for cache system
 *
 * Automatically registered to handle SIGTERM and SIGINT signals.
 * Ensures all cache operations complete before process termination.
 *
 * @internal
 * @since 4.2.2
 */
const handleGracefulShutdown = () => {
    console.log("Shutting down FortifyJS CS gracefully...");
    try {
        Cache.shutdown();
    } catch (error) {
        console.error("Error during cache shutdown:", error);
    }
};

// Register shutdown handlers
process.on("SIGTERM", handleGracefulShutdown);
process.on("SIGINT", handleGracefulShutdown);

// ========================================
// MODULE METADATA
// ========================================

/**
 * Cache module version and metadata
 * @since 4.2.0
 */
export const CACHE_VERSION = "4.2.3";
export const CACHE_BUILD_DATE = "2025-04-06";

/**
 * Default export for convenience
 * @since 4.2.2
 */
export default {
    Cache,
    get FileCache() {
        return FileCache;
    },
    SecureInMemoryCache,
    createOptimalCache,
    generateFilePath,
    writeFileCache,
    readFileCache,
    removeFileCache,
    hasFileCache,
    clearFileCache,
    getFileCacheStats,
    cleanupFileCache,
    writeCache,
    readCache,
    getCacheStats,
    expireCache,
    clearAllCache,
    defaultFileCache,
    CACHE_VERSION,
    CACHE_BUILD_DATE,
};

/**
 * Cache interface for public API to avoid TypeScript issues with private members
 */
export interface ICacheAdapter {
    get(key: string): Promise<any>;
    set(
        key: string,
        value: any,
        options?: { ttl?: number; tags?: string[] }
    ): Promise<boolean>;
    delete(key: string): Promise<boolean>;
    exists(key: string): Promise<boolean>;
    clear(): Promise<void>;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    getStats(): Promise<any>;
    mget(keys: string[]): Promise<Record<string, any>>;
    mset(
        entries: Record<string, any> | Array<[string, any]>,
        options?: { ttl?: number; tags?: string[] }
    ): Promise<boolean>;
    invalidateByTags(tags: string[]): Promise<number>;
    getTTL(key: string): Promise<number>;
    expire(key: string, ttl: number): Promise<boolean>;
    keys(pattern?: string): Promise<string[]>;
    getHealth(): { status: "healthy" | "degraded" | "unhealthy"; details: any };
}

/**
 * SecureCacheClient - Enterprise-grade secure caching solution
 *
 * A high-performance, secure cache client that supports multiple backend strategies
 * including memory-only, Redis-only, and hybrid (memory + Redis) configurations.
 * Features military-grade AES-256-GCM encryption, intelligent compression, and
 * comprehensive monitoring capabilities.
 *
 * ## Features
 * - **Multi-Strategy Support**: Memory, Redis, or Hybrid caching
 * - **Military-Grade Security**: AES-256-GCM encryption with key rotation
 * - **High Availability**: Redis Cluster and Sentinel support
 * - **Performance Optimized**: Intelligent compression and hot data promotion
 * - **Production Ready**: Comprehensive monitoring and health checks
 * - **Type Safe**: Full TypeScript support with detailed interfaces
 *
 * ## Supported Cache Strategies
 * - `memory`: Ultra-fast in-memory caching with LRU eviction
 * - `redis`: Distributed Redis caching with clustering support
 * - `hybrid`: Memory-first with Redis backup for optimal performance
 *
 * ## Security Features
 * - AES-256-GCM encryption for all cached data
 * - Automatic key rotation and tamper detection
 * - Secure serialization with integrity verification
 * - Access pattern monitoring and anomaly detection
 *
 * @example Basic Redis Configuration
 * ```typescript
 * import { SecureCacheClient } from "fortify2-js";
 *
 * const cache = new SecureCacheClient({
 *   strategy: "redis",
 *   redis: {
 *     host: "localhost",
 *     port: 6379,
 *     password: "your-secure-password"
 *   }
 * });
 *
 * await cache.connect();
 * await cache.set("user:123", { name: "John", role: "admin" }, { ttl: 3600 });
 * const user = await cache.get("user:123");
 * ```
 *
 * @example Hybrid Strategy with Encryption
 * ```typescript
 * const cache = new SecureCacheClient({
 *   strategy: "hybrid",
 *   memory: {
 *     maxSize: 100, // 100MB
 *     maxEntries: 10000
 *   },
 *   redis: {
 *     host: "redis-cluster.example.com",
 *     port: 6379,
 *     cluster: {
 *       enabled: true,
 *       nodes: [
 *         { host: "redis-1", port: 6379 },
 *         { host: "redis-2", port: 6379 }
 *       ]
 *     }
 *   },
 *   security: {
 *     encryption: true,
 *     keyRotation: true
 *   }
 * });
 * ```
 *
 * @example Advanced Usage with Tags and Monitoring
 * ```typescript
 * // Store data with tags for bulk invalidation
 * await cache.set("product:123", productData, {
 *   ttl: 1800,
 *   tags: ["products", "category:electronics"]
 * });
 *
 * // Batch operations for better performance
 * await cache.mset({
 *   "user:1": userData1,
 *   "user:2": userData2
 * }, { ttl: 3600 });
 *
 * // Invalidate by tags
 * await cache.invalidateByTags(["products"]);
 *
 * // Monitor cache health
 * const health = cache.getHealth();
 * if (health.status !== "healthy") {
 *   console.warn("Cache issues:", health.details);
 * }
 *
 * // Get performance statistics
 * const stats = await cache.getStats();
 * console.log(`Hit rate: ${stats.memory.hitRate * 100}%`);
 * ```
 *
 * @since 4.2.3
 * @version 4.2.3
 * @author FortifyJS Team
 * @see {@link ICacheAdapter} for the complete interface definition
 * @see {@link https://lab.nehonix.space/nehonix_viewer/_doc/Nehonix%20FortifyJs} for detailed documentation
 */
export class SecureCacheClient implements ICacheAdapter {
    private adapter: SecureCacheAdapterType | null = null;
    private config: any;

    /**
     * Creates a new SecureCacheClient instance
     *
     * @param config - Cache configuration object
     * @param config.strategy - Cache strategy: "memory", "redis", or "hybrid"
     * @param config.redis - Redis configuration (required for "redis" and "hybrid" strategies)
     * @param config.redis.host - Redis server hostname
     * @param config.redis.port - Redis server port
     * @param config.redis.password - Redis authentication password
     * @param config.redis.cluster - Redis cluster configuration
     * @param config.memory - Memory cache configuration (for "memory" and "hybrid" strategies)
     * @param config.memory.maxSize - Maximum memory cache size in MB
     * @param config.memory.maxEntries - Maximum number of cache entries
     * @param config.security - Security configuration
     * @param config.security.encryption - Enable AES-256-GCM encryption
     * @param config.security.keyRotation - Enable automatic key rotation
     * @param config.monitoring - Monitoring and health check configuration
     *
     * @example
     * ```typescript
     * const cache = new SecureCacheClient({
     *   strategy: "hybrid",
     *   redis: { host: "localhost", port: 6379 },
     *   memory: { maxSize: 100, maxEntries: 10000 },
     *   security: { encryption: true }
     * });
     * ```
     */
    constructor(config: any = {}) {
        this.config = config;
        // Adapter will be created lazily on first use
    }

    /**
     * Ensures the cache adapter is initialized
     * @private
     * @returns Promise resolving to the initialized adapter
     */
    private async ensureAdapter(): Promise<SecureCacheAdapterType> {
        if (!this.adapter) {
            // Use dynamic import for production compatibility
            const { SecureCacheAdapter } = await import(
                "../../integrations/express/cache/SecureCacheAdapter"
            );
            this.adapter = new SecureCacheAdapter(this.config);
        }
        return this.adapter!; // Non-null assertion since we just created it
    }

    /**
     * Retrieves a value from the cache
     *
     * @param key - The cache key to retrieve
     * @returns Promise resolving to the cached value, or null if not found
     *
     * @example
     * ```typescript
     * const user = await cache.get("user:123");
     * if (user) {
     *   console.log("Found user:", user.name);
     * }
     * ```
     */
    async get(key: string): Promise<any> {
        const adapter = await this.ensureAdapter();
        return adapter.get(key);
    }

    /**
     * Stores a value in the cache with optional TTL and tags
     *
     * @param key - The cache key to store the value under
     * @param value - The value to cache (will be automatically serialized)
     * @param options - Optional caching options
     * @param options.ttl - Time to live in seconds (default: configured TTL)
     * @param options.tags - Array of tags for bulk invalidation
     * @returns Promise resolving to true if successful, false otherwise
     *
     * @example
     * ```typescript
     * // Basic usage
     * await cache.set("user:123", { name: "John", role: "admin" });
     *
     * // With TTL (1 hour)
     * await cache.set("session:abc", sessionData, { ttl: 3600 });
     *
     * // With tags for bulk invalidation
     * await cache.set("product:456", productData, {
     *   ttl: 1800,
     *   tags: ["products", "category:electronics"]
     * });
     * ```
     */
    async set(
        key: string,
        value: any,
        options?: { ttl?: number; tags?: string[] }
    ): Promise<boolean> {
        const adapter = await this.ensureAdapter();
        return adapter.set(key, value, options);
    }

    /**
     * Deletes a value from the cache
     *
     * @param key - The cache key to delete
     * @returns Promise resolving to true if the key was deleted, false if not found
     *
     * @example
     * ```typescript
     * const deleted = await cache.delete("user:123");
     * if (deleted) {
     *   console.log("User cache cleared");
     * }
     * ```
     */
    async delete(key: string): Promise<boolean> {
        const adapter = await this.ensureAdapter();
        return adapter.delete(key);
    }

    /**
     * Checks if a key exists in the cache
     *
     * @param key - The cache key to check
     * @returns Promise resolving to true if the key exists, false otherwise
     *
     * @example
     * ```typescript
     * if (await cache.exists("user:123")) {
     *   console.log("User is cached");
     * }
     * ```
     */
    async exists(key: string): Promise<boolean> {
        const adapter = await this.ensureAdapter();
        return adapter.exists(key);
    }

    /**
     * Clears all cached data
     *
     * ⚠️ **Warning**: This operation is irreversible and will remove all cached data
     *
     * @returns Promise that resolves when the cache is cleared
     *
     * @example
     * ```typescript
     * await cache.clear();
     * console.log("All cache data cleared");
     * ```
     */
    async clear(): Promise<void> {
        const adapter = await this.ensureAdapter();
        return adapter.clear();
    }

    /**
     * Establishes connection to the cache backend
     *
     * Must be called before using the cache. For Redis strategies, this establishes
     * the connection to the Redis server(s). For memory-only strategy, this initializes
     * the in-memory cache.
     *
     * @returns Promise that resolves when the connection is established
     * @throws {Error} If connection fails
     *
     * @example
     * ```typescript
     * try {
     *   await cache.connect();
     *   console.log("Cache connected successfully");
     * } catch (error) {
     *   console.error("Failed to connect to cache:", error);
     * }
     * ```
     */
    async connect(): Promise<void> {
        const adapter = await this.ensureAdapter();
        return adapter.connect();
    }

    /**
     * Closes the connection to the cache backend
     *
     * Gracefully closes all connections and cleans up resources. Should be called
     * when shutting down the application.
     *
     * @returns Promise that resolves when the connection is closed
     *
     * @example
     * ```typescript
     * process.on('SIGTERM', async () => {
     *   await cache.disconnect();
     *   console.log("Cache disconnected");
     * });
     * ```
     */
    async disconnect(): Promise<void> {
        const adapter = await this.ensureAdapter();
        return adapter.disconnect();
    }

    /**
     * Retrieves comprehensive cache performance statistics
     *
     * @returns Promise resolving to detailed statistics including hit rates, memory usage, and performance metrics
     *
     * @example
     * ```typescript
     * const stats = await cache.getStats();
     * console.log(`Memory hit rate: ${stats.memory.hitRate * 100}%`);
     * console.log(`Redis hit rate: ${stats.redis.hitRate * 100}%`);
     * console.log(`Total operations: ${stats.operations.total}`);
     * console.log(`Average response time: ${stats.performance.avgResponseTime}ms`);
     * ```
     */
    async getStats(): Promise<any> {
        const adapter = await this.ensureAdapter();
        return adapter.getStats();
    }

    /**
     * Retrieves multiple values from the cache in a single operation
     *
     * @param keys - Array of cache keys to retrieve
     * @returns Promise resolving to an object with key-value pairs (missing keys are omitted)
     *
     * @example
     * ```typescript
     * const users = await cache.mget(["user:1", "user:2", "user:3"]);
     * console.log(users); // { "user:1": {...}, "user:2": {...} }
     * ```
     */
    async mget(keys: string[]): Promise<Record<string, any>> {
        const adapter = await this.ensureAdapter();
        return adapter.mget(keys);
    }

    /**
     * Stores multiple key-value pairs in a single operation
     *
     * @param entries - Object with key-value pairs or array of [key, value] tuples
     * @param options - Optional caching options applied to all entries
     * @param options.ttl - Time to live in seconds for all entries
     * @param options.tags - Array of tags applied to all entries
     * @returns Promise resolving to true if successful, false otherwise
     *
     * @example
     * ```typescript
     * // Using object notation
     * await cache.mset({
     *   "user:1": { name: "Alice" },
     *   "user:2": { name: "Bob" }
     * }, { ttl: 3600 });
     *
     * // Using array notation
     * await cache.mset([
     *   ["session:abc", sessionData1],
     *   ["session:def", sessionData2]
     * ], { ttl: 1800, tags: ["sessions"] });
     * ```
     */
    async mset(
        entries: Record<string, any> | Array<[string, any]>,
        options?: { ttl?: number; tags?: string[] }
    ): Promise<boolean> {
        const adapter = await this.ensureAdapter();
        return adapter.mset(entries, options);
    }

    /**
     * Invalidates all cache entries that have any of the specified tags
     *
     * @param tags - Array of tags to invalidate
     * @returns Promise resolving to the number of entries invalidated
     *
     * @example
     * ```typescript
     * // Invalidate all product-related cache entries
     * const count = await cache.invalidateByTags(["products", "inventory"]);
     * console.log(`Invalidated ${count} cache entries`);
     * ```
     */
    async invalidateByTags(tags: string[]): Promise<number> {
        const adapter = await this.ensureAdapter();
        return adapter.invalidateByTags(tags);
    }

    /**
     * Gets the remaining time-to-live for a cache key
     *
     * @param key - The cache key to check
     * @returns Promise resolving to TTL in seconds, or -1 if key doesn't exist, -2 if no TTL set
     *
     * @example
     * ```typescript
     * const ttl = await cache.getTTL("user:123");
     * if (ttl > 0) {
     *   console.log(`Key expires in ${ttl} seconds`);
     * }
     * ```
     */
    async getTTL(key: string): Promise<number> {
        const adapter = await this.ensureAdapter();
        return adapter.getTTL(key);
    }

    /**
     * Sets or updates the expiration time for a cache key
     *
     * @param key - The cache key to set expiration for
     * @param ttl - Time to live in seconds
     * @returns Promise resolving to true if successful, false if key doesn't exist
     *
     * @example
     * ```typescript
     * // Extend expiration to 1 hour
     * await cache.expire("user:123", 3600);
     *
     * // Set short expiration for temporary data
     * await cache.expire("temp:data", 60);
     * ```
     */
    async expire(key: string, ttl: number): Promise<boolean> {
        const adapter = await this.ensureAdapter();
        return adapter.expire(key, ttl);
    }

    /**
     * Retrieves all cache keys matching an optional pattern
     *
     * ⚠️ **Warning**: Use with caution in production as this can be expensive for large caches
     *
     * @param pattern - Optional glob-style pattern to filter keys (Redis syntax)
     * @returns Promise resolving to array of matching keys
     *
     * @example
     * ```typescript
     * // Get all keys
     * const allKeys = await cache.keys();
     *
     * // Get user-related keys
     * const userKeys = await cache.keys("user:*");
     *
     * // Get session keys with pattern
     * const sessionKeys = await cache.keys("session:*:active");
     * ```
     */
    async keys(pattern?: string): Promise<string[]> {
        const adapter = await this.ensureAdapter();
        return adapter.keys(pattern);
    }

    /**
     * Gets the current health status of the cache system
     *
     * @returns Health status object with overall status and detailed information
     *
     * @example
     * ```typescript
     * const health = cache.getHealth();
     *
     * switch (health.status) {
     *   case "healthy":
     *     console.log("Cache is operating normally");
     *     break;
     *   case "degraded":
     *     console.warn("Cache has issues but is functional:", health.details);
     *     break;
     *   case "unhealthy":
     *     console.error("Cache is not functional:", health.details);
     *     break;
     * }
     *
     * // Check specific metrics
     * if (health.details.redis?.connected === false) {
     *   console.error("Redis connection lost");
     * }
     * ```
     */
    getHealth(): {
        status: "healthy" | "degraded" | "unhealthy";
        details: any;
    } {
        if (!this.adapter) {
            return {
                status: "unhealthy",
                details: { error: "Cache adapter not initialized" },
            };
        }
        return this.adapter.getHealth();
    }
}

/**
 * Short alias for SecureCacheClient for convenience
 *
 * @example
 * ```typescript
 * import { SCC } from "fortify2-js";
 *
 * const cache = new SCC({
 *   strategy: "redis",
 *   redis: { host: "localhost", port: 6379 }
 * });
 * ```
 */
export { SecureCacheClient as SCC };

