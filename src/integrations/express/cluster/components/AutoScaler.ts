/**
 * FortifyJS Auto Scaler
 * Intelligent auto-scaling with predictive analytics and resource optimization
 */

import { EventEmitter } from "events";
import * as os from "os";
import { performance } from "perf_hooks";
import pidusage from "pidusage";
import {
    ClusterConfig,
    AutoScaler as AutoScalerInterface,
    ScalingDecision,
    ScalingHistory,
} from "../../types/cluster";
import {
    SecurityErrorLogger,
    createSecurityError,
    ErrorType,
    ErrorSeverity,
} from "../../../../utils/errorHandler";
import { func } from "../../../../utils/fortified-function";
import { logger } from "../../server/utils/Logger";

/**
 * Advanced auto-scaler with machine learning-inspired decision making
 */
export class AutoScaler extends EventEmitter {
    private config: ClusterConfig;
    private errorLogger: SecurityErrorLogger;
    private autoScaler: AutoScalerInterface;
    private scalingHistory: ScalingHistory[] = [];
    private lastScalingAction = Date.now();
    private isScaling = false;
    private scalingInterval?: NodeJS.Timeout;
    private currentWorkerCount = 0;
    private workerManager?: any; // Will be injected by ClusterManager
    private metricsCollector?: any; // Will be injected by ClusterManager
    private scalingTimings: Map<string, number> = new Map(); // Track scaling operation timings

    constructor(config: ClusterConfig, errorLogger: SecurityErrorLogger) {
        super();
        this.config = config;
        this.errorLogger = errorLogger;

        // Initialize auto-scaler configuration
        this.autoScaler = {
            enabled: config.autoScaling?.enabled !== false,
            minWorkers: config.autoScaling?.minWorkers || 1,
            maxWorkers: config.autoScaling?.maxWorkers || 8,
            cooldownPeriod: config.autoScaling?.cooldownPeriod || 300000, // 5 minutes
            lastScalingAction: new Date(),
            pendingActions: [],
        };

        this.setupAutoScaling();
    }

    /**
     * Setup auto-scaling with intelligent monitoring
     */
    private setupAutoScaling(): void {
        if (!this.autoScaler.enabled) return;

        // Start scaling evaluation loop
        this.startScalingEvaluation();

        // Emit initialization event instead of logging
        this.emit("autoscaler:initialized", {
            minWorkers: this.autoScaler.minWorkers,
            maxWorkers: this.autoScaler.maxWorkers,
            cooldownPeriod: this.autoScaler.cooldownPeriod,
        });
    }

    /**
     * Start scaling evaluation loop
     */
    private startScalingEvaluation(): void {
        const evaluationInterval = 30000; // 30 seconds

        const fortifiedEvaluator = func(
            async () => {
                await this.evaluateScaling();
            },
            {
                ultraFast: "maximum",
                auditLog: true,
                timeout: 15000,
                errorHandling: "graceful",
            }
        );

        this.scalingInterval = setInterval(() => {
            fortifiedEvaluator().catch((error) => {
                const securityError = createSecurityError(
                    `Auto-scaling evaluation failed: ${error.message}`,
                    ErrorType.INTERNAL,
                    ErrorSeverity.MEDIUM,
                    "AUTOSCALING_ERROR",
                    { operation: "auto_scaling_evaluation" }
                );
                this.errorLogger.logError(securityError);
            });
        }, evaluationInterval);
    }

    /**
     * Stop auto-scaling evaluation
     */
    public stopScaling(): void {
        if (this.scalingInterval) {
            clearInterval(this.scalingInterval);
            this.scalingInterval = undefined;
        }
        this.emit("autoscaler:stopped");
    }

