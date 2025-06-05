/**
 * Smart Cache Plugin
 *
 * Intelligent caching plugin with <0.5ms execution overhead
 * leveraging FortifyJS cache systems for optimal performance.
 */

import { CachePlugin } from "../core/CachePlugin";
import {
    PluginPriority,
    PluginExecutionContext,
    PluginInitializationContext,
} from "../types/PluginTypes";

/**
 * Smart Cache Plugin for intelligent request caching
 */
export class SmartCachePlugin extends CachePlugin {
    public readonly id = "nehonix.ftfy.cache";
    public readonly name = "Smart Cache Plugin";
    public readonly version = "1.0.0";
    public readonly priority = PluginPriority.HIGH;

    // Cache configuration
    public readonly cacheStrategy: "memory" | "redis" | "hybrid" = "hybrid";
    public readonly compressionEnabled = true;
    public readonly encryptionEnabled = true; // Keep encryption for security

    // Smart caching rules
    private cachingRules: Map<
        string,
        {
            pattern: RegExp;
            ttl: number;
            enabled: boolean;
            compression: boolean;
            tags: string[];
        }
    > = new Map();

    // Cache analytics
    private cacheAnalytics = {
        totalRequests: 0,
        cacheableRequests: 0,
        cacheHits: 0,
        cacheMisses: 0,
        cacheSkips: 0,
        averageHitTime: 0,
        averageMissTime: 0,
        compressionSavings: 0,
    };

    // Dynamic TTL adjustment based on request patterns
    private requestPatterns: Map<
        string,
        {
            frequency: number;
            lastAccess: number;
            averageResponseTime: number;
            volatility: number; // How often the content changes
        }
    > = new Map();

    /**
     * Initialize smart cache plugin
     */
    protected async initializeCachePlugin(
        context: PluginInitializationContext
    ): Promise<void> {
        // Setup default caching rules
        this.setupDefaultCachingRules();

        // Configure custom rules from settings
        if (context.config.customSettings.cachingRules) {
            this.configureCachingRules(
                context.config.customSettings.cachingRules
            );
        }

        // Setup cache analytics cleanup
        this.setupAnalyticsCleanup();

        // Setup dynamic TTL adjustment
        this.setupDynamicTTLAdjustment();

        context.logger.info(
            "Smart Cache Plugin initialized with intelligent caching rules"
        );
    }

    /**
     * Check if request should be cached (plugin-specific logic)
     */
    protected shouldCacheRequest(context: PluginExecutionContext): boolean {
        const { req } = context;

        // Apply smart caching rules
        for (const [ruleName, rule] of this.cachingRules.entries()) {
            if (rule.enabled && rule.pattern.test(req.path)) {
                // Check additional conditions
                if (this.shouldApplyRule(context, rule)) {
                    return true;
                }
            }
        }

        // Fallback to intelligent heuristics
        return this.applyIntelligentCaching(context);
    }

    /**
     * Get custom cache key components
     */
    protected getCustomKeyComponents(
        context: PluginExecutionContext
    ): string[] {
        const { req } = context;
        const components: string[] = [];

        // Add user-specific components for personalized content
        if (context.security.isAuthenticated) {
            components.push(`user:${context.security.userId}`);

            // Add role-based caching
            if (context.security.roles.length > 0) {
                components.push(
                    `roles:${context.security.roles.sort().join(",")}`
                );
            }
        }

        // Add device type for responsive caching
        const userAgent = req.headers["user-agent"];
        if (userAgent) {
            const deviceType = this.detectDeviceType(userAgent);
            components.push(`device:${deviceType}`);
        }

        // Add language for i18n caching
        const acceptLanguage = req.headers["accept-language"];
        if (acceptLanguage) {
            const primaryLanguage = acceptLanguage.split(",")[0].split("-")[0];
            components.push(`lang:${primaryLanguage}`);
        }

        // Add API version for versioned APIs
        const apiVersion = req.headers["api-version"] || req.query.version;
        if (apiVersion) {
            components.push(`version:${apiVersion}`);
        }

        return components;
    }

