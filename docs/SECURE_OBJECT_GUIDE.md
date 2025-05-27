# SecureObject Guide

## Table of Contents

1. [Basic Usage](#basic-usage)
2. [Creating SecureObjects](#creating-secureobjects)
3. [Data Operations](#data-operations)
4. [Sensitive Keys Management](#sensitive-keys-management)
5. [Encryption and Security](#encryption-and-security)
6. [Event System](#event-system)
7. [Serialization](#serialization)
8. [Metadata and Analytics](#metadata-and-analytics)
9. [Advanced Features](#advanced-features)
10. [Best Practices](#best-practices)

## Basic Usage

### Import and Create

```typescript
import { SecureObject, createSecureObject } from "fortify2-js";

// Basic creation
const user = createSecureObject({
    name: "John Doe",
    age: 30,
    email: "john.doe@example.com",
});

const password = createSecureString("my-secret-password");

// Alternative import with aliases
import { fObject, fString } from "fortify2-js";
const config = fObject({
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
const user = createSecureObject();

// Set values
user.set("name", "John Doe");
user.set("age", 30);
user.set("active", true);

// Get values
const name = user.get("name"); // "John Doe"
const age = user.get("age"); // 30

// Check key existence
const hasEmail = user.has("email"); // false
const hasName = user.has("name"); // true

// Delete keys
const deleted = user.delete("age"); // true
user.delete("nonexistent"); // false

// Get key count
const count = user.size; // 2

// Clear all data
user.clear();
```

### Bulk Operations

```typescript
const user = createSecureObject();

// Set multiple values
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

// Filter entries
const stringValues = user.filter((value, key) => {
    return typeof value === "string";
});

// Advanced Filtering Methods
// Select specific keys
const credentials = user.filterByKeys("name", "email");
console.log(credentials.getAll()); // { name: "John", email: "john@example.com" }

// Filter by type
const numbers = user.filterByType((v): v is number => typeof v === "number");
console.log(numbers.getAll()); // { age: 30 }

// Filter sensitive data
user.addSensitiveKeys("email");
const sensitiveData = user.filterSensitive();
console.log(sensitiveData.getAll()); // { email: "john@example.com" }

// Filter non-sensitive data
const publicData = user.filterNonSensitive();
console.log(publicData.getAll()); // { name: "John", age: 30, active: true }

// Chain filters
const publicStrings = user
    .filterNonSensitive()
    .filter((v) => typeof v === "string");
console.log(publicStrings.getAll()); // { name: "John" }
```

### Data Transformation and Manipulation

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

// Transform values
const uppercased = user.transform((value, key) => {
    return typeof value === "string" ? value.toUpperCase() : value;
});

// Group by classifier
const grouped = user.groupBy((value, key) => typeof value);
console.log(grouped.get("string")); // All string values
console.log(grouped.get("number")); // All number values

// Partition data
const [sensitive, public_] = user.partition(
    (value, key) => key.includes("password") || key.includes("secret")
);

// Select or exclude keys
const credentials = user.pick("name", "password", "email");
const withoutSecrets = user.omit("password", "apiKey");

// Flatten nested objects
const flattened = user.flatten();
console.log(flattened.get("profile.bio")); // "Developer"

// Remove empty/null values
const compacted = user.compact();

// Invert keys and values
const simple = createSecureObject({ a: "apple", b: "banana" });
const inverted = simple.invert(); // { apple: "a", banana: "b" }

// Apply default values
const withDefaults = user.defaults({
    role: "user",
    theme: "light",
});
```

### Functional Programming and Chaining

```typescript
// Debug in method chains
const result = user
    .filterNonSensitive()
    .tap((obj) => console.log("Filtered:", obj.size))
    .pick("name", "age")
    .tap((obj) => console.log("Picked:", obj.getAll()))
    .transform((value) => `[${value}]`);

// Functional composition
const pipeResult = user.pipe(
    (obj) => obj.filterNonSensitive(),
    (obj) => obj.pick("name", "age"),
    (obj) => obj.getAll()
);

// Random selection
const randomItems = user.sample(3);

// Random key order
const shuffled = user.shuffle();

// Split into pieces
const chunks = user.chunk(3);
```

## Sensitive Keys Management

### Understanding Sensitive Keys

Sensitive keys are field names containing sensitive data, such as passwords or tokens.

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

// Set complete list
user.setSensitiveKeys(["password", "apiKey", "token"]);

// Clear all sensitive keys
user.clearSensitiveKeys();

// Reset to defaults
user.resetToDefaultSensitiveKeys();

// Get default keys
const defaults = SecureObject.getDefaultSensitiveKeys;
```

## Encryption and Security

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
const currentKey = user.getEncryptionKey;

// Use object ID as key
user.setEncryptionKey(null);
```

### Working with Encrypted Data

```typescript
// Add sensitive keys
user.addSensitiveKeys("apiKey");

// Serialize with encryption
const encrypted = user.getAll({ encryptSensitive: true });
console.log(encrypted);
// { username: "john_doe", password: "[ENCRYPTED:base64data]", apiKey: "[ENCRYPTED:base64data]" }

// Decrypt data
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

// Listen for other operations
user.addEventListener("delete", (event, key) => {
    console.log(`Deleted ${key}`);
});
```

### One-time Listeners

```typescript
// Listen for next set operation
user.once("set", (event, key, value) => {
    console.log(`First set: ${key} = ${value}`);
});

// Wait for specific event
const result = await user.waitFor("set", 5000);
console.log(`Event occurred: ${result.key} = ${result.value}`);
```

### Removing Listeners

```typescript
const listener = (event, key, value) => {
    console.log(`${event}: ${key} = ${value}`);
};

// Add and remove listener
user.addEventListener("set", listener);
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

// Convert to object
const obj = user.toObject();
console.log(obj);
// { name: "John Doe", age: 30, email: "john@example.com", password: "secret123" }

// Convert to JSON
const json = user.toJSON();
console.log(json);
// '{"name":"John Doe","age":30,"email":"john@example.com","password":"secret123"}'
```

### Advanced Serialization Options

```typescript
// Include metadata
const withMetadata = user.toObject({ includeMetadata: true });
console.log(withMetadata);
// { name, age, email, password, _metadata: { ... } }

// Encrypt sensitive data
user.addSensitiveKeys("password");
const encrypted = user.toObject({ encryptSensitive: true });
console.log(encrypted);
// { name, age, email, password: "[ENCRYPTED:base64data]" }

// Binary format
const binary = user.toObject({ format: "binary" });
console.log(binary); // Uint8Array
```

## Metadata and Analytics

### Accessing Metadata

```typescript
const user = createSecureObject();
user.set("name", "John");
user.set("age", 30);

// Get metadata for specific key
const nameMetadata = user.getMetadata("name");
console.log(nameMetadata);
// { type: "string", isSecure: true, created: Date, lastAccessed: Date, accessCount: 1 }

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
user1.merge(user2);
console.log(user1.getAll());
// { name: "John", age: 30, email: "john@example.com", active: true }
```

### Utility Methods

```typescript
// Use object temporarily
const result = user.use((obj) => {
    return obj.get("name").toUpperCase();
}); // Returns "JOHN"

// Create hash
const hash = await user.hash("SHA-256", "hex");
console.log(hash); // "abc123def456..."
```

### Read-Only Objects

```typescript
const config = createReadOnlySecureObject({
    apiUrl: "https://api.example.com",
    version: "1.0.0",
});

console.log(config.isReadOnly); // true

// Attempting to modify throws error
try {
    config.set("newKey", "value");
} catch (error) {
    console.log(error.message); // "SecureObject is read-only"
}
```

## Best Practices

1. **Destroy Objects After Use**:
   ```typescript
   const user = createSecureObject({ password: "secret" });
   user.destroy();
   ```

2. **Define Sensitive Keys**:
   ```typescript
   const user = createSecureObject();
   user.addSensitiveKeys("internalToken", "sessionId");
   ```

3. **Manage Event Listeners**:
   ```typescript
   const listener = (event, key) => console.log(`${event}: ${key}`);
   user.addEventListener("set", listener);
   user.removeEventListener("set", listener);
   ```

4. **Use Encryption**:
   ```typescript
   const user = createSecureObject();
   user.setEncryptionKey("strong-encryption-key");
   user.addSensitiveKeys("password");
   const safeData = user.getAll({ encryptSensitive: true });
   ```

5. **Leverage Type Safety**:
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
   const name: string = user.get("name");
   ```