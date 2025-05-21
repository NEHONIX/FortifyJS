import { FortifyJS } from "../dist";

// Side-Channel Attack Protection
// =============================

// Constant-time comparison to prevent timing attacks
function demonstrateSideChannelProtection() {
    console.log("\n🛡️ Side-Channel Attack Protection");
    console.log("--------------------------------");

    const password = "secure-password-123";
    const validAttempt = "secure-password-123";
    const invalidAttempt = "wrong-password-456";

    // Regular comparison (vulnerable to timing attacks)
    console.log(`Regular comparison (valid): ${password === validAttempt}`);

    // Constant-time comparison (resistant to timing attacks)
    console.log(
        `Constant-time comparison (valid): ${FortifyJS.constantTimeEqual(
            password,
            validAttempt
        )}`
    );
    console.log(
        `Constant-time comparison (invalid): ${FortifyJS.constantTimeEqual(
            password,
            invalidAttempt
        )}`
    );

    // Secure modular exponentiation (for cryptographic operations)
    const base = 123n;
    const exponent = 456n;
    const modulus = 789n;
    console.log(
        `Secure modular exponentiation: ${base}^${exponent} mod ${modulus} = ${FortifyJS.secureModPow(
            base,
            exponent,
            modulus
        )}`
    );
}

// Memory-Hard Key Derivation
// =========================

// Derive a key using memory-hard algorithms
async function demonstrateMemoryHardKeyDerivation() {
    console.log("\n🧠 Memory-Hard Key Derivation");
    console.log("---------------------------");

    const password = "my-secure-password";

    console.log("Deriving key using memory-hard Argon2...");
    const argon2Result = FortifyJS.deriveKeyMemoryHard(password, {
        memoryCost: 1024, // Lower value for demo purposes (1MB)
        timeCost: 2,
        parallelism: 1,
        keyLength: 32,
    });

    console.log(
        `Derived key (Argon2): ${argon2Result.derivedKey.substring(0, 32)}...`
    );
    console.log(
        `Memory used: ${argon2Result.metrics.memoryUsedBytes / 1024} KB`
    );
    console.log(`Time taken: ${argon2Result.metrics.timeTakenMs} ms`);

    console.log("\nDeriving key using memory-hard Balloon...");
    const balloonResult = FortifyJS.deriveKeyBalloon(password, {
        memoryCost: 1024, // Lower value for demo purposes (1MB)
        timeCost: 2,
        keyLength: 32,
    });

    console.log(
        `Derived key (Balloon): ${balloonResult.derivedKey.substring(0, 32)}...`
    );
    console.log(
        `Memory used: ${balloonResult.metrics.memoryUsedBytes / 1024} KB`
    );
    console.log(`Time taken: ${balloonResult.metrics.timeTakenMs} ms`);
}

// Post-Quantum Cryptography
// =======================

// Use quantum-resistant cryptographic algorithms
function demonstratePostQuantumCryptography() {
    console.log("\n🔮 Post-Quantum Cryptography");
    console.log("---------------------------");

    // Lamport signatures (hash-based, quantum-resistant)
    console.log("Generating quantum-resistant Lamport keypair...");
    const lamportKeypair = FortifyJS.generateQuantumResistantKeypair();
    console.log(
        `Public key (first 32 chars): ${lamportKeypair.publicKey.substring(
            0,
            32
        )}...`
    );
    console.log(
        `Private key (first 32 chars): ${lamportKeypair.privateKey.substring(
            0,
            32
        )}...`
    );

    // Sign a message
    const message = "This message is signed with a quantum-resistant algorithm";
    console.log(`\nSigning message: "${message}"`);
    const signature = FortifyJS.quantumResistantSign(
        message,
        lamportKeypair.privateKey
    );
    console.log(`Signature (first 32 chars): ${signature.substring(0, 32)}...`);

    // Verify the signature
    const isValid = FortifyJS.quantumResistantVerify(
        message,
        signature,
        lamportKeypair.publicKey
    );
    console.log(`Signature verification: ${isValid ? "Valid ✓" : "Invalid ✗"}`);

    // Ring-LWE encryption (lattice-based, quantum-resistant)
    console.log("\nGenerating Ring-LWE keypair for post-quantum encryption...");
    const lweKeypair = FortifyJS.generateRingLweKeypair();

    // Encrypt a message
    const plaintext = "Secret message protected against quantum computers";
    console.log(`Encrypting message: "${plaintext}"`);
    const ciphertext = FortifyJS.ringLweEncrypt(
        plaintext,
        lweKeypair.publicKey
    );
    console.log(
        `Ciphertext (first 32 chars): ${ciphertext.substring(0, 32)}...`
    );

    // Decrypt the message
    const decrypted = FortifyJS.ringLweDecrypt(
        ciphertext,
        lweKeypair.privateKey
    );
    const decryptedText = new TextDecoder()
        .decode(decrypted)
        .replace(/\0/g, "");
    console.log(`Decrypted message: "${decryptedText}"`);
}

