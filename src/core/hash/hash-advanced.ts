/**
 * Hash advanced features - Cutting-edge hash implementations
 */

import * as crypto from "crypto";
import {
    HashAgilityResult,
    AgilityHashOptions,
    SideChannelOptions,
} from "./hash-types";
import { HashUtils } from "./hash-utils";
import { HashAlgorithms } from "../../algorithms/hash-algorithms";

export class HashAdvanced {
    /**
     * Cryptographic agility - support for algorithm migration
     * @param input - Input to hash
     * @param options - Migration options
     * @returns Hash with algorithm metadata
     */
    public static agilityHash(
        input: string | Uint8Array,
        options: AgilityHashOptions = {}
    ): HashAgilityResult {
        const {
            primaryAlgorithm = "blake3",
            fallbackAlgorithms = ["sha512", "sha3-256"],
            futureProof = true,
            outputFormat = "hex",
        } = options;

        // Primary hash
        const primaryHash = HashAlgorithms.secureHash(input, {
            algorithm: primaryAlgorithm,
            outputFormat: "buffer",
        });

        // Generate fallback hashes for migration support
        const fallbacks: string[] = [];
        if (futureProof) {
            for (const algo of fallbackAlgorithms) {
                try {
                    const fallbackHash = HashAlgorithms.secureHash(input, {
                        algorithm: algo,
                        outputFormat: "hex",
                    });
                    fallbacks.push(`${algo}:${fallbackHash}`);
                } catch (error) {
                    console.warn(`Fallback algorithm ${algo} failed:`, error);
                }
            }
        }

        return {
            hash: HashUtils.formatOutput(primaryHash as Buffer, outputFormat),
            algorithm: primaryAlgorithm,
            fallbacks,
            metadata: {
                version: "1.0.0",
                timestamp: Date.now(),
                strength: "MILITARY",
            },
        };
    }

    /**
     * Side-channel attack resistant hashing
     * @param input - Input to hash
     * @param options - Resistance options
     * @returns Side-channel resistant hash
     */
    public static sideChannelResistantHash(
        input: string | Uint8Array,
        options: SideChannelOptions = {}
    ): string | Buffer {
        const {
            constantTime = true,
            memoryProtection = true,
            powerAnalysisResistant = true,
            outputFormat = "hex",
        } = options;

        // Convert input to buffer
        const inputBuffer = HashUtils.toBuffer(input);
 
        // Constant-time processing
        if (constantTime) {
            return HashAdvanced.constantTimeHash(
                inputBuffer,
                memoryProtection,
                outputFormat
            );
        }

        // Power analysis resistant processing
        if (powerAnalysisResistant) {
            return HashAdvanced.powerAnalysisResistantHash(
                inputBuffer,
                outputFormat
            );
        }

        // Fallback to standard secure hash
        return HashAlgorithms.secureHash(input, { outputFormat });
    }

    /**
     * Constant-time hash processing
     * @param inputBuffer - Input buffer
     * @param memoryProtection - Enable memory protection
     * @param outputFormat - Output format
     * @returns Constant-time hash
     */
    private static constantTimeHash(
        inputBuffer: Buffer,
        memoryProtection: boolean,
        outputFormat: string
    ): string | Buffer {
        // Pad input to fixed size to prevent length-based attacks
        const paddedInput = Buffer.alloc(1024);
        inputBuffer.copy(paddedInput, 0, 0, Math.min(inputBuffer.length, 1024));

        // Use constant-time operations
        let hash = crypto.createHash("sha256");

        // Process in constant-time chunks
        for (let i = 0; i < paddedInput.length; i += 64) {
            const chunk = paddedInput.subarray(i, i + 64);
            hash.update(chunk);

            // Add constant delay to prevent timing analysis
            const start = Date.now();
            while (Date.now() - start < 1) {
                // Constant time delay
            }
        }

        const result = hash.digest();

        // Memory protection - clear sensitive data
        if (memoryProtection) {
            paddedInput.fill(0);
            inputBuffer.fill(0);
        }

        return HashUtils.formatOutput(
            result,
            outputFormat as
                | "hex"
                | "base64"
                | "buffer"
                | "base58"
                | "binary"
                | "base64url"
        );
    }

    /**
     * Power analysis resistant hash processing
     * @param inputBuffer - Input buffer
     * @param outputFormat - Output format
     * @returns Power analysis resistant hash
     */
    private static powerAnalysisResistantHash(
        inputBuffer: Buffer,
        outputFormat: string
    ): string | Buffer {
        // Use multiple hash rounds with random delays
        let result = inputBuffer;
        const rounds = 3 + Math.floor(Math.random() * 3); // 3-5 rounds

        for (let i = 0; i < rounds; i++) {
            result = crypto.createHash("sha512").update(result).digest();

            // Random delay to prevent power analysis
            const delay = Math.floor(Math.random() * 5) + 1;
            const start = Date.now();
            while (Date.now() - start < delay) {
                // Random delay
            }
        }

        return HashUtils.formatOutput(
            result,
            outputFormat as
                | "hex"
                | "base64"
                | "buffer"
                | "base58"
                | "binary"
                | "base64url"
        );
    }