    /**
     * Evaluate scaling needs based on current metrics
     */
    private async evaluateScaling(): Promise<void> {
        if (this.isScaling || !this.autoScaler.enabled) return;

        // Check cooldown period
        if (this.isInCooldownPeriod()) return;

        try {
            // Get current metrics from integrated MetricsCollector
            const metrics = await this.getCurrentMetrics();

            // Make scaling decision
            const decision = this.makeScalingDecision(metrics);

            // Execute scaling if needed
            if (decision.action !== "no-action") {
                await this.executeScaling(decision);
            }
        } catch (error: any) {
            const securityError = createSecurityError(
                `Scaling evaluation error: ${error.message}`,
                ErrorType.INTERNAL,
                ErrorSeverity.MEDIUM,
                "SCALING_EVALUATION_ERROR",
                { operation: "scaling_evaluation" }
            );
            this.errorLogger.logError(securityError);
        }
    }

    /**
     * Make intelligent scaling decision based on metrics
     */
    private makeScalingDecision(metrics: any): ScalingDecision {
        const scaleUpThreshold = this.config.autoScaling?.scaleUpThreshold;
        const scaleDownThreshold = this.config.autoScaling?.scaleDownThreshold;

        let action: "scale-up" | "scale-down" | "no-action" = "no-action";
        let reason = "No scaling needed";
        let confidence = 0;
        let targetWorkers = this.currentWorkerCount;

        // Evaluate scale-up conditions
        const scaleUpReasons: string[] = [];
        let scaleUpScore = 0;

        if (scaleUpThreshold?.cpu && metrics.cpu > scaleUpThreshold.cpu) {
            scaleUpReasons.push(
                `CPU usage (${metrics.cpu}%) > threshold (${scaleUpThreshold.cpu}%)`
            );
            scaleUpScore += 30;
        }

        if (
            scaleUpThreshold?.memory &&
            metrics.memory > scaleUpThreshold.memory
        ) {
            scaleUpReasons.push(
                `Memory usage (${metrics.memory}%) > threshold (${scaleUpThreshold.memory}%)`
            );
            scaleUpScore += 25;
        }

        if (
            scaleUpThreshold?.responseTime &&
            metrics.responseTime > scaleUpThreshold.responseTime
        ) {
            scaleUpReasons.push(
                `Response time (${metrics.responseTime}ms) > threshold (${scaleUpThreshold.responseTime}ms)`
            );
            scaleUpScore += 35;
        }

        if (
            scaleUpThreshold?.queueLength &&
            metrics.queueLength > scaleUpThreshold.queueLength
        ) {
            scaleUpReasons.push(
                `Queue length (${metrics.queueLength}) > threshold (${scaleUpThreshold.queueLength})`
            );
            scaleUpScore += 40;
        }

        // Evaluate scale-down conditions
        const scaleDownReasons: string[] = [];
        let scaleDownScore = 0;

        if (scaleDownThreshold?.cpu && metrics.cpu < scaleDownThreshold.cpu) {
            scaleDownReasons.push(
                `CPU usage (${metrics.cpu}%) < threshold (${scaleDownThreshold.cpu}%)`
            );
            scaleDownScore += 20;
        }

        if (
            scaleDownThreshold?.memory &&
            metrics.memory < scaleDownThreshold.memory
        ) {
            scaleDownReasons.push(
                `Memory usage (${metrics.memory}%) < threshold (${scaleDownThreshold.memory}%)`
            );
            scaleDownScore += 15;
        }

        if (
            scaleDownThreshold?.idleTime &&
            metrics.idleTime > scaleDownThreshold.idleTime
        ) {
            scaleDownReasons.push(
                `Idle time (${metrics.idleTime}min) > threshold (${scaleDownThreshold.idleTime}min)`
            );
            scaleDownScore += 30;
        }

        // Make decision based on scores and historical data
        if (
            scaleUpScore >= 50 &&
            this.currentWorkerCount < this.autoScaler.maxWorkers
        ) {
            action = "scale-up";
            reason = scaleUpReasons.join(", ");
            confidence = Math.min(100, scaleUpScore);
            targetWorkers = Math.min(
                this.autoScaler.maxWorkers,
                this.currentWorkerCount +
                    (this.config.autoScaling?.scaleStep || 1)
            );
        } else if (
            scaleDownScore >= 40 &&
            this.currentWorkerCount > this.autoScaler.minWorkers
        ) {
            action = "scale-down";
            reason = scaleDownReasons.join(", ");
            confidence = Math.min(100, scaleDownScore);
            targetWorkers = Math.max(
                this.autoScaler.minWorkers,
                this.currentWorkerCount -
                    (this.config.autoScaling?.scaleStep || 1)
            );
        }

        // Apply historical learning
        confidence = this.adjustConfidenceBasedOnHistory(action, confidence);

        return {
            action,
            targetWorkers,
            reason,
            confidence,
            metrics: {
                cpu: metrics.cpu,
                memory: metrics.memory,
                responseTime: metrics.responseTime,
                queueLength: metrics.queueLength,
            },
        };
    }

