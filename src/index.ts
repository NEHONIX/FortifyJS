// Main class export
import { FortifyJS } from "./core/crypto";
export { FortifyJS };

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

// Advanced Security Features
export * from "./security";

// For CommonJS compatibility
if (typeof module !== "undefined" && module.exports) {
    module.exports = FortifyJS;
    module.exports.default = FortifyJS;
    module.exports.FortifyJS = FortifyJS;
}
