/* ---------------------------------------------------------------------------------------------
 *  Copyright (c) NEHONIX INC. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 * -------------------------------------------------------------------------------------------
 */

import { ALGORITHM_REGISTRY } from "../algorithms/registry";
import type {
    AlgorithmInfo,
    CryptoAlgorithm,
    HMACAlgorithm,
    HMACOptions,
    HashAlgorithm,
    HashOutputFormat,
    PBKDF2Options,
} from "../types/string";
import { CryptoAlgorithmUtils } from "../utils/CryptoAlgorithmUtils";
import { SecureBuffer } from "./secure-memory";
import crypto from "crypto";

/**
 * Creates a secure string that can be explicitly cleared from memory
 * Regular JavaScript strings are immutable and may persist in memory
 */
export class SecureString {
    private buffer: SecureBuffer;
    private _isDestroyed: boolean = false;

    /**
     * Creates a new secure string
     *
     * @param value - Initial string value
     */
    constructor(value: string = "") {
        this.buffer = SecureBuffer.from(value);
    }

    /**
     * Creates a SecureString from another SecureString (copy constructor)
     *
     * @param other - Another SecureString to copy from
     * @returns New SecureString instance
     */
    public static from(other: SecureString): SecureString {
        other.ensureNotDestroyed();
        return new SecureString(other.toString());
    }

    /**
     * Creates a SecureString from a buffer
     *
     * @param buffer - Buffer containing string data
     * @param encoding - Text encoding (default: 'utf-8')
     * @returns New SecureString instance
     */
    public static fromBuffer(
        buffer: Uint8Array,
        encoding: string = "utf-8"
    ): SecureString {
        const decoder = new TextDecoder(encoding);
        const value = decoder.decode(buffer);
        return new SecureString(value);
    }

    /**
     * Ensures the SecureString hasn't been destroyed
     * @throws Error if the SecureString has been destroyed
     */
    private ensureNotDestroyed(): void {
        if (this._isDestroyed) {
            throw new Error(
                "SecureString has been destroyed and cannot be used"
            );
        }
    }

    /**
     * Gets the string value
     *
     * @returns The string value
     * @throws Error if the SecureString has been destroyed
     */
    public toString(): string {
        this.ensureNotDestroyed();
        const buffer = this.buffer.getBuffer();
        return new TextDecoder().decode(buffer);
    }

    /**
     * Gets the raw buffer (copy)
     *
     * @returns Copy of the internal buffer
     * @throws Error if the SecureString has been destroyed
     */
    public toBuffer(): Uint8Array {
        this.ensureNotDestroyed();
        const buffer = this.buffer.getBuffer();
        return new Uint8Array(buffer);
    }

    /**
     * Gets the length of the string
     *
     * @returns The length of the string in characters
     * @throws Error if the SecureString has been destroyed
     */
    public length(): number {
        this.ensureNotDestroyed();
        return this.toString().length;
    }

    /**
     * Gets the byte length of the string in UTF-8 encoding
     *
     * @returns The byte length
     * @throws Error if the SecureString has been destroyed
     */
    public byteLength(): number {
        this.ensureNotDestroyed();
        return this.buffer.getBuffer().length;
    }

    /**
     * Checks if the string is empty
     *
     * @returns True if empty, false otherwise
     * @throws Error if the SecureString has been destroyed
     */
    public isEmpty(): boolean {
        this.ensureNotDestroyed();
        return this.length() === 0;
    }

    /**
     * Checks if the SecureString has been destroyed
     *
     * @returns True if destroyed, false otherwise
     */
    public isDestroyed(): boolean {
        return this._isDestroyed;
    }

    /**
     * Appends another string
     *
     * @param value - String to append
     * @returns This secure string for chaining
     * @throws Error if the SecureString has been destroyed
     */
    public append(value: string | SecureString): SecureString {
        this.ensureNotDestroyed();

        const currentValue = this.toString();
        const appendValue =
            value instanceof SecureString ? value.toString() : value;

        // Create a new buffer with the combined content
        const newValue = currentValue + appendValue;
        const newBuffer = SecureBuffer.from(newValue);

        // Destroy the old buffer
        this.buffer.destroy();

        // Update the buffer
        this.buffer = newBuffer;

        return this;
    }