    /**
     * Get custom TTL for request
     */
    protected getCustomTTL(context: PluginExecutionContext): number {
        const { req } = context;
        const route = this.normalizeRoute(req.path);

        // Check if we have pattern data for dynamic TTL
        const pattern = this.requestPatterns.get(route);
        if (pattern) {
            return this.calculateDynamicTTL(pattern);
        }

        // Apply rule-based TTL
        for (const [ruleName, rule] of this.cachingRules.entries()) {
            if (rule.enabled && rule.pattern.test(req.path)) {
                return rule.ttl;
            }
        }

        // Default TTL based on content type
        return this.getDefaultTTLByContentType(req.path);
    }

    /**
     * Handle custom cache operations
     */
    protected async handleCustomCacheOperation(
        context: PluginExecutionContext,
        operation: string
    ): Promise<any> {
        switch (operation) {
            case "analyze":
                return await this.analyzeCachePerformance(context);
            case "optimize":
                return await this.optimizeCacheStrategy(context);
            case "prefetch":
                return await this.prefetchRelatedContent(context);
            default:
                return { operation, supported: false };
        }
    }

    /**
     * Precompile cache operations
     */
    protected async precompileCacheOperations(): Promise<void> {
        // Pre-warm route normalization
        this.normalizeRoute("/api/users/123");

        // Pre-warm device detection
        this.detectDeviceType(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        );

        // Pre-warm TTL calculation
        this.calculateDynamicTTL({
            frequency: 10,
            lastAccess: Date.now(),
            averageResponseTime: 100,
            volatility: 0.1,
        });
    }

    // ===== SMART CACHING LOGIC =====

    /**
     * Setup default caching rules
     */
    private setupDefaultCachingRules(): void {
        // Static assets - long TTL
        this.cachingRules.set("static", {
            pattern: /\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/,
            ttl: 86400000, // 24 hours
            enabled: true,
            compression: true,
            tags: ["static"],
        });

        // API responses - medium TTL
        this.cachingRules.set("api", {
            pattern: /^\/api\/(?!auth|admin)/,
            ttl: 300000, // 5 minutes
            enabled: true,
            compression: true,
            tags: ["api"],
        });

        // Public pages - short TTL
        this.cachingRules.set("public", {
            pattern: /^\/(?!admin|dashboard|profile)/,
            ttl: 60000, // 1 minute
            enabled: true,
            compression: true,
            tags: ["public"],
        });

        // User-specific content - very short TTL
        this.cachingRules.set("user", {
            pattern: /^\/(profile|dashboard|settings)/,
            ttl: 30000, // 30 seconds
            enabled: true,
            compression: false,
            tags: ["user"],
        });
    }

    /**
     * Configure custom caching rules
     */
    private configureCachingRules(rules: any[]): void {
        for (const rule of rules) {
            this.cachingRules.set(rule.name, {
                pattern: new RegExp(rule.pattern),
                ttl: rule.ttl || 300000,
                enabled: rule.enabled !== false,
                compression: rule.compression !== false,
                tags: rule.tags || [],
            });
        }
    }

    /**
     * Check if caching rule should be applied
     */
    private shouldApplyRule(
        context: PluginExecutionContext,
        rule: any
    ): boolean {
        const { req } = context;

        // Don't cache authenticated requests for public rules
        if (rule.tags.includes("public") && context.security.isAuthenticated) {
            return false;
        }

        // Don't cache if request has cache-control: no-cache
        const cacheControl = req.headers["cache-control"];
        if (cacheControl && cacheControl.includes("no-cache")) {
            return false;
        }

        // Don't cache if request has pragma: no-cache
        const pragma = req.headers.pragma;
        if (pragma && pragma.includes("no-cache")) {
            return false;
        }

        return true;
    }

    /**
     * Apply intelligent caching heuristics
     */
    private applyIntelligentCaching(context: PluginExecutionContext): boolean {
        const { req } = context;

        // Analyze request characteristics
        const hasQueryParams = Object.keys(req.query).length > 0;
        const hasBody = req.body && Object.keys(req.body).length > 0;
        const isIdempotent = ["GET", "HEAD", "OPTIONS"].includes(req.method);

        // Don't cache non-idempotent requests
        if (!isIdempotent) {
            return false;
        }

        // Don't cache requests with complex query parameters
        if (hasQueryParams && this.hasComplexQueryParams(req.query)) {
            return false;
        }

        // Cache simple GET requests
        if (req.method === "GET" && !hasBody) {
            return true;
        }

        return false;
    }

