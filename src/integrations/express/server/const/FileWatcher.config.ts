import { FileWatcherConfig } from "../service/Reload/types/fw.types";

export const DEFAULT_FW_CONFIG: FileWatcherConfig = {
    enabled: true,
    watchPaths: ["src", "lib", "core"],
    ignorePaths: [
        "node_modules",
        ".git",
        ".vscode",
        ".idea",
        "dist",
        "build",
        "coverage",
        ".next",
        ".cache",
        "tmp",
        "temp",
        "logs",
    ],
    ignorePatterns: [
        /\.log$/,
        /\.tmp$/,
        /\.temp$/,
        /\.swp$/,
        /\.DS_Store$/,
        /Thumbs\.db$/,
        /\.git\//,
        /node_modules\//,
    ],
    extensions: [
        ".ts",
        ".js",
        ".tsx",
        ".jsx",
        ".json",
        ".env",
        ".yaml",
        ".yml",
    ],
    debounceMs: 50, // Reduced for better responsiveness
    restartDelay: 300, // Reduced for faster restarts
    maxRestarts: 10000, // Increased limit
    resetRestartsAfter: 300000, // Reset after 5 minutes
    gracefulShutdown: true,
    gracefulShutdownTimeout: 5000,
    verbose: false,
    usePolling: false,
    pollingInterval: 1000,
    followSymlinks: false,
    persistentWatching: true,
    batchChanges: true,
    batchTimeout: 100,
    enableFileHashing: true,
    clearScreen: true,
    showBanner: true,
    customIgnoreFile: ".watcherignore",
    watchDotFiles: false,
    maxFileSize: 10, // 10MB max file size
    excludeEmptyFiles: true,
    parallelProcessing: true,
    healthCheck: true,
    healthCheckInterval: 30000, // 30 seconds
    memoryLimit: 512, // 512MB
};
