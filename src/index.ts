/* ---------------------------------------------------------------------------------------------
 *  Copyright (c) NEHONIX INC. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 * -------------------------------------------------------------------------------------------
 */

/**
 * FortifyJS Main Module
 *
 * This is the main entry point for the FortifyJS library. It provides
 * access to all the core and advanced security features of the library.
 *
 * FortifyJS is designed to be a comprehensive cryptographic security library
 * that provides secure token generation, advanced hashing, key derivation,
 * password utilities, and more.
 *
 * It is built with TypeScript and designed for maximum security, performance,
 * and developer experience.
 *
 * @NEHONIX
 * @augments FortifyJS
 * @exports FortifyJS
 * @author Nehonix
 * @see https://lab.nehonix.space
 * @name FortifyJS
 * @example
 * ```typescript
 * import { FortifyJS } from "fortify-js";
 *
 * // Generate a secure token
 * const token = FortifyJS.generateSecureToken({
 *     length: 32,
 *     entropy: "maximum",
 * });
 * console.log(token);
 * // Output: "aK7mN9pQ2rS8tU3vW6xY1zB4cD5eF7gH"
 * ```
 */

import { FortifyJS } from "./core/crypto";
// Use the new modular SecureString
import { SecureString } from "./security/secure-string";
// Use the new modular SecureObject
import { SecureObject, SecureObjectOptions } from "./security/secure-object";

// Export modular SecureObject utilities
import * as fObjectUtils from "./security/secure-object";

// Export modular SecureString utilities
import * as fstringUtils from "./security/secure-string";

// Type exports
export type {
    SecureTokenOptions,
    HashOptions,
    KeyDerivationOptions,
    APIKeyOptions,
    SessionTokenOptions,
    MiddlewareOptions,
    CryptoStats,
    SecurityTestResult,
    PasswordStrengthResult,
} from "./types";

// Modular SecureObject types
export type {
    SecureValue,
    SerializationOptions,
    ValueMetadata,
    SecureObjectEvent,
    EventListener,
    SecureObjectOptions,
} from "./security/secure-object";

// Modular SecureString types
export type {
    SecureStringOptions,
    SecureStringEvent,
    SecureStringEventListener,
    ComparisonResult,
    SearchOptions,
    SplitOptions,
    ValidationResult,
    StringStatistics,
    MemoryUsage,
} from "./security/secure-string";

// Password Management Types
export type {
    PasswordHashOptions,
    PasswordVerificationResult,
    PasswordGenerationOptions,
    PasswordStrengthAnalysis,
    PasswordMigrationResult,
    PasswordPolicy,
    PasswordValidationResult,
} from "./core/password/password-types";

// Password Management Enums
export {
    PasswordAlgorithm,
    PasswordSecurityLevel,
} from "./core/password/password-types";
// Enum exports
export {
    EntropySource,
    SecurityLevel,
    TokenType,
    HashAlgorithm,
    KeyDerivationAlgorithm,
} from "./types";
export { HashStrength } from "./core";

// Core exports
import { SecureRandom, RandomCrypto, RandomTokens } from "./core/random";
import { Keys } from "./core/keys";
import { Validators } from "./core/validators";
import { SecureBuffer } from "./security";
import { EnhancedUint8Array } from "./helpers/Uint8Array";
import { Hash } from "./core";
import { PasswordManager } from "./core/password";

// Import password types and enums for CommonJS export
import {
    PasswordAlgorithm,
    PasswordHashOptions,
    PasswordSecurityLevel,
} from "./core/password/password-types";

// Import all security exports
import * as SecurityExports from "./security";

// Import all encoding exports
import * as EncodingExports from "./utils/encoding";

export { SecureRandom } from "./core/random";
export { SecureRandom as Random } from "./core/random";
export { Keys } from "./core/keys";
export { Validators } from "./core/validators";
export { SecureBuffer } from "./security";
export { SecureBuffer as Buffer } from "./security";
export { EnhancedUint8Array } from "./helpers/Uint8Array";
export type { EncodingType } from "./types/random";
export * from "./generators/rsaKeyCalculator";

// Crypto compatibility exports for easy migration from crypto module
// Export individual methods to ensure they're available
export const createSecureCipheriv = RandomCrypto.createSecureCipheriv;
export const createSecureDecipheriv = RandomCrypto.createSecureDecipheriv;
export const generateSecureIV = RandomCrypto.generateSecureIV;
export const generateSecureIVBatch = RandomCrypto.generateSecureIVBatch;
export const generateSecureIVForAlgorithm =
    RandomCrypto.generateSecureIVForAlgorithm;
