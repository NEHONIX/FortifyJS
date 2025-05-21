import { HashOptions } from "../types";
import { ERROR_MESSAGES } from "../utils/constants";
import { bufferToHex, bufferToBase64, bufferToBase58 } from "../utils/encoding";
import { StatsTracker } from "../utils/stats";
import { SecureRandom } from "./random";
import { Validators } from "./validators";
import crypto from "crypto";

/**
 * Core hashing functionality
 */
export class Hash {
    /**
     * Create a secure hash with configurable options
     * @param input - The input to hash
     * @param options - Hashing options
     * @returns The hash in the specified format
     */
    public static secureHash(
        input: string | Uint8Array,
        options: HashOptions = {}
    ): string {
        const startTime = Date.now();

        const {
            algorithm = "sha256",
            iterations = 1,
            salt,
            pepper,
            outputFormat = "hex",
        } = options;

        // Validate inputs
        Validators.validateAlgorithm(algorithm);
        Validators.validateIterations(iterations);
        Validators.validateOutputFormat(outputFormat);

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

        // Convert input to bytes
        let inputBytes: Uint8Array;
        if (typeof input === "string") {
            inputBytes = new TextEncoder().encode(input);
        } else {
            inputBytes = input;
        }

        // Add pepper if provided
        if (pepper) {
            let pepperBytes: Uint8Array;
            if (typeof pepper === "string") {
                pepperBytes = new TextEncoder().encode(pepper);
            } else {
                pepperBytes = pepper;
            }
            const combinedInput = new Uint8Array(
                inputBytes.length + pepperBytes.length
            );
            combinedInput.set(inputBytes);
            combinedInput.set(pepperBytes, inputBytes.length);
            inputBytes = combinedInput;
        }

        // Combine salt and input
        const dataToHash = new Uint8Array(saltBytes.length + inputBytes.length);
        dataToHash.set(saltBytes);
        dataToHash.set(inputBytes, saltBytes.length);

        // Perform the hash operation
        let hashResult: Uint8Array;

        switch (algorithm.toLowerCase()) {
            case "sha256":
                hashResult = Hash.sha256(dataToHash, iterations);
                break;
            case "sha512":
                hashResult = Hash.sha512(dataToHash, iterations);
                break;
            case "sha3":
                hashResult = Hash.sha3(dataToHash, iterations);
                break;
            case "blake3":
                hashResult = Hash.blake3(dataToHash, iterations);
                break;
            default:
                throw new Error(
                    `${ERROR_MESSAGES.INVALID_ALGORITHM}: ${algorithm}`
                );
        }

        // Format the output
        let result: string;
        switch (outputFormat.toLowerCase()) {
            case "hex":
                result = bufferToHex(hashResult);
                break;
            case "base64":
                result = bufferToBase64(hashResult);
                break;
            case "base58":
                result = bufferToBase58(hashResult);
                break;
            case "buffer":
                return hashResult as any; // Return the buffer directly
            default:
                throw new Error(
                    `${ERROR_MESSAGES.INVALID_FORMAT}: ${outputFormat}`
                );
        }

        // Track statistics
        const endTime = Date.now();
        StatsTracker.getInstance().trackHashComputation(endTime - startTime);

        return result;
    }

    /**
     * Perform SHA-256 hashing
     * @param data - Data to hash
     * @param iterations - Number of iterations
     * @returns Hash result
     */
    private static sha256(
        data: Uint8Array,
        iterations: number = 1
    ): Uint8Array {
        // Try to use Node.js crypto if available
        if (typeof require === "function") {
            try {
                return Hash.nodeSha256(data, iterations);
            } catch (e) {
                // Fall back to pure JS implementation
                return Hash.pureSha256(data, iterations);
            }
        } else {
            // In browser environments, we can use the pure JS implementation
            // which is a complete and correct implementation of SHA-256
            return Hash.pureSha256(data, iterations);
        }
    }

    /**
     * Perform SHA-256 using Node.js crypto
     * @param data - Data to hash
     * @param iterations - Number of iterations
     * @returns Hash result
     */
    private static nodeSha256(
        data: Uint8Array,
        iterations: number = 1
    ): Uint8Array {
        let result = data;

        for (let i = 0; i < iterations; i++) {
            const hash = crypto.createHash("sha256");
            hash.update(result);
            result = new Uint8Array(hash.digest());
        }

        return result;
    }

