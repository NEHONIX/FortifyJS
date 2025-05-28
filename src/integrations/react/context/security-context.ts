/**
 * Nehonix FortifyJS React Security Context
 * Modular security context for React applications
 */

import React, { createContext, useContext } from "react";
import type { SecurityConfig, SecurityContextValue } from "../types";

/**
 * Default security configuration
 */
export const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
    encryptionLevel: "enhanced",
    defaultSensitiveKeys: [
        "password",
        "secret",
        "token",
        "key",
        "auth",
        "credential",
        "private",
        "confidential",
        "ssn",
        "credit",
        "card",
        "cvv",
        "pin",
    ],
    enableMonitoring: true,
    performance: {
        enableCaching: true,
        cacheSize: 100,
        enableLazyLoading: true,
    },
    memory: {
        autoCleanup: true,
        cleanupInterval: 30000, // 30 seconds
        maxMemoryUsage: 50 * 1024 * 1024, // 50MB
    },
    development: {
        enableDebugMode: process.env.NODE_ENV === "development",
        logLevel: process.env.NODE_ENV === "development" ? "debug" : "error",
        enablePerformanceMetrics: true,
    },
};

/**
 * Security context for managing global security settings
 */
export const SecurityContext = createContext<SecurityContextValue | null>(null);
 
/**
 * Hook to access security context
 * @returns Security context value
 * @throws Error if used outside SecurityProvider
 */
export function useSecurityContext(): SecurityContextValue {
    const context = useContext(SecurityContext);

    if (!context) {
        throw new Error(
            "useSecurityContext must be used within a SecurityProvider. " +
                "Make sure to wrap your component tree with <SecureProvider>."
        );
    }

    return context;
}

/**
 * Hook to access security configuration
 * @returns Current security configuration
 */
export function useSecurityConfig(): SecurityConfig {
    const { config } = useSecurityContext();
    return config;
}

/**
 * Hook to check if a key should be treated as sensitive
 * @param key - The key to check
 * @returns Whether the key is sensitive
 */
export function useIsSensitiveKey(key: string): boolean {
    const { config } = useSecurityContext();
    const sensitiveKeys = config.defaultSensitiveKeys || [];

    // Check exact match
    if (sensitiveKeys.includes(key.toLowerCase())) {
        return true;
    }

    // Check if key contains sensitive patterns
    return sensitiveKeys.some((pattern) =>
        key.toLowerCase().includes(pattern.toLowerCase())
    );
}

/**
 * Hook to access security metrics
 * @returns Current security metrics
 */
export function useSecurityMetrics() {
    const { getMetrics } = useSecurityContext();
    return getMetrics();
}

/**
 * Hook to control debug mode
 * @returns Debug mode controls
 */
export function useDebugMode() {
    const { debugMode, setDebugMode } = useSecurityContext();

    return {
        enabled: debugMode,
        enable: () => setDebugMode(true),
        disable: () => setDebugMode(false),
        toggle: () => setDebugMode(!debugMode),
    };
}

/**
 * Hook to register/unregister components for monitoring
 * @param componentId - Unique component identifier
 * @param metadata - Component metadata
 */
export function useComponentRegistration(
    componentId: string,
    metadata: any = {}
) {
    const { registerComponent, unregisterComponent } = useSecurityContext();

    // Register component on mount
    React.useEffect(() => {
        registerComponent(componentId, {
            ...metadata,
            registeredAt: new Date(),
            componentType: "react-component",
        });

        // Unregister on unmount
        return () => {
            unregisterComponent(componentId);
        };
    }, [componentId, registerComponent, unregisterComponent]);
}

/**
 * Hook to get performance metrics for the current component
 * @param componentId - Component identifier
 * @returns Performance metrics
 */
export function useComponentMetrics(componentId: string) {
    const { getRegisteredComponents } = useSecurityContext();
    const [metrics, setMetrics] = React.useState({
        renderCount: 0,
        averageRenderTime: 0,
        lastRenderTime: 0,
    });

    // Track render performance
    React.useEffect(() => {
        const startTime = performance.now();

        return () => {
            const endTime = performance.now();
            const renderTime = endTime - startTime;

            setMetrics((prev) => ({
                renderCount: prev.renderCount + 1,
                averageRenderTime:
                    (prev.averageRenderTime * prev.renderCount + renderTime) /
                    (prev.renderCount + 1),
                lastRenderTime: renderTime,
            }));
        };
    });

    return metrics;
}

/**
 * Utility function to merge security configurations
 * @param base - Base configuration
 * @param override - Override configuration
 * @returns Merged configuration
 */
export function mergeSecurityConfig(
    base: SecurityConfig,
    override: Partial<SecurityConfig>
): SecurityConfig {
    return {
        ...base,
        ...override,
        defaultSensitiveKeys: [
            ...(base.defaultSensitiveKeys || []),
            ...(override.defaultSensitiveKeys || []),
        ],
        performance: {
            ...base.performance,
            ...override.performance,
        },
        memory: {
            ...base.memory,
            ...override.memory,
        },
        development: {
            ...base.development,
            ...override.development,
        },
    };
}

/**
 * Utility function to validate security configuration
 * @param config - Configuration to validate
 * @throws Error if configuration is invalid
 */
export function validateSecurityConfig(config: SecurityConfig): void {
    if (config.memory?.maxMemoryUsage && config.memory.maxMemoryUsage < 0) {
        throw new Error("maxMemoryUsage must be a positive number");
    }

    if (
        config.memory?.cleanupInterval &&
        config.memory.cleanupInterval < 1000
    ) {
        throw new Error("cleanupInterval must be at least 1000ms");
    }

    if (config.performance?.cacheSize && config.performance.cacheSize < 1) {
        throw new Error("cacheSize must be at least 1");
    }

    const validEncryptionLevels = ["basic", "enhanced", "military"];
    if (
        config.encryptionLevel &&
        !validEncryptionLevels.includes(config.encryptionLevel)
    ) {
        throw new Error(
            `encryptionLevel must be one of: ${validEncryptionLevels.join(
                ", "
            )}`
        );
    }

    const validLogLevels = ["none", "error", "warn", "info", "debug"];
    if (
        config.development?.logLevel &&
        !validLogLevels.includes(config.development.logLevel)
    ) {
        throw new Error(
            `logLevel must be one of: ${validLogLevels.join(", ")}`
        );
    }
}

