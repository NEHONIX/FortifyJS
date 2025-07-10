#!/bin/bash

# FortifyJS Quick Publishing Script
# Simple and fast publishing with essential checks

set -e  # Exit on any error

echo "🚀 FortifyJS Quick Publishing"
echo "============================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Run this script from the project root."
    exit 1
fi

# Get package info
PACKAGE_NAME=$(node -p "require('./package.json').name")
PACKAGE_VERSION=$(node -p "require('./package.json').version")

print_info "Package: $PACKAGE_NAME@$PACKAGE_VERSION"

# Check npm authentication
echo ""
echo "🔍 Checking npm authentication..."
if ! npm whoami > /dev/null 2>&1; then
    print_error "You are not logged in to npm. Please run: npm login"
    exit 1
fi

NPM_USER=$(npm whoami)
print_status "Logged in as: $NPM_USER"

# Check if version already exists
echo ""
echo "🔍 Checking if version already exists..."
if npm view "$PACKAGE_NAME@$PACKAGE_VERSION" version > /dev/null 2>&1; then
    print_error "Version $PACKAGE_VERSION already exists on npm!"
    echo ""
    echo "Options:"
    echo "1. Bump version: npm version patch|minor|major"
    echo "2. Or manually edit package.json"
    exit 1
fi

print_status "Version $PACKAGE_VERSION is available"

# Clean build
echo ""
echo "🧹 Cleaning previous build..."
rm -rf dist/
print_status "Cleaned dist directory"

# Build the project
echo ""
echo "🏗️  Building project..."
if npm run build; then
    print_status "Build completed successfully"
else
    print_error "Build failed"
    exit 1
fi

# Verify essential files exist
echo ""
echo "🔍 Verifying build output..."
REQUIRED_FILES=("dist/cjs/index.js" "dist/esm/index.js" "dist/index.d.ts")

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        print_error "Required file missing: $file"
        exit 1
    fi
done

print_status "All required files present"

# Check package contents
echo ""
echo "📦 Checking package contents..."
npm pack --dry-run > /dev/null 2>&1
print_status "Package contents verified"

# Final confirmation
echo ""
echo "🚀 Ready to publish:"
echo "   Package: $PACKAGE_NAME"
echo "   Version: $PACKAGE_VERSION"
echo "   Registry: $(npm config get registry)"
echo ""

read -p "Proceed with publishing? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_warning "Publishing cancelled by user"
    exit 1
fi

# Publish to npm
echo ""
echo "🚀 Publishing to npm..."
if npm publish --access public; then
    print_status "Successfully published to npm!"
else
    print_error "Publishing failed"
    echo ""
    echo "Common reasons for failure:"
    echo "- Version already exists (check npm view $PACKAGE_NAME)"
    echo "- Network issues"
    echo "- Permission issues"
    echo "- Package name conflicts"
    exit 1
fi

# Success message
echo ""
echo "🎉 Publishing completed successfully!"
echo "=================================="
echo "📦 Package: $PACKAGE_NAME@$PACKAGE_VERSION"
echo "🌐 NPM: https://www.npmjs.com/package/$PACKAGE_NAME"
echo "📚 Install: npm install $PACKAGE_NAME"
echo ""

# Verify publication (with delay for npm propagation)
echo "🔍 Verifying publication in 5 seconds..."
sleep 5

if npm view "$PACKAGE_NAME@$PACKAGE_VERSION" version > /dev/null 2>&1; then
    print_status "Package is live on npm!"
else
    print_warning "Package may still be propagating..."
fi

echo ""
print_status "All done! 🎉"
