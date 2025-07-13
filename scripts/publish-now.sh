#!/bin/bash

# Quick publish script that bypasses git checks
set -e

echo "🚀 Quick Publishing FortifyJS..."

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo "Current version: $CURRENT_VERSION"

# Calculate new patch version
IFS='.' read -ra VERSION_PARTS <<< "$CURRENT_VERSION"
MAJOR=${VERSION_PARTS[0]}
MINOR=${VERSION_PARTS[1]}
PATCH=${VERSION_PARTS[2]}
NEW_PATCH=$((PATCH + 1))
NEW_VERSION="$MAJOR.$MINOR.$NEW_PATCH"

echo "New version: $NEW_VERSION"

# Update package.json manually
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.version = '$NEW_VERSION';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
console.log('✅ Updated package.json to version $NEW_VERSION');
"

# Verify build exists
if [ ! -d "dist" ]; then
    echo "❌ dist directory not found. Running build..."
    npm run build
fi

# Check required files
if [ ! -f "dist/cjs/index.js" ] || [ ! -f "dist/esm/index.js" ] || [ ! -f "dist/index.d.ts" ]; then
    echo "❌ Required build files missing. Running build..."
    npm run build
fi

echo "✅ Build files verified"

# Check npm authentication
if ! npm whoami > /dev/null 2>&1; then
    echo "❌ Not logged in to npm. Please run: npm login"
    exit 1
fi

echo "✅ Logged in as: $(npm whoami)"

# Check if version already exists
if npm view "fortify2-js@$NEW_VERSION" version > /dev/null 2>&1; then
    echo "❌ Version $NEW_VERSION already exists on npm!"
    exit 1
fi

echo "✅ Version $NEW_VERSION is available"

# Publish
echo "🚀 Publishing fortify2-js@$NEW_VERSION..."
npm publish --access public

if [ $? -eq 0 ]; then
    echo "🎉 Successfully published fortify2-js@$NEW_VERSION!"
    echo "📦 Package: https://www.npmjs.com/package/fortify2-js"
    echo "📚 Install: npm install fortify2-js@$NEW_VERSION"
    
    # Verify publication
    echo "🔍 Verifying publication..."
    sleep 3
    if npm view "fortify2-js@$NEW_VERSION" version > /dev/null 2>&1; then
        echo "✅ Package is live on npm!"
    else
        echo "⚠️  Package may still be propagating..."
    fi
else
    echo "❌ Publishing failed!"
    exit 1
fi
