import * as crypto from "crypto";

const CONFIG = {
    CACHE_EXPIRY_MS: 10 * 60 * 1000, // 10 minutes default TTL
    KEY_ROTATION_MS: 10 * 24 * 60 * 60 * 1000, // 10 days
    ALGORITHM: "aes-256-gcm" as const,
    ENCODING: "hex" as crypto.BinaryToTextEncoding,
    KEY_ITERATIONS: 100000,
    KEY_LENGTH: 32,
    MAX_CACHE_SIZE_MB: 100, // Maximum memory usage
    MAX_ENTRIES: 10000, // Maximum number of cache entries
    COMPRESSION_THRESHOLD_BYTES: 1024,
    CLEANUP_INTERVAL_MS: 5 * 60 * 1000, // Cleanup every 5 minutes
    SECURITY_CHECK_INTERVAL_MS: 60 * 1000, // Security checks every minute
    MAX_KEY_LENGTH: 512, // Prevent DoS via large keys
    MAX_VALUE_SIZE_MB: 10, // Maximum size per cache entry
};

export { CONFIG };
