import { ConsoleInterceptionConfig } from "../integrations/express/server/components/fastapi/console/types";

export const DEFAULT_CONSOLE_CONFIG: ConsoleInterceptionConfig = {
    enabled: false,
    interceptMethods: ["log", "error", "warn", "info", "debug"],
    preserveOriginal: true,
    filterUserCode: true,
    performanceMode: true,
    sourceMapping: false,
    stackTrace: false,
    maxInterceptionsPerSecond: 1000,
    encryption: {
        enabled: false,
        algorithm: "aes-256-gcm",
        keyDerivation: "pbkdf2",
        iterations: 100000,
        saltLength: 32,
        ivLength: 16,
        tagLength: 16,
        encoding: "base64",
        externalLogging: {
            enabled: false,
            batchSize: 100,
            flushInterval: 5000,
        },
    },
    filters: {
        minLevel: "debug",
        maxLength: 1000,
        includePatterns: [],
        excludePatterns: ["node_modules", "fastserver", "express", "internal"],
        // Enhanced categorization with smart defaults
        userAppPatterns: [
            "🔧",
            "🚀",
            "✅",
            "❌",
            "📋",
            "📊",
            "🎉",
            "⚡",
            "🛠️",
            "🔍", // Common emoji patterns
            "DEBUG:",
            "INFO:",
            "WARN:",
            "ERROR:",
            "SUCCESS:",
            "FAIL:", // Common prefixes
            "Testing",
            "Starting",
            "Completed",
            "Failed", // Common words
        ],
        systemPatterns: [
            "UFSIMC-",
            "FastServer",
            "[SERVER]",
            "[CACHE]",
            "[CLUSTER]", //Fortify FastServer (FFS)patterns
            "node_modules",
            "internal",
            "express",
            "middleware", // System patterns
        ],
        categoryBehavior: {
            userApp: "both", // Show user app logs in both console and logging system
            system: "intercept", // Only show system logs through logging system
            unknown: "both", // Show unknown logs in both (safe default)
        },
    },
    fallback: {
        onError: "console",
        gracefulDegradation: true,
        maxErrors: 10,
    },
};
