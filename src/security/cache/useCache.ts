/**
 * Secure in-memory cache management system
 * Features: Memory-based storage, encryption, compression, TTL, LRU eviction
 */
import * as crypto from "crypto";
import { promisify } from "util";
import zlib from "zlib";
import { EventEmitter } from "events";
import { SecureRandom } from "../../core/random";
import {
    CachedData,
    CacheOptions,
    CacheStats,
    MemoryCacheEntry,
} from "./types/cache.type";
import { CONFIG } from "./config/cache.config";

// Secure in-memory cache class with security features SecureInMemoryCache
class SIMC extends EventEmitter {
    // SecureInMemoryCache => SIMC
    private cache = new Map<string, MemoryCacheEntry>();
    private accessOrder: string[] = []; // For LRU eviction
    private stats: CacheStats = {
        hits: 0,
        misses: 0,
        evictions: 0,
        totalSize: 0,
        entryCount: 0,
        hitRate: 0,
        memoryUsage: {
            used: 0,
            limit: CONFIG.MAX_CACHE_SIZE_MB * 1024 * 1024,
            percentage: 0,
        },
    };
    private encryptionKey: Buffer = Buffer.alloc(0);
    private keyRotationTimer?: NodeJS.Timeout;
    private cleanupTimer?: NodeJS.Timeout;
    private securityTimer?: NodeJS.Timeout;
    private accessPatterns = new Map<string, number[]>(); // Track access patterns for security

    constructor() {
        super();
        this.initializeEncryption();
        this.startMaintenanceTasks();
    }

    /**
     * Initialize encryption key from environment or generate one
     */
    private initializeEncryption(): void {
        try {
            if (process.env.ENC_SECRET_KEY) {
                this.encryptionKey = Buffer.from(
                    process.env.ENC_SECRET_KEY,
                    CONFIG.ENCODING
                );
            } else if (
                process.env.ENC_SECRET_SEED &&
                process.env.ENC_SECRET_SALT
            ) {
                this.encryptionKey = crypto.pbkdf2Sync(
                    process.env.ENC_SECRET_SEED,
                    process.env.ENC_SECRET_SALT,
                    CONFIG.KEY_ITERATIONS,
                    CONFIG.KEY_LENGTH,
                    "sha256"
                );
            } else {
                console.warn(
                    "FORTIFYJS-WARNING: No encryption keys found in environment variables. " +
                        "Using a randomly generated key. Set ENC_SECRET_KEY or ENC_SECRET_SEED + ENC_SECRET_SALT."
                );
                this.encryptionKey = SecureRandom.getRandomBytes(
                    CONFIG.KEY_LENGTH
                ).getBuffer();
            }

            this.emit("key_rotation", {
                timestamp: Date.now(),
                reason: "initialization",
            });
        } catch (error) {
            console.error("Failed to initialize encryption:", error);
            throw new Error("Cache initialization failed");
        }
    }

    /**
     * Start maintenance tasks (cleanup, key rotation, security monitoring)
     */
    private startMaintenanceTasks(): void {
        // Periodic cleanup of expired entries
        this.cleanupTimer = setInterval(() => {
            this.cleanup();
        }, CONFIG.CLEANUP_INTERVAL_MS);

        // Key rotation
        this.keyRotationTimer = setInterval(() => {
            this.rotateEncryptionKey();
        }, CONFIG.KEY_ROTATION_MS);

        // Security monitoring
        this.securityTimer = setInterval(() => {
            this.performSecurityChecks();
        }, CONFIG.SECURITY_CHECK_INTERVAL_MS);
    }

    /**
     * Securely hash a key to prevent timing attacks and normalize keys
     */
    private secureHash(input: string): string {
        const salt = process.env.ENC_SECRET_SALT || "default-salt";
        return crypto
            .pbkdf2Sync(input, salt, 1000, 32, "sha256")
            .toString(CONFIG.ENCODING);
    }

    /**
     * Validate and sanitize cache key
     */
    private validateKey(key: string): string {
        if (!key || typeof key !== "string") {
            throw new Error("Cache key must be a non-empty string");
        }

        if (key.length > CONFIG.MAX_KEY_LENGTH) {
            throw new Error(
                `Cache key too long (max ${CONFIG.MAX_KEY_LENGTH} chars)`
            );
        }

        // Normalize and hash the key for security
        return this.secureHash(key);
    }

