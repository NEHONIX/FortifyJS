/**
 * FortifyJS React useSecureState Hook
 * Secure state management with automatic encryption and enhanced operations
 */

import React, { useState, useCallback, useRef, useEffect } from "react";
import { createSecureObject, SecureObject } from "fortify2-js";
import type { UseSecureStateOptions, UseSecureStateReturn } from "../../types";
import { useSecurityContext, useIsSensitiveKey } from "../../context";

/**
 * Hook for secure state management with enhanced object operations
 *
 * @param initialValue - Initial state value
 * @param options - Configuration options
 * @returns Secure state management object
 *
 * @example
 * ```tsx
 * function UserProfile() {
 *     const [user, setUser] = useSecureState({
 *         name: "John",
 *         email: "john@example.com",
 *         password: "secret123"
 *     }, {
 *         sensitiveKeys: ["password"],
 *         autoEncrypt: true
 *     });
 *
 *     return (
 *         <div>
 *             <p>Name: {user.get("name")}</p>
 *             <p>Email: {user.get("email")}</p>
 *             // Password is automatically encrypted
 *         </div>
 *     );
 * }
 * ```
 */
export function useSecureState<T extends Record<string, any>>(
    initialValue: T,
    options: UseSecureStateOptions = {}
): UseSecureStateReturn<T> {
    const securityContext = useSecurityContext();
    const isSensitiveKey = useIsSensitiveKey;

    // Configuration with defaults
    const config = {
        sensitiveKeys: options.sensitiveKeys || [],
        autoEncrypt: options.autoEncrypt ?? true,
        encryptionAlgorithm: options.encryptionAlgorithm || "AES-256-GCM",
        enableMonitoring:
            options.enableMonitoring ?? securityContext.config.enableMonitoring,
        debounceMs: options.debounceMs || 0,
        ...options,
    };

    // Create secure object with initial value
    const [secureObject] = useState(() => {
        const obj = createSecureObject(initialValue);

        // Set sensitive keys
        const allSensitiveKeys = [
            ...config.sensitiveKeys,
            ...Object.keys(initialValue).filter((key) => isSensitiveKey(key)),
        ];

        if (allSensitiveKeys.length > 0) {
            obj.setSensitiveKeys(allSensitiveKeys);
        }

        return obj;
    });

    // Performance metrics
    const metricsRef = useRef({
        updateCount: 0,
        lastUpdateTime: 0,
        totalUpdateTime: 0,
    });

    // Force re-render when secure object changes
    const [, forceUpdate] = useState<object>({});
    const triggerUpdate = useCallback(() => {
        forceUpdate({});
    }, []);

    // Debounced update function
    const debounceRef = useRef<NodeJS.Timeout | null>(null);
    const debouncedUpdate = useCallback(() => {
        if (config.debounceMs > 0) {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
            debounceRef.current = setTimeout(triggerUpdate, config.debounceMs);
        } else {
            triggerUpdate();
        }
    }, [config.debounceMs, triggerUpdate]);

    // Set up event listeners for secure object changes
    useEffect(() => {
        const handleChange = () => {
            const startTime = performance.now();

            // Update metrics
            metricsRef.current.updateCount++;
            metricsRef.current.lastUpdateTime = startTime;

            // Trigger re-render
            debouncedUpdate();

            // Complete metrics
            const endTime = performance.now();
            const duration = endTime - startTime;
            metricsRef.current.totalUpdateTime += duration;

            // Call user event handler
            if (config.validator) {
                const currentValue = secureObject.toObject();
                if (!config.validator(currentValue)) {
                    console.warn(
                        "useSecureState: Validation failed for current state"
                    );
                }
            }
        };

        // Listen to secure object events
        secureObject.addEventListener("set", handleChange);
        secureObject.addEventListener("delete", handleChange);
        secureObject.addEventListener("clear", handleChange);

        return () => {
            secureObject.removeEventListener("set", handleChange);
            secureObject.removeEventListener("delete", handleChange);
            secureObject.removeEventListener("clear", handleChange);

            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [secureObject, debouncedUpdate, config.validator]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            secureObject.destroy();
        };
    }, [secureObject]);

    // setState function
    const setState = useCallback(
        (value: T | ((prev: T) => T)) => {
            const startTime = performance.now();

            try {
                if (typeof value === "function") {
                    const currentValue = secureObject.toObject() as T;
                    const newValue = value(currentValue);

                    // Clear and set new values
                    secureObject.clear();
                    Object.entries(newValue).forEach(([key, val]) => {
                        secureObject.set(key, val);
                    });
                } else {
                    // Clear and set new values
                    secureObject.clear();
                    Object.entries(value).forEach(([key, val]) => {
                        secureObject.set(key, val);
                    });
                }

                // Update sensitive keys if auto-detection is enabled
                if (config.autoEncrypt) {
                    const newSensitiveKeys = Object.keys(
                        secureObject.toObject()
                    ).filter((key) => isSensitiveKey(key));

                    if (newSensitiveKeys.length > 0) {
                        const existingSensitive =
                            secureObject.getSensitiveKeys();
                        const allSensitive = [
                            ...new Set([
                                ...existingSensitive,
                                ...newSensitiveKeys,
                            ]),
                        ];
                        secureObject.setSensitiveKeys(allSensitive);
                    }
                }
            } catch (error) {
                console.error("useSecureState: Error updating state:", error);
                throw error;
            }
        },
        [secureObject, config.autoEncrypt, isSensitiveKey]
    );

    // getValue function
    const getValue = useCallback(
        <K extends keyof T>(key: K): T[K] => {
            return secureObject.get(key as string) as T[K];
        },
        [secureObject]
    );

    // setValue function
    const setValue = useCallback(
        <K extends keyof T>(key: K, value: T[K]) => {
            secureObject.set(key as string, value);

            // Auto-detect sensitive keys
            if (config.autoEncrypt && isSensitiveKey(key as string)) {
                const existingSensitive = secureObject.getSensitiveKeys();
                if (!existingSensitive.includes(key as string)) {
                    secureObject.setSensitiveKeys([
                        ...existingSensitive,
                        key as string,
                    ]);
                }
            }
        },
        [secureObject, config.autoEncrypt, isSensitiveKey]
    );

    // Calculate metrics
    const metrics = {
        updateCount: metricsRef.current.updateCount,
        lastUpdateTime: metricsRef.current.lastUpdateTime,
        averageUpdateTime:
            metricsRef.current.updateCount > 0
                ? metricsRef.current.totalUpdateTime /
                  metricsRef.current.updateCount
                : 0,
    };

    return {
        state: secureObject as unknown as SecureObject<T>,
        setState,
        getValue,
        setValue,
        isEncrypted: secureObject.getSensitiveKeys().length > 0,
        metrics,
    };
}

