/**
 * 🚀 FortifyJS React SecureProvider Component
 * Global security context provider for React applications
 */

import React, { useState, useCallback, useRef, useEffect } from "react";
import { 
    SecurityContext, 
    DEFAULT_SECURITY_CONFIG,
    mergeSecurityConfig,
    validateSecurityConfig 
} from "../../context";
import type { 
    SecureProviderProps, 
    SecurityConfig, 
    SecurityContextValue,
    PerformanceMetrics 
} from "../../types";

/**
 * Global security provider component
 * Provides security context to all child components
 * 
 * @example
 * ```tsx
 * function App() {
 *     return (
 *         <SecureProvider 
 *             config={{ 
 *                 encryptionLevel: "military",
 *                 enableMonitoring: true 
 *             }}
 *         >
 *             <UserProfile />
 *             <DataProcessor />
 *         </SecureProvider>
 *     );
 * }
 * ```
 */
export const SecureProvider: React.FC<SecureProviderProps> = ({
    config: userConfig,
    children,
    fallback = null,
    onError,
}) => {
    // Merge user config with defaults
    const [config, setConfig] = useState<SecurityConfig>(() => {
        try {
            const mergedConfig = mergeSecurityConfig(DEFAULT_SECURITY_CONFIG, userConfig);
            validateSecurityConfig(mergedConfig);
            return mergedConfig;
        } catch (error) {
            console.error("SecureProvider: Invalid configuration:", error);
            if (onError) {
                onError(error as Error, { phase: "initialization" });
            }
            return DEFAULT_SECURITY_CONFIG;
        }
    });
    
    // Debug mode state
    const [debugMode, setDebugMode] = useState(
        config.development?.enableDebugMode ?? false
    );
    
    // Component registry for monitoring
    const registeredComponents = useRef<Record<string, any>>({});
    
    // Performance metrics
    const metricsRef = useRef<PerformanceMetrics>({
        componentRenders: 0,
        averageRenderTime: 0,
        memoryUsage: 0,
        operationCounts: {},
        lastUpdate: new Date(),
    });
    
    // Security metrics
    const securityMetricsRef = useRef({
        totalOperations: 0,
        encryptedOperations: 0,
        totalOperationTime: 0,
        memoryUsage: 0,
    });
    
    // Update configuration
    const updateConfig = useCallback((newConfig: Partial<SecurityConfig>) => {
        try {
            const mergedConfig = mergeSecurityConfig(config, newConfig);
            validateSecurityConfig(mergedConfig);
            setConfig(mergedConfig);
            
            if (debugMode) {
                console.debug("SecureProvider: Configuration updated", mergedConfig);
            }
        } catch (error) {
            console.error("SecureProvider: Failed to update configuration:", error);
            if (onError) {
                onError(error as Error, { phase: "configuration-update" });
            }
        }
    }, [config, debugMode, onError]);
    
    // Get security metrics
    const getMetrics = useCallback(() => {
        const metrics = securityMetricsRef.current;
        return {
            totalOperations: metrics.totalOperations,
            encryptedOperations: metrics.encryptedOperations,
            averageOperationTime: metrics.totalOperations > 0 
                ? metrics.totalOperationTime / metrics.totalOperations 
                : 0,
            memoryUsage: metrics.memoryUsage,
        };
    }, []);
    
    // Register component
    const registerComponent = useCallback((componentId: string, metadata: any) => {
        registeredComponents.current[componentId] = {
            ...metadata,
            registeredAt: new Date(),
        };
        
        if (debugMode) {
            console.debug(`SecureProvider: Registered component ${componentId}`, metadata);
        }
    }, [debugMode]);
    
    // Unregister component
    const unregisterComponent = useCallback((componentId: string) => {
        delete registeredComponents.current[componentId];
        
        if (debugMode) {
            console.debug(`SecureProvider: Unregistered component ${componentId}`);
        }
    }, [debugMode]);
    
    // Get registered components
    const getRegisteredComponents = useCallback(() => {
        return { ...registeredComponents.current };
    }, []);
    
    // Memory monitoring
    useEffect(() => {
        if (!config.memory?.autoCleanup) return;
        
        const interval = setInterval(() => {
            // Update memory usage metrics
            if (typeof performance !== "undefined" && (performance as any).memory) {
                const memInfo = (performance as any).memory;
                securityMetricsRef.current.memoryUsage = memInfo.usedJSHeapSize;
                
                // Check memory threshold
                const maxMemory = config.memory?.maxMemoryUsage || 50 * 1024 * 1024;
                if (memInfo.usedJSHeapSize > maxMemory * 0.9) {
                    console.warn(
                        "SecureProvider: High memory usage detected. " +
                        "Consider optimizing your secure objects."
                    );
                }
            }
            
            // Clean up old component registrations
            const now = new Date();
            const maxAge = 5 * 60 * 1000; // 5 minutes
            
            Object.entries(registeredComponents.current).forEach(([id, metadata]) => {
                if (now.getTime() - metadata.registeredAt.getTime() > maxAge) {
                    delete registeredComponents.current[id];
                }
            });
            
        }, config.memory?.cleanupInterval || 30000);
        
        return () => clearInterval(interval);
    }, [config.memory]);
    
    // Performance monitoring
    useEffect(() => {
        if (!config.development?.enablePerformanceMetrics) return;
        
        const startTime = performance.now();
        metricsRef.current.componentRenders++;
        
        return () => {
            const endTime = performance.now();
            const renderTime = endTime - startTime;
            
            // Update average render time
            const currentAvg = metricsRef.current.averageRenderTime;
            const renderCount = metricsRef.current.componentRenders;
            metricsRef.current.averageRenderTime = 
                (currentAvg * (renderCount - 1) + renderTime) / renderCount;
            
            metricsRef.current.lastUpdate = new Date();
            
            if (debugMode && renderTime > 16) { // Slower than 60fps
                console.debug(
                    `SecureProvider: Slow render detected (${renderTime.toFixed(2)}ms)`
                );
            }
        };
    });
    
    // Error boundary effect
    useEffect(() => {
        const handleError = (event: ErrorEvent) => {
            if (onError) {
                onError(event.error, { phase: "runtime", event });
            }
        };
        
        const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
            if (onError) {
                onError(
                    new Error(`Unhandled promise rejection: ${event.reason}`),
                    { phase: "promise-rejection", event }
                );
            }
        };
        
        window.addEventListener("error", handleError);
        window.addEventListener("unhandledrejection", handleUnhandledRejection);
        
        return () => {
            window.removeEventListener("error", handleError);
            window.removeEventListener("unhandledrejection", handleUnhandledRejection);
        };
    }, [onError]);
    
    // Context value
    const contextValue: SecurityContextValue = {
        config,
        updateConfig,
        getMetrics,
        setDebugMode,
        debugMode,
        registerComponent,
        unregisterComponent,
        getRegisteredComponents,
    };
    
    // Show fallback while initializing
    if (!config) {
        return <>{fallback}</>;
    }
    
    return (
        <SecurityContext.Provider value={contextValue}>
            {children}
        </SecurityContext.Provider>
    );
};
