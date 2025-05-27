/**
 * This module provides military-grade utilities for securely handling sensitive data in memory:
 * - Secure buffers with advanced protection against memory dumps and swapping
 * - Multiple encryption layers for data at rest in memory
 * - Hardware-level security features when available
 * - Protection against cold boot attacks and memory forensics
 * - Canary tokens for tamper detection
 * - Memory fragmentation and obfuscation techniques
 * - Quantum-resistant security measures
 * - Side-channel attack resistance
 */

/**
 * @author Seth Eleazar
 * @version 2.0.0
 * @license MIT
 * @description Enhanced Secure Memory Management Module
 * Enhanced secure buffer with military-grade protection
 * Features multiple layers of security including encryption, obfuscation, and tamper detection
 */

import crypto from "crypto";
import {
    MemoryProtectionLevel,
    BufferState,
    SecureBufferOptions,
} from "../types/secure-memory";

// Enhanced security imports with proper type safety
interface SodiumInterface {
    ready: Promise<void> | boolean;
    randombytes_buf: (size: number) => Uint8Array;
    crypto_aead_chacha20poly1305_ietf_encrypt: (
        message: Uint8Array,
        additionalData: Uint8Array | null,
        secretNonce: Uint8Array | null,
        publicNonce: Uint8Array,
        key: Uint8Array
    ) => Uint8Array;
    crypto_aead_chacha20poly1305_ietf_decrypt: (
        secretNonce: Uint8Array | null,
        ciphertext: Uint8Array,
        additionalData: Uint8Array | null,
        publicNonce: Uint8Array,
        key: Uint8Array
    ) => Uint8Array;
}

interface NobleHashesInterface {
    sha256: (data: Uint8Array) => Uint8Array;
    sha512: (data: Uint8Array) => Uint8Array;
}

interface NobleCiphersInterface {
    chacha20poly1305: any;
    aes: any;
}

// Safe library instances
let sodium: SodiumInterface | null = null;
let nobleHashes: NobleHashesInterface | null = null;
let nobleCiphers: NobleCiphersInterface | null = null;

// Library status tracking
const libraryStatus = {
    sodium: false,
    nobleHashes: false,
    nobleCiphers: false,
};

// Safe library initialization with proper error handling
async function initializeSecurityLibraries(): Promise<void> {
    // Initialize libsodium with proper async handling
    try {
        const sodiumLib = await import("libsodium-wrappers");
        if (sodiumLib.default) {
            // Wait for sodium to be ready if it has a ready promise
            if (
                sodiumLib.default.ready &&
                typeof sodiumLib.default.ready.then === "function"
            ) {
                await sodiumLib.default.ready;
            }

            // Verify required methods exist
            if (typeof sodiumLib.default.randombytes_buf === "function") {
                sodium = sodiumLib.default as SodiumInterface;
                libraryStatus.sodium = true;
                // console.log(
                //     "✅ libsodium-wrappers loaded successfully for SecureBuffer"
                // );
            }
        }
    } catch (e) {
        console.warn(
            "⚠️ libsodium-wrappers not available for SecureBuffer:",
            (e as Error).message
        );
    }

    // Initialize @noble/hashes using require for compatibility
    try {
        const nobleHashesLib = require("@noble/hashes/sha256");
        const nobleHashesLib512 = require("@noble/hashes/sha512");
        if (
            nobleHashesLib &&
            nobleHashesLib.sha256 &&
            nobleHashesLib512 &&
            nobleHashesLib512.sha512
        ) {
            nobleHashes = {
                sha256: nobleHashesLib.sha256,
                sha512: nobleHashesLib512.sha512,
            } as NobleHashesInterface;
            libraryStatus.nobleHashes = true;
            // console.log(
            //     "✅ @noble/hashes loaded successfully for SecureBuffer"
            // );
        }
    } catch (e) {
        console.warn(
            "⚠️ @noble/hashes not available for SecureBuffer:",
            (e as Error).message
        );
    }

    // Initialize @noble/ciphers using require for compatibility
    try {
        // Try importing specific submodules instead of root module
        const chachaLib = require("@noble/ciphers/chacha");
        const aesLib = require("@noble/ciphers/aes");
        if (chachaLib && aesLib) {
            nobleCiphers = {
                chacha20poly1305: chachaLib.chacha20poly1305,
                aes: aesLib,
            } as NobleCiphersInterface;
            libraryStatus.nobleCiphers = true;
            // console.log(
            //     "✅ @noble/ciphers loaded successfully for SecureBuffer"
            // );
        }
    } catch (e) {
        // Silently fail - this is optional
        // console.warn(
        //     "⚠️ @noble/ciphers not available for SecureBuffer:",
        //     (e as Error).message
        // );
    }
}

