/**
 * FortifyJS - Fortified Function Types
 * Type definitions for the fortified function system
 */

import { SecureBuffer } from "../../security";

export interface FortifiedFunctionOptions {
    // **ULTRA-FAST OPTIMIZATION: Performance mode**
    ultraFast?: boolean | "minimal" | "standard" | "maximum" | undefined;

    // Security Options
    autoEncrypt?: boolean;
    secureParameters?: (string | number)[];
    parameterValidation?: boolean;
    memoryWipeDelay?: number;
    stackTraceProtection?: boolean;
    smartSecurity?: boolean;
    threatDetection?: boolean;

    // Performance Options
    memoize?: boolean;
    /**
     * Timeout in milliseconds. Default is 14 seconds.
     */
    timeout?: number;
    retries?: number;
    maxRetryDelay?: number;
    smartCaching?: boolean;
    cacheStrategy?: "lru" | "lfu" | "adaptive";
    cacheTTL?: number;
    maxCacheSize?: number;
    errorHandling?: "graceful";
    precompile?: boolean;
    optimizeExecution?: boolean;

    // Smart Actions
    autoTuning?: boolean;
    predictiveAnalytics?: boolean;
    adaptiveTimeout?: boolean;
    intelligentRetry?: boolean;
    anomalyDetection?: boolean;
    performanceRegression?: boolean;

    // Monitoring Options
    auditLog?: boolean;
    performanceTracking?: boolean;
    debugMode?: boolean;
    detailedMetrics?: boolean;

    // Memory Management
    memoryPool?: boolean;
    maxMemoryUsage?: number;
    autoCleanup?: boolean;
    smartMemoryManagement?: boolean;
    memoryPressureHandling?: boolean;
}

export interface FunctionStats {
    executionCount: number;
    totalExecutionTime: number;
    averageExecutionTime: number;
    memoryUsage: number;
    cacheHits: number;
    cacheMisses: number;
    errorCount: number;
    lastExecuted: Date;
    securityEvents: number;
    // Performance timing data
    timingStats?: TimingStats;
}

// Performance timing interfaces
export interface TimingMeasurement {
    label: string;
    startTime: number;
    endTime?: number;
    duration?: number;
    metadata?: Record<string, any>;
}

export interface TimingStats {
    totalMeasurements: number;
    completedMeasurements: number;
    activeMeasurements: number;
    measurements: TimingMeasurement[];
    summary: {
        totalDuration: number;
        averageDuration: number;
        minDuration: number;
        maxDuration: number;
        slowestOperation: string;
        fastestOperation: string;
    };
}

export interface AuditEntry {
    timestamp: Date;
    executionId: string;
    parametersHash: string;
    executionTime: number;
    memoryUsage: number;
    success: boolean;
    errorMessage?: string;
    securityFlags: string[];
}

export interface SecureExecutionContext {
    executionId: string;
    encryptedParameters: Map<string, string>;
    secureBuffers: Map<string, SecureBuffer>;
    startTime: number;
    memorySnapshot: number;
    auditEntry: AuditEntry;
}

export interface ExecutionEvent {
    executionId: string;
    timestamp: Date;
    type: "start" | "success" | "error" | "timeout" | "retry";
    data?: any;
}

export interface CacheEntry<R> {
    result: R;
    timestamp: number;
    accessCount: number;
    lastAccessed: Date;
    ttl?: number;
    priority?: number;
    size?: number;
    frequency?: number;
}

export interface SecurityFlags {
    encrypted: boolean;
    audited: boolean;
    memoryManaged: boolean;
    stackProtected: boolean;
}

// New interfaces for enhanced functionality
export interface SmartCacheConfig {
    strategy: "lru" | "lfu" | "adaptive";
    maxSize: number;
    ttl: number;
    autoCleanup: boolean;
    compressionEnabled: boolean;
    persistToDisk: boolean;
}

export interface PerformanceMetrics {
    executionTime: number;
    memoryUsage: number;
    cpuUsage: number;
    cacheHitRate: number;
    errorRate: number;
    throughput: number;
    latency: number;
}

export interface ExecutionPattern {
    parametersHash: string;
    frequency: number;
    averageExecutionTime: number;
    lastExecuted: Date;
    predictedNextExecution?: Date;
    cacheWorthiness: number;
}

export interface OptimizationSuggestion {
    type: "cache" | "timeout" | "retry" | "memory" | "security";
    priority: "low" | "medium" | "high" | "critical";
    description: string;
    expectedImprovement: number;
    implementation: string;
}

export interface ThreatDetectionResult {
    threatLevel: "none" | "low" | "medium" | "high" | "critical";
    threats: string[];
    recommendations: string[];
    blocked: boolean;
}

export interface AnalyticsData {
    patterns: ExecutionPattern[];
    trends: PerformanceMetrics[];
    anomalies: AnomalyDetection[];
    predictions: PredictiveAnalysis[];
}

export interface AnomalyDetection {
    type: "performance" | "memory" | "security" | "error";
    severity: "low" | "medium" | "high";
    description: string;
    timestamp: Date;
    metrics: Record<string, number>;
}

export interface PredictiveAnalysis {
    metric: string;
    currentValue: number;
    predictedValue: number;
    confidence: number;
    timeframe: number;
    trend: "increasing" | "decreasing" | "stable";
}

/**
 * Enhanced function type that provides access to FortifiedFunction methods
 * while maintaining the original function signature
 */
export interface EnhancedFortifiedFunction<T extends any[], R> {
    // Main execution method (callable as function)
    (...args: T): Promise<R>;

    // Analytics and monitoring methods
    getStats(): FunctionStats;
    getAnalyticsData(): AnalyticsData;
    getOptimizationSuggestions(): OptimizationSuggestion[];
    getPerformanceTrends(): PerformanceMetrics[];
    detectAnomalies(): AnomalyDetection[];
    getDetailedMetrics(): Record<string, any>;

    // Cache management methods
    clearCache(): void;
    getCacheStats(): { hits: number; misses: number; size: number };
    warmCache(args: T[]): Promise<void>;

    // Smart actions
    handleMemoryPressure(level: "low" | "medium" | "high"): void;
    optimizePerformance(): void;

    // Configuration methods
    updateOptions(options: Partial<FortifiedFunctionOptions>): void;
    getConfiguration(): FortifiedFunctionOptions;

    // Performance timing methods
    startTimer(label: string, metadata?: Record<string, any>): void;
    endTimer(label: string, additionalMetadata?: Record<string, any>): number;
    measureDelay(startPoint: string, endPoint: string): number;
    timeFunction<U>(
        label: string,
        fn: () => U | Promise<U>,
        metadata?: Record<string, any>
    ): Promise<{ result: U; duration: number }>;
    getTimingStats(): TimingStats;
    clearTimings(): void;

    // Lifecycle methods
    destroy(): void;

    // Internal FortifiedFunction instance (for advanced usage)
    readonly _fortified: any; // Will be properly typed as FortifiedFunction<T, R>
}
