#!/bin/bash

# Build script for Go FastCore
set -e

echo "Building Go FastCore..."

# Create bin directory if it doesn't exist
mkdir -p bin

# Change to Go directory
cd go

# Download dependencies
echo "Downloading Go dependencies..."
go mod download
go mod tidy

# Build for current platform
echo "Building for current platform..."
go build -ldflags="-s -w" -o ../bin/go-fast-core ./cmd/go-fast-core

# Build for different platforms if requested
if [ "$1" = "all" ]; then
    echo "Building for all platforms..."

    # Linux AMD64
    echo "  Building for Linux AMD64..."
    GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o ../bin/go-fast-core-linux-amd64 ./cmd/go-fast-core

    # Windows AMD64
    echo "  Building for Windows AMD64..."
    GOOS=windows GOARCH=amd64 go build -ldflags="-s -w" -o ../bin/go-fast-core-windows-amd64.exe ./cmd/go-fast-core

    # macOS AMD64
    echo "  Building for macOS AMD64..."
    GOOS=darwin GOARCH=amd64 go build -ldflags="-s -w" -o ../bin/go-fast-core-darwin-amd64 ./cmd/go-fast-core

    # macOS ARM64 (Apple Silicon)
    echo "  Building for macOS ARM64..."
    GOOS=darwin GOARCH=arm64 go build -ldflags="-s -w" -o ../bin/go-fast-core-darwin-arm64 ./cmd/go-fast-core

    # Linux ARM64
    echo "  Building for Linux ARM64..."
    GOOS=linux GOARCH=arm64 go build -ldflags="-s -w" -o ../bin/go-fast-core-linux-arm64 ./cmd/go-fast-core
fi

# Return to root directory
cd ..

# Make binaries executable on Unix systems
if [ "$(uname)" != "MINGW64_NT"* ] && [ "$(uname)" != "MSYS_NT"* ]; then
    chmod +x bin/go-fast-core*
fi

echo "Go FastCore built successfully!"
echo "Binaries available in ./bin/"

# List built binaries
ls -la bin/go-fast-core*

echo ""
echo "To test the Go service:"
echo "   ./bin/go-fast-core --port 9001 --workers 4"
echo ""
echo "Health check:"
echo "   curl http://localhost:9001/health"