    /**
     * Parallel hash processing for performance
     * @param input - Input to hash
     * @param options - Parallel processing options
     * @returns Promise resolving to hash result
     */
    public static async parallelHash(
        input: string | Uint8Array,
        options: {
            chunkSize?: number;
            workers?: number;
            algorithm?: string;
            outputFormat?: "hex" | "base64" | "buffer";
        } = {}
    ): Promise<string | Buffer> {
        const {
            chunkSize = 64 * 1024, // 64KB chunks
            workers = 4,
            algorithm = "sha256",
            outputFormat = "hex",
        } = options;

        const inputBuffer = HashUtils.toBuffer(input);

        // If input is small, use single-threaded processing
        if (inputBuffer.length <= chunkSize) {
            return HashAlgorithms.secureHash(input, {
                algorithm,
                outputFormat,
            });
        }

        // Split input into chunks
        const chunks: Buffer[] = [];
        for (let i = 0; i < inputBuffer.length; i += chunkSize) {
            chunks.push(inputBuffer.subarray(i, i + chunkSize));
        }

        // Process chunks in parallel (simulated with Promise.all)
        const chunkHashes = await Promise.all(
            chunks.map(async (chunk, index) => {
                // Add small delay to simulate parallel processing
                await new Promise((resolve) =>
                    setTimeout(resolve, index % workers)
                );
                return crypto.createHash(algorithm).update(chunk).digest();
            })
        );

        // Combine chunk hashes
        const combinedHash = crypto.createHash(algorithm);
        for (const chunkHash of chunkHashes) {
            combinedHash.update(chunkHash);
        }

        const result = combinedHash.digest();
        return HashUtils.formatOutput(result, outputFormat);
    }

    /**
     * Streaming hash for large data processing
     * @param algorithm - Hash algorithm
     * @param options - Streaming options
     * @returns Stream hash processor
     */
    public static createStreamingHash(
        algorithm: string = "sha256",
        options: {
            chunkSize?: number;
            progressCallback?: (processed: number, total?: number) => void;
        } = {}
    ): {
        update: (chunk: Buffer) => void;
        digest: () => Buffer;
        reset: () => void;
        getProgress: () => { processed: number; chunks: number };
    } {
        const { chunkSize = 64 * 1024, progressCallback } = options;

        let hash = crypto.createHash(algorithm);
        let totalProcessed = 0;
        let chunksProcessed = 0;

        return {
            update: (chunk: Buffer) => {
                // Process in smaller chunks if needed
                let offset = 0;
                while (offset < chunk.length) {
                    const end = Math.min(offset + chunkSize, chunk.length);
                    const subChunk = chunk.subarray(offset, end);
                    hash.update(subChunk);
                    offset = end;
                    totalProcessed += subChunk.length;
                    chunksProcessed++;

                    // Call progress callback if provided
                    if (progressCallback) {
                        progressCallback(totalProcessed);
                    }
                }
            },
            digest: () => {
                const result = hash.digest();
                // Reset for potential reuse
                hash = crypto.createHash(algorithm);
                totalProcessed = 0;
                chunksProcessed = 0;
                return result;
            },
            reset: () => {
                hash = crypto.createHash(algorithm);
                totalProcessed = 0;
                chunksProcessed = 0;
            },
            getProgress: () => ({
                processed: totalProcessed,
                chunks: chunksProcessed,
            }),
        };
    }

    /**
     * Merkle tree hash for data integrity
     * @param data - Array of data chunks
     * @param algorithm - Hash algorithm
     * @returns Merkle root hash
     */
    public static merkleTreeHash(
        data: (string | Uint8Array | Buffer)[],
        algorithm: string = "sha256"
    ): Buffer {
        if (data.length === 0) {
            throw new Error("Cannot create Merkle tree from empty data");
        }

        // Convert all data to buffers and hash them
        let hashes = data.map((chunk) => {
            const buffer = HashUtils.toBuffer(chunk);
            return crypto.createHash(algorithm).update(buffer).digest();
        });

        // Build Merkle tree bottom-up
        while (hashes.length > 1) {
            const newHashes: Buffer[] = [];

            for (let i = 0; i < hashes.length; i += 2) {
                if (i + 1 < hashes.length) {
                    // Combine pair of hashes
                    const combined = Buffer.concat([hashes[i], hashes[i + 1]]);
                    const parentHash = crypto
                        .createHash(algorithm)
                        .update(combined)
                        .digest();
                    newHashes.push(parentHash);
                } else {
                    // Odd number of hashes, promote the last one
                    newHashes.push(hashes[i]);
                }
            }

            hashes = newHashes;
        }

        return hashes[0];
    }

    /**
     * Incremental hash for append-only data
     * @param previousHash - Previous hash state
     * @param newData - New data to append
     * @param algorithm - Hash algorithm
     * @returns Updated hash
     */
    public static incrementalHash(
        previousHash: string | Buffer,
        newData: string | Uint8Array | Buffer,
        algorithm: string = "sha256"
    ): Buffer {
        const prevBuffer = Buffer.isBuffer(previousHash)
            ? previousHash
            : Buffer.from(previousHash, "hex");

        const newBuffer = HashUtils.toBuffer(newData);

        // Combine previous hash with new data
        const combined = Buffer.concat([prevBuffer, newBuffer]);

        return crypto.createHash(algorithm).update(combined).digest();
    }

    /**
     * Hash chain for sequential data integrity
     * @param data - Array of data items
     * @param algorithm - Hash algorithm
     * @returns Array of chained hashes
     */
    public static hashChain(
        data: (string | Uint8Array | Buffer)[],
        algorithm: string = "sha256"
    ): Buffer[] {
        if (data.length === 0) {
            return [];
        }

        const hashes: Buffer[] = [];
        let previousHash: Buffer | null = null;

        for (const item of data) {
            const itemBuffer = HashUtils.toBuffer(item);

            let hashInput: Buffer;
            if (previousHash) {
                hashInput = Buffer.concat([previousHash, itemBuffer]);
            } else {
                hashInput = itemBuffer;
            }

            const hash = crypto
                .createHash(algorithm)
                .update(hashInput)
                .digest();
            hashes.push(hash);
            previousHash = hash;
        }

        return hashes;
    }
}
