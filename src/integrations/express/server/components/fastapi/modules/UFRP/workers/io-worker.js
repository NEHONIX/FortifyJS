/**
 * FortifyJS - Optimized I/O Worker Thread
 * Handles real-world I/O operations with improved performance
 */

const { parentPort, workerData } = require('worker_threads');
const fs = require('fs').promises;
const path = require('path');

// Worker configuration
const WORKER_ID = process.pid;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit

// Initialize worker
console.log(`I/O Worker ${WORKER_ID} initialized`);

// Task handlers map for better performance
const taskHandlers = {
    read: processReadTask,
    write: processWriteTask,
    delete: processDeleteTask,
    exists: processExistsTask,
    mkdir: processMkdirTask,
    readdir: processReaddirTask,
    stat: processStatTask,
    copy: processCopyTask
};

// Main message handler
parentPort.on('message', async (message) => {
    const startTime = process.hrtime.bigint();
    
    try {
        const { task } = message;
        const handler = taskHandlers[task.type];
        
        if (!handler) {
            throw new Error(`Unknown task type: ${task.type}`);
        }
        
        const result = await handler(task);
        const executionTime = Number(process.hrtime.bigint() - startTime) / 1000000; // Convert to ms
        
        parentPort.postMessage({
            taskId: task.id,
            result,
            executionTime,
            workerId: WORKER_ID,
            success: true
        });
        
    } catch (error) {
        const executionTime = Number(process.hrtime.bigint() - startTime) / 1000000;
        
        parentPort.postMessage({
            taskId: message.task?.id || 'unknown',
            error: {
                message: error.message,
                code: error.code,
                errno: error.errno,
                path: error.path
            },
            executionTime,
            workerId: WORKER_ID,
            success: false
        });
    }
});

/**
 * Read file or directory contents
 */
async function processReadTask(task) {
    const { filePath, encoding = 'utf8', options = {} } = task.data;
    
    if (!filePath) {
        throw new Error('File path is required for read operation');
    }
    
    const resolvedPath = path.resolve(filePath);
    
    // Security check - prevent directory traversal
    if (resolvedPath.includes('..')) {
        throw new Error('Invalid file path - directory traversal not allowed');
    }
    
    const stats = await fs.stat(resolvedPath);
    
    if (stats.isFile()) {
        // Check file size limit
        if (stats.size > MAX_FILE_SIZE) {
            throw new Error(`File too large: ${stats.size} bytes (max: ${MAX_FILE_SIZE})`);
        }
        
        const content = await fs.readFile(resolvedPath, { encoding, ...options });
        
        return {
            type: 'read',
            filePath: resolvedPath,
            content,
            size: stats.size,
            isFile: true,
            timestamp: Date.now()
        };
    } else if (stats.isDirectory()) {
        const entries = await fs.readdir(resolvedPath, { withFileTypes: true });
        
        return {
            type: 'read',
            filePath: resolvedPath,
            entries: entries.map(entry => ({
                name: entry.name,
                isFile: entry.isFile(),
                isDirectory: entry.isDirectory()
            })),
            isDirectory: true,
            timestamp: Date.now()
        };
    }
    
    throw new Error('Path is neither file nor directory');
}

/**
 * Write data to file
 */
async function processWriteTask(task) {
    const { filePath, data, encoding = 'utf8', options = {} } = task.data;
    
    if (!filePath || data === undefined) {
        throw new Error('File path and data are required for write operation');
    }
    
    const resolvedPath = path.resolve(filePath);
    
    // Security check
    if (resolvedPath.includes('..')) {
        throw new Error('Invalid file path - directory traversal not allowed');
    }
    
    // Ensure directory exists
    const dir = path.dirname(resolvedPath);
    await fs.mkdir(dir, { recursive: true });
    
    // Write file
    await fs.writeFile(resolvedPath, data, { encoding, ...options });
    
    // Get file stats
    const stats = await fs.stat(resolvedPath);
    
    return {
        type: 'write',
        filePath: resolvedPath,
        size: stats.size,
        timestamp: Date.now()
    };
}

/**
 * Delete file or directory
 */
async function processDeleteTask(task) {
    const { filePath, recursive = false } = task.data;
    
    if (!filePath) {
        throw new Error('File path is required for delete operation');
    }
    
    const resolvedPath = path.resolve(filePath);
    
    // Security check
    if (resolvedPath.includes('..')) {
        throw new Error('Invalid file path - directory traversal not allowed');
    }
    
    const stats = await fs.stat(resolvedPath);
    
    if (stats.isFile()) {
        await fs.unlink(resolvedPath);
    } else if (stats.isDirectory()) {
        await fs.rmdir(resolvedPath, { recursive });
    }
    
    return {
        type: 'delete',
        filePath: resolvedPath,
        wasFile: stats.isFile(),
        wasDirectory: stats.isDirectory(),
        timestamp: Date.now()
    };
}

