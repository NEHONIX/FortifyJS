/**
 * FortifyJS Configuration File
 * 
 * This file allows you to configure FortifyJS without cluttering your main application file.
 * Place this file in your project root or in a 'config' folder.
 * 
 * Supported file names:
 * - fortify.config.js
 * - fortify.config.ts
 * - fortify.config.json
 * - fortify.config.mjs
 * - .fortifyrc
 * - .fortifyrc.json
 * - .fortifyrc.js
 */

module.exports = {
  // Server configuration
  server: {
    port: 3000,
    host: "localhost",
    enableMiddleware: true,
    autoPortSwitch: {
      enabled: true,
      maxAttempts: 10,
      strategy: "increment", // "increment" | "random" | "sequence"
    },
  },

  // File watcher configuration (Hot reload with TypeScript support)
  fileWatcher: {
    enabled: true, // Enable ultra-fast file watcher
    extensions: [".ts", ".js", ".json"], // File extensions to watch
    ignorePaths: [
      "**/node_modules/**",
      "**/dist/**",
      "**/*.test.ts",
      "**/*.spec.ts",
      "**/logs/**",
      "**/data/**",
    ],
    debounceMs: 100, // Debounce file changes
    restartDelay: 500, // Delay before restart
    maxRestarts: 10, // Maximum restarts before giving up
    gracefulShutdown: true, // Graceful shutdown on restart
    verbose: true, // Verbose logging

    // TypeScript execution configuration
    typescript: {
      enabled: true, // Auto-detect TypeScript files (default: true)
      runner: "tsx", // 'auto' | 'tsx' | 'ts-node' | 'bun' | 'node' | custom
      runnerArgs: [], // Additional arguments for tsx if needed
      fallbackToNode: false, // Fallback to node if runner fails
      autoDetectRunner: false, // Auto-detect available runner
    },

    // TypeScript type checking configuration
    typeCheck: {
      enabled: false, // Enable TypeScript type checking (default: false)
      configFile: "tsconfig.json", // Path to tsconfig.json
      checkOnSave: true, // Check types when files are saved
      checkBeforeRestart: true, // Check types before restarting server
      showWarnings: true, // Show TypeScript warnings
      showInfos: false, // Show TypeScript info messages
      maxErrors: 50, // Maximum errors to display
      failOnError: false, // Prevent restart if type errors found
      verbose: false, // Verbose type checking output
    },
  },

  // Performance optimization
  performance: {
    enabled: true,
    compression: true,
    optimization: {
      enabled: true,
      learningPeriod: 60000, // 1 minute learning period
      optimizationThreshold: 1, // Optimize after 1 request
      aggressiveOptimization: true, // Enable aggressive optimizations
    },
  },

  // Security configuration
  security: {
    helmet: true, // Enable helmet security headers
    cors: true, // Enable CORS
    rateLimit: {
      enabled: true,
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // Limit each IP to 1000 requests per windowMs
    },
  },

  // Cache configuration
  cache: {
    enabled: true,
    type: "memory", // "memory" | "redis" | "hybrid"
    ttl: 300000, // 5 minutes default TTL
    maxSize: 1000, // Maximum number of cached items
  },

  // Logging configuration
  logging: {
    enabled: true,
    level: "info", // "silent" | "error" | "warn" | "info" | "debug" | "verbose"
    
    // Component-specific logging controls
    components: {
      server: true, // Server startup/shutdown logs
      cache: true, // Cache initialization and operations
      cluster: true, // Cluster management logs
      performance: true, // Performance optimization logs
      fileWatcher: true, // File watcher logs
      plugins: true, // Plugin system logs
      security: true, // Security warnings and logs
      monitoring: true, // Monitoring and metrics logs
      routes: true, // Route compilation and handling logs
      userApp: true, // User application console output
      console: true, // Console interception system logs
      middleware: true,
      router: true,
      typescript: true,
    },

    // Specific log type controls
    types: {
      startup: true, // Component initialization logs
      warnings: true, // Warning messages
      errors: true, // Error messages
      performance: true, // Performance measurements
      debug: false, // Debug information
      hotReload: true, // Hot reload notifications
      portSwitching: true, // Auto port switching logs
    },

    // Output formatting
    format: {
      timestamps: false, // Show timestamps
      colors: true, // Use colors in output
      prefix: true, // Show component prefixes
      compact: false, // Use compact format
    },

    // Console interception configuration
    consoleInterception: {
      enabled: false, // Enable console interception
      preserveOriginal: {
        enabled: true, // Preserve original console behavior
        duplicateToOriginal: false, // Don't duplicate to original console
        showInterceptedLogs: true, // Show intercepted logs in FastServer format
      },
      categorization: {
        enabled: true, // Enable log categorization
        categories: ["error", "warn", "info", "debug"], // Categories to track
        autoDetectLevel: true, // Auto-detect log level from content
      },
      filtering: {
        enabled: false, // Enable log filtering
        allowedPatterns: [], // Regex patterns for allowed logs
        blockedPatterns: [], // Regex patterns for blocked logs
        minLevel: "info", // Minimum log level to capture
      },
      encryption: {
        enabled: false, // Enable log encryption
        algorithm: "aes-256-gcm", // Encryption algorithm
        encoding: "base64", // Encoding for encrypted data
        displayMode: "readable", // "readable" | "encrypted" | "both"
        showEncryptionStatus: false, // Show encryption status in logs
      },
      externalLogging: {
        enabled: false, // Enable external logging
        customLogger: null, // Custom logger function
      },
    },
  },

  // Middleware configuration
  middleware: {
    enabled: true,
    priority: {
      security: "critical", // critical | high | normal | low
      performance: "high",
      caching: "normal",
      convenience: "low",
    },
  },

  // Cluster configuration
  cluster: {
    enabled: false, // Enable cluster mode
    workers: "auto", // Number of workers or "auto"
    autoScale: true, // Enable auto-scaling
    maxWorkers: 8, // Maximum number of workers
  },

  // Monitoring configuration
  monitoring: {
    enabled: true,
    endpoints: {
      health: "/fortify/health",
      metrics: "/fortify/metrics",
      status: "/fortify/status",
    },
  },

  // Router configuration
  router: {
    enabled: true, // Enable high-performance routing
    precompileCommonRoutes: true, // Pre-compile common routes
    enableSecurity: true, // Enable security validation
    enableCaching: true, // Enable route caching
    warmUpOnStart: true, // Warm up routes on startup
    performance: {
      targetResponseTime: 1, // Target response time for simple routes in ms
      complexRouteTarget: 5, // Target response time for complex routes in ms
      enableProfiling: true, // Enable performance profiling
      enableOptimizations: true, // Enable all optimizations
    },
    security: {
      enableValidation: true, // Enable input validation
      enableSanitization: true, // Enable input sanitization
      enableRateLimit: true, // Enable rate limiting
      defaultRateLimit: 1000, // Default rate limit per minute
    },
    cache: {
      enabled: true, // Enable route caching
      defaultTTL: 60000, // Default cache TTL in ms
      maxCacheSize: 1000, // Maximum cached responses
    },
  },
};
