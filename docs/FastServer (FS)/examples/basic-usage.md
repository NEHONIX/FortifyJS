# Basic Usage Examples

## Simple Server Setup

### Minimal Configuration

```typescript
import { createServer } from "fortify2-js";

const app = createServer();

app.get("/", (req, res) => {
    res.json({ message: "Hello, FastServer!" });
});

app.start(3000);
```

### Basic Configuration

```typescript
import { createServer } from "fortify2-js";

const app = createServer({
    server: {
        port: 3000,
        host: "localhost",
    },
    cache: {
        enabled: true,
        strategy: "memory",
    },
    logging: {
        level: "info",
    },
});

app.get("/api/status", (req, res) => {
    res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

app.start();
```

## REST API Examples

### Basic CRUD Operations

```typescript
import { createServer } from "fortify2-js";

const app = createServer({
    cache: { enabled: true },
    logging: { level: "info" },
});

// In-memory data store (use database in production)
let users = [
    { id: 1, name: "John Doe", email: "john@example.com" },
    { id: 2, name: "Jane Smith", email: "jane@example.com" },
];
let nextId = 3;

// GET all users with caching
app.getWithCache(
    "/api/users",
    {
        cache: {
            enabled: true,
            ttl: 300000, // 5 minutes
            tags: ["users"],
        },
    },
    (req, res) => {
        res.json(users);
    }
);

// GET user by ID with caching
app.getWithCache(
    "/api/users/:id",
    {
        cache: {
            enabled: true,
            ttl: 600000, // 10 minutes
            key: (req) => `user:${req.params.id}`,
            tags: ["users"],
        },
    },
    (req, res) => {
        const user = users.find((u) => u.id === parseInt(req.params.id));
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        res.json(user);
    }
);

// POST new user
app.post("/api/users", async (req, res) => {
    const { name, email } = req.body;

    if (!name || !email) {
        return res.status(400).json({ error: "Name and email are required" });
    }

    const newUser = {
        id: nextId++,
        name,
        email,
    };

    users.push(newUser);

    // Invalidate users cache
    await app.invalidateCache("users:*");

    res.status(201).json(newUser);
});

// PUT update user
app.put("/api/users/:id", async (req, res) => {
    const userId = parseInt(req.params.id);
    const userIndex = users.findIndex((u) => u.id === userId);

    if (userIndex === -1) {
        return res.status(404).json({ error: "User not found" });
    }

    users[userIndex] = { ...users[userIndex], ...req.body };

    // Invalidate specific user cache
    await app.cache.del(`user:${userId}`);
    await app.invalidateCache("users:*");

    res.json(users[userIndex]);
});

// DELETE user
app.delete("/api/users/:id", async (req, res) => {
    const userId = parseInt(req.params.id);
    const userIndex = users.findIndex((u) => u.id === userId);

    if (userIndex === -1) {
        return res.status(404).json({ error: "User not found" });
    }

    users.splice(userIndex, 1);

    // Invalidate caches
    await app.cache.del(`user:${userId}`);
    await app.invalidateCache("users:*");

    res.status(204).send();
});

app.start(3000);
```

## Middleware Examples

### Custom Middleware