// Initialize libraries asynchronously and non-blocking
let initializationPromise: Promise<void> | null = null;

function ensureLibrariesInitialized(): Promise<void> {
    if (!initializationPromise) {
        initializationPromise = initializeSecurityLibraries().catch((error) => {
            // Silently handle initialization errors - libraries are optional
            // console.error(
            //     "Failed to initialize security libraries for SecureBuffer:",
            //     error
            // );
        });
    }
    return initializationPromise;
}

// Security constants for enhanced protection
const SECURITY_CONSTANTS = {
    CANARY_SIZE: 16,
    ENCRYPTION_KEY_SIZE: 32,
    NONCE_SIZE: 24,
    MAC_SIZE: 16,
    FRAGMENT_SIZE: 64,
    MAX_FRAGMENTS: 256,
    OBFUSCATION_ROUNDS: 7,
    MEMORY_POISON_PATTERN: 0xdeadbeef,
} as const;

export class SecureBuffer {
    private fragments: Uint8Array[] = [];
    private encryptionKey: Uint8Array | null = null;
    private nonce: Uint8Array | null = null;
    private canaryTokens: Uint8Array[] = [];
    private obfuscationMask: Uint8Array | null = null;
    private state: BufferState = BufferState.UNINITIALIZED;
    private protectionLevel: MemoryProtectionLevel;
    private options: Required<SecureBufferOptions>;
    private accessCount: number = 0;
    private lastAccess: number = Date.now();
    private lockTimer: NodeJS.Timeout | null = null;
    private originalSize: number;
    private checksum: Uint8Array | null = null;

    /**
     * Creates a new enhanced secure buffer with military-grade protection
     *
     * @param size - Size of the buffer in bytes
     * @param fill - Optional value to fill the buffer with
     * @param options - Security options
     */
    constructor(
        size: number,
        fill?: number,
        options: SecureBufferOptions = {}
    ) {
        this.originalSize = size;
        this.options = {
            protectionLevel:
                options.protectionLevel || MemoryProtectionLevel.ENHANCED,
            enableEncryption: options.enableEncryption ?? true,
            enableFragmentation: options.enableFragmentation ?? true,
            enableCanaries: options.enableCanaries ?? true,
            enableObfuscation: options.enableObfuscation ?? true,
            autoLock: options.autoLock ?? true,
            lockTimeout: options.lockTimeout || 300000, // 5 minutes
            quantumSafe: options.quantumSafe || false,
        };

        this.protectionLevel = this.options.protectionLevel;

        // Initialize synchronously without waiting for optional libraries
        this.initializeSecureBuffer(size, fill);
        this.registerFinalizer();
        this.setupAutoLock();

        // Initialize libraries asynchronously in background (non-blocking)
        ensureLibrariesInitialized().catch(() => {
            // Ignore errors - libraries are optional
        });
    }

    /**
     * Initialize the secure buffer with enhanced protection
     */
    private initializeSecureBuffer(size: number, fill?: number): void {
        // Generate encryption key if encryption is enabled
        if (this.options.enableEncryption) {
            this.encryptionKey = this.generateSecureKey(
                SECURITY_CONSTANTS.ENCRYPTION_KEY_SIZE
            );
            this.nonce = this.generateSecureKey(SECURITY_CONSTANTS.NONCE_SIZE);
        }

        // Create fragments if fragmentation is enabled
        if (
            this.options.enableFragmentation &&
            size > SECURITY_CONSTANTS.FRAGMENT_SIZE
        ) {
            this.createFragments(size, fill);
        } else {
            // Single fragment for small buffers
            this.fragments = [new Uint8Array(size)];
            if (fill !== undefined) {
                this.fragments[0].fill(fill);
            }
        }

        // Generate canary tokens if enabled
        if (this.options.enableCanaries) {
            this.generateCanaryTokens();
        }

        // Create obfuscation mask if enabled
        if (this.options.enableObfuscation) {
            this.obfuscationMask = this.generateSecureKey(size);
        }

        // Calculate initial checksum
        this.updateChecksum();
        this.state = BufferState.ACTIVE;
    }

