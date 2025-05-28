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
export { SecureProvider } from "./components";

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

// Import for CommonJS compatibility
import {
    useSecureState,
    useSecureObject,
    useStaticSecureObject,
    useAsyncSecureObject,
} from "./hooks";

import {
    SecureProvider,
} from "./components";

import {
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
} from "./types";

// For CommonJS compatibility
if (typeof module !== "undefined" && module.exports) {
    // Named exports
    module.exports.useSecureState = useSecureState;
    module.exports.useSecureObject = useSecureObject;
    module.exports.useStaticSecureObject = useStaticSecureObject;
    module.exports.useAsyncSecureObject = useAsyncSecureObject;
    module.exports.SecureProvider = SecureProvider;
    module.exports.useSecurityContext = useSecurityContext;
    module.exports.useSecurityConfig = useSecurityConfig;
    module.exports.useIsSensitiveKey = useIsSensitiveKey;
    module.exports.useSecurityMetrics = useSecurityMetrics;
    module.exports.useDebugMode = useDebugMode;
    module.exports.useComponentRegistration = useComponentRegistration;
    module.exports.useComponentMetrics = useComponentMetrics;
    module.exports.DEFAULT_SECURITY_CONFIG = DEFAULT_SECURITY_CONFIG;
}
 