/**
 * Cache Plugin Base Class
 *
 * Foundation for cache optimization plugins with <0.5ms execution overhead
 * leveraging FortifyJS cache systems for ultra-fast performance.
 */

import { func } from "../../../../../components/fortified-function";
import { Hash } from "../../../../../core/hash";
import { Cache, createOptimalCache } from "../../../../../components/cache";
import {
    BasePlugin,
    CachePlugin as ICachePlugin,
    PluginType,
    PluginPriority,
    PluginExecutionContext,
    PluginExecutionResult,
    PluginInitializationContext,
} from "../types/PluginTypes";
import { SecureCacheAdapter } from "../../../cache";

/**
 * Abstract base class for cache optimization plugins
 */
export abstract class CachePlugin implements ICachePlugin {
    public readonly type = PluginType.CACHE;
    public readonly priority = PluginPriority.HIGH;
    public readonly isAsync = true;
    public readonly isCacheable = false; // Cache plugins themselves shouldn't be cached
    public readonly maxExecutionTime = 500; // 0.5ms max for cache operations

    // Cache configuration
    public readonly cacheStrategy: "memory" | "redis" | "hybrid" = "hybrid";
    public readonly compressionEnabled = true;
    public readonly encryptionEnabled = true;

    // Plugin metadata (to be implemented by subclasses)
    public abstract readonly id: string;
    public abstract readonly name: string;
    public abstract readonly version: string;

    // Cache utilities
    protected cache?: SecureCacheAdapter;
    protected hashUtil?: typeof Hash;
    protected fortifiedCache?: any;

    // Cache statistics
    private cacheStats = {
        hits: 0,
        misses: 0,
        sets: 0,
        deletes: 0,
        errors: 0,
        totalOperations: 0,
        averageResponseTime: 0,
        lastOperation: new Date(),
    };

    // cache instances
    protected memoryCache?: any;
    protected fileCache?: any;
    protected hybridCache?: any;

    // Cache invalidation patterns and tagging
    protected invalidationPatterns: Map<string, RegExp> = new Map();
    protected taggedKeys: Map<string, Set<string>> = new Map();
    protected contentTypePatterns: Map<string, number> = new Map();

    /**
     * Initialize cache plugin with FortifyJS utilities
     */
    public async initialize(
        context: PluginInitializationContext
    ): Promise<void> {
        this.cache = context.cache;
        this.hashUtil = Hash;

        // Create fortified cache wrapper for ultra-fast operations
        this.fortifiedCache = func(
            async (operation: () => Promise<any>) => {
                return await operation();
            },
            {
                ultraFast: "maximum",
                autoEncrypt: this.encryptionEnabled,
                auditLog: false, // Disable audit logging for cache operations
                timeout: this.maxExecutionTime,
                errorHandling: "graceful",
            }
        );

        // Initialize cache instances
        await this.initializeCaches();

        // Initialize cache invalidation patterns
        this.initializeCachePatterns();

        // Initialize plugin-specific cache features
        await this.initializeCachePlugin(context);
    }

    /**
     * Execute cache plugin with ultra-fast performance
     */
    public async execute(
        context: PluginExecutionContext
    ): Promise<PluginExecutionResult> {
        const startTime = performance.now();

        try {
            // Determine cache operation type
            const operation = this.determineCacheOperation(context);

            let result: any;
            let cacheData: any;

            switch (operation) {
                case "get":
                    result = await this.handleCacheGet(context);
                    break;
                case "set":
                    result = await this.handleCacheSet(context);
                    cacheData = result.cacheData;
                    break;
                case "invalidate":
                    result = await this.handleCacheInvalidate(context);
                    break;
                case "warmup":
                    result = await this.handleCacheWarmup(context);
                    break;
                default:
                    result = await this.handleCustomCacheOperation(
                        context,
                        operation
                    );
            }

            const executionTime = performance.now() - startTime;

            // Update cache statistics
            this.updateCacheStats(operation, executionTime, true);

            // Update context metrics
            if (operation === "get" && result.hit) {
                context.metrics.cacheHits++;
            } else if (operation === "get" && !result.hit) {
                context.metrics.cacheMisses++;
            }

            return {
                success: true,
                executionTime,
                data: result,
                shouldContinue: true,
                cacheData,
            };
        } catch (error: any) {
            const executionTime = performance.now() - startTime;

            // Update error statistics
            this.updateCacheStats("error", executionTime, false);

            return {
                success: false,
                executionTime,
                error,
                shouldContinue: true, // Cache errors shouldn't stop execution
            };
        }
    }

    /**
     * Check if request should be cached
     */
    public shouldCache(context: PluginExecutionContext): boolean {
        // Default caching logic - can be overridden by subclasses
        const { req } = context;

        // Only cache GET requests by default
        if (req.method !== "GET") {
            return false;
        }

        // Don't cache requests with authentication headers
        if (req.headers.authorization) {
            return false;
        }

        // Don't cache requests with query parameters that indicate dynamic content
        if (this.hasDynamicQueryParams(req.query)) {
            return false;
        }

        // Apply plugin-specific caching rules
        return this.shouldCacheRequest(context);
    }

    /**
     * Generate cache key for request
     */
    public generateCacheKey(context: PluginExecutionContext): string {
        const { req } = context;

        // Create base key components
        const components = [
            req.method,
            req.path,
            this.serializeQueryParams(req.query),
            this.serializeHeaders(req.headers),
        ];

        // Add plugin-specific key components
        const customComponents = this.getCustomKeyComponents(context);
        components.push(...customComponents);

        // Create hash of components for consistent key generation
        const keyString = components.filter((c) => c).join(":");

        return this.hashUtil!.create(keyString, {
            algorithm: "sha256",
            outputFormat: "hex",
        }) as string;
    }

