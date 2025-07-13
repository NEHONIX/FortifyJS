// Test local import to verify the module works
console.log("🔍 Testing local FortifyJS import...");

try {
    // Test importing from local dist
    console.log("1. Testing local CJS import...");
    const fortify = require("../../dist/cjs/index.js");
    console.log("✅ Local CJS import successful");
    console.log("Available exports:", Object.keys(fortify).slice(0, 10), "...");

    // Test creating a secure object
    console.log("\n2. Testing createSecureObject...");
    if (fortify.createSecureObject) {
        const obj = fortify.createSecureObject({ test: "data" });
        console.log("✅ createSecureObject works:", obj.toString());
    } else {
        console.log("❌ createSecureObject not found");
    }

    console.log("\n🎉 Local import test completed successfully!");
} catch (error) {
    console.error("❌ Local import test failed:", error.message);
    console.error("Stack:", error.stack);
}

