#!/usr/bin/env python3
"""
Test script for the FortifyJS API client
"""

import os
import sys
import json
from src.fortifyjs_cli.api.client import FortifyJSClient

def test_generate_key():
    """Test generating a key using the API."""
    print("Testing key generation...")
    
    # Initialize the client
    client = FortifyJSClient()
    
    # Generate an Ed25519 key
    print("Generating Ed25519 key...")
    result = client.generate_key("ed25519")
    
    if not result.get("success", False):
        print(f"Error: {result.get('error', 'Unknown error')}")
        return False
    
    print("Ed25519 key generated successfully:")
    print(json.dumps(result.get("result", {}), indent=2))
    
    # Generate an RSA key
    print("\nGenerating RSA key...")
    result = client.generate_key("rsa", {"bits": 2048})
    
    if not result.get("success", False):
        print(f"Error: {result.get('error', 'Unknown error')}")
        return False
    
    print("RSA key generated successfully")
    
    # Generate an AES key
    print("\nGenerating AES-256 key...")
    result = client.generate_key("aes-256")
    
    if not result.get("success", False):
        print(f"Error: {result.get('error', 'Unknown error')}")
        return False
    
    print("AES-256 key generated successfully")
    
    return True

def test_hash_password():
    """Test hashing a password using the API."""
    print("\nTesting password hashing...")
    
    # Initialize the client
    client = FortifyJSClient()
    
    # Hash a password using Argon2id
    print("Hashing password with Argon2id...")
    result = client.hash_password("secure-password", "argon2id")
    
    if not result.get("success", False):
        print(f"Error: {result.get('error', 'Unknown error')}")
        return False
    
    print("Password hashed successfully:")
    hash_result = result.get("result", "")
    print(hash_result)
    
    # Verify the password
    print("\nVerifying password...")
    result = client.verify_password("secure-password", hash_result)
    
    if not result.get("success", False):
        print(f"Error: {result.get('error', 'Unknown error')}")
        return False
    
    is_valid = result.get("result", {}).get("isValid", False)
    print(f"Password verification result: {is_valid}")
    
    return True

def test_generate_token():
    """Test generating a token using the API."""
    print("\nTesting token generation...")
    
    # Initialize the client
    client = FortifyJSClient()
    
    # Generate an API token
    print("Generating API token...")
    result = client.generate_token("api", {"length": 32})
    
    if not result.get("success", False):
        print(f"Error: {result.get('error', 'Unknown error')}")
        return False
    
    print("API token generated successfully:")
    print(json.dumps(result.get("result", {}), indent=2))
    
    return True

def main():
    """Main function."""
    print("Testing FortifyJS API client...\n")
    
    # Test key generation
    if not test_generate_key():
        print("Key generation test failed")
        return 1
    
    # Test password hashing
    if not test_hash_password():
        print("Password hashing test failed")
        return 1
    
    # Test token generation
    if not test_generate_token():
        print("Token generation test failed")
        return 1
    
    print("\nAll tests passed successfully!")
    return 0

if __name__ == "__main__":
    sys.exit(main())