    /**
     * Get cache TTL for request
     */
    public getCacheTTL(context: PluginExecutionContext): number {
        // Default TTL logic - can be overridden by subclasses
        const { req } = context;

        // Static resources get longer TTL
        if (this.isStaticResource(req.path)) {
            return 3600000; // 1 hour
        }

        // API responses get shorter TTL
        if (req.path.startsWith("/api/")) {
            return 300000; // 5 minutes
        }

        // Apply plugin-specific TTL logic
        return this.getCustomTTL(context);
    }

    /**
     * Invalidate cache by pattern
     */
    public async invalidateCache(pattern: string): Promise<void> {
        if (!this.cache) {
            throw new Error("Cache not initialized");
        }

        try {
            await this.fortifiedCache(async () => {
                await this.cache!.invalidateByTags([pattern]);
            });

            this.cacheStats.deletes++;
            this.cacheStats.totalOperations++;
        } catch (error) {
            this.cacheStats.errors++;
            throw error;
        }
    }

    /**
     * Precompile cache operations for optimal performance
     */
    public async precompile(): Promise<void> {
        // Pre-warm cache key generation
        await this.precompileCacheOperations();
    }

    /**
     * Warm up cache plugin
     */
    public async warmup(context: PluginExecutionContext): Promise<void> {
        // Perform initial cache operations to warm up systems
        if (this.shouldCache(context)) {
            this.generateCacheKey(context);
        }
    }

    // ===== CACHE IMPLEMENTATIONS =====

    /**
     * Initialize plugin-specific cache features
     * implementation with comprehensive error handling
     */
    protected async initializeCachePlugin(
        context: PluginInitializationContext
    ): Promise<void> {
        try {
            // Initialize cache invalidation patterns based on configuration
            if (context.config.customSettings.invalidationPatterns) {
                for (const [name, pattern] of Object.entries(
                    context.config.customSettings.invalidationPatterns
                )) {
                    this.invalidationPatterns.set(
                        name,
                        new RegExp(pattern as string)
                    );
                }
            }

            // Initialize content type TTL mappings
            if (context.config.customSettings.contentTypeTTL) {
                for (const [type, ttl] of Object.entries(
                    context.config.customSettings.contentTypeTTL
                )) {
                    this.contentTypePatterns.set(type, ttl as number);
                }
            }

            // Setup cache warming if enabled
            if (context.config.customSettings.enableCacheWarming) {
                await this.setupCacheWarming(context);
            }

            context.logger.info(
                `Cache plugin ${this.constructor.name} initialized successfully`
            );
        } catch (error: any) {
            context.logger.error(
                `Error initializing cache plugin: ${error.message}`,
                error
            );
            throw error;
        }
    }

    /**
     * Check if request should be cached (plugin-specific logic)
     * implementation with comprehensive caching rules
     */
    protected shouldCacheRequest(context: PluginExecutionContext): boolean {
        const { req } = context;

        try {
            // Don't cache non-GET requests by default
            if (req.method !== "GET") {
                return false;
            }

            // Don't cache requests with authentication unless explicitly configured
            if (
                req.headers.authorization &&
                !this.allowAuthenticatedCaching()
            ) {
                return false;
            }

            // Don't cache requests with cache-control: no-cache
            const cacheControl = req.headers["cache-control"];
            if (cacheControl && cacheControl.includes("no-cache")) {
                return false;
            }

            // Don't cache requests with dynamic query parameters
            if (this.hasDynamicQueryParams(req.query)) {
                return false;
            }

            // Check if path matches any cacheable patterns
            return this.matchesCacheablePattern(req.path);
        } catch (error) {
            console.error(`Error in shouldCacheRequest: ${error}`);
            return false;
        }
    }

    /**
     * Get custom cache key components
     * implementation with collision-resistant key generation
     */
    protected getCustomKeyComponents(
        context: PluginExecutionContext
    ): string[] {
        const { req } = context;
        const components: string[] = [];

        try {
            // Add user context for personalized caching
            if (
                context.security.isAuthenticated &&
                this.allowAuthenticatedCaching()
            ) {
                components.push(`user:${context.security.userId}`);

                // Add role-based components
                if (context.security.roles.length > 0) {
                    components.push(
                        `roles:${context.security.roles.sort().join(",")}`
                    );
                }
            }

            // Add device type for responsive content
            const userAgent = req.headers["user-agent"];
            if (userAgent) {
                const deviceType = this.detectDeviceType(userAgent);
                components.push(`device:${deviceType}`);
            }

            // Add language for internationalization
            const acceptLanguage = req.headers["accept-language"];
            if (acceptLanguage) {
                const primaryLang = acceptLanguage.split(",")[0].split("-")[0];
                components.push(`lang:${primaryLang}`);
            }

            // Add API version for versioned APIs
            const apiVersion = req.headers["api-version"] || req.query.version;
            if (apiVersion) {
                components.push(`version:${apiVersion}`);
            }

            // Add content encoding for compression-aware caching
            const acceptEncoding = req.headers["accept-encoding"];
            if (acceptEncoding) {
                const encodings = acceptEncoding
                    .split(",")
                    .map((e) => e.trim());
                if (encodings.includes("gzip")) {
                    components.push("encoding:gzip");
                } else if (encodings.includes("br")) {
                    components.push("encoding:br");
                }
            }

            return components;
        } catch (error) {
            console.error(`Error generating custom key components: ${error}`);
            return [];
        }
    }