export const generateSecureIVBatchForAlgorithm =
    RandomCrypto.generateSecureIVBatchForAlgorithm;
export const validateIV = RandomCrypto.validateIV;
export const getRandomBytes = SecureRandom.getRandomBytes;
export const generateSessionToken = RandomTokens.generateSessionToken;
export const generateSecureUUID = SecureRandom.generateSecureUUID;

// Hash methods from Hash class
export const createSecureHash = Hash.createSecureHash;
export const createSecureHMAC = Hash.createSecureHMAC;
export const verifyHash = Hash.verifyHash;

// Core classes (Hash was missing from earlier exports)
export { Hash };
export { PasswordManager } from "./core/password";

// Main class
export { FortifyJS as Fortify };
export { FortifyJS as ftfy };

// Advanced Security Features
export * from "./security";

// Utils
export * from "./utils/encoding";
// alias for password manager (useful for legacy code)
/**
 * Fast password manager access but use default configuration
 * for custom config, use PasswordManager.create() or PasswordManager.getInstance()
 */
export const pm = PasswordManager.getInstance();

/**
 * @author iDevo
 * @description Creates a secure string that can be explicitly cleared from memory
 * @param str - The string to be converted to a secure string
 * @returns A new SecureString instance
 */
export function fString(str: string) {
    const secureString = new SecureString(str);
    return secureString;
}

/**
 * @author iDevo
 * @description Creates a secure object that can be explicitly cleared from memory
 * @param initialData - The initial data to be stored in the secure object
 * @returns A new SecureObject instance
 */
export function fObject<T extends Record<string, any>>(
    initialData?: T,
    options?: SecureObjectOptions
) {
    return new SecureObject<T>(initialData, options);
}

/**
 * Encrypt a password with pepper and military-grade hashing
 *
 * This function provides an additional layer of security by applying a pepper (secret)
 * before hashing the password with Argon2ID. This protects against rainbow table attacks
 * even if the database is compromised.
 *
 * @author suppercodercodelover
 * @param password - The plain text password to encrypt
 * @param PEPPER - A secret pepper value (should be stored securely, not in database)
 * @returns Promise<string> - The peppered and hashed password ready for database storage
 * @throws Error if PEPPER is not provided
 *
 * @example
 * ```typescript
 * // Create pepper using Random
 * console.log("PASSWORD_PEPPER: ", Random.getRandomBytes(16))  // replace "16" with desired length then store securely (example in a .env file)
 * const pepper = process.env.PASSWORD_PEPPER; // Store securely!
 * const hashedPassword = await encryptSecurePass("userPassword123", pepper);
 * // Store hashedPassword in database
 * ```
 *
 * @security
 * - Uses HMAC-SHA256 for pepper application
 * - Uses Argon2ID for final password hashing
 * - Timing-safe operations prevent side-channel attacks
 */
export async function encryptSecurePass(
    password: string,
    PEPPER: string,
    options: PasswordHashOptions = {}
): Promise<string> {
    if (!PEPPER) {
        throw new Error(
            "PEPPER must be defined when running password master. Store it securely in environment variables."
        );
    }

    // Apply pepper using HMAC-SHA256 for cryptographic security
    const peppered = Hash.createSecureHMAC("sha256", PEPPER, password);

    // Hash the peppered password with Argon2ID (military-grade)
    return await pm.hash(peppered, options);
}

/**
 * 🔍 Verify a password against a peppered hash with timing-safe comparison
 *
 * This function verifies a plain text password against a hash that was created
 * using encryptSecurePass(). It applies the same pepper and uses constant-time
 * verification to prevent timing attacks.
 *
 * @author suppercodercodelover
 * @param password - The plain text password to verify
 * @param hashedPassword - The peppered hash from database (created with encryptSecurePass)
 * @param PEPPER - The same secret pepper value used during encryption
 * @returns Promise<boolean> - true if password is valid, false otherwise
 * @throws Error if PEPPER is not provided
 *
 * @example
 * ```typescript
 * const pepper = process.env.PASSWORD_PEPPER; // Same pepper as encryption
 * const isValid = await verifyEncryptedPassword(
 *     "userPassword123",
 *     storedHashFromDB,
 *     pepper
 * );
 *
 * if (isValid) {
 *     console.log("Login successful!");
 * } else {
 *     console.log("Invalid credentials");
 * }
 * ```
 *
 * @security
 * - Uses timing-safe verification (constant-time comparison)
 * - Applies same HMAC-SHA256 pepper as encryption
 * - Resistant to timing attacks and side-channel analysis
 * - Returns boolean only (no additional timing information leaked)
 */