    /**
     * Adjust confidence based on historical scaling success
     */
    private adjustConfidenceBasedOnHistory(
        action: string,
        baseConfidence: number
    ): number {
        const recentHistory = this.scalingHistory
            .filter((h) => h.timestamp.getTime() > Date.now() - 3600000) // Last hour
            .filter((h) => h.action === action);

        if (recentHistory.length === 0) return baseConfidence;

        const successRate =
            recentHistory.filter((h) => h.success).length /
            recentHistory.length;

        // Adjust confidence based on success rate
        if (successRate > 0.8) {
            return Math.min(100, baseConfidence * 1.1); // Boost confidence
        } else if (successRate < 0.5) {
            return Math.max(0, baseConfidence * 0.8); // Reduce confidence
        }

        return baseConfidence;
    }

    /**
     * Execute scaling decision
     */
    private async executeScaling(decision: ScalingDecision): Promise<void> {
        if (decision.confidence < 60) {
            this.emit("scaling:skipped", {
                reason: "Low confidence",
                confidence: decision.confidence,
                decision: decision.action,
            });
            return;
        }

        this.isScaling = true;
        const startWorkers = this.currentWorkerCount;
        const scalingId = `${decision.action}_${Date.now()}`;
        const scalingStartTime = Date.now();
        let success = false;

        try {
            this.emit("scaling:executing", {
                action: decision.action,
                fromWorkers: startWorkers,
                toWorkers: decision.targetWorkers,
                reason: decision.reason,
                confidence: decision.confidence,
            });

            this.emit(
                "scaling:triggered",
                decision.reason,
                startWorkers,
                decision.targetWorkers
            );

            if (decision.action === "scale-up") {
                await this.scaleUp(decision.targetWorkers - startWorkers);
            } else {
                await this.scaleDown(startWorkers - decision.targetWorkers);
            }

            success = true;
            this.currentWorkerCount = decision.targetWorkers;
            this.lastScalingAction = Date.now();
            this.autoScaler.lastScalingAction = new Date();

            // Record scaling timing
            const scalingDuration = Date.now() - scalingStartTime;
            this.scalingTimings.set(scalingId, scalingDuration);

            this.emit("scaling:completed", {
                action: decision.action,
                fromWorkers: startWorkers,
                toWorkers: decision.targetWorkers,
                success: true,
                duration: scalingDuration,
            });
        } catch (error: any) {
            const securityError = createSecurityError(
                `Scaling execution failed: ${error.message}`,
                ErrorType.INTERNAL,
                ErrorSeverity.HIGH,
                "SCALING_EXECUTION_ERROR",
                { operation: "scaling_execution" }
            );
            this.errorLogger.logError(securityError);
        } finally {
            // Record scaling history
            this.recordScalingHistory({
                timestamp: new Date(),
                action: decision.action as "scale-up" | "scale-down",
                fromWorkers: startWorkers,
                toWorkers: decision.targetWorkers,
                reason: decision.reason,
                success,
            });

            this.isScaling = false;
        }
    }

