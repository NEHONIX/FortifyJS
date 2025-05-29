/***************************************************************************
 * FortifyJS - Secure Array Types
 *
 * This file contains type definitions for the SecureArray modular architecture
 *
 * @author Nehonix
 * @license MIT
 *
 * Copyright (c) 2025 Nehonix. All rights reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 ***************************************************************************** */

/**
 * FortifyJS - Fortified Functions (Modular Architecture)
 * Main entry point for the fortified function system
 */

// Export all types
export type {
    FortifiedFunctionOptions,
    FunctionStats,
    AuditEntry,
    SecureExecutionContext,
    ExecutionEvent,
    CacheEntry,
    SecurityFlags,
    SmartCacheConfig,
    PerformanceMetrics,
    ExecutionPattern,
    OptimizationSuggestion,
    ThreatDetectionResult,
    AnalyticsData,
    AnomalyDetection,
    PredictiveAnalysis,
    EnhancedFortifiedFunction,
} from "./types";

// Export main class
export { FortifiedFunction } from "./fortified-function";

// Export modular components for advanced usage
export { SecurityHandler } from "./security-handler";
export { PerformanceMonitor } from "./performance-monitor";
export { ExecutionEngine } from "./execution-engine";

// Export new smart components
export { SmartCache } from "./smart-cache";
export { AnalyticsEngine } from "./analytics-engine";
export { OptimizationEngine } from "./optimization-engine";

// Import for factory function
import { FortifiedFunction } from "./fortified-function";
import { FortifiedFunctionOptions, EnhancedFortifiedFunction } from "./types";

/**
 * Zero-Configuration Smart Function Factory
 *
 * Creates production-ready fortified functions with enterprise-grade security,
 * performance optimization, and intelligent caching enabled by default.
 * No manual configuration required for optimal performance.
 *
 * @param fn - The function to be fortified with smart capabilities
 * @param options - Optional configuration overrides (all features enabled by default)
 * @returns A fortified function with enhanced security and performance features
 *
 * @example
 * ```typescript
 * import { func } from 'fortifyjs';
 *
 * // Zero configuration needed - all smart features enabled by default
 * const smartFunction = func(async (data: string) => {
 *     return processData(data);
 * });
 *
 * // Execute with automatic optimization
 * const result = await smartFunction('sensitive data');
 *
 * // Optional: Override specific settings if needed
 * const customFunction = func(myFunction, {
 *     maxCacheSize: 5000,
 *     debugMode: true
 * });
 * ```
 */
export function func<T extends any[], R>(
    fn: (...args: T) => R | Promise<R>,
    options: Partial<FortifiedFunctionOptions> = {}
): EnhancedFortifiedFunction<T, R> {
    // Zero-config smart defaults - no manual configuration needed!
    // All best practices are enabled by default for production-ready performance
    const fortifiedFunction = new FortifiedFunction(fn, options);

    // Create the enhanced function with all methods
    const enhancedFunc = async (...args: T): Promise<R> => {
        return await fortifiedFunction.execute(...args);
    };

    // Add all FortifiedFunction methods to the function for full IntelliSense support
    Object.assign(enhancedFunc, {
        // Analytics and monitoring methods
        getStats: () => fortifiedFunction.getStats(),
        getAnalyticsData: () => fortifiedFunction.getAnalyticsData(),
        getOptimizationSuggestions: () =>
            fortifiedFunction.getOptimizationSuggestions(),
        getPerformanceTrends: () => fortifiedFunction.getPerformanceTrends(),
        detectAnomalies: () => fortifiedFunction.detectAnomalies(),
        getDetailedMetrics: () => fortifiedFunction.getDetailedMetrics(),

        // Cache management methods
        clearCache: () => fortifiedFunction.clearCache(),
        getCacheStats: () => {
            const stats = fortifiedFunction.getStats();
            const cacheStats = fortifiedFunction.getCacheStats();
            return {
                hits: stats.cacheHits,
                misses: stats.cacheMisses,
                size: cacheStats.size || 0,
            };
        },
        warmCache: async (args: T[]) => {
            for (const argSet of args) {
                await fortifiedFunction.execute(...argSet);
            }
        },

        // Smart actions
        handleMemoryPressure: (level: "low" | "medium" | "high") =>
            fortifiedFunction.handleMemoryPressure(level),
        optimizePerformance: () => {
            // Trigger cache warming and optimization
            fortifiedFunction.warmCache();
            const suggestions = fortifiedFunction.getOptimizationSuggestions();
            // Auto-apply high priority suggestions
            suggestions
                .filter(
                    (s) => s.priority === "high" || s.priority === "critical"
                )
                .forEach(() => fortifiedFunction.warmCache());
        },

        // Configuration methods
        updateOptions: (newOptions: Partial<FortifiedFunctionOptions>) => {
            // Update internal options (this is a simplified implementation)
            Object.assign(options, newOptions);
        },
        getConfiguration: () => ({ ...options }),

        // Lifecycle methods
        destroy: () => fortifiedFunction.destroy(),

        // Internal FortifiedFunction instance (for advanced usage)
        _fortified: fortifiedFunction,
    });

    return enhancedFunc as EnhancedFortifiedFunction<T, R>;
}

/**
 * Create a fortified function with full access to smart analytics and optimization
 * Provides complete access to performance metrics, analytics, and optimization features
 *
 * @example
 * ```typescript
 * import { createFortifiedFunction } from 'fortifyjs';
 *
 * const fortified = createFortifiedFunction(myFunction, {
 *     autoEncrypt: true,
 *     smartCaching: true,
 *     predictiveAnalytics: true,
 *     detailedMetrics: true
 * });
 *
 * // Execute
 * const result = await fortified.execute('data');
 *
 * // Access enhanced analytics
 * const analytics = fortified.getAnalyticsData();
 * const suggestions = fortified.getOptimizationSuggestions();
 * const trends = fortified.getPerformanceTrends();
 * const anomalies = fortified.detectAnomalies();
 *
 * // Smart actions
 * fortified.warmCache();
 * fortified.handleMemoryPressure('medium');
 *
 * // Get comprehensive metrics
 * const detailedMetrics = fortified.getDetailedMetrics();
 *
 * // Clean up when done
 * fortified.destroy();
 * ```
 */
export function createFortifiedFunction<T extends any[], R>(
    fn: (...args: T) => R | Promise<R>,
    options: Partial<FortifiedFunctionOptions> = {}
): FortifiedFunction<T, R> {
    return new FortifiedFunction(fn, options);
}

// Export default as the factory function
export default func;
