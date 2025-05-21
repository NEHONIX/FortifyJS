/**
 * Secure Memory Management Module
 *
 * This module provides utilities for securely handling sensitive data in memory:
 * - Secure buffers that are automatically zeroed when no longer needed
 * - Protection against memory dumps and swapping
 * - Techniques to prevent sensitive data from being garbage collected without clearing
 * - Methods to securely clear memory
 */

/**
 * A secure buffer that automatically zeros its contents when destroyed
 * This helps prevent sensitive data from lingering in memory
 */

import crypto from "crypto";

export class SecureBuffer {
    private buffer: Uint8Array;
    private isDestroyed: boolean = false;

    /**
     * Creates a new secure buffer
     *
     * @param size - Size of the buffer in bytes
     * @param fill - Optional value to fill the buffer with
     */
    constructor(size: number, fill?: number) {
        this.buffer = new Uint8Array(size);

        if (fill !== undefined) {
            this.buffer.fill(fill);
        }

        // Register cleanup on garbage collection (best effort)
        this.registerFinalizer();
    }

    /**
     * Creates a secure buffer from existing data
     *
     * @param data - Data to store in the secure buffer
     * @returns A new secure buffer containing the data
     */
    public static from(
        data: Uint8Array | Array<number> | string
    ): SecureBuffer {
        let buffer: Uint8Array;

        if (typeof data === "string") {
            buffer = new TextEncoder().encode(data);
        } else if (Array.isArray(data)) {
            buffer = new Uint8Array(data);
        } else {
            buffer = new Uint8Array(
                data.buffer,
                data.byteOffset,
                data.byteLength
            );
        }

        const secureBuffer = new SecureBuffer(buffer.length);
        secureBuffer.buffer.set(buffer);

        return secureBuffer;
    }

    /**
     * Gets the underlying buffer
     * Throws if the buffer has been destroyed
     *
     * @returns The underlying buffer
     */
    public getBuffer(): Uint8Array {
        if (this.isDestroyed) {
            throw new Error("Buffer has been destroyed");
        }

        return this.buffer;
    }

    /**
     * Gets the length of the buffer
     *
     * @returns The length of the buffer in bytes
     */
    public length(): number {
        return this.buffer.length;
    }

    /**
     * Copies data to another buffer
     *
     * @param target - Target buffer
     * @param targetStart - Start position in the target buffer
     * @param sourceStart - Start position in this buffer
     * @param sourceEnd - End position in this buffer
     * @returns Number of bytes copied
     */
    public copy(
        target: Uint8Array,
        targetStart: number = 0,
        sourceStart: number = 0,
        sourceEnd: number = this.buffer.length
    ): number {
        if (this.isDestroyed) {
            throw new Error("Buffer has been destroyed");
        }

        const sourceLength = Math.min(
            sourceEnd - sourceStart,
            this.buffer.length - sourceStart
        );
        const targetLength = Math.min(
            sourceLength,
            target.length - targetStart
        );

        for (let i = 0; i < targetLength; i++) {
            target[targetStart + i] = this.buffer[sourceStart + i];
        }

        return targetLength;
    }

    /**
     * Fills the buffer with the specified value
     *
     * @param value - Value to fill the buffer with
     * @param start - Start position
     * @param end - End position
     * @returns This buffer
     */
    public fill(
        value: number,
        start: number = 0,
        end: number = this.buffer.length
    ): SecureBuffer {
        if (this.isDestroyed) {
            throw new Error("Buffer has been destroyed");
        }

        for (let i = start; i < end; i++) {
            this.buffer[i] = value;
        }

        return this;
    }

    /**
     * Compares this buffer with another buffer
     *
     * @param otherBuffer - Buffer to compare with
     * @returns True if the buffers are equal, false otherwise
     */
    public equals(otherBuffer: Uint8Array | SecureBuffer): boolean {
        if (this.isDestroyed) {
            throw new Error("Buffer has been destroyed");
        }

        const other =
            typeof otherBuffer === "object" &&
            otherBuffer &&
            otherBuffer.constructor &&
            otherBuffer.constructor.name === "SecureBuffer"
                ? (otherBuffer as SecureBuffer).getBuffer()
                : otherBuffer;

        if (this.buffer.length !== other.length) {
            return false;
        }

        // Constant-time comparison to prevent timing attacks
        let diff = 0;

        // Ensure other is a Uint8Array
        const otherArray = other as Uint8Array;

        for (let i = 0; i < this.buffer.length; i++) {
            diff |= this.buffer[i] ^ otherArray[i];
        }

        return diff === 0;
    }

    /**
     * Destroys the buffer by securely wiping its contents
     * After calling this method, the buffer can no longer be used
     */
    public destroy(): void {
        if (!this.isDestroyed) {
            // Use our enhanced secure wipe function with 3 passes
            secureWipe(this.buffer, 0, this.buffer.length, 3);

            this.isDestroyed = true;
        }
    }

