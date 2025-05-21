// This is a simple test script to verify the security features
// It uses the TypeScript files directly with ts-node

// Run this script with: npx ts-node test-security.js

import { FortifyJS } from './src/index.js';

console.log('FortifyJS Security Features Test');
console.log('===============================');

// Test secure token generation
const token = FortifyJS.generateSecureToken();
console.log('Secure Token:', token);

// Test secure hash
const hash = FortifyJS.secureHash('test-password');
console.log('Secure Hash:', hash);

// Test constant-time comparison
const equal = FortifyJS.constantTimeEqual('secret', 'secret');
console.log('Constant-time equal:', equal);

// Test secure string
const secureString = FortifyJS.createSecureString('sensitive-data');
console.log('Secure String:', secureString.toString());
secureString.clear();
console.log('Secure String after clear:', secureString.toString());

console.log('Test completed successfully!');
