@echo off
REM Build script for Go FastCore on Windows
setlocal enabledelayedexpansion

echo Building Go FastCore...

REM Create bin directory if it doesn't exist
if not exist "bin" mkdir bin

REM Change to Go directory
cd go

REM Download dependencies
echo Downloading Go dependencies...
go mod download
go mod tidy

REM Build for current platform (Windows)
echo Building for Windows...
go build -ldflags="-s -w" -o ../bin/go-fast-core.exe ./cmd/go-fast-core

REM Build for different platforms if requested
if "%1"=="all" (
    echo Building for all platforms...

    REM Linux AMD64
    echo   Building for Linux AMD64...
    set GOOS=linux
    set GOARCH=amd64
    go build -ldflags="-s -w" -o ../bin/go-fast-core-linux-amd64 ./cmd/go-fast-core

    REM Windows AMD64
    echo   Building for Windows AMD64...
    set GOOS=windows
    set GOARCH=amd64
    go build -ldflags="-s -w" -o ../bin/go-fast-core-windows-amd64.exe ./cmd/go-fast-core

    REM macOS AMD64
    echo   Building for macOS AMD64...
    set GOOS=darwin
    set GOARCH=amd64
    go build -ldflags="-s -w" -o ../bin/go-fast-core-darwin-amd64 ./cmd/go-fast-core

    REM macOS ARM64 (Apple Silicon)
    echo   Building for macOS ARM64...
    set GOOS=darwin
    set GOARCH=arm64
    go build -ldflags="-s -w" -o ../bin/go-fast-core-darwin-arm64 ./cmd/go-fast-core

    REM Linux ARM64
    echo   Building for Linux ARM64...
    set GOOS=linux
    set GOARCH=arm64
    go build -ldflags="-s -w" -o ../bin/go-fast-core-linux-arm64 ./cmd/go-fast-core

    REM Reset environment variables
    set GOOS=
    set GOARCH=
)

REM Return to root directory
cd ..

echo Go FastCore built successfully!
echo Binaries available in .\bin\

REM List built binaries
dir bin\go-fast-core*

echo.
echo To test the Go service:
echo    .\bin\go-fast-core.exe --port 9001 --workers 4
echo.
echo Health check:
echo    curl http://localhost:9001/health

endlocal