    /**
     * Scale up by adding workers using real cluster forking
     */
    public async scaleUp(count: number = 1): Promise<void> {
        const targetCount = Math.min(
            this.autoScaler.maxWorkers,
            this.currentWorkerCount + count
        );
        const actualCount = targetCount - this.currentWorkerCount;

        if (actualCount <= 0) {
            throw new Error("Cannot scale up: already at maximum workers");
        }

        this.emit("scaling:starting", {
            action: "scale-up",
            count: actualCount,
            targetCount,
        });

        try {
            // Fork new workers using real cluster API with runtime compatibility
            const clusterModule = require("cluster");
            const startPromises: Promise<void>[] = [];

            // Check if we're in a runtime that supports cluster.fork (Node.js vs Bun)
            if (typeof clusterModule.fork !== "function") {
                // Fallback for Bun or other runtimes that don't support cluster.fork
                logger.debug(
                    "other",
                    `Runtime doesn't support cluster.fork, simulating ${actualCount} workers`
                );
                for (let i = 0; i < actualCount; i++) {
                    const mockWorkerId = `simulated_worker_${Date.now()}_${i}`;
                    const mockPid = process.pid + i + 1;

                    this.emit("worker:online", {
                        workerId: mockWorkerId,
                        pid: mockPid,
                    });

                    this.emit("worker:started", mockWorkerId, mockPid);
                }

                // Update worker count for simulation
                this.currentWorkerCount = targetCount;

                this.emit("cluster:scaled", "scale-up", targetCount);
                this.emit("scaling:success", {
                    action: "scale-up",
                    targetCount,
                    message: `Successfully simulated scaling up to ${targetCount} workers`,
                });
                return;
            }

            for (let i = 0; i < actualCount; i++) {
                const startPromise = new Promise<void>((resolve, reject) => {
                    const worker = clusterModule.fork();
                    const timeout = setTimeout(() => {
                        reject(
                            new Error(`Worker startup timeout after 10 seconds`)
                        );
                    }, 10000);

                    worker.once("online", () => {
                        clearTimeout(timeout);
                        this.emit("worker:online", {
                            workerId: worker.id,
                            pid: worker.process.pid,
                        });
                        resolve();
                    });

                    worker.once("error", (error: Error) => {
                        clearTimeout(timeout);
                        reject(error);
                    });
                });

                startPromises.push(startPromise);

                // Stagger worker starts to avoid overwhelming the system
                if (i < actualCount - 1) {
                    await new Promise((resolve) => setTimeout(resolve, 500));
                }
            }

            // Wait for all workers to start
            await Promise.all(startPromises);

            this.emit("cluster:scaled", "scale-up", targetCount);
            this.emit("scaling:success", {
                action: "scale-up",
                targetCount,
                message: `Successfully scaled up to ${targetCount} workers`,
            });
        } catch (error: any) {
            throw new Error(`Failed to scale up workers: ${error.message}`);
        }
    }

