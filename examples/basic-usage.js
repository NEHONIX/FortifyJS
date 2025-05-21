const { FortifyJS } = require("FortifyJS");

// Generate a secure token
const token = FortifyJS.generateSecureToken({
    length: 32,
    entropy: "maximum",
});
console.log("Secure Token:", token);

// Create an API key
const apiKey = FortifyJS.generateAPIKey("myapp");
console.log("API Key:", apiKey);

// Hash a password
const hash = FortifyJS.secureHash("my-password", {
    algorithm: "sha256",
    iterations: 10000,
    salt: "random-salt",
});
console.log("Password Hash:", hash);

// Derive a key from a password
const key = FortifyJS.deriveKey("password", {
    algorithm: "pbkdf2",
    iterations: 100000,
    salt: new TextEncoder().encode("salt"),
    keyLength: 32,
});
console.log("Derived Key:", key);

// Generate a JWT secret
const jwtSecret = FortifyJS.generateJWTSecret(64);
console.log("JWT Secret:", jwtSecret);

// Generate a session token
const sessionToken = FortifyJS.generateSessionToken({
    userId: "123",
    ipAddress: "127.0.0.1",
    userAgent: "example-browser",
});
console.log("Session Token:", sessionToken);

// Generate a TOTP secret
const totpSecret = FortifyJS.generateTOTPSecret();
console.log("TOTP Secret:", totpSecret);

// Analyze password strength
const passwordStrength = FortifyJS.calculatePasswordStrength("MyP@ssw0rd123");
console.log("Password Strength:", passwordStrength);

// Run security tests
const securityTests = FortifyJS.runSecurityTests();
console.log("Security Tests:", securityTests);

// Get statistics
const stats = FortifyJS.getStats();
console.log("Statistics:", stats);