    /**
     * Prepends another string
     *
     * @param value - String to prepend
     * @returns This secure string for chaining
     * @throws Error if the SecureString has been destroyed
     */
    public prepend(value: string | SecureString): SecureString {
        this.ensureNotDestroyed();

        const currentValue = this.toString();
        const prependValue =
            value instanceof SecureString ? value.toString() : value;

        // Create a new buffer with the combined content
        const newValue = prependValue + currentValue;
        const newBuffer = SecureBuffer.from(newValue);

        // Destroy the old buffer
        this.buffer.destroy();

        // Update the buffer
        this.buffer = newBuffer;

        return this;
    }

    /**
     * Replaces the entire content with a new value
     *
     * @param value - New string value
     * @returns This secure string for chaining
     * @throws Error if the SecureString has been destroyed
     */
    public replace(value: string | SecureString): SecureString {
        this.ensureNotDestroyed();

        const newValue =
            value instanceof SecureString ? value.toString() : value;

        const newBuffer = SecureBuffer.from(newValue);

        // Destroy the old buffer
        this.buffer.destroy();

        // Update the buffer
        this.buffer = newBuffer;

        return this;
    }

    /**
     * Extracts a substring
     *
     * @param start - Start index
     * @param end - End index (optional)
     * @returns New SecureString with the substring
     * @throws Error if the SecureString has been destroyed
     */
    public substring(start: number, end?: number): SecureString {
        this.ensureNotDestroyed();
        const currentValue = this.toString();
        const substr = currentValue.substring(start, end);
        return new SecureString(substr);
    }

    /**
     * Splits the string into an array of SecureStrings
     *
     * @param separator - String separator
     * @param limit - Maximum number of splits (optional)
     * @returns Array of SecureString instances
     * @throws Error if the SecureString has been destroyed
     */
    public split(separator: string | RegExp, limit?: number): SecureString[] {
        this.ensureNotDestroyed();
        const currentValue = this.toString();
        const parts = currentValue.split(separator, limit);
        return parts.map((part) => new SecureString(part));
    }

    /**
     * Compares this SecureString with another string (constant-time comparison)
     *
     * @param other - String or SecureString to compare with
     * @returns True if equal, false otherwise
     * @throws Error if the SecureString has been destroyed
     */
    public equals(other: string | SecureString): boolean {
        this.ensureNotDestroyed();

        const thisValue = this.toString();
        const otherValue =
            other instanceof SecureString ? other.toString() : other;

        // Constant-time comparison to prevent timing attacks
        if (thisValue.length !== otherValue.length) {
            return false;
        }

        let result = 0;
        for (let i = 0; i < thisValue.length; i++) {
            result |= thisValue.charCodeAt(i) ^ otherValue.charCodeAt(i);
        }

        return result === 0;
    }

    /**
     * Checks if the string contains a substring
     *
     * @param searchString - String to search for
     * @param position - Position to start search (optional)
     * @returns True if contains, false otherwise
     * @throws Error if the SecureString has been destroyed
     */
    public includes(
        searchString: string | SecureString,
        position?: number
    ): boolean {
        this.ensureNotDestroyed();
        const currentValue = this.toString();
        const search =
            searchString instanceof SecureString
                ? searchString.toString()
                : searchString;
        return currentValue.includes(search, position);
    }

    /**
     * Checks if the string starts with a prefix
     *
     * @param searchString - Prefix to check
     * @param position - Position to start check (optional)
     * @returns True if starts with prefix, false otherwise
     * @throws Error if the SecureString has been destroyed
     */
    public startsWith(
        searchString: string | SecureString,
        position?: number
    ): boolean {
        this.ensureNotDestroyed();
        const currentValue = this.toString();
        const search =
            searchString instanceof SecureString
                ? searchString.toString()
                : searchString;
        return currentValue.startsWith(search, position);
    }

