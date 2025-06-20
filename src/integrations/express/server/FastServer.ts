/**
 * FortifyJS - Ultra-Fast Server
 * Main server class for FortifyJS
 */

import express, { Request, Response, NextFunction } from "express";

// Import types
import type {
    ServerOptions,
    UltraFastApp,
    UltraFastMiddlewareHandler,
} from "../types/types";
import type { PluginType } from "./plugins/types/PluginTypes";

// Import plugin classes
import { PluginManager } from "./components/fastapi/PluginManager";

// Import utils
import { Logger, initializeLogger } from "./utils/Logger";
import { PortManager, PortSwitchResult } from "./utils/PortManager";
import { Port } from "./utils/forceClosePort";
import { ConfigLoader } from "./utils/ConfigLoader";
import { DEFAULT_OPTIONS } from "./const/default";

// Import component classes
import { CacheManager } from "./components/fastapi/CacheManager";
import { MiddlewareMethodsManager } from "./components/fastapi/middlewares/MiddlewareMethodsManager";
import { RequestProcessor } from "./components/fastapi/RequestProcessor";
import { RouteManager } from "./components/fastapi/RouteManager";
import { PerformanceManager } from "./components/fastapi/PerformanceManager";
import { MonitoringManager } from "./components/fastapi/MonitoringManager";
import { ClusterManagerComponent } from "./components/fastapi/ClusterManagerComponent";
import { FileWatcherManager } from "./components/fastapi/FileWatcherManager";
import { MiddlewareManager } from "./components/fastapi/middlewares/middlewareManager";
import { RedirectManager } from "./components/fastapi/RedirectManager";
import { ConsoleInterceptor } from "./components/fastapi/console/ConsoleInterceptor";
import { UltraFastRequestProcessor } from "./components/fastapi/UltraFastRequestProcessor"; // UFRP


/**
 * Ultra-Fast Express Server with Advanced Performance Optimization
 */
export class UltraFastServer {
    // UFS Core
    private app: UltraFastApp;
    private options: ServerOptions;
    private ready = false;
    private initPromise: Promise<void> = Promise.resolve();
    private httpServer?: any;
    private logger: Logger;
    private currentPort: number = 0; // Track the actual running port

    // Component instances
    private cacheManager!: CacheManager;
    private middlewareManager!: MiddlewareManager;
    private middlewareMethodsManager!: MiddlewareMethodsManager;
    private requestProcessor!: RequestProcessor;
    private routeManager!: RouteManager;
    private performanceManager!: PerformanceManager;
    private monitoringManager!: MonitoringManager;
    private pluginManager!: PluginManager;
    private clusterManager!: ClusterManagerComponent;
    private fileWatcherManager!: FileWatcherManager;
    private redirectManager!: RedirectManager;
    private consoleInterceptor!: ConsoleInterceptor;
    private ultraFastProcessor!: UltraFastRequestProcessor;

    constructor(
        userOptions: ServerOptions = {
            server: {
                enableMiddleware: true,
            },
        }
    ) {
        // Load configuration from file system if available
        const fileConfig = ConfigLoader.loadConfig();

        // Merge configurations: defaults < file config < user options
        this.options = this.mergeWithDefaults(userOptions, fileConfig);

        // Initialize logger with user configuration
        this.logger = initializeLogger(this.options.logging);

        this.logger.startup("server", "Creating server...");

        // Create Express app immediately
        this.app = express() as UltraFastApp;

        // Add start method immediately so it's available right away
        this.addStartMethod();

        // Initialize ultra-fast processor first (using legacy config for backward compatibility)
        this.ultraFastProcessor = new UltraFastRequestProcessor({
            cpuWorkers: this.options.performance?.workers?.cpu || 4,
            ioWorkers: this.options.performance?.workers?.io || 2,
            maxCacheSize: this.options.cache?.maxSize || 1000,
            enablePrediction: true,
            enableCompression: true,
            maxConcurrentTasks: 100,
        });

        // Add ultra-fast middleware with type coercion
        this.app.use((req: Request, res: Response, next: NextFunction) => {
            const handler =
                this.ultraFastProcessor.middleware() as UltraFastMiddlewareHandler;
            handler(req, res, next, "", {}).catch(next);
        });

        // Initialize other components asynchronously
        this.initializeComponentsAsync();

        this.logger.debug(
            "server",
            "Ultra-fast Express server created with optimized request processing"
        );
    }