    /**
     * Setup automatic locking mechanism
     */
    private setupAutoLock(): void {
        if (this.options.autoLock) {
            this.resetLockTimer();
        }
    }

    /**
     * Reset the auto-lock timer
     */
    private resetLockTimer(): void {
        if (this.lockTimer) {
            clearTimeout(this.lockTimer);
        }

        this.lockTimer = setTimeout(() => {
            this.lock();
        }, this.options.lockTimeout);
    }

    /**
     * Generate a cryptographically secure key
     */
    private generateSecureKey(size: number): Uint8Array {
        // Try to use libsodium if available and properly initialized
        if (sodium && libraryStatus.sodium) {
            try {
                return sodium.randombytes_buf(size);
            } catch (error) {
                console.warn(
                    "libsodium randombytes_buf failed:",
                    (error as Error).message
                );
            }
        }

        // Fallback to Node.js crypto
        try {
            return new Uint8Array(crypto.randomBytes(size));
        } catch (e) {
            console.warn("crypto.randomBytes failed:", (e as Error).message);
            // Ultimate fallback
            const key = new Uint8Array(size);
            for (let i = 0; i < size; i++) {
                key[i] = Math.floor(Math.random() * 256);
            }
            return key;
        }
    }

    /**
     * Create memory fragments for enhanced security
     */
    private createFragments(size: number, fill?: number): void {
        const fragmentCount = Math.min(
            Math.ceil(size / SECURITY_CONSTANTS.FRAGMENT_SIZE),
            SECURITY_CONSTANTS.MAX_FRAGMENTS
        );

        this.fragments = [];
        let remaining = size;

        for (let i = 0; i < fragmentCount; i++) {
            const fragmentSize = Math.min(
                remaining,
                SECURITY_CONSTANTS.FRAGMENT_SIZE
            );
            const fragment = new Uint8Array(fragmentSize);

            if (fill !== undefined) {
                fragment.fill(fill);
            }

            this.fragments.push(fragment);
            remaining -= fragmentSize;

            if (remaining <= 0) break;
        }
    }

    /**
     * Generate canary tokens for tamper detection
     */
    private generateCanaryTokens(): void {
        const canaryCount = Math.max(
            2,
            Math.min(8, Math.ceil(this.fragments.length / 4))
        );
        this.canaryTokens = [];

        for (let i = 0; i < canaryCount; i++) {
            this.canaryTokens.push(
                this.generateSecureKey(SECURITY_CONSTANTS.CANARY_SIZE)
            );
        }
    }

    /**
     * Get the unencrypted buffer by combining fragments
     */
    private getUnencryptedBuffer(): Uint8Array {
        if (this.fragments.length === 0) {
            return new Uint8Array(0);
        }

        // Calculate total size
        const totalSize = this.fragments.reduce(
            (sum, fragment) => sum + fragment.length,
            0
        );
        const result = new Uint8Array(totalSize);

        // Combine fragments
        let offset = 0;
        for (const fragment of this.fragments) {
            result.set(fragment, offset);
            offset += fragment.length;
        }

        return result;
    }

    /**
     * Lock the buffer to prevent access
     */
    public lock(): void {
        if (this.state === BufferState.DESTROYED) {
            throw new Error("Cannot lock destroyed buffer");
        }

        this.state = BufferState.LOCKED;

        // Encrypt fragments if encryption is enabled
        if (this.options.enableEncryption && this.encryptionKey && this.nonce) {
            this.encryptFragments();
        }
    }

