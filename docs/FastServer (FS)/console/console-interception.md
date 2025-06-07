# Console Interception System

## Overview

FastServer's Console Interception System provides advanced control over console output, allowing developers to capture, filter, encrypt, and route console logs through the FastServer logging system. This is particularly useful for production environments where you need centralized logging, security, and performance monitoring.

## Key Features

- ✅ **Enhanced Preserve Options**: Fine-grained control over console output behavior
- ✅ **Multiple Display Modes**: Original, intercepted, both, or silent modes
- ✅ **Custom Prefixes**: Configurable log prefixes for better organization
- ✅ **Backward Compatibility**: Supports both old boolean and new object configuration
- ✅ **Performance Optimized**: Minimal overhead with rate limiting and caching
- ✅ **Encryption Support**: Secure log transmission and storage
- ✅ **Advanced Filtering**: Pattern-based filtering and categorization

## Basic Configuration

### Simple Setup

```typescript
import { createServer } from "fortify2-js";

const app = createServer({
    logging: {
        consoleInterception: {
            enabled: true,
            preserveOriginal: true, // Show original console output
            performanceMode: true,
        },
    },
});
```

### Enhanced Preserve Options (New!)

```typescript
const app = createServer({
    logging: {
        consoleInterception: {
            enabled: true,
            preserveOriginal: {
                enabled: true,
                mode: "both", // Show both original and intercepted
                showPrefix: true,
                allowDuplication: true,
                customPrefix: "[MYAPP]",
                separateStreams: false,
                onlyUserApp: true,
                colorize: true,
            },
            performanceMode: true,
            filters: {
                minLevel: "debug",
                maxLength: 1000,
                includePatterns: [],
                excludePatterns: ["node_modules"],
            },
        },
    },
});
```

## Preserve Modes

### Available Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| `"original"` | Show original console output only | Development (clean output) |
| `"intercepted"` | Route through logging system with prefix | Production (centralized logging) |
| `"both"` | Show BOTH original AND intercepted | Debugging (see everything) |
| `"none"` | Silent mode (no console output) | Testing (quiet environment) |

### Mode Examples

#### Original Mode
```typescript
preserveOriginal: {
    enabled: true,
    mode: "original",
    showPrefix: false,
    allowDuplication: false,
}

// Output:
// ✅ Server started on port 3000
```

#### Intercepted Mode
```typescript
preserveOriginal: {
    enabled: true,
    mode: "intercepted",
    showPrefix: true,
    customPrefix: "[APP]",
}

// Output:
// [APP] ✅ Server started on port 3000
```

#### Both Mode (Debugging)
```typescript
preserveOriginal: {
    enabled: true,
    mode: "both",
    showPrefix: true,
    allowDuplication: true,
}

// Output:
// ✅ Server started on port 3000
// [USERAPP] ✅ Server started on port 3000
```

#### Silent Mode
```typescript
preserveOriginal: {
    enabled: true,
    mode: "none",
}

// Output: (no console output)
```

## Preset Configurations

### Development Preset
```typescript
import { PRESERVE_PRESETS } from "fortify2-js";

preserveOriginal: PRESERVE_PRESETS.development
// Equivalent to:
// {
//     enabled: true,
//     mode: "original",
//     showPrefix: false,
//     allowDuplication: false,
//     separateStreams: false,
//     onlyUserApp: true,
//     colorize: true,
// }
```

### Production Preset
```typescript
preserveOriginal: PRESERVE_PRESETS.production
// Equivalent to:
// {
//     enabled: true,
//     mode: "intercepted",
//     showPrefix: true,
//     allowDuplication: false,
//     customPrefix: "[APP]",
//     separateStreams: true,
//     onlyUserApp: true,
//     colorize: false,
// }
```

### Debug Preset
```typescript
preserveOriginal: PRESERVE_PRESETS.debug
// Shows both original and intercepted with debug prefix
```

### Silent Preset
```typescript
preserveOriginal: PRESERVE_PRESETS.silent
// No console output at all
```

## Advanced Configuration

### Complete Configuration Example

