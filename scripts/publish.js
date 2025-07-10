#!/usr/bin/env node

/**
 * FortifyJS Publishing Script
 * Automated publishing with comprehensive checks and validation
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function exec(command, options = {}) {
    try {
        const result = execSync(command, { 
            encoding: 'utf8', 
            stdio: 'inherit',
            ...options 
        });
        return result;
    } catch (error) {
        log(`❌ Command failed: ${command}`, 'red');
        log(`Error: ${error.message}`, 'red');
        process.exit(1);
    }
}

function execSilent(command) {
    try {
        return execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    } catch (error) {
        return null;
    }
}

async function main() {
    log('🚀 FortifyJS Publishing Script', 'bold');
    log('================================', 'blue');

    // 1. Check if we're in the right directory
    if (!existsSync('package.json')) {
        log('❌ package.json not found. Run this script from the project root.', 'red');
        process.exit(1);
    }

    // 2. Read package.json
    const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
    log(`📦 Package: ${pkg.name}@${pkg.version}`, 'blue');

    // 3. Check if user is logged in to npm
    log('\n🔍 Checking npm authentication...', 'yellow');
    const whoami = execSilent('npm whoami');
    if (!whoami) {
        log('❌ You are not logged in to npm. Please run: npm login', 'red');
        process.exit(1);
    }
    log(`✅ Logged in as: ${whoami.trim()}`, 'green');

    // 4. Check git status
    log('\n🔍 Checking git status...', 'yellow');
    const gitStatus = execSilent('git status --porcelain');
    if (gitStatus && gitStatus.trim()) {
        log('⚠️  You have uncommitted changes:', 'yellow');
        log(gitStatus, 'yellow');
        
        // Ask if user wants to continue
        const readline = await import('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        const answer = await new Promise(resolve => {
            rl.question('Do you want to continue anyway? (y/N): ', resolve);
        });
        rl.close();
        
        if (answer.toLowerCase() !== 'y') {
            log('❌ Publishing cancelled. Please commit your changes first.', 'red');
            process.exit(1);
        }
    } else {
        log('✅ Git working directory is clean', 'green');
    }

    // 5. Run tests
    log('\n🧪 Running tests...', 'yellow');
    try {
        exec('npm test', { stdio: 'pipe' });
        log('✅ All tests passed', 'green');
    } catch (error) {
        log('⚠️  Tests failed, but continuing...', 'yellow');
    }

    // 6. Type checking
    log('\n🔍 Running type check...', 'yellow');
    try {
        exec('npm run type-check', { stdio: 'pipe' });
        log('✅ Type check passed', 'green');
    } catch (error) {
        log('❌ Type check failed', 'red');
        process.exit(1);
    }

    // 7. Linting
    log('\n🔍 Running linter...', 'yellow');
    try {
        exec('npm run lint', { stdio: 'pipe' });
        log('✅ Linting passed', 'green');
    } catch (error) {
        log('⚠️  Linting issues found, but continuing...', 'yellow');
    }

    // 8. Clean and build
    log('\n🏗️  Building project...', 'yellow');
    
    // Clean dist directory
    if (existsSync('dist')) {
        exec('rm -rf dist');
    }
    
    // Build the project
    exec('npm run build');
    log('✅ Build completed successfully', 'green');

    // 9. Verify build output
    log('\n🔍 Verifying build output...', 'yellow');
    const requiredFiles = [
        'dist/cjs/index.js',
        'dist/esm/index.js',
        'dist/index.d.ts'
    ];
    
    for (const file of requiredFiles) {
        if (!existsSync(file)) {
            log(`❌ Required file missing: ${file}`, 'red');
            process.exit(1);
        }
    }
    log('✅ All required files present', 'green');

    // 10. Check package size
    log('\n📏 Checking package size...', 'yellow');
    try {
        const packResult = execSilent('npm pack --dry-run');
        if (packResult) {
            const lines = packResult.split('\n');
            const sizeLine = lines.find(line => line.includes('package size:'));
            if (sizeLine) {
                log(`📦 ${sizeLine}`, 'blue');
            }
        }
    } catch (error) {
        log('⚠️  Could not check package size', 'yellow');
    }

    // 11. Version bump (optional)
    log('\n🔢 Current version:', 'yellow');
    log(`   ${pkg.version}`, 'blue');
    
    const readline2 = await import('readline');
    const rl2 = readline2.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    const versionAction = await new Promise(resolve => {
        rl2.question('Version bump? (patch/minor/major/skip): ', resolve);
    });
    rl2.close();
    
    if (versionAction && versionAction !== 'skip') {
        if (['patch', 'minor', 'major'].includes(versionAction)) {
            log(`\n⬆️  Bumping ${versionAction} version...`, 'yellow');
            exec(`npm version ${versionAction} --no-git-tag-version`);
            
            // Re-read package.json to get new version
            const newPkg = JSON.parse(readFileSync('package.json', 'utf8'));
            log(`✅ Version bumped to: ${newPkg.version}`, 'green');
        } else {
            log('❌ Invalid version bump option', 'red');
            process.exit(1);
        }
    }

    // 12. Final confirmation
    const finalPkg = JSON.parse(readFileSync('package.json', 'utf8'));
    log('\n🚀 Ready to publish:', 'bold');
    log(`   Package: ${finalPkg.name}`, 'blue');
    log(`   Version: ${finalPkg.version}`, 'blue');
    log(`   Registry: ${execSilent('npm config get registry')?.trim() || 'https://registry.npmjs.org/'}`, 'blue');
    
    const readline3 = await import('readline');
    const rl3 = readline3.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    const confirm = await new Promise(resolve => {
        rl3.question('\nProceed with publishing? (y/N): ', resolve);
    });
    rl3.close();
    
    if (confirm.toLowerCase() !== 'y') {
        log('❌ Publishing cancelled by user', 'red');
        process.exit(1);
    }

    // 13. Publish to npm
    log('\n🚀 Publishing to npm...', 'yellow');
    try {
        exec('npm publish --access public');
        log('✅ Successfully published to npm!', 'green');
    } catch (error) {
        log('❌ Publishing failed', 'red');
        log('This might be due to:', 'yellow');
        log('  - Version already exists', 'yellow');
        log('  - Network issues', 'yellow');
        log('  - Permission issues', 'yellow');
        process.exit(1);
    }

    // 14. Create git tag (if version was bumped)
    if (versionAction && versionAction !== 'skip') {
        log('\n🏷️  Creating git tag...', 'yellow');
        try {
            exec(`git add package.json`);
            exec(`git commit -m "chore: bump version to ${finalPkg.version}"`);
            exec(`git tag v${finalPkg.version}`);
            log(`✅ Created git tag: v${finalPkg.version}`, 'green');
            
            const pushTag = await new Promise(resolve => {
                const readline4 = require('readline').createInterface({
                    input: process.stdin,
                    output: process.stdout
                });
                readline4.question('Push tag to remote? (y/N): ', resolve);
                readline4.close();
            });
            
            if (pushTag.toLowerCase() === 'y') {
                exec('git push origin main');
                exec(`git push origin v${finalPkg.version}`);
                log('✅ Pushed tag to remote', 'green');
            }
        } catch (error) {
            log('⚠️  Could not create git tag', 'yellow');
        }
    }

    // 15. Success message
    log('\n🎉 Publishing completed successfully!', 'bold');
    log('================================', 'green');
    log(`📦 Package: ${finalPkg.name}@${finalPkg.version}`, 'green');
    log(`🌐 NPM: https://www.npmjs.com/package/${finalPkg.name}`, 'blue');
    log(`📚 Install: npm install ${finalPkg.name}`, 'blue');
    
    // 16. Post-publish verification
    log('\n🔍 Verifying publication...', 'yellow');
    setTimeout(() => {
        try {
            const npmView = execSilent(`npm view ${finalPkg.name}@${finalPkg.version} version`);
            if (npmView && npmView.trim() === finalPkg.version) {
                log('✅ Package is available on npm!', 'green');
            } else {
                log('⚠️  Package may still be propagating...', 'yellow');
            }
        } catch (error) {
            log('⚠️  Could not verify publication', 'yellow');
        }
    }, 5000);
}

// Run the script
main().catch(error => {
    log(`❌ Publishing script failed: ${error.message}`, 'red');
    process.exit(1);
});