    private async initializeComponentsAsync(): Promise<void> {
        // Initialize components in parallel for faster startup
        await Promise.all([
            this.initializeCache(),
            this.initializePerformance(),
            this.initializePlugins(),
            this.initializeCluster(),
            this.initializeFileWatcher(),
        ]);

        // Initialize components that depend on others
        await this.initializeDependentComponents();

        // Add routes and monitoring endpoints
        this.routeManager.addMethods();
        this.monitoringManager.addMonitoringEndpoints();
        this.addConsoleInterceptionMethods();

        this.ready = true;
    }

    private async initializeCache(): Promise<void> {
        this.cacheManager = new CacheManager({
            cache: this.options.cache,
            performance: this.options.performance,
            server: this.options.server,
            env: this.options.env,
        });

        this.app.cache = this.cacheManager.getCache();
        await this.cacheManager.initializeCache();
    }

    private async initializePerformance(): Promise<void> {
        this.performanceManager = new PerformanceManager(
            {
                performance: this.options.performance,
                server: this.options.server,
                env: this.options.env,
            },
            {
                app: this.app,
                cacheManager: this.cacheManager,
            }
        );
    }

    private async initializePlugins(): Promise<void> {
        this.pluginManager = new PluginManager({
            app: this.app,
            cacheManager: this.cacheManager,
        });
    }

    private async initializeCluster(): Promise<void> {
        this.clusterManager = new ClusterManagerComponent(
            {
                cluster: this.options.cluster,
            },
            {
                app: this.app,
            }
        );
    }

    private async initializeFileWatcher(): Promise<void> {
        this.fileWatcherManager = new FileWatcherManager(
            {
                fileWatcher: this.options.fileWatcher,
            },
            {
                app: this.app,
                clusterManager: this.clusterManager,
            }
        );
    }

    private async initializeDependentComponents(): Promise<void> {
        // Initialize components that depend on others
        this.requestProcessor = new RequestProcessor({
            performanceProfiler:
                this.performanceManager.getPerformanceProfiler(),
            executionPredictor: this.performanceManager.getExecutionPredictor(),
            requestPreCompiler: this.performanceManager.getRequestPreCompiler(),
            pluginEngine: this.pluginManager.getPluginEngine(),
            cacheManager: this.cacheManager,
        });

        this.middlewareManager = new MiddlewareManager(
            {
                server: this.options.server,
                security: this.options.security,
                performance: this.options.performance,
                middleware: this.options.middleware,
            },
            {
                app: this.app,
                cache: this.cacheManager.getCache(),
                performanceProfiler:
                    this.performanceManager.getPerformanceProfiler(),
                executionPredictor:
                    this.performanceManager.getExecutionPredictor(),
                optimizationEnabled:
                    this.performanceManager.isOptimizationEnabled(),
                optimizationStats:
                    this.performanceManager.getOptimizationStats(),
                handleUltraFastPath: this.ultraFastProcessor
                    .middleware()
                    .bind(this.ultraFastProcessor),
                handleFastPath: this.requestProcessor.handleFastPath.bind(
                    this.requestProcessor
                ),
                handleStandardPath:
                    this.requestProcessor.handleStandardPath.bind(
                        this.requestProcessor
                    ),
            }
        );

        // Initialize remaining components
        this.middlewareMethodsManager = new MiddlewareMethodsManager({
            app: this.app,
            middlewareManager: this.middlewareManager,
        });

        this.routeManager = new RouteManager({
            app: this.app,
            cacheManager: this.cacheManager,
            middlewareManager: this.middlewareManager,
            ultraFastOptimizer: this.performanceManager.getUltraFastOptimizer(),
        });

        this.monitoringManager = new MonitoringManager(
            {
                monitoring: this.options.monitoring,
            },
            {
                app: this.app,
                cacheManager: this.cacheManager,
                performanceManager: this.performanceManager,
            }
        );

        this.redirectManager = new RedirectManager(this.logger);
        this.consoleInterceptor = new ConsoleInterceptor(
            this.logger,
            this.options.logging
        );

        if (this.options.logging?.consoleInterception?.enabled) {
            this.consoleInterceptor.start();
            this.logger.info(
                "console",
                "Console interception system activated"
            );
        }

        if (this.options.fileWatcher?.enabled) {
            this.fileWatcherManager.addFileWatcherMonitoringEndpoints(
                "/fortify"
            );
        }
    }

