#!/usr/bin/env python3
"""
Build script for FortifyJS CLI
"""

import os
import sys
import subprocess
import shutil
from pathlib import Path

def run_command(command, cwd=None):
    """Run a command and return its output."""
    print(f"Running: {command}")
    result = subprocess.run(
        command,
        shell=True,
        cwd=cwd,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    
    if result.returncode != 0:
        print(f"Error: {result.stderr}")
        return False
    
    return True

def build_package():
    """Build the Python package."""
    print("Building FortifyJS CLI package...")
    
    # Clean up previous builds
    dist_dir = Path("dist")
    build_dir = Path("build")
    egg_dir = Path("fortifyjs_cli.egg-info")
    
    for dir_path in [dist_dir, build_dir, egg_dir]:
        if dir_path.exists():
            print(f"Removing {dir_path}")
            shutil.rmtree(dir_path)
    
    # Build the package
    if not run_command("python setup.py sdist bdist_wheel"):
        print("Failed to build package")
        return False
    
    print("Package built successfully")
    return True

def install_package():
    """Install the package in development mode."""
    print("Installing FortifyJS CLI in development mode...")
    
    if not run_command("pip install -e ."):
        print("Failed to install package")
        return False
    
    print("Package installed successfully")
    return True

def main():
    """Main function."""
    # Parse arguments
    if len(sys.argv) > 1:
        if sys.argv[1] == "build":
            return 0 if build_package() else 1
        elif sys.argv[1] == "install":
            return 0 if install_package() else 1
        elif sys.argv[1] == "all":
            if not build_package():
                return 1
            if not install_package():
                return 1
            return 0
        else:
            print(f"Unknown command: {sys.argv[1]}")
            print("Usage: python build.py [build|install|all]")
            return 1
    else:
        # Default to building and installing
        if not build_package():
            return 1
        if not install_package():
            return 1
        return 0

if __name__ == "__main__":
    sys.exit(main())