```typescript
import { createServer } from "fortify2-js";

const app = createServer();

// Request logging middleware
app.use((req, res, next) => {
    const start = Date.now();

    res.on("finish", () => {
        const duration = Date.now() - start;
        console.log(
            `${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`
        );
    });

    next();
});

// Authentication middleware
const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
        return res.status(401).json({ error: "Authentication required" });
    }

    // Verify token (simplified)
    if (token === "valid-token") {
        req.user = { id: 1, name: "John Doe" };
        next();
    } else {
        res.status(401).json({ error: "Invalid token" });
    }
};

// Protected route
app.get("/api/profile", authenticate, (req, res) => {
    res.json({
        user: req.user,
        message: "This is a protected route",
    });
});

app.start(3000);
```

### Error Handling Middleware

```typescript
import { createServer } from "fortify2-js";

const app = createServer();

// Routes
app.get("/api/error", (req, res) => {
    throw new Error("Something went wrong!");
});

app.get("/api/async-error", async (req, res) => {
    throw new Error("Async error occurred!");
});

// Error handling middleware (must be last)
app.use((error, req, res, next) => {
    console.error("Error:", error.message);

    // Don't expose internal errors in production
    const isDevelopment = process.env.NODE_ENV === "development";

    res.status(500).json({
        error: "Internal Server Error",
        ...(isDevelopment && { details: error.message, stack: error.stack }),
    });
});

app.start(3000);
```

## File Upload Example

```typescript
import { createServer } from "fortify2-js";
import multer from "multer";
import path from "path";

const app = createServer();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(
            null,
            file.fieldname +
                "-" +
                uniqueSuffix +
                path.extname(file.originalname)
        );
    },
});

const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        // Allow only images
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        } else {
            cb(new Error("Only image files are allowed!"));
        }
    },
});

// Single file upload
app.post("/api/upload", upload.single("image"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }

    res.json({
        message: "File uploaded successfully",
        file: {
            filename: req.file.filename,
            originalname: req.file.originalname,
            size: req.file.size,
            mimetype: req.file.mimetype,
        },
    });
});

// Multiple file upload
app.post("/api/upload-multiple", upload.array("images", 5), (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
    }

    const files = req.files.map((file) => ({
        filename: file.filename,
        originalname: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
    }));

    res.json({
        message: `${files.length} files uploaded successfully`,
        files,
    });
});

app.start(3000);
```

## Static File Serving

```typescript
import { createServer } from "fortify2-js";
import express from "express";
import path from "path";

const app = createServer({
    cache: {
        enabled: true,
        strategy: "memory",
    },
});

// Serve static files with caching
app.use(
    "/static",
    express.static(path.join(__dirname, "public"), {
        maxAge: "1d", // Cache for 1 day
        etag: true,
        lastModified: true,
    })
);

// Serve uploaded files
app.use(
    "/uploads",
    express.static(path.join(__dirname, "uploads"), {
        maxAge: "1h", // Cache for 1 hour
    })
);

// API routes
app.get("/api/files", (req, res) => {
    // Return list of available files
    res.json({
        static: "/static",
        uploads: "/uploads",
    });
});

app.start(3000);
```

## WebSocket Integration

```typescript
import { createServer } from "fortify2-js";
import { createServer as createHttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";

const app = createServer();

// Create HTTP server
const httpServer = createHttpServer(app);

// Initialize Socket.IO
const io = new SocketIOServer(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

// Socket.IO connection handling
io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("message", (data) => {
        console.log("Message received:", data);

        // Broadcast to all clients
        io.emit("message", {
            id: socket.id,
            message: data.message,
            timestamp: new Date().toISOString(),
        });
    });

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
    });
});

// REST API routes
app.get("/api/messages", (req, res) => {
    res.json({ message: "WebSocket server is running" });
});

// Start server
httpServer.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
```

## Environment Configuration

```typescript
import { createServer } from "fortify2-js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = createServer({
    env: process.env.NODE_ENV as "development" | "production" | "test",
    server: {
        port: parseInt(process.env.PORT || "3000"),
        host: process.env.HOST || "localhost",
    },
    cache: {
        enabled: process.env.CACHE_ENABLED === "true",
        strategy: (process.env.CACHE_STRATEGY as any) || "memory",
    },
    logging: {
        level: (process.env.LOG_LEVEL as any) || "info",
    },
});

// Environment-specific routes
if (process.env.NODE_ENV === "development") {
    app.get("/api/debug", (req, res) => {
        res.json({
            env: process.env.NODE_ENV,
            memory: process.memoryUsage(),
            uptime: process.uptime(),
        });
    });
}

app.get("/api/config", (req, res) => {
    res.json({
        environment: process.env.NODE_ENV,
        version: process.env.npm_package_version || "1.0.0",
    });
});

app.start();
```

## Testing Setup

```typescript
import { createServer } from "fortify2-js";
import request from "supertest";

// Test configuration
const testApp = createServer({
    env: "test",
    logging: { level: "silent" },
    cache: { enabled: false },
});

testApp.get("/api/test", (req, res) => {
    res.json({ message: "Test endpoint" });
});

// Example test
describe("API Tests", () => {
    test("GET /api/test", async () => {
        const response = await request(testApp).get("/api/test").expect(200);

        expect(response.body.message).toBe("Test endpoint");
    });
});

export { testApp };
```
