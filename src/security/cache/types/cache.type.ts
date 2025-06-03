// Enhanced type definitions
export type CachedData = Record<string, any>;

export interface MemoryCacheEntry {
    data: string; // Encrypted and optionally compressed data
    iv: string;
    authTag: string;
    timestamp: number;
    expiresAt: number;
    accessCount: number;
    lastAccessed: number;
    compressed: boolean;
    size: number; // Size in bytes
    version: number;
}

export interface CacheStats {
    hits: number;
    misses: number;
    evictions: number;
    totalSize: number; // Total memory usage in bytes
    entryCount: number;
    hitRate: number;
    memoryUsage: {
        used: number;
        limit: number;
        percentage: number;
    };
}

export interface CacheOptions {
    ttl?: number; // Time to live in milliseconds
    compress?: boolean; // Force compression
    encrypt?: boolean; // Enable/disable encryption (default: true)
}

// Security event types
export type SecurityEvent =
    | "key_rotation"
    | "suspicious_access"
    | "memory_pressure"
    | "cache_overflow"
    | "encryption_failure";