    /**
     * Get the Express app instance (ready to use immediately)
     */
    public getApp(): UltraFastApp {
        return this.app;
    }

    /**
     * Wait for full initialization (cache, console interceptor, and all components)
     */
    public async waitForReady(): Promise<void> {
        // Wait for cache initialization
        await this.initPromise;

        // Wait for console interceptor to be ready if enabled
        if (
            this.options.logging?.consoleInterception?.enabled &&
            this.consoleInterceptor
        ) {
            // Give console interceptor a moment to fully initialize
            await new Promise((resolve) => setTimeout(resolve, 10));
        }

        // Mark as ready
        this.ready = true;

        this.logger.debug("server", "All components initialized and ready");
    }

    /**
     * Get the RequestPreCompiler instance for configuration
     */
    public getRequestPreCompiler() {
        return this.performanceManager.getRequestPreCompiler();
    }

    /**
     * Get the ConsoleInterceptor instance for configuration
     */
    public getConsoleInterceptor() {
        return this.consoleInterceptor;
    }

    /**
     * Merge user options with defaults and file config
     */
    private mergeWithDefaults(
        userOptions: ServerOptions,
        fileConfig: Partial<ServerOptions> | null = null
    ): ServerOptions {
        return {
            ...DEFAULT_OPTIONS,
            ...(fileConfig || {}),
            ...userOptions,
        };
    }

    /**
     * Handle automatic port switching when port is in use
     */
    private async handlePortSwitching(
        requestedPort: number
    ): Promise<PortSwitchResult> {
        const portManager = new PortManager(
            requestedPort,
            this.options.server?.autoPortSwitch
        );
        const result = await portManager.findAvailablePort();

        if (result.switched) {
            this.logger.portSwitching(
                "server",
                `🔄 Port ${requestedPort} was in use, switched to port ${result.port}`
            );
            this.logger.portSwitching(
                "server",
                `   Attempts: ${result.attempts}, Strategy: ${
                    portManager.getConfig()?.strategy || "increment"
                }`
            );
        }

        if (!result.success) {
            const maxAttempts =
                this.options.server?.autoPortSwitch?.maxAttempts || 10;
            throw new Error(
                `Failed to find an available port after ${maxAttempts} attempts. ` +
                    `Original port: ${requestedPort}, Last attempted: ${result.port}`
            );
        }

        return result;
    }

    /**
     * Start server with error handling and port switching
     */
    private async startServerWithPortHandling(
        port: number,
        host: string,
        callback?: () => void
    ): Promise<any> {
        try {
            // Try to start server on the requested port
            return new Promise((resolve, reject) => {
                const server = this.app.listen(port, host, () => {
                    this.currentPort = port; // Track the actual running port
                    this.logger.info(
                        "server",
                        `Server running on ${host}:${port}`
                    );
                    this.logger.debug(
                        "server",
                        `State: ${this.ready ? "Ready" : "Initializing..."}`
                    );
                    if (callback) callback();
                    resolve(server);
                });

                server.on("error", async (error: any) => {
                    if (error.code === "EADDRINUSE") {
                        // Port is in use, try auto-switching if enabled
                        if (this.options.server?.autoPortSwitch?.enabled) {
                            try {
                                const result = await this.handlePortSwitching(
                                    port
                                );
                                // Recursively try with the new port
                                const newServer =
                                    await this.startServerWithPortHandling(
                                        result.port,
                                        host,
                                        callback
                                    );
                                resolve(newServer);
                            } catch (switchError) {
                                reject(switchError);
                            }
                        } else {
                            reject(
                                new Error(
                                    `Failed to start server. Port ${port} is already in use. ` +
                                        `Enable autoPortSwitch in server config to automatically find an available port.`
                                )
                            );
                        }
                    } else {
                        reject(error);
                    }
                });
            });
        } catch (error) {
            throw error;
        }
    }



