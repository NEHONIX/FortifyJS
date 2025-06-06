/**
 * FortifyJS Worker Manager
 *  worker process lifecycle management with advanced monitoring
 */

import * as cluster from "cluster";
import * as os from "os";
import { EventEmitter } from "events";
import pidusage from "pidusage";
import { ClusterConfig, WorkerMetrics, WorkerPool } from "../../types/cluster";
import {
    SecurityErrorLogger,
    createSecurityError,
    ErrorType,
    ErrorSeverity,
} from "../../../../utils/errorHandler";
import { func } from "../../../../utils/fortified-function";
import { logger } from "../../server/utils/Logger";

/**
 * Advanced worker process manager with intelligent lifecycle management
 */
export class WorkerManager extends EventEmitter {
    private config: ClusterConfig;
    private errorLogger: SecurityErrorLogger;
    private workers: Map<string, cluster.Worker> = new Map();
    private workerMetrics: Map<string, WorkerMetrics> = new Map();
    private restartCounts: Map<string, number> = new Map();
    private lastRestartTime: Map<string, Date> = new Map();
    private workerPool: WorkerPool;
    private isShuttingDown = false;

    constructor(config: ClusterConfig, errorLogger: SecurityErrorLogger) {
        super();
        this.config = config;
        this.errorLogger = errorLogger;

        // Initialize worker pool
        this.workerPool = {
            active: new Map(),
            pending: new Set(),
            draining: new Set(),
            dead: new Map(),
            maxSize: this.getOptimalWorkerCount(),
            currentSize: 0,
            targetSize: this.getOptimalWorkerCount(),
        };

        this.setupClusterEventHandlers();
    }

    /**
     * Get optimal worker count based on configuration and system resources
     */
    private getOptimalWorkerCount(): number {
        const configWorkers = this.config.workers;

        if (typeof configWorkers === "number") {
            return Math.max(1, configWorkers);
        }

        if (configWorkers === "auto") {
            const cpuCount = os.cpus().length;
            // Leave one CPU for the master process
            return Math.max(1, cpuCount - 1);
        }

        // Default to CPU count - 1
        return Math.max(1, os.cpus().length - 1);
    }

    /**
     * Setup cluster event handlers with fortified error handling
     */
    private setupClusterEventHandlers(): void {
        const fortifiedHandler = func(
            (
                eventType: string,
                worker: cluster.Worker,
                code?: number,
                signal?: string
            ) => {
                this.handleWorkerEvent(eventType, worker, code, signal);
            },
            {
                ultraFast: "maximum",
                auditLog: true,
                errorHandling: "graceful",
            }
        );

        // Only setup event handlers in primary process
        if (process.env.NODE_ENV === "worker") return;

        // Setup cluster event handlers using process events
        process.on("message", (message: any) => {
            if (message.type === "worker_event") {
                this.handleWorkerMessage(null, message);
            }
        });

        // Monitor worker processes directly
        this.setupWorkerMonitoring();
    }

    /**
     * Setup real-time worker monitoring using pidusage
     */
    private setupWorkerMonitoring(): void {
        // Monitor worker processes every 5 seconds
        setInterval(async () => {
            await this.updateWorkerMetrics();
        }, 5000);
    }

    /**
     * Handle worker messages for IPC communication
     */
    private handleWorkerMessage(
        worker: cluster.Worker | null,
        message: any
    ): void {
        try {
            // Process worker messages for metrics, health checks, etc.
            if (message.type === "metrics_update") {
                this.updateWorkerMetricsFromMessage(
                    message.workerId,
                    message.data
                );
            } else if (message.type === "health_check") {
                this.updateWorkerHealth(message.workerId, message.data);
            }
        } catch (error: any) {
            const securityError = createSecurityError(
                `Worker message handling failed: ${error.message}`,
                ErrorType.INTERNAL,
                ErrorSeverity.MEDIUM,
                "WORKER_MESSAGE_ERROR",
                { operation: "worker_message_handling" }
            );
            this.errorLogger.logError(securityError);
        }
    }

