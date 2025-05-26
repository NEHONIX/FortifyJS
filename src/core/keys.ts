import { KeyDerivationOptions } from "../types";
import { ERROR_MESSAGES, SECURITY_DEFAULTS } from "../utils/constants";
import { bufferToHex } from "../utils/encoding";
import { StatsTracker } from "../utils/stats";
import { SecureRandom } from "./random";
import { Validators } from "./validators";
import { Hash } from "./hash";
import crypto from "crypto";

/**
 * Key derivation functionality
 */
export class Keys {
    /**
     * Derive a key from a password or other input
     * @param input - The input to derive a key from
     * @param options - Key derivation options
     * @returns The derived key as a hex string
     */
    public static deriveKey(
        input: string | Uint8Array,
        options: KeyDerivationOptions = {}
    ): string {
        const startTime = Date.now();

        const {
            algorithm = "pbkdf2",
            iterations = SECURITY_DEFAULTS.PBKDF2_ITERATIONS,
            salt,
            keyLength = SECURITY_DEFAULTS.KEY_LENGTH,
            hashFunction = "sha256",
        } = options;

        // Validate inputs
        Validators.validateAlgorithm(algorithm, ["pbkdf2", "scrypt", "argon2"]);
        Validators.validateIterations(iterations, 1000, 10000000);

        // Generate random salt if not provided
        let saltBytes: Uint8Array;
        if (salt) {
            if (typeof salt === "string") {
                saltBytes = new TextEncoder().encode(salt);
            } else {
                saltBytes = salt;
            }
        } else {
            saltBytes = SecureRandom.getRandomBytes(16);
        }

        // Convert input to bytes if it's a string
        let inputBytes: Uint8Array;
        if (typeof input === "string") {
            inputBytes = new TextEncoder().encode(input);
        } else {
            inputBytes = input;
        }

        // Derive the key using the specified algorithm
        let derivedKey: Uint8Array;

        switch (algorithm.toLowerCase()) {
            case "pbkdf2":
                derivedKey = Keys.pbkdf2(
                    inputBytes,
                    saltBytes,
                    iterations,
                    keyLength,
                    hashFunction
                );
                break;
            case "scrypt":
                derivedKey = Keys.scrypt(
                    inputBytes,
                    saltBytes,
                    iterations,
                    keyLength
                );
                break;
            case "argon2":
                derivedKey = Keys.argon2(
                    inputBytes,
                    saltBytes,
                    iterations,
                    keyLength
                );
                break;
            default:
                throw new Error(
                    `${ERROR_MESSAGES.INVALID_ALGORITHM}: ${algorithm}`
                );
        }

        // Convert the derived key to hex
        const result = bufferToHex(derivedKey);

        // Track statistics
        const endTime = Date.now();
        StatsTracker.getInstance().trackKeyDerivation(
            endTime - startTime,
            keyLength * 8 // Entropy bits
        );

        return result;
    }

    /**
     * PBKDF2 key derivation
     * @param password - Password input
     * @param salt - Salt value
     * @param iterations - Number of iterations
     * @param keyLength - Desired key length in bytes
     * @param hashFunction - Hash function to use
     * @returns Derived key
     */
    private static pbkdf2(
        password: Uint8Array,
        salt: Uint8Array,
        iterations: number,
        keyLength: number,
        hashFunction: string
    ): Uint8Array {
        // Try to use the pbkdf2 library if available
        try {
            if (typeof require === "function") {
                try {
                    // Import the pbkdf2 library
                    const pbkdf2Lib = require("pbkdf2");

                    // Map hash function name to format expected by the library
                    const digest =
                        hashFunction === "sha512" ? "sha512" : "sha256";

                    // Use the synchronous version of the library
                    const result = pbkdf2Lib.pbkdf2Sync(
                        Buffer.from(password),
                        Buffer.from(salt),
                        iterations,
                        keyLength,
                        digest
                    );

                    return new Uint8Array(result);
                } catch (e) {
                    console.warn("pbkdf2 library not available:", e);
                    // Fall back to Node.js crypto
                }
            }
        } catch (e) {
            console.warn("Error using pbkdf2 library:", e);
            // Fall back to Node.js crypto
        }

        // Try to use Node.js crypto if available
        try {
            if (
                typeof crypto !== "undefined" &&
                typeof crypto.pbkdf2Sync === "function"
            ) {
                return Keys.nodePbkdf2(
                    password,
                    salt,
                    iterations,
                    keyLength,
                    hashFunction
                );
            }
        } catch (e) {
            console.warn("Node.js crypto pbkdf2 not available:", e);
            // Fall back to pure JS implementation
        }

        // Fall back to pure JS implementation
        console.warn("Using pure JS PBKDF2 implementation (less efficient)");
        return Keys.purePbkdf2(
            password,
            salt,
            iterations,
            keyLength,
            hashFunction
        );

        // Note: We're not using Web Crypto API here because it's async and would require
        // restructuring the entire library to be async-compatible
    }