// Secure Memory Management
// ======================

// Protect sensitive data in memory
function demonstrateSecureMemoryManagement() {
    console.log("\n🔒 Secure Memory Management");
    console.log("--------------------------");

    // Create a secure buffer
    console.log("Creating secure buffer with sensitive data...");
    const secureBuffer = FortifyJS.createSecureBuffer(32);
    const buffer = secureBuffer.getBuffer();

    // Fill with sample data (ASCII 'A' to 'Z' and beyond)
    for (let i = 0; i < buffer.length; i++) {
        buffer[i] = i + 65;
    }

    console.log(`Secure buffer content: ${new TextDecoder().decode(buffer)}`);

    // Create a secure string
    const secureString = FortifyJS.createSecureString(
        "This is a sensitive string that will be cleared"
    );
    console.log(`Secure string: ${secureString.toString()}`);

    // Create a secure object
    const secureObject = FortifyJS.createSecureObject({
        username: "admin",
        password: "super-secret-password",
        apiKey: "1234567890abcdef",
    });
    console.log(`Secure object username: ${secureObject.get("username")}`);

    // Demonstrate secure wiping
    console.log("\nWiping secure buffer, string, and object...");
    secureBuffer.destroy();
    secureString.clear();
    secureObject.clear();

    try {
        console.log(
            `Secure buffer after wiping: ${new TextDecoder().decode(
                secureBuffer.getBuffer()
            )}`
        );
    } catch (e) {
        console.log(
            `Secure buffer after wiping: Destroyed ✓ (${(e as Error).message})`
        );
    }

    console.log(`Secure string after clearing: "${secureString.toString()}"`);
    console.log(
        `Secure object after clearing: ${
            secureObject.has("password") ? "Still contains data" : "Cleared ✓"
        }`
    );
}

// Canary Tokens
// ============

// Detect unauthorized access with canary tokens
function demonstrateCanaryTokens() {
    console.log("\n🐦 Canary Tokens");
    console.log("---------------");

    // Create a canary token
    console.log("Creating canary token...");
    const canaryToken = FortifyJS.createCanaryToken({
        context: { purpose: "demo", createdAt: new Date().toISOString() },
        callback: (context: Record<string, any>) => {
            console.log(`🚨 Canary callback triggered with context:`, context);
        },
    });
    console.log(`Canary token: ${canaryToken.substring(0, 32)}...`);

    // Create a canary object
    const sensitiveData = {
        username: "admin",
        password: "super-secret-password",
        apiKey: "1234567890abcdef",
    };

    console.log("\nCreating canary object with sensitive data...");
    const canaryObject = FortifyJS.createCanaryObject(sensitiveData, {
        callback: (context: Record<string, any>) => {
            console.log(`🚨 Canary object accessed! Context:`, context);
        },
    });

    // Create a canary function
    const originalFunction = (x: number, y: number) => x + y;
    console.log("\nCreating canary function...");
    const canaryFunction = FortifyJS.createCanaryFunction(originalFunction, {
        callback: (context: Record<string, any>) => {
            console.log(`🚨 Canary function called! Context:`, context);
        },
    });

    // Trigger the canaries
    console.log("\nTriggering canaries...");
    console.log(`Accessing canary object: username = ${canaryObject.username}`);
    console.log(`Calling canary function: 2 + 3 = ${canaryFunction(2, 3)}`);
    FortifyJS.triggerCanaryToken(canaryToken, {
        source: "manual",
        timestamp: Date.now(),
    });
}

