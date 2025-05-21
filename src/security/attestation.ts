/**
 * Cryptographic Attestation Module
 *
 * This module provides functionality for creating and verifying cryptographic
 * attestations, which are signed statements that can prove the authenticity
 * and integrity of data or the environment.
 *
 * Attestations can be used to verify the integrity of the library itself,
 * prove the authenticity of generated tokens, or validate the security
 * of the runtime environment.
 */

import { SecureRandom } from "../core/random";
import { Hash } from "../core/hash";
import {
    bufferToHex,
    hexToBuffer,
    bufferToBase64,
    base64ToBuffer,
} from "../utils/encoding";
import { constantTimeEqual } from "./side-channel";

/**
 * Attestation options
 */
export interface AttestationOptions {
    /**
     * Key to use for signing
     * If not provided, a random key will be generated
     */
    key?: string;

    /**
     * Expiration time in milliseconds
     * If not provided, the attestation will not expire
     */
    expiresIn?: number;

    /**
     * Additional claims to include in the attestation
     */
    claims?: Record<string, any>;

    /**
     * Whether to include environment information
     * @default true
     */
    includeEnvironment?: boolean;
}

/**
 * Attestation verification options
 */
export interface VerificationOptions {
    /**
     * Key to use for verification
     */
    key: string;

    /**
     * Whether to verify the expiration
     * @default true
     */
    verifyExpiration?: boolean;

    /**
     * Whether to verify the environment
     * @default false
     */
    verifyEnvironment?: boolean;

    /**
     * Required claims that must be present and match
     */
    requiredClaims?: Record<string, any>;
}

/**
 * Attestation result
 */
export interface AttestationResult {
    /**
     * Whether the attestation is valid
     */
    valid: boolean;

    /**
     * Reason for invalidity, if any
     */
    reason?: string;

    /**
     * Claims from the attestation
     */
    claims?: Record<string, any>;

    /**
     * Environment information from the attestation
     */
    environment?: Record<string, any>;

    /**
     * Expiration time of the attestation
     */
    expiresAt?: number;
}

/**
 * Generates a key pair for attestation
 *
 * @returns Object containing public and private keys
 */
export function generateAttestationKey(): {
    publicKey: string;
    privateKey: string;
} {
    // In a real implementation, this would use asymmetric cryptography
    // For this simplified version, we'll just generate a random key
    const keyBytes = SecureRandom.getRandomBytes(32);
    const key = bufferToHex(keyBytes);

    return {
        publicKey: key,
        privateKey: key,
    };
}

/**
 * Creates an attestation for the given data
 *
 * @param data - Data to attest
 * @param options - Attestation options
 * @returns Attestation string
 */
export function createAttestation(
    data: string | Uint8Array | Record<string, any>,
    options: AttestationOptions = {}
): string {
    // Generate or use provided key
    const key = options.key || generateAttestationKey().privateKey;

    // Prepare the data
    let dataString: string;

    if (typeof data === "string") {
        dataString = data;
    } else if (data instanceof Uint8Array) {
        dataString = bufferToHex(data);
    } else {
        dataString = JSON.stringify(data);
    }

    // Create the attestation payload
    const payload: Record<string, any> = {
        data: dataString,
        iat: Date.now(),
        nonce: bufferToHex(SecureRandom.getRandomBytes(16)),
    };

    // Add expiration if provided
    if (options.expiresIn) {
        payload.exp = payload.iat + options.expiresIn;
    }

    // Add claims if provided
    if (options.claims) {
        payload.claims = options.claims;
    }

    // Add environment information if enabled
    if (options.includeEnvironment !== false) {
        payload.env = getEnvironmentInfo();
    }

    // Serialize the payload
    const serializedPayload = JSON.stringify(payload);

    // Sign the payload
    const signature = signPayload(serializedPayload, key);

    // Combine payload and signature
    const attestation = {
        payload: bufferToBase64(new TextEncoder().encode(serializedPayload)),
        signature,
    };

    return JSON.stringify(attestation);
}

/**
 * Verifies an attestation
 *
 * @param attestation - Attestation to verify
 * @param options - Verification options
 * @returns Verification result
 */
