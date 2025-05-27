# SecureObject Complete Guide

## 📖 Table of Contents

1. [Basic Usage](#basic-usage)
2. [Creating SecureObjects](#creating-secureobjects)
3. [Data Operations](#data-operations)
4. [Sensitive Keys Management](#sensitive-keys-management)
5. [Encryption & Security](#encryption--security)
6. [Event System](#event-system)
7. [Serialization](#serialization)
8. [Metadata & Analytics](#metadata--analytics)
9. [Advanced Features](#advanced-features)
10. [Best Practices](#best-practices)

## Basic Usage

### Import and Create

```typescript
// 🚀 RECOMMENDED: Use the short, memorable aliases!
// so fObject or createSecureObject are both the same
import { fObject, fString } from "fortify2-js";

// Basic creation - super simple and memorable!
const user = fObject({
    name: "John Doe",
    age: 30,
    email: "john.doe@example.com",
});

const password = fString("my-secret-password");

// Alternative imports (if you prefer full names)
import { SecureObject, createSecureObject } from "fortify2-js";
const config = createSecureObject({
    apiKey: "secret-key",
    timeout: 5000,
});
```

## Creating SecureObjects

### 1. Basic Constructor

```typescript
const obj = new SecureObject();
obj.set("username", "john_doe");
obj.set("password", "secret123");
```

### 2. With Initial Data

```typescript
const user = new SecureObject({
    name: "John Doe",
    email: "john@example.com",
    password: "secure123",
});
```

### 3. With Options

```typescript
const secureConfig = new SecureObject(
    {
        apiKey: "secret-key",
    },
    {
        readOnly: false,
        encryptionKey: "my-encryption-key",
    }
);
```

### 4. Factory Functions

```typescript
// Basic creation
const obj1 = createSecureObject({ data: "value" });

// Read-only object
const obj2 = createReadOnlySecureObject({ config: "production" });

// With custom sensitive keys
const obj3 = createSecureObjectWithSensitiveKeys(
    { apiKey: "secret", token: "abc123" },
    ["apiKey", "token", "customSecret"]
);

// Clone existing object
const obj4 = cloneSecureObject(obj1);
```

## Data Operations

### Basic CRUD Operations

```typescript
// Using the simple fObject alias!
const user = fObject();

// SET - Add or update values
user.set("name", "John Doe");
user.set("age", 30);
user.set("active", true);

// GET - Retrieve values
const name = user.get("name"); // "John Doe"
const age = user.get("age"); // 30

// HAS - Check if key exists
const hasEmail = user.has("email"); // false
const hasName = user.has("name"); // true

// DELETE - Remove keys
const deleted = user.delete("age"); // true
user.delete("nonexistent"); // false

// SIZE - Get number of keys
const count = user.size; // 2

// CLEAR - Remove all data
user.clear();
```

### Bulk Operations

```typescript
const user = createSecureObject();

// Set multiple values at once
user.setAll({
    name: "John Doe",
    email: "john@example.com",
    age: 30,
    active: true,
});

// Get all data
const allData = user.getAll();
console.log(allData);
// { name: "John Doe", email: "john@example.com", age: 30, active: true }
```

### Safe Operations

```typescript
// Get with fallback
const email = user.getSafe("email"); // undefined if not exists
const role = user.getWithDefault("role", "user"); // "user" if not exists
```

### Collection Operations

```typescript
const user = createSecureObject({
    name: "John",
    age: 30,
    email: "john@example.com",
    active: true,
});

// Get all keys
const keys = user.keys(); // ["name", "age", "email", "active"]

// Get all values
const values = user.values(); // ["John", 30, "john@example.com", true]

// Get all entries
const entries = user.entries(); // [["name", "John"], ["age", 30], ...]

// Iterate over entries
user.forEach((value, key) => {
    console.log(`${key}: ${value}`);
});

// Map over values
const upperCaseStrings = user.map((value, key) => {
    return typeof value === "string" ? value.toUpperCase() : value;
});

// Filter entries (basic)
const stringValues = user.filter((value, key) => {
    return typeof value === "string";
});

// 🚀 ENHANCED FILTER METHODS (AMAZING!)
// These are the new super-powered filter methods!

// 1. filterByKeys - Type-safe key selection
const credentials = user.filterByKeys("name", "email");
console.log(credentials.getAll()); // { name: "John", email: "john@example.com" }

// 2. filterByType - Type guard filtering
const numbers = user.filterByType((v): v is number => typeof v === "number");
console.log(numbers.getAll()); // { age: 30 }

// 3. filterSensitive - Only sensitive data
user.addSensitiveKeys("email");
const sensitiveData = user.filterSensitive();
console.log(sensitiveData.getAll()); // { email: "john@example.com" }

// 4. filterNonSensitive - Only public data
const publicData = user.filterNonSensitive();
console.log(publicData.getAll()); // { name: "John", age: 30, active: true }

// 5. Chain filters for complex operations
const publicStrings = user
    .filterNonSensitive()
    .filter((v) => typeof v === "string");
console.log(publicStrings.getAll()); // { name: "John" }
```

### 🚀 AMAZING NEW FEATURES - Making JS Objects SUPER POWERFUL!

SecureObject now includes **14 incredible new methods** that make JavaScript objects more powerful than ever:

#### Data Transformation & Manipulation

```typescript
const user = createSecureObject({
    name: "John Doe",
    age: 30,
    email: "john@example.com",
    password: "secret123",
    profile: { bio: "Developer", location: "SF" },
    tags: ["js", "ts"],
    metadata: null,
    temp: "",
});

// 🔥 TRANSFORM - Like map but returns SecureObject
const uppercased = user.transform((value, key) => {
    return typeof value === "string" ? value.toUpperCase() : value;
});

// 🔥 GROUP BY - Organize data by classifier
const grouped = user.groupBy((value, key) => typeof value);
console.log(grouped.get("string")); // All string values
console.log(grouped.get("number")); // All number values

// 🔥 PARTITION - Split into two groups
const [sensitive, public_] = user.partition(
    (value, key) => key.includes("password") || key.includes("secret")
);

// 🔥 PICK & OMIT - Lodash-style but type-safe
const credentials = user.pick("name", "password", "email");
const withoutSecrets = user.omit("password", "apiKey");

// 🔥 FLATTEN - Flatten nested objects
const flattened = user.flatten();
console.log(flattened.get("profile.bio")); // "Developer"

// 🔥 COMPACT - Remove empty/null values
const compacted = user.compact(); // Removes null, "", []

// 🔥 INVERT - Swap keys and values
const simple = createSecureObject({ a: "apple", b: "banana" });
const inverted = simple.invert(); // { apple: "a", banana: "b" }

// 🔥 DEFAULTS - Apply default values
const withDefaults = user.defaults({
    role: "user", // Added if missing
    theme: "light", // Added if missing
});
```

#### Functional Programming & Chaining

```typescript
// 🔥 TAP - Debug in method chains
const result = user
    .filterNonSensitive()
    .tap((obj) => console.log("Filtered:", obj.size))
    .pick("name", "age")
    .tap((obj) => console.log("Picked:", obj.getAll()))
    .transform((value) => `[${value}]`);

// 🔥 PIPE - Functional composition
const pipeResult = user.pipe(
    (obj) => obj.filterNonSensitive(),
    (obj) => obj.pick("name", "age"),
    (obj) => obj.getAll()
);

// 🔥 SAMPLE - Random selection
const randomItems = user.sample(3); // Get 3 random entries

// 🔥 SHUFFLE - Random key order
const shuffled = user.shuffle(); // Same data, random order

// 🔥 CHUNK - Split into pieces
const chunks = user.chunk(3); // Array of SecureObjects with max 3 items each
```

#### Complex Chaining Examples

```typescript
// 🚀 INCREDIBLE: Combine multiple operations
const complexResult = user
    .filterNonSensitive() // Remove sensitive data
    .compact() // Remove empty values
    .omit("profile", "tags") // Remove complex objects
    .transform((value, key) => {
        // Transform values
        if (typeof value === "string") return value.toUpperCase();
        if (typeof value === "number") return value * 2;
        return value;
    })
    .sample(2); // Get random 2 items

// 🚀 FUNCTIONAL PIPELINE
const pipeline = user.pipe(
    (obj) => obj.filterByType((v): v is string => typeof v === "string"),
    (obj) => obj.transform((value) => value.trim().toLowerCase()),
    (obj) => obj.compact(),
    (obj) => obj.getAll()
);
```

### 🎯 Why These Features Are AMAZING

**🚀 More Powerful Than Standard Objects:**

-   **19 enhanced methods** vs 0 in regular objects
-   **Type-safe operations** with full TypeScript support
-   **Chainable methods** for functional programming
-   **Built-in security** with sensitive data handling

**💪 More Powerful Than Lodash:**

-   **Integrated security** - Lodash has none
-   **Type safety** - Better than Lodash's any types
-   **Memory management** - Automatic cleanup
-   **Event system** - Track all operations
-   **Immutable operations** - Always returns new objects

**🔥 Unique Capabilities:**

-   `filterSensitive()` / `filterNonSensitive()` - Security-aware filtering
-   `transform()` - Map but returns SecureObject for chaining
-   `tap()` - Debug in method chains without breaking flow
-   `pipe()` - Functional composition with type safety
-   `partition()` - Split data into two groups efficiently
-   `flatten()` - Handle nested objects elegantly
-   `sample()` / `shuffle()` - Randomization with security
-   `chunk()` - Split large objects for processing

**🎉 Real-World Examples:**

```typescript
// 🔥 API Response Processing
const apiResponse = createSecureObject(rawApiData)
    .filterNonSensitive() // Remove sensitive fields
    .compact() // Remove null/empty values
    .flatten() // Flatten nested objects
    .transform((value, key) => {
        // Normalize data
        return typeof value === "string" ? value.trim() : value;
    })
    .pick("id", "name", "email"); // Select only needed fields

// 🔥 Configuration Management
const config = createSecureObject(userConfig)
    .defaults(defaultConfig) // Apply defaults
    .tap((cfg) => console.log("Config loaded:", cfg.size))
    .filterByType((v): v is string => typeof v === "string")
    .transform((value) => value.toLowerCase());

// 🔥 Data Analysis Pipeline
const analysis = dataset.pipe(
    (data) => data.groupBy((value, key) => typeof value),
    (groups) => groups.get("number") || createSecureObject(),
    (numbers) => numbers.transform((value) => value * 2),
    (doubled) => doubled.getAll()
);
```

## Sensitive Keys Management

### Understanding Sensitive Keys

Sensitive keys are field names that should be treated as containing sensitive data (passwords, tokens, etc.).

```typescript
const user = createSecureObject({
    username: "john_doe",
    password: "secret123",
    apiKey: "sk-1234567890",
    email: "john@example.com",
});

// Check default sensitive keys
console.log(user.getSensitiveKeys());
// ["password", "passwd", "pwd", "secret", "token", "key", "apikey", ...]

// Check if a key is sensitive
console.log(user.isSensitiveKey("password")); // true
console.log(user.isSensitiveKey("username")); // false
```

### Managing Sensitive Keys

```typescript
// Add custom sensitive keys
user.addSensitiveKeys("customSecret", "internalToken");

// Remove sensitive keys
user.removeSensitiveKeys("pwd", "passwd");

// Set complete list (replaces existing)
user.setSensitiveKeys(["password", "apiKey", "token"]);

// Clear all sensitive keys
user.clearSensitiveKeys();

// Reset to defaults
user.resetToDefaultSensitiveKeys();

// Get default keys (static method)
const defaults = SecureObject.getDefaultSensitiveKeys;
```

## Encryption & Security

### Encryption Key Management

```typescript
const user = createSecureObject({
    username: "john_doe",
    password: "secret123",
    apiKey: "sk-1234567890",
});

// Set encryption key
user.setEncryptionKey("my-super-secret-encryption-key");

// Get current encryption key
const currentKey = user.getEncryptionKey; // "my-super-secret-encryption-key"

// Use object ID as key (default)
user.setEncryptionKey(null); // Uses object.id as key
```

### Working with Encrypted Data

```typescript
// Add sensitive keys
user.addSensitiveKeys("apiKey");

// Serialize with encryption for sensitive fields
const encrypted = user.getAll({ encryptSensitive: true });
console.log(encrypted);
// {
//   username: "john_doe",
//   password: "[ENCRYPTED:base64data]",
//   apiKey: "[ENCRYPTED:base64data]"
// }

// Decrypt encrypted data
const decrypted = user.decryptObject(encrypted);
console.log(decrypted);
// { username: "john_doe", password: "secret123", apiKey: "sk-1234567890" }

// Decrypt single value
const decryptedPassword = user.decryptValue("[ENCRYPTED:base64data]");
```

## Event System

### Adding Event Listeners

```typescript
const user = createSecureObject();

// Listen for set operations
user.addEventListener("set", (event, key, value) => {
    console.log(`Set ${key} = ${value}`);
});

// Listen for get operations
user.addEventListener("get", (event, key, value) => {
    console.log(`Accessed ${key}`);
});

// Listen for delete operations
user.addEventListener("delete", (event, key) => {
    console.log(`Deleted ${key}`);
});

// Listen for clear operations
user.addEventListener("clear", (event) => {
    console.log("Object cleared");
});

// Listen for destroy operations
user.addEventListener("destroy", (event) => {
    console.log("Object destroyed");
});
```

### One-time Listeners

```typescript
// Listen for next set operation only
user.once("set", (event, key, value) => {
    console.log(`First set: ${key} = ${value}`);
});

// Wait for specific event (returns Promise)
const result = await user.waitFor("set", 5000); // 5 second timeout
console.log(`Event occurred: ${result.key} = ${result.value}`);
```

### Removing Listeners

```typescript
const listener = (event, key, value) => {
    console.log(`${event}: ${key} = ${value}`);
};

// Add listener
user.addEventListener("set", listener);

// Remove specific listener
user.removeEventListener("set", listener);
```

## Serialization

### Basic Serialization

```typescript
const user = createSecureObject({
    name: "John Doe",
    age: 30,
    email: "john@example.com",
    password: "secret123",
});

// Convert to regular object
const obj = user.toObject();
console.log(obj);
// { name: "John Doe", age: 30, email: "john@example.com", password: "secret123" }

// Convert to JSON string
const json = user.toJSON();
console.log(json);
// '{"name":"John Doe","age":30,"email":"john@example.com","password":"secret123"}'
```

### Advanced Serialization Options

```typescript
// Include metadata
const withMetadata = user.toObject({ includeMetadata: true });
console.log(withMetadata);
// {
//   name: "John Doe",
//   age: 30,
//   email: "john@example.com",
//   password: "secret123",
//   _metadata: { /* metadata for each field */ } //(could undefined )
// }

// Encrypt sensitive data
user.addSensitiveKeys("password");
const encrypted = user.toObject({ encryptSensitive: true });
console.log(encrypted);
// {
//   name: "John Doe",
//   age: 30,
//   email: "john@example.com",
//   password: "[ENCRYPTED:base64data]"
// }

// Binary format
const binary = user.toObject({ format: "binary" });
console.log(binary); // Uint8Array

// JSON format (string)
const jsonString = user.toObject({ format: "json" });
console.log(jsonString); // JSON string
```

## Metadata & Analytics

### Accessing Metadata

```typescript
const user = createSecureObject();
user.set("name", "John");
user.set("age", 30);

// Get metadata for specific key
const nameMetadata = user.getMetadata("name");
console.log(nameMetadata);
// {
//   type: "string",
//   isSecure: true,
//   created: Date,
//   lastAccessed: Date,
//   accessCount: 1
// }

// Get all metadata
const allMetadata = user.getAllMetadata();
console.log(allMetadata); // Map of all metadata
```

## Advanced Features

### Object Operations

```typescript
const user1 = createSecureObject({ name: "John", age: 30 });
const user2 = createSecureObject({ email: "john@example.com", active: true });

// Clone object
const userCopy = user1.clone();

// Merge objects
user1.merge(user2); // user1 now has all properties from user2
console.log(user1.getAll());
// { name: "John", age: 30, email: "john@example.com", active: true }

// Merge without overwriting
user1.merge(user2, false); // Won't overwrite existing keys
```

### Utility Methods

```typescript
// Use object data temporarily
const result = user.use((obj) => {
    return obj.get("name").toUpperCase();
}); // Returns "JOHN"

// Use with auto-clear
user.use((obj) => {
    console.log(obj.getAll());
}, true); // Object is destroyed after use

// Create hash of object content
const hash = await user.hash("SHA-256", "hex");
console.log(hash); // "abc123def456..."
```

### Read-Only Objects

```typescript
// Create read-only object
const config = createReadOnlySecureObject({
    apiUrl: "https://api.example.com",
    version: "1.0.0",
});

console.log(config.isReadOnly); // true

// This will throw an error
try {
    config.set("newKey", "value");
} catch (error) {
    console.log(error.message); // "SecureObject is read-only"
}
```

### Object Inspection

```typescript
const user = createSecureObject({ name: "John", age: 30 });

console.log(user.id); // Unique object ID
console.log(user.size); // Number of keys
console.log(user.isEmpty); // false
console.log(user.isDestroyed); // false
console.log(user.isReadOnly); // false

// Custom inspection (for debugging)
console.log(user); // "SecureObject [2 items, 1 secure] "
```

## Best Practices

### 1. Always Destroy Objects When Done

```typescript
const user = createSecureObject({ password: "secret" });

// Use the object...

// Clean up
user.destroy();
```

### 2. Use Appropriate Sensitive Keys

```typescript
const user = createSecureObject();

// Add application-specific sensitive keys
user.addSensitiveKeys("internalToken", "sessionId", "refreshToken");
```

### 3. Handle Events Properly

```typescript
const user = createSecureObject();

// Always remove listeners to prevent memory leaks
const listener = (event, key) => console.log(`${event}: ${key}`);
user.addEventListener("set", listener);

// Later...
user.removeEventListener("set", listener);
```

### 4. Use Encryption for Sensitive Data

```typescript
const user = createSecureObject();
user.setEncryptionKey("strong-encryption-key");
user.addSensitiveKeys("password", "apiKey");

// Serialize with encryption
const safeData = user.getAll({ encryptSensitive: true });
```

### 5. Leverage Type Safety

```typescript
interface UserData {
    name: string;
    age: number;
    email: string;
    password: string;
}

const user = createSecureObject<UserData>({
    name: "John",
    age: 30,
    email: "john@example.com",
    password: "secret",
});

// TypeScript will enforce types
const name: string = user.get("name"); // ✅ Correct
const age: number = user.get("age"); // ✅ Correct
```

This guide covers all the essential SecureObject functionality. Next, I'll create the SecureString guide!