    /**
     * Update worker metrics using real process monitoring
     */
    private async updateWorkerMetrics(): Promise<void> {
        const promises = Array.from(this.workers.entries()).map(
            async ([workerId, worker]) => {
                try {
                    if (!worker.process.pid) return;

                    // Get real CPU and memory usage using pidusage
                    const stats = await pidusage(worker.process.pid);

                    const metrics = this.workerMetrics.get(workerId);
                    if (metrics) {
                        // Update CPU metrics
                        metrics.cpu.usage = stats.cpu;
                        metrics.cpu.average =
                            (metrics.cpu.average + stats.cpu) / 2;
                        metrics.cpu.peak = Math.max(
                            metrics.cpu.peak,
                            stats.cpu
                        );

                        // Update memory metrics
                        metrics.memory.usage = stats.memory;
                        metrics.memory.peak = Math.max(
                            metrics.memory.peak,
                            stats.memory
                        );
                        metrics.memory.percentage =
                            (stats.memory / os.totalmem()) * 100;

                        // Update uptime

                        // Update uptime (use process start time or current time as fallback)
                        const processStartTime =
                            (worker.process as any).spawndate?.getTime() ||
                            Date.now();
                        metrics.uptime = Date.now() - processStartTime;

                        // Update health score based on performance
                        this.calculateHealthScore(metrics);
                    }
                } catch (error) {
                    // Worker might have died, handle gracefully
                    const metrics = this.workerMetrics.get(workerId);
                    if (metrics) {
                        metrics.health.status = "critical";
                        metrics.health.consecutiveFailures++;
                    }
                }
            }
        );

        await Promise.allSettled(promises);
    }

    /**
     * Update worker metrics from IPC message
     */
    private updateWorkerMetricsFromMessage(workerId: string, data: any): void {
        const metrics = this.workerMetrics.get(workerId);
        if (metrics && data) {
            // Update metrics from worker-reported data
            if (data.requests) {
                Object.assign(metrics.requests, data.requests);
            }
            if (data.network) {
                Object.assign(metrics.network, data.network);
            }
            if (data.gc) {
                Object.assign(metrics.gc, data.gc);
            }
            if (data.eventLoop) {
                Object.assign(metrics.eventLoop, data.eventLoop);
            }
        }
    }

    /**
     * Update worker health from health check
     */
    private updateWorkerHealth(workerId: string, healthData: any): void {
        const metrics = this.workerMetrics.get(workerId);
        if (metrics && healthData) {
            metrics.health.status = healthData.status || "healthy";
            metrics.health.lastCheck = new Date();
            metrics.health.healthScore = healthData.score || 100;

            if (healthData.status === "healthy") {
                metrics.health.consecutiveFailures = 0;
            } else {
                metrics.health.consecutiveFailures++;
            }
        }
    }

    /**
     * Calculate health score based on performance metrics
     */
    private calculateHealthScore(metrics: WorkerMetrics): void {
        let score = 100;

        // Deduct points for high CPU usage
        if (metrics.cpu.usage > 80) {
            score -= 20;
        } else if (metrics.cpu.usage > 60) {
            score -= 10;
        }

        // Deduct points for high memory usage
        if (metrics.memory.percentage > 90) {
            score -= 30;
        } else if (metrics.memory.percentage > 70) {
            score -= 15;
        }

        // Deduct points for high error rate
        if (metrics.requests.total > 0) {
            const errorRate =
                (metrics.requests.errors / metrics.requests.total) * 100;
            if (errorRate > 10) {
                score -= 25;
            } else if (errorRate > 5) {
                score -= 10;
            }
        }

        // Deduct points for slow response times
        if (metrics.requests.averageResponseTime > 2000) {
            score -= 15;
        } else if (metrics.requests.averageResponseTime > 1000) {
            score -= 5;
        }

        metrics.health.healthScore = Math.max(0, score);

        // Update health status based on score
        if (score >= 80) {
            metrics.health.status = "healthy";
        } else if (score >= 50) {
            metrics.health.status = "warning";
        } else {
            metrics.health.status = "critical";
        }
    }

    /**
     * Handle worker events with comprehensive monitoring
     */
    private async handleWorkerEvent(
        eventType: string,
        worker: cluster.Worker,
        code?: number,
        signal?: string
    ): Promise<void> {
        const workerId = this.getWorkerId(worker);

        try {
            switch (eventType) {
                case "fork":
                    await this.handleWorkerFork(workerId, worker);
                    break;
                case "online":
                    await this.handleWorkerOnline(workerId, worker);
                    break;
                case "listening":
                    await this.handleWorkerListening(workerId, worker);
                    break;
                case "disconnect":
                    await this.handleWorkerDisconnect(workerId, worker);
                    break;
                case "exit":
                    await this.handleWorkerExit(workerId, worker, code, signal);
                    break;
            }
        } catch (error: any) {
            const securityError = createSecurityError(
                `Worker event handling failed: ${error.message}`,
                ErrorType.INTERNAL,
                ErrorSeverity.HIGH,
                "WORKER_EVENT_ERROR",
                { operation: "worker_event_handling" }
            );
            this.errorLogger.logError(securityError);
        }
    }

