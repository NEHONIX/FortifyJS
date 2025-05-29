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
    SecurityFlags
} from "./types";

// Export main class
export { FortifiedFunction } from "./fortified-function";

// Export modular components for advanced usage
export { SecurityHandler } from "./security-handler";
export { PerformanceMonitor } from "./performance-monitor";
export { ExecutionEngine } from "./execution-engine";

// Import for factory function
import { FortifiedFunction } from "./fortified-function";
import { FortifiedFunctionOptions } from "./types";

/**
 * Factory function to create fortified functions using existing FortifyJS components
 * 
 * @example
 * ```typescript
 * import { fFunc } from 'fortifyjs';
 * 
 * // Basic usage
 * const secureFunction = fFunc(async (data: string) => {
 *     return processData(data);
 * });
 * 
 * // With options
 * const advancedFunction = fFunc(myFunction, {
 *     autoEncrypt: true,
 *     secureParameters: [0, 'password'],
 *     memoize: true,
 *     auditLog: true
 * });
 * 
 * // Execute
 * const result = await secureFunction('sensitive data');
 * ```
 */
export function fFunc<T extends any[], R>(
    fn: (...args: T) => R | Promise<R>,
    options: FortifiedFunctionOptions = {}
): (...args: T) => Promise<R> {
    const fortifiedFunction = new FortifiedFunction(fn, options);
    
    return async (...args: T): Promise<R> => {
        return await fortifiedFunction.execute(...args);
    };
}

/**
 * Create a fortified function with full access to the FortifiedFunction instance
 * Useful when you need access to stats, audit logs, and other advanced features
 * 
 * @example
 * ```typescript
 * import { createFortifiedFunction } from 'fortifyjs';
 * 
 * const fortified = createFortifiedFunction(myFunction, {
 *     autoEncrypt: true,
 *     performanceTracking: true
 * });
 * 
 * // Execute
 * const result = await fortified.execute('data');
 * 
 * // Access stats
 * const stats = fortified.getStats();
 * console.log(`Executed ${stats.executionCount} times`);
 * 
 * // Access audit log
 * const auditLog = fortified.getAuditLog();
 * 
 * // Clean up when done
 * fortified.destroy();
 * ```
 */
export function createFortifiedFunction<T extends any[], R>(
    fn: (...args: T) => R | Promise<R>,
    options: FortifiedFunctionOptions = {}
): FortifiedFunction<T, R> {
    return new FortifiedFunction(fn, options);
}

// Export default as the factory function
export default fFunc;