    /**
     * Scale down by gracefully removing workers
     */
    public async scaleDown(count: number = 1): Promise<void> {
        const targetCount = Math.max(
            this.autoScaler.minWorkers,
            this.currentWorkerCount - count
        );
        const actualCount = this.currentWorkerCount - targetCount;

        if (actualCount <= 0) {
            throw new Error("Cannot scale down: already at minimum workers");
        }

        this.emit("scaling:starting", {
            action: "scale-down",
            count: actualCount,
            targetCount,
        });

        try {
            const clusterModule = require("cluster");

            // Check if we're in a runtime that supports cluster workers
            if (
                !clusterModule.workers ||
                typeof clusterModule.workers !== "object"
            ) {
                // Fallback for Bun or other runtimes
                logger.debug(
                    "other",
                    `Runtime doesn't support cluster.workers, simulating scale down of ${actualCount} workers`
                );

                // Update worker count for simulation
                this.currentWorkerCount = targetCount;

                this.emit("cluster:scaled", "scale-down", targetCount);
                logger.debug(
                    "other",
                    `Successfully simulated scaling down to ${targetCount} workers`
                );
                return;
            }

            const workers = Object.values(clusterModule.workers || {});
            const workersToStop = workers.slice(0, actualCount);
            const stopPromises: Promise<void>[] = [];

            for (const worker of workersToStop) {
                if (
                    worker &&
                    typeof worker === "object" &&
                    "disconnect" in worker
                ) {
                    const stopPromise = new Promise<void>((resolve, reject) => {
                        const timeout = setTimeout(() => {
                            // Force kill if graceful shutdown takes too long
                            if (
                                "kill" in worker &&
                                typeof worker.kill === "function"
                            ) {
                                worker.kill("SIGKILL");
                            }
                            resolve();
                        }, 10000); // 10 second timeout

                        const workerObj = worker as any;

                        workerObj.once("disconnect", () => {
                            clearTimeout(timeout);
                            this.emit("worker:disconnected", {
                                workerId: workerObj.id,
                                graceful: true,
                            });
                            resolve();
                        });

                        workerObj.once("error", (error: Error) => {
                            clearTimeout(timeout);
                            logger.warn(
                                "other",
                                `Worker ${workerObj.id} error during shutdown:`,
                                error.message
                            );
                            resolve(); // Continue with shutdown even on error
                        });

                        // Start graceful shutdown
                        if (
                            "disconnect" in workerObj &&
                            typeof workerObj.disconnect === "function"
                        ) {
                            workerObj.disconnect();
                        }
                    });

                    stopPromises.push(stopPromise);
                }
            }

            // Wait for all workers to stop
            await Promise.all(stopPromises);

            this.emit("cluster:scaled", "scale-down", targetCount);
            logger.debug(
                "other",
                `Successfully scaled down to ${targetCount} workers`
            );
        } catch (error: any) {
            throw new Error(`Failed to scale down workers: ${error.message}`);
        }
    }

    /**
     * Perform auto-scaling evaluation
     */
    public async autoScale(): Promise<void> {
        await this.evaluateScaling();
    }

    /**
     * Get optimal worker count based on current conditions
     */
    public async getOptimalWorkerCount(): Promise<number> {
        const metrics = await this.getCurrentMetrics();
        const decision = this.makeScalingDecision(metrics);

        return decision.targetWorkers;
    }

    /**
     * Check if in cooldown period
     */
    private isInCooldownPeriod(): boolean {
        return (
            Date.now() - this.lastScalingAction < this.autoScaler.cooldownPeriod
        );
    }