    /**
     * Handle worker fork event
     */
    private async handleWorkerFork(
        workerId: string,
        worker: cluster.Worker
    ): Promise<void> {
        this.workers.set(workerId, worker);
        this.workerPool.pending.add(workerId);

        // Initialize worker metrics
        const metrics: WorkerMetrics = {
            workerId,
            pid: worker.process.pid || 0,
            uptime: 0,
            restarts: this.restartCounts.get(workerId) || 0,
            lastRestart: this.lastRestartTime.get(workerId),
            cpu: { usage: 0, average: 0, peak: 0 },
            memory: {
                usage: 0,
                peak: 0,
                percentage: 0,
                heapUsed: 0,
                heapTotal: 0,
                external: 0,
            },
            network: {
                connections: 0,
                bytesReceived: 0,
                bytesSent: 0,
                connectionsPerSecond: 0,
            },
            requests: {
                total: 0,
                perSecond: 0,
                errors: 0,
                averageResponseTime: 0,
                p95ResponseTime: 0,
                p99ResponseTime: 0,
                activeRequests: 0,
                queuedRequests: 0,
            },
            health: {
                status: "healthy",
                lastCheck: new Date(),
                consecutiveFailures: 0,
                healthScore: 100,
            },
            gc: { collections: 0, timeSpent: 0, averageTime: 0 },
            eventLoop: { delay: 0, utilization: 0 },
        };

        this.workerMetrics.set(workerId, metrics);
        this.emit("worker:started", workerId, worker.process.pid || 0);
    }

    /**
     * Handle worker online event
     */
    private async handleWorkerOnline(
        workerId: string,
        worker: cluster.Worker
    ): Promise<void> {
        this.workerPool.pending.delete(workerId);

        const metrics = this.workerMetrics.get(workerId);
        if (metrics) {
            this.workerPool.active.set(workerId, metrics);
            this.workerPool.currentSize++;
        }
    }

    /**
     * Handle worker listening event
     */
    private async handleWorkerListening(
        workerId: string,
        worker: cluster.Worker
    ): Promise<void> {
        const metrics = this.workerMetrics.get(workerId);
        if (metrics) {
            metrics.health.status = "healthy";
            metrics.health.lastCheck = new Date();
        }
    }

    /**
     * Handle worker disconnect event
     */
    private async handleWorkerDisconnect(
        workerId: string,
        worker: cluster.Worker
    ): Promise<void> {
        this.workerPool.active.delete(workerId);
        this.workerPool.draining.add(workerId);

        const metrics = this.workerMetrics.get(workerId);
        if (metrics) {
            metrics.health.status = "critical";
        }
    }

    /**
     * Handle worker exit event with intelligent restart logic
     */
    private async handleWorkerExit(
        workerId: string,
        worker: cluster.Worker,
        code?: number,
        signal?: string
    ): Promise<void> {
        // Clean up worker references
        this.workers.delete(workerId);
        this.workerPool.active.delete(workerId);
        this.workerPool.pending.delete(workerId);
        this.workerPool.draining.delete(workerId);
        this.workerPool.currentSize--;

        // Record death information
        this.workerPool.dead.set(workerId, {
            diedAt: new Date(),
            reason: signal ? `Signal: ${signal}` : `Exit code: ${code}`,
            exitCode: code,
            signal,
            restartCount: this.restartCounts.get(workerId) || 0,
        });

        // Update metrics
        const metrics = this.workerMetrics.get(workerId);
        if (metrics) {
            metrics.health.status = "dead";
        }

        this.emit("worker:died", workerId, code || 0, signal || "");

        // Attempt restart if enabled and not shutting down
        if (
            this.shouldRestartWorker(workerId, code, signal) &&
            !this.isShuttingDown
        ) {
            await this.restartWorker(workerId);
        }
    }

    /**
     * Determine if worker should be restarted based on configuration and conditions
     */
    private shouldRestartWorker(
        workerId: string,
        code?: number,
        signal?: string
    ): boolean {
        const respawnConfig = this.config.processManagement?.respawn;
        if (respawnConfig === false) return false;

        const maxRestarts = this.config.processManagement?.maxRestarts || 5;
        const currentRestarts = this.restartCounts.get(workerId) || 0;

        if (currentRestarts >= maxRestarts) {
            return false;
        }

        // Don't restart on intentional shutdown signals
        if (signal === "SIGTERM" || signal === "SIGINT") {
            return false;
        }

        // Don't restart on successful exit
        if (code === 0) {
            return false;
        }

        return true;
    }

    /**
     * Restart a worker with delay and monitoring
     */
    private async restartWorker(workerId: string): Promise<void> {
        const restartDelay =
            this.config.processManagement?.restartDelay || 1000;
        const currentRestarts = this.restartCounts.get(workerId) || 0;

        // Increment restart count
        this.restartCounts.set(workerId, currentRestarts + 1);
        this.lastRestartTime.set(workerId, new Date());

        // Wait for restart delay
        await new Promise((resolve) => setTimeout(resolve, restartDelay));

        // Fork new worker using real cluster API
        if (process.env.NODE_ENV !== "worker") {
            const newWorker = require("cluster").fork();
            const newWorkerId = this.getWorkerId(newWorker);

            // Transfer restart count to new worker
            this.restartCounts.set(newWorkerId, currentRestarts + 1);
            this.lastRestartTime.set(newWorkerId, new Date());

            this.emit("worker:restarted", newWorkerId, "automatic_restart");
        }
    }

