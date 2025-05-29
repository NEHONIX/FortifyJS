# Changelog

All notable changes to @fortifyjs/react will be documented in this file.

## [1.0.0] - 2025/05/28

### Added

-   Initial release of @fortifyjs/react
-   ✨ `useSecureState` hook for secure state management with automatic encryption
-   ⚡ `useSecureObject` hook for enhanced object operations
-   🛡️ `SecureProvider` component for global security context
-   📊 Security monitoring and performance metrics
-   🎯 Perfect TypeScript support with type-safe operations
-   🔄 Event-driven reactive updates
-   💪 Modular architecture following FortifyJS patterns

### Features

-   **Hooks**:

    -   `useSecureState()` - Secure state with automatic encryption
    -   `useSecureObject()` - Enhanced object state management
    -   `useStaticSecureObject()` - Simplified version for static data
    -   `useAsyncSecureObject()` - Specialized for async data loading

-   **Components**:

    -   `<SecureProvider>` - Global security context provider

-   **Context**:
    -   `useSecurityContext()` - Access security settings
    -   `useSecurityConfig()` - Get current configuration
    -   `useIsSensitiveKey()` - Check if key is sensitive
    -   `useSecurityMetrics()` - Access performance metrics
    -   `useDebugMode()` - Control debug mode

### Technical Details

-   Zero dependencies (except peer dependencies)
-   Compatible with React 16.8+ (hooks support)
-   Full TypeScript support
-   Tree-shakeable ESM and CommonJS builds
-   Comprehensive type definitions
