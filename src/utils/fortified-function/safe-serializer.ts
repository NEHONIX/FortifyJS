/**
 * Safe Serialization Utility for FortifiedFunction
 * Handles cyclic structures, Express objects, and performance optimization
 */

export interface SafeSerializationOptions {
    maxDepth?: number;
    maxLength?: number;
    includeNonEnumerable?: boolean;
    truncateStrings?: number;
    fastMode?: boolean;
}

export class SafeSerializer {
    private static readonly DEFAULT_OPTIONS: Required<SafeSerializationOptions> = {
        maxDepth: 10,
        maxLength: 10000,
        includeNonEnumerable: false,
        truncateStrings: 1000,
        fastMode: false
    };

    /**
     * **ULTRA-FAST: Primary serialization method with performance optimization**
     */
    public static stringify(obj: any, options: SafeSerializationOptions = {}): string {
        const opts = { ...this.DEFAULT_OPTIONS, ...options };

        // **ULTRA-FAST PATH: Try simple JSON.stringify first**
        if (opts.fastMode) {
            try {
                const result = JSON.stringify(obj);
                if (result.length <= opts.maxLength) {
                    return result;
                }
            } catch {
                // Fall through to safe serialization
            }
        }

        // **SAFE PATH: Handle complex objects with cyclic references**
        return this.safeStringify(obj, opts);
    }

    /**
     * **SAFE SERIALIZATION: Handles all edge cases**
     */
    private static safeStringify(obj: any, options: Required<SafeSerializationOptions>): string {
        const seen = new WeakSet();
        let depth = 0;

        const replacer = (_key: string, value: any): any => {
            // Handle primitive values
            if (value === null || typeof value !== "object") {
                if (typeof value === "string" && value.length > options.truncateStrings) {
                    return value.substring(0, options.truncateStrings) + "...[truncated]";
                }
                return value;
            }

            // Check depth limit
            depth++;
            if (depth > options.maxDepth) {
                depth--;
                return "[Max Depth Exceeded]";
            }

            // Handle cyclic references
            if (seen.has(value)) {
                return `[Circular:${value.constructor?.name || 'Object'}]`;
            }
            seen.add(value);

            // Handle special Express objects
            if (value.constructor) {
                const constructorName = value.constructor.name;
                
                // Express Request object
                if (constructorName === 'IncomingMessage' || constructorName === 'Request') {
                    const result = {
                        method: value.method,
                        url: value.url,
                        headers: this.sanitizeHeaders(value.headers),
                        params: value.params,
                        query: value.query,
                        body: value.body ? "[Request Body]" : undefined
                    };
                    depth--;
                    return result;
                }

                // Express Response object
                if (constructorName === 'ServerResponse' || constructorName === 'Response') {
                    const result = {
                        statusCode: value.statusCode,
                        statusMessage: value.statusMessage,
                        headersSent: value.headersSent
                    };
                    depth--;
                    return result;
                }

                // Other problematic objects
                if (['Socket', 'Server', 'Agent', 'TLSSocket'].includes(constructorName)) {
                    depth--;
                    return `[${constructorName}:${value.constructor.name}]`;
                }
            }

            // Handle functions
            if (typeof value === 'function') {
                depth--;
                return `[Function:${value.name || 'anonymous'}]`;
            }

            // Handle Buffers
            if (Buffer.isBuffer(value)) {
                depth--;
                return `[Buffer:${value.length}bytes]`;
            }

            // Handle large arrays
            if (Array.isArray(value) && value.length > 100) {
                depth--;
                return `[Array:${value.length}items]`;
            }

            // Handle Error objects
            if (value instanceof Error) {
                depth--;
                return {
                    name: value.name,
                    message: value.message,
                    stack: value.stack ? "[Stack Trace]" : undefined
                };
            }

            depth--;
            return value;
        };

        try {
            const result = JSON.stringify(obj, replacer);
            
            // Check length limit
            if (result.length > options.maxLength) {
                return result.substring(0, options.maxLength) + "...[truncated]";
            }
            
            return result;
        } catch (error) {
            // Ultimate fallback
            return `[Serialization Error: ${error instanceof Error ? error.message : 'Unknown'}]`;
        }
    }

    /**
     * **UTILITY: Sanitize HTTP headers for safe logging**
     */
    private static sanitizeHeaders(headers: any): any {
        if (!headers || typeof headers !== 'object') {
            return headers;
        }

        const sanitized: any = {};
        const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];

        for (const [key, value] of Object.entries(headers)) {
            const lowerKey = key.toLowerCase();
            if (sensitiveHeaders.includes(lowerKey)) {
                sanitized[key] = '[REDACTED]';
            } else {
                sanitized[key] = value;
            }
        }

        return sanitized;
    }

    /**
     * **ULTRA-FAST: Generate cache key with safe serialization**
     */
    public static generateCacheKey(args: any[], prefix: string = 'cache'): string {
        try {
            // **ULTRA-FAST PATH: Try simple approach first**
            const simple = JSON.stringify(args);
            if (simple.length <= 500) {
                return `${prefix}:${simple}`;
            }
        } catch {
            // Fall through to safe approach
        }

        // **SAFE PATH: Use safe serialization**
        const safe = this.stringify(args, {
            fastMode: false,
            maxDepth: 5,
            maxLength: 500,
            truncateStrings: 100
        });

        return `${prefix}:${safe}`;
    }

    /**
     * **DEBUG: Safe debug logging**
     */
    public static debugLog(label: string, obj: any, maxLength: number = 200): void {
        const serialized = this.stringify(obj, {
            fastMode: true,
            maxLength,
            maxDepth: 3,
            truncateStrings: 50
        });

        console.log(`[DEBUG] ${label}: ${serialized}`);
    }

    /**
     * **AUDIT: Safe audit logging with full details**
     */
    public static auditLog(obj: any): string {
        return this.stringify(obj, {
            fastMode: false,
            maxDepth: 8,
            maxLength: 5000,
            truncateStrings: 500,
            includeNonEnumerable: false
        });
    }
}

/**
 * **CONVENIENCE FUNCTIONS: Quick access to common serialization patterns**
 */

// Ultra-fast serialization for performance-critical paths
export const fastStringify = (obj: any): string => 
    SafeSerializer.stringify(obj, { fastMode: true, maxLength: 1000 });

// Safe serialization for complex objects
export const safeStringify = (obj: any): string => 
    SafeSerializer.stringify(obj, { fastMode: false });

// Cache key generation
export const generateSafeCacheKey = (args: any[], prefix?: string): string => 
    SafeSerializer.generateCacheKey(args, prefix);

// Debug logging
export const debugLog = (label: string, obj: any): void => 
    SafeSerializer.debugLog(label, obj);

// Audit logging
export const auditStringify = (obj: any): string => 
    SafeSerializer.auditLog(obj);