export async function verifyEncryptedPassword(
    password: string,
    hashedPassword: string,
    PEPPER: string,
    options: PasswordHashOptions = {}
): Promise<boolean> {
    if (!PEPPER) {
        throw new Error(
            "PEPPER must be defined when running password master. Use the same pepper as encryptSecurePass()."
        );
    }

    // Apply the same pepper transformation as during encryption
    const peppered = Hash.createSecureHMAC("sha256", PEPPER, password);

    // Perform timing-safe verification
    const result = await pm.verify(peppered, hashedPassword, options);
    return result.isValid;
}

// For CommonJS compatibility
if (typeof module !== "undefined" && module.exports) {
    //default
    module.exports.default = FortifyJS;
    //
    module.exports = FortifyJS;
    module.exports.FortifyJS = FortifyJS;
    module.exports.ftfy = FortifyJS;
    module.exports.Fortify = FortifyJS;
    module.exports.pm = pm;

    // Export SecureRandom class and methods
    module.exports.SecureRandom = SecureRandom;
    module.exports.Random = SecureRandom;

    // Export individual methods for direct access (using correct modular classes)
    module.exports.createSecureCipheriv = RandomCrypto.createSecureCipheriv;
    module.exports.createSecureDecipheriv = RandomCrypto.createSecureDecipheriv;
    module.exports.generateSecureIV = RandomCrypto.generateSecureIV;
    module.exports.generateSecureIVBatch = RandomCrypto.generateSecureIVBatch;
    module.exports.generateSecureIVForAlgorithm =
        RandomCrypto.generateSecureIVForAlgorithm;
    module.exports.generateSecureIVBatchForAlgorithm =
        RandomCrypto.generateSecureIVBatchForAlgorithm;
    module.exports.validateIV = RandomCrypto.validateIV;
    module.exports.getRandomBytes = SecureRandom.getRandomBytes;
    module.exports.generateSessionToken = RandomTokens.generateSessionToken;
    module.exports.generateSecureUUID = SecureRandom.generateSecureUUID;

    // Export Hash methods (consolidated from SecureRandom)
    module.exports.createSecureHash = Hash.createSecureHash;
    module.exports.createSecureHMAC = Hash.createSecureHMAC;
    module.exports.verifyHash = Hash.verifyHash;

    // Export other core classes
    module.exports.Hash = Hash;
    module.exports.Keys = Keys;
    module.exports.Validators = Validators;
    module.exports.SecureBuffer = SecureBuffer;
    module.exports.Buffer = SecureBuffer;
    module.exports.EnhancedUint8Array = EnhancedUint8Array;

    // Export Password Management System
    module.exports.PasswordManager = PasswordManager;

    // Export Password Management Types and Enums (using imported modules)
    module.exports.PasswordAlgorithm = PasswordAlgorithm;
    module.exports.PasswordSecurityLevel = PasswordSecurityLevel;

    // Export new password utility functions
    module.exports.encryptSecurePass = encryptSecurePass;
    module.exports.verifyEncryptedPassword = verifyEncryptedPassword;

    // ===================== safe (String and Object) ====================

    // Export String and Object functions
    module.exports.fString = fString;
    module.exports.fObject = fObject;

    // Export Security Features (using imported modules)
    globalThis.Object.keys(SecurityExports).forEach((key: string) => {
        if (key !== "default") {
            module.exports[key] = (SecurityExports as any)[key];
        }
    });

    // Export Security Features (using imported modules)
    globalThis.Object.keys(fstringUtils).forEach((key: string) => {
        if (key !== "default") {
            module.exports[key] = (fstringUtils as any)[key];
        }
    });
    globalThis.Object.keys(fObjectUtils).forEach((key: string) => {
        if (key !== "default") {
            module.exports[key] = (fObjectUtils as any)[key];
        }
    });

    // Export Utils/Encoding (using imported modules)
    globalThis.Object.keys(EncodingExports).forEach((key: string) => {
        if (key !== "default") {
            module.exports[key] = (EncodingExports as any)[key];
        }
    });

    // Export SecureString and SecureObject classes
    module.exports.SecureString = SecureString;
    module.exports.SecureObject = SecureObject;
}