    /**
     * Calculate dynamic TTL based on request patterns
     */
    protected calculateDynamicTTL(pattern: any): number {
        const baseTime = 300000; // 5 minutes base

        // Adjust based on frequency (more frequent = longer cache)
        const frequencyMultiplier = Math.min(pattern.frequency / 10, 2);

        // Adjust based on volatility (more volatile = shorter cache)
        const volatilityMultiplier = Math.max(1 - pattern.volatility, 0.1);

        // Adjust based on response time (slower = longer cache)
        const responseTimeMultiplier = Math.min(
            pattern.averageResponseTime / 100,
            3
        );

        return Math.round(
            baseTime *
                frequencyMultiplier *
                volatilityMultiplier *
                responseTimeMultiplier
        );
    }

    /**
     * Get default TTL by content type
     */
    private getDefaultTTLByContentType(path: string): number {
        if (path.match(/\.(css|js)$/)) {
            return 3600000; // 1 hour for CSS/JS
        }

        if (path.match(/\.(png|jpg|jpeg|gif|svg|ico)$/)) {
            return 86400000; // 24 hours for images
        }

        if (path.startsWith("/api/")) {
            return 300000; // 5 minutes for API
        }

        return 60000; // 1 minute default
    }

    // ===== ANALYTICS AND OPTIMIZATION =====

    /**
     * Analyze cache performance
     */
    protected async analyzeCachePerformance(
        context: PluginExecutionContext
    ): Promise<any> {
        const hitRate =
            this.cacheAnalytics.totalRequests > 0
                ? (this.cacheAnalytics.cacheHits /
                      this.cacheAnalytics.totalRequests) *
                  100
                : 0;

        const cacheableRate =
            this.cacheAnalytics.totalRequests > 0
                ? (this.cacheAnalytics.cacheableRequests /
                      this.cacheAnalytics.totalRequests) *
                  100
                : 0;

        return {
            hitRate: Math.round(hitRate * 100) / 100,
            cacheableRate: Math.round(cacheableRate * 100) / 100,
            totalRequests: this.cacheAnalytics.totalRequests,
            cacheHits: this.cacheAnalytics.cacheHits,
            cacheMisses: this.cacheAnalytics.cacheMisses,
            averageHitTime: this.cacheAnalytics.averageHitTime,
            averageMissTime: this.cacheAnalytics.averageMissTime,
            compressionSavings: this.cacheAnalytics.compressionSavings,
            topPatterns: this.getTopRequestPatterns(),
        };
    }

    /**
     * Optimize cache strategy
     */
    protected async optimizeCacheStrategy(
        context: PluginExecutionContext
    ): Promise<any> {
        const optimizations: string[] = [];

        // Analyze hit rates by rule
        for (const [ruleName, rule] of this.cachingRules.entries()) {
            // Suggest optimizations based on performance
            if (rule.enabled) {
                optimizations.push(`Rule '${ruleName}' is active`);
            }
        }

        // Suggest TTL adjustments
        const ttlSuggestions = this.suggestTTLOptimizations();
        optimizations.push(...ttlSuggestions);

        return {
            optimizations,
            suggestions: this.generateOptimizationSuggestions(),
        };
    }

    /**
     * Prefetch related content
     */
    protected async prefetchRelatedContent(
        context: PluginExecutionContext
    ): Promise<any> {
        const { req } = context;
        const relatedUrls = this.identifyRelatedContent(req.path);

        // This would typically trigger background prefetching
        return {
            prefetched: relatedUrls.length,
            urls: relatedUrls,
        };
    }

    // ===== UTILITY METHODS =====

    /**
     * Normalize route for pattern tracking
     */
    private normalizeRoute(path: string): string {
        return path
            .replace(/\/\d+/g, "/:id")
            .replace(/\/[a-f0-9-]{36}/g, "/:uuid")
            .replace(/\?.*$/, "");
    }