    /**
     * Get current system metrics using MetricsCollector integration
     */
    private async getCurrentMetrics(): Promise<any> {
        try {
            // First priority: Use MetricsCollector for comprehensive metrics
            if (this.metricsCollector) {
                try {
                    const clusterMetrics =
                        this.metricsCollector.getClusterMetrics();
                    const aggregatedMetrics =
                        this.metricsCollector.getAggregatedMetrics();

                    return {
                        cpu: aggregatedMetrics.cpu,
                        memory: aggregatedMetrics.memory,
                        responseTime: aggregatedMetrics.responseTime,
                        queueLength: this.estimateQueueLength(
                            aggregatedMetrics.cpu,
                            clusterMetrics.activeWorkers
                        ),
                        idleTime: Math.max(
                            0,
                            (100 - aggregatedMetrics.cpu) / 10
                        ),
                        systemLoad: clusterMetrics.resources.totalCpu,
                        systemMemory:
                            (clusterMetrics.resources.totalMemory /
                                clusterMetrics.resources.availableMemory) *
                            100,
                        workerCount: clusterMetrics.activeWorkers,
                        totalRequests: clusterMetrics.totalRequests,
                        errorRate: clusterMetrics.errorRate,
                    };
                } catch (error) {
                    // Fall through to WorkerManager integration
                }
            }

            // Second priority: Use WorkerManager for worker-specific metrics
            if (this.workerManager) {
                try {
                    const workers = this.workerManager.getActiveWorkers();
                    const workerCount = workers.length;

                    if (workerCount > 0) {
                        let totalWorkerCpu = 0;
                        let totalWorkerMemory = 0;
                        let totalResponseTime = 0;
                        let totalQueueLength = 0;

                        workers.forEach((worker: any) => {
                            totalWorkerCpu += worker.cpu?.usage || 0;
                            totalWorkerMemory += worker.memory?.percentage || 0;
                            totalResponseTime +=
                                worker.requests?.averageResponseTime || 0;
                            totalQueueLength +=
                                worker.requests?.queuedRequests || 0;
                        });

                        const avgWorkerCpu = totalWorkerCpu / workerCount;
                        const avgWorkerMemory = totalWorkerMemory / workerCount;
                        const avgResponseTime = totalResponseTime / workerCount;
                        const avgQueueLength = totalQueueLength / workerCount;

                        return {
                            cpu: Math.min(100, avgWorkerCpu),
                            memory: Math.min(100, avgWorkerMemory),
                            responseTime: avgResponseTime,
                            queueLength: avgQueueLength,
                            idleTime: Math.max(0, (100 - avgWorkerCpu) / 10),
                            systemLoad: avgWorkerCpu,
                            systemMemory: avgWorkerMemory,
                            workerCount: workerCount,
                        };
                    }
                } catch (error) {
                    // Fall through to direct cluster monitoring
                }
            }

            // Third priority: Direct cluster monitoring with pidusage
            const clusterModule = require("cluster");
            if (clusterModule.workers) {
                const workerPromises = Object.values(clusterModule.workers).map(
                    async (worker: any) => {
                        if (
                            worker &&
                            worker.process &&
                            worker.process.pid &&
                            !worker.isDead()
                        ) {
                            try {
                                const stats = await pidusage(
                                    worker.process.pid
                                );
                                return { cpu: stats.cpu, memory: stats.memory };
                            } catch (error) {
                                return { cpu: 0, memory: 0 };
                            }
                        }
                        return { cpu: 0, memory: 0 };
                    }
                );

                const workerStats = await Promise.all(workerPromises);
                let totalWorkerCpu = 0;
                let totalWorkerMemory = 0;
                let workerCount = 0;

                workerStats.forEach((stats) => {
                    totalWorkerCpu += stats.cpu;
                    totalWorkerMemory += stats.memory / (1024 * 1024); // Convert to MB
                    if (stats.cpu > 0 || stats.memory > 0) workerCount++;
                });

                if (workerCount > 0) {
                    const avgWorkerCpu = totalWorkerCpu / workerCount;
                    const avgWorkerMemory = totalWorkerMemory / workerCount;

                    return {
                        cpu: Math.min(100, avgWorkerCpu),
                        memory: Math.min(100, avgWorkerMemory),
                        responseTime: this.estimateResponseTime(
                            avgWorkerCpu,
                            workerCount
                        ),
                        queueLength: this.estimateQueueLength(
                            avgWorkerCpu,
                            workerCount
                        ),
                        idleTime: Math.max(0, (100 - avgWorkerCpu) / 10),
                        systemLoad: avgWorkerCpu,
                        systemMemory: avgWorkerMemory,
                        workerCount: workerCount,
                    };
                }
            }

            // Final fallback: System-wide metrics
            const totalMem = os.totalmem();
            const freeMem = os.freemem();
            const memoryUsage = ((totalMem - freeMem) / totalMem) * 100;
            const loadAvg = os.loadavg()[0];
            const cpuCount = os.cpus().length;
            const cpuUsage = (loadAvg / cpuCount) * 100;

            return {
                cpu: Math.min(100, cpuUsage),
                memory: memoryUsage,
                responseTime: cpuUsage * 10,
                queueLength: Math.floor(cpuUsage / 10),
                idleTime: Math.max(0, (100 - cpuUsage) / 10),
                systemLoad: cpuUsage,
                systemMemory: memoryUsage,
                workerCount: this.currentWorkerCount,
            };
        } catch (error: any) {
            // Emergency fallback
            return {
                cpu: 50,
                memory: 50,
                responseTime: 100,
                queueLength: 5,
                idleTime: 5,
                systemLoad: 50,
                systemMemory: 50,
                workerCount: this.currentWorkerCount,
            };
        }
    }