    /**
     * Pure JavaScript implementation of SHA-256
     * @param data - Data to hash
     * @param iterations - Number of iterations
     * @returns Hash result
     */
    private static pureSha256(
        data: Uint8Array,
        iterations: number = 1
    ): Uint8Array {
        console.warn("Using pure JS SHA-256 implementation (less efficient)");

        // SHA-256 constants
        const K = [
            0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b,
            0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01,
            0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7,
            0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
            0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152,
            0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
            0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc,
            0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
            0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819,
            0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08,
            0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f,
            0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
            0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
        ];

        // Initial hash values (first 32 bits of the fractional parts of the square roots of the first 8 primes)
        const H0 = [
            0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f,
            0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
        ];

        // Helper functions
        const ROTR = (x: number, n: number): number =>
            (x >>> n) | (x << (32 - n));
        const Ch = (x: number, y: number, z: number): number =>
            (x & y) ^ (~x & z);
        const Maj = (x: number, y: number, z: number): number =>
            (x & y) ^ (x & z) ^ (y & z);
        const Sigma0 = (x: number): number =>
            ROTR(x, 2) ^ ROTR(x, 13) ^ ROTR(x, 22);
        const Sigma1 = (x: number): number =>
            ROTR(x, 6) ^ ROTR(x, 11) ^ ROTR(x, 25);
        const sigma0 = (x: number): number =>
            ROTR(x, 7) ^ ROTR(x, 18) ^ (x >>> 3);
        const sigma1 = (x: number): number =>
            ROTR(x, 17) ^ ROTR(x, 19) ^ (x >>> 10);

        // Preprocess the message
        const preprocess = (message: Uint8Array): Uint32Array[] => {
            // Convert message to bit string and calculate length
            const bitLength = message.length * 8;

            // Calculate padding length (k)
            // We need to add 1 (for the '1' bit) + k zeros + 64 bits for the length
            // Such that the total length is a multiple of 512 bits (64 bytes)
            const k = (448 - ((bitLength + 1) % 512) + 512) % 512;
            const paddingLength = Math.ceil((k + 1) / 8);

            // Create padded message
            const paddedLength = message.length + paddingLength + 8; // +8 for the 64-bit length
            const paddedMessage = new Uint8Array(paddedLength);

            // Copy original message
            paddedMessage.set(message);

            // Add '1' bit followed by k zeros
            paddedMessage[message.length] = 0x80; // 10000000 in binary

            // Add the length as a 64-bit big-endian integer
            const view = new DataView(paddedMessage.buffer);
            // JavaScript bitwise operations are 32-bit, so we need to handle the 64-bit length carefully
            // For simplicity, we'll assume the message is less than 2^32 bits (536 MB)
            view.setUint32(paddedLength - 8, 0, false); // High 32 bits (assumed to be 0)
            view.setUint32(paddedLength - 4, bitLength, false); // Low 32 bits

            // Parse the message into 512-bit blocks (sixteen 32-bit words)
            const blocks: Uint32Array[] = [];
            for (let i = 0; i < paddedLength; i += 64) {
                const block = new Uint32Array(16);
                for (let j = 0; j < 16; j++) {
                    block[j] = view.getUint32(i + j * 4, false); // Big-endian
                }
                blocks.push(block);
            }

            return blocks;
        };

        // Process a single block
        const processBlock = (block: Uint32Array, H: number[]): void => {
            // Create message schedule
            const W = new Uint32Array(64);

            // Copy block into first 16 words of W
            for (let t = 0; t < 16; t++) {
                W[t] = block[t];
            }

            // Extend the first 16 words into the remaining 48 words
            for (let t = 16; t < 64; t++) {
                W[t] =
                    (sigma1(W[t - 2]) +
                        W[t - 7] +
                        sigma0(W[t - 15]) +
                        W[t - 16]) >>>
                    0;
            }

            // Initialize working variables
            let a = H[0];
            let b = H[1];
            let c = H[2];
            let d = H[3];
            let e = H[4];
            let f = H[5];
            let g = H[6];
            let h = H[7];

            // Main loop
            for (let t = 0; t < 64; t++) {
                const T1 = (h + Sigma1(e) + Ch(e, f, g) + K[t] + W[t]) >>> 0;
                const T2 = (Sigma0(a) + Maj(a, b, c)) >>> 0;

                h = g;
                g = f;
                f = e;
                e = (d + T1) >>> 0;
                d = c;
                c = b;
                b = a;
                a = (T1 + T2) >>> 0;
            }

            // Update hash values
            H[0] = (H[0] + a) >>> 0;
            H[1] = (H[1] + b) >>> 0;
            H[2] = (H[2] + c) >>> 0;
            H[3] = (H[3] + d) >>> 0;
            H[4] = (H[4] + e) >>> 0;
            H[5] = (H[5] + f) >>> 0;
            H[6] = (H[6] + g) >>> 0;
            H[7] = (H[7] + h) >>> 0;
        };

        // Main hash function
        const sha256 = (message: Uint8Array): Uint8Array => {
            // Preprocess the message
            const blocks = preprocess(message);

            // Initialize hash values
            const H = [...H0];

            // Process each block
            for (let i = 0; i < blocks.length; i++) {
                processBlock(blocks[i], H);
            }

            // Produce the final hash value
            const hashBuffer = new Uint8Array(32); // 256 bits = 32 bytes
            for (let i = 0; i < 8; i++) {
                hashBuffer[i * 4] = (H[i] >>> 24) & 0xff;
                hashBuffer[i * 4 + 1] = (H[i] >>> 16) & 0xff;
                hashBuffer[i * 4 + 2] = (H[i] >>> 8) & 0xff;
                hashBuffer[i * 4 + 3] = H[i] & 0xff;
            }

            return hashBuffer;
        };

        // Apply the hash operation for the specified number of iterations
        let result = data;
        for (let iter = 0; iter < iterations; iter++) {
            result = sha256(result);
        }

        return result;
    }

