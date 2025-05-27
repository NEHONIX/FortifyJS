/**
 * FortifyJS React useSecureObject Hook
 * Enhanced object operations with React integration
 */

import React, { useState, useCallback, useRef, useEffect } from "react";
import { fObject as createSecureObject } from "fortify2-js";
import type {
    UseSecureObjectOptions,
    UseSecureObjectReturn,
} from "../../types";
import { useSecurityContext } from "../../context";

/**
 * Hook for enhanced object operations with React integration
 *
 * @param initialData - Initial object data or data source
 * @param options - Configuration options
 * @returns Enhanced object management
 *
 * @example
 * ```tsx
 * function DataProcessor() {
 *     const data = useSecureObject(rawData, {
 *         autoCleanup: true,
 *         enableEvents: true
 *     });
 *
 *     const processedData = data.object
 *         .filterNonSensitive()
 *         .transform(value => value.toUpperCase())
 *         .compact();
 *
 *     return (
 *         <div>
 *             <p>Processed {processedData.size} items</p>
 *             <p>Ready: {data.isReady ? "Yes" : "No"}</p>
 *         </div>
 *     );
 * }
 * ```
 */
export function useSecureObject<T extends Record<string, any>>(
    initialData: T | (() => T) | (() => Promise<T>),
    options: UseSecureObjectOptions = {}
): UseSecureObjectReturn<T> {
    const securityContext = useSecurityContext();

    // Configuration with defaults
    const config = {
        autoCleanup: options.autoCleanup ?? true,
        enableEvents: options.enableEvents ?? true,
        optimizationLevel: options.optimizationLevel || "balanced",
        memoryStrategy: options.memoryStrategy || "balanced",
        ...options,
    };

    // State management
    const [secureObject, setSecureObject] = useState<any>(null);
    const [isReady, setIsReady] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    // Metadata tracking
    const metadataRef = useRef({
        size: 0,
        sensitiveKeyCount: 0,
        lastModified: new Date(),
    });

    // Performance optimization based on level
    const _performanceConfig = {
        basic: { cacheSize: 10, enableLazyLoading: false },
        enhanced: { cacheSize: 50, enableLazyLoading: true },
        maximum: { cacheSize: 100, enableLazyLoading: true },
    }[config.optimizationLevel];

    // Memory management based on strategy
    const memoryConfig = {
        conservative: { maxSize: 1000, cleanupThreshold: 0.8 },
        balanced: { maxSize: 5000, cleanupThreshold: 0.9 },
        aggressive: { maxSize: 10000, cleanupThreshold: 0.95 },
    }[config.memoryStrategy];

    // Initialize secure object
    const initializeObject = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            let data: T;

            if (typeof initialData === "function") {
                const result = initialData();
                data = result instanceof Promise ? await result : result;
            } else {
                data = initialData;
            }

            const obj = createSecureObject(data);

            // Set up event listeners if enabled
            if (config.enableEvents) {
                const updateMetadata = () => {
                    metadataRef.current = {
                        size: obj.size,
                        sensitiveKeyCount: obj.getSensitiveKeys().length,
                        lastModified: new Date(),
                    };
                };

                obj.addEventListener("set", updateMetadata);
                obj.addEventListener("delete", updateMetadata);
                obj.addEventListener("clear", updateMetadata);
                obj.addEventListener("filtered", updateMetadata);
            }

            // Apply memory management
            if (obj.size > memoryConfig.maxSize) {
                console.warn(
                    `useSecureObject: Object size (${obj.size}) exceeds recommended maximum (${memoryConfig.maxSize}). ` +
                        "Consider using streaming operations for large datasets."
                );
            }

            setSecureObject(obj);
            setIsReady(true);

            // Initial metadata update
            metadataRef.current = {
                size: obj.size,
                sensitiveKeyCount: obj.getSensitiveKeys().length,
                lastModified: new Date(),
            };
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);
            console.error(
                "useSecureObject: Failed to initialize object:",
                error
            );
        } finally {
            setIsLoading(false);
        }
    }, [initialData, config.enableEvents, memoryConfig.maxSize]);

    // Initialize on mount
    useEffect(() => {
        initializeObject();
    }, [initializeObject]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (config.autoCleanup && secureObject) {
                secureObject.destroy();
            }
        };
    }, [config.autoCleanup, secureObject]);

    // Memory monitoring
    useEffect(() => {
        if (!secureObject || !config.enableEvents) return;

        const checkMemoryUsage = () => {
            const currentSize = secureObject.size;
            const threshold =
                memoryConfig.maxSize * memoryConfig.cleanupThreshold;

            if (currentSize > threshold) {
                console.warn(
                    `useSecureObject: Memory usage approaching limit. ` +
                        `Current: ${currentSize}, Threshold: ${threshold}`
                );

                // Trigger garbage collection hint if available
                if (typeof global !== "undefined" && global.gc) {
                    global.gc();
                }
            }
        };

        const interval = setInterval(checkMemoryUsage, 10000); // Check every 10 seconds

        return () => clearInterval(interval);
    }, [secureObject, config.enableEvents, memoryConfig]);

    // Refresh function
    const refresh = useCallback(() => {
        initializeObject();
    }, [initializeObject]);

    // Performance monitoring
    useEffect(() => {
        if (!securityContext.config.development?.enablePerformanceMetrics)
            return;

        const startTime = performance.now();

        return () => {
            const endTime = performance.now();
            const duration = endTime - startTime;

            if (duration > 100) {
                // Log slow operations
                console.debug(
                    `useSecureObject: Component lifecycle took ${duration.toFixed(
                        2
                    )}ms`
                );
            }
        };
    }, [securityContext.config.development?.enablePerformanceMetrics]);

    return {
        object: secureObject,
        refresh,
        isReady,
        isLoading,
        error,
        metadata: metadataRef.current,
    };
}

/**
 * Hook for creating a secure object from static data
 * Simplified version of useSecureObject for static data
 *
 * @param data - Static object data
 * @param options - Configuration options
 * @returns Secure object
 */
export function useStaticSecureObject<T extends Record<string, any>>(
    data: T,
    options: Omit<UseSecureObjectOptions, "autoCleanup"> = {}
) {
    return useSecureObject(data, { ...options, autoCleanup: true });
}

/**
 * Hook for creating a secure object from async data source
 * Specialized version for async data loading
 *
 * @param dataLoader - Async function that returns data
 * @param dependencies - Dependencies that trigger reload
 * @param options - Configuration options
 * @returns Secure object with loading states
 */
export function useAsyncSecureObject<T extends Record<string, any>>(
    dataLoader: () => Promise<T>,
    dependencies: React.DependencyList = [],
    options: UseSecureObjectOptions = {}
) {
    const memoizedLoader = useCallback(dataLoader, dependencies);
    return useSecureObject(memoizedLoader, options);
}