```typescript
const app = createServer({
    logging: {
        consoleInterception: {
            enabled: true,
            interceptMethods: ["log", "error", "warn", "info", "debug"],
            
            // Enhanced preserve options
            preserveOriginal: {
                enabled: true,
                mode: "both",
                showPrefix: true,
                allowDuplication: true,
                customPrefix: "[MYAPP]",
                separateStreams: true,
                onlyUserApp: true,
                colorize: true,
            },
            
            // Performance settings
            performanceMode: true,
            maxInterceptionsPerSecond: 1000,
            
            // Advanced filtering
            filters: {
                minLevel: "debug",
                maxLength: 2000,
                includePatterns: ["🔧", "✅", "❌"], // Include emoji patterns
                excludePatterns: ["node_modules", "internal"],
                
                // User app vs system categorization
                userAppPatterns: ["⚡", "🛠️", "🔍", "Testing", "Starting"],
                systemPatterns: ["UFSIMC-", "FastServer", "[SERVER]"],
                
                categoryBehavior: {
                    userApp: "intercept", // Route user logs through system
                    system: "intercept",  // Route system logs through system
                    unknown: "intercept", // Route unknown logs through system
                },
            },
            
            // Error handling
            fallback: {
                onError: "console",
                gracefulDegradation: true,
                maxErrors: 10,
            },
        },
    },
});
```

## Backward Compatibility

### Old Boolean Syntax (Still Supported)

```typescript
// Old way (still works)
preserveOriginal: true,  // = "original" mode
preserveOriginal: false, // = "intercepted" mode

// New way (recommended)
preserveOriginal: {
    enabled: true,
    mode: "original", // or "intercepted"
}
```

## Runtime Control

### Dynamic Configuration Updates

```typescript
// Get console interceptor
const interceptor = app.getConsoleInterceptor();

// Enable/disable interception
interceptor.start();
interceptor.stop();

// Update configuration
interceptor.updateConfig({
    preserveOriginal: {
        enabled: true,
        mode: "both",
        customPrefix: "[DEBUG]",
    },
});

// Get statistics
const stats = interceptor.getStats();
console.log("Interceptions:", stats.totalInterceptions);
```

## Use Cases

### Development Environment
```typescript
preserveOriginal: {
    enabled: true,
    mode: "original", // Clean console output
    colorize: true,   // Colored output for better readability
}
```

### Production Environment
```typescript
preserveOriginal: {
    enabled: true,
    mode: "intercepted", // Route through logging system
    showPrefix: true,    // Add app identifier
    customPrefix: "[PROD]",
    separateStreams: true,
}
```

### Debugging Issues
```typescript
preserveOriginal: {
    enabled: true,
    mode: "both",        // See everything
    allowDuplication: true,
    customPrefix: "[DEBUG]",
}
```

### Testing Environment
```typescript
preserveOriginal: {
    enabled: true,
    mode: "none",        // Silent mode
}
```

## Performance Considerations

- **Rate Limiting**: Automatically limits interceptions per second
- **Performance Mode**: Optimized for minimal overhead
- **Lazy Processing**: Async processing to avoid blocking
- **Memory Management**: Automatic cleanup and garbage collection

## Best Practices

1. **Use presets** for common scenarios
2. **Enable performance mode** in production
3. **Configure appropriate filters** to reduce noise
4. **Use custom prefixes** for multi-service environments
5. **Test different modes** during development
6. **Monitor performance impact** in production

## Troubleshooting

### Common Issues

**Duplicate logs appearing:**
- Check `allowDuplication` setting
- Verify `mode` is not set to "both" unintentionally

**No console output:**
- Verify `enabled: true`
- Check if `mode` is set to "none"
- Ensure filters are not too restrictive

**Performance issues:**
- Enable `performanceMode: true`
- Reduce `maxInterceptionsPerSecond`
- Add more specific `excludePatterns`

### Debug Mode

```typescript
preserveOriginal: {
    enabled: true,
    mode: "both",
    customPrefix: "[DEBUG]",
    // This will show you exactly what's happening
}
```
