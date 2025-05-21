import { EntropySource, SecurityLevel } from "../types";
import { CHAR_SETS, ERROR_MESSAGES } from "../utils/constants";
import { StatsTracker } from "../utils/stats";
import nodeCrypto from "crypto";

/**
 * Secure random number generation with multiple fallback mechanisms
 */
export class SecureRandom {
    /**
     * Check if cryptographically secure random number generation is available
     * @returns True if secure random is available
     */
    public static isSecureRandomAvailable(): boolean {
        return (
            // Node.js crypto
            (typeof crypto !== "undefined" &&
                typeof crypto.getRandomValues === "function") ||
            // Browser crypto
            (typeof window !== "undefined" &&
                typeof window.crypto !== "undefined" &&
                typeof window.crypto.getRandomValues === "function") ||
            // Node.js require
            (typeof require === "function" &&
                (() => {
                    try {
                        import("crypto");
                        return true;
                    } catch (e) {
                        return false;
                    }
                })())
        );
    }

    /**
     * Generate cryptographically secure random bytes
     * @param length - Number of bytes to generate
     * @returns Random bytes as Uint8Array
     */
    public static getRandomBytes(length: number): Uint8Array {
        if (length <= 0) {
            throw new Error(ERROR_MESSAGES.INVALID_LENGTH);
        }

        const bytes = new Uint8Array(length);

        // Try different methods to get random bytes
        if (
            typeof crypto !== "undefined" &&
            typeof crypto.getRandomValues === "function"
        ) {
            // Browser or Node.js with Web Crypto API
            crypto.getRandomValues(bytes);
            return bytes;
        } else if (
            typeof window !== "undefined" &&
            typeof window.crypto !== "undefined" &&
            typeof window.crypto.getRandomValues === "function"
        ) {
            // Browser
            window.crypto.getRandomValues(bytes);
            return bytes;
        } else if (typeof require === "function") {
            try {
                // Node.js
                // const nodeCrypto = require("crypto");
                const nodeRandomBytes = nodeCrypto.randomBytes(length);
                return new Uint8Array(
                    nodeRandomBytes.buffer,
                    nodeRandomBytes.byteOffset,
                    nodeRandomBytes.byteLength
                );
            } catch (e) {
                // Fallback to non-secure random
                return SecureRandom.getFallbackRandomBytes(length);
            }
        } else {
            // Fallback to non-secure random
            return SecureRandom.getFallbackRandomBytes(length);
        }
    }

    /**
     * Fallback method for generating random bytes (less secure)
     * @param length - Number of bytes to generate
     * @returns Random bytes as Uint8Array
     */
    private static getFallbackRandomBytes(length: number): Uint8Array {
        console.warn(ERROR_MESSAGES.CRYPTO_UNAVAILABLE);

        const bytes = new Uint8Array(length);

        // Use multiple entropy sources to improve randomness
        const now = Date.now();
        const performanceTime =
            typeof performance !== "undefined" ? performance.now() : 0;

        // Seed the random generator with current time
        let seed = now + performanceTime;

        for (let i = 0; i < length; i++) {
            // Simple xorshift algorithm for better distribution
            seed ^= seed << 13;
            seed ^= seed >> 17;
            seed ^= seed << 5;

            // Mix with Math.random()
            const r = Math.random() * 256;
            bytes[i] = Math.floor((seed + r) % 256);
        }

        return bytes;
    }

    /**
     * Generate a random integer within a range
     * @param min - Minimum value (inclusive)
     * @param max - Maximum value (inclusive)
     * @returns Random integer
     */
    public static getRandomInt(min: number, max: number): number {
        if (min > max) {
            throw new Error("Min cannot be greater than max");
        }

        const range = max - min + 1;
        const bytesNeeded = Math.ceil(Math.log2(range) / 8);
        const maxValue = 2 ** (bytesNeeded * 8);
        const cutoff = maxValue - (maxValue % range);

        let randomValue: number;
        let bytes: Uint8Array;

        // Generate random bytes until we get a value below the cutoff
        do {
            bytes = SecureRandom.getRandomBytes(bytesNeeded);
            randomValue = 0;

            for (let i = 0; i < bytesNeeded; i++) {
                randomValue = (randomValue << 8) | bytes[i];
            }
        } while (randomValue >= cutoff);

        return min + (randomValue % range);
    }