    /**
     * Perform SHA-512 hashing
     * @param data - Data to hash
     * @param iterations - Number of iterations
     * @returns Hash result
     */
    private static sha512(
        data: Uint8Array,
        iterations: number = 1
    ): Uint8Array {
        console.warn("Using pure JS SHA-512 implementation (less efficient)");

        // SHA-512 constants (first 64 bits of the fractional parts of the cube roots of the first 80 primes)
        const K = [
            [0x428a2f98, 0xd728ae22],
            [0x71374491, 0x23ef65cd],
            [0xb5c0fbcf, 0xec4d3b2f],
            [0xe9b5dba5, 0x8189dbbc],
            [0x3956c25b, 0xf348b538],
            [0x59f111f1, 0xb605d019],
            [0x923f82a4, 0xaf194f9b],
            [0xab1c5ed5, 0xda6d8118],
            [0xd807aa98, 0xa3030242],
            [0x12835b01, 0x45706fbe],
            [0x243185be, 0x4ee4b28c],
            [0x550c7dc3, 0xd5ffb4e2],
            [0x72be5d74, 0xf27b896f],
            [0x80deb1fe, 0x3b1696b1],
            [0x9bdc06a7, 0x25c71235],
            [0xc19bf174, 0xcf692694],
            [0xe49b69c1, 0x9ef14ad2],
            [0xefbe4786, 0x384f25e3],
            [0x0fc19dc6, 0x8b8cd5b5],
            [0x240ca1cc, 0x77ac9c65],
            [0x2de92c6f, 0x592b0275],
            [0x4a7484aa, 0x6ea6e483],
            [0x5cb0a9dc, 0xbd41fbd4],
            [0x76f988da, 0x831153b5],
            [0x983e5152, 0xee66dfab],
            [0xa831c66d, 0x2db43210],
            [0xb00327c8, 0x98fb213f],
            [0xbf597fc7, 0xbeef0ee4],
            [0xc6e00bf3, 0x3da88fc2],
            [0xd5a79147, 0x930aa725],
            [0x06ca6351, 0xe003826f],
            [0x14292967, 0x0a0e6e70],
            [0x27b70a85, 0x46d22ffc],
            [0x2e1b2138, 0x5c26c926],
            [0x4d2c6dfc, 0x5ac42aed],
            [0x53380d13, 0x9d95b3df],
            [0x650a7354, 0x8baf63de],
            [0x766a0abb, 0x3c77b2a8],
            [0x81c2c92e, 0x47edaee6],
            [0x92722c85, 0x1482353b],
            [0xa2bfe8a1, 0x4cf10364],
            [0xa81a664b, 0xbc423001],
            [0xc24b8b70, 0xd0f89791],
            [0xc76c51a3, 0x0654be30],
            [0xd192e819, 0xd6ef5218],
            [0xd6990624, 0x5565a910],
            [0xf40e3585, 0x5771202a],
            [0x106aa070, 0x32bbd1b8],
            [0x19a4c116, 0xb8d2d0c8],
            [0x1e376c08, 0x5141ab53],
            [0x2748774c, 0xdf8eeb99],
            [0x34b0bcb5, 0xe19b48a8],
            [0x391c0cb3, 0xc5c95a63],
            [0x4ed8aa4a, 0xe3418acb],
            [0x5b9cca4f, 0x7763e373],
            [0x682e6ff3, 0xd6b2b8a3],
            [0x748f82ee, 0x5defb2fc],
            [0x78a5636f, 0x43172f60],
            [0x84c87814, 0xa1f0ab72],
            [0x8cc70208, 0x1a6439ec],
            [0x90befffa, 0x23631e28],
            [0xa4506ceb, 0xde82bde9],
            [0xbef9a3f7, 0xb2c67915],
            [0xc67178f2, 0xe372532b],
            [0xca273ece, 0xea26619c],
            [0xd186b8c7, 0x21c0c207],
            [0xeada7dd6, 0xcde0eb1e],
            [0xf57d4f7f, 0xee6ed178],
            [0x06f067aa, 0x72176fba],
            [0x0a637dc5, 0xa2c898a6],
            [0x113f9804, 0xbef90dae],
            [0x1b710b35, 0x131c471b],
            [0x28db77f5, 0x23047d84],
            [0x32caab7b, 0x40c72493],
            [0x3c9ebe0a, 0x15c9bebc],
            [0x431d67c4, 0x9c100d4c],
            [0x4cc5d4be, 0xcb3e42b6],
            [0x597f299c, 0xfc657e2a],
            [0x5fcb6fab, 0x3ad6faec],
            [0x6c44198c, 0x4a475817],
        ];

        // Initial hash values (first 64 bits of the fractional parts of the square roots of the first 8 primes)
        const H0 = [
            [0x6a09e667, 0xf3bcc908],
            [0xbb67ae85, 0x84caa73b],
            [0x3c6ef372, 0xfe94f82b],
            [0xa54ff53a, 0x5f1d36f1],
            [0x510e527f, 0xade682d1],
            [0x9b05688c, 0x2b3e6c1f],
            [0x1f83d9ab, 0xfb41bd6b],
            [0x5be0cd19, 0x137e2179],
        ];

        // Helper functions for 64-bit operations
        const add64 = (a: number[], b: number[]): number[] => {
            const lo = (a[1] + b[1]) >>> 0;
            const hi = (a[0] + b[0] + (lo < a[1] ? 1 : 0)) >>> 0;
            return [hi, lo];
        };

        const rotr64 = (x: number[], n: number): number[] => {
            if (n < 32) {
                return [
                    ((x[0] >>> n) | (x[1] << (32 - n))) >>> 0,
                    ((x[1] >>> n) | (x[0] << (32 - n))) >>> 0,
                ];
            } else {
                n = n - 32;
                return [
                    ((x[1] >>> n) | (x[0] << (32 - n))) >>> 0,
                    ((x[0] >>> n) | (x[1] << (32 - n))) >>> 0,
                ];
            }
        };

        const shr64 = (x: number[], n: number): number[] => {
            if (n < 32) {
                return [
                    (x[0] >>> n) >>> 0,
                    ((x[1] >>> n) | (x[0] << (32 - n))) >>> 0,
                ];
            } else {
                return [0, (x[0] >>> (n - 32)) >>> 0];
            }
        };

        const xor64 = (a: number[], b: number[]): number[] => {
            return [(a[0] ^ b[0]) >>> 0, (a[1] ^ b[1]) >>> 0];
        };

        const and64 = (a: number[], b: number[]): number[] => {
            return [(a[0] & b[0]) >>> 0, (a[1] & b[1]) >>> 0];
        };

        const not64 = (a: number[]): number[] => {
            return [~a[0] >>> 0, ~a[1] >>> 0];
        };

        // SHA-512 functions
        const Ch = (x: number[], y: number[], z: number[]): number[] => {
            return xor64(and64(x, y), and64(not64(x), z));
        };

        const Maj = (x: number[], y: number[], z: number[]): number[] => {
            return xor64(xor64(and64(x, y), and64(x, z)), and64(y, z));
        };

        const Sigma0 = (x: number[]): number[] => {
            return xor64(xor64(rotr64(x, 28), rotr64(x, 34)), rotr64(x, 39));
        };

        const Sigma1 = (x: number[]): number[] => {
            return xor64(xor64(rotr64(x, 14), rotr64(x, 18)), rotr64(x, 41));
        };

        const sigma0 = (x: number[]): number[] => {
            return xor64(xor64(rotr64(x, 1), rotr64(x, 8)), shr64(x, 7));
        };

        const sigma1 = (x: number[]): number[] => {
            return xor64(xor64(rotr64(x, 19), rotr64(x, 61)), shr64(x, 6));
        };

        // Preprocess the message
        const preprocess = (message: Uint8Array): Uint32Array[][] => {
            // Convert message to bit string and calculate length
            const bitLength = message.length * 8;

            // Calculate padding length (k)
            // We need to add 1 (for the '1' bit) + k zeros + 128 bits for the length
            // Such that the total length is a multiple of 1024 bits (128 bytes)
            const k = (896 - ((bitLength + 1) % 1024) + 1024) % 1024;
            const paddingLength = Math.ceil((k + 1) / 8);

            // Create padded message
            const paddedLength = message.length + paddingLength + 16; // +16 for the 128-bit length
            const paddedMessage = new Uint8Array(paddedLength);

            // Copy original message
            paddedMessage.set(message);

            // Add '1' bit followed by k zeros
            paddedMessage[message.length] = 0x80; // 10000000 in binary

            // Add the length as a 128-bit big-endian integer
            // For simplicity, we'll assume the message is less than 2^64 bits
            const view = new DataView(paddedMessage.buffer);
            const lengthPosition = paddedLength - 16;

            // Set the high 64 bits to 0
            for (let i = 0; i < 8; i++) {
                view.setUint8(lengthPosition + i, 0);
            }

            // Set the low 64 bits to the bit length
            const lowBits = BigInt(bitLength);
            for (let i = 15; i >= 8; i--) {
                view.setUint8(
                    lengthPosition + i,
                    Number(lowBits & BigInt(0xff))
                );
                lowBits >> BigInt(8);
            }

            // Parse the message into 1024-bit blocks (sixteen 64-bit words)
            const blocks: Uint32Array[][] = [];
            for (let i = 0; i < paddedLength; i += 128) {
                const block: Uint32Array[] = [];
                for (let j = 0; j < 16; j++) {
                    const hi = view.getUint32(i + j * 8, false);
                    const lo = view.getUint32(i + j * 8 + 4, false);
                    block.push(new Uint32Array([hi, lo]));
                }
                blocks.push(block);
            }

            return blocks;
        };

        // Process a single block
        const processBlock = (block: Uint32Array[], H: number[][]): void => {
            // Create message schedule
            const W: number[][] = new Array(80);

            // Copy block into first 16 words of W
            for (let t = 0; t < 16; t++) {
                W[t] = [block[t][0], block[t][1]];
            }

            // Extend the first 16 words into the remaining 64 words
            for (let t = 16; t < 80; t++) {
                W[t] = add64(
                    add64(add64(sigma1(W[t - 2]), W[t - 7]), sigma0(W[t - 15])),
                    W[t - 16]
                );
            }

            // Initialize working variables
            let a = [...H[0]];
            let b = [...H[1]];
            let c = [...H[2]];
            let d = [...H[3]];
            let e = [...H[4]];
            let f = [...H[5]];
            let g = [...H[6]];
            let h = [...H[7]];

            // Main loop
            for (let t = 0; t < 80; t++) {
                const T1 = add64(
                    add64(add64(add64(h, Sigma1(e)), Ch(e, f, g)), K[t]),
                    W[t]
                );
                const T2 = add64(Sigma0(a), Maj(a, b, c));

                h = g;
                g = f;
                f = e;
                e = add64(d, T1);
                d = c;
                c = b;
                b = a;
                a = add64(T1, T2);
            }

            // Update hash values
            H[0] = add64(H[0], a);
            H[1] = add64(H[1], b);
            H[2] = add64(H[2], c);
            H[3] = add64(H[3], d);
            H[4] = add64(H[4], e);
            H[5] = add64(H[5], f);
            H[6] = add64(H[6], g);
            H[7] = add64(H[7], h);
        };

        // Main hash function
        const sha512 = (message: Uint8Array): Uint8Array => {
            // Preprocess the message
            const blocks = preprocess(message);

            // Initialize hash values
            const H = H0.map((h) => [...h]);

            // Process each block
            for (let i = 0; i < blocks.length; i++) {
                processBlock(blocks[i], H);
            }

            // Produce the final hash value
            const hashBuffer = new Uint8Array(64); // 512 bits = 64 bytes
            for (let i = 0; i < 8; i++) {
                hashBuffer[i * 8] = (H[i][0] >>> 24) & 0xff;
                hashBuffer[i * 8 + 1] = (H[i][0] >>> 16) & 0xff;
                hashBuffer[i * 8 + 2] = (H[i][0] >>> 8) & 0xff;
                hashBuffer[i * 8 + 3] = H[i][0] & 0xff;
                hashBuffer[i * 8 + 4] = (H[i][1] >>> 24) & 0xff;
                hashBuffer[i * 8 + 5] = (H[i][1] >>> 16) & 0xff;
                hashBuffer[i * 8 + 6] = (H[i][1] >>> 8) & 0xff;
                hashBuffer[i * 8 + 7] = H[i][1] & 0xff;
            }

            return hashBuffer;
        };

        // Apply the hash operation for the specified number of iterations
        let result = data;
        for (let iter = 0; iter < iterations; iter++) {
            result = sha512(result);
        }

        return result;
    }

