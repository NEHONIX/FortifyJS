import { NehoID } from "nehoid";
import { HashAlgorithm, HashOutputFormat } from "../types/string";
import { SecureBuffer } from "./secure-memory";
import { SecureString } from "./secureString";

/**
 * Types that can be stored securely
 */
export type SecureValue =
    | string
    | number
    | boolean
    | Uint8Array
    | SecureString
    | SecureObject<any>
    | null
    | undefined;

/**
 * Serialization options for SecureObject
 */
export interface SerializationOptions {
    includeMetadata?: boolean;
    encryptSensitive?: boolean;
    format?: "json" | "binary";
}

/**
 * Metadata for tracking secure values
 */
export interface ValueMetadata {
    type: string;
    isSecure: boolean;
    created: Date;
    lastAccessed: Date;
    accessCount: number;
}

/**
 * Event types for SecureObject
 */
export type SecureObjectEvent = "set" | "get" | "delete" | "clear" | "destroy";

/**
 * Event listener callback
 */
export type EventListener = (
    event: SecureObjectEvent,
    key?: string,
    value?: any
) => void;

/**
 * A secure object that can store sensitive data and be explicitly cleared
 */
export class SecureObject<T extends Record<string, SecureValue>> {
    private data: Map<string, any> = new Map();
    private secureBuffers: Map<string, SecureBuffer> = new Map();
    private metadata: Map<string, ValueMetadata> = new Map();
    private eventListeners: Map<SecureObjectEvent, Set<EventListener>> =
        new Map();
    private _isDestroyed: boolean = false;
    private _isReadOnly: boolean = false;
    private readonly _id: string;
    private sensitiveKeys: Set<string> = new Set([
        // Default sensitive keys that are commonly used
        "password",
        "passwd",
        "pwd",
        "secret",
        "token",
        "key",
        "apikey",
        "api_key",
        "accesstoken",
        "access_token",
        "refreshtoken",
        "refresh_token",
        "sessionid",
        "session_id",
        "auth",
        "authorization",
        "bearer",
        "credential",
        "credentials",
        "pin",
        "ssn",
        "social_security",
        "credit_card",
        "creditcard",
        "cvv",
        "cvc",
        "private_key",
        "privatekey",
        "signature",
        "hash",
        "salt",
        "nonce",
        "otp",
        "passcode",
        "passphrase",
        "masterkey",
        "master_key",
        "encryption_key",
        "decryption_key",
        "jwt",
        "cookie",
        "session",
        "csrf",
        "xsrf",
    ]);
    private encryptionKey: string | null = null;

    /**
     * Creates a new secure object
     *
     * @param initialData - Initial data
     * @param options - Configuration options
     */
    constructor(initialData?: Partial<T>, options?: { readOnly?: boolean }) {
        this._id = this.generateId();
        this._isReadOnly = false; // Start as writable

        if (initialData) {
            this.setAll(initialData);
        }

        // Set read-only status after initial data is set
        this._isReadOnly = options?.readOnly ?? false;
    }

    /**
     * Creates a SecureObject from another SecureObject (deep copy)
     *
     * @param other - Another SecureObject to copy from
     * @returns New SecureObject instance
     */
    public static from<T extends Record<string, SecureValue>>(
        other: SecureObject<T>
    ): SecureObject<T> {
        other.ensureNotDestroyed();
        const copy = new SecureObject<T>();

        for (const key of other.keys()) {
            const value = other.get(key);
            copy.set(key, value);
        }

        return copy;
    }

    /**
     * Creates a read-only SecureObject
     *
     * @param data - Initial data
     * @returns Read-only SecureObject instance
     */
    public static readOnly<T extends Record<string, SecureValue>>(
        data: Partial<T>
    ): SecureObject<T> {
        return new SecureObject(data, { readOnly: true });
    }

    /**
     * Generates a unique ID for this instance
     */
    private generateId(): string {
        return NehoID.generate({ prefix: "sobj", size: 16 });
    }