    /**
     * Checks if the string ends with a suffix
     *
     * @param searchString - Suffix to check
     * @param length - Length to consider (optional)
     * @returns True if ends with suffix, false otherwise
     * @throws Error if the SecureString has been destroyed
     */
    public endsWith(
        searchString: string | SecureString,
        length?: number
    ): boolean {
        this.ensureNotDestroyed();
        const currentValue = this.toString();
        const search =
            searchString instanceof SecureString
                ? searchString.toString()
                : searchString;
        return currentValue.endsWith(search, length);
    }

    /**
     * Trims whitespace from both ends
     *
     * @returns This secure string for chaining
     * @throws Error if the SecureString has been destroyed
     */
    public trim(): SecureString {
        this.ensureNotDestroyed();
        const trimmedValue = this.toString().trim();
        return this.replace(trimmedValue);
    }

    /**
     * Converts to uppercase
     *
     * @returns New SecureString in uppercase
     * @throws Error if the SecureString has been destroyed
     */
    public toUpperCase(): SecureString {
        this.ensureNotDestroyed();
        const upperValue = this.toString().toUpperCase();
        return new SecureString(upperValue);
    }

    /**
     * Converts to lowercase
     *
     * @returns New SecureString in lowercase
     * @throws Error if the SecureString has been destroyed
     */
    public toLowerCase(): SecureString {
        this.ensureNotDestroyed();
        const lowerValue = this.toString().toLowerCase();
        return new SecureString(lowerValue);
    }

    /**
     * Creates a hash of the string content
     *
     * @param algorithm - Hashing algorithm (defaults to 'SHA-256')
     * @param format - Output format (defaults to 'hex')
     * @returns Promise resolving to hash in specified format
     * @throws Error if the SecureString has been destroyed or algorithm is unsupported
     */
    public async hash(
        algorithm: HashAlgorithm = "SHA-256",
        format: HashOutputFormat = "hex"
    ): Promise<string | Uint8Array> {
        this.ensureNotDestroyed();

        // Validate algorithm
        const validatedAlgorithm =
            CryptoAlgorithmUtils.validateAlgorithm(algorithm);

        const encoder = new TextEncoder();
        const data = encoder.encode(this.toString());
        const hashBuffer = await crypto.subtle.digest(validatedAlgorithm, data);
        const hashArray = new Uint8Array(hashBuffer);

        return this.formatHash(hashArray, format);
    }

    /**
     * Creates an HMAC of the string content
     *
     * @param options - HMAC options including key and algorithm
     * @param format - Output format (defaults to 'hex')
     * @returns Promise resolving to HMAC in specified format
     * @throws Error if the SecureString has been destroyed
     */
    public async hmac(
        options: HMACOptions,
        format: HashOutputFormat = "hex"
    ): Promise<string | Uint8Array> {
        this.ensureNotDestroyed();

        const { key, algorithm } = options;

        // Validate algorithm
        if (!CryptoAlgorithmUtils.isSupported(algorithm)) {
            throw new Error(`Unsupported HMAC algorithm: ${algorithm}`);
        }

        // Prepare key
        let keyData: Uint8Array;
        if (typeof key === "string") {
            keyData = new TextEncoder().encode(key);
        } else if (key instanceof SecureString) {
            keyData = new TextEncoder().encode(key.toString());
        } else {
            keyData = key;
        }

        // Extract hash algorithm from HMAC algorithm
        const hashAlgorithm = algorithm.replace("HMAC-", "") as HashAlgorithm;

        // Import key
        const cryptoKey = await crypto.subtle.importKey(
            "raw",
            keyData,
            { name: "HMAC", hash: hashAlgorithm },
            false,
            ["sign"]
        );

        // Sign data
        const data = new TextEncoder().encode(this.toString());
        const signature = await crypto.subtle.sign("HMAC", cryptoKey, data);
        const signatureArray = new Uint8Array(signature);

        return this.formatHash(signatureArray, format);
    }