    // Note: Web Crypto API implementation removed since it's async and our API is sync

    /**
     * PBKDF2 using Node.js crypto
     * @param password - Password input
     * @param salt - Salt value
     * @param iterations - Number of iterations
     * @param keyLength - Desired key length in bytes
     * @param hashFunction - Hash function to use
     * @returns Derived key
     */
    private static nodePbkdf2(
        password: Uint8Array,
        salt: Uint8Array,
        iterations: number,
        keyLength: number,
        hashFunction: string
    ): Uint8Array {
        // Map hash function name to Node.js format
        const digest = hashFunction === "sha512" ? "sha512" : "sha256";

        // Use the pbkdf2 function from Node.js crypto
        const derivedKey = crypto.pbkdf2Sync(
            password,
            salt,
            iterations,
            keyLength,
            digest
        );

        return new Uint8Array(derivedKey);
    }

    /**
     * Pure JavaScript implementation of PBKDF2
     * @param password - Password input
     * @param salt - Salt value
     * @param iterations - Number of iterations
     * @param keyLength - Desired key length in bytes
     * @param hashFunction - Hash function to use
     * @returns Derived key
     */
    private static purePbkdf2(
        password: Uint8Array,
        salt: Uint8Array,
        iterations: number,
        keyLength: number,
        hashFunction: string
    ): Uint8Array {
        console.warn("Using pure JS PBKDF2 implementation (less efficient)");

        // Real PBKDF2 implementation
        const hmacFunc = (key: Uint8Array, message: Uint8Array): Uint8Array => {
            // HMAC implementation
            const blockSize = 64; // Block size for SHA-256
            const ipad = new Uint8Array(blockSize);
            const opad = new Uint8Array(blockSize);

            // Prepare key
            let keyToUse: Uint8Array;
            if (key.length > blockSize) {
                // If key is too long, hash it
                const hashAlgo =
                    hashFunction === "sha512" ? "sha512" : "sha256";

                // Use Node.js crypto if available
                if (typeof crypto !== "undefined" && crypto.createHash) {
                    const hash = crypto.createHash(hashAlgo);
                    hash.update(key);
                    keyToUse = new Uint8Array(hash.digest());
                } else {
                    // Fallback to our implementation
                    const hashResult = Hash.secureHash(key, {
                        algorithm: hashAlgo,
                        iterations: 1,
                        outputFormat: "buffer",
                    }) as unknown as Uint8Array;
                    keyToUse = hashResult;
                }
            } else {
                keyToUse = key;
            }

            // Create ipad and opad
            for (let i = 0; i < blockSize; i++) {
                ipad[i] = 0x36;
                opad[i] = 0x5c;
            }

            // XOR key with ipad and opad
            for (let i = 0; i < keyToUse.length; i++) {
                ipad[i] ^= keyToUse[i];
                opad[i] ^= keyToUse[i];
            }

            // Concatenate ipad with message
            const innerInput = new Uint8Array(ipad.length + message.length);
            innerInput.set(ipad, 0);
            innerInput.set(message, ipad.length);

            // Hash inner input
            let innerHash: Uint8Array;
            if (typeof crypto !== "undefined" && crypto.createHash) {
                const hash = crypto.createHash(
                    hashFunction === "sha512" ? "sha512" : "sha256"
                );
                hash.update(innerInput);
                innerHash = new Uint8Array(hash.digest());
            } else {
                // Fallback to our implementation
                const hashAlgo =
                    hashFunction === "sha512" ? "sha512" : "sha256";
                const hashResult = Hash.secureHash(innerInput, {
                    algorithm: hashAlgo,
                    iterations: 1,
                    outputFormat: "buffer",
                }) as unknown as Uint8Array;
                innerHash = hashResult;
            }

            // Concatenate opad with inner hash
            const outerInput = new Uint8Array(opad.length + innerHash.length);
            outerInput.set(opad, 0);
            outerInput.set(innerHash, opad.length);

            // Hash outer input
            let outerHash: Uint8Array;
            if (typeof crypto !== "undefined" && crypto.createHash) {
                const hash = crypto.createHash(
                    hashFunction === "sha512" ? "sha512" : "sha256"
                );
                hash.update(outerInput);
                outerHash = new Uint8Array(hash.digest());
            } else {
                // Fallback to our implementation
                const hashAlgo =
                    hashFunction === "sha512" ? "sha512" : "sha256";
                const hashResult = Hash.secureHash(outerInput, {
                    algorithm: hashAlgo,
                    iterations: 1,
                    outputFormat: "buffer",
                }) as unknown as Uint8Array;
                outerHash = hashResult;
            }

            return outerHash;
        };

        // PBKDF2 implementation
        const hLen = hashFunction === "sha512" ? 64 : 32; // Length of hash output
        const result = new Uint8Array(keyLength);
        const blocks = Math.ceil(keyLength / hLen);

        for (let i = 1; i <= blocks; i++) {
            // Compute U_1 = HMAC(password, salt || INT_32_BE(i))
            const blockInput = new Uint8Array(salt.length + 4);
            blockInput.set(salt, 0);

            // INT_32_BE(i)
            blockInput[salt.length] = (i >> 24) & 0xff;
            blockInput[salt.length + 1] = (i >> 16) & 0xff;
            blockInput[salt.length + 2] = (i >> 8) & 0xff;
            blockInput[salt.length + 3] = i & 0xff;

            let u = hmacFunc(password, blockInput);
            let f = new Uint8Array(u);

            for (let j = 1; j < iterations; j++) {
                u = hmacFunc(password, u);
                for (let k = 0; k < hLen; k++) {
                    f[k] ^= u[k];
                }
            }

            // Copy the block to the result
            const offset = (i - 1) * hLen;
            const bytesToCopy = Math.min(hLen, keyLength - offset);
            result.set(f.subarray(0, bytesToCopy), offset);
        }

        return result;
    }

