/***************************************************************************
 * FortifyJS - Secure Array Types
 *
 * This file contains type definitions for the SecureArray architecture
 *
 * @author Nehonix
 * @license MIT
 *
 * Copyright (c) 2025 Nehonix. All rights reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 ***************************************************************************** */

import {
    FileWatcherManagerDependencies,
    FileWatcherManagerOptions,
} from "../../../types/components/FWM.type";
import { UltraFastFileWatcher } from "../../service/Reload/FileWatcher";
import { HotReloader } from "../../service/Reload/HotReloader";
import { logger } from "../../utils/Logger";

/**
 * FileWatcherManager - Handles all file watching and hot reload operations for FastApi.ts
 * Manages file monitoring, hot reload functionality, and server restart coordination
 */
export class FileWatcherManager {
    protected readonly options: FileWatcherManagerOptions;
    protected readonly dependencies: FileWatcherManagerDependencies;
    private fileWatcher?: UltraFastFileWatcher;
    private hotReloader?: HotReloader;
    private httpServer?: any;
    private isMainProcess = true;

    constructor(
        options: FileWatcherManagerOptions,
        dependencies: FileWatcherManagerDependencies
    ) {
        this.options = options;
        this.dependencies = dependencies;

        if (this.options.fileWatcher?.enabled) {
            this.initializeFileWatcher();
        }
    }

    /**
     * Initialize file watcher and hot reloader
     */
    private initializeFileWatcher(): void {
        if (!this.options.fileWatcher?.enabled) return;

        logger.debug("fileWatcher", "Initializing file watcher...");

        // Check if we're in the main process or a child process
        this.isMainProcess = !process.env.FORTIFY_CHILD_PROCESS;

        if (this.isMainProcess) {
            // Main process: Initialize hot reloader for true process restart
            this.hotReloader = new HotReloader({
                enabled: true,
                script: process.argv[1] || "index.js",
                args: process.argv.slice(2),
                env: {
                    ...process.env,
                    FORTIFY_CHILD_PROCESS: "true", // Mark child processes
                },
                cwd: process.cwd(),
                restartDelay: this.options.fileWatcher.restartDelay || 500,
                maxRestarts: this.options.fileWatcher.maxRestarts || 10,
                gracefulShutdownTimeout: 5000,
                verbose: this.options.fileWatcher.verbose || false,
            });

            // Initialize file watcher for the main process
            this.fileWatcher = new UltraFastFileWatcher(
                this.options.fileWatcher
            );
        } else {
            // Child process: Don't initialize file watcher to avoid conflicts
            logger.debug(
                "fileWatcher",
                "Running in child process mode (hot reload enabled)"
            );
        }

        logger.debug("fileWatcher", "FW initialized");
    }

    /**
     * Get file watcher instance
     */
    public getFileWatcher(): UltraFastFileWatcher | undefined {
        return this.fileWatcher;
    }

    /**
     * Get hot reloader instance
     */
    public getHotReloader(): HotReloader | undefined {
        return this.hotReloader;
    }

    /**
     * Check if file watcher is enabled
     */
    public isFileWatcherEnabled(): boolean {
        return this.options.fileWatcher?.enabled === true;
    }

    /**
     * Check if running in main process
     */
    public isInMainProcess(): boolean {
        return this.isMainProcess;
    }

    /**
     * Set HTTP server reference for restart operations
     */
    public setHttpServer(server: any): void {
        this.httpServer = server;
    }

    /**
     * Start file watcher for auto-reload (main process only)
     */
    public async startFileWatcher(): Promise<void> {
        if (!this.fileWatcher) return;

        try {
            logger.debug(
                "fileWatcher",
                " Starting file watcher for auto-reload..."
            );

            // Setup file watcher event handlers
            this.setupFileWatcherEventHandlers();

            // Start watching with restart callback
            await this.fileWatcher.startWatching(async () => {
                await this.restartServer();
            });

            logger.debug("fileWatcher", "File watcher started successfully");
        } catch (error: any) {
            logger.error(
                "fileWatcher",
                "Failed to start file watcher:",
                error.message
            );
        }
    }

