// FIXME: I think this should be as a submodule of FortifyJS (I mean fortifyjs/express)
// send your answers: https://github.com/nehonix/fortifyjs

/**
 * FortifyJS Express Powerhouse
 * Revolutionary Express utility with Redis caching, smart optimization, and military-grade security
 *
 * @author Nehonix team
 * @description Zero-configuration, ultra-fast, secure Express server factory
 */

export { createServer, createSecureServer } from "./server-factory";
export { smartRoute, secureRoute, route } from "./smart-routes";
export { createOptimalCache } from "./cache/CacheFactory";
export { SecurityMiddleware } from "./security-middleware";
export { PerformanceMonitor } from "./performance-monitor";
export { ClusterManager } from "./cluster-manager";

// Types
export type {
    ServerConfig,
    RouteConfig,
    CacheConfig,
    SecurityConfig,
    PerformanceConfig,
    ClusterConfig,
} from "./types";

// Utilities (to be implemented)
// export {
//     createMiddleware,
//     createAuthMiddleware,
//     createRateLimitMiddleware,
//     createCompressionMiddleware
// } from './middleware-factory';

// Analytics (to be implemented)
// export {
//     getServerMetrics,
//     getRouteAnalytics,
//     getCacheStatistics,
//     getSecurityReport
// } from './analytics';

// Quick start exports for immediate use
export {
    quickServer,
    devServer,
    prodServer,
    microservice,
    apiGateway,
    customServer,
} from "./quick-start";

