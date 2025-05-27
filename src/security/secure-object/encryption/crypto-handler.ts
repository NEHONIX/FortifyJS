/**
 * Cryptographic Handler Module
 * Handles encryption and decryption of sensitive data
 */

import { SerializationOptions } from "../types";

/**
 * Handles encryption and decryption operations for SecureObject
 */
export class CryptoHandler {
    private encryptionKey: string | null = null;

    constructor(private objectId: string) {}

    /**
     * Sets the encryption key for sensitive data encryption
     */
    setEncryptionKey(key: string | null = null): this {
        this.encryptionKey = key || this.objectId;
        return this;
    }

    /**
     * Gets the current encryption key
     */
    getEncryptionKey(): string | null {
        return this.encryptionKey;
    }

    /**
     * Encrypts a value using the encryption key
     * Note: This is a simple XOR encryption for demo purposes
     * In production, use proper encryption algorithms
     */
    encryptValue(value: any): string {
        const key = this.encryptionKey || this.objectId;
        const valueStr = typeof value === "string" ? value : JSON.stringify(value);

        // Simple XOR encryption (for demo - in production use proper encryption)
        let encrypted = "";
        for (let i = 0; i < valueStr.length; i++) {
            const charCode = valueStr.charCodeAt(i) ^ key.charCodeAt(i % key.length);
            encrypted += String.fromCharCode(charCode);
        }

        // Encode to base64 and add prefix to identify encrypted data
        const base64 = btoa(encrypted);
        return `[ENCRYPTED:${base64}]`;
    }

    /**
     * Decrypts a value using the encryption key
     */
    decryptValue(encryptedValue: string): any {
        if (!encryptedValue.startsWith("[ENCRYPTED:") || !encryptedValue.endsWith("]")) {
            throw new Error("Invalid encrypted value format");
        }

        const key = this.encryptionKey || this.objectId;
        const base64 = encryptedValue.slice(11, -1); // Remove [ENCRYPTED: and ]
        const encrypted = atob(base64);

        // XOR decryption
        let decrypted = "";
        for (let i = 0; i < encrypted.length; i++) {
            const charCode = encrypted.charCodeAt(i) ^ key.charCodeAt(i % key.length);
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
     * Decrypts all encrypted values in an object recursively
     */
    decryptObject(obj: any): any {
        if (typeof obj === "string" && obj.startsWith("[ENCRYPTED:")) {
            return this.decryptValue(obj);
        } else if (Array.isArray(obj)) {
            return obj.map(item => this.decryptObject(item));
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
     */
    processNestedObject(
        obj: any, 
        options: SerializationOptions,
        sensitiveKeys: Set<string>
    ): any {
        if (Array.isArray(obj)) {
            // Handle arrays
            return obj.map(item =>
                typeof item === "object" && item !== null
                    ? this.processNestedObject(item, options, sensitiveKeys)
                    : item
            );
        } else if (typeof obj === "object" && obj !== null) {
            // Handle objects
            const result: any = {};
            for (const [key, value] of Object.entries(obj)) {
                if (options.encryptSensitive && sensitiveKeys.has(key)) {
                    // Encrypt sensitive keys in nested objects
                    result[key] = this.encryptValue(value);
                } else if (typeof value === "object" && value !== null) {
                    // Recursively process nested objects/arrays
                    result[key] = this.processNestedObject(value, options, sensitiveKeys);
                } else {
                    result[key] = value;
                }
            }
            return result;
        }
        return obj;
    }

    /**
     * Checks if a value is encrypted
     */
    isEncrypted(value: any): boolean {
        return typeof value === "string" && 
               value.startsWith("[ENCRYPTED:") && 
               value.endsWith("]");
    }
}
 