    /**
     * Start file watcher with hot reload (main process)
     */
    public async startFileWatcherWithHotReload(): Promise<void> {
        if (!this.fileWatcher || !this.hotReloader) return;

        try {
            logger.debug(
                "fileWatcher",
                "Starting file watcher with hot reload..."
            );

            // Setup file watcher event handlers for hot reload
            this.setupHotReloadEventHandlers();

            // Start watching with hot reload callback
            await this.fileWatcher.startWatching(async () => {
                await this.triggerHotReload();
            });

            logger.debug(
                "fileWatcher",
                "File watcher with hot reload started successfully"
            );
        } catch (error: any) {
            logger.error(
                "fileWatcher",
                "Failed to start file watcher with hot reload:",
                error.message
            );
        }
    }

    /**
     * Setup hot reload event handlers
     */
    private setupHotReloadEventHandlers(): void {
        if (!this.fileWatcher || !this.hotReloader) return;

        this.fileWatcher.on("file:changed", (event: any) => {
            if (this.options.fileWatcher?.verbose) {
                logger.debug("fileWatcher", `File changed: ${event.filename}`);
            }
        });

        this.fileWatcher.on("restart:starting", (event: any) => {
            logger.debug(
                "fileWatcher",
                `Hot reloading due to: ${event.filename}`
            );
        });

        this.hotReloader.on("restart:completed", (data: any) => {
            logger.debug(
                "fileWatcher",
                `Hot reload completed in ${data.duration}ms`
            );
        });

        this.hotReloader.on("restart:failed", (data: any) => {
            logger.error("fileWatcher", `Hot reload failed: ${data.error}`);
        });
    }

    /**
     * Setup file watcher event handlers
     */
    private setupFileWatcherEventHandlers(): void {
        if (!this.fileWatcher) return;

        this.fileWatcher.on("file:changed", (event: any) => {
            if (this.options.fileWatcher?.verbose) {
                logger.debug("fileWatcher", `File changed: ${event.filename}`);
            }
        });

        this.fileWatcher.on("restart:starting", (event: any) => {
            logger.debug("fileWatcher", `Restarting due to: ${event.filename}`);
        });

        this.fileWatcher.on("restart:completed", (data: any) => {
            logger.debug(
                "fileWatcher",
                `Restart completed in ${data.duration}ms`
            );
        });

        this.fileWatcher.on("restart:failed", (data: any) => {
            logger.error("fileWatcher", `Restart failed: ${data.error}`);
        });
    }

    /**
     * Trigger hot reload (true process restart)
     */
    private async triggerHotReload(): Promise<void> {
        if (!this.hotReloader) {
            logger.warn(
                "fileWatcher",
                "Hot reloader not available, falling back to regular restart"
            );
            await this.restartServer();
            return;
        }

        try {
            logger.debug(
                "fileWatcher",
                "Triggering hot reload (process restart)..."
            );
            await this.hotReloader.restart();
        } catch (error: any) {
            logger.error("fileWatcher", "Hot reload failed:", error.message);
            // Fallback to regular restart
            logger.debug("fileWatcher", "Falling back to regular restart...");
            await this.restartServer();
        }
    }

    /**
     * Restart server (for file watcher) with hot reload
     */
    private async restartServer(): Promise<void> {
        try {
            logger.debug("fileWatcher", "Hot reloading server...");

            // Close current server
            if (this.httpServer) {
                await new Promise<void>((resolve) => {
                    this.httpServer.close(() => {
                        logger.debug("fileWatcher", "Server closed");
                        resolve();
                    });
                });
            }

            // Stop cluster if running
            if (this.dependencies.clusterManager?.isClusterEnabled()) {
                await this.dependencies.clusterManager.stopCluster(true);
                logger.debug("fileWatcher", "Cluster stopped");
            }

            // Clear module cache for hot reload
            this.clearModuleCache();

            // Small delay before restart
            await new Promise((resolve) => setTimeout(resolve, 200));

            // For true hot reload, we need to restart the entire process
            // But for now, let's restart the server with cleared cache
            await this.reinitializeServer();
        } catch (error: any) {
            logger.error(
                "fileWatcher",
                "Server hot reload failed:",
                error.message
            );
            throw error;
        }
    }

