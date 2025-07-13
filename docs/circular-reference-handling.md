# Circular Reference Handling in FortifyJS

FortifyJS automatically handles circular references in JSON serialization, preventing the common "JSON.stringify cannot serialize cyclic structures" error.

## The Problem

When working with Express.js applications, you might encounter circular reference errors when trying to serialize objects that reference each other:

```javascript
// This would normally throw an error
const obj = { name: "test" };
obj.self = obj; // Circular reference
res.json(obj); // ❌ TypeError: JSON.stringify cannot serialize cyclic structures
```

This commonly happens with:
- Express `req` and `res` objects (which reference each other)
- Complex nested objects
- Objects that include the full request/response in their data

## The Solution

FortifyJS automatically detects and handles circular references using advanced serialization techniques:

### 1. Automatic Detection
The middleware automatically detects when `JSON.stringify()` fails due to circular references and falls back to safe serialization.

### 2. Smart Object Handling
- **Express Objects**: Safely extracts useful properties from `req`/`res` objects
- **Circular References**: Replaces with `[Circular Reference]` markers
- **Functions**: Converts to descriptive strings like `[Function: functionName]`
- **Buffers**: Shows size information like `[Buffer: 1024 bytes]`
- **Errors**: Extracts name, message, and stack trace

### 3. Performance Optimized
- Tries standard `JSON.stringify()` first for maximum performance
- Only uses safe serialization when needed
- Configurable depth and string truncation limits

## Usage

### Automatic (Recommended)
FortifyJS automatically applies safe JSON middleware to all servers:

```javascript
import { createServer } from "fortify2-js";

const app = createServer({
  server: { port: 3000 },
  env: 'development' // Enables circular reference logging
});

// This now works automatically, even with circular references
app.get("/", (req, res) => {
  const data = { request: req, timestamp: Date.now() };
  data.self = data; // Circular reference
  
  res.json(data); // ✅ Works perfectly!
});
```

### Manual Configuration
You can customize the behavior:

```javascript
import { createServer, createSafeJsonMiddleware } from "fortify2-js";

const app = createServer();

// Add with custom options
app.use(createSafeJsonMiddleware({
  enabled: true,
  maxDepth: 15,
  truncateStrings: 2000,
  logCircularRefs: true,
  includeNonEnumerable: false
}));
```

### Utility Functions
Use the safe serialization utilities directly:

```javascript
import { expressStringify, safeJsonStringify } from "fortify2-js";

// Safe stringify for any object
const safeJson = expressStringify(complexObjectWithCircularRefs);

// Quick utility function
const result = safeJsonStringify(obj);
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | boolean | `true` | Enable/disable safe JSON handling |
| `maxDepth` | number | `10` | Maximum object depth to serialize |
| `truncateStrings` | number | `1000` | Maximum string length before truncation |
| `logCircularRefs` | boolean | `false` | Log when circular references are detected |
| `includeNonEnumerable` | boolean | `false` | Include non-enumerable properties |
| `customReplacer` | function | `undefined` | Custom replacer function for additional handling |

## Examples

### Basic Circular Reference
```javascript
app.get("/basic", (req, res) => {
  const data = { message: "Hello" };
  data.circular = data; // Creates circular reference
  
  res.json(data); // ✅ Automatically handled
});
```

### Express Object Serialization
```javascript
app.get("/request-info", (req, res) => {
  res.json({
    message: "Request information",
    request: req, // Full Express request object
    timestamp: Date.now()
  }); // ✅ Express objects safely serialized
});
```

### Complex Nested Structures
```javascript
app.get("/complex", (req, res) => {
  const complex = {
    user: { id: 1, name: "John" },
    metadata: { request: req, response: res },
    refs: []
  };
  
  complex.user.parent = complex;
  complex.refs.push(complex, req, res);
  
  res.json(complex); // ✅ All circular references handled
});
```

## Debugging

Enable development mode to see circular reference detection logs:

```javascript
const app = createServer({
  env: 'development' // Enables logging
});
```

You'll see logs like:
```
🔄 Circular reference detected, using safe serialization: {
  url: '/api/data',
  method: 'GET',
  error: 'Converting circular structure to JSON'
}
```

## Advanced Usage

### Custom Debugging
```javascript
import { createCircularRefDebugger } from "fortify2-js";

// Add detailed debugging middleware
app.use(createCircularRefDebugger());
```

### Manual Safe Response
```javascript
import { sendSafeJson } from "fortify2-js";

app.get("/manual", (req, res) => {
  const data = { /* complex object with circular refs */ };
  
  // Manually send with safe serialization
  sendSafeJson(res, data, {
    maxDepth: 20,
    logCircularRefs: true
  });
});
```

## Performance Impact

- **Zero impact** for simple objects (uses standard JSON.stringify)
- **Minimal impact** for complex objects (only when circular references detected)
- **Smart caching** of serialization patterns
- **Configurable limits** to prevent performance issues

## Best Practices

1. **Use automatic handling** - Let FortifyJS handle it automatically
2. **Enable logging in development** - Set `env: 'development'` to see when circular references are detected
3. **Configure limits** - Adjust `maxDepth` and `truncateStrings` based on your needs
4. **Test complex objects** - Verify that your complex data structures serialize correctly
5. **Monitor performance** - Watch for excessive circular reference handling in production

## Migration from Standard Express

If you're migrating from standard Express and encountering circular reference errors:

1. **Replace** `express()` with `createServer()` from FortifyJS
2. **Remove** any custom circular reference handling code
3. **Enable logging** to see where circular references were occurring
4. **Test thoroughly** to ensure all responses serialize correctly

The migration is seamless - all existing Express code continues to work, but now with automatic circular reference protection!
