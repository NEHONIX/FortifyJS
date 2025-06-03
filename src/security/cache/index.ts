import { CachedData, CacheStats } from "./types/cache.type";
import { SecureInMemoryCache } from "./useCache";

/**
 * @fileoverview Secure In-Memory Cache
 *
 * A comprehensive caching solution with enterprise-grade security features including:
 * - AES-256-GCM encryption for all cached data
 * - PBKDF2 key derivation and automatic key rotation
 * - Zlib compression for large values
 * - LRU eviction with configurable memory limits
 * - TTL (Time-To-Live) support with automatic cleanup
 * - Access pattern monitoring and security alerts
 * - Memory pressure management
 *
 * @example
 * ```typescript
 * import { Cache, readCache, writeCache } from "fortify2-js";
 *
 * // Using the singleton instance
 * await Cache.set('user:123', { name: 'John', age: 30 });
 * const user = await Cache.get('user:123');
 *
 * // Using legacy API
 * await writeCache({ data: { name: 'Jane' }, filepath: 'user:456' });
 * const userData = await readCache('user:456');
 * ```
 *
 * @version 4.1.8
 * @author Nehonix
 * @since 03/06/2025
 */

/**
 * Singleton instance of SecureInMemoryCache
 *
 * Pre-configured secure cache instance ready for immediate use.
 * Automatically initializes with environment variables for encryption keys.
 *
 * @example
 *
 * // 1. Basic caching
 * await Cache.set('user:123', { name: 'John', email: 'john@example.com' });
 * const user = await Cache.get('user:123');
 *
 * // 2. With TTL and compression
 * await Cache.set('large:dataset', bigData, {
 *   ttl: 30 * 60 * 1000, // 30 minutes
 *   compress: true
 * });
 *
 * // 3. Legacy API compatibility
 * await writeCache({ data: { count: 42 }, filepath: 'stats:daily' });
 * const stats = await readCache('stats:daily');
 *
 * // 4. Cache monitoring
 * const stats = getCacheStats();
 * if (stats.memoryUsage.percentage > 90) {
 *   console.warn('Cache memory usage high:', stats.memoryUsage);
 * }
 *
 * // 5. Event handling
 * Cache.on('memory_pressure', (event) => {
 *   console.warn('Memory pressure detected:', event);
 * });
 *
 * Cache.on('suspicious_access', (event) => {
 *   console.error('Suspicious access pattern:', event);
 * });
 */
export const Cache = new SecureInMemoryCache();

/**
 * SecureInMemoryCache class for creating custom cache instances
 *
 * Use this when you need multiple isolated cache instances with different
 * configurations or lifecycle management.
 *
 * @example
 * ```typescript
 * // Create a dedicated cache for user sessions
 * const sessionCache = new SecureInMemoryCache();
 *
 * // Create a separate cache for API responses
 * const apiCache = new SecureInMemoryCache();
 *
 * // Each instance has independent encryption keys and storage
 * await sessionCache.set('user:123', userData);
 * await apiCache.set('api:/users', apiResponse);
 * ```
 */
export { SecureInMemoryCache };

/**
 * Type definitions for cache operations
 *
 * @see CachedData - Union type for all cacheable data types
 * @see CacheStats - Cache performance and usage statistics
 * @see CacheOptions - Configuration options for cache operations
 */
export type { CachedData, CacheStats, CacheOptions } from "./types/cache.type";

// ========================================
// LEGACY API COMPATIBILITY LAYER
// ========================================

/**
 * Read data from cache (Legacy API)
 *
 * Retrieves cached data by key. Returns empty object if key doesn't exist
 * or has expired. This function maintains backward compatibility with
 * older cache implementations.
 *
 * @param key - Cache key to retrieve
 * @returns Promise resolving to cached data or empty object
 *
 * @example
 * ```typescript
 * // Read user data
 * const userData = await readCache('user:123');
 * if (userData.name) {
 *   console.log(`Hello, ${userData.name}!`);
 * }
 *
 * // Handle missing data
 * const config = await readCache('app:config') || { theme: 'light' };
 * ```
 */
