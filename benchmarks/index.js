const { FortifyJS } = require("../dist");

// Simple benchmark function
function benchmark(name, fn, iterations = 1000) {
    console.log(`\nBenchmarking: ${name}`);
    console.log(`Iterations: ${iterations}`);

    const start = process.hrtime.bigint();

    for (let i = 0; i < iterations; i++) {
        fn();
    }

    const end = process.hrtime.bigint();
    const durationNs = Number(end - start);
    const durationMs = durationNs / 1_000_000;
    const perOperationMs = durationMs / iterations;

    console.log(`Total time: ${durationMs.toFixed(2)}ms`);
    console.log(`Per operation: ${perOperationMs.toFixed(3)}ms`);
    console.log(`Operations per second: ${Math.floor(1000 / perOperationMs)}`);

    return { name, durationMs, perOperationMs };
}

// Run benchmarks
console.log("🔍 FortifyJS Benchmarks");
console.log("========================");

// Token generation
benchmark("Generate Secure Token (32 chars)", () => {
    FortifyJS.generateSecureToken({ length: 32 });
});

benchmark("Generate Secure Token (64 chars)", () => {
    FortifyJS.generateSecureToken({ length: 64 });
});

benchmark("Generate API Key", () => {
    FortifyJS.generateAPIKey("test");
});

// Hashing
benchmark(
    "SHA-256 Hash (1 iteration)",
    () => {
        FortifyJS.secureHash("benchmark-test-data", {
            algorithm: "sha256",
            iterations: 1,
        });
    },
    100
);

benchmark(
    "SHA-256 Hash (1000 iterations)",
    () => {
        FortifyJS.secureHash("benchmark-test-data", {
            algorithm: "sha256",
            iterations: 1000,
        });
    },
    10
);

// Key derivation
benchmark(
    "PBKDF2 (1000 iterations)",
    () => {
        FortifyJS.deriveKey("benchmark-password", {
            algorithm: "pbkdf2",
            iterations: 1000,
            salt: new TextEncoder().encode("benchmark-salt"),
            keyLength: 32,
        });
    },
    10
);

benchmark(
    "PBKDF2 (10000 iterations)",
    () => {
        FortifyJS.deriveKey("benchmark-password", {
            algorithm: "pbkdf2",
            iterations: 10000,
            salt: new TextEncoder().encode("benchmark-salt"),
            keyLength: 32,
        });
    },
    5
);

// Password strength
benchmark(
    "Password Strength Analysis",
    () => {
        FortifyJS.calculatePasswordStrength("Benchmark@P@ssw0rd123!");
    },
    100
);

// Session token
benchmark(
    "Generate Session Token",
    () => {
        FortifyJS.generateSessionToken({
            userId: "benchmark-user",
            ipAddress: "127.0.0.1",
            userAgent: "benchmark-agent",
        });
    },
    100
);

// TOTP secret
benchmark(
    "Generate TOTP Secret",
    () => {
        FortifyJS.generateTOTPSecret();
    },
    100
);

// Print stats
console.log("\n📊 Statistics");
console.log("============");
console.log(JSON.stringify(FortifyJS.getStats(), null, 2));

