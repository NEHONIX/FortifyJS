/**
 * Type definitions for the FortifyJS library
 */

/**
 * Security level enum
 */
export enum SecurityLevel {
    STANDARD = "standard",
    HIGH = "high",
    MAXIMUM = "maximum",
}

/**
 * Token type enum
 */
export enum TokenType {
    GENERAL = "general",
    API_KEY = "api_key",
    SESSION = "session",
    JWT = "jwt",
    TOTP = "totp",
}

/**
 * Hash algorithm enum
 */
export enum HashAlgorithm {
    SHA256 = "sha256",
    SHA512 = "sha512",
    SHA3 = "sha3",
    BLAKE3 = "blake3",
}

/**
 * Key derivation algorithm enum
 */
export enum KeyDerivationAlgorithm {
    PBKDF2 = "pbkdf2",
    ARGON2 = "argon2",
    BALLOON = "balloon",
}

/**
 * Output format enum
 */
export enum OutputFormat {
    HEX = "hex",
    BASE64 = "base64",
    BUFFER = "buffer",
}

/**
 * Entropy source enum
 */
export enum EntropySource {
    SYSTEM = "system",
    BROWSER = "browser",
    USER = "user",
    NETWORK = "network",
    COMBINED = "combined",
    CSPRNG = "csprng",
    MATH_RANDOM = "math_random",
    CUSTOM = "custom",
}

/**
 * Secure token options
 */
export interface SecureTokenOptions {
    /**
     * Length of the token
     * @default 32
     */
    length?: number;

    /**
     * Include uppercase letters
     * @default true
     */
    includeUppercase?: boolean;

    /**
     * Include lowercase letters
     * @default true
     */
    includeLowercase?: boolean;

    /**
     * Include numbers
     * @default true
     */
    includeNumbers?: boolean;

    /**
     * Include symbols
     * @default false
     */
    includeSymbols?: boolean;

    /**
     * Exclude similar characters (e.g., 1, l, I, 0, O)
     * @default false
     */
    excludeSimilarCharacters?: boolean;

    /**
     * Entropy level
     * @default 'high'
     */
    entropy?: string;
}

/**
 * Hash options
 */
export interface HashOptions {
    /**
     * Salt for the hash
     * If not provided, a random salt will be generated
     */
    salt?: string | Uint8Array;

    /**
     * Pepper for the hash (secret server-side value)
     */
    pepper?: string | Uint8Array;

    /**
     * Number of iterations
     * @default 10000
     */
    iterations?: number;

    /**
     * Hash algorithm
     * @default 'sha256'
     */
    algorithm?: HashAlgorithm | string;

    /**
     * Output format
     * @default 'hex'
     */
    outputFormat?: OutputFormat | string;

    /**
     * Output length in bytes
     * @default 32
     */
    outputLength?: number;
}

/**
 * Key derivation options
 */
export interface KeyDerivationOptions {
    /**
     * Salt for key derivation
     * If not provided, a random salt will be generated
     */
    salt?: string | Uint8Array;

    /**
     * Number of iterations
     * @default 100000
     */
    iterations?: number;

    /**
     * Key derivation algorithm
     * @default 'pbkdf2'
     */
    algorithm?: KeyDerivationAlgorithm | string;

    /**
     * Hash function to use (for PBKDF2)
     * @default 'sha256'
     */
    hashFunction?: HashAlgorithm | string;

    /**
     * Output length in bytes
     * @default 32
     */
    keyLength?: number;

    /**
     * Memory cost for memory-hard functions (in KB)
     * @default 65536 (64 MB)
     */
    memoryCost?: number;

    /**
     * Parallelism factor for memory-hard functions
     * @default 4
     */
    parallelism?: number;
}

/**
 * API key options
 */
export interface APIKeyOptions {
    /**
     * Prefix for the API key
     * @default ''
     */
    prefix?: string;

    /**
     * Include timestamp in the API key
     * @default true
     */
    includeTimestamp?: boolean;