// Runtime Security Verification
// ===========================

// Verify the security of the runtime environment
function demonstrateRuntimeSecurityVerification() {
    console.log("\n🔍 Runtime Security Verification");
    console.log("------------------------------");

    console.log("Verifying runtime security...");
    const securityResult = FortifyJS.verifyRuntimeSecurity({
        checkDebugger: true,
        checkExtensions: true,
        checkEnvironment: true,
        checkRandom: true,
        checkPrototypePollution: true,
        checkFunctionHijacking: true,
        checkSecureContext: true,
    });

    console.log(`Security score: ${securityResult.score}/100`);
    console.log(
        `Secure environment: ${securityResult.secure ? "Yes ✓" : "No ✗"}`
    );

    if (securityResult.issues.length > 0) {
        console.log("\nSecurity issues detected:");
        securityResult.issues.forEach(
            (issue: {
                type: string;
                description: string;
                severity: number;
            }) => {
                console.log(
                    `- ${issue.type}: ${issue.description} (Severity: ${issue.severity}/100)`
                );
            }
        );
    } else {
        console.log("No security issues detected.");
    }

    console.log("\nSecurity checks performed:");
    securityResult.checks.forEach(
        (check: { name: string; passed: boolean }) => {
            console.log(
                `- ${check.name}: ${check.passed ? "Passed ✓" : "Failed ✗"}`
            );
        }
    );
}

// Tamper-Evident Logging
// =====================

// Create cryptographically verifiable logs
function demonstrateTamperEvidentLogging() {
    console.log("\n📝 Tamper-Evident Logging");
    console.log("------------------------");

    // Create a tamper-evident logger
    console.log("Creating tamper-evident logger...");
    const logger = FortifyJS.createTamperEvidentLogger("demo-secret-key");

    // Add some log entries
    logger.info("System initialized", { version: "1.0.0" });
    logger.warning("Unusual login attempt", {
        ip: "192.168.1.100",
        attempts: 3,
    });
    logger.error("Database connection failed", { error: "Timeout" });

    // Get all entries
    const entries = logger.getEntries();
    console.log(`Added ${entries.length} log entries`);

    // Verify the log chain
    console.log("\nVerifying log chain integrity...");
    const verificationResult = logger.verify();
    console.log(
        `Log chain valid: ${verificationResult.valid ? "Yes ✓" : "No ✗"}`
    );

    if (!verificationResult.valid) {
        console.log("Integrity issues:");
        if (verificationResult.tamperedEntries.length > 0) {
            console.log(
                `- Tampered entries: ${verificationResult.tamperedEntries.join(
                    ", "
                )}`
            );
        }
        if (verificationResult.missingEntries.length > 0) {
            console.log(
                `- Missing entries: ${verificationResult.missingEntries.join(
                    ", "
                )}`
            );
        }
        if (verificationResult.invalidEntries.length > 0) {
            console.log(
                `- Invalid entries: ${verificationResult.invalidEntries.join(
                    ", "
                )}`
            );
        }
    }

    // Export logs
    const exportedLogs = logger.export();
    console.log(`Exported ${JSON.parse(exportedLogs).length} log entries`);
}

// Run all demonstrations
async function runDemo() {
    console.log("🔒 FortifyJS Advanced Security Features Demo");
    console.log("===========================================");

    demonstrateSideChannelProtection();
    await demonstrateMemoryHardKeyDerivation();
    demonstratePostQuantumCryptography();
    demonstrateSecureMemoryManagement();
    demonstrateCanaryTokens();
    demonstrateRuntimeSecurityVerification();
    demonstrateTamperEvidentLogging();

    console.log("\n🔒 Advanced Security Demo Complete");
}

runDemo().catch(console.error);