export const readCache = async (key: string): Promise<CachedData> => {
    const result = await Cache.get(key);
    return result || {};
};

/**
 * Write data to cache (Legacy API)
 *
 * Stores data in cache using filepath as the key. Maintains compatibility
 * with file-based caching patterns while leveraging secure in-memory storage.
 *
 * @param params - Object containing data and filepath
 * @param params.data - Data to cache (any serializable type)
 * @param params.filepath - Cache key (historically a file path)
 * @returns Promise resolving to true if successful, false otherwise
 *
 * @example
 * ```typescript
 * // Cache user preferences
 * const success = await writeCache({
 *   data: { theme: 'dark', language: 'en' },
 *   filepath: 'user:123:preferences'
 * });
 *
 * // Cache API response
 * await writeCache({
 *   data: { users: [...], total: 150 },
 *   filepath: 'api:/users?page=1'
 * });
 * ```
 */
export const writeCache = async ({
    data,
    filepath,
}: {
    data: CachedData;
    filepath: string;
}): Promise<boolean> => {
    return Cache.set(filepath, data);
};

/**
 * Get cache performance statistics
 *
 * Returns comprehensive statistics about cache performance, memory usage,
 * hit rates, and other operational metrics.
 *
 * @returns Current cache statistics
 *
 * @example
 * ```typescript
 * const stats = getCacheStats();
 *
 * console.log(`Cache hit rate: ${stats.hitRate.toFixed(2)}%`);
 * console.log(`Memory usage: ${stats.memoryUsage.percentage.toFixed(1)}%`);
 * console.log(`Total entries: ${stats.entryCount}`);
 * console.log(`Cache size: ${(stats.totalSize / 1024 / 1024).toFixed(2)} MB`);
 *
 * // Monitor cache performance
 * if (stats.hitRate < 0.8) {
 *   console.warn('Low cache hit rate detected');
 * }
 * ```
 */
export const getCacheStats = (): CacheStats => {
    return Cache.getStats;
};

/**
 * Expire/delete a cache entry
 *
 * Removes a specific cache entry by key. Useful for invalidating outdated
 * data or implementing custom expiration logic.
 *
 * @param key - Cache key to expire
 * @returns Promise resolving when operation completes
 *
 * @example
 * ```typescript
 * // Expire user session after logout
 * await expireCache('session:abc123');
 *
 * // Invalidate cached API data after update
 * await expireCache('api:/users');
 *
 * // Bulk expire related entries
 * const userKeys = ['user:123:profile', 'user:123:preferences'];
 * await Promise.all(userKeys.map(key => expireCache(key)));
 * ```
 */
export const expireCache = (key: string): Promise<void> => {
    Cache.delete(key);
    return Promise.resolve();
};

/**
 * Clear all cache entries
 *
 * Removes all cached data and resets cache statistics. Use with caution
 * as this operation cannot be undone.
 *
 * @returns Promise resolving when operation completes
 *
 * @example
 * ```typescript
 * // Clear cache during application shutdown
 * await clearAllCache();
 *
 * // Reset cache for testing
 * beforeEach(async () => {
 *   await clearAllCache();
 * });
 *
 * // Emergency cache reset
 * if (memoryUsage > criticalThreshold) {
 *   await clearAllCache();
 * }
 * ```
 */
export const clearAllCache = (): Promise<void> => {
    Cache.clear();
    return Promise.resolve();
};

// ========================================
// GRACEFUL SHUTDOWN HANDLING
// ========================================

/**
 * Graceful shutdown handlers
 *
 * Automatically clean up cache resources and stop background tasks
 * when the process receives termination signals. This ensures:
 * - Encryption keys are properly cleared from memory
 * - Background timers are stopped
 * - Event listeners are removed
 * - Memory is freed
 */process.on("SIGTERM", () => {
    console.log("Shutting down cache gracefully...");
    Cache.shutdown();
});

process.on("SIGINT", () => {
    console.log("Shutting down cache gracefully...");
    Cache.shutdown();
});
