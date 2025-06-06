import { FortifyJS, SecureRandom } from "../core";
import { MiddlewareOptions } from "../types";

export function middleware(options: MiddlewareOptions = {}): any {
    // Set default options with documentation
    const opts = {
        csrfProtection: options.csrfProtection || false, // disable CSRF protection
        secureHeaders: options.secureHeaders !== false, // Secure HTTP headers
        rateLimit: options.rateLimit !== false, // Enable rate limiting
        maxRequestsPerMinute: options.maxRequestsPerMinute || 100,
        tokenSecret:
            options.tokenSecret ||
            FortifyJS.generateSecureToken({ length: 32, entropy: "high" }),
        cookieName: options.cookieName || "nehonix_fortify_csrf",
        headerName: options.headerName || "X-FORTIFY_CSRF-Token",
        excludePaths: options.excludePaths || ["/api/health", "/api/status"],
        logRequests: options.logRequests !== false,
        logger: options.logger || console,
        contentSecurityPolicy:
            options.contentSecurityPolicy ||
            "default-src 'self'; script-src 'self'; object-src 'none'; frame-ancestors 'none'",
        customHeaders: options.customHeaders || {}, // Allow merging custom headers
        onRateLimit: options.onRateLimit, // Optional callback for rate limit
        onCSRFError: options.onCSRFError, // Optional callback for CSRF error
        onError: options.onError, // Optional error handler
        metricsHook: options.metricsHook, // Optional metrics/observability
    };

    // Use Map for IP tracking to avoid prototype pollution
    const ipRequests = new Map<
        string,
        { count: number; resetTime: number; banUntil?: number }
    >();
    // Ban tracking for repeated abuse
    const bannedIPs = new Map<string, number>();

    // Create a tamper-evident logger if logging is enabled
    const secureLogger = opts.logRequests
        ? FortifyJS.createTamperEvidentLogger(
              opts.tokenSecret,
              "nehonix_fortify_request_log"
          )
        : null;

    // Middleware function

    return async (req: Req, res: Res, next: Next) => {
        try {
            // Get client IP
            const clientIp =
                req.headers["x-forwarded-for"] ||
                req.connection.remoteAddress ||
                req.socket.remoteAddress ||
                req.ip ||
                "0.0.0.0";

            // Log the request if enabled
            if (secureLogger) {
                secureLogger.info("Request received", {
                    method: req.method,
                    path: req.path,
                    ip: clientIp,
                    userAgent: req.headers["user-agent"],
                    timestamp: Date.now(),
                });
            }

            // Check for banned IPs (optional, can be extended)
            const banUntil = bannedIPs.get(clientIp);
            if (banUntil && Date.now() < banUntil) {
                if (secureLogger) {
                    secureLogger.warning("Banned IP tried to access", {
                        ip: clientIp,
                    });
                }
                res.status(429).json({
                    error: "Too many requests (banned)",
                    retryAfter: Math.ceil((banUntil - Date.now()) / 1000),
                });
                return;
            }

            // Apply rate limiting if enabled
            if (opts.rateLimit) {
                const now = Date.now();

                // Initialize or reset counter if needed
                const ipEntry = ipRequests.get(clientIp);
                if (!ipEntry || ipEntry.resetTime < now) {
                    ipRequests.set(clientIp, {
                        count: 0,
                        resetTime: now + 60000, // 1 minute
                    });
                }
                const entry = ipRequests.get(clientIp)!;
                entry.count++;
                ipRequests.set(clientIp, entry);
                // Check if limit exceeded
                if (entry.count > opts.maxRequestsPerMinute) {
                    if (secureLogger) {
                        secureLogger.warning("Rate limit exceeded", {
                            ip: clientIp,
                            count: entry.count,
                            limit: opts.maxRequestsPerMinute,
                        });
                    }
                    res.status(429).json({
                        error: "Too many requests",
                        retryAfter: Math.ceil((entry.resetTime - now) / 1000),
                    });
                    return;
                }
            }

            // Apply secure headers if enabled
            if (opts.secureHeaders) {
                // Content Security Policy
                res.setHeader(
                    "Content-Security-Policy",
                    options.contentSecurityPolicy ||
                        "default-src 'self'; script-src 'self'; object-src 'none'; frame-ancestors 'none'"
                );

                // Prevent MIME type sniffing
                res.setHeader("X-Content-Type-Options", "nosniff");

                // Clickjacking protection
                res.setHeader("X-Frame-Options", "DENY");

                // XSS protection
                res.setHeader("X-XSS-Protection", "1; mode=block");

                // Strict Transport Security
                res.setHeader(
                    "Strict-Transport-Security",
                    "max-age=31536000; includeSubDomains; preload"
                );

                // Referrer Policy
                res.setHeader(
                    "Referrer-Policy",
                    "strict-origin-when-cross-origin"
                );

                // Permissions Policy
                res.setHeader(
                    "Permissions-Policy",
                    "geolocation=(), camera=(), microphone=()"
                );
            }

            // Apply CSRF protection if enabled
            if (opts.csrfProtection && !opts.excludePaths.includes(req.path)) {
                // Skip CSRF check for GET, HEAD, OPTIONS requests
                const safeMethod = /^(GET|HEAD|OPTIONS)$/i.test(req.method);

                if (!safeMethod) {
                    // Get token from request
                    const csrfToken =
                        req.headers[opts.headerName.toLowerCase()] ||
                        req.body?._csrf ||
                        req.query?._csrf;

                    // Get token from cookie
                    const cookieToken = req.cookies?.[opts.cookieName];

                    // Verify tokens match using constant-time comparison
                    if (
                        !csrfToken ||
                        !cookieToken ||
                        !FortifyJS.constantTimeEqual(csrfToken, cookieToken)
                    ) {
                        if (secureLogger) {
                            secureLogger.warning(
                                "CSRF token validation failed",
                                {
                                    path: req.path,
                                    ip: clientIp,
                                    hasToken: !!csrfToken,
                                    hasCookie: !!cookieToken,
                                }
                            );
                        }

                        res.status(403).json({
                            error: "CSRF token validation failed",
                        });
                        return;
                    }
                }

                // Generate a new token for the response
                const newToken = SecureRandom.getRandomBytes(32).toString();

                // Set the token in a cookie
                res.cookie(opts.cookieName, newToken, {
                    httpOnly: true,
                    secure:
                        req.secure ||
                        req.headers["x-forwarded-proto"] === "https",
                    sameSite: "strict",
                    path: "/",
                });

                // Make the token available to the application
                res.locals.csrfToken = newToken;
            }

            // Continue to the next middleware
            next();
        } catch (error) {
            // Log the error
            if (secureLogger) {
                secureLogger.error("Middleware error", {
                    message: (error as Error).message,
                    stack: (error as Error).stack,
                });
            }

            // Pass to next error handler
            next(error);
        }
    };
}

// Import Express types for better type safety
// (If not available, fallback to any)
type Req = any;
type Res = any;
type Next = any;