    /**
     * Scrypt key derivation
     * @param password - Password input
     * @param salt - Salt value
     * @param cost - CPU/memory cost parameter
     * @param keyLength - Desired key length in bytes
     * @returns Derived key
     */
    private static scrypt(
        password: Uint8Array,
        salt: Uint8Array,
        cost: number,
        keyLength: number
    ): Uint8Array {
        // Try to use scrypt-js if available
        try {
            if (typeof require === "function") {
                try {
                    const scryptJs = require("scrypt-js");

                    // Calculate parameters
                    const N = Math.pow(2, cost); // Cost parameter (must be power of 2)
                    const r = 8; // Block size parameter
                    const p = 1; // Parallelization parameter

                    // Create a synchronous wrapper around the async scrypt function
                    const scryptSync = (
                        pwd: Uint8Array,
                        slt: Uint8Array,
                        len: number
                    ): Uint8Array => {
                        let result: Uint8Array | null = null;
                        let error: Error | null = null;

                        // Call the async function
                        scryptJs
                            .scrypt(pwd, slt, N, r, p, len)
                            .then((hash: Uint8Array) => {
                                result = hash;
                            })
                            .catch((err: Error) => {
                                error = err;
                            });

                        // Wait for the result (blocking)
                        const maxWaitTime = Date.now() + 10000; // 10 second timeout
                        while (result === null && error === null) {
                            // Check for timeout
                            if (Date.now() > maxWaitTime) {
                                throw new Error("Scrypt operation timed out");
                            }

                            // Small delay to prevent CPU hogging
                            for (let i = 0; i < 1000000; i++) {
                                // Busy wait
                            }
                        }

                        // Check for errors
                        if (error) {
                            throw error;
                        }

                        // Return the result
                        if (result) {
                            return result;
                        }

                        throw new Error(
                            "Scrypt operation failed with no result"
                        );
                    };

                    // Call our synchronous wrapper
                    return scryptSync(password, salt, keyLength);
                } catch (e) {
                    console.warn("scrypt-js not available:", e);
                    // Fall back to Node.js crypto scrypt
                }
            }
        } catch (e) {
            console.warn("Error using scrypt-js:", e);
            // Fall back to Node.js crypto scrypt
        }

        // Try to use Node.js crypto if available
        if (
            typeof crypto !== "undefined" &&
            typeof crypto.scryptSync === "function"
        ) {
            try {
                // Node.js crypto.scryptSync is synchronous
                const result = crypto.scryptSync(
                    Buffer.from(password),
                    Buffer.from(salt),
                    keyLength,
                    {
                        N: Math.pow(2, cost), // Cost parameter (must be power of 2)
                        r: 8, // Block size parameter
                        p: 1, // Parallelization parameter
                    }
                );
                return new Uint8Array(result);
            } catch (e) {
                console.warn(
                    "Node.js scrypt failed, using fallback implementation:",
                    e
                );
                // Fall back to PBKDF2
            }
        }

        // If all else fails, use PBKDF2 with high iteration count
        console.warn(
            "All Scrypt implementations failed, using PBKDF2 as fallback"
        );

        // Use PBKDF2 with increased iterations to compensate for the weaker algorithm
        // Scrypt with cost N is roughly equivalent to PBKDF2 with N*r*p iterations
        const equivalentIterations = Math.pow(2, cost) * 8 * 1;
        const iterations = Math.min(1000000, equivalentIterations); // Cap at a reasonable maximum

        return Keys.pbkdf2(
            password,
            salt,
            iterations,
            keyLength,
            "sha512" // Use stronger hash
        );
    }

