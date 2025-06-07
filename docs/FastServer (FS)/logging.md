# Logging System

## Overview

FastServer provides a comprehensive, granular logging system that allows fine-grained control over log output. The logging system is designed to reduce noise in production while providing detailed debugging information in development.

## Key Features

-   **Granular Control**: Component-specific and type-specific logging controls
-   **Performance Optimized**: Minimal overhead when logging is disabled
-   **Flexible Formatting**: Customizable output formats with colors, timestamps, and prefixes
-   **Environment Aware**: Different defaults for development, production, and testing
-   **Custom Logger Support**: Integration with external logging systems
-   **🆕 Enhanced Console Interception**: Advanced console output control with multiple display modes
-   **🆕 Preserve Options**: Fine-grained control over original vs intercepted console output
-   **🆕 Enhanced Console Interception**: Advanced console output control with multiple display modes
-   **🆕 Preserve Options**: Fine-grained control over original vs intercepted console output

## Configuration

### Basic Logging Configuration

```typescript
import { createServer } from "fortify2-js";

const app = createServer({
    logging: {
        enabled: true,
        level: "info",
    },
});
```

### Complete Logging Configuration

```typescript
const app = createServer({
    logging: {
        enabled: true,
        level: "info",

        // Component-specific controls
        components: {
            server: true,
            cache: false,
            cluster: true,
            performance: false,
            fileWatcher: true,
            plugins: false,
            security: true,
            monitoring: true,
            routes: false,
        },

        // Log type controls
        types: {
            startup: true,
            warnings: false,
            errors: true,
            performance: false,
            debug: false,
            hotReload: true,
            portSwitching: true,
        },

        // Output formatting
        format: {
            timestamps: true,
            colors: true,
            prefix: true,
            compact: false,
        },

        // Custom logger function
        customLogger: (level, component, message, ...args) => {
            // Custom logging implementation
        },
    },
});
```

## 🆕 Console Interception

Fortify FastServer (FFS) now includes an advanced console interception system that provides fine-grained control over console output behavior. This is particularly useful for production environments where you need centralized logging and better control over console output.

### Quick Start

```typescript
const app = createServer({
    logging: {
        consoleInterception: {
            enabled: true,
            preserveOriginal: {
                enabled: true,
                mode: "both", // Show both original and intercepted logs
                showPrefix: true,
                customPrefix: "[MYAPP]",
                allowDuplication: true,
                colorize: true,
            },
        },
    },
});
```

### Available Modes

| Mode            | Description                              | Use Case                         |
| --------------- | ---------------------------------------- | -------------------------------- |
| `"original"`    | Show original console output only        | Development (clean output)       |
| `"intercepted"` | Route through logging system with prefix | Production (centralized logging) |
| `"both"`        | Show BOTH original AND intercepted       | Debugging (see everything)       |
| `"none"`        | Silent mode (no console output)          | Testing (quiet environment)      |

### Preset Configurations

```typescript
import { PRESERVE_PRESETS } from "fortify2-js";

// Development preset - clean original output
preserveOriginal: PRESERVE_PRESETS.development;

// Production preset - intercepted with prefix
preserveOriginal: PRESERVE_PRESETS.production;

// Debug preset - show both original and intercepted
preserveOriginal: PRESERVE_PRESETS.debug;

// Silent preset - no console output
preserveOriginal: PRESERVE_PRESETS.silent;
```

### Backward Compatibility

```typescript
// Old syntax (still supported)
preserveOriginal: true,  // = "original" mode
preserveOriginal: false, // = "intercepted" mode

// New syntax (recommended)
preserveOriginal: {
    enabled: true,
    mode: "original", // or "intercepted", "both", "none"
}
```

📚 **[Complete Console Interception Guide →](./console/console-interception.md)**

## Log Levels

### Level Hierarchy

| Level     | Numeric Value | Description         | Use Case              |
| --------- | ------------- | ------------------- | --------------------- |
| `silent`  | 0             | No output           | Testing, CI/CD        |
| `error`   | 1             | Errors only         | Production (minimal)  |
| `warn`    | 2             | Warnings and errors | Production (standard) |
| `info`    | 3             | General information | Development, staging  |
| `debug`   | 4             | Debug information   | Development debugging |
| `verbose` | 5             | All messages        | Deep debugging        |