    /**
     * Generate a random string from a character set
     * @param length - Length of the string to generate
     * @param charset - Character set to use
     * @returns Random string
     */
    public static getRandomString(length: number, charset: string): string {
        if (length <= 0) {
            throw new Error(ERROR_MESSAGES.INVALID_LENGTH);
        }

        if (!charset || charset.length === 0) {
            throw new Error("Character set cannot be empty");
        }

        const startTime = Date.now();
        let result = "";

        // Calculate entropy bits
        const entropyPerChar = Math.log2(charset.length);
        const totalEntropyBits = entropyPerChar * length;

        // Generate random bytes
        const randomBytes = SecureRandom.getRandomBytes(length);

        // Convert random bytes to characters
        for (let i = 0; i < length; i++) {
            const index = randomBytes[i] % charset.length;
            result += charset[index];
        }

        // Track statistics
        const endTime = Date.now();
        StatsTracker.getInstance().trackTokenGeneration(
            endTime - startTime,
            totalEntropyBits
        );

        return result;
    }

    /**
     * Generate a secure token with specified options
     * @param length - Length of the token
     * @param options - Token generation options
     * @returns Secure random token
     */
    public static generateSecureToken(
        length: number,
        options: {
            includeUppercase?: boolean;
            includeLowercase?: boolean;
            includeNumbers?: boolean;
            includeSymbols?: boolean;
            excludeSimilarCharacters?: boolean;
            entropyLevel?: SecurityLevel;
        } = {}
    ): string {
        if (length <= 0) {
            throw new Error(ERROR_MESSAGES.INVALID_LENGTH);
        }

        const {
            includeUppercase = true,
            includeLowercase = true,
            includeNumbers = true,
            includeSymbols = false,
            excludeSimilarCharacters = false,
            entropyLevel = SecurityLevel.HIGH,
        } = options;

        // Build character set based on options
        let charset = "";

        if (includeUppercase) {
            charset += CHAR_SETS.UPPERCASE;
        }

        if (includeLowercase) {
            charset += CHAR_SETS.LOWERCASE;
        }

        if (includeNumbers) {
            charset += CHAR_SETS.NUMBERS;
        }

        if (includeSymbols) {
            charset += CHAR_SETS.SYMBOLS;
        }

        if (charset.length === 0) {
            throw new Error("At least one character set must be included");
        }

        // Remove similar characters if requested
        if (excludeSimilarCharacters) {
            for (const char of CHAR_SETS.SIMILAR_CHARS) {
                charset = charset.replace(char, "");
            }
        }

        // Adjust length based on entropy level
        let adjustedLength = length;
        if (entropyLevel === SecurityLevel.MAXIMUM) {
            // Increase length by 25% for maximum entropy
            adjustedLength = Math.ceil(length * 1.25);
        }

        return SecureRandom.getRandomString(adjustedLength, charset);
    }

    /**
     * Get the entropy source being used
     * @returns The current entropy source
     */
    public static getEntropySource(): EntropySource {
        if (
            typeof crypto !== "undefined" &&
            typeof crypto.getRandomValues === "function"
        ) {
            return EntropySource.CSPRNG;
        } else if (
            typeof window !== "undefined" &&
            typeof window.crypto !== "undefined" &&
            typeof window.crypto.getRandomValues === "function"
        ) {
            return EntropySource.CSPRNG;
        } else if (typeof require === "function") {
            try {
                import("crypto");
                return EntropySource.CSPRNG;
            } catch (e) {
                return EntropySource.MATH_RANDOM;
            }
        } else {
            return EntropySource.MATH_RANDOM;
        }
    }
}