    /**
     * Argon2 key derivation
     * @param password - Password input
     * @param salt - Salt value
     * @param iterations - Time cost parameter
     * @param keyLength - Desired key length in bytes
     * @returns Derived key
     */
    private static argon2(
        password: Uint8Array,
        salt: Uint8Array,
        iterations: number,
        keyLength: number
    ): Uint8Array {
        // Try to use the argon2 package if available
        try {
            // Check if we're in a browser environment first
            if (typeof window !== "undefined") {
                try {
                    // Try to use argon2-browser in browser environments
                    const argon2Browser = require("argon2-browser");

                    // Create a synchronous wrapper for browser environments
                    const argon2BrowserSync = (
                        pwd: Uint8Array,
                        slt: Uint8Array,
                        iter: number,
                        len: number
                    ): Uint8Array => {
                        try {
                            // Use the synchronous version if available
                            if (typeof argon2Browser.hashSync === "function") {
                                const result = argon2Browser.hashSync({
                                    pass: pwd,
                                    salt: slt,
                                    time: iter,
                                    mem: 4096,
                                    parallelism: 1,
                                    hashLen: len,
                                    type: argon2Browser.ArgonType.Argon2id,
                                });
                                return new Uint8Array(result.hash);
                            }

                            // If no sync version, use a synchronous XMLHttpRequest to wait for the result
                            let result: Uint8Array | null = null;
                            let error: Error | null = null;

                            // Create a worker to run argon2 in a separate thread
                            const worker = new Worker(
                                URL.createObjectURL(
                                    new Blob(
                                        [
                                            `
                                        importScripts('https://cdn.jsdelivr.net/npm/argon2-browser@1.18.0/dist/argon2.min.js');
                                        onmessage = function(e) {
                                            const { pwd, salt, time, mem, hashLen } = e.data;
                                            argon2.hash({
                                                pass: pwd,
                                                salt: salt,
                                                time: time,
                                                mem: mem,
                                                parallelism: 1,
                                                hashLen: hashLen,
                                                type: argon2.ArgonType.Argon2id
                                            })
                                            .then(result => {
                                                postMessage({ success: true, hash: result.hash });
                                            })
                                            .catch(err => {
                                                postMessage({ success: false, error: err.message });
                                            });
                                        }
                                    `,
                                        ],
                                        { type: "application/javascript" }
                                    )
                                )
                            );

                            // Send the data to the worker
                            worker.postMessage({
                                pwd: Array.from(pwd),
                                salt: Array.from(slt),
                                time: iter,
                                mem: 4096,
                                hashLen: len,
                            });

                            // Set up the message handler
                            worker.onmessage = (e) => {
                                if (e.data.success) {
                                    result = new Uint8Array(e.data.hash);
                                } else {
                                    error = new Error(e.data.error);
                                }
                            };

                            // Use a synchronous XMLHttpRequest to block until we have a result
                            const xhr = new XMLHttpRequest();
                            xhr.open(
                                "GET",
                                "data:text/plain;charset=utf-8,",
                                false
                            );

                            const startTime = Date.now();
                            const maxWaitTime = 30000; // 30 seconds timeout

                            while (result === null && error === null) {
                                // Check for timeout
                                if (Date.now() - startTime > maxWaitTime) {
                                    worker.terminate();
                                    throw new Error(
                                        "Argon2 operation timed out"
                                    );
                                }

                                // Poll every 100ms
                                try {
                                    xhr.send(null);
                                } catch (e) {
                                    // Ignore errors from the XHR
                                }
                            }

                            // Clean up
                            worker.terminate();

                            // Check for errors
                            if (error) {
                                throw error;
                            }

                            // Return the result
                            if (result) {
                                return result;
                            }

                            throw new Error(
                                "Argon2 operation failed with no result"
                            );
                        } catch (err: unknown) {
                            const errorMessage =
                                err instanceof Error
                                    ? err.message
                                    : "Unknown error";
                            throw new Error(
                                `Browser Argon2 operation failed: ${errorMessage}`
                            );
                        }
                    };

                    // Call our browser synchronous wrapper
                    return argon2BrowserSync(
                        password,
                        salt,
                        iterations,
                        keyLength
                    );
                } catch (e) {
                    console.warn("argon2-browser not available:", e);
                    // Fall back to Node.js implementation or other fallbacks
                }
            }

            // Check if we're in a Node.js environment
            if (typeof require === "function") {
                try {
                    // Import the argon2 package
                    const argon2 = require("argon2");

                    // Since argon2 is async and our API is sync, we need to use a workaround
                    // This is not ideal but allows us to maintain compatibility

                    // Create a proper synchronous wrapper around the async argon2 function
                    const argon2Sync = (
                        pwd: Uint8Array,
                        slt: Uint8Array,
                        iter: number,
                        len: number
                    ): Uint8Array => {
                        try {
                            // Use the argon2 package's sync method if available
                            if (typeof argon2.hashSync === "function") {
                                // Some versions of argon2 provide a sync method
                                const hash = argon2.hashSync(Buffer.from(pwd), {
                                    type: argon2.argon2id,
                                    timeCost: iter,
                                    memoryCost: 4096, // 4 MB
                                    parallelism: 1,
                                    salt: Buffer.from(slt),
                                    hashLength: len,
                                    raw: true,
                                });
                                return new Uint8Array(hash);
                            }

                            // If sync method is not available, use child_process to run in a separate process
                            // This is a proper way to make async operations synchronous in Node.js
                            const childProcess = require("child_process");

                            // Create a small script to run argon2 in a separate process
                            const script = `
                                const argon2 = require('argon2');
                                const pwd = Buffer.from(${JSON.stringify(
                                    Array.from(pwd)
                                )});
                                const salt = Buffer.from(${JSON.stringify(
                                    Array.from(slt)
                                )});

                                argon2.hash(pwd, {
                                    type: argon2.argon2id,
                                    timeCost: ${iter},
                                    memoryCost: 4096,
                                    parallelism: 1,
                                    salt: salt,
                                    hashLength: ${len},
                                    raw: true,
                                })
                                .then(hash => {
                                    process.stdout.write(Buffer.from(hash).toString('hex'));
                                    process.exit(0);
                                })
                                .catch(err => {
                                    process.stderr.write(err.message);
                                    process.exit(1);
                                });
                            `;

                            // Execute the script synchronously
                            const result = childProcess.execSync(
                                `node -e "${script.replace(/\n/g, " ")}"`,
                                { timeout: 30000 } // 30 second timeout
                            );

                            // Convert the hex output back to Uint8Array
                            const hexOutput = result.toString().trim();
                            const bytes = new Uint8Array(len);
                            for (let i = 0; i < len; i++) {
                                bytes[i] = parseInt(
                                    hexOutput.substr(i * 2, 2),
                                    16
                                );
                            }

                            return bytes;
                        } catch (err: unknown) {
                            // If child_process approach fails, throw a clear error
                            const errorMessage =
                                err instanceof Error
                                    ? err.message
                                    : "Unknown error";
                            throw new Error(
                                `Argon2 operation failed: ${errorMessage}`
                            );
                        }
                    };

                    // Call our synchronous wrapper
                    return argon2Sync(password, salt, iterations, keyLength);
                } catch (e) {
                    console.warn("Argon2 package error:", e);
                    // Fall back to scrypt-js
                }
            }
        } catch (e) {
            console.warn("Error using Argon2 package:", e);
            // Fall back to scrypt-js
        }

        // If argon2 is not available, use scrypt-js as a fallback
        try {
            if (typeof require === "function") {
                try {
                    const scryptJs = require("scrypt-js");

                    // Use scrypt-js as a fallback
                    console.warn(
                        "Argon2 not available, using scrypt-js as fallback"
                    );

                    // Convert parameters to scrypt parameters
                    // Argon2 iterations roughly map to scrypt N as 2^cost
                    const N = Math.pow(
                        2,
                        Math.min(18, Math.max(14, Math.floor(iterations / 2)))
                    ); // Between 2^14 and 2^18
                    const r = 8; // Block size
                    const p = 1; // Parallelization

                    // Create a synchronous wrapper around the async scrypt function
                    const scryptSync = (
                        pwd: Uint8Array,
                        slt: Uint8Array,
                        len: number
                    ): Uint8Array => {
                        let result: Uint8Array | null = null;
                        let error: Error | null = null;

                        // Call the async function
                        scryptJs
                            .scrypt(pwd, slt, N, r, p, len)
                            .then((hash: Uint8Array) => {
                                result = hash;
                            })
                            .catch((err: Error) => {
                                error = err;
                            });

                        // Wait for the result (blocking)
                        const maxWaitTime = Date.now() + 10000; // 10 second timeout
                        while (result === null && error === null) {
                            // Check for timeout
                            if (Date.now() > maxWaitTime) {
                                throw new Error("Scrypt operation timed out");
                            }

                            // Small delay to prevent CPU hogging
                            for (let i = 0; i < 1000000; i++) {
                                // Busy wait
                            }
                        }

                        // Check for errors
                        if (error) {
                            throw error;
                        }

                        // Return the result
                        if (result) {
                            return result;
                        }

                        throw new Error(
                            "Scrypt operation failed with no result"
                        );
                    };

                    // Call our synchronous wrapper
                    return scryptSync(password, salt, keyLength);
                } catch (e) {
                    console.warn("scrypt-js not available:", e);
                    // Fall back to Node.js crypto scrypt
                }
            }
        } catch (e) {
            console.warn("Error using scrypt-js:", e);
            // Fall back to Node.js crypto scrypt
        }

        // If both argon2 and scrypt-js are not available, use Node.js crypto scrypt
        try {
            if (
                typeof crypto !== "undefined" &&
                typeof crypto.scryptSync === "function"
            ) {
                console.warn("Using Node.js crypto scrypt as fallback");

                // Convert parameters to scrypt parameters
                const N = Math.pow(
                    2,
                    Math.min(18, Math.max(14, Math.floor(iterations / 2)))
                ); // Between 2^14 and 2^18
                const r = 8; // Block size
                const p = 1; // Parallelization

                const result = crypto.scryptSync(
                    Buffer.from(password),
                    Buffer.from(salt),
                    keyLength,
                    {
                        N: N,
                        r: r,
                        p: p,
                    }
                );

                return new Uint8Array(result);
            }
        } catch (e) {
            console.warn("Node.js crypto scrypt not available:", e);
            // Fall back to PBKDF2
        }

        // If all else fails, use PBKDF2 with high iteration count
        console.warn(
            "All Argon2 alternatives failed, using PBKDF2 as final fallback"
        );
        return Keys.pbkdf2(
            password,
            salt,
            iterations * 10, // Increase iterations to compensate for weaker algorithm
            keyLength,
            "sha512" // Use stronger hash
        );
    }
}
