#!/usr/bin/env node
/**
 * Build script for TypeScript Executor - Production version
 * Integrates with the main build process
 */

const { execSync } = require('child_process');
const { existsSync, mkdirSync } = require('fs');
const { join } = require('path');

function buildTypeScriptExecutor() {
    console.log('🔨 Building TypeScript Executor for production...');
    
    try {
        // Ensure we're in the project root
        const projectRoot = process.cwd();
        const buildScript = join(projectRoot, 'build-ts-executor.mjs');
        
        if (!existsSync(buildScript)) {
            console.error('❌ Build script not found:', buildScript);
            process.exit(1);
        }
        
        // Run the build
        execSync(`node "${buildScript}"`, { 
            stdio: 'inherit',
            cwd: projectRoot 
        });
        
        // Verify the output
        const outputDir = join(projectRoot, 'dist', 'ts-executor');
        const executablePath = join(outputDir, process.platform === 'win32' ? 'ts-executor.cjs' : 'ts-executor');
        
        if (existsSync(executablePath)) {
            console.log('✅ TypeScript Executor built successfully');
            console.log(`📁 Available at: ${executablePath}`);
            
            if (process.platform === 'win32') {
                const batchPath = join(outputDir, 'ts-executor.cmd');
                if (existsSync(batchPath)) {
                    console.log(`📁 Windows batch file: ${batchPath}`);
                }
            }
        } else {
            console.error('❌ Build verification failed - executable not found');
            process.exit(1);
        }
        
    } catch (error) {
        console.error('❌ Build failed:', error.message);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    buildTypeScriptExecutor();
}

module.exports = { buildTypeScriptExecutor };