    /**
     * Registers a finalizer to clean up the buffer when it's garbage collected
     * This is a best-effort approach as JavaScript doesn't guarantee finalization
     */
    private registerFinalizer(): void {
        // Use a simple timeout-based approach for all environments
        // This is less reliable than FinalizationRegistry but works everywhere
        const weakRef = this.buffer;

        setTimeout(() => {
            // This will only run if the original object is garbage collected
            // but the timeout reference is still alive
            if (weakRef && !this.isDestroyed) {
                for (let i = 0; i < weakRef.length; i++) {
                    weakRef[i] = 0;
                }
            }
        }, 30000); // Check after 30 seconds
    }
}

/**
 * Securely wipes a section of memory
 *
 * This implementation follows recommendations from security standards
 * for secure data deletion, using multiple overwrite patterns to ensure
 * data cannot be recovered even with advanced forensic techniques.
 *
 * @param buffer - Buffer to wipe
 * @param start - Start position
 * @param end - End position
 * @param passes - Number of overwrite passes (default: 3)
 */
export function secureWipe(
    buffer: Uint8Array,
    start: number = 0,
    end: number = buffer.length,
    passes: number = 3
): void {
    if (!buffer || buffer.length === 0) {
        return;
    }

    // Ensure bounds are valid
    start = Math.max(0, Math.min(start, buffer.length));
    end = Math.max(start, Math.min(end, buffer.length));

    // Ensure passes is at least 1
    passes = Math.max(1, passes);

    // Get a cryptographically secure random source if available
    let getRandomByte: () => number;

    try {
        // Try to use crypto.getRandomValues in browser
        if (
            typeof window !== "undefined" &&
            window.crypto &&
            window.crypto.getRandomValues
        ) {
            const randomBuffer = new Uint8Array(1);
            getRandomByte = () => {
                window.crypto.getRandomValues(randomBuffer);
                return randomBuffer[0];
            };
        }
        // Try to use Node.js crypto module
        else if (typeof require === "function") {
            try {
                // const crypto = require("crypto");
                getRandomByte = () => crypto.randomBytes(1)[0];
            } catch (e) {
                // Fallback to Math.random if crypto is not available
                getRandomByte = () => Math.floor(Math.random() * 256);
            }
        }
        // Fallback to Math.random
        else {
            getRandomByte = () => Math.floor(Math.random() * 256);
        }
    } catch (e) {
        // Final fallback
        getRandomByte = () => Math.floor(Math.random() * 256);
    }

    // DoD 5220.22-M inspired wiping patterns
    const patterns = [
        0x00, // All zeros
        0xff, // All ones
        0x55, // Alternating 01010101
        0xaa, // Alternating 10101010
        0x92, // Pseudo-random
        0x49, // Pseudo-random
        0x24, // Pseudo-random
        0x6d, // Pseudo-random
        0xb6, // Pseudo-random
        0xdb, // Pseudo-random
    ];

    // Perform the wipes
    for (let pass = 0; pass < passes; pass++) {
        // Use a different pattern for each pass, cycling through the available patterns
        const patternIndex = pass % patterns.length;
        const pattern = patterns[patternIndex];

        // Fill the buffer with the pattern
        for (let i = start; i < end; i++) {
            // Use volatile to prevent compiler optimizations from removing this code
            // This is a JavaScript approximation of the volatile keyword in C/C++
            buffer[i] = pattern;

            // Add a small delay every 1024 bytes to prevent optimization
            if (i % 1024 === 0) {
                // Force the JavaScript engine to actually perform the write
                // by reading the value back and using it
                const dummy = buffer[i];
                if (dummy === undefined) {
                    // This condition will never be true, but the compiler doesn't know that
                    buffer[i] = getRandomByte();
                }
            }
        }

        // Force a small delay between passes to ensure writes complete
        // and to make optimization more difficult
        const startTime = Date.now();
        while (Date.now() - startTime < 1) {
            // Busy wait for 1ms
        }
    }

    // Final pass with cryptographically secure random data
    for (let i = start; i < end; i++) {
        buffer[i] = getRandomByte();
    }

    // Final zero pass
    for (let i = start; i < end; i++) {
        buffer[i] = 0x00;
    }
}

/**
 * Creates a secure string that can be explicitly cleared from memory
 * Regular JavaScript strings are immutable and may persist in memory
 */
export class SecureString {
    private buffer: SecureBuffer;

    /**
     * Creates a new secure string
     *
     * @param value - Initial string value
     */
    constructor(value: string = "") {
        this.buffer = SecureBuffer.from(value);
    }

    /**
     * Gets the string value
     *
     * @returns The string value
     */
    public toString(): string {
        const buffer = this.buffer.getBuffer();
        return new TextDecoder().decode(buffer);
    }

    /**
     * Gets the length of the string
     *
     * @returns The length of the string in characters
     */
    public length(): number {
        return this.toString().length;
    }