    /**
     * Compress data if beneficial
     */
    private async compressData(
        data: string
    ): Promise<{ data: string; compressed: boolean }> {
        if (data.length < CONFIG.COMPRESSION_THRESHOLD_BYTES) {
            return { data, compressed: false };
        }

        try {
            const deflate = promisify(zlib.deflate);
            const compressed = await deflate(Buffer.from(data, "utf8"));
            const compressedString = compressed.toString(CONFIG.ENCODING);

            // Only use compression if it actually saves space
            if (compressedString.length < data.length * 0.9) {
                return { data: compressedString, compressed: true };
            }
        } catch (error) {
            console.warn("Compression failed:", error);
        }

        return { data, compressed: false };
    }

    /**
     * Decompress data
     */
    private async decompressData(
        data: string,
        compressed: boolean
    ): Promise<string> {
        if (!compressed) return data;

        try {
            const inflate = promisify(zlib.inflate);
            const decompressed = await inflate(
                Buffer.from(data, CONFIG.ENCODING)
            );
            return decompressed.toString("utf8");
        } catch (error) {
            console.error("Decompression failed:", error);
            throw new Error("Data decompression failed");
        }
    }

    /**
     * Encrypt data with AES-256-GCM
     */
    private encryptData(data: string): {
        encrypted: string;
        iv: string;
        authTag: string;
    } {
        try {
            const iv = crypto.randomBytes(16);
            const cipher = crypto.createCipheriv(
                CONFIG.ALGORITHM,
                this.encryptionKey,
                iv
            );

            let encrypted = cipher.update(data, "utf8", CONFIG.ENCODING);
            encrypted += cipher.final(CONFIG.ENCODING);

            const authTag = cipher.getAuthTag().toString(CONFIG.ENCODING);

            return {
                encrypted,
                iv: iv.toString(CONFIG.ENCODING),
                authTag,
            };
        } catch (error: any) {
            this.emit("encryption_failure", {
                error: error.message,
                timestamp: Date.now(),
            });
            throw new Error("Encryption failed");
        }
    }

    /**
     * Decrypt data with AES-256-GCM
     */
    private decryptData(
        encrypted: string,
        iv: string,
        authTag: string
    ): string {
        try {
            const ivBuffer = Buffer.from(iv, CONFIG.ENCODING);
            const authTagBuffer = Buffer.from(authTag, CONFIG.ENCODING);

            const decipher = crypto.createDecipheriv(
                CONFIG.ALGORITHM,
                this.encryptionKey,
                ivBuffer
            );
            decipher.setAuthTag(authTagBuffer);

            let decrypted = decipher.update(encrypted, CONFIG.ENCODING, "utf8");
            decrypted += decipher.final("utf8");

            return decrypted;
        } catch (error) {
            throw new Error("Decryption failed - data may be corrupted");
        }
    }

    /**
     * Update LRU access order
     */
    private updateAccessOrder(key: string): void {
        const index = this.accessOrder.indexOf(key);
        if (index > -1) {
            this.accessOrder.splice(index, 1);
        }
        this.accessOrder.push(key);
    }

    /**
     * Track access patterns for security monitoring
     */
    private trackAccess(key: string): void {
        const now = Date.now();
        if (!this.accessPatterns.has(key)) {
            this.accessPatterns.set(key, []);
        }

        const accesses = this.accessPatterns.get(key)!;
        accesses.push(now);

        // Keep only recent accesses (last hour)
        const oneHourAgo = now - 60 * 60 * 1000;
        const recentAccesses = accesses.filter((time) => time > oneHourAgo);
        this.accessPatterns.set(key, recentAccesses);

        // Detect suspicious patterns (too many accesses)
        if (recentAccesses.length > 1000) {
            this.emit("suspicious_access", {
                key,
                count: recentAccesses.length,
                timestamp: now,
            });
        }
    }

    /**
     * Evict least recently used entries to free memory
     */
    private evictLRU(targetSize: number): void {
        while (
            this.stats.totalSize > targetSize &&
            this.accessOrder.length > 0
        ) {
            const oldestKey = this.accessOrder.shift()!;
            const entry = this.cache.get(oldestKey);

            if (entry) {
                this.cache.delete(oldestKey);
                this.stats.totalSize -= entry.size;
                this.stats.entryCount--;
                this.stats.evictions++;
            }
        }
    }