    /**
     * Add start method to app with cluster support (full version)
     */
    private addStartMethod(): void {
       const start = async (port?: number, callback?: () => void) => {
            // **INTERNAL HANDLING**: Wait for server to be ready before starting
            // This ensures developers don't need to handle async initialization timing
            if (!this.ready) {
                this.logger.debug("server", "Waiting for initialization to complete...");
                await this.waitForReady();
                this.logger.info("server", "Initialization complete, starting server...");
            }

            const serverPort = port || this.options.server?.port || 3000;
            const host = this.options.server?.host || "localhost";

            // If we're in main process and hot reloader is enabled, start it first
            if (
                this.fileWatcherManager.isInMainProcess() &&
                this.fileWatcherManager.getHotReloader()
            ) {
              this.logger.debug("server","Taking hot reload mode path");
                this.logger.startup(
                    "fileWatcher",
                    "Starting with hot reload support..."
                );

                try {
                    // Start the hot reloader (which will spawn child process)
                    await this.fileWatcherManager.getHotReloader()!.start();

                    // Start file watcher in main process to monitor changes
                    if (this.fileWatcherManager.getFileWatcher()) {
                        await this.fileWatcherManager.startFileWatcherWithHotReload();
                    }

                    // Start the actual HTTP server in the main process too
                    this.httpServer = await this.startServerWithPortHandling(
                        serverPort,
                        host,
                        async () => {
                            this.fileWatcherManager.setHttpServer(
                                this.httpServer
                            );
                            if (callback) callback();
                        }
                    );

                    return this.httpServer;
                } catch (error: any) {
                    this.logger.error(
                        "fileWatcher",
                        "Hot reload startup failed:",
                        error.message
                    );
                    // Fall through to regular startup
                }
            }

            // Regular startup (child process or hot reload disabled)

            // If cluster is enabled, use cluster manager
            if (this.clusterManager.isClusterEnabled()) {
       this.logger.debug("server","Taking cluster mode path");
                // console.log("Starting cluster...");

                try {
                    // Start cluster manager
                    await this.clusterManager.startCluster();

                    // Check if we're in master or worker process
                    if (process.env.NODE_ENV !== "worker") {
                        this.logger.startup(
                            "cluster",
                            "Starting as cluster master process"
                        );

                        // Setup cluster event handlers
                        this.clusterManager.setupClusterEventHandlers();

                        // Start HTTP server in master process
                        this.httpServer =
                            await this.startServerWithPortHandling(
                                serverPort,
                                host,
                                async () => {
                                    // Set HTTP server reference for file watcher restarts
                                    this.fileWatcherManager.setHttpServer(
                                        this.httpServer
                                    );
                                    const clusterStats =
                                        await this.clusterManager.getClusterStats();
                                    this.logger.debug(
                                        "cluster",
                                        `Cluster master started with ${
                                            clusterStats.workers?.total || 0
                                        } workers`
                                    );

                                    // Start file watcher if enabled
                                    if (
                                        this.fileWatcherManager.getFileWatcher()
                                    ) {
                                        if (
                                            this.fileWatcherManager.isInMainProcess()
                                        ) {
                                            // Main process: start with hot reload
                                            await this.fileWatcherManager.startFileWatcherWithHotReload();
                                        } else {
                                            // Child process: start regular file watcher
                                            await this.fileWatcherManager.startFileWatcher();
                                        }
                                    }

                                    if (callback) callback();
                                }
                            );

                        return this.httpServer;
                    } else {
                        // Worker process
                        this.logger.startup(
                            "cluster",
                            `Worker ${process.pid} started`
                        );

                        const httpServer =
                            await this.startServerWithPortHandling(
                                serverPort,
                                host,
                                () => {
                                    this.logger.info(
                                        "cluster",
                                        `Worker ${process.pid} listening on ${host}:${serverPort}`
                                    );
                                    if (callback) callback();
                                }
                            );

                        return httpServer;
                    }
                } catch (error: any) {
                    this.logger.error(
                        "cluster",
                        "Failed to start cluster:",
                        error.message
                    );
                    // Fallback to single process
                    this.logger.info(
                        "cluster",
                        "Falling back to single process mode"
                    );
                }
            }

            // Single process mode (default)
   this.logger.debug("server", "Taking single process mode path");
            this.httpServer = await this.startServerWithPortHandling(
                serverPort,
                host,
                async () => {
                    // Set HTTP server reference for file watcher restarts
                    this.fileWatcherManager.setHttpServer(this.httpServer);

                    // Start file watcher if enabled
                    if (this.fileWatcherManager.getFileWatcher()) {
                        if (this.fileWatcherManager.isInMainProcess()) {
                            // Main process: start with hot reload
                            await this.fileWatcherManager.startFileWatcherWithHotReload();
                        } else {
                            // Child process: start regular file watcher
                            await this.fileWatcherManager.startFileWatcher();
                        }
                    }

                    if (callback) callback();
                }
            );

            return this.httpServer;
        };

        this.app.start = start;
        this.app.waitForReady = () => this.waitForReady();

        // Add port management methods
        this.app.getPort = () => this.getPort();
        this.app.forceClosePort = (port: number) => this.forceClosePort(port);
        this.app.redirectFromPort = (
            fromPort: number,
            toPort: number,
            options?: any
        ) => this.redirectManager.redirectFromPort(fromPort, toPort, options);

        // Add advanced redirect management methods
        this.app.getRedirectInstance = (fromPort: number) =>
            this.redirectManager.getRedirectInstance(fromPort);
        this.app.getAllRedirectInstances = () =>
            this.redirectManager.getAllRedirectInstances();
        this.app.disconnectRedirect = (fromPort: number) =>
            this.redirectManager.disconnectRedirect(fromPort);
        this.app.disconnectAllRedirects = () =>
            this.redirectManager.disconnectAllRedirects();
        this.app.getRedirectStats = (fromPort: number) =>
            this.redirectManager.getRedirectStats(fromPort);

        // Cluster methods are already added in constructor if cluster is enabled
    }

