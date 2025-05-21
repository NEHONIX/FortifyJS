import {
    FortifyJS,
    SecureTokenOptions,
    HashOptions,
    KeyDerivationOptions,
} from "FortifyJS";

// Generate a secure token with typed options
const tokenOptions: SecureTokenOptions = {
    length: 32,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: false,
    excludeSimilarCharacters: true,
    entropy: "maximum",
};

const token = FortifyJS.generateSecureToken(tokenOptions);
console.log("Secure Token:", token);

// Hash a password with typed options
const hashOptions: HashOptions = {
    algorithm: "sha256",
    iterations: 10000,
    salt: "random-salt",
    pepper: "app-specific-pepper",
    outputFormat: "hex",
};

const hash = FortifyJS.secureHash("my-password", hashOptions);
console.log("Password Hash:", hash);

// Derive a key with typed options
const keyOptions: KeyDerivationOptions = {
    algorithm: "pbkdf2",
    iterations: 100000,
    salt: new TextEncoder().encode("salt"),
    keyLength: 32,
    hashFunction: "sha256",
};

const key = FortifyJS.deriveKey("password", keyOptions);
console.log("Derived Key:", key);

// API key with prefix
const apiKey = FortifyJS.generateAPIKey("myapp");
console.log("API Key:", apiKey);

// API key with options object
const apiKeyWithOptions = FortifyJS.generateAPIKey({
    prefix: "myapp",
    includeTimestamp: true,
    randomPartLength: 32,
    separator: "_",
});
console.log("API Key with Options:", apiKeyWithOptions);

// Session token with user info
const sessionToken = FortifyJS.generateSessionToken({
    userId: "123",
    ipAddress: "127.0.0.1",
    userAgent: "typescript-example",
    expiresIn: 3600, // 1 hour
});
console.log("Session Token:", sessionToken);

// Password strength analysis
const passwordStrength = FortifyJS.calculatePasswordStrength("MyP@ssw0rd123");
console.log("Password Strength:", passwordStrength);

// Security tests
const securityTests = FortifyJS.runSecurityTests();
console.log("Security Tests:", securityTests);

// Statistics
const stats = FortifyJS.getStats();
console.log("Statistics:", stats);