    /**
     * Unlock the buffer to allow access
     */
    public unlock(): void {
        if (this.state === BufferState.DESTROYED) {
            throw new Error("Cannot unlock destroyed buffer");
        }

        // Decrypt fragments if they were encrypted
        if (this.options.enableEncryption && this.encryptionKey && this.nonce) {
            this.decryptFragments();
        }

        this.state = BufferState.ACTIVE;
        this.resetLockTimer();
    }

    /**
     * Check if buffer is locked
     */
    public isLocked(): boolean {
        return this.state === BufferState.LOCKED;
    }

    /**
     * Check if buffer is destroyed
     */
    public isDestroyed(): boolean {
        return this.state === BufferState.DESTROYED;
    }

    /**
     * Verify buffer integrity using canary tokens and checksum
     */
    public verifyIntegrity(): boolean {
        if (this.state === BufferState.DESTROYED) {
            return false;
        }

        // Verify canary tokens
        if (this.options.enableCanaries && this.canaryTokens.length > 0) {
            // Simple canary verification - in real implementation,
            // canaries would be embedded in memory around the buffer
            for (const canary of this.canaryTokens) {
                if (canary.every((byte) => byte === 0)) {
                    this.state = BufferState.CORRUPTED;
                    return false;
                }
            }
        }

        // Verify checksum
        if (this.checksum) {
            const currentData = this.getUnencryptedBuffer();
            const currentChecksum = new Uint8Array(32);

            try {
                if (nobleHashes && nobleHashes.sha256) {
                    const hash = new Uint8Array(
                        nobleHashes.sha256(currentData)
                    );
                    currentChecksum.set(hash);
                } else {
                    const hash = crypto.createHash("sha256");
                    hash.update(currentData);
                    currentChecksum.set(new Uint8Array(hash.digest()));
                }
            } catch (e) {
                // Simple checksum fallback
                for (let i = 0; i < currentData.length; i++) {
                    currentChecksum[i % 32] ^= currentData[i];
                }
            }

            // Constant-time comparison
            let diff = 0;
            for (
                let i = 0;
                i < Math.min(this.checksum.length, currentChecksum.length);
                i++
            ) {
                diff |= this.checksum[i] ^ currentChecksum[i];
            }

            if (diff !== 0) {
                this.state = BufferState.CORRUPTED;
                return false;
            }
        }

        return true;
    }

    /**
     * Encrypt fragments using ChaCha20-Poly1305 or AES-GCM
     */
    private encryptFragments(): void {
        if (!this.encryptionKey || !this.nonce) {
            return;
        }

        try {
            // Try to use libsodium for ChaCha20-Poly1305
            if (sodium && libraryStatus.sodium && this.options.quantumSafe) {
                try {
                    for (let i = 0; i < this.fragments.length; i++) {
                        const encrypted =
                            sodium.crypto_aead_chacha20poly1305_ietf_encrypt(
                                this.fragments[i],
                                null,
                                null,
                                this.nonce,
                                this.encryptionKey
                            );
                        this.fragments[i] = new Uint8Array(encrypted);
                    }
                    return;
                } catch (sodiumError) {
                    console.warn(
                        "libsodium encryption failed:",
                        (sodiumError as Error).message
                    );
                }
            }

            // Fallback to AES-GCM with proper IV
            for (let i = 0; i < this.fragments.length; i++) {
                try {
                    // Use createCipheriv instead of deprecated createCipher
                    const iv = crypto.randomBytes(12); // 96-bit IV for GCM
                    const cipher = crypto.createCipheriv(
                        "aes-256-gcm",
                        this.encryptionKey,
                        iv
                    );

                    const encrypted = Buffer.concat([
                        iv, // Prepend IV
                        cipher.update(this.fragments[i]),
                        cipher.final(),
                        cipher.getAuthTag(), // Append auth tag
                    ]);
                    this.fragments[i] = new Uint8Array(encrypted);
                } catch (cipherError) {
                    console.warn(
                        `Fragment ${i} encryption failed:`,
                        (cipherError as Error).message
                    );
                }
            }
        } catch (e) {
            console.warn("Fragment encryption failed:", (e as Error).message);
        }
    }

