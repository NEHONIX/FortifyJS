// FIXME: I think this should be as a submodule of FortifyJS (I mean fortifyjs/express)
// send your answers: https://github.com/nehonix/fortifyjs

/**
 * FortifyJS Express Powerhouse
 * Revolutionary Express utility with Redis caching, smart optimization, and military-grade security
 *
 * @author Nehonix team
 * @description Zero-configuration, ultra-fast, secure Express server factory
 */

export * from "./ServerFactory";
export * from "./smart-routes";
export { createOptimalCache } from "./cache/CacheFactory";
export { SecurityMiddleware } from "./security-middleware";
export { PerformanceMonitor } from "./performance-monitor";
// Cluster management system
export * from "./cluster";

// Types
export type {
    ServerConfig,
    RouteConfig,
    CacheConfig,
    SecurityConfig,
    PerformanceConfig,
} from "./types/types";

// Quick start exports for immediate use
export * from "./quick-start";