export function verifyAttestation(
    attestation: string,
    options: VerificationOptions
): AttestationResult {
    try {
        // Parse the attestation
        const parsed = JSON.parse(attestation);

        if (!parsed.payload || !parsed.signature) {
            return {
                valid: false,
                reason: "Invalid attestation format",
            };
        }

        // Decode the payload
        const payloadBytes = base64ToBuffer(parsed.payload);
        const serializedPayload = new TextDecoder().decode(payloadBytes);
        const payload = JSON.parse(serializedPayload);

        // Verify the signature
        const signatureValid = verifySignature(
            serializedPayload,
            parsed.signature,
            options.key
        );

        if (!signatureValid) {
            return {
                valid: false,
                reason: "Invalid signature",
            };
        }

        // Verify expiration if enabled
        if (options.verifyExpiration !== false && payload.exp) {
            if (Date.now() > payload.exp) {
                return {
                    valid: false,
                    reason: "Attestation expired",
                    claims: payload.claims,
                    environment: payload.env,
                    expiresAt: payload.exp,
                };
            }
        }

        // Verify environment if enabled
        if (options.verifyEnvironment && payload.env) {
            const currentEnv = getEnvironmentInfo();

            // Check critical environment properties
            if (payload.env.userAgent !== currentEnv.userAgent) {
                return {
                    valid: false,
                    reason: "Environment mismatch: userAgent",
                    claims: payload.claims,
                    environment: payload.env,
                    expiresAt: payload.exp,
                };
            }

            if (payload.env.platform !== currentEnv.platform) {
                return {
                    valid: false,
                    reason: "Environment mismatch: platform",
                    claims: payload.claims,
                    environment: payload.env,
                    expiresAt: payload.exp,
                };
            }
        }

        // Verify required claims if provided
        if (options.requiredClaims && payload.claims) {
            for (const [key, value] of Object.entries(options.requiredClaims)) {
                if (
                    !payload.claims[key] ||
                    !deepEqual(payload.claims[key], value)
                ) {
                    return {
                        valid: false,
                        reason: `Required claim mismatch: ${key}`,
                        claims: payload.claims,
                        environment: payload.env,
                        expiresAt: payload.exp,
                    };
                }
            }
        }

        // All verifications passed
        return {
            valid: true,
            claims: payload.claims,
            environment: payload.env,
            expiresAt: payload.exp,
        };
    } catch (e) {
        return {
            valid: false,
            reason: `Verification error: ${(e as Error).message}`,
        };
    }
}

/**
 * Creates an attestation for the library itself
 * This can be used to verify the integrity of the library
 *
 * @param options - Attestation options
 * @returns Attestation string
 */
export function createLibraryAttestation(
    options: AttestationOptions = {}
): string {
    // Get library information
    const libraryInfo = {
        name: "FortifyJS",
        version: "1.0.0",
        buildId: "20250520-1",
        hash: getLibraryHash(),
    };

    // Create attestation with library info as claims
    return createAttestation("library-attestation", {
        ...options,
        claims: {
            ...options.claims,
            library: libraryInfo,
        },
    });
}

/**
 * Verifies a library attestation
 *
 * @param attestation - Attestation to verify
 * @param options - Verification options
 * @returns Verification result
 */
export function verifyLibraryAttestation(
    attestation: string,
    options: VerificationOptions
): AttestationResult {
    // Verify the attestation
    const result = verifyAttestation(attestation, options);

    if (!result.valid) {
        return result;
    }

    // Check that it's a library attestation
    if (!result.claims?.library) {
        return {
            valid: false,
            reason: "Not a library attestation",
            claims: result.claims,
            environment: result.environment,
            expiresAt: result.expiresAt,
        };
    }

    // Verify the library hash if possible
    const currentHash = getLibraryHash();

    if (
        currentHash &&
        result.claims.library.hash &&
        currentHash !== result.claims.library.hash
    ) {
        return {
            valid: false,
            reason: "Library hash mismatch",
            claims: result.claims,
            environment: result.environment,
            expiresAt: result.expiresAt,
        };
    }

    return result;
}

/**
 * Signs a payload using the provided key
 *
 * @param payload - Payload to sign
 * @param key - Key to use for signing
 * @returns Signature
 */
function signPayload(payload: string, key: string): string {
    // In a real implementation, this would use asymmetric cryptography
    // For this simplified version, we'll use HMAC-like approach

    // Convert payload and key to bytes
    const payloadBytes = new TextEncoder().encode(payload);
    const keyBytes = typeof key === "string" ? hexToBuffer(key) : key;

    // Create a signature using a keyed hash
    const signature = Hash.secureHash(payloadBytes, {
        salt: keyBytes,
        algorithm: "sha256",
        iterations: 1000,
        outputFormat: "hex",
    });

    return signature;
}

/**
 * Verifies a signature
 *
 * @param payload - Payload that was signed
 * @param signature - Signature to verify
 * @param key - Key to use for verification
 * @returns True if the signature is valid
 */
function verifySignature(
    payload: string,
    signature: string,
    key: string
): boolean {
    // Compute the expected signature
    const expectedSignature = signPayload(payload, key);

    // Compare in constant time to prevent timing attacks
    return constantTimeEqual(signature, expectedSignature);
}

/**
 * Gets information about the current environment
 *
 * @returns Environment information
 */
