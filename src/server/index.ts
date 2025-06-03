/**
 * FortifyJS Server
 *
 * This module provides a server interface for the FortifyJS library,
 * allowing other applications to communicate with it via HTTP or WebSockets.
 */

import * as http from "http";
import * as WebSocket from "ws";
import * as url from "url";
import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";

// Import FortifyJS modules
import { FortifyJS } from "../core/crypto";
import { Hash } from "../core/hash";
import { Keys } from "../core/keys";
import { SecureRandom } from "../core/random";
import { argon2Derive, balloonDerive } from "../security/memory-hard";
import {
    generateAttestationKey,
    createAttestation,
    verifyAttestation,
} from "../security/attestation";
import { createCanary } from "../security/canary-tokens";
import { constantTimeEqual } from "../security/side-channel";

// Define server options interface
interface ServerOptions {
    port?: number;
    host?: string;
    enableHttp?: boolean;
    enableWebSockets?: boolean;
    authToken?: string;
    corsOrigins?: string[];
    logRequests?: boolean;
}

// Define request handler interface
interface RequestHandler {
    (request: any, response: any): Promise<any>;
}

// Define the server class
export class FortifyJSServer {
    private server: http.Server;
    private wsServer: WebSocket.Server | null = null;
    private options: ServerOptions;
    private handlers: Map<string, RequestHandler> = new Map();
    private authToken: string;

    /**
     * Create a new FortifyJS server
     *
     * @param options Server options
     */
    constructor(options: ServerOptions = {}) {
        // Set default options
        this.options = {
            port: options.port || 3000,
            host: options.host || "localhost",
            enableHttp: options.enableHttp !== false,
            enableWebSockets: options.enableWebSockets !== false,
            authToken: options.authToken || "",
            corsOrigins: options.corsOrigins || ["*"],
            logRequests: options.logRequests !== false,
        };

        // Generate auth token if not provided
        this.authToken =
            this.options.authToken || crypto.randomBytes(32).toString("hex");

        // Create HTTP server
        this.server = http.createServer(this.handleHttpRequest.bind(this));

        // Register handlers
        this.registerHandlers();

        // Create WebSocket server if enabled
        if (this.options.enableWebSockets) {
            this.wsServer = new WebSocket.Server({ server: this.server });
            this.wsServer.on(
                "connection",
                this.handleWebSocketConnection.bind(this)
            );
        }
    }