    // File watcher functionality now handled by FileWatcherManager component

    /**
     * Stop file watcher
     */
    public async stopFileWatcher(): Promise<void> {
        await this.fileWatcherManager.stopFileWatcher();
    }

    /**
     * Get file watcher status
     */
    public getFileWatcherStatus(): any {
        return this.fileWatcherManager.getFileWatcherStatus();
    }

    /**
     * Get file watcher restart stats
     */
    public getFileWatcherStats(): any {
        return this.fileWatcherManager.getFileWatcherStats();
    }

    // ===== PLUGIN MANAGEMENT METHODS =====

    /**
     * Register a plugin with the server
     */
    public async registerPlugin(plugin: any): Promise<void> {
        await this.pluginManager.registerPlugin(plugin);
    }

    /**
     * Unregister a plugin from the server
     */
    public async unregisterPlugin(pluginId: string): Promise<void> {
        await this.pluginManager.unregisterPlugin(pluginId);
    }

    /**
     * Get plugin by ID
     */
    public getPlugin(pluginId: string): any {
        return this.pluginManager.getPlugin(pluginId);
    }

    /**
     * Get all registered plugins
     */
    public getAllPlugins(): any[] {
        return this.pluginManager.getAllPlugins();
    }

    /**
     * Get plugins by type
     */
    public getPluginsByType(type: PluginType): any[] {
        return this.pluginManager.getPluginsByType(type);
    }

    /**
     * Get plugin execution statistics
     */
    public getPluginStats(pluginId?: string): any {
        return this.pluginManager.getPluginStats(pluginId);
    }

    /**
     * Get plugin registry statistics
     */
    public getPluginRegistryStats(): any {
        return this.pluginManager.getPluginRegistryStats();
    }

    /**
     * Get plugin engine statistics
     */
    public getPluginEngineStats(): any {
        return this.pluginManager.getPluginEngineStats();
    }

    /**
     * Initialize built-in plugins
     */
    public async initializeBuiltinPlugins(): Promise<void> {
        try {
            // Import and register built-in plugins
            const { JWTAuthPlugin } = await import(
                "./plugins/builtin/JWTAuthPlugin"
            );
            const { ResponseTimePlugin } = await import(
                "./plugins/builtin/ResponseTimePlugin"
            );
            const { SmartCachePlugin } = await import(
                "./plugins/builtin/SmartCachePlugin"
            );

            // Register security plugins
            await this.registerPlugin(new JWTAuthPlugin());

            // Register performance plugins
            await this.registerPlugin(new ResponseTimePlugin());

            // Register cache plugins
            await this.registerPlugin(new SmartCachePlugin());

            this.logger.debug(
                "plugins",
                "Built-in plugins initialized successfully"
            );
        } catch (error: any) {
            this.logger.error(
                "plugins",
                "Failed to initialize built-in plugins:",
                error.message
            );
        }
    }

    /**
     * Get comprehensive server statistics including plugins
     */
    public async getServerStats(): Promise<any> {
        const cacheStats = await this.cacheManager.getCacheStats();
        const pluginRegistryStats = this.getPluginRegistryStats();
        const pluginEngineStats = this.getPluginEngineStats();

        return {
            server: {
                ready: this.ready,
                uptime: process.uptime(),
                memoryUsage: process.memoryUsage(),
                cpuUsage: process.cpuUsage(),
            },
            cache: cacheStats,
            plugins: {
                registry: pluginRegistryStats,
                engine: pluginEngineStats,
                totalPlugins: pluginRegistryStats.totalPlugins,
                averageExecutionTime: pluginRegistryStats.averageExecutionTime,
            },
            cluster: await this.clusterManager.getClusterStats(),
            fileWatcher: this.getFileWatcherStats(),
        };
    }

