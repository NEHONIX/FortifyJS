/**
 * FortifyJS - Fortified Function Security Handler
 * Handles all security operations using existing FortifyJS components
 */

import { SecureBuffer } from "../../security";
import { SecureString } from "../../security/secure-string";
import { Hash } from "../../core";
import { SecureRandom } from "../../core/random";
import { SecureExecutionContext, FortifiedFunctionOptions } from "./types";

export class SecurityHandler {
    private readonly hashUtil: typeof Hash;
    private readonly randomUtil: typeof SecureRandom;

    constructor() {
        this.hashUtil = Hash;
        this.randomUtil = SecureRandom;
    }

    /**
     * Encrypt sensitive parameters using existing SecureString component
     */
    public async encryptParameters<T extends any[]>(
        context: SecureExecutionContext,
        args: T,
        options: Required<FortifiedFunctionOptions>
    ): Promise<void> {
        const { secureParameters } = options;

        for (let i = 0; i < args.length; i++) {
            const shouldEncrypt =
                (secureParameters as (string | number)[]).includes(i) ||
                (secureParameters as (string | number)[]).includes(`param${i}`);

            if (shouldEncrypt && args[i] != null) {
                try {
                    // Use existing SecureString component
                    const secureString = new SecureString(String(args[i]));
                    const encrypted = await secureString.hash("SHA-256", "hex");
                    context.encryptedParameters.set(
                        `param${i}`,
                        encrypted as string
                    );

                    // Store in secure buffer for memory management using existing SecureBuffer
                    const buffer = SecureBuffer.from(String(args[i]));
                    context.secureBuffers.set(`param${i}`, buffer);

                    context.auditEntry.securityFlags.push(
                        `param${i}_encrypted`
                    );
                } catch (error) {
                    console.warn(`Failed to encrypt parameter ${i}:`, error);
                }
            }
        }
    }

    /**
     * Generate cache key using existing Hash component
     */
    public async generateCacheKey<T extends any[]>(args: T): Promise<string> {
        const serialized = JSON.stringify(args);
        return this.hashUtil.createSecureHash(serialized, undefined, {
            algorithm: "sha256",
            outputFormat: "hex",
        }) as string;
    }

    /**
     * Generate hash of parameters for audit logging using existing Hash component
     */
    public async hashParameters<T extends any[]>(args: T): Promise<string> {
        const serialized = JSON.stringify(args, (_, value) => {
            // Don't include actual sensitive values in hash
            if (typeof value === "string" && value.length > 50) {
                return `[REDACTED:${value.length}]`;
            }
            return value;
        });

        return this.hashUtil.createSecureHash(serialized, undefined, {
            algorithm: "sha256",
            outputFormat: "hex",
        }) as string;
    }

    /**
     * Generate secure execution ID using existing SecureRandom
     */
    public generateExecutionId(): string {
        // Use existing SecureRandom for secure ID generation
        const randomBytes = this.randomUtil.getRandomBytes(8);
        const timestamp = Date.now().toString(36);
        const randomPart = Array.from(randomBytes)
            .map((b: number) => b.toString(36))
            .join("")
            .substring(0, 9);
        return `exec_${timestamp}_${randomPart}`;
    }

    /**
     * Sanitize stack trace to remove sensitive information
     */
    public sanitizeStackTrace(stack: string): string {
        // Remove sensitive parameter information from stack traces
        return stack.replace(/\(.*?\)/g, "([REDACTED])");
    }

    /**
     * Schedule secure cleanup of execution context using existing SecureBuffer
     */
    public scheduleCleanup(
        context: SecureExecutionContext,
        memoryWipeDelay: number,
        onCleanup?: (executionId: string) => void
    ): void {
        const cleanup = () => {
            // Destroy secure buffers using existing SecureBuffer.destroy()
            for (const buffer of context.secureBuffers.values()) {
                buffer.destroy();
            }

            // Clear encrypted parameters
            context.encryptedParameters.clear();

            if (onCleanup) {
                onCleanup(context.executionId);
            }
        };

        if (memoryWipeDelay > 0) {
            setTimeout(cleanup, memoryWipeDelay);
        } else {
            cleanup();
        }
    }
}

