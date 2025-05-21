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
 * @since v1.0.0
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

// Enum exports
export {
    EntropySource,
    SecurityLevel,
    TokenType,
    HashAlgorithm,
    KeyDerivationAlgorithm,
    OutputFormat,
} from "./types";

// Core exports
export { SecureRandom } from "./core/random";
export { Hash } from "./core/hash";
export { Keys } from "./core/keys";
export { Validators } from "./core/validators";

// Main class
export { FortifyJS };

// Advanced Security Features
export * from "./security";

// For CommonJS compatibility
if (typeof module !== "undefined" && module.exports) {
    module.exports = FortifyJS;
    module.exports.default = FortifyJS;
    module.exports.FortifyJS = FortifyJS;
}
