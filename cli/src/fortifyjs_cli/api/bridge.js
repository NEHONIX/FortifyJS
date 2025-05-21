/**
 * JavaScript bridge for FortifyJS CLI
 * 
 * This file provides a bridge between the Python CLI and the FortifyJS library.
 * It exposes the FortifyJS functionality in a way that can be easily called from Python.
 */

// Import required modules
const path = require('path');
const fs = require('fs');

/**
 * Find the FortifyJS library
 * 
 * @param {string} libraryPath - Path to the FortifyJS library
 * @returns {object} - The FortifyJS library
 */
function findLibrary(libraryPath) {
    try {
        // Try to require from the library path
        return require(path.join(libraryPath, 'index.js'));
    } catch (e) {
        try {
            // Try to require from node_modules
            return require('fortifyjs');
        } catch (innerError) {
            console.error('Error loading FortifyJS library:', e.message);
            console.error('Inner error:', innerError.message);
            process.exit(1);
        }
    }
}

/**
 * Execute a FortifyJS command
 * 
 * @param {string} command - Command to execute
 * @param {object} params - Parameters for the command
 * @param {string} libraryPath - Path to the FortifyJS library
 * @returns {object} - Result of the command
 */
async function executeCommand(command, params, libraryPath) {
    // Load the FortifyJS library
    const FortifyJS = findLibrary(libraryPath);
    
    // Execute the command
    try {
        switch (command) {
            case 'generateKey':
                return await generateKey(FortifyJS, params);
            case 'hashPassword':
                return await hashPassword(FortifyJS, params);
            case 'verifyPassword':
                return await verifyPassword(FortifyJS, params);
            case 'encrypt':
                return await encrypt(FortifyJS, params);
            case 'decrypt':
                return await decrypt(FortifyJS, params);
            case 'generateToken':
                return await generateToken(FortifyJS, params);
            case 'deriveKeyMemoryHard':
                return await deriveKeyMemoryHard(FortifyJS, params);
            default:
                throw new Error(`Unknown command: ${command}`);
        }
    } catch (error) {
        return {
            success: false,
            error: error.message,
            stack: error.stack
        };
    }
}

/**
 * Generate a cryptographic key
 * 
 * @param {object} FortifyJS - The FortifyJS library
 * @param {object} params - Parameters for key generation
 * @returns {object} - Generated key data
 */
async function generateKey(FortifyJS, params) {
    const { keyType, options = {} } = params;
    
    let result;
    
    if (keyType === 'ed25519') {
        // Generate Ed25519 key pair
        const keyPair = await FortifyJS.generateKeyPair('ed25519', options);
        result = {
            publicKey: keyPair.publicKey,
            privateKey: keyPair.privateKey,
            type: 'ed25519'
        };
    } else if (keyType === 'rsa') {
        // Generate RSA key pair
        const keySize = options.bits || 2048;
        const keyPair = await FortifyJS.generateKeyPair('rsa', { ...options, keySize });
        result = {
            publicKey: keyPair.publicKey,
            privateKey: keyPair.privateKey,
            type: 'rsa',
            bits: keySize
        };
    } else if (keyType.startsWith('aes-')) {
        // Generate symmetric AES key
        const keySize = parseInt(keyType.split('-')[1]) / 8; // Convert bits to bytes
        const key = await FortifyJS.generateSecureToken(keySize);
        result = {
            key: key,
            type: keyType
        };
    } else {
        throw new Error(`Unsupported key type: ${keyType}`);
    }
    
    return {
        success: true,
        result
    };
}

/**
 * Hash a password
 * 
 * @param {object} FortifyJS - The FortifyJS library
 * @param {object} params - Parameters for password hashing
 * @returns {object} - Hashed password data
 */
async function hashPassword(FortifyJS, params) {
    const { password, algorithm, options = {} } = params;
    
    let result;
    
    if (algorithm === 'argon2id') {
        // Use Argon2id for password hashing
        const hashOptions = {
            iterations: options.iterations || 3,
            memoryCost: options.memoryCost || 65536,
            parallelism: options.parallelism || 1,
            salt: options.salt,
            outputFormat: options.format || 'encoded'
        };
        
        result = await FortifyJS.hashPassword(password, { ...hashOptions, algorithm: 'argon2id' });
    } else if (algorithm === 'pbkdf2') {
        // Use PBKDF2 for password hashing
        const hashOptions = {
            iterations: options.iterations || 600000,
            salt: options.salt,
            outputFormat: options.format || 'encoded'
        };
        
        result = await FortifyJS.hashPassword(password, { ...hashOptions, algorithm: 'pbkdf2' });
    } else {
        throw new Error(`Unsupported hashing algorithm: ${algorithm}`);
    }
    
    return {
        success: true,
        result
    };
}

