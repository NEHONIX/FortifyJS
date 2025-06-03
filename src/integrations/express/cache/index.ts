/**
 * FortifyJS Express Cache Module
 * 
 * Ultra-fast, secure cache system combining:
 * - FortifyJS Security Cache (memory-based with encryption)
 * - Redis Cluster support with failover
 * - Hybrid strategy for maximum performance
 * - Advanced monitoring and health checks
 */

export { SecureCacheAdapter } from './SecureCacheAdapter';
export type { 
    SecureCacheConfig, 
    EnhancedCacheStats 
} from './type';

// Legacy compatibility exports
export { 
    SecureInMemoryCache,
    Cache,
    readCache,
    writeCache,
    getCacheStats,
    expireCache,
    clearAllCache
} from '../../../security/cache';

export type { 
    CacheStats,
    CacheOptions 
} from '../../../security/cache/types/cache.type';