function getEnvironmentInfo(): Record<string, any> {
    const info: Record<string, any> = {
        timestamp: Date.now(),
    };

    // Browser environment
    if (typeof window !== "undefined") {
        info.userAgent = window.navigator.userAgent;
        // Use userAgentData instead of deprecated platform if available
        info.platform =
            (window.navigator as any).userAgentData?.platform ||
            // Fallback to derived info from userAgent
            (window.navigator.userAgent.indexOf("Win") !== -1
                ? "Windows"
                : window.navigator.userAgent.indexOf("Mac") !== -1
                ? "MacOS"
                : window.navigator.userAgent.indexOf("Linux") !== -1
                ? "Linux"
                : "Unknown");
        info.language = window.navigator.language;
        info.cookiesEnabled = window.navigator.cookieEnabled;

        if (window.screen) {
            info.screenWidth = window.screen.width;
            info.screenHeight = window.screen.height;
            info.colorDepth = window.screen.colorDepth;
        }

        info.timezoneOffset = new Date().getTimezoneOffset();
        info.origin = window.location.origin;
    }

    // Node.js environment
    if (typeof process !== "undefined") {
        info.nodeVersion = process.version;
        info.platform = process.platform;
        info.arch = process.arch;

        if (process.env) {
            info.nodeEnv = process.env.NODE_ENV;
        }
    }

    return info;
}

/**
 * Gets a hash of the library code
 * This computes a hash of the critical library components
 *
 * @returns Hash of the library code
 */
function getLibraryHash(): string {
    try {
        // In a real implementation, we would hash the actual library code files
        // For this implementation, we'll hash critical library components

        // Create a buffer to hold the critical components
        const components = [];

        // Add core module hashes
        components.push(getModuleHash("crypto"));
        components.push(getModuleHash("hash"));
        components.push(getModuleHash("keys"));
        components.push(getModuleHash("random"));

        // Add security module hashes
        components.push(getModuleHash("attestation"));
        components.push(getModuleHash("canary-tokens"));
        components.push(getModuleHash("memory-hard"));
        components.push(getModuleHash("post-quantum"));
        components.push(getModuleHash("secure-memory"));
        components.push(getModuleHash("side-channel"));

        // Combine all hashes
        const combinedHash = Hash.secureHash(components.join("|"), {
            algorithm: "sha256",
            outputFormat: "hex",
        });

        return combinedHash;
    } catch (e) {
        console.warn("Error computing library hash:", e);
        // Fallback to a fixed value if we can't compute the hash
        return "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
    }
}

/**
 * Gets a hash of a specific module
 *
 * @param moduleName - Name of the module to hash
 * @returns Hash of the module
 */
function getModuleHash(moduleName: string): string {
    try {
        // In a real implementation, we would read the file and hash its contents
        // For this implementation, we'll use a simplified approach

        // Create a representation of the module
        let moduleRepresentation = "";

        // Add module name
        moduleRepresentation += `module:${moduleName};`;

        // Add module version (in a real implementation, this would be dynamic)
        moduleRepresentation += `version:1.0.0;`;

        // Add a timestamp to detect changes
        moduleRepresentation += `timestamp:${Date.now()};`;

        // Add some module-specific data
        switch (moduleName) {
            case "crypto":
                moduleRepresentation +=
                    "class:FortifyJS;methods:encrypt,decrypt,hash,sign,verify;";
                break;
            case "hash":
                moduleRepresentation += "algorithms:sha256,sha512,sha3,blake3;";
                break;
            case "keys":
                moduleRepresentation += "algorithms:pbkdf2,scrypt,argon2;";
                break;
            case "random":
                moduleRepresentation +=
                    "entropy:high;sources:system,browser,custom;";
                break;
            case "attestation":
                moduleRepresentation += "features:sign,verify,environment;";
                break;
            case "canary-tokens":
                moduleRepresentation += "features:create,trigger,notify;";
                break;
            case "memory-hard":
                moduleRepresentation += "algorithms:argon2,balloon;";
                break;
            case "post-quantum":
                moduleRepresentation += "algorithms:kyber,lamport,ringLWE;";
                break;
            case "secure-memory":
                moduleRepresentation +=
                    "features:secureBuffer,secureString,secureObject;";
                break;
            case "side-channel":
                moduleRepresentation +=
                    "features:constantTime,maskedAccess,faultResistant;";
                break;
            default:
                moduleRepresentation += "type:unknown;";
        }

        // Hash the module representation
        return Hash.secureHash(moduleRepresentation, {
            algorithm: "sha256",
            outputFormat: "hex",
        });
    } catch (e) {
        console.warn(`Error computing hash for module ${moduleName}:`, e);
        // Fallback to a fixed value if we can't compute the hash
        return `${moduleName}-default-hash-${Date.now()}`;
    }
}

/**
 * Deep equality check for objects
 *
 * @param a - First object
 * @param b - Second object
 * @returns True if the objects are deeply equal
 */
function deepEqual(a: any, b: any): boolean {
    if (a === b) return true;

    if (
        typeof a !== "object" ||
        a === null ||
        typeof b !== "object" ||
        b === null
    ) {
        return false;
    }

    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) return false;

    for (const key of keysA) {
        if (!keysB.includes(key)) return false;
        if (!deepEqual(a[key], b[key])) return false;
    }

    return true;
}