    // ===== CONSOLE INTERCEPTION METHODS =====

    /**
     * Add console interception methods to the Express app
     */
    private addConsoleInterceptionMethods(): void {
        // Get console interceptor instance
        this.app.getConsoleInterceptor = () => {
            return this.consoleInterceptor;
        };

        // Enable console interception
        this.app.enableConsoleInterception = () => {
            this.consoleInterceptor.start();
        };

        // Disable console interception
        this.app.disableConsoleInterception = () => {
            this.consoleInterceptor.stop();
        };

        // Get console interception statistics
        this.app.getConsoleStats = () => {
            return this.consoleInterceptor.getStats();
        };

        // Reset console interception statistics
        this.app.resetConsoleStats = () => {
            this.consoleInterceptor.resetStats();
        };

        // File watcher methods
        this.app.getFileWatcherStatus = () => {
            return this.getFileWatcherStatus();
        };

        this.app.getFileWatcherStats = () => {
            return this.getFileWatcherStats();
        };

        this.app.stopFileWatcher = async () => {
            return await this.stopFileWatcher();
        };

        // TypeScript checking methods
        this.app.checkTypeScript = async (files?: string[]) => {
            return await this.fileWatcherManager.checkTypeScript(files);
        };

        this.app.getTypeScriptStatus = () => {
            return this.fileWatcherManager.getTypeScriptStatus();
        };

        this.app.enableTypeScriptChecking = () => {
            this.fileWatcherManager.enableTypeScriptChecking();
        };

        this.app.disableTypeScriptChecking = () => {
            this.fileWatcherManager.disableTypeScriptChecking();
        };

        // Expose FileWatcherManager for debugging and advanced usage
        this.app.getFileWatcherManager = () => {
            return this.fileWatcherManager;
        };

        // 🔐 Console encryption methods
        this.app.enableConsoleEncryption = (key?: string) => {
            this.consoleInterceptor.enableEncryption(key);
        };

        this.app.disableConsoleEncryption = () => {
            this.consoleInterceptor.disableEncryption();
        };

        // Simple encrypt method
        this.app.encrypt = (key: string) => {
            this.consoleInterceptor.encrypt(key);
        };

        this.app.setConsoleEncryptionKey = (key: string) => {
            this.consoleInterceptor.setEncryptionKey(key);
        };

        this.app.setConsoleEncryptionDisplayMode = (
            displayMode: "readable" | "encrypted" | "both",
            showEncryptionStatus?: boolean
        ) => {
            this.consoleInterceptor.setEncryptionDisplayMode(
                displayMode,
                showEncryptionStatus
            );
        };

        this.app.getEncryptedLogs = () => {
            return this.consoleInterceptor.getEncryptedLogs();
        };

        this.app.restoreConsoleFromEncrypted = async (
            encryptedData: string[],
            key: string
        ) => {
            return await this.consoleInterceptor.restoreFromEncrypted(
                encryptedData,
                key
            );
        };

        this.app.isConsoleEncryptionEnabled = () => {
            return this.consoleInterceptor.isEncryptionEnabled();
        };

        this.app.getConsoleEncryptionStatus = () => {
            return this.consoleInterceptor.getEncryptionStatus();
        };
    }

    // ===== PORT MANAGEMENT METHODS =====

    /**
     * Get the actual running port number
     * @returns The current port the server is running on
     */
    public getPort(): number {
        return this.currentPort;
    }

    /**
     * Attempt to forcefully close/free up the specified port
     * @param port - The port number to force close
     * @returns Promise<boolean> - true if successful, false if failed
     */
    public async forceClosePort(port: number): Promise<boolean> {
        return await new Port(port).forceClosePort();
    }

    public async stop(): Promise<void> {
        // Cleanup ultra-fast processor
        this.ultraFastProcessor.destroy();

        // Stop other components
        if (this.httpServer) {
            await new Promise<void>((resolve) => {
                this.httpServer.close(() => resolve());
            });
        }
    }
}

export { UltraFastServer as FastServer };