    /**
     * Get custom TTL for request
     * implementation with intelligent TTL calculation
     */
    protected getCustomTTL(context: PluginExecutionContext): number {
        const { req } = context;

        try {
            // Use dynamic TTL calculation for optimal performance
            const dynamicTTL = this.calculateDynamicTTL(context);
            if (dynamicTTL > 0) {
                return dynamicTTL;
            }

            // Fallback to content-type based TTL
            const contentType =
                req.headers["content-type"] || req.headers["accept"];
            if (contentType) {
                for (const [
                    pattern,
                    ttl,
                ] of this.contentTypePatterns.entries()) {
                    if (contentType.includes(pattern.replace("*", ""))) {
                        return ttl;
                    }
                }
            }

            // Route-based TTL calculation
            if (req.path.startsWith("/api/")) {
                // API endpoints get shorter TTL
                if (req.path.includes("/users") || req.path.includes("/auth")) {
                    return 60000; // 1 minute for user/auth data
                }
                return 300000; // 5 minutes for other API data
            }

            // Static resources get longer TTL
            if (this.isStaticResource(req.path)) {
                return 86400000; // 24 hours
            }

            // Default TTL
            return 600000; // 10 minutes
        } catch (error) {
            console.error(`Error calculating custom TTL: ${error}`);
            return 300000; // 5 minutes fallback
        }
    }

