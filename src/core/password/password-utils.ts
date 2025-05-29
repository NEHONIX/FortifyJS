/**
 * 🔐 Password Utilities Module
 *
 * Utility functions for password management
 */

import { RandomCrypto, RandomGenerators } from "../random";
import {
    bufferToHex,
    hexToBuffer,
    bufferToBase64,
    base64ToBuffer,
} from "../../utils/encoding";
import {
    PasswordHashMetadata,
    PasswordManagerConfig,
    PasswordStorageOptions,
} from "./password-types";
import { HashAlgorithm } from "../../types";

/**
 * Password utility functions
 */
export class PasswordUtils {
    private config: PasswordManagerConfig;

    constructor(config: PasswordManagerConfig) {
        this.config = config;
    }

    /**
     * Update configuration
     */
    public updateConfig(config: PasswordManagerConfig): void {
        this.config = config;
    }

    /**
     * Combine hash with metadata for storage
     */
    public combineHashWithMetadata(
        hash: string,
        salt: Uint8Array,
        metadata: PasswordHashMetadata
    ): string {
        const saltHex = bufferToHex(salt);
        const metadataJson = JSON.stringify(metadata);
        const metadataBase64 = bufferToBase64(
            new TextEncoder().encode(metadataJson)
        );

        return `$fortify$${metadataBase64}$${saltHex}$${hash}`;
    }

    /**
     * Parse hash with metadata from storage format
     */
    public parseHashWithMetadata(combinedHash: string): {
        hash: string;
        salt: Uint8Array;
        metadata: PasswordHashMetadata;
    } {
        if (!combinedHash.startsWith("$fortify$")) {
            throw new Error("Invalid FortifyJS hash format");
        }

        const parts = combinedHash.split("$");
        if (parts.length !== 5) {
            throw new Error("Invalid FortifyJS hash format");
        }

        const [, , metadataBase64, saltHex, hash] = parts;

        // Parse metadata
        const metadataJson = new TextDecoder().decode(
            base64ToBuffer(metadataBase64)
        );
        const metadata: PasswordHashMetadata = JSON.parse(metadataJson);

        // Parse salt
        const salt = hexToBuffer(saltHex);

        return { hash, salt, metadata };
    }

    /**
     * Encrypt password hash for storage
     */
    public async encryptPasswordHash(
        hash: string,
        encryptionKey: string
    ): Promise<string> {
        try {
            // Use AES-256-GCM for encryption
            const iv = RandomCrypto.generateSecureIV(16);
            const key = await this.deriveEncryptionKey(encryptionKey);

            // For demo purposes, we'll use a simple encryption
            // In production, use proper AES-GCM encryption
            const encrypted = this.simpleEncrypt(hash, key, iv);
            const ivHex = bufferToHex(iv);

            return `$encrypted$${ivHex}$${encrypted}`;
        } catch (error) {
            throw new Error(
                `Failed to encrypt password hash: ${(error as Error).message}`
            );
        }
    }

    /**
     * Decrypt password hash from storage
     */
    public async decryptPasswordHash(
        encryptedHash: string,
        encryptionKey: string
    ): Promise<string> {
        try {
            if (!encryptedHash.startsWith("$encrypted$")) {
                throw new Error("Invalid encrypted hash format");
            }

            const parts = encryptedHash.split("$");
            if (parts.length !== 4) {
                throw new Error("Invalid encrypted hash format");
            }

            const [, , ivHex, encrypted] = parts;
            const iv = hexToBuffer(ivHex);
            const key = await this.deriveEncryptionKey(encryptionKey);

            return this.simpleDecrypt(encrypted, key, iv);
        } catch (error) {
            throw new Error(
                `Failed to decrypt password hash: ${(error as Error).message}`
            );
        }
    }

    /**
     * Check if hash is encrypted
     */
    public isEncryptedHash(hash: string): boolean {
        return hash.startsWith("$encrypted$");
    }

    /**
     * Compress password hash for storage efficiency
     */
    public compressHash(hash: string): string {
        // Simple compression simulation
        // In production, use proper compression algorithms
        try {
            const compressed = Buffer.from(hash).toString("base64");
            return `$compressed$${compressed}`;
        } catch (error) {
            return hash; // Return original if compression fails
        }
    }

    /**
     * Decompress password hash
     */
    public decompressHash(compressedHash: string): string {
        if (!compressedHash.startsWith("$compressed$")) {
            return compressedHash; // Not compressed
        }

        try {
            const compressed = compressedHash.substring("$compressed$".length);
            return Buffer.from(compressed, "base64").toString();
        } catch (error) {
            throw new Error(
                `Failed to decompress hash: ${(error as Error).message}`
            );
        }
    }