    /**
     * Perform SHA-3 hashing
     * @param data - Data to hash
     * @param iterations - Number of iterations
     * @returns Hash result
     */
    private static sha3(data: Uint8Array, iterations: number = 1): Uint8Array {
        console.warn("Using pure JS SHA-3 implementation (less efficient)");

        // SHA-3 constants
        const KECCAK_ROUNDS = 24;
        const KECCAK_STATE_SIZE = 200; // 1600 bits = 200 bytes
        const KECCAK_RATE = 136; // 1088 bits = 136 bytes (for SHA3-256)

        // Keccak round constants
        const RC = [
            0x0000000000000001n,
            0x0000000000008082n,
            0x800000000000808an,
            0x8000000080008000n,
            0x000000000000808bn,
            0x0000000080000001n,
            0x8000000080008081n,
            0x8000000000008009n,
            0x000000000000008an,
            0x0000000000000088n,
            0x0000000080008009n,
            0x000000008000000an,
            0x000000008000808bn,
            0x800000000000008bn,
            0x8000000000008089n,
            0x8000000000008003n,
            0x8000000000008002n,
            0x8000000000000080n,
            0x000000000000800an,
            0x800000008000000an,
            0x8000000080008081n,
            0x8000000000008080n,
            0x0000000080000001n,
            0x8000000080008008n,
        ];

        // Rotation offsets
        const R = [
            [0, 36, 3, 41, 18],
            [1, 44, 10, 45, 2],
            [62, 6, 43, 15, 61],
            [28, 55, 25, 21, 56],
            [27, 20, 39, 8, 14],
        ];

        // Helper functions
        const rotateLeft = (x: bigint, n: number): bigint => {
            return (
                ((x << BigInt(n)) | (x >> BigInt(64 - n))) &
                BigInt("0xFFFFFFFFFFFFFFFF")
            );
        };

        // Keccak-f[1600] permutation function
        const keccakF = (state: BigUint64Array): void => {
            // Convert state to 5x5 matrix of 64-bit lanes
            const lanes: bigint[][] = Array(5)
                .fill(0)
                .map(() => Array(5).fill(0n));
            for (let x = 0; x < 5; x++) {
                for (let y = 0; y < 5; y++) {
                    lanes[x][y] = state[x + 5 * y];
                }
            }

            // Main permutation
            for (let round = 0; round < KECCAK_ROUNDS; round++) {
                // θ (theta) step
                const C: bigint[] = Array(5).fill(0n);
                for (let x = 0; x < 5; x++) {
                    C[x] =
                        lanes[x][0] ^
                        lanes[x][1] ^
                        lanes[x][2] ^
                        lanes[x][3] ^
                        lanes[x][4];
                }

                const D: bigint[] = Array(5).fill(0n);
                for (let x = 0; x < 5; x++) {
                    D[x] = C[(x + 4) % 5] ^ rotateLeft(C[(x + 1) % 5], 1);
                }

                for (let x = 0; x < 5; x++) {
                    for (let y = 0; y < 5; y++) {
                        lanes[x][y] ^= D[x];
                    }
                }

                // ρ (rho) and π (pi) steps combined
                const B: bigint[][] = Array(5)
                    .fill(0)
                    .map(() => Array(5).fill(0n));
                for (let x = 0; x < 5; x++) {
                    for (let y = 0; y < 5; y++) {
                        const newX = y;
                        const newY = (2 * x + 3 * y) % 5;
                        B[newX][newY] = rotateLeft(lanes[x][y], R[x][y]);
                    }
                }

                // χ (chi) step
                for (let x = 0; x < 5; x++) {
                    for (let y = 0; y < 5; y++) {
                        lanes[x][y] =
                            B[x][y] ^ (~B[(x + 1) % 5][y] & B[(x + 2) % 5][y]);
                    }
                }

                // ι (iota) step
                lanes[0][0] ^= RC[round];
            }

            // Convert back to state array
            for (let x = 0; x < 5; x++) {
                for (let y = 0; y < 5; y++) {
                    state[x + 5 * y] = lanes[x][y];
                }
            }
        };

        // Absorb data into the sponge
        const absorb = (state: BigUint64Array, data: Uint8Array): void => {
            // Convert state to byte array for easier manipulation
            const stateBytes = new Uint8Array(KECCAK_STATE_SIZE);
            for (let i = 0; i < 25; i++) {
                const lane = state[i];
                for (let j = 0; j < 8; j++) {
                    stateBytes[i * 8 + j] = Number(
                        (lane >> BigInt(j * 8)) & BigInt(0xff)
                    );
                }
            }

            // Process data in blocks
            for (let offset = 0; offset < data.length; offset += KECCAK_RATE) {
                // XOR block into the state
                const blockSize = Math.min(KECCAK_RATE, data.length - offset);
                for (let i = 0; i < blockSize; i++) {
                    stateBytes[i] ^= data[offset + i];
                }

                // Convert byte array back to lanes
                for (let i = 0; i < 25; i++) {
                    let lane = 0n;
                    for (let j = 0; j < 8; j++) {
                        lane |= BigInt(stateBytes[i * 8 + j]) << BigInt(j * 8);
                    }
                    state[i] = lane;
                }

                // Apply Keccak-f permutation
                keccakF(state);

                // Convert lanes back to byte array for next block
                for (let i = 0; i < 25; i++) {
                    const lane = state[i];
                    for (let j = 0; j < 8; j++) {
                        stateBytes[i * 8 + j] = Number(
                            (lane >> BigInt(j * 8)) & BigInt(0xff)
                        );
                    }
                }
            }
        };

        // Squeeze output from the sponge
        const squeeze = (
            state: BigUint64Array,
            outputLength: number
        ): Uint8Array => {
            // Convert state to byte array
            const stateBytes = new Uint8Array(KECCAK_STATE_SIZE);
            for (let i = 0; i < 25; i++) {
                const lane = state[i];
                for (let j = 0; j < 8; j++) {
                    stateBytes[i * 8 + j] = Number(
                        (lane >> BigInt(j * 8)) & BigInt(0xff)
                    );
                }
            }

            // Extract output
            const output = new Uint8Array(outputLength);
            let offset = 0;

            while (offset < outputLength) {
                // Copy bytes from state to output
                const blockSize = Math.min(KECCAK_RATE, outputLength - offset);
                for (let i = 0; i < blockSize; i++) {
                    output[offset + i] = stateBytes[i];
                }

                offset += KECCAK_RATE;

                // Apply Keccak-f permutation if more output is needed
                if (offset < outputLength) {
                    keccakF(state);

                    // Update stateBytes
                    for (let i = 0; i < 25; i++) {
                        const lane = state[i];
                        for (let j = 0; j < 8; j++) {
                            stateBytes[i * 8 + j] = Number(
                                (lane >> BigInt(j * 8)) & BigInt(0xff)
                            );
                        }
                    }
                }
            }

            return output;
        };

        // Main SHA-3 function
        const sha3 = (message: Uint8Array): Uint8Array => {
            // Initialize state
            const state = new BigUint64Array(25); // 1600 bits = 25 lanes of 64 bits

            // Prepare the message: append 01 padding
            const paddedMessage = new Uint8Array(message.length + 1);
            paddedMessage.set(message);
            paddedMessage[message.length] = 0x06; // SHA3 domain separator

            // Absorb the message
            absorb(state, paddedMessage);

            // Squeeze the output (32 bytes for SHA3-256)
            return squeeze(state, 32);
        };

        // Apply the hash operation for the specified number of iterations
        let result = data;
        for (let iter = 0; iter < iterations; iter++) {
            result = sha3(result);
        }

        return result;
    }