    /**
     * Reinitialize server with fresh configuration
     */
    private async reinitializeServer(): Promise<void> {
        try {
            logger.debug(
                "fileWatcher",
                "Reinitializing server with fresh config..."
            );

            // Re-read configuration from environment or files
            const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
            const host = process.env.HOST || "localhost";

            logger.debug("fileWatcher", `Using port: ${port}, host: ${host}`);

            // Restart cluster if enabled
            if (this.dependencies.clusterManager?.isClusterEnabled()) {
                await this.dependencies.clusterManager.startCluster();
                logger.debug("fileWatcher", "Cluster restarted");
            }

            // Start HTTP server with potentially updated config
            this.httpServer = this.dependencies.app.listen(
                port,
                host,
                async () => {
                    logger.debug(
                        "fileWatcher",
                        `Server hot-reloaded on ${host}:${port}`
                    );

                    // Restart file watcher if it was stopped
                    if (
                        this.fileWatcher &&
                        !this.fileWatcher.getStatus().isWatching
                    ) {
                        await this.startFileWatcher();
                    }
                }
            );
        } catch (error: any) {
            logger.error(
                "fileWatcher",
                "Server reinitialization failed:",
                error.message
            );
            throw error;
        }
    }

    /**
     * Clear Node.js module cache for hot reload
     */
    private clearModuleCache(): void {
        try {
            logger.debug(
                "fileWatcher",
                "Clearing module cache for hot reload..."
            );

            const cacheKeys = Object.keys(require.cache);
            let clearedCount = 0;

            for (const key of cacheKeys) {
                // Only clear modules from our project (not node_modules)
                if (
                    key.includes(process.cwd()) &&
                    !key.includes("node_modules") &&
                    !key.includes(".node") &&
                    !key.endsWith(".json")
                ) {
                    delete require.cache[key];
                    clearedCount++;
                }
            }

            logger.debug(
                "fileWatcher",
                `Cleared ${clearedCount} modules from cache`
            );
        } catch (error: any) {
            logger.warn(
                "fileWatcher",
                "Module cache clearing failed:",
                error.message
            );
        }
    }

    /**
     * Stop file watcher
     */
    public async stopFileWatcher(): Promise<void> {
        if (this.fileWatcher) {
            await this.fileWatcher.stopWatching();
            logger.debug("fileWatcher", "File watcher stopped");
        }
    }

    /**
     * Get file watcher status
     */
    public getFileWatcherStatus(): any {
        return this.fileWatcher?.getStatus() || null;
    }

    /**
     * Get file watcher restart stats
     */
    public getFileWatcherStats(): any {
        return this.fileWatcher?.getRestartStats() || null;
    }

    /**
     * Add file watcher monitoring endpoints
     */
    public addFileWatcherMonitoringEndpoints(basePoint: string): void {
        if (!this.fileWatcher || !this.options.fileWatcher?.enabled) return;

        // File watcher status endpoint
        this.dependencies.app.get(
            basePoint + "/health/filewatcher",
            async (req, res) => {
                try {
                    const status = this.getFileWatcherStatus();
                    const stats = this.getFileWatcherStats();

                    res.json({
                        timestamp: new Date().toISOString(),
                        fileWatcher: {
                            status,
                            stats,
                        },
                    });
                } catch (error: any) {
                    res.status(500).json({
                        error: "Failed to get file watcher status",
                        message: error.message,
                    });
                }
            }
        );

        // File watcher control endpoint
        this.dependencies.app.post(
            basePoint + "/filewatcher/control",
            async (req, res) => {
                try {
                    const { action } = req.body;

                    if (action === "stop") {
                        await this.stopFileWatcher();
                        res.json({
                            success: true,
                            message: "File watcher stopped",
                        });
                    } else if (action === "start") {
                        await this.startFileWatcher();
                        res.json({
                            success: true,
                            message: "File watcher started",
                        });
                    } else if (action === "restart") {
                        await this.stopFileWatcher();
                        await this.startFileWatcher();
                        res.json({
                            success: true,
                            message: "File watcher restarted",
                        });
                    } else if (action === "reset-stats") {
                        if (this.fileWatcher) {
                            this.fileWatcher.resetStats();
                        }
                        res.json({
                            success: true,
                            message: "File watcher stats reset",
                        });
                    } else {
                        res.status(400).json({
                            error: "Invalid action. Use 'start', 'stop', 'restart', or 'reset-stats'",
                        });
                    }
                } catch (error: any) {
                    res.status(500).json({
                        error: "Failed to control file watcher",
                        message: error.message,
                    });
                }
            }
        );
    }
}