    /**
     * Derives a key using PBKDF2
     *
     * @param options - PBKDF2 options
     * @param format - Output format (defaults to 'hex')
     * @returns Promise resolving to derived key
     * @throws Error if the SecureString has been destroyed
     */
    public async deriveKeyPBKDF2(
        options: PBKDF2Options,
        format: HashOutputFormat = "hex"
    ): Promise<string | Uint8Array> {
        this.ensureNotDestroyed();

        const { salt, iterations, keyLength, hash } = options;

        // Validate parameters
        if (iterations < 1000) {
            console.warn(
                "Warning: PBKDF2 iterations should be at least 1000 for security"
            );
        }

        // Prepare salt
        const saltData =
            typeof salt === "string" ? new TextEncoder().encode(salt) : salt;

        // Import password
        const passwordKey = await crypto.subtle.importKey(
            "raw",
            new TextEncoder().encode(this.toString()),
            "PBKDF2",
            false,
            ["deriveBits"]
        );

        // Derive key
        const derivedBits = await crypto.subtle.deriveBits(
            {
                name: "PBKDF2",
                salt: saltData,
                iterations: iterations,
                hash: hash,
            },
            passwordKey,
            keyLength * 8 // Convert bytes to bits
        );

        const derivedArray = new Uint8Array(derivedBits);
        return this.formatHash(derivedArray, format);
    }

    /**
     * Formats hash output according to specified format
     *
     * @param hashArray - Hash bytes
     * @param format - Desired output format
     * @returns Formatted hash
     */
    private formatHash(
        hashArray: Uint8Array,
        format: HashOutputFormat
    ): string | Uint8Array {
        switch (format) {
            case "hex":
                return Array.from(hashArray)
                    .map((b) => b.toString(16).padStart(2, "0"))
                    .join("");

            case "base64":
                return btoa(String.fromCharCode(...hashArray));

            case "base64url":
                return btoa(String.fromCharCode(...hashArray))
                    .replace(/\+/g, "-")
                    .replace(/\//g, "_")
                    .replace(/=/g, "");

            case "uint8array":
                return hashArray;

            default:
                throw new Error(`Unsupported hash format: ${format}`);
        }
    }

    /**
     * Gets information about available algorithms
     *
     * @returns Algorithm registry information
     */
    public static getAlgorithmInfo(): Record<CryptoAlgorithm, AlgorithmInfo> {
        return { ...ALGORITHM_REGISTRY };
    }

    /**
     * Lists all supported hash algorithms
     *
     * @returns Array of supported hash algorithms
     */
    public static getSupportedHashAlgorithms(): HashAlgorithm[] {
        return ["SHA-1", "SHA-256", "SHA-384", "SHA-512"];
    }

    /**
     * Lists all supported HMAC algorithms
     *
     * @returns Array of supported HMAC algorithms
     */
    public static getSupportedHMACAlgorithms(): HMACAlgorithm[] {
        return ["HMAC-SHA-1", "HMAC-SHA-256", "HMAC-SHA-384", "HMAC-SHA-512"];
    }

    /**
     * Executes a function with the string value and immediately clears it
     *
     * @param fn - Function to execute with the string value
     * @returns Result of the function
     * @throws Error if the SecureString has been destroyed
     */
    public use<T>(fn: (value: string) => T): T {
        this.ensureNotDestroyed();
        try {
            return fn(this.toString());
        } finally {
            this.clear();
        }
    }

    /**
     * Clears the string by zeroing its contents and marks as destroyed
     */
    public clear(): void {
        if (!this._isDestroyed) {
            this.buffer.destroy();
            this.buffer = new SecureBuffer(0);
            this._isDestroyed = true;
        }
    }

    /**
     * Alias for clear() - destroys the SecureString
     */
    public destroy(): void {
        this.clear();
    }

    /**
     * Creates a JSON representation (warning: exposes the value)
     *
     * @returns JSON object with the string value
     * @throws Error if the SecureString has been destroyed
     */
    public toJSON(): { value: string; length: number } {
        this.ensureNotDestroyed();
        return {
            value: this.toString(),
            length: this.length(),
        };
    }

    /**
     * Custom inspection for debugging (masks the actual value)
     *
     * @returns String representation for debugging
     */
    public [Symbol.for("nodejs.util.inspect.custom")](): string {
        if (this._isDestroyed) {
            return "SecureString [DESTROYED]";
        }
        return `SecureString [${this.length()} characters]`;
    }
}