    /**
     * Update cache statistics
     */
    private updateStats(): void {
        this.stats.hitRate =
            this.stats.hits / Math.max(1, this.stats.hits + this.stats.misses);
        this.stats.memoryUsage.used = this.stats.totalSize;
        this.stats.memoryUsage.percentage =
            (this.stats.totalSize / this.stats.memoryUsage.limit) * 100;
    }

    /**
     * Set cache entry
     */
    public async set(
        key: string,
        value: CachedData,
        options: CacheOptions = {}
    ): Promise<boolean> {
        try {
            const normalizedKey = this.validateKey(key);
            const serialized = JSON.stringify(value);

            // Check value size
            if (serialized.length > CONFIG.MAX_VALUE_SIZE_MB * 1024 * 1024) {
                throw new Error(
                    `Value too large (max ${CONFIG.MAX_VALUE_SIZE_MB}MB)`
                );
            }

            // Compress if needed
            const { data: processedData, compressed } =
                options.compress !== false
                    ? await this.compressData(serialized)
                    : { data: serialized, compressed: false };

            // Encrypt data
            const { encrypted, iv, authTag } = this.encryptData(processedData);

            const now = Date.now();
            const ttl = options.ttl || CONFIG.CACHE_EXPIRY_MS;

            const entry: MemoryCacheEntry = {
                data: encrypted,
                iv,
                authTag,
                timestamp: now,
                expiresAt: now + ttl,
                accessCount: 0,
                lastAccessed: now,
                compressed,
                size: encrypted.length + iv.length + authTag.length + 200, // Approximate overhead
                version: 1,
            };

            // Check memory limits and evict if necessary
            const maxSize = CONFIG.MAX_CACHE_SIZE_MB * 1024 * 1024;
            if (
                this.stats.totalSize + entry.size > maxSize ||
                this.cache.size >= CONFIG.MAX_ENTRIES
            ) {
                this.evictLRU(maxSize * 0.8); // Keep 20% buffer
            }

            // Remove old entry if exists
            const oldEntry = this.cache.get(normalizedKey);
            if (oldEntry) {
                this.stats.totalSize -= oldEntry.size;
            } else {
                this.stats.entryCount++;
            }

            // Set new entry
            this.cache.set(normalizedKey, entry);
            this.stats.totalSize += entry.size;
            this.updateAccessOrder(normalizedKey);
            this.updateStats();

            return true;
        } catch (error) {
            console.error("Cache set error:", error);
            return false;
        }
    }

    /**
     * Get cache entry
     */
    public async get(key: string): Promise<CachedData | null> {
        try {
            const normalizedKey = this.validateKey(key);
            const entry = this.cache.get(normalizedKey);

            if (!entry) {
                this.stats.misses++;
                this.updateStats();
                return null;
            }

            const now = Date.now();

            // Check expiration
            if (now > entry.expiresAt) {
                this.cache.delete(normalizedKey);
                this.stats.totalSize -= entry.size;
                this.stats.entryCount--;
                this.stats.misses++;
                this.updateStats();
                return null;
            }

            // Update access tracking
            entry.accessCount++;
            entry.lastAccessed = now;
            this.updateAccessOrder(normalizedKey);
            this.trackAccess(normalizedKey);

            // Decrypt data
            const decrypted = this.decryptData(
                entry.data,
                entry.iv,
                entry.authTag
            );
            const decompressed = await this.decompressData(
                decrypted,
                entry.compressed
            );

            this.stats.hits++;
            this.updateStats();

            return JSON.parse(decompressed);
        } catch (error) {
            console.error("Cache get error:", error);
            this.stats.misses++;
            this.updateStats();
            return null;
        }
    }

    /**
     * Delete cache entry
     */
    public delete(key: string): boolean {
        try {
            const normalizedKey = this.validateKey(key);
            const entry = this.cache.get(normalizedKey);

            if (entry) {
                this.cache.delete(normalizedKey);
                this.stats.totalSize -= entry.size;
                this.stats.entryCount--;

                const index = this.accessOrder.indexOf(normalizedKey);
                if (index > -1) {
                    this.accessOrder.splice(index, 1);
                }

                this.updateStats();
                return true;
            }

            return false;
        } catch (error) {
            console.error("Cache delete error:", error);
            return false;
        }
    }