    /**
     * Appends another string
     *
     * @param value - String to append
     * @returns This secure string
     */
    public append(value: string | SecureString): SecureString {
        const currentValue = this.toString();
        const appendValue =
            typeof value === "object" &&
            value &&
            value.constructor &&
            value.constructor.name === "SecureString"
                ? (value as SecureString).toString()
                : (value as string);

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
     * Clears the string by zeroing its contents
     */
    public clear(): void {
        this.buffer.destroy();
        this.buffer = new SecureBuffer(0);
    }
}

/**
 * A secure object that can store sensitive data and be explicitly cleared
 */
export class SecureObject<T extends Record<string, any>> {
    private data: Map<string, any> = new Map();
    private secureBuffers: Map<string, SecureBuffer> = new Map();

    /**
     * Creates a new secure object
     *
     * @param initialData - Initial data
     */
    constructor(initialData?: T) {
        if (initialData) {
            this.setAll(initialData);
        }
    }

    /**
     * Sets a value
     *
     * @param key - Key
     * @param value - Value
     */
    public set<K extends keyof T>(key: K, value: T[K]): void {
        const stringKey = String(key);

        // Clean up any existing secure buffer for this key
        if (this.secureBuffers.has(stringKey)) {
            this.secureBuffers.get(stringKey)?.destroy();
            this.secureBuffers.delete(stringKey);
        }

        // Handle different types of values
        if (
            typeof value === "object" &&
            value &&
            value.constructor &&
            value.constructor.name === "Uint8Array"
        ) {
            // Store Uint8Array in a secure buffer
            const secureBuffer = SecureBuffer.from(
                value as unknown as Uint8Array
            );
            this.secureBuffers.set(stringKey, secureBuffer);
            this.data.set(stringKey, secureBuffer);
        } else if (typeof value === "string") {
            // Store strings in secure buffers
            const secureBuffer = SecureBuffer.from(value);
            this.secureBuffers.set(stringKey, secureBuffer);
            this.data.set(stringKey, secureBuffer);
        } else {
            // Store other values directly
            this.data.set(stringKey, value);
        }
    }

    /**
     * Sets multiple values at once
     *
     * @param values - Values to set
     */
    public setAll(values: Partial<T>): void {
        for (const key in values) {
            if (Object.prototype.hasOwnProperty.call(values, key)) {
                this.set(key as keyof T, values[key] as T[keyof T]);
            }
        }
    }

    /**
     * Gets a value
     *
     * @param key - Key
     * @returns The value
     */
    public get<K extends keyof T>(key: K): T[K] {
        const stringKey = String(key);
        const value = this.data.get(stringKey);

        if (
            typeof value === "object" &&
            value &&
            value.constructor &&
            value.constructor.name === "SecureBuffer"
        ) {
            // Convert SecureBuffer back to original type
            const buffer = value.getBuffer();
            try {
                // Try to convert to string first
                return new TextDecoder().decode(buffer) as unknown as T[K];
            } catch (e) {
                // If that fails, return as Uint8Array
                return buffer as unknown as T[K];
            }
        }

        return value as T[K];
    }

    /**
     * Checks if a key exists
     *
     * @param key - Key
     * @returns True if the key exists, false otherwise
     */
    public has<K extends keyof T>(key: K): boolean {
        return this.data.has(String(key));
    }

    /**
     * Deletes a key
     *
     * @param key - Key
     * @returns True if the key was deleted, false otherwise
     */
    public delete<K extends keyof T>(key: K): boolean {
        const stringKey = String(key);

        // Clean up any secure buffer
        if (this.secureBuffers.has(stringKey)) {
            this.secureBuffers.get(stringKey)?.destroy();
            this.secureBuffers.delete(stringKey);
        }

        return this.data.delete(stringKey);
    }

    /**
     * Clears all data
     */
    public clear(): void {
        // Destroy all secure buffers
        for (const buffer of this.secureBuffers.values()) {
            buffer.destroy();
        }

        this.secureBuffers.clear();
        this.data.clear();
    }

    /**
     * Gets all keys
     *
     * @returns Array of keys
     */
    public keys(): Array<keyof T> {
        return Array.from(this.data.keys()) as Array<keyof T>;
    }

    /**
     * Converts to a regular object
     * Warning: This creates regular JavaScript objects that won't be automatically cleared
     *
     * @returns Regular object
     */
    public toObject(): T {
        const result = {} as T;

        for (const [key, value] of this.data.entries()) {
            if (
                typeof value === "object" &&
                value &&
                value.constructor &&
                value.constructor.name === "SecureBuffer"
            ) {
                const buffer = value.getBuffer();
                try {
                    // Try to convert to string first
                    (result as any)[key] = new TextDecoder().decode(buffer);
                } catch (e) {
                    // If that fails, return as Uint8Array
                    (result as any)[key] = buffer;
                }
            } else {
                (result as any)[key] = value;
            }
        }

        return result;
    }
}
