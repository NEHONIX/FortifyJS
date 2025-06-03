/**
 * FortifyJS Cluster Manager
 * Intelligent cluster management for Express applications
 */

import * as cluster from "cluster";
import * as os from "os";
import { ServerConfig } from "./types";

export class ClusterManager {
    private config: ServerConfig;
    private workers: any[] = [];
    private isShuttingDown = false;

    constructor(config: ServerConfig) {
        this.config = config;
    }

    async start(serverFactory: () => Promise<void>): Promise<void> {
        if ((cluster as any).isPrimary || (cluster as any).isMaster) {
            console.log(
                ` Starting cluster with ${this.config.workers} workers...`
            );

            // Fork workers
            for (
                let i = 0;
                i < (this.config.workers || os.cpus().length);
                i++
            ) {
                this.forkWorker();
            }

            // Handle worker exit
            (cluster as any).on(
                "exit",
                (worker: any, code: number, signal: string) => {
                    if (!this.isShuttingDown) {
                        console.log(
                            ` Worker ${worker.process.pid} died (${
                                signal || code
                            }), restarting...`
                        );
                        this.forkWorker();
                    }
                }
            );

            // Handle graceful shutdown
            process.on("SIGTERM", () => this.gracefulShutdown());
            process.on("SIGINT", () => this.gracefulShutdown());
        } else {
            // Worker process
            await serverFactory();
        }
    }

    private forkWorker(): void {
        const worker = (cluster as any).fork();
        this.workers.push(worker);

        worker.on("online", () => {
            console.log(` Worker ${worker.process.pid} started`);
        });

        worker.on("error", (error: Error) => {
            console.error(` Worker ${worker.process.pid} error:`, error);
        });
    }

    private async gracefulShutdown(): Promise<void> {
        if (this.isShuttingDown) return;

        this.isShuttingDown = true;
        console.log(" Gracefully shutting down cluster...");

        // Send shutdown signal to all workers
        for (const worker of this.workers) {
            if (!worker.isDead()) {
                worker.send("shutdown");
            }
        }

        // Wait for workers to exit gracefully
        const shutdownPromises = this.workers.map(
            (worker) =>
                new Promise<void>((resolve) => {
                    if (worker.isDead()) {
                        resolve();
                        return;
                    }

                    const timeout = setTimeout(() => {
                        console.log(
                            `Force killing worker ${worker.process.pid}`
                        );
                        worker.kill("SIGKILL");
                        resolve();
                    }, 10000); // 10 second timeout

                    worker.on("exit", () => {
                        clearTimeout(timeout);
                        resolve();
                    });
                })
        );

        await Promise.all(shutdownPromises);
        console.log(" All workers shut down");
        process.exit(0);
    }

    async stop(): Promise<void> {
        await this.gracefulShutdown();
    }

    getWorkerCount(): number {
        return this.workers.filter((worker) => !worker.isDead()).length;
    }

    getWorkerStats(): any {
        return {
            total: this.workers.length,
            alive: this.workers.filter((worker) => !worker.isDead()).length,
            dead: this.workers.filter((worker) => worker.isDead()).length,
            pids: this.workers.map((worker) => worker.process.pid),
        };
    }
}

 