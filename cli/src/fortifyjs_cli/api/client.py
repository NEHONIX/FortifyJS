"""
API client for communicating with the FortifyJS library
"""

import os
import sys
import json
import subprocess
import tempfile
from typing import Dict, Any, Optional, Union, List
from pathlib import Path

from fortifyjs_cli.utils.logging import get_logger

logger = get_logger(__name__)

class FortifyJSClient:
    """
    Client for communicating with the FortifyJS library.
    
    This client uses Node.js to execute JavaScript code that interfaces with the FortifyJS library.
    """
    
    def __init__(self, library_path: Optional[str] = None):
        """
        Initialize the FortifyJS API client.
        
        Args:
            library_path: Path to the FortifyJS library. If None, will try to find it automatically.
        """
        self.library_path = self._find_library_path(library_path)
        self._check_node_available()
    
    def _find_library_path(self, library_path: Optional[str] = None) -> str:
        """
        Find the path to the FortifyJS library.
        
        Args:
            library_path: Path provided by the user
            
        Returns:
            Path to the FortifyJS library
        """
        if library_path and os.path.exists(library_path):
            return os.path.abspath(library_path)
        
        # Try to find the library in standard locations
        possible_paths = [
            # Current directory
            os.path.join(os.getcwd(), "node_modules", "fortifyjs"),
            # Parent directory (if CLI is in a subdirectory)
            os.path.join(os.getcwd(), "..", "node_modules", "fortifyjs"),
            # Two levels up
            os.path.join(os.getcwd(), "..", "..", "node_modules", "fortifyjs"),
            # Relative to this file
            os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "node_modules", "fortifyjs"),
            os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "..", "node_modules", "fortifyjs"),
            # Dist directory
            os.path.join(os.getcwd(), "dist"),
            os.path.join(os.getcwd(), "..", "dist"),
            # Lib directory
            os.path.join(os.getcwd(), "lib"),
            os.path.join(os.getcwd(), "..", "lib"),
            # src directory
            os.path.join(os.getcwd(), "src"),
            os.path.join(os.getcwd(), "..", "src"),
        ]
        
        for path in possible_paths:
            if os.path.exists(path):
                logger.debug(f"Found FortifyJS library at: {path}")
                return os.path.abspath(path)
        
        # If we can't find the library, use the parent directory of the CLI
        # This assumes the CLI is in a subdirectory of the main project
        default_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
        logger.warning(f"Could not find FortifyJS library, using default path: {default_path}")
        return default_path
    
    def _check_node_available(self) -> None:
        """
        Check if Node.js is available on the system.
        
        Raises:
            RuntimeError: If Node.js is not available
        """
        try:
            subprocess.run(
                ["node", "--version"], 
                stdout=subprocess.PIPE, 
                stderr=subprocess.PIPE,
                check=True
            )
        except (subprocess.SubprocessError, FileNotFoundError):
            raise RuntimeError(
                "Node.js is required but not found. Please install Node.js to use the FortifyJS CLI."
            )
    
    def execute_js(self, script: str, input_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Execute a JavaScript script using Node.js.
        
        Args:
            script: JavaScript code to execute
            input_data: Input data to pass to the script
            
        Returns:
            Output from the script
        """
        # Create a temporary file for the script
        with tempfile.NamedTemporaryFile(suffix=".js", mode="w", delete=False) as script_file:
            # Prepare the script with library path and input data
            full_script = f"""
// Set up the environment
const path = require('path');
const fs = require('fs');

// Input data
const inputData = {json.dumps(input_data or {})};

// Library path
const libraryPath = "{self.library_path.replace('\\', '\\\\')}";

// Try to require the FortifyJS library
let FortifyJS;
try {{
    // Try to require from the library path
    FortifyJS = require(path.join(libraryPath, 'index.js'));
}} catch (e) {{
    try {{
        // Try to require from node_modules
        FortifyJS = require('fortifyjs');
    }} catch (innerError) {{
        console.error('Error loading FortifyJS library:', e.message);
        console.error('Inner error:', innerError.message);
        process.exit(1);
    }}
}}

// Main script
async function main() {{
    try {{
        {script}
    }} catch (error) {{
        console.error(JSON.stringify({{
            success: false,
            error: error.message,
            stack: error.stack
        }}));
        process.exit(1);
    }}
}}

// Run the main function
main();
"""
            script_file.write(full_script)
            script_file.flush()
            script_path = script_file.name
        
        try:
            # Execute the script with Node.js
            result = subprocess.run(
                ["node", script_path],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                check=True
            )
            
            # Parse the output
            try:
                return json.loads(result.stdout)
            except json.JSONDecodeError:
                # If the output is not valid JSON, return it as a string
                return {
                    "success": True,
                    "result": result.stdout.strip()
                }
                
        except subprocess.CalledProcessError as e:
            # Try to parse error output as JSON
            try:
                error_data = json.loads(e.stderr or e.stdout)
                return error_data
            except json.JSONDecodeError:
                # If the error output is not valid JSON, return it as a string
                return {
                    "success": False,
                    "error": (e.stderr or e.stdout).strip()
                }
        finally:
            # Clean up the temporary file
            try:
                os.unlink(script_path)
            except:
                pass
    
    def generate_key(self, key_type: str, options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Generate a cryptographic key using FortifyJS.
        
        Args:
            key_type: Type of key to generate (e.g., 'ed25519', 'rsa', 'aes')
            options: Additional options for key generation
            
        Returns:
            Generated key data
        """
        script = """
        // Generate a key based on the input parameters
        const keyType = inputData.keyType;
        const options = inputData.options || {};
        
        let result;
        
        if (keyType === 'ed25519') {
            // Generate Ed25519 key pair
            const keyPair = FortifyJS.generateKeyPair('ed25519', options);
            result = {
                publicKey: keyPair.publicKey,
                privateKey: keyPair.privateKey,
                type: 'ed25519'
            };
        } else if (keyType === 'rsa') {
            // Generate RSA key pair
            const keySize = options.bits || 2048;
            const keyPair = FortifyJS.generateKeyPair('rsa', { ...options, keySize });
            result = {
                publicKey: keyPair.publicKey,
                privateKey: keyPair.privateKey,
                type: 'rsa',
                bits: keySize
            };
        } else if (keyType.startsWith('aes-')) {
            // Generate symmetric AES key
            const keySize = parseInt(keyType.split('-')[1]) / 8; // Convert bits to bytes
            const key = FortifyJS.generateSecureToken(keySize);
            result = {
                key: key,
                type: keyType
            };
        } else {
            throw new Error(`Unsupported key type: ${keyType}`);
        }
        
        console.log(JSON.stringify({
            success: true,
            result: result
        }));
        """
        
        return self.execute_js(
            script,
            {
                "keyType": key_type,
                "options": options or {}
            }
        )
    
    def hash_password(self, password: str, algorithm: str, options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Hash a password using FortifyJS.
        
        Args:
            password: Password to hash
            algorithm: Hashing algorithm to use
            options: Additional options for hashing
            
        Returns:
            Hashed password data
        """
        script = """
        // Hash a password based on the input parameters
        const password = inputData.password;
        const algorithm = inputData.algorithm;
        const options = inputData.options || {};
        
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
            
            result = FortifyJS.hashPassword(password, { ...hashOptions, algorithm: 'argon2id' });
        } else if (algorithm === 'pbkdf2') {
            // Use PBKDF2 for password hashing
            const hashOptions = {
                iterations: options.iterations || 600000,
                salt: options.salt,
                outputFormat: options.format || 'encoded'
            };
            
            result = FortifyJS.hashPassword(password, { ...hashOptions, algorithm: 'pbkdf2' });
        } else {
            throw new Error(`Unsupported hashing algorithm: ${algorithm}`);
        }
        
        console.log(JSON.stringify({
            success: true,
            result: result
        }));
        """
        
        return self.execute_js(
            script,
            {
                "password": password,
                "algorithm": algorithm,
                "options": options or {}
            }
        )
    
    def verify_password(self, password: str, hash_string: str) -> Dict[str, Any]:
        """
        Verify a password against a hash using FortifyJS.
        
        Args:
            password: Password to verify
            hash_string: Hash to verify against
            
        Returns:
            Verification result
        """
        script = """
        // Verify a password against a hash
        const password = inputData.password;
        const hashString = inputData.hashString;
        
        const isValid = FortifyJS.verifyPassword(password, hashString);
        
        console.log(JSON.stringify({
            success: true,
            result: {
                isValid: isValid
            }
        }));
        """
        
        return self.execute_js(
            script,
            {
                "password": password,
                "hashString": hash_string
            }
        )
    
    def encrypt_data(self, data: Union[str, bytes], key: Union[str, bytes], algorithm: str, options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Encrypt data using FortifyJS.
        
        Args:
            data: Data to encrypt
            key: Encryption key
            algorithm: Encryption algorithm to use
            options: Additional options for encryption
            
        Returns:
            Encrypted data
        """
        # Convert data and key to base64 if they are bytes
        if isinstance(data, bytes):
            data = data.decode('utf-8')
        if isinstance(key, bytes):
            key = key.decode('utf-8')
        
        script = """
        // Encrypt data based on the input parameters
        const data = inputData.data;
        const key = inputData.key;
        const algorithm = inputData.algorithm;
        const options = inputData.options || {};
        
        const encryptOptions = {
            algorithm: algorithm,
            ...options
        };
        
        const result = FortifyJS.encrypt(data, key, encryptOptions);
        
        console.log(JSON.stringify({
            success: true,
            result: result
        }));
        """
        
        return self.execute_js(
            script,
            {
                "data": data,
                "key": key,
                "algorithm": algorithm,
                "options": options or {}
            }
        )
    
    def decrypt_data(self, encrypted_data: Union[str, Dict[str, Any]], key: Union[str, bytes], options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Decrypt data using FortifyJS.
        
        Args:
            encrypted_data: Data to decrypt
            key: Decryption key
            options: Additional options for decryption
            
        Returns:
            Decrypted data
        """
        # Convert key to base64 if it is bytes
        if isinstance(key, bytes):
            key = key.decode('utf-8')
        
        script = """
        // Decrypt data based on the input parameters
        const encryptedData = inputData.encryptedData;
        const key = inputData.key;
        const options = inputData.options || {};
        
        const result = FortifyJS.decrypt(encryptedData, key, options);
        
        console.log(JSON.stringify({
            success: true,
            result: result
        }));
        """
        
        return self.execute_js(
            script,
            {
                "encryptedData": encrypted_data,
                "key": key,
                "options": options or {}
            }
        )
    
    def generate_token(self, token_type: str, options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Generate a secure token using FortifyJS.
        
        Args:
            token_type: Type of token to generate
            options: Additional options for token generation
            
        Returns:
            Generated token data
        """
        script = """
        // Generate a token based on the input parameters
        const tokenType = inputData.tokenType;
        const options = inputData.options || {};
        
        let result;
        
        if (tokenType === 'api') {
            // Generate API token
            const length = options.length || 32;
            const token = FortifyJS.generateAPIKey(length);
            result = {
                token: token,
                type: 'api'
            };
        } else if (tokenType === 'session') {
            // Generate session token
            const length = options.length || 32;
            const token = FortifyJS.generateSessionToken(length);
            result = {
                token: token,
                type: 'session'
            };
        } else if (tokenType === 'jwt') {
            // Generate JWT token
            const payload = options.payload || { sub: 'user', iat: Math.floor(Date.now() / 1000) };
            const secret = options.secret || FortifyJS.generateJWTSecret();
            const expiresIn = options.expiresIn || '1h';
            
            const token = FortifyJS.generateJWT(payload, secret, { expiresIn });
            result = {
                token: token,
                type: 'jwt',
                secret: secret
            };
        } else {
            // Generate generic secure token
            const length = options.length || 32;
            const token = FortifyJS.generateSecureToken(length);
            result = {
                token: token,
                type: 'generic'
            };
        }
        
        console.log(JSON.stringify({
            success: true,
            result: result
        }));
        """
        
        return self.execute_js(
            script,
            {
                "tokenType": token_type,
                "options": options or {}
            }
        )
    
    def derive_key_memory_hard(self, password: str, algorithm: str, options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Derive a key using a memory-hard function in FortifyJS.
        
        Args:
            password: Password to derive key from
            algorithm: Memory-hard algorithm to use
            options: Additional options for key derivation
            
        Returns:
            Derived key data
        """
        script = """
        // Derive a key using a memory-hard function
        const password = inputData.password;
        const algorithm = inputData.algorithm;
        const options = inputData.options || {};
        
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
            
            result = FortifyJS.deriveKeyMemoryHard(password, { ...deriveOptions, algorithm: 'argon2id' });
        } else if (algorithm === 'balloon') {
            // Use Balloon hashing for key derivation
            const deriveOptions = {
                memoryCost: options.memoryCost || 16384,
                timeCost: options.timeCost || 4,
                parallelism: options.parallelism || 1,
                keyLength: options.outputLength || 32,
                salt: options.salt
            };
            
            result = FortifyJS.deriveKeyBalloon(password, deriveOptions);
        } else {
            throw new Error(`Unsupported memory-hard algorithm: ${algorithm}`);
        }
        
        console.log(JSON.stringify({
            success: true,
            result: result
        }));
        """
        
        return self.execute_js(
            script,
            {
                "password": password,
                "algorithm": algorithm,
                "options": options or {}
            }
        )
