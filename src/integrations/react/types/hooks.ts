/**
 * 🚀 FortifyJS React Hooks - Type Definitions
 * Modular type definitions for React integration
 */

import { SecureObject } from "../../../security/secure-object";
import { SecureString } from "../../../security/secure-string";

/**
 * Configuration options for useSecureState hook
 */
export interface UseSecureStateOptions {
    /** Keys that should be treated as sensitive */
    sensitiveKeys?: string[];
    
    /** Enable automatic encryption for sensitive data */
    autoEncrypt?: boolean;
    
    /** Encryption algorithm to use */
    encryptionAlgorithm?: "AES-256-GCM" | "ChaCha20-Poly1305";
    
    /** Enable performance monitoring */
    enableMonitoring?: boolean;
    
    /** Custom validation function */
    validator?: (value: any) => boolean;
    
    /** Debounce updates (ms) */
    debounceMs?: number;
}

/**
 * Configuration options for useSecureObject hook
 */
export interface UseSecureObjectOptions {
    /** Enable automatic cleanup on unmount */
    autoCleanup?: boolean;
    
    /** Enable event tracking */
    enableEvents?: boolean;
    
    /** Performance optimization level */
    optimizationLevel?: "basic" | "enhanced" | "maximum";
    
    /** Memory management strategy */
    memoryStrategy?: "conservative" | "balanced" | "aggressive";
}

/**
 * Configuration options for useSecureForm hook
 */
export interface UseSecureFormOptions {
    /** Enable real-time validation */
    realTimeValidation?: boolean;
    
    /** Automatically mark password fields as sensitive */
    autoDetectSensitive?: boolean;
    
    /** Custom field validators */
    validators?: Record<string, (value: any) => boolean | string>;
    
    /** Enable form data encryption */
    encryptFormData?: boolean;
}

/**
 * Configuration options for useSecureStorage hook
 */
export interface UseSecureStorageOptions {
    /** Storage type */
    storageType?: "localStorage" | "sessionStorage" | "memory";
    
    /** Enable automatic encryption */
    encrypt?: boolean;
    
    /** Key derivation options */
    keyDerivation?: {
        algorithm: "PBKDF2" | "Argon2" | "scrypt";
        iterations?: number;
        salt?: string;
    };
    
    /** Enable compression */
    compress?: boolean;
    
    /** TTL for stored data (ms) */
    ttl?: number;
}

/**
 * Return type for useSecureState hook
 */
export interface UseSecureStateReturn<T> {
    /** The secure object containing the state */
    state: SecureObject<T>;
    
    /** Function to update the state */
    setState: (value: T | ((prev: T) => T)) => void;
    
    /** Get a specific value from state */
    getValue: <K extends keyof T>(key: K) => T[K];
    
    /** Set a specific value in state */
    setValue: <K extends keyof T>(key: K, value: T[K]) => void;
    
    /** Check if state is encrypted */
    isEncrypted: boolean;
    
    /** Performance metrics */
    metrics: {
        updateCount: number;
        lastUpdateTime: number;
        averageUpdateTime: number;
    };
}

/**
 * Return type for useSecureObject hook
 */
export interface UseSecureObjectReturn<T> {
    /** The secure object */
    object: SecureObject<T>;
    
    /** Refresh the object from source */
    refresh: () => void;
    
    /** Check if object is ready */
    isReady: boolean;
    
    /** Loading state */
    isLoading: boolean;
    
    /** Error state */
    error: Error | null;
    
    /** Object metadata */
    metadata: {
        size: number;
        sensitiveKeyCount: number;
        lastModified: Date;
    };
}

/**
 * Return type for useSecureForm hook
 */
export interface UseSecureFormReturn<T> {
    /** Form values as secure object */
    values: SecureObject<T>;
    
    /** Form errors */
    errors: Record<keyof T, string>;
    
    /** Touched fields */
    touched: Record<keyof T, boolean>;
    
    /** Form validation state */
    isValid: boolean;
    
    /** Form submission state */
    isSubmitting: boolean;
    
    /** Handle input change */
    handleChange: (field: keyof T, value: any) => void;
    
    /** Handle form submission */
    handleSubmit: (onSubmit: (values: T) => void | Promise<void>) => void;
    
    /** Reset form */
    reset: () => void;
    
    /** Validate specific field */
    validateField: (field: keyof T) => void;
    
    /** Validate entire form */
    validateForm: () => boolean;
}

/**
 * Return type for useSecureStorage hook
 */
export interface UseSecureStorageReturn<T> {
    /** Current stored value */
    value: T | null;
    
    /** Set value in storage */
    setValue: (value: T) => void;
    
    /** Remove value from storage */
    removeValue: () => void;
    
    /** Check if value exists */
    hasValue: boolean;
    
    /** Loading state */
    isLoading: boolean;
    
    /** Error state */
    error: Error | null;
    
    /** Storage metadata */
    metadata: {
        size: number;
        encrypted: boolean;
        lastModified: Date;
        expiresAt?: Date;
    };
}

/**
 * Hook dependency array type
 */
export type HookDependencies = ReadonlyArray<any>;

/**
 * Event handler types for hooks
 */
export interface HookEventHandlers {
    onStateChange?: (newState: any, oldState: any) => void;
    onError?: (error: Error) => void;
    onPerformanceMetric?: (metric: { operation: string; duration: number }) => void;
}

/**
 * Common hook configuration
 */
export interface BaseHookConfig {
    /** Enable debug mode */
    debug?: boolean;
    
    /** Custom event handlers */
    eventHandlers?: HookEventHandlers;
    
    /** Enable strict mode */
    strictMode?: boolean;
}