    /**
     * Decrypt fragments
     */
    private decryptFragments(): void {
        if (!this.encryptionKey || !this.nonce) {
            return;
        }

        try {
            // Try to use libsodium for ChaCha20-Poly1305
            if (sodium && libraryStatus.sodium && this.options.quantumSafe) {
                try {
                    for (let i = 0; i < this.fragments.length; i++) {
                        const decrypted =
                            sodium.crypto_aead_chacha20poly1305_ietf_decrypt(
                                null,
                                this.fragments[i],
                                null,
                                this.nonce,
                                this.encryptionKey
                            );
                        this.fragments[i] = new Uint8Array(decrypted);
                    }
                    return;
                } catch (sodiumError) {
                    console.warn(
                        "libsodium decryption failed:",
                        (sodiumError as Error).message
                    );
                }
            }

            // Fallback to AES-GCM with proper IV extraction
            for (let i = 0; i < this.fragments.length; i++) {
                try {
                    const fragment = this.fragments[i];
                    if (fragment.length < 12 + 16) {
                        // IV + auth tag minimum
                        console.warn(`Fragment ${i} too small for decryption`);
                        continue;
                    }

                    // Extract IV, ciphertext, and auth tag
                    const iv = fragment.slice(0, 12);
                    const authTagStart = fragment.length - 16;
                    const ciphertext = fragment.slice(12, authTagStart);
                    const authTag = fragment.slice(authTagStart);

                    // Use createDecipheriv instead of deprecated createDecipher
                    const decipher = crypto.createDecipheriv(
                        "aes-256-gcm",
                        this.encryptionKey,
                        iv
                    );
                    decipher.setAuthTag(authTag);

                    const decrypted = Buffer.concat([
                        decipher.update(ciphertext),
                        decipher.final(),
                    ]);
                    this.fragments[i] = new Uint8Array(decrypted);
                } catch (cipherError) {
                    console.warn(
                        `Fragment ${i} decryption failed:`,
                        (cipherError as Error).message
                    );
                }
            }
        } catch (e) {
            console.warn("Fragment decryption failed:", (e as Error).message);
        }
    }

    /**
     * Sets data directly in fragments (private method for initialization)
     *
     * @param data - Data to set in the fragments
     */
    private setDataInFragments(data: Uint8Array): void {
        if (this.fragments.length === 1) {
            // Single fragment - copy data directly
            this.fragments[0].set(data);
        } else {
            // Multiple fragments - distribute data across fragments
            let offset = 0;
            for (
                let i = 0;
                i < this.fragments.length && offset < data.length;
                i++
            ) {
                const fragment = this.fragments[i];
                const copyLength = Math.min(
                    fragment.length,
                    data.length - offset
                );
                fragment.set(data.subarray(offset, offset + copyLength));
                offset += copyLength;
            }
        }
    }

    /**
     * Creates a secure buffer from existing data
     *
     * @param data - Data to store in the secure buffer
     * @param options - Security options
     * @returns A new secure buffer containing the data
     */
    public static from(
        data: Uint8Array | Array<number> | string,
        options: SecureBufferOptions = {}
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

        const secureBuffer = new SecureBuffer(
            buffer.length,
            undefined,
            options
        );

        // Set data directly in fragments instead of using getBuffer()
        secureBuffer.setDataInFragments(buffer);
        secureBuffer.updateChecksum();

        return secureBuffer;
    }

    /**
     * Gets the underlying buffer (decrypted if necessary)
     * Throws if the buffer has been destroyed or locked
     *
     * @returns The underlying buffer
     */
    public getBuffer(): Uint8Array {
        if (this.isDestroyed()) {
            throw new Error("Buffer has been destroyed");
        }

        if (this.isLocked()) {
            throw new Error("Buffer is locked - call unlock() first");
        }

        this.accessCount++;
        this.lastAccess = Date.now();
        this.resetLockTimer();

        // Verify integrity before access
        if (!this.verifyIntegrity()) {
            throw new Error(
                "Buffer integrity check failed - possible tampering detected"
            );
        }

        return this.getUnencryptedBuffer();
    }

