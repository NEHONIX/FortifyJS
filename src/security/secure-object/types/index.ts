/**
 * Type definitions for SecureObject modular architecture
 */

import SecureString from "../../secure-string";

/**
 * Types that can be stored securely
 */
export type SecureValue =
    | string
    | number
    | boolean
    | Uint8Array
    | SecureString
    | any // SecureObject<any> - will be properly typed after refactoring
    | null
    | undefined;

/**
 * Serialization options for SecureObject
 */
export interface SerializationOptions {
    includeMetadata?: boolean;
    encryptSensitive?: boolean;
    format?: "json" | "binary";
}

/**
 * Metadata for tracking secure values
 */
export interface ValueMetadata {
    type: string;
    isSecure: boolean;
    created: Date;
    lastAccessed: Date;
    accessCount: number;
}

/**
 * Event types for SecureObject
 */
export type SecureObjectEvent =
    | "set"
    | "get"
    | "delete"
    | "clear"
    | "destroy"
    | "filtered";

/**
 * Event listener callback
 */
export type EventListener = (
    event: SecureObjectEvent,
    key?: string,
    value?: any
) => void | Promise<void>;

/**
 * Configuration options for SecureObject
 */
export interface SecureObjectOptions {
    readOnly?: boolean;
    autoDestroy?: boolean;
    encryptionKey?: string;
}

/**
 * Internal data structure for storing values
 */
export interface SecureObjectData<T> {
    data: Map<string, any>;
    secureBuffers: Map<string, any>; // SecureBuffer type
    metadata: Map<string, ValueMetadata>;
}