    /**
     * Detect device type from user agent
     */
    protected detectDeviceType(userAgent: string): string {
        if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
            return "mobile";
        }
        if (/Tablet|iPad/.test(userAgent)) {
            return "tablet";
        }
        return "desktop";
    }

    /**
     * Check for complex query parameters
     */
    private hasComplexQueryParams(query: any): boolean {
        const complexParams = [
            "search",
            "filter",
            "sort",
            "timestamp",
            "random",
        ];
        return complexParams.some((param) => param in query);
    }

    /**
     * Get top request patterns
     */
    private getTopRequestPatterns(): any[] {
        const patterns = Array.from(this.requestPatterns.entries())
            .sort((a, b) => b[1].frequency - a[1].frequency)
            .slice(0, 10);

        return patterns.map(([route, data]) => ({
            route,
            frequency: data.frequency,
            averageResponseTime: data.averageResponseTime,
            volatility: data.volatility,
        }));
    }

    /**
     * Suggest TTL optimizations
     */
    private suggestTTLOptimizations(): string[] {
        const suggestions: string[] = [];

        for (const [route, pattern] of this.requestPatterns.entries()) {
            if (pattern.frequency > 50 && pattern.volatility < 0.1) {
                suggestions.push(
                    `Increase TTL for high-frequency, stable route: ${route}`
                );
            }

            if (pattern.volatility > 0.8) {
                suggestions.push(`Decrease TTL for volatile route: ${route}`);
            }
        }

        return suggestions;
    }

    /**
     * Generate optimization suggestions
     */
    private generateOptimizationSuggestions(): string[] {
        const suggestions: string[] = [];

        const hitRate =
            this.cacheAnalytics.totalRequests > 0
                ? (this.cacheAnalytics.cacheHits /
                      this.cacheAnalytics.totalRequests) *
                  100
                : 0;

        if (hitRate < 30) {
            suggestions.push(
                "Consider increasing TTL values to improve hit rate"
            );
        }

        if (hitRate > 90) {
            suggestions.push(
                "Excellent cache performance - consider expanding caching rules"
            );
        }

        if (
            this.cacheAnalytics.averageMissTime >
            this.cacheAnalytics.averageHitTime * 10
        ) {
            suggestions.push(
                "High miss penalty - consider cache warming strategies"
            );
        }

        return suggestions;
    }

    /**
     * Identify related content for prefetching
     */
    private identifyRelatedContent(path: string): string[] {
        const related: string[] = [];

        // Simple related content identification
        if (path.startsWith("/api/users/")) {
            related.push("/api/users/profile", "/api/users/preferences");
        }

        if (path.startsWith("/api/products/")) {
            related.push("/api/products/categories", "/api/products/featured");
        }

        return related;
    }

    /**
     * Setup analytics cleanup
     */
    private setupAnalyticsCleanup(): void {
        // Reset analytics every hour
        setInterval(() => {
            this.resetAnalytics();
        }, 3600000); // 1 hour
    }

    /**
     * Setup dynamic TTL adjustment
     */
    private setupDynamicTTLAdjustment(): void {
        // Analyze patterns every 10 minutes
        setInterval(() => {
            this.analyzeRequestPatterns();
        }, 600000); // 10 minutes
    }

    /**
     * Reset analytics
     */
    private resetAnalytics(): void {
        // Keep some historical data, reset counters
        this.cacheAnalytics.totalRequests = 0;
        this.cacheAnalytics.cacheableRequests = 0;
        this.cacheAnalytics.cacheHits = 0;
        this.cacheAnalytics.cacheMisses = 0;
        this.cacheAnalytics.cacheSkips = 0;
    }

    /**
     * Analyze request patterns for optimization
     */
    private analyzeRequestPatterns(): void {
        const now = Date.now();

        // Clean up old patterns
        for (const [route, pattern] of this.requestPatterns.entries()) {
            if (now - pattern.lastAccess > 3600000) {
                // 1 hour
                this.requestPatterns.delete(route);
            }
        }
    }
}

