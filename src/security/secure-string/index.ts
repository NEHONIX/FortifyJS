/**
 * SecureString Modular Architecture
 * Main export file for the refactored SecureString
 */

import { SecureString } from "./core/secure-string-core";
import { SecureStringOptions, ValidationResult } from "./types";

// Export the main SecureString class
export { SecureString } from "./core/secure-string-core";

// Export types and interfaces
export type {
    SecureStringOptions,
    SecureStringEvent,
    SecureStringEventListener,
    StringOperation,
    ComparisonResult,
    SearchOptions,
    SplitOptions,
    HashOperationOptions,
    HMACOperationOptions,
    KeyDerivationOptions,
    ValidationResult,
    StringStatistics,
    TransformationOptions,
    MemoryUsage,
    HashAlgorithm,
    HashOutputFormat,
    HMACAlgorithm,
    HMACOptions,
    PBKDF2Options,
} from "./types";

// Import types for internal use
import type { HashAlgorithm, HashOutputFormat } from "./types";

// Export modular components for advanced usage
export { BufferManager } from "./buffer/buffer-manager";
export { StringOperations } from "./operations/string-operations";
export { ComparisonOperations } from "./operations/comparison-operations";
export { CryptoOperations } from "./crypto/crypto-operations";
export { StringValidator } from "./validation/string-validator";

// Export constants
export {
    DEFAULT_SECURE_STRING_OPTIONS,
    DEFAULT_SEARCH_OPTIONS,
    DEFAULT_SPLIT_OPTIONS,
} from "./types";

/**
 * Re-export for backward compatibility
 */
export { SecureString as default } from "./core/secure-string-core";

/**
 * Factory functions for common use cases
 */

/**
 * Creates a new SecureString with default settings
 */
export function createSecureString(
    value: string = "",
    options?: SecureStringOptions
): SecureString {
    const { SecureString } = require("./core/secure-string-core");
    return new SecureString(value, options);
}

/**
 * Creates a SecureString with enhanced protection
 */
export function createEnhancedSecureString(
    value: string = "",
    customOptions?: Partial<SecureStringOptions>
): SecureString {
    const { SecureString } = require("./core/secure-string-core");
    const enhancedOptions: SecureStringOptions = {
        protectionLevel: "enhanced",
        enableEncryption: true,
        enableCanaries: true,
        enableObfuscation: true,
        ...customOptions,
    };
    return new SecureString(value, enhancedOptions);
}

/**
 * Creates a SecureString with maximum protection
 */
export function createMaximumSecureString(
    value: string = "",
    customOptions?: Partial<SecureStringOptions>
): SecureString {
    const { SecureString } = require("./core/secure-string-core");
    const maximumOptions: SecureStringOptions = {
        protectionLevel: "maximum",
        enableEncryption: true,
        enableFragmentation: true,
        enableCanaries: true,
        enableObfuscation: true,
        autoLock: true,
        quantumSafe: true,
        ...customOptions,
    };
    return new SecureString(value, maximumOptions);
}

/**
 * Creates a SecureString from a buffer
 */
export function createSecureStringFromBuffer(
    buffer: Uint8Array,
    options?: SecureStringOptions,
    encoding: string = "utf-8"
): SecureString {
    const { SecureString } = require("./core/secure-string-core");
    return SecureString.fromBuffer(buffer, options, encoding);
}

/**
 * Creates a SecureString from another SecureString (clone)
 */
export function cloneSecureString(source: SecureString): SecureString {
    const { SecureString } = require("./core/secure-string-core");
    return SecureString.from(source);
}

/**
 * Creates a temporary SecureString that auto-destroys after use
 */
export function createTemporarySecureString(
    value: string,
    options?: SecureStringOptions
): SecureString {
    const { SecureString } = require("./core/secure-string-core");
    const tempString = new SecureString(value, options);

    // Auto-destroy after a timeout (default 5 minutes)
    setTimeout(() => {
        if (!tempString.isDestroyed()) {
            tempString.destroy();
        }
    }, 5 * 60 * 1000);

    return tempString;
}

/**
 * Utility functions
 */

/**
 * Compares two strings in constant time
 */
export function constantTimeCompare(str1: string, str2: string): boolean {
    const { ComparisonOperations } = require("./operations/comparison-operations");
    return ComparisonOperations.constantTimeEquals(str1, str2).isEqual;
}

/**
 * Calculates string similarity
 */
export function calculateStringSimilarity(
    str1: string,
    str2: string,
    algorithm: 'levenshtein' | 'jaro' | 'jaro-winkler' = 'levenshtein'
): number {
    const { ComparisonOperations } = require("./operations/comparison-operations");
    return ComparisonOperations.fuzzyMatch(str1, str2, algorithm);
}

/**
 * Validates a password with default requirements
 */
export function validatePassword(password: string): ValidationResult {
    const { StringValidator } = require("./validation/string-validator");
    return StringValidator.validatePassword(password);
}

/**
 * Validates an email address
 */
export function validateEmail(email: string): ValidationResult {
    const { StringValidator } = require("./validation/string-validator");
    return StringValidator.validateEmail(email);
}

/**
 * Generates a cryptographically secure salt
 */
export function generateSalt(length: number = 32, format: HashOutputFormat = "hex") {
    const { CryptoOperations } = require("./crypto/crypto-operations");
    if (format === "uint8array") {
        return CryptoOperations.generateSalt(length);
    } else if (format === "base64") {
        return CryptoOperations.generateSaltBase64(length);
    } else {
        return CryptoOperations.generateSaltHex(length);
    }
}

/**
 * Hashes a string with the specified algorithm
 */
export async function hashString(
    content: string,
    algorithm: HashAlgorithm = "SHA-256",
    format: HashOutputFormat = "hex"
): Promise<string | Uint8Array> {
    const { CryptoOperations } = require("./crypto/crypto-operations");
    return CryptoOperations.hash(content, algorithm, format);
}

/**
 * Version information
 */
export const SECURE_STRING_VERSION = "2.0.0-modular";

/**
 * Module information for debugging
 */
export const MODULE_INFO = {
    version: SECURE_STRING_VERSION,
    architecture: "modular",
    components: [
        "core/secure-string-core",
        "buffer/buffer-manager",
        "operations/string-operations",
        "operations/comparison-operations",
        "crypto/crypto-operations",
        "validation/string-validator",
    ],
    features: [
        "Modular architecture",
        "Enhanced buffer management",
        "Constant-time comparisons",
        "Advanced string operations",
        "Cryptographic operations",
        "String validation",
        "Event system",
        "Memory protection",
        "Multiple protection levels",
    ],
} as const;

/**
 * Gets information about the modular SecureString
 */
export function getModuleInfo() {
    return MODULE_INFO;
}

/**
 * Gets supported algorithms
 */
export function getSupportedAlgorithms() {
    const { CryptoOperations } = require("./crypto/crypto-operations");
    return {
        hash: CryptoOperations.getSupportedHashAlgorithms(),
        hmac: CryptoOperations.getSupportedHMACAlgorithms(),
        algorithms: CryptoOperations.getAlgorithmInfo(),
    };
}
