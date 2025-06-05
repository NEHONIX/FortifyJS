import { ServerOptions } from "../../ServerFactory";
import { DEFAULT_FW_CONFIG } from "./FileWatcher.config";

// Default configuration
export const DEFAULT_OPTIONS: ServerOptions = {
    cache: {
        strategy: "auto",
        ttl: 300000, // 5 minutes
        enabled: true,
        memory: {
            maxSize: 100,
            algorithm: "lru",
        },
    },
    security: {
        encryption: true,
        accessMonitoring: true,
        sanitization: true,
        auditLogging: false,
        cors: true,
        helmet: true,
    },
    performance: {
        compression: true,
        batchSize: 100,
        connectionPooling: true,
        asyncWrite: true,
        prefetch: true,
        // Ultra-performance optimization settings
        ultraFastOptimization: true,
        requestClassification: true,
        predictivePreloading: true,
        aggressiveCaching: true,
        parallelProcessing: true,
    },
    monitoring: {
        enabled: true,
        healthChecks: true,
        metrics: true,
        detailed: false,
        alertThresholds: {
            memoryUsage: 85,
            hitRate: 0.8,
            errorRate: 0.02,
            latency: 50,
            // Ultra-performance targets
            ultraFastLatency: 1, // 1ms target for ultra-fast requests
            fastLatency: 5, // 5ms target for fast requests
            standardLatency: 20, // 20ms target for standard requests
            optimizationSuccessRate: 0.9, // 90% optimization success rate
            cacheHitRate: 0.95, // 95% cache hit rate for hot paths
        },
    },
    server: {
        port: 3000,
        host: "localhost",
        trustProxy: false,
        jsonLimit: "10mb",
        urlEncodedLimit: "10mb",
    },
    fileWatcher: DEFAULT_FW_CONFIG,
};