    /**
     * Length of the random part
     * @default 32
     */
    randomPartLength?: number;

    /**
     * Separator between parts
     * @default '_'
     */
    separator?: string;
}

/**
 * Session token options
 */
export interface SessionTokenOptions {
    /**
     * User ID to include in the token
     */
    userId?: string | number;

    /**
     * IP address to include in the token
     */
    ipAddress?: string;

    /**
     * User agent to include in the token
     */
    userAgent?: string;

    /**
     * Expiration time in seconds
     * @default 3600 (1 hour)
     */
    expiresIn?: number;
}

/**
 * Middleware options
 */
export interface MiddlewareOptions {
    /**
     * Enable CSRF protection
     * @default true
     */
    csrfProtection?: boolean;

    /**
     * Enable secure headers
     * @default true
     */
    secureHeaders?: boolean;

    /**
     * Enable rate limiting
     * @default true
     */
    rateLimit?: boolean;

    /**
     * Maximum requests per minute
     * @default 100
     */
    maxRequestsPerMinute?: number;

    /**
     * Secret for token generation
     * If not provided, a random secret will be generated
     */
    tokenSecret?: string;

    /**
     * Name of the CSRF cookie
     * @default 'fortify_csrf'
     */
    cookieName?: string;

    /**
     * Name of the CSRF header
     * @default 'X-CSRF-Token'
     */
    headerName?: string;

    /**
     * Paths to exclude from CSRF protection
     * @default ['/api/health', '/api/status']
     */
    excludePaths?: string[];

    /**
     * Whether to log requests
     * @default true
     */
    logRequests?: boolean;

    /**
     * Logger to use
     * @default console
     */
    logger?: Console;

    /**
     * Content Security Policy header value
     * @default "default-src 'self'; script-src 'self'; object-src 'none'; frame-ancestors 'none'"
     */
    contentSecurityPolicy?: string;
}

/**
 * Crypto stats
 */
export interface CryptoStats {
    /**
     * Number of tokens generated
     */
    tokensGenerated: number;

    /**
     * Number of hashes computed
     */
    hashesComputed: number;

    /**
     * Number of keys derived
     */
    keysDerivated: number;

    /**
     * Average entropy in bits
     */
    averageEntropyBits: number;

    /**
     * Timestamp of the last operation
     */
    lastOperationTime: string;

    /**
     * Performance metrics
     */
    performance: {
        /**
         * Average token generation time in milliseconds
         */
        tokenGenerationAvgMs: number;

        /**
         * Average hash computation time in milliseconds
         */
        hashComputationAvgMs: number;

        /**
         * Average key derivation time in milliseconds
         */
        keyDerivationAvgMs: number;
    };

    /**
     * Memory usage metrics
     */
    memory: {
        /**
         * Average memory usage in bytes
         */
        averageUsageBytes: number;

        /**
         * Peak memory usage in bytes
         */
        peakUsageBytes: number;
    };
}

/**
 * Security test result
 */
export interface SecurityTestResult {
    /**
     * Whether all tests passed
     */
    passed: boolean;

    /**
     * Test results
     */
    results: {
        /**
         * Random number generation test
         */
        randomness: {
            passed: boolean;
            details: any;
        };

        /**
         * Hash function test
         */
        hashing: {
            passed: boolean;
            details: any;
        };

        /**
         * Timing attack resistance test
         */
        timingAttacks: {
            passed: boolean;
            details: any;
        };
    };
}

/**
 * Password strength result
 */
export interface PasswordStrengthResult {
    /**
     * Password strength score (0-100)
     */
    score: number;

    /**
     * Feedback messages
     */
    feedback: string[];

    /**
     * Estimated time to crack
     */
    estimatedCrackTime: string;

    /**
     * Detailed analysis
     */
    analysis: {
        /**
         * Length score
         */
        length: number;

        /**
         * Entropy score
         */
        entropy: number;

        /**
         * Character variety score
         */
        variety: number;

        /**
         * Pattern penalty
         */
        patterns: number;
    };
}