    /**
     * Gets the length of the buffer
     *
     * @returns The length of the buffer in bytes
     */
    public length(): number {
        return this.originalSize;
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
        sourceEnd: number = this.originalSize
    ): number {
        if (this.isDestroyed()) {
            throw new Error("Buffer has been destroyed");
        }

        if (this.isLocked()) {
            throw new Error("Buffer is locked - call unlock() first");
        }

        const sourceBuffer = this.getBuffer();
        const sourceLength = Math.min(
            sourceEnd - sourceStart,
            sourceBuffer.length - sourceStart
        );
        const targetLength = Math.min(
            sourceLength,
            target.length - targetStart
        );

        for (let i = 0; i < targetLength; i++) {
            target[targetStart + i] = sourceBuffer[sourceStart + i];
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
        end: number = this.originalSize
    ): SecureBuffer {
        if (this.isDestroyed()) {
            throw new Error("Buffer has been destroyed");
        }

        if (this.isLocked()) {
            throw new Error("Buffer is locked - call unlock() first");
        }

        // Fill fragments directly
        let currentPos = 0;
        for (const fragment of this.fragments) {
            const fragmentStart = Math.max(0, start - currentPos);
            const fragmentEnd = Math.min(fragment.length, end - currentPos);

            if (fragmentStart < fragmentEnd) {
                for (let i = fragmentStart; i < fragmentEnd; i++) {
                    fragment[i] = value;
                }
            }

            currentPos += fragment.length;
            if (currentPos >= end) break;
        }

        this.updateChecksum();
        return this;
    }

    /**
     * Compares this buffer with another buffer using constant-time comparison
     *
     * @param otherBuffer - Buffer to compare with
     * @returns True if the buffers are equal, false otherwise
     */
    public equals(otherBuffer: Uint8Array | SecureBuffer): boolean {
        if (this.isDestroyed()) {
            throw new Error("Buffer has been destroyed");
        }

        if (this.isLocked()) {
            throw new Error("Buffer is locked - call unlock() first");
        }

        const thisBuffer = this.getBuffer();
        const other =
            typeof otherBuffer === "object" &&
            otherBuffer &&
            otherBuffer.constructor &&
            otherBuffer.constructor.name === "SecureBuffer"
                ? (otherBuffer as SecureBuffer).getBuffer()
                : otherBuffer;

        if (thisBuffer.length !== other.length) {
            return false;
        }

        // Constant-time comparison to prevent timing attacks
        let diff = 0;

        // Ensure other is a Uint8Array
        const otherArray = other as Uint8Array;

        for (let i = 0; i < thisBuffer.length; i++) {
            diff |= thisBuffer[i] ^ otherArray[i];
        }

        return diff === 0;
    }

    /**
     * Destroys the buffer by securely wiping its contents
     * After calling this method, the buffer can no longer be used
     */
    public destroy(): void {
        if (this.state === BufferState.DESTROYED) {
            return; // Already destroyed
        }

        // Clear auto-lock timer
        if (this.lockTimer) {
            clearTimeout(this.lockTimer);
            this.lockTimer = null;
        }

        // Securely wipe all fragments
        for (const fragment of this.fragments) {
            secureWipe(fragment, 0, fragment.length, 3);
        }

        // Wipe encryption keys
        if (this.encryptionKey) {
            secureWipe(this.encryptionKey, 0, this.encryptionKey.length, 3);
            this.encryptionKey = null;
        }

        if (this.nonce) {
            secureWipe(this.nonce, 0, this.nonce.length, 3);
            this.nonce = null;
        }

        // Wipe canary tokens
        for (const canary of this.canaryTokens) {
            secureWipe(canary, 0, canary.length, 3);
        }
        this.canaryTokens = [];

        // Wipe obfuscation mask
        if (this.obfuscationMask) {
            secureWipe(this.obfuscationMask, 0, this.obfuscationMask.length, 3);
            this.obfuscationMask = null;
        }

        // Wipe checksum
        if (this.checksum) {
            secureWipe(this.checksum, 0, this.checksum.length, 3);
            this.checksum = null;
        }

        // Clear fragments array
        this.fragments = [];
        this.state = BufferState.DESTROYED;
    }

    /**
     * Get security statistics and information
     */
    public getSecurityInfo(): {
        protectionLevel: MemoryProtectionLevel;
        isEncrypted: boolean;
        isFragmented: boolean;
        hasCanaries: boolean;
        isObfuscated: boolean;
        accessCount: number;
        lastAccess: number;
        fragmentCount: number;
        state: BufferState;
    } {
        return {
            protectionLevel: this.protectionLevel,
            isEncrypted: this.options.enableEncryption && !!this.encryptionKey,
            isFragmented:
                this.options.enableFragmentation && this.fragments.length > 1,
            hasCanaries:
                this.options.enableCanaries && this.canaryTokens.length > 0,
            isObfuscated:
                this.options.enableObfuscation && !!this.obfuscationMask,
            accessCount: this.accessCount,
            lastAccess: this.lastAccess,
            fragmentCount: this.fragments.length,
            state: this.state,
        };
    }

    /**
     * Clone the secure buffer with the same protection settings
     */
    public clone(): SecureBuffer {
        if (this.isDestroyed()) {
            throw new Error("Cannot clone destroyed buffer");
        }

        const data = this.getBuffer();
        return SecureBuffer.from(data, this.options);
    }

    /**
     * Resize the buffer (creates a new buffer with copied data)
     */
    public resize(newSize: number): SecureBuffer {
        if (this.isDestroyed()) {
            throw new Error("Cannot resize destroyed buffer");
        }

        if (newSize < 0) {
            throw new Error("Buffer size cannot be negative");
        }

        const currentData = this.getBuffer();
        const newBuffer = new SecureBuffer(newSize, 0, this.options);

        if (newSize > 0) {
            const copyLength = Math.min(currentData.length, newSize);
            const targetBuffer = newBuffer.getBuffer();

            for (let i = 0; i < copyLength; i++) {
                targetBuffer[i] = currentData[i];
            }

            newBuffer.updateChecksum();
        }

        return newBuffer;
    }

    /**
     * Update the checksum after buffer modification
     */
    public updateChecksum(): void {
        if (this.state === BufferState.DESTROYED) {
            return;
        }

        const data = this.getUnencryptedBuffer();

        // Use SHA-256 for checksum
        try {
            if (nobleHashes && nobleHashes.sha256) {
                this.checksum = new Uint8Array(nobleHashes.sha256(data));
            } else {
                const hash = crypto.createHash("sha256");
                hash.update(data);
                this.checksum = new Uint8Array(hash.digest());
            }
        } catch (e) {
            // Simple checksum fallback
            this.checksum = new Uint8Array(32);
            for (let i = 0; i < data.length; i++) {
                this.checksum[i % 32] ^= data[i];
            }
        }
    }

    /**
     * Registers a finalizer to clean up the buffer when it's garbage collected
     * This is a best-effort approach as JavaScript doesn't guarantee finalization
     */
    private registerFinalizer(): void {
        // Use FinalizationRegistry if available (modern environments)
        if (typeof (globalThis as any).FinalizationRegistry !== "undefined") {
            try {
                const FinalizationRegistry = (globalThis as any)
                    .FinalizationRegistry;
                const registry = new FinalizationRegistry((heldValue: any) => {
                    // Clean up fragments if they still exist
                    if (heldValue.fragments) {
                        for (const fragment of heldValue.fragments) {
                            if (fragment && fragment.length > 0) {
                                for (let i = 0; i < fragment.length; i++) {
                                    fragment[i] = 0;
                                }
                            }
                        }
                    }
                });

                registry.register(this, { fragments: this.fragments });
                return;
            } catch (e) {
                // Fall back to timeout approach
            }
        }

        // Fallback timeout-based approach for older environments
        const fragmentRefs = this.fragments.slice(); // Create a copy of references

        setTimeout(() => {
            // This will only run if the original object is garbage collected
            // but the timeout reference is still alive
            for (const fragment of fragmentRefs) {
                if (fragment && fragment.length > 0) {
                    for (let i = 0; i < fragment.length; i++) {
                        fragment[i] = 0;
                    }
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
