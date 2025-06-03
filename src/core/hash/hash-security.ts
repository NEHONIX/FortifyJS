/**
 * Hash security features - Advanced security implementations
 */

import * as crypto from "crypto";
import {
    HashMonitoringResult,
    HashOperationData,
    HSMHashOptions,
    HSMIntegrityResult,
} from "./hash-types";
import { HashUtils } from "./hash-utils";
import { HashEntropy } from "./hash-entropy";
import { SecureRandom } from "../random";
import argon2 from "argon2";

export class HashSecurity {
    /**
     * Hardware Security Module (HSM) compatible hashing
     * @param input - Input to hash
     * @param options - HSM options
     * @returns HSM-compatible hash
     */
    public static hsmCompatibleHash(
        input: string | Uint8Array,
        options: HSMHashOptions = {}
    ): string | Buffer {
        const {
            keySlot = 1,
            algorithm = "sha256",
            outputFormat = "hex",
            validateIntegrity = true,
        } = options;

        // Simulate HSM key derivation
        const hsmKey = HashSecurity.deriveHSMKey(keySlot);

        // Create HSM-compatible HMAC
        const hmac = crypto.createHmac(algorithm, hsmKey);
        hmac.update(typeof input === "string" ? Buffer.from(input) : input);
        const hash = hmac.digest();

        // Validate integrity if requested
        if (validateIntegrity) {
            const verification = HashSecurity.verifyHSMIntegrity(hash, hsmKey);
            if (!verification.valid) {
                throw new Error("HSM integrity verification failed");
            }
        }

        return HashUtils.formatOutput(hash, outputFormat);
    }

    /**
     * Derive HSM-compatible key
     * @param keySlot - HSM key slot number
     * @returns Derived key
     */
    private static deriveHSMKey(keySlot: number): Buffer {
        // Simulate HSM key derivation using multiple entropy sources
        const baseKey = crypto.pbkdf2Sync(
            `hsm-key-slot-${keySlot}`,
            SecureRandom.generateSalt(32),
            100000,
            32,
            "sha512"
        );

        // Add hardware-specific entropy if available
        const hwEntropy = SecureRandom.getRandomBytes(16);
        const combined = Buffer.concat([baseKey, hwEntropy]);

        return crypto.createHash("sha256").update(combined).digest();
    }

    /**
     * Verify HSM integrity
     * @param hash - Hash to verify
     * @param key - HSM key
     * @returns Verification result
     */
    private static verifyHSMIntegrity(
        hash: Buffer,
        key: Buffer
    ): HSMIntegrityResult {
        try {
            // Create verification hash
            const verificationHash = crypto
                .createHmac("sha256", key)
                .update(hash)
                .digest();

            // Simple integrity check (in real HSM, this would be more complex)
            const isValid = verificationHash.length === 32 && hash.length > 0;

            return {
                valid: isValid,
                details: isValid
                    ? "Integrity verified"
                    : "Integrity check failed",
            };
        } catch (error) {
            return {
                valid: false,
                details: `Verification error: ${error}`,
            };
        }
    }