    /**
     * Perform BLAKE3 hashing
     * @param data - Data to hash
     * @param iterations - Number of iterations
     * @returns Hash result
     */
    private static blake3(
        data: Uint8Array,
        iterations: number = 1
    ): Uint8Array {
        console.warn("Using pure JS BLAKE3 implementation (less efficient)");

        // BLAKE3 constants
        const CHUNK_SIZE = 1024; // 1 KiB
        const BLOCK_SIZE = 64; // 64 bytes

        // IV (initialization vector)
        const IV = [
            0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f,
            0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
        ];

        // Message word permutations
        const MSG_PERMUTATION = [
            2, 6, 3, 10, 7, 0, 4, 13, 1, 11, 12, 5, 9, 14, 15, 8,
        ];

        // Helper functions
        const rotateRight = (x: number, n: number): number => {
            return ((x >>> n) | (x << (32 - n))) >>> 0;
        };

        // G function (quarter round)
        const g = (
            state: Uint32Array | number[],
            a: number,
            b: number,
            c: number,
            d: number,
            mx: number,
            my: number
        ): void => {
            state[a] = (state[a] + state[b] + mx) >>> 0;
            state[d] = rotateRight(state[d] ^ state[a], 16);
            state[c] = (state[c] + state[d]) >>> 0;
            state[b] = rotateRight(state[b] ^ state[c], 12);
            state[a] = (state[a] + state[b] + my) >>> 0;
            state[d] = rotateRight(state[d] ^ state[a], 8);
            state[c] = (state[c] + state[d]) >>> 0;
            state[b] = rotateRight(state[b] ^ state[c], 7);
        };

        // Compression function F
        const f = (
            state: Uint32Array | number[],
            block: Uint8Array,
            offset: number,
            counter: number,
            blockLen: number,
            flags: number
        ): void => {
            // Message words
            const m = new Uint32Array(16);
            for (let i = 0; i < 16; i++) {
                m[i] =
                    ((block[offset + i * 4] << 0) |
                        (block[offset + i * 4 + 1] << 8) |
                        (block[offset + i * 4 + 2] << 16) |
                        (block[offset + i * 4 + 3] << 24)) >>>
                    0;
            }

            // Compression state
            const v = new Uint32Array(16);

            // Initialize state
            for (let i = 0; i < 8; i++) {
                v[i] = state[i];
                v[i + 8] = IV[i];
            }

            // Counter and flags
            v[12] ^= counter & 0xffffffff;
            v[13] ^= 0; // High 32 bits (assumed to be 0)
            v[14] ^= blockLen;
            v[15] ^= flags;

            // 7 rounds (BLAKE3 uses 7 rounds)
            for (let r = 0; r < 7; r++) {
                // Column rounds
                g(v, 0, 4, 8, 12, m[0], m[1]);
                g(v, 1, 5, 9, 13, m[2], m[3]);
                g(v, 2, 6, 10, 14, m[4], m[5]);
                g(v, 3, 7, 11, 15, m[6], m[7]);

                // Diagonal rounds
                g(v, 0, 5, 10, 15, m[8], m[9]);
                g(v, 1, 6, 11, 12, m[10], m[11]);
                g(v, 2, 7, 8, 13, m[12], m[13]);
                g(v, 3, 4, 9, 14, m[14], m[15]);

                // Permute message words for next round
                const permuted = new Uint32Array(16);
                for (let i = 0; i < 16; i++) {
                    permuted[i] = m[MSG_PERMUTATION[i]];
                }
                for (let i = 0; i < 16; i++) {
                    m[i] = permuted[i];
                }
            }

            // Update state
            for (let i = 0; i < 8; i++) {
                state[i] ^= v[i] ^ v[i + 8];
            }
        };

        // Process a single chunk
        const processChunk = (
            input: Uint8Array,
            offset: number,
            chunkCounter: number,
            chunkLen: number,
            flags: number
        ): Uint8Array => {
            // Initialize chaining value with IV
            const chainingValue = new Uint32Array(IV);

            // Process all complete blocks in the chunk
            const blockFlags = flags;
            for (
                let blockOffset = 0;
                blockOffset < chunkLen - BLOCK_SIZE;
                blockOffset += BLOCK_SIZE
            ) {
                f(
                    chainingValue,
                    input,
                    offset + blockOffset,
                    chunkCounter,
                    BLOCK_SIZE,
                    blockFlags
                );
            }

            // Process the last block with CHUNK_END flag
            const lastBlockOffset =
                chunkLen - (chunkLen % BLOCK_SIZE || BLOCK_SIZE);
            const lastBlockFlags = flags | 0x01; // CHUNK_END flag
            f(
                chainingValue,
                input,
                offset + lastBlockOffset,
                chunkCounter,
                chunkLen % BLOCK_SIZE || BLOCK_SIZE,
                lastBlockFlags
            );

            // Convert chaining value to bytes
            const result = new Uint8Array(32);
            for (let i = 0; i < 8; i++) {
                result[i * 4] = chainingValue[i] & 0xff;
                result[i * 4 + 1] = (chainingValue[i] >> 8) & 0xff;
                result[i * 4 + 2] = (chainingValue[i] >> 16) & 0xff;
                result[i * 4 + 3] = (chainingValue[i] >> 24) & 0xff;
            }

            return result;
        };

        // Main BLAKE3 function
        const blake3Hash = (message: Uint8Array): Uint8Array => {
            // Process all chunks
            const numChunks = Math.ceil(message.length / CHUNK_SIZE);
            const chunkCVs: Uint8Array[] = [];

            for (let i = 0; i < numChunks; i++) {
                const chunkOffset = i * CHUNK_SIZE;
                const chunkLen = Math.min(
                    CHUNK_SIZE,
                    message.length - chunkOffset
                );
                const flags = i === 0 ? 0x02 : 0; // CHUNK_START flag for first chunk

                const cv = processChunk(
                    message,
                    chunkOffset,
                    i,
                    chunkLen,
                    flags
                );
                chunkCVs.push(cv);
            }

            // Root level of the Merkle tree
            let result: Uint8Array;

            if (chunkCVs.length === 1) {
                // Only one chunk, use its CV directly
                result = chunkCVs[0];
            } else {
                // Merge CVs in a binary tree
                let currentCVs = [...chunkCVs];

                while (currentCVs.length > 1) {
                    const newCVs: Uint8Array[] = [];

                    for (let i = 0; i < currentCVs.length; i += 2) {
                        if (i + 1 < currentCVs.length) {
                            // Merge pair of CVs
                            const parentBlock = new Uint8Array(64);
                            parentBlock.set(currentCVs[i]);
                            parentBlock.set(currentCVs[i + 1], 32);

                            const parentCV = new Uint32Array(IV);
                            f(parentCV, parentBlock, 0, 0, 64, 0x04); // PARENT flag

                            const parentCVBytes = new Uint8Array(32);
                            for (let j = 0; j < 8; j++) {
                                parentCVBytes[j * 4] = parentCV[j] & 0xff;
                                parentCVBytes[j * 4 + 1] =
                                    (parentCV[j] >> 8) & 0xff;
                                parentCVBytes[j * 4 + 2] =
                                    (parentCV[j] >> 16) & 0xff;
                                parentCVBytes[j * 4 + 3] =
                                    (parentCV[j] >> 24) & 0xff;
                            }

                            newCVs.push(parentCVBytes);
                        } else {
                            // Odd number of CVs, pass through
                            newCVs.push(currentCVs[i]);
                        }
                    }

                    currentCVs = newCVs;
                }

                result = currentCVs[0];
            }

            // Final output
            return result;
        };

        // Apply the hash operation for the specified number of iterations
        let result = data;
        for (let iter = 0; iter < iterations; iter++) {
            result = blake3Hash(result);
        }

        return result;
    }

    /**
     * Verify that a hash matches the expected input
     * @param input - The input to verify
     * @param hash - The hash to verify against
     * @param options - Hashing options (must match those used to create the hash)
     * @returns True if the hash matches the input
     */
    public static verifyHash(
        input: string | Uint8Array,
        hash: string,
        options: HashOptions
    ): boolean {
        const computedHash = Hash.secureHash(input, options);

        // Constant-time comparison to prevent timing attacks
        if (computedHash.length !== hash.length) {
            return false;
        }

        let result = 0;
        for (let i = 0; i < computedHash.length; i++) {
            result |= computedHash.charCodeAt(i) ^ hash.charCodeAt(i);
        }

        return result === 0;
    }
}
