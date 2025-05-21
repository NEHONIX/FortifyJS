// Simple test for FortifyJS
const { FortifyJS } = require("../src");

console.log("FortifyJS Simple Test");
console.log("====================");

// Test secure token generation
const token = FortifyJS.generateSecureToken();
console.log("Secure Token:", token);

// Test secure hash
const hash = FortifyJS.secureHash("test-password");
console.log("Secure Hash:", hash);

// Test constant-time comparison
const equal = FortifyJS.constantTimeEqual("secret", "secret");
console.log("Constant-time equal:", equal);

// Test secure string
const secureString = FortifyJS.createSecureString("sensitive-data");
console.log("Secure String:", secureString.toString());
secureString.clear();
console.log("Secure String after clear:", secureString.toString());

console.log("Test completed successfully!");

