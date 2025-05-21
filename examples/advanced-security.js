import { FortifyJS } from "../src/index.js";

console.log("🔒 FortifyJS Advanced Security Features Demo");
console.log("===========================================");

// 1. Side-Channel Attack Protection
console.log("\n1. Side-Channel Attack Protection");
console.log("--------------------------------");

// Constant-time comparison to prevent timing attacks
const string1 = "secure-password-123";
const string2 = "secure-password-123";
const string3 = "wrong-password-456";

console.log(
    `Comparing "${string1}" and "${string2}" (constant time): ${FortifyJS.constantTimeEqual(
        string1,
        string2
    )}`
);

console.log(
    `Comparing "${string1}" and "${string3}" (constant time): ${FortifyJS.constantTimeEqual(
        string1,
        string3
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

// 2. Memory-Hard Key Derivation
console.log("\n2. Memory-Hard Key Derivation");
console.log("----------------------------");

// Derive a key using memory-hard Argon2
const password = "my-secure-password";
console.log("Deriving key using memory-hard Argon2...");
const argon2Result = FortifyJS.deriveKeyMemoryHard(password, {
    memoryCost: 1024, // Lower value for demo purposes
    timeCost: 2,
    keyLength: 32,
});
console.log(`Derived key: ${argon2Result.derivedKey.substring(0, 32)}...`);
console.log(`Memory used: ${argon2Result.metrics.memoryUsedBytes / 1024} KB`);
console.log(`Time taken: ${argon2Result.metrics.timeTakenMs} ms`);

// 3. Post-Quantum Cryptography
console.log("\n3. Post-Quantum Cryptography");
console.log("---------------------------");

// Generate quantum-resistant keypair
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

// Sign a message with quantum-resistant signature
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

// 4. Secure Memory Management
console.log("\n4. Secure Memory Management");
console.log("--------------------------");

// Create a secure buffer that automatically zeros when destroyed
console.log("Creating secure buffer with sensitive data...");
const secureBuffer = FortifyJS.createSecureBuffer(32);
for (let i = 0; i < 32; i++) {
    secureBuffer.getBuffer()[i] = i + 65; // ASCII 'A' to 'Z' and beyond
}
console.log(
    `Secure buffer content: ${new TextDecoder().decode(
        secureBuffer.getBuffer()
    )}`
);

// Create a secure string
const secureString = FortifyJS.createSecureString(
    "This is a sensitive string that will be cleared"
);
console.log(`Secure string: ${secureString.toString()}`);

// Demonstrate secure wiping
console.log("\nWiping secure buffer and string...");
secureBuffer.destroy();
secureString.clear();

console.log(
    `Secure buffer after wiping: ${
        secureBuffer.isDestroyed
            ? "Destroyed ✓"
            : new TextDecoder().decode(secureBuffer.getBuffer())
    }`
);
console.log(`Secure string after clearing: "${secureString.toString()}"`);

// 5. Canary Tokens
console.log("\n5. Canary Tokens");
console.log("---------------");

// Create a canary token
console.log("Creating canary token...");
const canaryToken = FortifyJS.createCanaryToken({
    context: { purpose: "demo", createdAt: new Date().toISOString() },
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
    callback: (context) => {
        console.log(
            `🚨 ALERT: Canary triggered! Context: ${JSON.stringify(context)}`
        );
    },
});

// Trigger the canary by accessing the object
console.log("Accessing canary object (should trigger alert)...");
console.log(`Username from canary object: ${canaryObject.username}`);

// 6. Runtime Security Verification
console.log("\n6. Runtime Security Verification");
console.log("------------------------------");

// Verify the security of the runtime environment
console.log("Verifying runtime security...");
const securityResult = FortifyJS.verifyRuntimeSecurity({
    checkDebugger: true,
    checkExtensions: true,
    checkEnvironment: true,
    checkRandom: true,
});

console.log(`Security score: ${securityResult.score}/100`);
console.log(`Secure environment: ${securityResult.secure ? "Yes ✓" : "No ✗"}`);
if (securityResult.issues.length > 0) {
    console.log("Security issues detected:");
    securityResult.issues.forEach((issue) => {
        console.log(
            `- ${issue.type}: ${issue.description} (Severity: ${issue.severity}/100)`
        );
    });
}

// 7. Tamper-Evident Logging
console.log("\n7. Tamper-Evident Logging");
console.log("------------------------");

// Create a tamper-evident logger
console.log("Creating tamper-evident logger...");
const logger = FortifyJS.createTamperEvidentLogger("demo-secret-key");

// Add some log entries
logger.info("System initialized", { version: "1.0.0" });
logger.warning("Unusual login attempt", { ip: "192.168.1.100", attempts: 3 });
logger.error("Database connection failed", { error: "Timeout" });

// Verify the log chain
console.log("\nVerifying log chain integrity...");
const verificationResult = logger.verify();
console.log(`Log chain valid: ${verificationResult.valid ? "Yes ✓" : "No ✗"}`);

// Export logs
const exportedLogs = logger.export();
console.log(`Exported ${JSON.parse(exportedLogs).length} log entries`);

console.log("\n🔒 Advanced Security Demo Complete");