    /**
     * Check if key exists and is not expired
     */
    public has(key: string): boolean {
        try {
            const normalizedKey = this.validateKey(key);
            const entry = this.cache.get(normalizedKey);

            if (!entry) return false;

            if (Date.now() > entry.expiresAt) {
                this.delete(key);
                return false;
            }

            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Clear all cache entries
     */
    public clear(): void {
        this.cache.clear();
        this.accessOrder.length = 0;
        this.accessPatterns.clear();
        this.stats = {
            hits: 0,
            misses: 0,
            evictions: 0,
            totalSize: 0,
            entryCount: 0,
            hitRate: 0,
            memoryUsage: {
                used: 0,
                limit: CONFIG.MAX_CACHE_SIZE_MB * 1024 * 1024,
                percentage: 0,
            },
        };
    }

    /**
     * Get cache statistics
     */
    public get getStats(): CacheStats {
        this.updateStats();
        return { ...this.stats };
    }

    /**
     * Get cache size information
     */
    public get size(): { entries: number; bytes: number } {
        return {
            entries: this.cache.size,
            bytes: this.stats.totalSize,
        };
    }

    /**
     * Cleanup expired entries
     */
    private cleanup(): void {
        const now = Date.now();
        let cleaned = 0;

        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.expiresAt) {
                this.cache.delete(key);
                this.stats.totalSize -= entry.size;
                this.stats.entryCount--;
                cleaned++;

                const index = this.accessOrder.indexOf(key);
                if (index > -1) {
                    this.accessOrder.splice(index, 1);
                }
            }
        }

        if (cleaned > 0) {
            this.updateStats();
        }
    }

    /**
     * Rotate encryption key and re-encrypt all data
     */
    private async rotateEncryptionKey(): Promise<void> {
        try {
            const newKey = crypto.randomBytes(CONFIG.KEY_LENGTH);
            const oldKey = this.encryptionKey;

            // Decrypt all entries with old key and re-encrypt with new key
            const entries = Array.from(this.cache.entries());

            for (const [key, entry] of entries) {
                try {
                    // Decrypt with old key
                    this.encryptionKey = oldKey;
                    const decrypted = this.decryptData(
                        entry.data,
                        entry.iv,
                        entry.authTag
                    );

                    // Re-encrypt with new key
                    this.encryptionKey = newKey;
                    const { encrypted, iv, authTag } =
                        this.encryptData(decrypted);

                    // Update entry
                    entry.data = encrypted;
                    entry.iv = iv;
                    entry.authTag = authTag;
                } catch (error) {
                    console.error(`Failed to re-encrypt entry ${key}:`, error);
                    // Remove corrupted entry
                    this.cache.delete(key);
                    this.stats.totalSize -= entry.size;
                    this.stats.entryCount--;
                }
            }

            this.encryptionKey = newKey;
            this.emit("key_rotation", {
                timestamp: Date.now(),
                reason: "scheduled",
                entriesProcessed: entries.length,
            });
        } catch (error) {
            console.error("Key rotation failed:", error);
        }
    }

    /**
     * Perform security checks
     */
    private performSecurityChecks(): void {
        // Check memory pressure
        if (this.stats.memoryUsage.percentage > 90) {
            this.emit("memory_pressure", {
                usage: this.stats.memoryUsage,
                timestamp: Date.now(),
            });
            this.evictLRU(this.stats.memoryUsage.limit * 0.7);
        }

        // Check for cache overflow attempts
        if (this.cache.size > CONFIG.MAX_ENTRIES * 0.95) {
            this.emit("cache_overflow", {
                entries: this.cache.size,
                limit: CONFIG.MAX_ENTRIES,
                timestamp: Date.now(),
            });
        }
    }

    /**
     * Shutdown cache and cleanup resources
     */
    public shutdown(): void {
        if (this.cleanupTimer) clearInterval(this.cleanupTimer);
        if (this.keyRotationTimer) clearInterval(this.keyRotationTimer);
        if (this.securityTimer) clearInterval(this.securityTimer);

        this.clear();
        this.removeAllListeners();
        process.exit(1);
    }
}

export { SIMC as SecureInMemoryCache };