### Level Examples

```typescript
// Silent mode - no logs
logging: {
    level: "silent";
}

// Production mode - errors and warnings only
logging: {
    level: "warn";
}

// Development mode - informational logs
logging: {
    level: "info";
}

// Debug mode - detailed information
logging: {
    level: "debug";
}

// Verbose mode - everything
logging: {
    level: "verbose";
}
```

## Component-Specific Logging

### Available Components

| Component     | Description                             | Typical Verbosity |
| ------------- | --------------------------------------- | ----------------- |
| `server`      | Server startup, shutdown, configuration | Low               |
| `cache`       | Cache operations, hits, misses          | High              |
| `cluster`     | Worker management, scaling events       | Medium            |
| `performance` | Performance metrics, optimizations      | High              |
| `fileWatcher` | File changes, hot reload events         | Medium            |
| `plugins`     | Plugin loading, execution               | Medium            |
| `security`    | Security warnings, authentication       | Low               |
| `monitoring`  | Health checks, metrics collection       | Medium            |
| `routes`      | Route compilation, optimization         | High              |

### Component Configuration Examples

#### Development Setup

```typescript
logging: {
    level: "debug",
    components: {
        server: true,      // Server events
        cache: true,       // Cache debugging
        cluster: false,    // Skip cluster logs
        performance: true, // Performance insights
        fileWatcher: true, // Hot reload feedback
        plugins: true,     // Plugin debugging
        security: true,    // Security events
        monitoring: false, // Skip monitoring noise
        routes: true       // Route optimization
        ...
    }
}
```

#### Production Setup

```typescript
logging: {
    level: "warn",
    components: {
        server: true,      // Critical server events
        cache: false,      // Skip cache noise
        cluster: true,     // Cluster management
        performance: false,// Skip performance logs
        fileWatcher: false,// No file watching
        plugins: false,    // Skip plugin logs
        security: true,    // Security warnings
        monitoring: true,  // Health monitoring
        routes: false      // Skip route logs
    }
}
```

## Log Type Controls

### Available Types

| Type            | Description              | Examples                                              |
| --------------- | ------------------------ | ----------------------------------------------------- |
| `startup`       | Component initialization | "Initializing components...", "Cache manager started" |
| `warnings`      | Warning messages         | UFSIMC encryption warnings, deprecation notices       |
| `errors`        | Error messages           | Connection failures, validation errors                |
| `performance`   | Performance measurements | "Request processed in 1.2ms", cache hit rates         |
| `debug`         | Debug information        | Internal state, detailed execution flow               |
| `hotReload`     | Hot reload events        | File changes, server restarts                         |
| `portSwitching` | Auto port switching      | Port conflicts, automatic port changes                |

### Type Configuration Examples

#### Suppress Warnings

```typescript
logging: {
    level: "info",
    types: {
        warnings: false,  // Hide UFSIMC and other warnings
        errors: true,     // Keep error messages
        startup: true,    // Show initialization
        performance: false // Hide performance noise
    }
}
```

#### Performance Monitoring

```typescript
logging: {
    level: "info",
    types: {
        performance: true,    // Show performance metrics
        startup: false,       // Hide startup noise
        warnings: false,      // Hide warnings
        debug: false,         // Hide debug info
        hotReload: false,     // Hide hot reload
        portSwitching: true   // Show port changes
    }
}
```

## Output Formatting

### Format Options

```typescript
logging: {
    format: {
        timestamps: true,    // Add ISO timestamps
        colors: true,        // Use ANSI colors
        prefix: true,        // Show component prefixes
        compact: false       // Use multi-line format
    }
}
```

### Format Examples

#### Standard Format (prefix: true, compact: false)

```
[SERVER] Creating fast server...
[CACHE] Initializing UFSIMC with 10000 entries
[CLUSTER] Starting 4 worker processes
```

#### Compact Format (prefix: false, compact: true)

```
Creating fast server...
Initializing UFSIMC with 10000 entries
Starting 4 worker processes
```

