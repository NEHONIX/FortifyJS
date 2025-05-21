"""
Configuration management for FortifyJS CLI
"""

import os
import yaml
from pathlib import Path
from typing import Dict, Any

# Default configuration
DEFAULT_CONFIG = {
    "default_key_type": "ed25519",
    "default_hash_algorithm": "argon2id",
    "default_encryption_algorithm": "aes-256-gcm",
    "log_level": "info",
    "output_format": "text",
    "key_storage_path": None,  # Will be set based on platform
    "library_path": None,      # Path to the FortifyJS library
}

def get_config_path() -> str:
    """Get the path to the configuration file based on the platform."""
    if os.name == "nt":  # Windows
        config_dir = os.path.join(os.environ.get("APPDATA", ""), "fortifyjs")
    else:  # Linux/macOS
        config_dir = os.path.join(os.path.expanduser("~"), ".config", "fortifyjs")

    # Create config directory if it doesn't exist
    os.makedirs(config_dir, exist_ok=True)

    return os.path.join(config_dir, "config.yaml")

def get_key_storage_path() -> str:
    """Get the path to the key storage directory based on the platform."""
    if os.name == "nt":  # Windows
        base_dir = os.path.join(os.environ.get("APPDATA", ""), "fortifyjs")
    else:  # Linux/macOS
        base_dir = os.path.join(os.path.expanduser("~"), ".config", "fortifyjs")

    key_dir = os.path.join(base_dir, "keys")
    os.makedirs(key_dir, exist_ok=True)

    return key_dir

def load_config(config_path: str = None) -> Dict[str, Any]:
    """
    Load configuration from the specified path or create a default configuration.

    Args:
        config_path: Path to the configuration file

    Returns:
        Dictionary containing configuration values
    """
    if config_path is None:
        config_path = get_config_path()

    # Start with default configuration
    config = DEFAULT_CONFIG.copy()

    # Set platform-specific defaults
    config["key_storage_path"] = get_key_storage_path()

    # Try to load configuration from file
    try:
        if os.path.exists(config_path):
            with open(config_path, "r") as f:
                user_config = yaml.safe_load(f)
                if user_config and isinstance(user_config, dict):
                    config.update(user_config)
    except Exception as e:
        print(f"Warning: Failed to load configuration from {config_path}: {e}")
        # Continue with default configuration

    return config

def save_config(config: Dict[str, Any], config_path: str = None) -> None:
    """
    Save configuration to the specified path.

    Args:
        config: Configuration dictionary to save
        config_path: Path to save the configuration to
    """
    if config_path is None:
        config_path = get_config_path()

    # Ensure directory exists
    os.makedirs(os.path.dirname(config_path), exist_ok=True)

    # Save configuration
    with open(config_path, "w") as f:
        yaml.dump(config, f, default_flow_style=False)