    /**
     * Generate unique worker ID
     */
    private getWorkerId(worker: cluster.Worker): string {
        return `worker_${worker.id}_${Date.now()}`;
    }

    /**
     * Start specified number of workers
     */
    public async startWorkers(count?: number): Promise<void> {
        const workerCount = count || this.workerPool.targetSize;

        if (process.env.NODE_ENV === "worker") return;

        for (let i = 0; i < workerCount; i++) {
            try {
                const worker = require("cluster").fork();
                const workerId = this.getWorkerId(worker);
                logger.info( "cluster",
                    `Started worker ${
                        i + 1
                    }/${workerCount} (ID: ${workerId}, PID: ${
                        worker.process.pid
                    })`
                );

                // Wait a bit between forks to avoid overwhelming the system
                await new Promise((resolve) => setTimeout(resolve, 100));
            } catch (error: any) {
                const securityError = createSecurityError(
                    `Failed to start worker ${i + 1}: ${error.message}`,
                    ErrorType.INTERNAL,
                    ErrorSeverity.HIGH,
                    "WORKER_START_ERROR",
                    { operation: "start_worker" }
                );
                this.errorLogger.logError(securityError);
            }
        }
    }

    /**
     * Stop all workers gracefully
     */
    public async stopAllWorkers(graceful: boolean = true): Promise<void> {
        this.isShuttingDown = true;
        const timeout =
            this.config.processManagement?.gracefulShutdownTimeout || 30000;

        const promises = Array.from(this.workers.values()).map((worker) =>
            this.stopWorker(worker, graceful, timeout)
        );

        await Promise.allSettled(promises);
    }

    /**
     * Stop individual worker
     */
    private async stopWorker(
        worker: cluster.Worker,
        graceful: boolean,
        timeout: number
    ): Promise<void> {
        return new Promise((resolve) => {
            const timer = setTimeout(() => {
                worker.kill("SIGKILL");
                resolve();
            }, timeout);

            worker.once("disconnect", () => {
                clearTimeout(timer);
                resolve();
            });

            if (graceful) {
                worker.disconnect();
            } else {
                worker.kill("SIGTERM");
            }
        });
    }

    /**
     * Get all active workers
     */
    public getActiveWorkers(): WorkerMetrics[] {
        return Array.from(this.workerPool.active.values());
    }

    /**
     * Get worker by ID
     */
    public getWorker(workerId: string): WorkerMetrics | null {
        return this.workerMetrics.get(workerId) || null;
    }

    /**
     * Get worker pool status
     */
    public getWorkerPool(): WorkerPool {
        return { ...this.workerPool };
    }

    /**
     * Start a single worker and return its ID
     */
    public async startSingleWorker(): Promise<string> {
        if (process.env.NODE_ENV === "worker") {
            throw new Error("Cannot start worker from worker process");
        }

        try {
            const clusterModule = require("cluster");

            // Check if we're in a runtime that supports cluster.fork
            if (typeof clusterModule.fork !== "function") {
                // Fallback for Bun or other runtimes
                const mockWorkerId = `simulated_worker_${Date.now()}_${Math.random()
                    .toString(36)
                    .substring(2, 11)}`;
                logger.info( "cluster",
                    `Runtime doesn't support cluster.fork, simulating worker: ${mockWorkerId}`
                );
                return mockWorkerId;
            }

            const worker = clusterModule.fork();
            const workerId = this.getWorkerId(worker);

            // Wait for worker to come online
            await new Promise<void>((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error(`Worker ${workerId} startup timeout`));
                }, 10000);

                worker.once("online", () => {
                    clearTimeout(timeout);
                    resolve();
                });

                worker.once("error", (error: Error) => {
                    clearTimeout(timeout);
                    reject(error);
                });
            });

            return workerId;
        } catch (error: any) {
            throw new Error(`Failed to start worker: ${error.message}`);
        }
    }

    /**
     * Stop a specific worker
     */
    public async stopSingleWorker(
        workerId: string,
        graceful: boolean = true
    ): Promise<void> {
        const worker = this.workers.get(workerId);
        if (!worker) {
            throw new Error(`Worker ${workerId} not found`);
        }

        const timeout =
            this.config.processManagement?.gracefulShutdownTimeout || 30000;
        await this.stopWorker(worker, graceful, timeout);
    }
}