    /**
     * Estimate response time based on CPU usage and worker count
     */
    private estimateResponseTime(
        cpuUsage: number,
        workerCount: number
    ): number {
        // Base response time increases with CPU usage
        let baseTime = 50; // 50ms base

        if (cpuUsage > 80) {
            baseTime += (cpuUsage - 80) * 20; // Add 20ms per % over 80%
        } else if (cpuUsage > 60) {
            baseTime += (cpuUsage - 60) * 5; // Add 5ms per % over 60%
        }

        // Adjust for worker count - fewer workers = higher response time
        if (workerCount > 0) {
            const optimalWorkers = os.cpus().length;
            if (workerCount < optimalWorkers) {
                baseTime *= optimalWorkers / workerCount;
            }
        }

        return Math.min(5000, baseTime); // Cap at 5 seconds
    }

    /**
     * Estimate queue length based on CPU usage and worker count
     */
    private estimateQueueLength(cpuUsage: number, workerCount: number): number {
        if (cpuUsage < 50) return 0;

        // Queue builds up when CPU is high
        let queueLength = Math.floor((cpuUsage - 50) / 10);

        // Adjust for worker count
        if (workerCount > 0) {
            const optimalWorkers = os.cpus().length;
            if (workerCount < optimalWorkers) {
                queueLength *= optimalWorkers / workerCount;
            }
        }

        return Math.min(100, queueLength); // Cap at 100
    }

    /**
     * Record scaling history for learning
     */
    private recordScalingHistory(entry: ScalingHistory): void {
        this.scalingHistory.push(entry);

        // Keep only last 100 entries
        if (this.scalingHistory.length > 100) {
            this.scalingHistory.splice(0, this.scalingHistory.length - 100);
        }
    }

    /**
     * Update current worker count
     */
    public updateWorkerCount(count: number): void {
        this.currentWorkerCount = count;
    }

    /**
     * Get scaling configuration
     */
    public getConfiguration(): AutoScalerInterface {
        return { ...this.autoScaler };
    }

    /**
     * Get scaling history
     */
    public getScalingHistory(): ScalingHistory[] {
        return [...this.scalingHistory];
    }

    /**
     * Get scaling statistics
     */
    public getScalingStats(): {
        totalScalingActions: number;
        successfulActions: number;
        failedActions: number;
        successRate: number;
        averageScalingTime: number;
        lastScalingAction?: Date;
    } {
        const total = this.scalingHistory.length;
        const successful = this.scalingHistory.filter((h) => h.success).length;
        const failed = total - successful;
        const successRate = total > 0 ? (successful / total) * 100 : 0;

        return {
            totalScalingActions: total,
            successfulActions: successful,
            failedActions: failed,
            successRate,
            averageScalingTime: this.calculateAverageScalingTime(),
            lastScalingAction: this.autoScaler.lastScalingAction,
        };
    }

    /**
     * Enable auto-scaling
     */
    public enable(): void {
        this.autoScaler.enabled = true;
        this.startScalingEvaluation();
        logger.debug("other", "Auto-scaling enabled");
    }

    /**
     * Disable auto-scaling
     */
    public disable(): void {
        this.autoScaler.enabled = false;
        this.stopScaling();
        logger.debug("other", "Auto-scaling disabled");
    }

    /**
     * Check if auto-scaling is enabled
     */
    public isEnabled(): boolean {
        return this.autoScaler.enabled;
    }

    /**
     * Set worker manager reference for integration
     */
    public setWorkerManager(workerManager: any): void {
        this.workerManager = workerManager;
    }

    /**
     * Set metrics collector reference for integration
     */
    public setMetricsCollector(metricsCollector: any): void {
        this.metricsCollector = metricsCollector;
    }

    /**
     * Calculate average scaling time from recorded timings
     */
    private calculateAverageScalingTime(): number {
        if (this.scalingTimings.size === 0) return 0;

        const timings = Array.from(this.scalingTimings.values());
        const total = timings.reduce((sum, time) => sum + time, 0);
        return total / timings.length;
    }
}