    /**
     * Start the server
     *
     * @returns Promise that resolves when the server is started
     */
    public start(): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                this.server.listen(this.options.port, this.options.host, () => {
                    console.log(
                        `FortifyJS server running at http://${this.options.host}:${this.options.port}/`
                    );
                    console.log(`Auth token: ${this.authToken}`);
                    resolve();
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Stop the server
     *
     * @returns Promise that resolves when the server is stopped
     */
    public stop(): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                if (this.wsServer) {
                    this.wsServer.close();
                }
                this.server.close(() => {
                    console.log("Nehonix FortifyJS server stopped");
                    resolve();
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Register all request handlers
     */
    private registerHandlers(): void {
        // Key management
        this.handlers.set("generateKey", this.handleGenerateKey.bind(this));

        // Password hashing
        this.handlers.set("hashPassword", this.handleHashPassword.bind(this));
        this.handlers.set(
            "verifyPassword",
            this.handleVerifyPassword.bind(this)
        );

        // Encryption/decryption
        this.handlers.set("encrypt", this.handleEncrypt.bind(this));
        this.handlers.set("decrypt", this.handleDecrypt.bind(this));

        // Token generation
        this.handlers.set("generateToken", this.handleGenerateToken.bind(this));
        this.handlers.set(
            "generateAPIKey",
            this.handleGenerateAPIKey.bind(this)
        );
        this.handlers.set(
            "generateSessionToken",
            this.handleGenerateSessionToken.bind(this)
        );

        // Memory-hard functions
        this.handlers.set(
            "deriveKeyMemoryHard",
            this.handleDeriveKeyMemoryHard.bind(this)
        );
        this.handlers.set(
            "deriveKeyBalloon",
            this.handleDeriveKeyBalloon.bind(this)
        );

        // Attestation
        this.handlers.set(
            "generateAttestationKey",
            this.handleGenerateAttestationKey.bind(this)
        );
        this.handlers.set(
            "createAttestation",
            this.handleCreateAttestation.bind(this)
        );
        this.handlers.set(
            "verifyAttestation",
            this.handleVerifyAttestation.bind(this)
        );

        // Canary tokens
        this.handlers.set(
            "createCanaryToken",
            this.handleCreateCanaryToken.bind(this)
        );

        // Server management
        this.handlers.set("getServerInfo", this.handleGetServerInfo.bind(this));
        this.handlers.set("shutdown", this.handleShutdown.bind(this));
    }

    /**
     * Handle HTTP requests
     *
     * @param req HTTP request
     * @param res HTTP response
     */
    private async handleHttpRequest(
        req: http.IncomingMessage,
        res: http.ServerResponse
    ): Promise<void> {
        // Set CORS headers
        this.setCorsHeaders(req, res);

        // Handle preflight requests
        if (req.method === "OPTIONS") {
            res.writeHead(204);
            res.end();
            return;
        }

        // Only accept POST requests for API endpoints
        if (req.method !== "POST" || !req.url || !req.url.startsWith("/api/")) {
            // Serve static files or return 404
            if (req.method === "GET") {
                this.serveStaticFile(req, res);
            } else {
                res.writeHead(404, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Not found" }));
            }
            return;
        }

        // Parse request body
        try {
            const body = await this.parseRequestBody(req);
            const endpoint = req.url.substring(5); // Remove '/api/'

            // Verify auth token
            if (!this.verifyAuthToken(body, this.authToken)) {
                res.writeHead(401, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Unauthorized" }));
                return;
            }

            // Log request if enabled
            if (this.options.logRequests) {
                console.log(`HTTP ${req.method} ${req.url}`);
            }

            // Handle request
            const handler = this.handlers.get(endpoint);
            if (handler) {
                try {
                    const result = await handler(body, res);
                    res.writeHead(200, { "Content-Type": "application/json" });
                    res.end(JSON.stringify({ success: true, result }));
                } catch (error) {
                    console.error(
                        `Error handling request to ${endpoint}:`,
                        error
                    );
                    res.writeHead(500, { "Content-Type": "application/json" });
                    res.end(
                        JSON.stringify({
                            success: false,
                            error:
                                error instanceof Error
                                    ? error.message
                                    : "Unknown error",
                        })
                    );
                }
            } else {
                res.writeHead(404, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "Endpoint not found" }));
            }
        } catch (error) {
            console.error("Error parsing request body:", error);
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Invalid request body" }));
        }
    }

    /**
     * Handle WebSocket connections
     *
     * @param ws WebSocket connection
     */
    private handleWebSocketConnection(ws: WebSocket): void {
        console.log("WebSocket connection established");

        ws.on("message", async (message: string) => {
            try {
                // Parse message
                const data = JSON.parse(message);

                // Verify auth token
                if (!this.verifyAuthToken(data, this.authToken)) {
                    ws.send(JSON.stringify({ error: "Unauthorized" }));
                    return;
                }

                // Log request if enabled
                if (this.options.logRequests) {
                    console.log(`WebSocket message: ${data.action}`);
                }

                // Handle request
                const handler = this.handlers.get(data.action);
                if (handler) {
                    try {
                        const result = await handler(data, null);
                        ws.send(JSON.stringify({ success: true, result }));
                    } catch (error) {
                        console.error(
                            `Error handling WebSocket message ${data.action}:`,
                            error
                        );
                        ws.send(
                            JSON.stringify({
                                success: false,
                                error:
                                    error instanceof Error
                                        ? error.message
                                        : "Unknown error",
                            })
                        );
                    }
                } else {
                    ws.send(JSON.stringify({ error: "Action not found" }));
                }
            } catch (error) {
                console.error("Error parsing WebSocket message:", error);
                ws.send(JSON.stringify({ error: "Invalid message format" }));
            }
        });

        ws.on("close", () => {
            console.log("WebSocket connection closed");
        });
    }

    /**
     * Parse HTTP request body
     *
     * @param req HTTP request
     * @returns Promise that resolves with the parsed body
     */
    private parseRequestBody(req: http.IncomingMessage): Promise<any> {
        return new Promise((resolve, reject) => {
            const chunks: Buffer[] = [];

            req.on("data", (chunk) => {
                chunks.push(chunk);
            });

            req.on("end", () => {
                try {
                    const body = Buffer.concat(chunks).toString();
                    const data = JSON.parse(body);
                    resolve(data);
                } catch (error) {
                    reject(error);
                }
            });

            req.on("error", (error) => {
                reject(error);
            });
        });
    }

    /**
     * Set CORS headers
     *
     * @param req HTTP request
     * @param res HTTP response
     */
    private setCorsHeaders(
        req: http.IncomingMessage,
        res: http.ServerResponse
    ): void {
        const origin = req.headers.origin;

        // Check if origin is allowed
        if (
            origin &&
            (this.options.corsOrigins!.includes("*") ||
                this.options.corsOrigins!.includes(origin))
        ) {
            res.setHeader("Access-Control-Allow-Origin", origin);
        } else {
            res.setHeader("Access-Control-Allow-Origin", "*");
        }

        res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        res.setHeader(
            "Access-Control-Allow-Headers",
            "Content-Type, Authorization"
        );
        res.setHeader("Access-Control-Max-Age", "86400"); // 24 hours
    }

    /**
     * Serve static files
     *
     * @param req HTTP request
     * @param res HTTP response
     */
    private serveStaticFile(
        req: http.IncomingMessage,
        res: http.ServerResponse
    ): void {
        // Get file path
        const parsedUrl = url.parse(req.url || "");
        let pathname = parsedUrl.pathname || "";

        // Default to index.html
        if (pathname === "/") {
            pathname = "/index.html";
        }

        // Get file extension
        const ext = path.extname(pathname);

        // Map file extension to MIME type
        const mimeTypes: Record<string, string> = {
            ".html": "text/html",
            ".js": "text/javascript",
            ".css": "text/css",
            ".json": "application/json",
            ".png": "image/png",
            ".jpg": "image/jpeg",
            ".gif": "image/gif",
            ".svg": "image/svg+xml",
        };

        // Set content type
        const contentType = mimeTypes[ext] || "text/plain";

        // Read file
        const filePath = path.join(__dirname, "public", pathname);
        fs.readFile(filePath, (error, content) => {
            if (error) {
                if (error.code === "ENOENT") {
                    // File not found
                    res.writeHead(404, { "Content-Type": "text/html" });
                    res.end("<h1>404 Not Found</h1>");
                } else {
                    // Server error
                    res.writeHead(500, { "Content-Type": "text/html" });
                    res.end("<h1>500 Internal Server Error</h1>");
                }
            } else {
                // Success
                res.writeHead(200, { "Content-Type": contentType });
                res.end(content);
            }
        });
    }

    /**
     * Verify authentication token
     *
     * @param data Request data
     * @param token Auth token
     * @returns True if token is valid
     */
    private verifyAuthToken(data: any, token: string): boolean {
        // Skip auth check if no token is set
        if (!token) {
            return true;
        }

        // Check if token is provided
        if (!data.authToken) {
            return false;
        }

        // Compare tokens in constant time
        return constantTimeEqual(data.authToken, token);
    }

    // Handler implementations

    /**
     * Handle generate key request
     *
     * @param data Request data
     * @returns Generated key
     */
    private async handleGenerateKey(data: any): Promise<any> {
        const keyType = data.keyType || "ed25519";
        const options = data.options || {};

        if (keyType === "ed25519") {
            // Generate Ed25519 key pair
            const keyPair = await generateAttestationKey();
            return {
                publicKey: keyPair.publicKey,
                privateKey: keyPair.privateKey,
                type: "ed25519",
            };
        } else if (keyType === "rsa") {
            // Generate RSA key pair using Node.js crypto
            const keySize = options.bits || 2048;
            const { publicKey, privateKey } = crypto.generateKeyPairSync(
                "rsa",
                {
                    modulusLength: keySize,
                    publicKeyEncoding: {
                        type: "spki",
                        format: "pem",
                    },
                    privateKeyEncoding: {
                        type: "pkcs8",
                        format: "pem",
                    },
                }
            );

            return {
                publicKey,
                privateKey,
                type: "rsa",
                bits: keySize,
            };
        } else if (keyType.startsWith("aes-")) {
            // Generate symmetric AES key
            const keySize = parseInt(keyType.split("-")[1]) / 8; // Convert bits to bytes
            const key = SecureRandom.getRandomBytes(keySize);

            return {
                key: Buffer.from(key).toString("base64"),
                type: keyType,
            };
        } else {
            throw new Error(`Unsupported key type: ${keyType}`);
        }
    }

    /**
     * Handle hash password request
     *
     * @param data Request data
     * @returns Hashed password
     */
    private async handleHashPassword(data: any): Promise<any> {
        const password = data.password;
        const algorithm = data.algorithm || "argon2id";
        const options = data.options || {};

        if (!password) {
            throw new Error("Password is required");
        }

        if (algorithm === "argon2id") {
            // Use Argon2id for password hashing
            const hashOptions = {
                iterations: options.iterations || 3,
                memoryCost: options.memoryCost || 65536,
                parallelism: options.parallelism || 1,
                salt: options.salt,
                outputFormat: options.format || "encoded",
            };

            const result = await argon2Derive(password, {
                memoryCost: hashOptions.memoryCost,
                timeCost: hashOptions.iterations,
                parallelism: hashOptions.parallelism,
                salt: hashOptions.salt,
            });

            return result.derivedKey;
        } else if (algorithm === "pbkdf2") {
            // Use PBKDF2 for password hashing
            const iterations = options.iterations || 600000;
            const salt = options.salt
                ? Buffer.from(options.salt, "hex")
                : SecureRandom.getRandomBytes(16);
            const keyLength = options.keyLength || 32;

            const derivedKey = crypto.pbkdf2Sync(
                password,
                salt,
                iterations,
                keyLength,
                "sha512"
            );

            if (options.format === "hex") {
                return derivedKey.toString("hex");
            } else if (options.format === "base64") {
                return derivedKey.toString("base64");
            } else {
                // Return in modular format
                const saltBase64 = Buffer.from(salt).toString("base64");
                const hashBase64 = derivedKey.toString("base64");
                return `$pbkdf2-sha512$i=${iterations}$${saltBase64}$${hashBase64}`;
            }
        } else {
            throw new Error(`Unsupported hashing algorithm: ${algorithm}`);
        }
    }

    /**
     * Handle verify password request
     *
     * @param data Request data
     * @returns Verification result
     */
    private async handleVerifyPassword(data: any): Promise<any> {
        const password = data.password;
        const hashString = data.hashString;

        if (!password || !hashString) {
            throw new Error("Password and hash are required");
        }

        // Determine hash type
        if (hashString.startsWith("$argon2id$")) {
            // Verify Argon2id hash
            // This is a simplified implementation - in a real scenario,
            // we would use the argon2 library to verify the hash
            const derivedKey = await argon2Derive(password, {
                memoryCost: 65536,
                timeCost: 3,
                parallelism: 1,
            });

            return {
                isValid: constantTimeEqual(derivedKey.derivedKey, hashString),
            };
        } else if (hashString.startsWith("$pbkdf2-")) {
            // Parse the modular format
            const parts = hashString.split("$");
            if (parts.length !== 5) {
                throw new Error("Invalid PBKDF2 hash format");
            }

            // Extract parameters
            const algorithm = parts[1].split("-")[1]; // e.g., 'sha512'
            const params = parts[2];
            const saltBase64 = parts[3];
            const hashBase64 = parts[4];

            // Parse iterations
            const iterations = parseInt(params.split("=")[1]);

            // Decode salt and hash
            const salt = Buffer.from(saltBase64, "base64");
            const storedHash = Buffer.from(hashBase64, "base64");

            // Compute hash with the same parameters
            const computedHash = crypto.pbkdf2Sync(
                password,
                salt,
                iterations,
                storedHash.length,
                algorithm as crypto.BinaryToTextEncoding
            );

            // Compare hashes
            return {
                isValid: constantTimeEqual(
                    computedHash.toString("hex"),
                    storedHash.toString("hex")
                ),
            };
        } else {
            throw new Error("Unsupported hash format");
        }
    }

    /**
     * Handle encrypt request
     *
     * @param data Request data
     * @returns Encrypted data
     */
    private async handleEncrypt(data: any): Promise<any> {
        const plaintext = data.data;
        const key = data.key;
        const algorithm = data.algorithm || "aes-256-gcm";
        const options = data.options || {};

        if (!plaintext || !key) {
            throw new Error("Data and key are required");
        }

        if (algorithm.startsWith("aes-") && algorithm.endsWith("-gcm")) {
            // Extract key size from algorithm
            const keySize = parseInt(algorithm.split("-")[1]) / 8; // Convert bits to bytes

            // Validate key length
            const keyBuffer = Buffer.from(key, "base64");
            if (keyBuffer.length !== keySize) {
                throw new Error(
                    `Invalid key length. Expected ${keySize} bytes for ${algorithm}`
                );
            }

            // Generate IV
            const iv = options.iv
                ? Buffer.from(options.iv, "base64")
                : crypto.randomBytes(12);

            // Create cipher
            const cipher = crypto.createCipheriv(algorithm, keyBuffer, iv, {
                authTagLength: 16,
            });

            // Add associated data if provided
            if (options.aad) {
                cipher.setAAD(Buffer.from(options.aad, "utf8"), {
                    plaintextLength: Buffer.from(plaintext, "utf8").length,
                });
            }

            // Encrypt data
            let ciphertext = cipher.update(plaintext, "utf8", "base64");
            ciphertext += cipher.final("base64");

            // Get authentication tag
            const authTag = cipher.getAuthTag().toString("base64");

            return {
                ciphertext,
                iv: iv.toString("base64"),
                authTag,
                algorithm,
            };
        } else {
            throw new Error(`Unsupported encryption algorithm: ${algorithm}`);
        }
    }

    /**
     * Handle decrypt request
     *
     * @param data Request data
     * @returns Decrypted data
     */
    private async handleDecrypt(data: any): Promise<any> {
        const encryptedData = data.encryptedData;
        const key = data.key;
        const options = data.options || {};

        if (!encryptedData || !key) {
            throw new Error("Encrypted data and key are required");
        }

        // Extract parameters from encrypted data
        const algorithm =
            encryptedData.algorithm || options.algorithm || "aes-256-gcm";
        const ciphertext = encryptedData.ciphertext || encryptedData;
        const iv = encryptedData.iv
            ? Buffer.from(encryptedData.iv, "base64")
            : options.iv
            ? Buffer.from(options.iv, "base64")
            : null;
        const authTag = encryptedData.authTag
            ? Buffer.from(encryptedData.authTag, "base64")
            : options.authTag
            ? Buffer.from(options.authTag, "base64")
            : null;

        if (!iv) {
            throw new Error("IV is required for decryption");
        }

        if (algorithm.startsWith("aes-") && algorithm.endsWith("-gcm")) {
            // Extract key size from algorithm
            const keySize = parseInt(algorithm.split("-")[1]) / 8; // Convert bits to bytes

            // Validate key length
            const keyBuffer = Buffer.from(key, "base64");
            if (keyBuffer.length !== keySize) {
                throw new Error(
                    `Invalid key length. Expected ${keySize} bytes for ${algorithm}`
                );
            }

            // Create decipher
            const decipher = crypto.createDecipheriv(algorithm, keyBuffer, iv, {
                authTagLength: 16,
            });

            // Set authentication tag
            if (authTag) {
                decipher.setAuthTag(authTag);
            } else {
                throw new Error("Authentication tag is required for GCM mode");
            }

            // Add associated data if provided
            if (options.aad) {
                decipher.setAAD(Buffer.from(options.aad, "utf8"), {
                    plaintextLength: Buffer.from(ciphertext, "base64").length,
                });
            }

            // Decrypt data
            let plaintext = decipher.update(ciphertext, "base64", "utf8");
            plaintext += decipher.final("utf8");

            return {
                plaintext,
            };
        } else {
            throw new Error(`Unsupported encryption algorithm: ${algorithm}`);
        }
    }

    /**
     * Handle generate token request
     *
     * @param data Request data
     * @returns Generated token
     */
    private async handleGenerateToken(data: any): Promise<any> {
        const tokenType = data.tokenType || "generic";
        const options = data.options || {};
        const length = options.length || 32;

        // Generate random bytes
        const tokenBytes = SecureRandom.getRandomBytes(length);
        const token = Buffer.from(tokenBytes)
            .toString("base64")
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=/g, "");

        return {
            token,
            type: tokenType,
        };
    }

    /**
     * Handle generate API key request
     *
     * @param data Request data
     * @returns Generated API key
     */
    private async handleGenerateAPIKey(data: any): Promise<any> {
        const length = data.length || 32;

        // Generate random bytes
        const keyBytes = SecureRandom.getRandomBytes(length);
        const key = Buffer.from(keyBytes)
            .toString("base64")
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=/g, "");

        return key;
    }

    /**
     * Handle generate session token request
     *
     * @param data Request data
     * @returns Generated session token
     */
    private async handleGenerateSessionToken(data: any): Promise<any> {
        const length = data.length || 32;

        // Generate random bytes
        const tokenBytes = SecureRandom.getRandomBytes(length);
        const token = Buffer.from(tokenBytes).toString("hex");

        return token;
    }

    /**
     * Handle derive key memory hard request
     *
     * @param data Request data
     * @returns Derived key
     */
    private async handleDeriveKeyMemoryHard(data: any): Promise<any> {
        const password = data.password;
        const options = data.options || {};

        if (!password) {
            throw new Error("Password is required");
        }

        // Derive key using memory-hard function
        return argon2Derive(password, options);
    }

    /**
     * Handle derive key balloon request
     *
     * @param data Request data
     * @returns Derived key
     */
    private async handleDeriveKeyBalloon(data: any): Promise<any> {
        const password = data.password;
        const options = data.options || {};

        if (!password) {
            throw new Error("Password is required");
        }

        // Derive key using balloon hashing
        return balloonDerive(password, options);
    }

    /**
     * Handle generate attestation key request
     *
     * @param data Request data
     * @returns Generated attestation key
     */
    private async handleGenerateAttestationKey(): Promise<any> {
        // Generate attestation key
        return generateAttestationKey();
    }

    /**
     * Handle create attestation request
     *
     * @param data Request data
     * @returns Created attestation
     */
    private async handleCreateAttestation(data: any): Promise<any> {
        const payload = data.payload;
        const privateKey = data.privateKey;

        if (!payload || !privateKey) {
            throw new Error("Payload and private key are required");
        }

        // Create attestation
        return createAttestation(payload, privateKey);
    }

    /**
     * Handle verify attestation request
     *
     * @param data Request data
     * @returns Verification result
     */
    private async handleVerifyAttestation(data: any): Promise<any> {
        const attestation = data.attestation;
        const publicKey = data.publicKey;

        if (!attestation || !publicKey) {
            throw new Error("Attestation and public key are required");
        }

        // Verify attestation
        const isValid = verifyAttestation(attestation, publicKey);

        return {
            isValid,
        };
    }

    /**
     * Handle create canary token request
     *
     * @param data Request data
     * @returns Created canary token
     */
    private async handleCreateCanaryToken(data: any): Promise<any> {
        const options = data.options || {};

        // Create canary token
        return createCanary(options);
    }

    /**
     * Handle get server info request
     *
     * @returns Server information
     */
    private async handleGetServerInfo(): Promise<any> {
        return {
            version: "1.0.0",
            uptime: process.uptime(),
            nodeVersion: process.version,
            platform: process.platform,
            memoryUsage: process.memoryUsage(),
            endpoints: Array.from(this.handlers.keys()),
        };
    }

    /**
     * Handle shutdown request
     *
     * @returns Shutdown result
     */
    private async handleShutdown(): Promise<any> {
        console.log("Shutdown requested. Stopping server...");

        // Schedule shutdown after response is sent
        setTimeout(() => {
            this.stop()
                .then(() => {
                    process.exit(0);
                })
                .catch((error) => {
                    console.error("Error stopping server:", error);
                    process.exit(1);
                });
        }, 1000);

        return {
            message: "Server is shutting down",
        };
    }
}

// Export server
export default FortifyJSServer;