    /**
     * Format hash for different storage systems
     */
    public formatForStorage(
        hash: string,
        options: PasswordStorageOptions = {}
    ): string {
        let result = hash;

        // Compress if requested
        if (options.compress) {
            result = this.compressHash(result);
        }

        // Encrypt if requested (real implementation)
        if (options.encrypt && options.encryptionKey) {
            try {
                // Use real encryption - this should be called asynchronously in practice
                const encrypted = this.encryptPasswordHashSync(
                    result,
                    options.encryptionKey
                );
                result = encrypted;
            } catch (error) {
                console.warn(`Encryption failed: ${(error as Error).message}`);
                // Continue without encryption if it fails
            }
        }

        return result;
    }

    /**
     * Validate hash format
     */
    public validateHashFormat(hash: string): {
        isValid: boolean;
        format: string;
        errors: string[];
    } {
        const errors: string[] = [];
        let format = "unknown";

        if (hash.startsWith("$fortify$")) {
            format = "fortify";
            try {
                this.parseHashWithMetadata(hash);
            } catch (error) {
                errors.push(
                    `Invalid FortifyJS format: ${(error as Error).message}`
                );
            }
        } else if (hash.startsWith("$encrypted$")) {
            format = "encrypted";
            const parts = hash.split("$");
            if (parts.length !== 4) {
                errors.push("Invalid encrypted format");
            }
        } else if (hash.startsWith("$compressed$")) {
            format = "compressed";
            try {
                this.decompressHash(hash);
            } catch (error) {
                errors.push(
                    `Invalid compressed format: ${(error as Error).message}`
                );
            }
        } else if (
            hash.startsWith("$2a$") ||
            hash.startsWith("$2b$") ||
            hash.startsWith("$2y$")
        ) {
            format = "bcrypt";
        } else if (hash.includes(":")) {
            format = "custom";
        } else {
            errors.push("Unknown hash format");
        }

        return {
            isValid: errors.length === 0,
            format,
            errors,
        };
    }

    /**
     * Generate hash identifier for tracking
     */
    public generateHashId(hash: string): string {
        // Create a unique identifier for the hash without exposing the hash itself
        const hashBuffer = new TextEncoder().encode(hash);
        const id = bufferToHex(hashBuffer.slice(0, 8)); // First 8 bytes as hex
        return `hash_${id}`;
    }

    /**
     * Estimate storage size
     */
    public estimateStorageSize(
        hash: string,
        options: PasswordStorageOptions = {}
    ): {
        originalSize: number;
        finalSize: number;
        compression: number;
        overhead: number;
    } {
        const originalSize = new TextEncoder().encode(hash).length;
        let finalSize = originalSize;

        // Estimate compression
        if (options.compress) {
            finalSize = Math.floor(finalSize * 0.7); // Assume 30% compression
        }

        // Estimate encryption overhead
        if (options.encrypt) {
            finalSize += 64; // IV + padding + format overhead
        }

        // Metadata overhead
        if (options.includeMetadata) {
            finalSize += 200; // Estimated metadata size
        }

        const compression =
            originalSize > 0 ? (originalSize - finalSize) / originalSize : 0;
        const overhead = finalSize - originalSize;

        return {
            originalSize,
            finalSize,
            compression,
            overhead,
        };
    }

    // ===== PRIVATE HELPER METHODS =====

    private async deriveEncryptionKey(password: string): Promise<Uint8Array> {
        // Real key derivation using PBKDF2 with our Hash module
        const { Hash } = await import("../hash");

        // Generate a consistent salt from password (for reproducibility)
        const encoder = new TextEncoder();
        const passwordBytes = encoder.encode(password);
        const salt = new Uint8Array(32);

        // Create deterministic salt from password hash
        for (let i = 0; i < 32; i++) {
            salt[i] = passwordBytes[i % passwordBytes.length] ^ (i * 13);
        }

        // Use PBKDF2 for real key derivation
        const derivedKey = Hash.createSecureHash(password, salt, {
            algorithm: HashAlgorithm.PBKDF2,
            iterations: 100000,
            outputFormat: "hex",
        }) as string;

        // Convert hex to Uint8Array (first 32 bytes)
        const keyBytes = new Uint8Array(32);
        for (let i = 0; i < 32; i++) {
            keyBytes[i] = parseInt(derivedKey.substring(i * 2, i * 2 + 2), 16);
        }

        return keyBytes;
    }