    /**
     * Ensures the SecureObject hasn't been destroyed
     */
    private ensureNotDestroyed(): void {
        if (this._isDestroyed) {
            throw new Error(
                "SecureObject has been destroyed and cannot be used"
            );
        }
    }

    /**
     * Ensures the SecureObject is not read-only for write operations
     */
    private ensureNotReadOnly(): void {
        if (this._isReadOnly) {
            throw new Error("SecureObject is read-only");
        }
    }

    /**
     * Emits an event to all registered listeners
     */
    private emit(event: SecureObjectEvent, key?: string, value?: any): void {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            for (const listener of listeners) {
                try {
                    listener(event, key, value);
                } catch (error) {
                    console.error(
                        `Error in SecureObject event listener:`,
                        error
                    );
                }
            }
        }
    }

    /**
     * Updates metadata for a key
     */
    private updateMetadata(
        key: string,
        type: string,
        isSecure: boolean,
        isAccess: boolean = false
    ): void {
        const existing = this.metadata.get(key);
        const now = new Date();

        if (existing && isAccess) {
            existing.lastAccessed = now;
            existing.accessCount++;
        } else {
            this.metadata.set(key, {
                type,
                isSecure,
                created: existing?.created ?? now,
                lastAccessed: now,
                accessCount: (existing?.accessCount ?? 0) + 1,
            });
        }
    }

    /**
     * Gets the unique ID of this SecureObject
     */
    public get id(): string {
        return this._id;
    }

    /**
     * Checks if the SecureObject is read-only
     */
    public get isReadOnly(): boolean {
        return this._isReadOnly;
    }

    /**
     * Adds keys to the sensitive keys list
     * These keys will be encrypted/masked when encryptSensitive option is used
     *
     * @param keys - Keys to mark as sensitive
     */
    public addSensitiveKeys(...keys: string[]): this {
        this.ensureNotDestroyed();
        keys.forEach((key) => this.sensitiveKeys.add(key));
        return this;
    }

    /**
     * Removes keys from the sensitive keys list
     *
     * @param keys - Keys to remove from sensitive list
     */
    public removeSensitiveKeys(...keys: string[]): this {
        this.ensureNotDestroyed();
        keys.forEach((key) => this.sensitiveKeys.delete(key));
        return this;
    }

    /**
     * Sets the complete list of sensitive keys (replaces existing list)
     *
     * @param keys - Complete list of sensitive keys
     */
    public setSensitiveKeys(keys: string[]): this {
        this.ensureNotDestroyed();
        this.sensitiveKeys.clear();
        keys.forEach((key) => this.sensitiveKeys.add(key));
        return this;
    }

    /**
     * Gets the current list of sensitive keys
     *
     * @returns Array of sensitive keys
     */
    public getSensitiveKeys(): string[] {
        this.ensureNotDestroyed();
        return Array.from(this.sensitiveKeys);
    }

    /**
     * Checks if a key is marked as sensitive
     *
     * @param key - Key to check
     * @returns True if the key is sensitive
     */
    public isSensitiveKey(key: string): boolean {
        return this.sensitiveKeys.has(key);
    }

    /**
     * Clears all sensitive keys
     */
    public clearSensitiveKeys(): this {
        this.ensureNotDestroyed();
        this.sensitiveKeys.clear();
        return this;
    }

    /**
     * Gets the default sensitive keys that are automatically initialized
     *
     * @returns Array of default sensitive keys
     */
    public static get getDefaultSensitiveKeys(): string[] {
        return [
            "password",
            "passwd",
            "pwd",
            "secret",
            "token",
            "key",
            "apikey",
            "api_key",
            "accesstoken",
            "access_token",
            "refreshtoken",
            "refresh_token",
            "sessionid",
            "session_id",
            "auth",
            "authorization",
            "bearer",
            "credential",
            "credentials",
            "pin",
            "ssn",
            "social_security",
            "credit_card",
            "creditcard",
            "cvv",
            "cvc",
            "private_key",
            "privatekey",
            "signature",
            "hash",
            "salt",
            "nonce",
            "otp",
            "passcode",
            "passphrase",
            "masterkey",
            "master_key",
            "encryption_key",
            "decryption_key",
            "jwt",
            "cookie",
            "session",
            "csrf",
            "xsrf",
        ];
    }

    /**
     * Resets sensitive keys to default values
     */
    public resetToDefaultSensitiveKeys(): this {
        this.ensureNotDestroyed();
        this.sensitiveKeys.clear();
        SecureObject.getDefaultSensitiveKeys.forEach((key) =>
            this.sensitiveKeys.add(key)
        );
        return this;
    }

    /**
     * Sets the encryption key for sensitive data encryption
     *
     * @param key - Encryption key (if null, uses object ID as key)
     */
    public setEncryptionKey(key: string | null = null): this {
        this.ensureNotDestroyed();
        this.encryptionKey = key || this._id;
        return this;
    }

    /**
     * Gets the current encryption key
     *
     * @returns Current encryption key or null if not set
     */
    public get getEncryptionKey(): string | null {
        return this.encryptionKey;
    }

    /**
     * Encrypts a value using the encryption key
     *
     * @param value - Value to encrypt
     * @returns Encrypted value with prefix
     */
    private encryptValue(value: any): string {
        const key = this.encryptionKey || this._id;
        const valueStr =
            typeof value === "string" ? value : JSON.stringify(value);

        // Simple XOR encryption (for demo - in production use proper encryption)
        let encrypted = "";
        for (let i = 0; i < valueStr.length; i++) {
            const charCode =
                valueStr.charCodeAt(i) ^ key.charCodeAt(i % key.length);
            encrypted += String.fromCharCode(charCode);
        }

        // Encode to base64 and add prefix to identify encrypted data
        const base64 = btoa(encrypted);
        return `[ENCRYPTED:${base64}]`;
    }

    /**
     * Decrypts a value using the encryption key
     *
     * @param encryptedValue - Encrypted value with prefix
     * @returns Decrypted value
     */
    public decryptValue(encryptedValue: string): any {
        this.ensureNotDestroyed();

        if (
            !encryptedValue.startsWith("[ENCRYPTED:") ||
            !encryptedValue.endsWith("]")
        ) {
            throw new Error("Invalid encrypted value format");
        }

        const key = this.encryptionKey || this._id;
        const base64 = encryptedValue.slice(11, -1); // Remove [ENCRYPTED: and ]
        const encrypted = atob(base64);

        // XOR decryption
        let decrypted = "";
        for (let i = 0; i < encrypted.length; i++) {
            const charCode =
                encrypted.charCodeAt(i) ^ key.charCodeAt(i % key.length);
            decrypted += String.fromCharCode(charCode);
        }

        // Try to parse as JSON, if it fails return as string
        try {
            return JSON.parse(decrypted);
        } catch {
            return decrypted;
        }
    }

    /**
     * Decrypts all encrypted values in an object
     *
     * @param obj - Object that may contain encrypted values
     * @returns Object with decrypted values
     */
    public decryptObject(obj: any): any {
        this.ensureNotDestroyed();

        if (typeof obj === "string" && obj.startsWith("[ENCRYPTED:")) {
            return this.decryptValue(obj);
        } else if (Array.isArray(obj)) {
            return obj.map((item) => this.decryptObject(item));
        } else if (typeof obj === "object" && obj !== null) {
            const result: any = {};
            for (const [key, value] of Object.entries(obj)) {
                result[key] = this.decryptObject(value);
            }
            return result;
        }

        return obj;
    }

    /**
     * Recursively processes nested objects to check for sensitive keys
     *
     * @param obj - The nested object to process
     * @param options - Serialization options
     * @returns Processed object with sensitive data masked if needed
     */
    private processNestedObject(obj: any, options: SerializationOptions): any {
        if (Array.isArray(obj)) {
            // Handle arrays
            return obj.map((item) =>
                typeof item === "object" && item !== null
                    ? this.processNestedObject(item, options)
                    : item
            );
        } else if (typeof obj === "object" && obj !== null) {
            // Handle objects
            const result: any = {};
            for (const [key, value] of Object.entries(obj)) {
                if (options.encryptSensitive && this.sensitiveKeys.has(key)) {
                    // Encrypt sensitive keys in nested objects
                    result[key] = this.encryptValue(value);
                } else if (typeof value === "object" && value !== null) {
                    // Recursively process nested objects/arrays
                    result[key] = this.processNestedObject(value, options);
                } else {
                    result[key] = value;
                }
            }
            return result;
        }
        return obj;
    }

    /**
     * Checks if the SecureObject has been destroyed
     */
    public get isDestroyed(): boolean {
        return this._isDestroyed;
    }

    /**
     * Gets the number of stored values
     */
    public get size(): number {
        this.ensureNotDestroyed();
        return this.data.size;
    }

    /**
     * Checks if the object is empty
     */
    public get isEmpty(): boolean {
        this.ensureNotDestroyed();
        return this.data.size === 0;
    }

    /**
     * Adds an event listener
     *
     * @param event - Event type to listen for
     * @param listener - Callback function
     */
    public addEventListener(
        event: SecureObjectEvent,
        listener: EventListener
    ): void {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, new Set());
        }
        this.eventListeners.get(event)!.add(listener);
    }

    /**
     * Removes an event listener
     *
     * @param event - Event type
     * @param listener - Callback function to remove
     */
    public removeEventListener(
        event: SecureObjectEvent,
        listener: EventListener
    ): void {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            listeners.delete(listener);
        }
    }

    /**
     * Sets a value
     *
     * @param key - Key
     * @param value - Value
     * @throws Error if destroyed or read-only
     */
    public set<K extends keyof T>(key: K, value: T[K]): this {
        this.ensureNotDestroyed();
        this.ensureNotReadOnly();

        const stringKey = String(key);

        // Clean up any existing secure buffer for this key
        this.cleanupKey(stringKey);

        // Handle different types of values
        if (value instanceof Uint8Array) {
            // Store Uint8Array in a secure buffer
            const secureBuffer = SecureBuffer.from(value);
            this.secureBuffers.set(stringKey, secureBuffer);
            this.data.set(stringKey, secureBuffer);
            this.updateMetadata(stringKey, "Uint8Array", true);
        } else if (typeof value === "string") {
            // Store strings in secure buffers
            const secureBuffer = SecureBuffer.from(value);
            this.secureBuffers.set(stringKey, secureBuffer);
            this.data.set(stringKey, secureBuffer);
            this.updateMetadata(stringKey, "string", true);
        } else if (value instanceof SecureString) {
            // Store SecureString reference
            this.data.set(stringKey, value);
            this.updateMetadata(stringKey, "SecureString", true);
        } else if (value instanceof SecureObject) {
            // Store SecureObject reference
            this.data.set(stringKey, value);
            this.updateMetadata(stringKey, "SecureObject", true);
        } else {
            // Store other values directly (numbers, booleans, null, undefined)
            this.data.set(stringKey, value);
            this.updateMetadata(stringKey, typeof value, false);
        }

        this.emit("set", stringKey, value);
        return this;
    }

    /**
     * Sets multiple values at once
     *
     * @param values - Values to set
     * @throws Error if destroyed or read-only
     */
    public setAll(values: Partial<T>): this {
        this.ensureNotDestroyed();
        this.ensureNotReadOnly();

        for (const key in values) {
            if (Object.prototype.hasOwnProperty.call(values, key)) {
                this.set(key as keyof T, values[key] as T[keyof T]);
            }
        }
        return this;
    }

    /**
     * Gets a value
     *
     * @param key - Key
     * @returns The value
     * @throws Error if destroyed
     */
    public get<K extends keyof T>(key: K): T[K] {
        this.ensureNotDestroyed();

        const stringKey = String(key);
        const value = this.data.get(stringKey);

        // Update access metadata
        if (this.metadata.has(stringKey)) {
            this.updateMetadata(
                stringKey,
                this.metadata.get(stringKey)!.type,
                this.metadata.get(stringKey)!.isSecure,
                true
            );
        }

        if (value instanceof SecureBuffer) {
            // Convert SecureBuffer back to original type based on metadata
            const buffer = value.getBuffer();
            const metadata = this.metadata.get(stringKey);

            if (metadata?.type === "Uint8Array") {
                // Return as Uint8Array for binary data
                const result = new Uint8Array(buffer) as unknown as T[K];
                this.emit("get", stringKey, result);
                return result;
            } else {
                // Return as string for text data
                const result = new TextDecoder().decode(
                    buffer
                ) as unknown as T[K];
                this.emit("get", stringKey, result);
                return result;
            }
        }

        this.emit("get", stringKey, value);
        return value as T[K];
    }

    /**
     * Gets a value safely, returning undefined if key doesn't exist
     *
     * @param key - Key
     * @returns The value or undefined
     */
    public getSafe<K extends keyof T>(key: K): T[K] | undefined {
        try {
            return this.has(key) ? this.get(key) : undefined;
        } catch {
            return undefined;
        }
    }

    /**
     * Gets a value with a default fallback
     *
     * @param key - Key
     * @param defaultValue - Default value if key doesn't exist
     * @returns The value or default
     */
    public getWithDefault<K extends keyof T>(key: K, defaultValue: T[K]): T[K] {
        return this.has(key) ? this.get(key) : defaultValue;
    }

    /**
     * Checks if a key exists
     *
     * @param key - Key
     * @returns True if the key exists, false otherwise
     * @throws Error if destroyed
     */
    public has<K extends keyof T>(key: K): boolean {
        this.ensureNotDestroyed();
        return this.data.has(String(key));
    }

    /**
     * Deletes a key
     *
     * @param key - Key
     * @returns True if the key was deleted, false otherwise
     * @throws Error if destroyed or read-only
     */
    public delete<K extends keyof T>(key: K): boolean {
        this.ensureNotDestroyed();
        this.ensureNotReadOnly();

        const stringKey = String(key);

        if (!this.data.has(stringKey)) {
            return false;
        }

        // Clean up any secure buffer
        this.cleanupKey(stringKey);

        const deleted = this.data.delete(stringKey);
        this.metadata.delete(stringKey);

        this.emit("delete", stringKey);
        return deleted;
    }

    /**
     * Cleans up resources associated with a key
     */
    private cleanupKey(key: string): void {
        if (this.secureBuffers.has(key)) {
            this.secureBuffers.get(key)?.destroy();
            this.secureBuffers.delete(key);
        }

        // If the value is a SecureString or SecureObject, we don't destroy it
        // as it might be used elsewhere
    }

    /**
     * Clears all data
     *
     * @throws Error if destroyed or read-only
     */
    public clear(): void {
        this.ensureNotDestroyed();
        this.ensureNotReadOnly();

        // Destroy all secure buffers
        for (const buffer of this.secureBuffers.values()) {
            buffer.destroy();
        }

        this.secureBuffers.clear();
        this.data.clear();
        this.metadata.clear();

        this.emit("clear");
    }

    /**
     * Gets all keys
     *
     * @returns Array of keys
     * @throws Error if destroyed
     */
    public keys(): Array<keyof T> {
        this.ensureNotDestroyed();
        return Array.from(this.data.keys()) as Array<keyof T>;
    }

    /**
     * Gets all values
     *
     * @returns Array of values
     * @throws Error if destroyed
     */
    public values(): Array<T[keyof T]> {
        this.ensureNotDestroyed();
        return this.keys().map((key) => this.get(key));
    }

    /**
     * Gets all entries as [key, value] pairs
     *
     * @returns Array of [key, value] pairs
     * @throws Error if destroyed
     */
    public entries(): Array<[keyof T, T[keyof T]]> {
        this.ensureNotDestroyed();
        return this.keys().map(
            (key) => [key, this.get(key)] as [keyof T, T[keyof T]]
        );
    }

    /**
     * Iterates over each key-value pair
     *
     * @param callback - Function to call for each entry
     * @throws Error if destroyed
     */
    public forEach(
        callback: (value: T[keyof T], key: keyof T, obj: this) => void
    ): void {
        this.ensureNotDestroyed();
        for (const key of this.keys()) {
            callback(this.get(key), key, this);
        }
    }

    /**
     * Maps over values and returns a new array
     *
     * @param callback - Mapping function
     * @returns Array of mapped values
     * @throws Error if destroyed
     */
    public map<U>(
        callback: (value: T[keyof T], key: keyof T, obj: this) => U
    ): U[] {
        this.ensureNotDestroyed();
        return this.keys().map((key) => callback(this.get(key), key, this));
    }

    /**
     * Filters entries based on a predicate
     *
     * @param predicate - Filtering function
     * @returns New SecureObject with filtered entries
     * @throws Error if destroyed
     */
    public filter(
        predicate: (value: T[keyof T], key: keyof T, obj: this) => boolean
    ): SecureObject<Partial<T>> {
        this.ensureNotDestroyed();
        const filtered = new SecureObject<Partial<T>>();

        for (const key of this.keys()) {
            const value = this.get(key);
            if (predicate(value, key, this)) {
                filtered.set(key, value);
            }
        }

        return filtered;
    }

    /**
     * Gets metadata for a specific key
     *
     * @param key - Key to get metadata for
     * @returns Metadata object or undefined
     */
    public getMetadata<K extends keyof T>(key: K): ValueMetadata | undefined {
        this.ensureNotDestroyed();
        return this.metadata.get(String(key));
    }

    /**
     * Gets metadata for all keys
     *
     * @returns Map of key to metadata
     */
    public getAllMetadata(): Map<string, ValueMetadata> {
        this.ensureNotDestroyed();
        return new Map(this.metadata);
    }

    /**
     * Creates a hash of the entire object content
     *
     * @param algorithm - Hashing algorithm
     * @param format - Output format
     * @returns Promise resolving to hash
     */
    public async hash(
        algorithm: HashAlgorithm = "SHA-256",
        format: HashOutputFormat = "hex"
    ): Promise<string | Uint8Array> {
        this.ensureNotDestroyed();

        // Create a deterministic representation of the object
        const sortedEntries = this.entries().sort(([a], [b]) =>
            String(a).localeCompare(String(b))
        );
        const serialized = JSON.stringify(
            sortedEntries.map(([key, value]) => [
                String(key),
                typeof value === "object" && value instanceof Uint8Array
                    ? Array.from(value)
                    : value,
            ])
        );

        const secureString = new SecureString(serialized);
        try {
            return await secureString.hash(algorithm, format);
        } finally {
            secureString.destroy();
        }
    }

    /**
     * Gets the full object as a regular JavaScript object
     * Convenient alias for toObject() method
     *
     * @param options - Serialization options
     * @returns Regular object with all data
     * @throws Error if destroyed
     */
    public getAll(
        options: SerializationOptions = {}
    ): T & { _metadata?: Record<string, ValueMetadata> } {
        return this.toObject(options);
    }

    /**
     * Converts to a regular object
     * Warning: This creates regular JavaScript objects that won't be automatically cleared
     *
     * @param options - Serialization options
     * @returns Regular object
     * @throws Error if destroyed
     */
    public toObject(
        options: SerializationOptions = {}
    ): T & { _metadata?: Record<string, ValueMetadata> } {
        this.ensureNotDestroyed();

        const result = {} as T & { _metadata?: Record<string, ValueMetadata> };

        for (const [key, value] of this.data.entries()) {
            const metadata = this.metadata.get(key);

            // Check if this key is marked as sensitive by the user
            const isUserDefinedSensitive = this.sensitiveKeys.has(key);

            // Check if we should encrypt/mask sensitive data
            if (options.encryptSensitive && isUserDefinedSensitive) {
                // Encrypt user-defined sensitive data
                let valueToEncrypt: any;
                if (value instanceof SecureBuffer) {
                    const buffer = value.getBuffer();
                    if (metadata?.type === "Uint8Array") {
                        valueToEncrypt = Array.from(new Uint8Array(buffer));
                    } else {
                        valueToEncrypt = new TextDecoder().decode(buffer);
                    }
                } else if (value instanceof SecureString) {
                    valueToEncrypt = value.toString();
                } else {
                    valueToEncrypt = value;
                }
                (result as any)[key] = this.encryptValue(valueToEncrypt);
            } else {
                // Normal processing - show actual values
                if (value instanceof SecureBuffer) {
                    const buffer = value.getBuffer();

                    if (metadata?.type === "Uint8Array") {
                        // Return as Uint8Array for binary data
                        (result as any)[key] = new Uint8Array(buffer);
                    } else {
                        // Return as string for text data
                        (result as any)[key] = new TextDecoder().decode(buffer);
                    }
                } else if (value instanceof SecureString) {
                    (result as any)[key] = value.toString();
                } else if (value instanceof SecureObject) {
                    // For nested objects, recursively process with the same options
                    (result as any)[key] = value.toObject(options);
                } else if (typeof value === "object" && value !== null) {
                    // For regular nested objects, recursively check for sensitive keys
                    (result as any)[key] = this.processNestedObject(
                        value,
                        options
                    );
                } else {
                    (result as any)[key] = value;
                }
            }
        }

        if (options.includeMetadata) {
            result._metadata = Object.fromEntries(this.metadata.entries());
        }

        // Handle format option
        if (options.format === "binary") {
            // Convert to binary format (Uint8Array)
            const jsonString = JSON.stringify(result);
            return new TextEncoder().encode(jsonString) as any;
        } else if (options.format === "json") {
            // Return as JSON string
            return JSON.stringify(result) as any;
        }

        // Default: return as regular object
        return result;
    }

    /**
     * Converts to JSON string
     *
     * @param options - Serialization options
     * @returns JSON string representation
     */
    public toJSON(options: SerializationOptions = {}): string {
        return JSON.stringify(this.toObject(options));
    }

    /**
     * Executes a function with the object data and optionally clears it afterward
     *
     * @param fn - Function to execute with the object
     * @param autoClear - Whether to clear the object after execution
     * @returns Result of the function
     */
    public use<U>(fn: (obj: this) => U, autoClear: boolean = false): U {
        this.ensureNotDestroyed();
        try {
            return fn(this);
        } finally {
            if (autoClear) {
                this.destroy();
            }
        }
    }

    /**
     * Creates a shallow copy of the SecureObject
     *
     * @returns New SecureObject with copied values
     */
    public clone(): SecureObject<T> {
        this.ensureNotDestroyed();
        return SecureObject.from(this);
    }

    /**
     * Merges another object into this one
     *
     * @param other - Object to merge
     * @param overwrite - Whether to overwrite existing keys
     * @returns This SecureObject for chaining
     */
    public merge(
        other: Partial<T> | SecureObject<Partial<T>>,
        overwrite: boolean = true
    ): this {
        this.ensureNotDestroyed();
        this.ensureNotReadOnly();

        if (other instanceof SecureObject) {
            for (const key of other.keys()) {
                if (overwrite || !this.has(key as keyof T)) {
                    this.set(key as keyof T, other.get(key) as T[keyof T]);
                }
            }
        } else {
            for (const key in other) {
                if (Object.prototype.hasOwnProperty.call(other, key)) {
                    if (overwrite || !this.has(key as keyof T)) {
                        this.set(key as keyof T, other[key] as T[keyof T]);
                    }
                }
            }
        }

        return this;
    }

    /**
     * Destroys the SecureObject and clears all data
     */
    public destroy(): void {
        if (!this._isDestroyed) {
            this.clear();
            this.eventListeners.clear();
            this._isDestroyed = true;
            this.emit("destroy");
        }
    }

    /**
     * Custom inspection for debugging (masks sensitive data)
     */
    public [Symbol.for("nodejs.util.inspect.custom")](): string {
        if (this._isDestroyed) {
            return "SecureObject [DESTROYED]";
        }

        const secureCount = Array.from(this.metadata.values()).filter(
            (meta) => meta.isSecure
        ).length;

        return `SecureObject [${this.size} items, ${secureCount} secure] ${
            this._isReadOnly ? "[READ-ONLY]" : ""
        }`;
    }
}
