/**
 * SecureObject Modular Architecture
 * Main export file for SecureObject
 */

// Import the main SecureObject class first
import { SecureObject } from "./core/secure-object-core";

// Export the main SecureObject class
export { SecureObject } from "./core/secure-object-core";

// Export types and interfaces
export type {
    SecureValue,
    SerializationOptions,
    ValueMetadata,
    SecureObjectEvent,
    EventListener,
    SecureObjectOptions,
    SecureObjectData,
} from "./types";

// Export modular components for advanced usage
export { SensitiveKeysManager, DEFAULT_SENSITIVE_KEYS } from "./encryption/sensitive-keys";
export { CryptoHandler } from "./encryption/crypto-handler";
export { MetadataManager } from "./metadata/metadata-manager";
export { EventManager } from "./events/event-manager";
export { SerializationHandler } from "./serialization/serialization-handler";

// Export utilities
export { IdGenerator } from "./utils/id-generator";
export { ValidationUtils } from "./utils/validation";

/**
 * Re-export for backward compatibility
 * This allows existing code to continue working with:
 * import { SecureObject } from "path/to/security/secureOb"
 */
export { SecureObject as default } from "./core/secure-object-core";

/**
 * Factory functions for common use cases
 */

/**
 * Creates a new SecureObject with default settings
 */
export function createSecureObject<T extends Record<string, any>>(
    initialData?: Partial<T>,
    options?: { readOnly?: boolean; encryptionKey?: string }
): SecureObject<T> {
    return new SecureObject<T>(initialData, options);
}

/**
 * Creates a read-only SecureObject
 */
export function createReadOnlySecureObject<T extends Record<string, any>>(
    data: Partial<T>
): SecureObject<T> {
    return SecureObject.readOnly<T>(data);
}

/**
 * Creates a SecureObject with custom sensitive keys
 */
export function createSecureObjectWithSensitiveKeys<T extends Record<string, any>>(
    initialData: Partial<T>,
    sensitiveKeys: string[],
    options?: { readOnly?: boolean; encryptionKey?: string }
): SecureObject<T> {
    const obj = new SecureObject<T>(initialData, options);
    obj.setSensitiveKeys(sensitiveKeys);
    return obj;
}

/**
 * Creates a SecureObject from another SecureObject (deep copy)
 */
export function cloneSecureObject<T extends Record<string, any>>(
    source: SecureObject<T>
): SecureObject<T> {
    return SecureObject.from(source);
}

/**
 * Version information
 */
export const SECURE_OBJECT_VERSION = "2.0.0-modular";

/**
 * Module information for debugging
 */
export const MODULE_INFO = {
    version: SECURE_OBJECT_VERSION,
    architecture: "modular",
    components: [
        "core/secure-object-core",
        "encryption/sensitive-keys",
        "encryption/crypto-handler",
        "metadata/metadata-manager",
        "events/event-manager",
        "serialization/serialization-handler",
        "utils/id-generator",
        "utils/validation",
    ],
    features: [
        "Modular architecture",
        "Type-safe operations",
        "Event system",
        "Metadata tracking",
        "Encryption support",
        "Serialization options",
        "Memory management",
        "Validation utilities",
    ],
} as const;