#### Timestamped Format (timestamps: true)

```
2024-12-19T10:30:45.123Z [SERVER] Creating fast server...
2024-12-19T10:30:45.125Z [CACHE] Initializing UFSIMC with 10000 entries
2024-12-19T10:30:45.127Z [CLUSTER] Starting 4 worker processes
```

#### Colored Output (colors: true)

```
[SERVER] Creating fast server...           # Cyan
[CACHE] Cache hit rate: 95%               # Green
[CLUSTER] Worker 1234 restarted           # Yellow
[ERROR] Connection failed                 # Red
```

## Custom Logger Integration

### Basic Custom Logger

```typescript
logging: {
    customLogger: (level, component, message, ...args) => {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level: level.toUpperCase(),
            component: component.toUpperCase(),
            message,
            args,
        };

        // Send to external logging service
        console.log(JSON.stringify(logEntry));
    };
}
```

### Winston Integration

```typescript
import winston from "winston";

const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: "error.log", level: "error" }),
        new winston.transports.File({ filename: "combined.log" }),
    ],
});

const app = createServer({
    logging: {
        customLogger: (level, component, message, ...args) => {
            logger.log({
                level,
                component,
                message,
                args,
            });
        },
    },
});
```

### Structured Logging

```typescript
logging: {
    customLogger: (level, component, message, ...args) => {
        const logEntry = {
            "@timestamp": new Date().toISOString(),
            level: level.toUpperCase(),
            component,
            message,
            service: "fastserver",
            version: "1.0.0",
            environment: process.env.NODE_ENV,
            pid: process.pid,
            ...(args.length > 0 && { details: args }),
        };

        // Send to ELK stack, Datadog, etc.
        console.log(JSON.stringify(logEntry));
    };
}
```

## Environment-Specific Configurations

### Development Environment

```typescript
const developmentLogging = {
    level: "debug" as const,
    components: {
        server: true,
        cache: true,
        cluster: false,
        performance: true,
        fileWatcher: true,
        plugins: true,
        security: true,
        monitoring: false,
        routes: true,
    },
    types: {
        startup: true,
        warnings: true,
        errors: true,
        performance: true,
        debug: true,
        hotReload: true,
        portSwitching: true,
    },
    format: {
        timestamps: false,
        colors: true,
        prefix: true,
        compact: false,
    },
};
```

### Production Environment

```typescript
const productionLogging = {
    level: "warn" as const,
    components: {
        server: true,
        cache: false,
        cluster: true,
        performance: false,
        fileWatcher: false,
        plugins: false,
        security: true,
        monitoring: true,
        routes: false,
    },
    types: {
        startup: true,
        warnings: true,
        errors: true,
        performance: false,
        debug: false,
        hotReload: false,
        portSwitching: false,
    },
    format: {
        timestamps: true,
        colors: false,
        prefix: true,
        compact: true,
    },
};
```

### Testing Environment

```typescript
const testingLogging = {
    level: "silent" as const,
    // All other options ignored in silent mode
};
```

## Performance Considerations

### Logging Overhead

The logging system is designed for minimal performance impact:

-   **Disabled Components**: Zero overhead when components are disabled
-   **Level Filtering**: Early exit for filtered log levels
-   **Lazy Evaluation**: Arguments are only processed if logging will occur
-   **Efficient Formatting**: Minimal string operations for disabled logs

### Best Practices

1. **Use Appropriate Levels**: Don't use debug level in production
2. **Disable Verbose Components**: Turn off high-frequency components in production
3. **Custom Logger Optimization**: Ensure custom loggers are performant
4. **Structured Logging**: Use structured formats for better parsing and analysis

### Performance Monitoring

```typescript
// Monitor logging performance
logging: {
    customLogger: (level, component, message, ...args) => {
        const start = process.hrtime.bigint();

        // Your logging logic here
        yourLogger.log(level, component, message, ...args);

        const duration = Number(process.hrtime.bigint() - start) / 1000000; // ms
        if (duration > 1) {
            console.warn(`Slow logging detected: ${duration}ms`);
        }
    };
}
```