/**
 * Verify a password against a hash
 * 
 * @param {object} FortifyJS - The FortifyJS library
 * @param {object} params - Parameters for password verification
 * @returns {object} - Verification result
 */
async function verifyPassword(FortifyJS, params) {
    const { password, hashString } = params;
    
    const isValid = await FortifyJS.verifyPassword(password, hashString);
    
    return {
        success: true,
        result: {
            isValid
        }
    };
}

/**
 * Encrypt data
 * 
 * @param {object} FortifyJS - The FortifyJS library
 * @param {object} params - Parameters for encryption
 * @returns {object} - Encrypted data
 */
async function encrypt(FortifyJS, params) {
    const { data, key, algorithm, options = {} } = params;
    
    const encryptOptions = {
        algorithm,
        ...options
    };
    
    const result = await FortifyJS.encrypt(data, key, encryptOptions);
    
    return {
        success: true,
        result
    };
}

/**
 * Decrypt data
 * 
 * @param {object} FortifyJS - The FortifyJS library
 * @param {object} params - Parameters for decryption
 * @returns {object} - Decrypted data
 */
async function decrypt(FortifyJS, params) {
    const { encryptedData, key, options = {} } = params;
    
    const result = await FortifyJS.decrypt(encryptedData, key, options);
    
    return {
        success: true,
        result
    };
}

/**
 * Generate a secure token
 * 
 * @param {object} FortifyJS - The FortifyJS library
 * @param {object} params - Parameters for token generation
 * @returns {object} - Generated token data
 */
async function generateToken(FortifyJS, params) {
    const { tokenType, options = {} } = params;
    
    let result;
    
    if (tokenType === 'api') {
        // Generate API token
        const length = options.length || 32;
        const token = await FortifyJS.generateAPIKey(length);
        result = {
            token,
            type: 'api'
        };
    } else if (tokenType === 'session') {
        // Generate session token
        const length = options.length || 32;
        const token = await FortifyJS.generateSessionToken(length);
        result = {
            token,
            type: 'session'
        };
    } else if (tokenType === 'jwt') {
        // Generate JWT token
        const payload = options.payload || { sub: 'user', iat: Math.floor(Date.now() / 1000) };
        const secret = options.secret || await FortifyJS.generateJWTSecret();
        const expiresIn = options.expiresIn || '1h';
        
        const token = await FortifyJS.generateJWT(payload, secret, { expiresIn });
        result = {
            token,
            type: 'jwt',
            secret
        };
    } else {
        // Generate generic secure token
        const length = options.length || 32;
        const token = await FortifyJS.generateSecureToken(length);
        result = {
            token,
            type: 'generic'
        };
    }
    
    return {
        success: true,
        result
    };
}

/**
 * Derive a key using a memory-hard function
 * 
 * @param {object} FortifyJS - The FortifyJS library
 * @param {object} params - Parameters for key derivation
 * @returns {object} - Derived key data
 */
async function deriveKeyMemoryHard(FortifyJS, params) {
    const { password, algorithm, options = {} } = params;
    
    let result;
    
    if (algorithm === 'argon2id') {
        // Use Argon2id for key derivation
        const deriveOptions = {
            memoryCost: options.memoryCost || 65536,
            timeCost: options.timeCost || 3,
            parallelism: options.parallelism || 1,
            keyLength: options.outputLength || 32,
            salt: options.salt
        };
        
        result = await FortifyJS.deriveKeyMemoryHard(password, { ...deriveOptions, algorithm: 'argon2id' });
    } else if (algorithm === 'balloon') {
        // Use Balloon hashing for key derivation
        const deriveOptions = {
            memoryCost: options.memoryCost || 16384,
            timeCost: options.timeCost || 4,
            parallelism: options.parallelism || 1,
            keyLength: options.outputLength || 32,
            salt: options.salt
        };
        
        result = await FortifyJS.deriveKeyBalloon(password, deriveOptions);
    } else {
        throw new Error(`Unsupported memory-hard algorithm: ${algorithm}`);
    }
    
    return {
        success: true,
        result
    };
}

// Export the executeCommand function
module.exports = {
    executeCommand
};