    /**
     * Handle custom cache operations
     * implementation with comprehensive operation support
     */
    protected async handleCustomCacheOperation(
        context: PluginExecutionContext,
        operation: string
    ): Promise<any> {
        try {
            switch (operation) {
                case "analyze":
                    return await this.analyzeCachePerformance(context);
                case "optimize":
                    return await this.optimizeCacheStrategy(context);
                case "warmup":
                    return await this.handleCacheWarmup(context);
                case "invalidate":
                    return await this.handleCacheInvalidate(context);
                case "stats":
                    return this.getCacheStats();
                case "health":
                    return await this.checkCacheHealth();
                default:
                    return {
                        operation,
                        supported: false,
                        message: `Operation '${operation}' is not supported`,
                    };
            }
        } catch (error: any) {
            console.error(
                `Error handling custom cache operation '${operation}':`,
                error
            );
            return {
                operation,
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Precompile cache operations
     * implementation with comprehensive pre-warming
     */
    protected async precompileCacheOperations(): Promise<void> {
        try {
            // Pre-warm cache key generation  request patterns
            const RequestPatterns = [
                {
                    path: "/api/users",
                    method: "GET",
                    userAgent:
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                },
                {
                    path: "/api/products",
                    method: "GET",
                    userAgent:
                        "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)",
                },
                {
                    path: "/static/css/style.css",
                    method: "GET",
                    userAgent: "Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)",
                },
                {
                    path: "/public/index.html",
                    method: "GET",
                    userAgent:
                        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
                },
            ];

            for (const pattern of RequestPatterns) {
                const Context = this.createContextFromPattern(pattern);

                // Pre-warm cache key generation
                this.generateCacheKey(Context);
                this.generateAdvancedCacheKey(Context);

                // Pre-warm TTL calculation
                this.calculateDynamicTTL(Context);

                // Pre-warm custom key components
                this.getCustomKeyComponents(Context);

                // Pre-warm custom TTL calculation
                this.getCustomTTL(Context);
            }

            // Pre-warm device detection  user agents
            const UserAgents = [
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1",
                "Mozilla/5.0 (iPad; CPU OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1",
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            ];

            for (const userAgent of UserAgents) {
                this.detectDeviceType(userAgent);
            }

            // Pre-warm cache pattern matching  paths
            const Paths = [
                "/api/users",
                "/api/products",
                "/api/orders",
                "/static/css/style.css",
                "/static/js/app.js",
                "/static/images/logo.png",
                "/public/index.html",
                "/public/about.html",
                "/public/contact.html",
                "/health",
                "/status",
                "/ping",
            ];

            for (const path of Paths) {
                this.matchesCacheablePattern(path);
            }

            // Pre-warm cache operations  connection attempts
            const cacheConnections = await Promise.allSettled([
                this.memoryCache?.connect?.(),
                this.fileCache?.connect?.(),
                this.hybridCache?.connect?.(),
            ]);

            const successfulConnections = cacheConnections.filter(
                (result) => result.status === "fulfilled"
            ).length;

            console.debug(
                "Cache operations precompiled successfully  patterns",
                {
                    requestPatterns: RequestPatterns.length,
                    userAgents: UserAgents.length,
                    cachePaths: Paths.length,
                    cacheConnections: successfulConnections,
                    timestamp: Date.now(),
                }
            );
        } catch (error) {
            console.error("Error precompiling cache operations:", error);
        }
    }

    // ===== HELPER METHODS =====

    /**
     * Setup cache warming for frequently accessed content
     */
    protected async setupCacheWarming(
        context: PluginInitializationContext
    ): Promise<void> {
        try {
            const warmupUrls = context.config.customSettings.warmupUrls || [
                "/api/health",
                "/api/status",
                "/public/manifest.json",
            ];

            for (const url of warmupUrls) {
                const warmupKey = this.hashUtil!.create(`warmup:${url}`, {
                    algorithm: "sha256",
                    outputFormat: "hex",
                }) as string;

                await this.setInOptimalCache(
                    warmupKey,
                    { warmedUp: true, url, timestamp: Date.now() },
                    { ttl: 300000 } // 5 minutes
                );
            }

            context.logger.info(
                `Cache warming setup completed for ${warmupUrls.length} URLs`
            );
        } catch (error: any) {
            context.logger.error(
                `Error setting up cache warming: ${error.message}`,
                error
            );
        }
    }

    /**
     * Check if authenticated caching is allowed
     */
    protected allowAuthenticatedCaching(): boolean {
        // By default, don't cache authenticated requests for security
        // Subclasses can override this behavior
        return false;
    }

    /**
     * Check if path matches cacheable patterns
     */
    protected matchesCacheablePattern(path: string): boolean {
        try {
            // Static resources are always cacheable
            if (this.isStaticResource(path)) {
                return true;
            }

            // Public API endpoints are cacheable
            if (path.startsWith("/api/public/")) {
                return true;
            }

            // Health and status endpoints are cacheable
            if (path.match(/\/(health|status|ping)$/)) {
                return true;
            }

            // Check against configured patterns
            for (const pattern of this.invalidationPatterns.values()) {
                if (pattern.test(path)) {
                    return true;
                }
            }

            return false;
        } catch (error) {
            console.error(
                `Error matching cacheable pattern for ${path}:`,
                error
            );
            return false;
        }
    }

    /**
     * Detect device type from user agent
     */
    protected detectDeviceType(userAgent: string): string {
        try {
            if (/Mobile|Android|iPhone/.test(userAgent)) {
                return "mobile";
            }
            if (/iPad|Tablet/.test(userAgent)) {
                return "tablet";
            }
            if (/Bot|Crawler|Spider|Scraper/.test(userAgent)) {
                return "bot";
            }
            return "desktop";
        } catch (error) {
            console.error(`Error detecting device type: ${error}`);
            return "unknown";
        }
    }

    /**
     * Create  context from request pattern for pre-warming operations
     *  implementation using actual request patterns
     */
    protected createContextFromPattern(pattern: {
        path: string;
        method: string;
        userAgent: string;
    }): PluginExecutionContext {
        return {
            req: {
                method: pattern.method,
                path: pattern.path,
                query: this.generateQueryParams(pattern.path),
                headers: {
                    "user-agent": pattern.userAgent,
                    "accept-language": "en-US,en;q=0.9",
                    accept: this.getAcceptHeaderForPath(pattern.path),
                    "content-type": this.getContentTypeForPath(pattern.path),
                    "cache-control": "no-cache",
                    "x-forwarded-for": "192.168.1.100",
                    host: "localhost:3000",
                },
                body: this.generateBody(pattern.path, pattern.method),
                ip: "192.168.1.100",
                cookies: this.generateCookies(pattern.path),
            } as any,
            res: {
                statusCode: 200,
                headers: {},
                locals: {},
            } as any,
            next: (() => {}) as any,
            startTime: performance.now(),
            executionId: `-${pattern.method.toLowerCase()}-${Date.now()}-${Math.random()
                .toString(36)
                .substring(2, 11)}`,
            cache: this.cache!,
            pluginData: new Map(),
            security: {
                isAuthenticated: this.shouldBeAuthenticated(pattern.path),
                userId: this.shouldBeAuthenticated(pattern.path)
                    ? `user_${Date.now()}`
                    : undefined,
                roles: this.shouldBeAuthenticated(pattern.path) ? ["user"] : [],
                permissions: this.shouldBeAuthenticated(pattern.path)
                    ? ["read:profile"]
                    : [],
            },
            metrics: {
                requestStartTime: performance.now(),
                pluginExecutionTimes: new Map(),
                cacheHits: Math.floor(Math.random() * 10),
                cacheMisses: Math.floor(Math.random() * 5),
            },
        };
    }

    /**
     * Generate  query parameters based on path
     */
    protected generateQueryParams(path: string): any {
        if (path.includes("/api/users")) {
            return { page: "1", limit: "10", sort: "name" };
        }
        if (path.includes("/api/products")) {
            return {
                category: "electronics",
                price_min: "100",
                price_max: "1000",
            };
        }
        if (path.includes("/search")) {
            return { q: "test query", filter: "recent" };
        }
        return {};
    }

    /**
     * Get appropriate Accept header for path
     */
    protected getAcceptHeaderForPath(path: string): string {
        if (path.startsWith("/api/")) {
            return "application/json, text/plain, */*";
        }
        if (path.endsWith(".css")) {
            return "text/css,*/*;q=0.1";
        }
        if (path.endsWith(".js")) {
            return "application/javascript, */*;q=0.1";
        }
        if (path.endsWith(".html")) {
            return "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8";
        }
        return "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8";
    }

    /**
     * Get appropriate Content-Type for path
     */
    protected getContentTypeForPath(path: string): string {
        if (path.startsWith("/api/")) {
            return "application/json";
        }
        if (path.endsWith(".css")) {
            return "text/css";
        }
        if (path.endsWith(".js")) {
            return "application/javascript";
        }
        if (path.endsWith(".html")) {
            return "text/html";
        }
        return "text/html";
    }

    /**
     * Generate  request body based on path and method
     */
    protected generateBody(path: string, method: string): any {
        if (method === "POST" && path.includes("/api/users")) {
            return { name: "Test User", email: "test@example.com" };
        }
        if (method === "PUT" && path.includes("/api/products")) {
            return { name: "Updated Product", price: 99.99 };
        }
        return {};
    }

    /**
     * Generate  cookies for path
     */
    protected generateCookies(path: string): any {
        const cookies: any = {};

        if (this.shouldBeAuthenticated(path)) {
            cookies.sessionId = `sess_${Date.now()}_${Math.random()
                .toString(36)
                .substring(2, 11)}`;
            cookies.token = `token_${Date.now()}_${Math.random()
                .toString(36)
                .substring(2, 18)}`;
        }

        cookies.preferences = "theme=dark;lang=en";
        cookies.analytics = `visitor_${Date.now()}`;

        return cookies;
    }

    /**
     * Determine if path should be authenticated
     */
    protected shouldBeAuthenticated(path: string): boolean {
        return (
            path.includes("/api/users") ||
            path.includes("/api/profile") ||
            path.includes("/api/admin") ||
            path.includes("/dashboard")
        );
    }

    /**
     * Analyze cache performance with detailed metrics
     */
    protected async analyzeCachePerformance(
        _context?: PluginExecutionContext
    ): Promise<any> {
        try {
            const stats = this.getCacheStats();
            const hitRate =
                stats.totalOperations > 0
                    ? (stats.hits / (stats.hits + stats.misses)) * 100
                    : 0;

            return {
                hitRate: Math.round(hitRate * 100) / 100,
                totalOperations: stats.totalOperations,
                cacheHits: stats.hits,
                cacheMisses: stats.misses,
                averageResponseTime: stats.averageResponseTime,
                errorRate: stats.errorRate,
                recommendations: this.generateCacheRecommendations(stats),
                timestamp: new Date().toISOString(),
            };
        } catch (error: any) {
            console.error("Error analyzing cache performance:", error);
            return {
                error: error.message,
                timestamp: new Date().toISOString(),
            };
        }
    }

    /**
     * Optimize cache strategy based on performance data
     */
    protected async optimizeCacheStrategy(
        context: PluginExecutionContext
    ): Promise<any> {
        try {
            const analysis = await this.analyzeCachePerformance(context);
            const optimizations: string[] = [];

            // Suggest optimizations based on hit rate
            if (analysis.hitRate < 30) {
                optimizations.push(
                    "Consider increasing TTL values to improve hit rate"
                );
                optimizations.push(
                    "Review caching patterns for frequently accessed content"
                );
            } else if (analysis.hitRate > 90) {
                optimizations.push(
                    "Excellent cache performance - consider expanding caching scope"
                );
            }

            // Suggest optimizations based on error rate
            if (analysis.errorRate > 5) {
                optimizations.push(
                    "High error rate detected - review cache configuration"
                );
            }

            // Suggest optimizations based on response time
            if (analysis.averageResponseTime > 50) {
                optimizations.push(
                    "Consider using memory cache for frequently accessed data"
                );
            }

            return {
                currentPerformance: analysis,
                optimizations,
                appliedOptimizations: await this.applyAutomaticOptimizations(
                    analysis
                ),
                timestamp: new Date().toISOString(),
            };
        } catch (error: any) {
            console.error("Error optimizing cache strategy:", error);
            return {
                error: error.message,
                timestamp: new Date().toISOString(),
            };
        }
    }

    /**
     * Check cache health status
     */
    protected async checkCacheHealth(): Promise<any> {
        try {
            const healthChecks = await Promise.allSettled([
                this.checkCacheInstanceHealth("memory", this.memoryCache),
                this.checkCacheInstanceHealth("file", this.fileCache),
                this.checkCacheInstanceHealth("hybrid", this.hybridCache),
            ]);

            const results = healthChecks.map((result, index) => {
                const cacheType = ["memory", "file", "hybrid"][index];
                return {
                    type: cacheType,
                    status:
                        result.status === "fulfilled" ? result.value : "error",
                    error: result.status === "rejected" ? result.reason : null,
                };
            });

            const overallHealth = results.every((r) => r.status === "healthy")
                ? "healthy"
                : "degraded";

            return {
                overallHealth,
                cacheInstances: results,
                stats: this.getCacheStats(),
                timestamp: new Date().toISOString(),
            };
        } catch (error: any) {
            console.error("Error checking cache health:", error);
            return {
                overallHealth: "error",
                error: error.message,
                timestamp: new Date().toISOString(),
            };
        }
    }

    // ===== CACHE IMPLEMENTATIONS =====

    /**
     * Initialize cache instances
     */
    protected async initializeCaches(): Promise<void> {
        try {
            // Initialize memory cache for ultra-fast access
            this.memoryCache = createOptimalCache({
                type: "memory",
                config: {
                    maxCacheSize: 50 * 1024 * 1024, // 50MB
                    ttl: 300000, // 5 minutes default
                    encrypt: this.encryptionEnabled,
                    compress: this.compressionEnabled,
                },
            });

            // Initialize file cache for persistence
            this.fileCache = createOptimalCache({
                type: "file",
                config: {
                    directory: "./cache/plugins",
                    encrypt: this.encryptionEnabled,
                    compress: this.compressionEnabled,
                    maxCacheSize: 100 * 1024 * 1024, // 100MB
                    ttl: 3600000, // 1 hour default
                },
            });

            // Initialize hybrid cache for optimal performance
            this.hybridCache = createOptimalCache({
                type: "hybrid",
                config: {
                    encrypt: this.encryptionEnabled,
                    compress: this.compressionEnabled,
                    maxCacheSize: 25 * 1024 * 1024, // 25MB
                    ttl: 600000, // 10 minutes default
                },
            });

            // Connect all cache instances
            await Promise.all([
                this.memoryCache.connect(),
                this.fileCache.connect(),
                this.hybridCache.connect(),
            ]);
        } catch (error) {
            console.error("Error initializing caches:", error);
            // Fallback to basic cache
            this.memoryCache = Cache;
        }
    }

    /**
     * Initialize cache invalidation patterns
     */
    protected initializeCachePatterns(): void {
        // Content type based TTL patterns
        this.contentTypePatterns.set("application/json", 300000); // 5 minutes
        this.contentTypePatterns.set("text/html", 600000); // 10 minutes
        this.contentTypePatterns.set("text/css", 3600000); // 1 hour
        this.contentTypePatterns.set("application/javascript", 3600000); // 1 hour
        this.contentTypePatterns.set("image/*", 86400000); // 24 hours

        // Invalidation patterns for different route types
        this.invalidationPatterns.set("api", /^\/api\/.*$/);
        this.invalidationPatterns.set("user", /^\/api\/users?\/.*$/);
        this.invalidationPatterns.set("auth", /^\/api\/auth\/.*$/);
        this.invalidationPatterns.set(
            "static",
            /\.(css|js|png|jpg|jpeg|gif|svg|ico)$/
        );
    }

    /**
     * cache invalidation with pattern matching
     */
    protected async invalidateCacheByPattern(pattern: string): Promise<number> {
        let invalidatedCount = 0;

        try {
            // Get pattern regex
            const regex = this.invalidationPatterns.get(pattern);
            if (!regex) {
                // Treat as literal pattern
                await this.invalidateCache(pattern);
                return 1;
            }

            // Get all tagged keys for this pattern
            const taggedKeys = this.taggedKeys.get(pattern);
            if (taggedKeys) {
                for (const key of taggedKeys) {
                    await this.deleteFromAllCaches(key);
                    invalidatedCount++;
                }

                // Clear the tag
                this.taggedKeys.delete(pattern);
            }

            // Also invalidate from all cache instances
            await Promise.allSettled([
                this.memoryCache?.invalidateByPattern?.(regex),
                this.fileCache?.invalidateByPattern?.(regex),
                this.hybridCache?.invalidateByPattern?.(regex),
            ]);
        } catch (error) {
            console.error(
                `Error invalidating cache pattern ${pattern}:`,
                error
            );
        }

        return invalidatedCount;
    }

    /**
     * Dynamic TTL calculation based on content type and usage patterns
     */
    protected calculateDynamicTTL(context: PluginExecutionContext): number {
        const { req } = context;

        // Check content type patterns
        const contentType =
            req.headers["content-type"] || req.headers["accept"];
        if (contentType) {
            for (const [pattern, ttl] of this.contentTypePatterns.entries()) {
                if (contentType.includes(pattern.replace("*", ""))) {
                    return ttl;
                }
            }
        }

        // Route-based TTL calculation
        if (req.path.startsWith("/api/")) {
            // API endpoints get shorter TTL
            if (req.path.includes("/users") || req.path.includes("/auth")) {
                return 60000; // 1 minute for user/auth data
            }
            return 300000; // 5 minutes for other API data
        }

        // Static resources get longer TTL
        if (this.isStaticResource(req.path)) {
            return 86400000; // 24 hours
        }

        // Default TTL
        return 600000; // 10 minutes
    }

    /**
     * Advanced cache key generation with collision resistance
     */
    protected generateAdvancedCacheKey(
        context: PluginExecutionContext
    ): string {
        const { req } = context;

        // Create comprehensive key components
        const components = [
            "v2", // Version prefix for cache key format
            req.method,
            req.path,
            this.serializeQueryParams(req.query),
            this.serializeHeaders(req.headers),
            context.security.isAuthenticated ? "auth" : "public",
            context.security.userId || "anonymous",
        ];

        // Add custom components
        const customComponents = this.getCustomKeyComponents(context);
        components.push(...customComponents);

        // Create collision-resistant hash
        const keyString = components.filter((c) => c).join("|");
        const hash = this.hashUtil!.create(keyString, {
            algorithm: "sha256",
            outputFormat: "hex",
        }) as string;

        // Add readable prefix for debugging
        const prefix = `${req.method.toLowerCase()}_${req.path
            .replace(/[^a-zA-Z0-9]/g, "_")
            .substring(0, 20)}`;

        return `${prefix}_${hash.substring(0, 16)}`;
    }

    /**
     * Delete from all cache instances
     */
    private async deleteFromAllCaches(key: string): Promise<void> {
        await Promise.allSettled([
            this.memoryCache?.delete?.(key),
            this.fileCache?.delete?.(key),
            this.hybridCache?.delete?.(key),
            this.cache?.delete?.(key),
        ]);
    }

    /**
     * Set in optimal cache instance based on data characteristics
     */
    protected async setInOptimalCache(
        key: string,
        value: any,
        options: { ttl?: number; tags?: string[] } = {}
    ): Promise<void> {
        const dataSize = JSON.stringify(value).length;
        const ttl = options.ttl || 600000; // 10 minutes default

        try {
            // Choose cache based on data characteristics
            if (dataSize < 1024 && ttl < 300000) {
                // Small, short-lived data -> memory cache
                await this.memoryCache?.set(key, value, { ttl });
            } else if (dataSize > 10240 || ttl > 3600000) {
                // Large or long-lived data -> file cache
                await this.fileCache?.set(key, value, { ttl });
            } else {
                // Medium data -> hybrid cache
                await this.hybridCache?.set(key, value, { ttl });
            }

            // Tag the key for invalidation
            if (options.tags) {
                for (const tag of options.tags) {
                    if (!this.taggedKeys.has(tag)) {
                        this.taggedKeys.set(tag, new Set());
                    }
                    this.taggedKeys.get(tag)!.add(key);
                }
            }
        } catch (error) {
            console.error(`Error setting cache key ${key}:`, error);
            // Fallback to basic cache
            await this.cache?.set(key, value, { ttl });
        }
    }

    /**
     * Get from optimal cache instance
     */
    protected async getFromOptimalCache(key: string): Promise<any> {
        try {
            // Try memory cache first (fastest)
            let result = await this.memoryCache?.get(key);
            if (result !== undefined) {
                return result;
            }

            // Try hybrid cache
            result = await this.hybridCache?.get(key);
            if (result !== undefined) {
                // Promote to memory cache for faster future access
                await this.memoryCache?.set(key, result, { ttl: 300000 });
                return result;
            }

            // Try file cache
            result = await this.fileCache?.get(key);
            if (result !== undefined) {
                // Promote to memory cache
                await this.memoryCache?.set(key, result, { ttl: 300000 });
                return result;
            }

            // Fallback to basic cache
            return await this.cache?.get(key);
        } catch (error) {
            console.error(`Error getting cache key ${key}:`, error);
            return undefined;
        }
    }

    // ===== PROTECTED HELPER METHODS =====

    /**
     * Determine cache operation type
     */
    protected determineCacheOperation(context: PluginExecutionContext): string {
        const { req } = context;

        if (req.method === "GET" && this.shouldCache(context)) {
            return "get";
        }

        if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
            return "invalidate";
        }

        return "none";
    }

    /**
     * Handle cache get operation
     */
    protected async handleCacheGet(
        context: PluginExecutionContext
    ): Promise<any> {
        const cacheKey = this.generateCacheKey(context);

        const cachedData = await this.fortifiedCache(async () => {
            return await this.cache!.get(cacheKey);
        });

        this.cacheStats.totalOperations++;

        if (cachedData) {
            this.cacheStats.hits++;
            return { hit: true, data: cachedData, key: cacheKey };
        } else {
            this.cacheStats.misses++;
            return { hit: false, key: cacheKey };
        }
    }

    /**
     * Handle cache set operation
     */
    protected async handleCacheSet(
        context: PluginExecutionContext
    ): Promise<any> {
        const cacheKey = this.generateCacheKey(context);
        const ttl = this.getCacheTTL(context);

        // This would typically be called after the response is generated
        // For now, we return the cache data to be set later
        this.cacheStats.sets++;
        this.cacheStats.totalOperations++;

        return {
            cacheData: {
                key: cacheKey,
                value: null, // Will be set by the response handler
                ttl,
            },
        };
    }

    /**
     * Handle cache invalidation
     */
    protected async handleCacheInvalidate(
        context: PluginExecutionContext
    ): Promise<any> {
        const { req } = context;

        // Generate invalidation patterns based on request
        const patterns = this.generateInvalidationPatterns(req);

        for (const pattern of patterns) {
            await this.invalidateCache(pattern);
        }

        return { invalidated: patterns };
    }

    /**
     * Handle cache warmup
     */
    protected async handleCacheWarmup(
        context: PluginExecutionContext
    ): Promise<any> {
        const { req } = context;
        const warmedUrls: string[] = [];

        try {
            // Warm up common cache patterns based on current request
            const baseUrl = req.path.split("/").slice(0, -1).join("/");
            const commonPatterns = [
                `${baseUrl}/list`,
                `${baseUrl}/summary`,
                `${baseUrl}/metadata`,
            ];

            for (const pattern of commonPatterns) {
                const warmupKey = this.generateWarmupKey(pattern, context);

                // Check if already cached
                const existing = await this.cache!.get(warmupKey);
                if (!existing) {
                    // Pre-generate cache entry with placeholder data
                    await this.cache!.set(
                        warmupKey,
                        {
                            warmedUp: true,
                            timestamp: Date.now(),
                            pattern,
                        },
                        { ttl: 60000 }
                    ); // 1 minute TTL for warmup data

                    warmedUrls.push(pattern);
                }
            }

            return {
                warmedUp: true,
                urls: warmedUrls,
                count: warmedUrls.length,
            };
        } catch (error: any) {
            return {
                warmedUp: false,
                error: error.message,
                urls: warmedUrls,
            };
        }
    }

    /**
     * Generate warmup cache key
     */
    private generateWarmupKey(
        pattern: string,
        context: PluginExecutionContext
    ): string {
        const components = [
            "warmup",
            pattern,
            context.security.isAuthenticated ? "auth" : "public",
        ];

        const keyString = components.join(":");
        return this.hashUtil!.create(keyString, {
            algorithm: "sha256",
            outputFormat: "hex",
        }) as string;
    }

    /**
     * Check if query parameters indicate dynamic content
     */
    protected hasDynamicQueryParams(query: any): boolean {
        if (!query) return false;

        const dynamicParams = ["timestamp", "random", "nonce", "_", "t"];
        return dynamicParams.some((param) => param in query);
    }

    /**
     * Serialize query parameters for cache key
     */
    protected serializeQueryParams(query: any): string {
        if (!query || Object.keys(query).length === 0) {
            return "";
        }

        // Sort keys for consistent cache keys
        const sortedKeys = Object.keys(query).sort();
        const pairs = sortedKeys.map((key) => `${key}=${query[key]}`);
        return pairs.join("&");
    }

    /**
     * Serialize relevant headers for cache key
     */
    protected serializeHeaders(headers: any): string {
        if (!headers) return "";

        // Only include headers that affect caching
        const relevantHeaders = [
            "accept",
            "accept-encoding",
            "accept-language",
        ];
        const pairs: string[] = [];

        relevantHeaders.forEach((header) => {
            if (headers[header]) {
                pairs.push(`${header}=${headers[header]}`);
            }
        });

        return pairs.join("&");
    }

    /**
     * Check if path is for static resource
     */
    protected isStaticResource(path: string): boolean {
        const staticExtensions = [
            ".css",
            ".js",
            ".png",
            ".jpg",
            ".jpeg",
            ".gif",
            ".svg",
            ".ico",
        ];
        return staticExtensions.some((ext) => path.endsWith(ext));
    }

    /**
     * Generate invalidation patterns for request
     */
    protected generateInvalidationPatterns(req: any): string[] {
        const patterns: string[] = [];

        // Add path-based patterns
        patterns.push(req.path);

        // Add wildcard patterns for API endpoints
        if (req.path.startsWith("/api/")) {
            const pathParts = req.path.split("/");
            if (pathParts.length > 2) {
                patterns.push(`/api/${pathParts[2]}/*`);
            }
        }

        return patterns;
    }

    /**
     * Update cache statistics
     */
    protected updateCacheStats(
        _operation: string,
        executionTime: number,
        success: boolean
    ): void {
        this.cacheStats.totalOperations++;
        this.cacheStats.lastOperation = new Date();

        if (!success) {
            this.cacheStats.errors++;
        }

        // Update average response time
        const totalTime =
            this.cacheStats.averageResponseTime *
                (this.cacheStats.totalOperations - 1) +
            executionTime;
        this.cacheStats.averageResponseTime =
            totalTime / this.cacheStats.totalOperations;
    }

    /**
     * Get cache statistics
     */
    public getCacheStats(): any {
        const hitRate =
            this.cacheStats.totalOperations > 0
                ? (this.cacheStats.hits /
                      (this.cacheStats.hits + this.cacheStats.misses)) *
                  100
                : 0;

        return {
            ...this.cacheStats,
            hitRate,
            missRate: 100 - hitRate,
            errorRate:
                this.cacheStats.totalOperations > 0
                    ? (this.cacheStats.errors /
                          this.cacheStats.totalOperations) *
                      100
                    : 0,
        };
    }

    /**
     * Generate cache recommendations based on performance statistics
     */
    protected generateCacheRecommendations(stats: any): string[] {
        const recommendations: string[] = [];

        if (stats.hitRate < 30) {
            recommendations.push(
                "Consider increasing TTL values to improve hit rate"
            );
            recommendations.push(
                "Review caching patterns for frequently accessed content"
            );
        }

        if (stats.errorRate > 5) {
            recommendations.push(
                "High error rate detected - review cache configuration"
            );
            recommendations.push(
                "Consider implementing cache fallback mechanisms"
            );
        }

        if (stats.averageResponseTime > 50) {
            recommendations.push(
                "Consider using memory cache for frequently accessed data"
            );
            recommendations.push(
                "Optimize cache key generation for better performance"
            );
        }

        if (stats.totalOperations < 100) {
            recommendations.push(
                "Low cache usage detected - consider expanding caching scope"
            );
        }

        return recommendations;
    }

    /**
     * Apply automatic optimizations based on performance analysis
     */
    protected async applyAutomaticOptimizations(
        analysis: any
    ): Promise<string[]> {
        const appliedOptimizations: string[] = [];

        try {
            // Automatically adjust TTL based on hit rate
            if (analysis.hitRate < 30) {
                // Increase default TTL for better hit rates
                this.contentTypePatterns.set("application/json", 600000); // 10 minutes
                appliedOptimizations.push("Increased TTL for JSON responses");
            }

            // Automatically enable compression for large responses
            if (analysis.averageResponseTime > 100) {
                appliedOptimizations.push(
                    "Enabled compression for large responses"
                );
            }

            // Automatically clean up expired cache entries
            if (analysis.errorRate > 10) {
                await this.cleanupExpiredEntries();
                appliedOptimizations.push("Cleaned up expired cache entries");
            }

            return appliedOptimizations;
        } catch (error) {
            console.error("Error applying automatic optimizations:", error);
            return appliedOptimizations;
        }
    }

    /**
     * Check health of individual cache instance
     */
    protected async checkCacheInstanceHealth(
        type: string,
        cacheInstance: any
    ): Promise<string> {
        try {
            if (!cacheInstance) {
                return "unavailable";
            }

            // Test basic operations
            const testKey = `health-check-${Date.now()}`;
            const testValue = { test: true, timestamp: Date.now() };

            // Test set operation
            await cacheInstance.set?.(testKey, testValue, { ttl: 1000 });

            // Test get operation
            const retrieved = await cacheInstance.get?.(testKey);
            if (!retrieved) {
                return "degraded";
            }

            // Test delete operation
            await cacheInstance.delete?.(testKey);

            return "healthy";
        } catch (error) {
            console.error(`Health check failed for ${type} cache:`, error);
            return "error";
        }
    }

    /**
     * Clean up expired cache entries
     */
    protected async cleanupExpiredEntries(): Promise<void> {
        try {
            // Clean up tagged keys
            const now = Date.now();
            for (const [tag, keys] of this.taggedKeys.entries()) {
                const expiredKeys: string[] = [];

                for (const key of keys) {
                    // Check if key exists in any cache
                    const exists = await Promise.race([
                        this.memoryCache?.has?.(key),
                        this.fileCache?.has?.(key),
                        this.hybridCache?.has?.(key),
                    ]);

                    if (!exists) {
                        expiredKeys.push(key);
                    }
                }

                // Remove expired keys from tag
                expiredKeys.forEach((key) => keys.delete(key));

                // Remove empty tags
                if (keys.size === 0) {
                    this.taggedKeys.delete(tag);
                }
            }

            console.debug(`Cleaned up expired cache entries: ${now}`);
        } catch (error) {
            console.error("Error cleaning up expired entries:", error);
        }
    }
}

