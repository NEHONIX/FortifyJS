/**
 * FortifyJS React Integration - Main Exports
 * Complete React integration for FortifyJS
 */

// Hooks
export {
    useSecureState,
    useSecureObject,
    useStaticSecureObject,
    useAsyncSecureObject,
} from "./hooks";

// Components
export {
    SecureProvider,
} from "./components";

// Context
export {
    useSecurityContext,
    useSecurityConfig,
    useIsSensitiveKey,
    useSecurityMetrics,
    useDebugMode,
    useComponentRegistration,
    useComponentMetrics,
    DEFAULT_SECURITY_CONFIG,
} from "./context";

// Types
export type {
    // Hook types
    UseSecureStateOptions,
    UseSecureStateReturn,
    UseSecureObjectOptions,
    UseSecureObjectReturn,
    
    // Component types
    SecurityConfig,
    SecureProviderProps,
    SecurityContextValue,
    
    // Core types
    SecureObject,
    SecureString,
} from "./types";

