/**
 * 🚀 FortifyJS React Integration - Type Exports
 * Centralized type exports for React integration
 */

// Hook types
export type {
    UseSecureStateOptions,
    UseSecureObjectOptions,
    UseSecureFormOptions,
    UseSecureStorageOptions,
    UseSecureStateReturn,
    UseSecureObjectReturn,
    UseSecureFormReturn,
    UseSecureStorageReturn,
    HookDependencies,
    HookEventHandlers,
    BaseHookConfig,
} from "./hooks";

// Component types
export type {
    SecurityConfig,
    SecureProviderProps,
    SecureFormProps,
    SecureInputProps,
    SecureDisplayProps,
    SecureTableProps,
    SecurityContextValue,
    ErrorBoundaryState,
    PerformanceMetrics,
} from "./components";

// Re-export core types that are commonly used in React context
export type { SecureObject } from "../../../security/secure-object";
export type { SecureString } from "../../../security/secure-string";
