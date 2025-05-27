/**
 * Sensitive Keys Management Module
 * Handles the management of sensitive keys for encryption/masking
 */

/**
 * Default sensitive keys that are commonly used in applications
 */
export const DEFAULT_SENSITIVE_KEYS = [
    // Authentication & Authorization
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
    
    // Personal Information
    "pin",
    "ssn",
    "social_security",
    "credit_card",
    "creditcard",
    "cvv",
    "cvc",
    
    // Cryptographic Keys
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
    
    // Web Security
    "jwt",
    "cookie",
    "session",
    "csrf",
    "xsrf",
] as const;

/**
 * Manages sensitive keys for a SecureObject instance
 */
export class SensitiveKeysManager {
    private sensitiveKeys: Set<string>;

    constructor(initialKeys?: string[]) {
        this.sensitiveKeys = new Set(initialKeys || DEFAULT_SENSITIVE_KEYS);
    }

    /**
     * Adds keys to the sensitive keys list
     */
    add(...keys: string[]): this {
        keys.forEach(key => this.sensitiveKeys.add(key));
        return this;
    }

    /**
     * Removes keys from the sensitive keys list
     */
    remove(...keys: string[]): this {
        keys.forEach(key => this.sensitiveKeys.delete(key));
        return this;
    }

    /**
     * Sets the complete list of sensitive keys (replaces existing)
     */
    set(keys: string[]): this {
        this.sensitiveKeys.clear();
        keys.forEach(key => this.sensitiveKeys.add(key));
        return this;
    }

    /**
     * Gets the current list of sensitive keys
     */
    getAll(): string[] {
        return Array.from(this.sensitiveKeys);
    }

    /**
     * Checks if a key is marked as sensitive
     */
    isSensitive(key: string): boolean {
        return this.sensitiveKeys.has(key);
    }

    /**
     * Clears all sensitive keys
     */
    clear(): this {
        this.sensitiveKeys.clear();
        return this;
    }

    /**
     * Resets to default sensitive keys
     */
    resetToDefault(): this {
        this.sensitiveKeys.clear();
        DEFAULT_SENSITIVE_KEYS.forEach(key => this.sensitiveKeys.add(key));
        return this;
    }

    /**
     * Gets the default sensitive keys
     */
    static getDefaultKeys(): string[] {
        return [...DEFAULT_SENSITIVE_KEYS];
    }
}
 