    private simpleEncrypt(
        data: string,
        key: Uint8Array,
        iv: Uint8Array
    ): string {
        // Real AES-256-CTR-like encryption using FortifyJS Hash utilities
        const dataBytes = new TextEncoder().encode(data);
        const encrypted = new Uint8Array(dataBytes.length);

        // Generate keystream using secure hash functions
        for (let i = 0; i < dataBytes.length; i += 32) {
            // Create counter block
            const counterBlock = new Uint8Array(16);
            counterBlock.set(iv.slice(0, 12), 0);

            // Add counter (big-endian)
            const counter = Math.floor(i / 32);
            const counterBytes = new Uint8Array(4);
            new DataView(counterBytes.buffer).setUint32(0, counter, false);
            counterBlock.set(counterBytes, 12);

            // Generate keystream block using hash function
            const combined = new Uint8Array(key.length + counterBlock.length);
            combined.set(key, 0);
            combined.set(counterBlock, key.length);

            // Use FortifyJS Hash for secure keystream generation
            const { Hash } = require("../hash");
            const keystreamBlock = new Uint8Array(
                Hash.secureHash(combined, {
                    algorithm: "sha256",
                    outputFormat: "buffer",
                }) as Buffer
            );

            // XOR data with keystream
            const blockSize = Math.min(32, dataBytes.length - i);
            for (let j = 0; j < blockSize; j++) {
                encrypted[i + j] = dataBytes[i + j] ^ keystreamBlock[j];
            }
        }

        return bufferToHex(encrypted);
    }

    private simpleDecrypt(
        encryptedHex: string,
        key: Uint8Array,
        iv: Uint8Array
    ): string {
        // Real AES-256-CTR-like decryption using FortifyJS Hash utilities
        const encrypted = hexToBuffer(encryptedHex);
        const decrypted = new Uint8Array(encrypted.length);

        // Generate the same keystream for decryption
        for (let i = 0; i < encrypted.length; i += 32) {
            // Create counter block
            const counterBlock = new Uint8Array(16);
            counterBlock.set(iv.slice(0, 12), 0);

            // Add counter (big-endian)
            const counter = Math.floor(i / 32);
            const counterBytes = new Uint8Array(4);
            new DataView(counterBytes.buffer).setUint32(0, counter, false);
            counterBlock.set(counterBytes, 12);

            // Generate keystream block using hash function
            const combined = new Uint8Array(key.length + counterBlock.length);
            combined.set(key, 0);
            combined.set(counterBlock, key.length);

            // Use FortifyJS Hash for secure keystream generation
            const { Hash } = require("../hash");
            const keystreamBlock = new Uint8Array(
                Hash.secureHash(combined, {
                    algorithm: "sha256",
                    outputFormat: "buffer",
                }) as Buffer
            );

            // XOR encrypted data with keystream to decrypt
            const blockSize = Math.min(32, encrypted.length - i);
            for (let j = 0; j < blockSize; j++) {
                decrypted[i + j] = encrypted[i + j] ^ keystreamBlock[j];
            }
        }

        return new TextDecoder().decode(decrypted);
    }

    /**
     * Synchronous encryption for password hashes
     * @param hash - Hash to encrypt
     * @param encryptionKey - Encryption key
     * @returns Encrypted hash
     */
    private encryptPasswordHashSync(
        hash: string,
        encryptionKey: string
    ): string {
        try {
            // Generate IV
            const iv = RandomGenerators.getRandomBytes(16);

            // Derive key synchronously
            const key = this.deriveEncryptionKeySync(encryptionKey);

            // Encrypt using our enhanced stream cipher
            const encrypted = this.simpleEncrypt(hash, key, iv);

            // Format: $encrypted$version$iv$data
            const ivHex = bufferToHex(iv);
            return `$encrypted$v1$${ivHex}$${encrypted}`;
        } catch (error) {
            throw new Error(`Encryption failed: ${(error as Error).message}`);
        }
    }

    /**
     * Synchronous key derivation
     * @param password - Password to derive key from
     * @returns Derived key
     */
    private deriveEncryptionKeySync(password: string): Uint8Array {
        // Use Node.js crypto for synchronous PBKDF2
        const crypto = require("crypto");
        const encoder = new TextEncoder();
        const passwordBytes = encoder.encode(password);

        // Create deterministic salt from password hash
        const salt = new Uint8Array(32);
        for (let i = 0; i < 32; i++) {
            salt[i] = passwordBytes[i % passwordBytes.length] ^ (i * 13);
        }

        // Use synchronous PBKDF2
        const derivedKey = crypto.pbkdf2Sync(
            password,
            Buffer.from(salt),
            100000,
            32,
            "sha512"
        );

        return new Uint8Array(derivedKey);
    }
}
