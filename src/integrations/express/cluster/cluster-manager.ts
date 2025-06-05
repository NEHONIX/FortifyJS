/**
 * FortifyJS Cluster Manager
 * Production-ready cluster management for Express applications with advanced monitoring
 */

import * as cluster from "cluster";
import * as os from "os";
import { EventEmitter } from "events";
import {
    ClusterConfig,
    RobustClusterManager,
    ClusterMetrics,
    WorkerMetrics,
    ClusterState,
    ClusterEvents,
} from "../types/cluster";
import { WorkerManager } from "./WorkerManager";
import { HealthMonitor } from "./HealthMonitor";
import { LoadBalancer } from "./LoadBalancer";
import { IPCManager } from "./IPCManager";
import { MetricsCollector } from "./MetricsCollector";
import { AutoScaler } from "./AutoScaler";
import {
    SecurityErrorLogger,
    createSecurityError,
    ErrorType,
    ErrorSeverity,
} from "../../../utils/errorHandler";
import { DEFAULT_CLUSTER_CONFIGS } from "../server/const/Cluster.config";

/**
 * Production-ready cluster manager with comprehensive monitoring and auto-scaling
 */
export class ClusterManager
    extends EventEmitter
    implements RobustClusterManager
{
    private config: ClusterConfig;
    private state: ClusterState = "initializing";
    private workerManager: WorkerManager;
    private healthMonitor: HealthMonitor;
    private loadBalancer: LoadBalancer;
    private ipcManager: IPCManager;
    private metricsCollector: MetricsCollector;
    private autoScaler: AutoScaler;
    private errorLogger: SecurityErrorLogger;
    private startTime: Date = new Date();
    private isShuttingDown = false;
    private serverFactory?: () => Promise<void>;

    constructor(config: ClusterConfig = {}) {
        super();

        // Apply intelligent defaults
        this.config = this.applyDefaults(config);

        // Initialize components with fortified security
        this.errorLogger = new SecurityErrorLogger();
        this.workerManager = new WorkerManager(this.config, this.errorLogger);
        this.healthMonitor = new HealthMonitor(this.config, this.errorLogger);
        this.loadBalancer = new LoadBalancer(this.config);
        this.ipcManager = new IPCManager(this.config, this.errorLogger);
        this.metricsCollector = new MetricsCollector(this.config);
        this.autoScaler = new AutoScaler(this.config, this.errorLogger);

        // Setup component integrations
        this.setupComponentIntegrations();

        // Setup event forwarding
        this.setupEventForwarding();

        // Setup error handling
        this.setupErrorHandling();
    }

    /**
     * Apply intelligent defaults to cluster configuration
     */
    private applyDefaults(config: ClusterConfig): ClusterConfig {
        const defaults: ClusterConfig = DEFAULT_CLUSTER_CONFIGS;

        return this.mergeDeep(defaults, config);
    }

    /**
     * Deep merge configuration objects
     */
    private mergeDeep(target: any, source: any): any {
        const result = { ...target };

        for (const key in source) {
            if (
                source[key] &&
                typeof source[key] === "object" &&
                !Array.isArray(source[key])
            ) {
                result[key] = this.mergeDeep(target[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }

        return result;
    }

    /**
     * Setup component integrations for cross-component communication
     */
    private setupComponentIntegrations(): void {
        // Integrate IPC Manager with Worker Manager
        this.ipcManager.setWorkerManager(this.workerManager);

        // Setup auto-scaler with worker manager and metrics collector integration
        this.autoScaler.setWorkerManager(this.workerManager);
        this.autoScaler.setMetricsCollector(this.metricsCollector);

        // Setup metrics collector with worker manager integration
        this.metricsCollector.setWorkerManager(this.workerManager);

        // Setup health monitor with worker manager integration
        this.healthMonitor.setWorkerManager(this.workerManager);
    }

    /**
     * Setup event forwarding between components
     */
    private setupEventForwarding(): void {
        // Forward worker manager events
        this.workerManager.on("worker:started", (workerId, pid) => {
            this.emit("worker:started", workerId, pid);
        });

        this.workerManager.on("worker:died", (workerId, code, signal) => {
            this.emit("worker:died", workerId, code, signal);
        });

        this.workerManager.on("worker:restarted", (workerId, reason) => {
            this.emit("worker:restarted", workerId, reason);
        });

        // Forward health monitor events
        this.healthMonitor.on("worker:health:warning", (workerId, metrics) => {
            this.emit("worker:health:warning", workerId, metrics);
        });

        this.healthMonitor.on("worker:health:critical", (workerId, metrics) => {
            this.emit("worker:health:critical", workerId, metrics);
        });

        // Forward auto-scaler events
        this.autoScaler.on("cluster:scaled", (action, newWorkerCount) => {
            this.emit("cluster:scaled", action, newWorkerCount);
        });

        this.autoScaler.on(
            "scaling:triggered",
            (reason, currentWorkers, targetWorkers) => {
                this.emit(
                    "scaling:triggered",
                    reason,
                    currentWorkers,
                    targetWorkers
                );
            }
        );

        // Forward load balancer events
        this.loadBalancer.on("loadbalancer:updated", (strategy, weights) => {
            this.emit("loadbalancer:updated", strategy, weights);
        });

        // Forward IPC events
        this.ipcManager.on("ipc:message", (from, to, message) => {
            this.emit("ipc:message", from, to, message);
        });

        this.ipcManager.on("ipc:broadcast", (from, message) => {
            this.emit("ipc:broadcast", from, message);
        });

        // Forward metrics events
        this.metricsCollector.on("metrics:updated", (metrics) => {
            this.updateClusterState(metrics);
        });
    }

    /**
     * Setup comprehensive error handling
     */
    private setupErrorHandling(): void {
        // Handle uncaught exceptions
        process.on("uncaughtException", (error) => {
            const securityError = createSecurityError(
                `Uncaught exception in cluster manager: ${error.message}`,
                ErrorType.INTERNAL,
                ErrorSeverity.CRITICAL,
                "CLUSTER_UNCAUGHT_EXCEPTION",
                { operation: "cluster_manager" }
            );
            this.errorLogger.logError(securityError);

            if (this.config.errorHandling?.uncaughtException === "restart") {
                this.handleCriticalError("uncaught_exception");
            }
        });

        // Handle unhandled rejections
        process.on("unhandledRejection", (reason) => {
            const securityError = createSecurityError(
                `Unhandled rejection in cluster manager: ${reason}`,
                ErrorType.INTERNAL,
                ErrorSeverity.CRITICAL,
                "CLUSTER_UNHANDLED_REJECTION",
                { operation: "cluster_manager" }
            );
            this.errorLogger.logError(securityError);

            if (this.config.errorHandling?.unhandledRejection === "restart") {
                this.handleCriticalError("unhandled_rejection");
            }
        });
    }

    /**
     * Update cluster state based on metrics
     */
    private updateClusterState(metrics: ClusterMetrics): void {
        // Update state based on cluster health
        if (metrics.healthOverall.status === "critical") {
            this.state = "degraded";
        } else if (metrics.activeWorkers === 0) {
            this.state = "stopped";
        } else if (this.state === "initializing" || this.state === "starting") {
            this.state = "running";
        }
    }

    /**
     * Handle critical errors with recovery strategies
     */
    private async handleCriticalError(errorType: string): Promise<void> {
        console.error(`Critical error detected: ${errorType}`);

        try {
            // Attempt graceful recovery
            await this.restart();
        } catch (error) {
            console.error("Failed to recover from critical error:", error);
            process.exit(1);
        }
    }

    // ===== CORE CLUSTER MANAGEMENT METHODS =====

    /**
     * Start the cluster with intelligent worker management
     */
    public async start(): Promise<void> {
        if (this.state === "running") {
            console.log("Cluster is already running");
            return;
        }

        this.state = "starting";

        try {
            console.log("Starting FortifyJS cluster...");

            // Determine if we're in master or worker process
            const clusterModule = require("cluster");

            if (clusterModule.isMaster) {
                console.log("Starting as cluster master process");

                // Start monitoring components
                this.healthMonitor.startMonitoring();
                this.metricsCollector.startCollection();

                // Start workers
                await this.workerManager.startWorkers();

                // Update auto-scaler with initial worker count
                const workerCount =
                    this.workerManager.getActiveWorkers().length;
                this.autoScaler.updateWorkerCount(workerCount);

                // Setup graceful shutdown
                this.setupGracefulShutdown();

                console.log(
                    `Cluster master started with ${workerCount} workers`
                );
            } else {
                console.log(`Worker ${process.pid} started`);

                // Worker-specific initialization
                this.setupWorkerProcess();
            }

            this.state = "running";
            console.log("FortifyJS cluster started successfully");
        } catch (error: any) {
            this.state = "error";
            const securityError = createSecurityError(
                `Cluster start failed: ${error.message}`,
                ErrorType.INTERNAL,
                ErrorSeverity.CRITICAL,
                "CLUSTER_START_ERROR",
                { operation: "start" }
            );
            this.errorLogger.logError(securityError);
            throw error;
        }
    }

    /**
     * Setup worker process initialization
     */
    private setupWorkerProcess(): void {
        // Set worker environment
        process.env.WORKER_ID =
            process.env.WORKER_ID || process.pid?.toString() || "unknown";
        process.env.NODE_ENV = "worker";

        // Setup worker-specific error handling
        process.on("uncaughtException", (error) => {
            console.error("Worker uncaught exception:", error);
            process.exit(1);
        });

        process.on("unhandledRejection", (reason, promise) => {
            console.error(
                "Worker unhandled rejection at:",
                promise,
                "reason:",
                reason
            );
            process.exit(1);
        });

        // Send ready signal to master
        if (process.send) {
            process.send({
                type: "worker_ready",
                workerId: process.env.WORKER_ID,
                pid: process.pid,
            });
        }
    }

    /**
     * Setup graceful shutdown handling
     */
    private setupGracefulShutdown(): void {
        const gracefulShutdown = async (signal: string) => {
            console.log(`Received ${signal}, starting graceful shutdown...`);
            try {
                await this.stop();
                process.exit(0);
            } catch (error) {
                console.error("Error during graceful shutdown:", error);
                process.exit(1);
            }
        };

        process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
        process.on("SIGINT", () => gracefulShutdown("SIGINT"));
    }

    /**
     * Stop the cluster gracefully or forcefully
     */
    public async stop(graceful: boolean = true): Promise<void> {
        if (this.state === "stopped" || this.state === "stopping") {
            console.log("Cluster is already stopped or stopping");
            return;
        }

        this.state = "stopping";

        try {
            console.log(
                `Stopping cluster ${graceful ? "gracefully" : "forcefully"}...`
            );

            // Stop monitoring
            this.healthMonitor.stopMonitoring();
            this.metricsCollector.stopCollection();
            this.autoScaler.stopScaling();

            // Stop all workers
            await this.workerManager.stopAllWorkers(graceful);

            this.state = "stopped";
            console.log("Cluster stopped successfully");
        } catch (error: any) {
            this.state = "error";
            const securityError = createSecurityError(
                `Cluster stop failed: ${error.message}`,
                ErrorType.INTERNAL,
                ErrorSeverity.HIGH,
                "CLUSTER_STOP_ERROR",
                { operation: "stop" }
            );
            this.errorLogger.logError(securityError);
            throw error;
        }
    }

    /**
     * Restart the cluster or specific worker
     */
    public async restart(workerId?: string): Promise<void> {
        if (workerId) {
            // Restart specific worker using WorkerManager
            try {
                console.log(`Restarting worker ${workerId}...`);

                // Use WorkerManager to restart the specific worker
                const newWorkerId = await this.replaceWorker(workerId);

                this.emit("worker:restarted", newWorkerId, "manual_restart");
                console.log(`Worker ${workerId} restarted as ${newWorkerId}`);
            } catch (error: any) {
                const securityError = createSecurityError(
                    `Failed to restart worker ${workerId}: ${error.message}`,
                    ErrorType.INTERNAL,
                    ErrorSeverity.HIGH,
                    "WORKER_RESTART_ERROR",
                    { operation: "restart_worker" }
                );
                this.errorLogger.logError(securityError);
                throw error;
            }
        } else {
            // Restart entire cluster
            try {
                console.log("Restarting entire cluster...");
                await this.stop(true);
                await new Promise((resolve) => setTimeout(resolve, 2000)); // Brief pause
                await this.start();
                console.log("Cluster restarted successfully");
            } catch (error: any) {
                const securityError = createSecurityError(
                    `Failed to restart cluster: ${error.message}`,
                    ErrorType.INTERNAL,
                    ErrorSeverity.CRITICAL,
                    "CLUSTER_RESTART_ERROR",
                    { operation: "restart_cluster" }
                );
                this.errorLogger.logError(securityError);
                throw error;
            }
        }
    }

    /**
     * Pause cluster operations
     */
    public async pause(): Promise<void> {
        if (this.state !== "running") {
            throw new Error("Cannot pause cluster: not running");
        }

        this.state = "paused";

        // Pause monitoring
        this.healthMonitor.stopMonitoring();
        this.autoScaler.disable();

        console.log("Cluster paused");
    }

    /**
     * Resume cluster operations
     */
    public async resume(): Promise<void> {
        if (this.state !== "paused") {
            throw new Error("Cannot resume cluster: not paused");
        }

        this.state = "running";

        // Resume monitoring
        this.healthMonitor.startMonitoring();
        this.autoScaler.enable();

        console.log("Cluster resumed");
    }

    // ===== WORKER MANAGEMENT METHODS =====

    /**
     * Add new worker to the cluster
     */
    public async addWorker(): Promise<string> {
        const workers = this.workerManager.getActiveWorkers();
        const maxWorkers = this.config.autoScaling?.maxWorkers || 8;

        if (workers.length >= maxWorkers) {
            throw new Error("Cannot add worker: maximum worker limit reached");
        }

        try {
            // Use WorkerManager to actually start a worker
            const workerId = await this.workerManager.startSingleWorker();

            // Update auto-scaler with new worker count
            this.autoScaler.updateWorkerCount(workers.length + 1);

            this.emit("worker:started", workerId, 0);
            return workerId;
        } catch (error: any) {
            const securityError = createSecurityError(
                `Failed to add worker: ${error.message}`,
                ErrorType.INTERNAL,
                ErrorSeverity.HIGH,
                "WORKER_ADD_ERROR",
                { operation: "add_worker" }
            );
            this.errorLogger.logError(securityError);
            throw error;
        }
    }

    /**
     * Remove worker from the cluster
     */
    public async removeWorker(
        workerId: string,
        graceful: boolean = true
    ): Promise<void> {
        const workers = this.workerManager.getActiveWorkers();
        const minWorkers = this.config.autoScaling?.minWorkers || 1;

        if (workers.length <= minWorkers) {
            throw new Error(
                "Cannot remove worker: minimum worker limit reached"
            );
        }

        try {
            // Use WorkerManager to actually stop the worker
            await this.workerManager.stopSingleWorker(workerId, graceful);

            // Update auto-scaler with new worker count
            this.autoScaler.updateWorkerCount(workers.length - 1);

            this.emit(
                "worker:died",
                workerId,
                0,
                graceful ? "SIGTERM" : "SIGKILL"
            );
        } catch (error: any) {
            const securityError = createSecurityError(
                `Failed to remove worker ${workerId}: ${error.message}`,
                ErrorType.INTERNAL,
                ErrorSeverity.HIGH,
                "WORKER_REMOVE_ERROR",
                { operation: "remove_worker" }
            );
            this.errorLogger.logError(securityError);
            throw error;
        }
    }

    /**
     * Replace worker with a new one
     */
    public async replaceWorker(workerId: string): Promise<string> {
        console.log(`Replacing worker ${workerId}...`);

        // Start new worker first
        const newWorkerId = await this.addWorker();

        // Wait for new worker to be ready
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Remove old worker
        await this.removeWorker(workerId, true);

        return newWorkerId;
    }

    /**
     * Get worker by ID
     */
    public getWorker(workerId: string): WorkerMetrics | null {
        return this.workerManager.getWorker(workerId);
    }

    /**
     * Get all workers
     */
    public getAllWorkers(): WorkerMetrics[] {
        return this.workerManager.getActiveWorkers();
    }

    /**
     * Get active workers
     */
    public getActiveWorkers(): WorkerMetrics[] {
        return this.workerManager
            .getActiveWorkers()
            .filter(
                (w) =>
                    w.health.status === "healthy" ||
                    w.health.status === "warning"
            );
    }

    /**
     * Get unhealthy workers
     */
    public getUnhealthyWorkers(): WorkerMetrics[] {
        return this.workerManager
            .getActiveWorkers()
            .filter(
                (w) =>
                    w.health.status === "critical" || w.health.status === "dead"
            );
    }

    // ===== HEALTH MONITORING METHODS =====

    /**
     * Check health of specific worker or all workers
     */
    public async checkHealth(workerId?: string): Promise<boolean> {
        if (workerId) {
            return await this.healthMonitor.checkWorkerHealth(workerId);
        } else {
            await this.healthMonitor.performHealthChecks();
            const healthStatus = this.healthMonitor.getHealthStatus();
            return Object.values(healthStatus).every((healthy) => healthy);
        }
    }

    /**
     * Get health status of all workers
     */
    public async getHealthStatus(): Promise<{ [workerId: string]: boolean }> {
        return this.healthMonitor.getHealthStatus();
    }

    /**
     * Run comprehensive health check
     */
    public async runHealthCheck(): Promise<void> {
        await this.healthMonitor.performHealthChecks();
    }

    // ===== METRICS AND MONITORING METHODS =====

    /**
     * Get comprehensive cluster metrics
     */
    public async getMetrics(): Promise<ClusterMetrics> {
        return this.metricsCollector.getClusterMetrics();
    }

    /**
     * Get metrics for specific worker
     */
    public async getWorkerMetrics(
        workerId: string
    ): Promise<WorkerMetrics | null> {
        return this.metricsCollector.getWorkerMetrics(workerId);
    }

    /**
     * Get aggregated metrics summary
     */
    public async getAggregatedMetrics(): Promise<{
        cpu: number;
        memory: number;
        requests: number;
        errors: number;
        responseTime: number;
    }> {
        return this.metricsCollector.getAggregatedMetrics();
    }

    /**
     * Start monitoring systems
     */
    public startMonitoring(): void {
        this.healthMonitor.startMonitoring();
        this.metricsCollector.startCollection();
        console.log("Monitoring systems started");
    }

    /**
     * Stop monitoring systems
     */
    public stopMonitoring(): void {
        this.healthMonitor.stopMonitoring();
        this.metricsCollector.stopCollection();
        console.log("Monitoring systems stopped");
    }

    /**
     * Export metrics in specified format
     */
    public async exportMetrics(
        format: "json" | "prometheus" | "csv" = "json"
    ): Promise<string> {
        return await this.metricsCollector.exportMetrics(format);
    }

    // ===== SCALING METHODS =====

    /**
     * Scale up by adding workers
     */
    public async scaleUp(count: number = 1): Promise<void> {
        await this.autoScaler.scaleUp(count);
    }

    /**
     * Scale down by removing workers
     */
    public async scaleDown(count: number = 1): Promise<void> {
        await this.autoScaler.scaleDown(count);
    }

    /**
     * Perform auto-scaling evaluation
     */
    public async autoScale(): Promise<void> {
        await this.autoScaler.autoScale();
    }

    /**
     * Get optimal worker count
     */
    public async getOptimalWorkerCount(): Promise<number> {
        return await this.autoScaler.getOptimalWorkerCount();
    }

    // ===== LOAD BALANCING METHODS =====

    /**
     * Update load balancing strategy
     */
    public async updateLoadBalancingStrategy(
        strategy: string,
        options?: any
    ): Promise<void> {
        await this.loadBalancer.updateStrategy(strategy, options);
    }

    /**
     * Get load balance status
     */
    public async getLoadBalanceStatus(): Promise<{
        [workerId: string]: number;
    }> {
        return this.loadBalancer.getLoadBalanceStatus();
    }

    /**
     * Redistribute load across workers
     */
    public async redistributeLoad(): Promise<void> {
        await this.loadBalancer.redistributeLoad();
    }

    // ===== IPC METHODS =====

    /**
     * Send message to specific worker
     */
    public async sendToWorker(workerId: string, message: any): Promise<void> {
        await this.ipcManager.sendToWorker(workerId, message);
    }

    /**
     * Send message to all workers
     */
    public async sendToAllWorkers(message: any): Promise<void> {
        await this.ipcManager.sendToAllWorkers(message);
    }

    /**
     * Broadcast message to all workers
     */
    public async broadcast(message: any): Promise<void> {
        await this.ipcManager.broadcast(message);
    }

    /**
     * Send message to random worker
     */
    public async sendToRandomWorker(message: any): Promise<void> {
        await this.ipcManager.sendToRandomWorker(message);
    }

    /**
     * Send message to least loaded worker
     */
    public async sendToLeastLoadedWorker(message: any): Promise<void> {
        await this.ipcManager.sendToLeastLoadedWorker(message);
    }

    // ===== EVENT HANDLING METHODS =====

    /**
     * Register event handler
     */
    public addListener<K extends keyof ClusterEvents>(
        event: K,
        handler: ClusterEvents[K]
    ): this {
        return super.on(event as string, handler as any);
    }

    /**
     * Remove event handler
     */
    public removeListener<K extends keyof ClusterEvents>(
        event: K,
        handler: ClusterEvents[K]
    ): this {
        return super.off(event as string, handler as any);
    }

    /**
     * Emit cluster event
     */
    public emitEvent<K extends keyof ClusterEvents>(
        event: K,
        ...args: Parameters<ClusterEvents[K]>
    ): boolean {
        return super.emit(event as string, ...args);
    }

    // ===== STATE MANAGEMENT METHODS =====

    /**
     * Save cluster state
     */
    public async saveState(): Promise<void> {
        try {
            const clusterState = {
                config: this.config,
                state: this.state,
                startTime: this.startTime,
                workers: this.workerManager.getWorkerPool(),
                metrics: await this.getMetrics(),
                timestamp: new Date().toISOString(),
            };

            // In production, this would save to persistent storage (Redis, file system, etc.)
            // For now, emit event for external handling
            this.emit("cluster:state:saved", clusterState);
        } catch (error: any) {
            const securityError = createSecurityError(
                `Failed to save cluster state: ${error.message}`,
                ErrorType.INTERNAL,
                ErrorSeverity.MEDIUM,
                "CLUSTER_STATE_SAVE_ERROR",
                { operation: "save_state" }
            );
            this.errorLogger.logError(securityError);
            throw error;
        }
    }

    /**
     * Restore cluster state
     */
    public async restoreState(): Promise<void> {
        try {
            // In production, this would restore from persistent storage
            // For now, emit event for external handling
            this.emit("cluster:state:restore_requested");

            // Placeholder for actual restoration logic
            // const savedState = await this.loadStateFromStorage();
            // if (savedState) {
            //     await this.applyRestoredState(savedState);
            // }
        } catch (error: any) {
            const securityError = createSecurityError(
                `Failed to restore cluster state: ${error.message}`,
                ErrorType.INTERNAL,
                ErrorSeverity.MEDIUM,
                "CLUSTER_STATE_RESTORE_ERROR",
                { operation: "restore_state" }
            );
            this.errorLogger.logError(securityError);
            throw error;
        }
    }

    /**
     * Get current cluster state
     */
    public async getState(): Promise<ClusterState> {
        return this.state;
    }

    /**
     * Export cluster configuration
     */
    public async exportConfiguration(): Promise<ClusterConfig> {
        return { ...this.config };
    }

    // ===== UTILITY METHODS =====

    /**
     * Check if cluster is healthy
     */
    public isHealthy(): boolean {
        const activeWorkers = this.getActiveWorkers();
        const totalWorkers = this.getAllWorkers();

        if (totalWorkers.length === 0) return false;

        const healthyPercentage =
            (activeWorkers.length / totalWorkers.length) * 100;
        return healthyPercentage >= 70; // 70% threshold
    }

    /**
     * Get load balance score
     */
    public getLoadBalance(): number {
        return this.loadBalancer.getLoadDistributionEfficiency();
    }

    /**
     * Get recommended worker count
     */
    public getRecommendedWorkerCount(): number {
        const cpuCount = os.cpus().length;
        const currentLoad = this.getActiveWorkers().length;

        // Simple recommendation based on CPU cores and current load
        return Math.max(1, Math.min(cpuCount - 1, currentLoad));
    }

    /**
     * Get cluster efficiency score
     */
    public getClusterEfficiency(): number {
        const loadBalanceEfficiency = this.getLoadBalance();
        const healthScore = this.isHealthy() ? 100 : 50;
        const utilizationScore = this.calculateUtilizationScore();

        return (loadBalanceEfficiency + healthScore + utilizationScore) / 3;
    }

    /**
     * Calculate utilization score
     */
    private calculateUtilizationScore(): number {
        const workers = this.getActiveWorkers();
        if (workers.length === 0) return 0;

        const avgCpu =
            workers.reduce((sum, w) => sum + w.cpu.usage, 0) / workers.length;
        const avgMemory =
            workers.reduce((sum, w) => sum + w.memory.percentage, 0) /
            workers.length;

        // Optimal utilization is around 60-70%
        const optimalCpu = 65;
        const optimalMemory = 65;

        const cpuScore = 100 - Math.abs(avgCpu - optimalCpu);
        const memoryScore = 100 - Math.abs(avgMemory - optimalMemory);

        return (cpuScore + memoryScore) / 2;
    }

    // ===== ADVANCED FEATURES =====

    /**
     * Enable profiling for worker
     */
    public async enableProfiling(workerId: string): Promise<void> {
        console.log(`Enabling profiling for worker ${workerId}`);
        await this.sendToWorker(workerId, { type: "enable_profiling" });
    }

    /**
     * Disable profiling for worker
     */
    public async disableProfiling(workerId: string): Promise<void> {
        console.log(`Disabling profiling for worker ${workerId}`);
        await this.sendToWorker(workerId, { type: "disable_profiling" });
    }

    /**
     * Take heap snapshot of worker
     */
    public async takeHeapSnapshot(workerId: string): Promise<string> {
        const snapshotPath = `/tmp/heap-snapshot-${workerId}-${Date.now()}.heapsnapshot`;
        console.log(
            `Taking heap snapshot for worker ${workerId}: ${snapshotPath}`
        );

        await this.sendToWorker(workerId, {
            type: "take_heap_snapshot",
            path: snapshotPath,
        });

        return snapshotPath;
    }

    /**
     * Enable debug mode for worker
     */
    public async enableDebugMode(
        workerId: string,
        port?: number
    ): Promise<void> {
        const debugPort = port || 9229;
        console.log(
            `Enabling debug mode for worker ${workerId} on port ${debugPort}`
        );

        await this.sendToWorker(workerId, {
            type: "enable_debug",
            port: debugPort,
        });
    }

    /**
     * Disable debug mode for worker
     */
    public async disableDebugMode(workerId: string): Promise<void> {
        console.log(`Disabling debug mode for worker ${workerId}`);
        await this.sendToWorker(workerId, { type: "disable_debug" });
    }

    // ===== ROLLING UPDATES =====

    /**
     * Perform rolling update
     */
    public async performRollingUpdate(
        updateFn: () => Promise<void>
    ): Promise<void> {
        console.log("Starting rolling update...");

        const workers = this.getAllWorkers();
        const maxUnavailable =
            this.config.advanced?.deployment?.maxUnavailable || 1;

        for (let i = 0; i < workers.length; i += maxUnavailable) {
            const batch = workers.slice(i, i + maxUnavailable);

            // Drain workers in batch
            for (const worker of batch) {
                await this.drainWorker(worker.workerId);
            }

            // Perform update
            await updateFn();

            // Replace workers
            for (const worker of batch) {
                await this.replaceWorker(worker.workerId);
            }

            // Wait for new workers to be ready
            await new Promise((resolve) => setTimeout(resolve, 5000));
        }

        console.log("Rolling update completed");
    }

    /**
     * Drain worker connections
     */
    public async drainWorker(workerId: string): Promise<void> {
        console.log(`Draining worker ${workerId}...`);

        await this.sendToWorker(workerId, { type: "drain_connections" });

        // Wait for connections to drain
        await new Promise((resolve) => setTimeout(resolve, 10000));
    }

    // ===== CIRCUIT BREAKER =====

    /**
     * Check if circuit breaker is open
     */
    public isCircuitOpen(workerId?: string): boolean {
        if (workerId) {
            const worker = this.getWorker(workerId);
            return worker ? worker.health.consecutiveFailures >= 5 : false;
        }

        // Check overall cluster circuit breaker
        const unhealthyWorkers = this.getUnhealthyWorkers();
        const totalWorkers = this.getAllWorkers();

        return (
            totalWorkers.length > 0 &&
            unhealthyWorkers.length / totalWorkers.length > 0.5
        );
    }

    /**
     * Reset circuit breaker
     */
    public async resetCircuitBreaker(workerId?: string): Promise<void> {
        if (workerId) {
            console.log(`Resetting circuit breaker for worker ${workerId}`);
            await this.sendToWorker(workerId, {
                type: "reset_circuit_breaker",
            });
        } else {
            console.log("Resetting cluster circuit breaker");
            // Reset all worker circuit breakers
            const workers = this.getAllWorkers();
            for (const worker of workers) {
                await this.sendToWorker(worker.workerId, {
                    type: "reset_circuit_breaker",
                });
            }
        }
    }

    // ===== CLEANUP METHODS =====

    /**
     * Cleanup cluster resources
     */
    public async cleanup(): Promise<void> {
        console.log("Cleaning up cluster resources...");

        await this.stop(true);

        // Cleanup monitoring
        this.healthMonitor.stopMonitoring();
        this.metricsCollector.stopCollection();
        this.autoScaler.stopScaling();

        console.log("Cluster cleanup completed");
    }

    /**
     * Force cleanup cluster resources
     */
    public async forceCleanup(): Promise<void> {
        console.log("Force cleaning up cluster resources...");

        await this.stop(false);

        // Force cleanup
        this.removeAllListeners();

        console.log("Force cleanup completed");
    }
}