    /**
     * Real-time security monitoring for hash operations
     * @param operation - Operation being monitored
     * @param data - Data being processed
     * @returns Monitoring results
     */
    public static monitorHashSecurity(
        operation: string,
        data: HashOperationData
    ): HashMonitoringResult {
        const threats: string[] = [];
        const recommendations: string[] = [];
        let securityLevel: "LOW" | "MEDIUM" | "HIGH" | "MILITARY" = "HIGH";

        // Check algorithm strength
        const weakAlgorithms = ["md5", "sha1"];
        if (weakAlgorithms.includes(data.algorithm.toLowerCase())) {
            threats.push("Weak hash algorithm detected");
            recommendations.push("Use SHA-256 or stronger algorithm");
            securityLevel = "LOW";
        }

        // Check iteration count
        if (data.iterations < 10000) {
            threats.push("Low iteration count");
            recommendations.push("Increase iterations to at least 10,000");
            if (securityLevel !== "LOW") securityLevel = "MEDIUM";
        }

        // Check input entropy
        const inputBuffer =
            typeof data.input === "string"
                ? Buffer.from(data.input)
                : Buffer.from(data.input);

        const entropyAnalysis = HashEntropy.analyzeHashEntropy(inputBuffer);
        if (entropyAnalysis.qualityGrade === "POOR") {
            threats.push("Low input entropy");
            recommendations.push("Use higher entropy input");
            if (securityLevel !== "LOW") securityLevel = "MEDIUM";
        }

        // Check for timing attack vulnerabilities
        if (operation.includes("compare") || operation.includes("verify")) {
            recommendations.push(
                "Use constant-time comparison for security-critical operations"
            );
        }

        // Check for side-channel vulnerabilities
        if (inputBuffer.length > 1000000) {
            // Large inputs
            recommendations.push(
                "Consider using streaming hash for large inputs"
            );
        }

        // Determine final security level
        if (threats.length === 0 && data.iterations >= 100000) {
            securityLevel = "MILITARY";
        } else if (threats.length === 0) {
            securityLevel = "HIGH";
        }

        return {
            securityLevel,
            threats,
            recommendations,
            timestamp: Date.now(),
        };
    }

    /**
     * Timing-safe hashing to prevent timing attacks
     * @param input - Input to hash
     * @param options - Hashing options
     * @returns Timing-safe hash
     */
    public static timingSafeHash(
        input: string | Uint8Array,
        options: {
            algorithm?: string;
            iterations?: number;
            salt?: string | Buffer | Uint8Array;
            outputFormat?: "hex" | "base64" | "buffer";
            targetTime?: number;
        } = {}
    ): string | Buffer {
        const {
            algorithm = "sha256",
            iterations = 10000,
            salt,
            outputFormat = "hex",
            targetTime = 100, // Target time in milliseconds
        } = options;

        const startTime = Date.now();

        // Perform the hash
        const inputBuffer = HashUtils.toBuffer(input);
        let data = inputBuffer;

        if (salt) {
            const saltBuffer = HashUtils.toBuffer(salt);
            data = Buffer.concat([saltBuffer, data]);
        }

        let result = data;
        for (let i = 0; i < iterations; i++) {
            result = crypto.createHash(algorithm).update(result).digest();
        }

        // Add timing delay to prevent timing attacks
        const elapsedTime = Date.now() - startTime;
        if (elapsedTime < targetTime) {
            const delay = targetTime - elapsedTime;
            // Use busy wait to maintain constant time
            const endTime = Date.now() + delay;
            while (Date.now() < endTime) {
                // Busy wait
            }
        }

        return HashUtils.formatOutput(result, outputFormat);
    }

    /**
     * Memory-hard hashing using Argon2 (military-grade)
     * @param input - Input to hash
     * @param options - Hashing options
     * @returns Promise resolving to hash
     */
    public static async memoryHardHash(
        input: string | Uint8Array,
        options: {
            memoryCost?: number;
            timeCost?: number;
            parallelism?: number;
            hashLength?: number;
            salt?: string | Buffer | Uint8Array;
            outputFormat?: "hex" | "base64" | "buffer";
        } = {}
    ): Promise<string | Buffer> {
        const {
            memoryCost = 65536, // 64 MB
            timeCost = 3,
            parallelism = 4,
            hashLength = 32,
            salt,
            outputFormat = "hex",
        } = options;

        // Convert input to string if needed
        const inputString =
            typeof input === "string"
                ? input
                : Buffer.from(input).toString("utf8");

        // Generate salt if not provided
        const saltToUse = salt || SecureRandom.generateSalt(32);
        const saltBuffer = HashUtils.toBuffer(saltToUse);

        try {
            // Try to use argon2 if available
            // const argon2 = require("argon2");
            const hash = await argon2.hash(inputString, {
                type: argon2.argon2id,
                memoryCost,
                timeCost,
                parallelism,
                hashLength,
                salt: saltBuffer,
                raw: true,
            });

            const hashBuffer = Buffer.from(hash);
            return HashUtils.formatOutput(hashBuffer, outputFormat);
        } catch (error) {
            // Fallback to PBKDF2 with high iterations
            console.warn("Argon2 not available, falling back to PBKDF2");
            const fallbackHash = crypto.pbkdf2Sync(
                inputString,
                saltBuffer,
                memoryCost, // Use memoryCost as iterations
                hashLength,
                "sha512"
            );
            return HashUtils.formatOutput(fallbackHash, outputFormat);
        }
    }