/**
 * Check if file/directory exists
 */
async function processExistsTask(task) {
    const { filePath } = task.data;
    
    if (!filePath) {
        throw new Error('File path is required for exists operation');
    }
    
    const resolvedPath = path.resolve(filePath);
    
    try {
        const stats = await fs.stat(resolvedPath);
        return {
            type: 'exists',
            filePath: resolvedPath,
            exists: true,
            isFile: stats.isFile(),
            isDirectory: stats.isDirectory(),
            timestamp: Date.now()
        };
    } catch (error) {
        if (error.code === 'ENOENT') {
            return {
                type: 'exists',
                filePath: resolvedPath,
                exists: false,
                timestamp: Date.now()
            };
        }
        throw error;
    }
}

/**
 * Create directory
 */
async function processMkdirTask(task) {
    const { dirPath, recursive = true } = task.data;
    
    if (!dirPath) {
        throw new Error('Directory path is required for mkdir operation');
    }
    
    const resolvedPath = path.resolve(dirPath);
    
    // Security check
    if (resolvedPath.includes('..')) {
        throw new Error('Invalid directory path - directory traversal not allowed');
    }
    
    await fs.mkdir(resolvedPath, { recursive });
    
    return {
        type: 'mkdir',
        dirPath: resolvedPath,
        timestamp: Date.now()
    };
}

/**
 * Read directory contents
 */
async function processReaddirTask(task) {
    const { dirPath, withFileTypes = true } = task.data;
    
    if (!dirPath) {
        throw new Error('Directory path is required for readdir operation');
    }
    
    const resolvedPath = path.resolve(dirPath);
    
    // Security check
    if (resolvedPath.includes('..')) {
        throw new Error('Invalid directory path - directory traversal not allowed');
    }
    
    const entries = await fs.readdir(resolvedPath, { withFileTypes });
    
    return {
        type: 'readdir',
        dirPath: resolvedPath,
        entries: withFileTypes ? entries.map(entry => ({
            name: entry.name,
            isFile: entry.isFile(),
            isDirectory: entry.isDirectory(),
            isSymbolicLink: entry.isSymbolicLink()
        })) : entries,
        timestamp: Date.now()
    };
}

/**
 * Get file/directory stats
 */
async function processStatTask(task) {
    const { filePath } = task.data;
    
    if (!filePath) {
        throw new Error('File path is required for stat operation');
    }
    
    const resolvedPath = path.resolve(filePath);
    
    // Security check
    if (resolvedPath.includes('..')) {
        throw new Error('Invalid file path - directory traversal not allowed');
    }
    
    const stats = await fs.stat(resolvedPath);
    
    return {
        type: 'stat',
        filePath: resolvedPath,
        stats: {
            size: stats.size,
            isFile: stats.isFile(),
            isDirectory: stats.isDirectory(),
            isSymbolicLink: stats.isSymbolicLink(),
            mode: stats.mode,
            uid: stats.uid,
            gid: stats.gid,
            atime: stats.atime,
            mtime: stats.mtime,
            ctime: stats.ctime,
            birthtime: stats.birthtime
        },
        timestamp: Date.now()
    };
}

/**
 * Copy file
 */
async function processCopyTask(task) {
    const { sourcePath, destPath, flags = 0 } = task.data;
    
    if (!sourcePath || !destPath) {
        throw new Error('Source and destination paths are required for copy operation');
    }
    
    const resolvedSource = path.resolve(sourcePath);
    const resolvedDest = path.resolve(destPath);
    
    // Security checks
    if (resolvedSource.includes('..') || resolvedDest.includes('..')) {
        throw new Error('Invalid file path - directory traversal not allowed');
    }
    
    // Ensure destination directory exists
    const destDir = path.dirname(resolvedDest);
    await fs.mkdir(destDir, { recursive: true });
    
    // Copy file
    await fs.copyFile(resolvedSource, resolvedDest, flags);
    
    // Get stats
    const stats = await fs.stat(resolvedDest);
    
    return {
        type: 'copy',
        sourcePath: resolvedSource,
        destPath: resolvedDest,
        size: stats.size,
        timestamp: Date.now()
    };
}

// Graceful shutdown handlers
const shutdown = (signal) => {
    console.log(`I/O Worker ${WORKER_ID} received ${signal}, shutting down gracefully`);
    process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error(`I/O Worker ${WORKER_ID} uncaught exception:`, error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error(`I/O Worker ${WORKER_ID} unhandled rejection at:`, promise, 'reason:', reason);
    process.exit(1);
});