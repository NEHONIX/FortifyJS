import { ServerOptions } from "../../ServerFactory";

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
        },
    },
    server: {
        port: 3000,
        host: "localhost",
        trustProxy: false,
        jsonLimit: "10mb",
        urlEncodedLimit: "10mb",
    },
};