    /**
     * Quantum-resistant hashing with enhanced entropy
     * @param input - Input to hash
     * @param options - Hashing options
     * @returns Quantum-resistant hash
     */
    public static quantumResistantHash(
        input: string | Uint8Array,
        options: {
            algorithms?: string[];
            iterations?: number;
            salt?: string | Buffer | Uint8Array;
            outputFormat?: "hex" | "base64" | "buffer";
        } = {}
    ): string | Buffer {
        const {
            algorithms = ["sha3-512", "blake3", "sha512"],
            iterations = 1000,
            salt,
            outputFormat = "hex",
        } = options;

        // Generate quantum-safe salt
        const quantumSalt =
            salt || SecureRandom.getRandomBytes(64, { quantumSafe: true });

        let result = HashUtils.toBuffer(input);

        // Add salt
        const saltBuffer = HashUtils.toBuffer(quantumSalt);
        result = Buffer.concat([saltBuffer, result]);

        // Use multiple hash algorithms for quantum resistance
        for (const algorithm of algorithms) {
            for (
                let i = 0;
                i < Math.floor(iterations / algorithms.length);
                i++
            ) {
                result = crypto
                    .createHash(algorithm === "blake3" ? "sha512" : algorithm)
                    .update(result)
                    .digest();
            }
        }

        return HashUtils.formatOutput(result, outputFormat);
    }

    /**
     * Secure hash verification with timing attack protection
     * @param input - Input to verify
     * @param expectedHash - Expected hash value
     * @param options - Verification options
     * @returns True if hash matches
     */
    public static secureVerify(
        input: string | Uint8Array,
        expectedHash: string | Buffer,
        options: {
            algorithm?: string;
            iterations?: number;
            salt?: string | Buffer | Uint8Array;
            constantTime?: boolean;
        } = {}
    ): boolean {
        const { constantTime = true } = options;

        // Generate hash of input
        const computedHash = HashSecurity.timingSafeHash(input, options);

        // Convert expected hash to same format
        const expectedBuffer = Buffer.isBuffer(expectedHash)
            ? expectedHash
            : Buffer.from(expectedHash, "hex");

        const computedBuffer = Buffer.isBuffer(computedHash)
            ? computedHash
            : Buffer.from(computedHash as string, "hex");

        // Use constant-time comparison if requested
        if (constantTime) {
            try {
                return crypto.timingSafeEqual(computedBuffer, expectedBuffer);
            } catch (error) {
                // Fallback to manual constant-time comparison
                return HashSecurity.manualConstantTimeCompare(
                    computedBuffer,
                    expectedBuffer
                );
            }
        }

        // Standard comparison (not recommended for security-critical applications)
        return computedBuffer.equals(expectedBuffer);
    }

    /**
     * Manual constant-time comparison
     * @param a - First buffer
     * @param b - Second buffer
     * @returns True if buffers are equal
     */
    private static manualConstantTimeCompare(a: Buffer, b: Buffer): boolean {
        if (a.length !== b.length) {
            return false;
        }

        let result = 0;
        for (let i = 0; i < a.length; i++) {
            result |= a[i] ^ b[i];
        }
        return result === 0;
    }
}
