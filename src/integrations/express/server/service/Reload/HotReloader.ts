/**
 * Hot Reloader for True Process Restart
 * Enables real hot reload by restarting the entire process
 */

import { spawn, ChildProcess } from "child_process";
import { EventEmitter } from "events";
import { HotReloaderConfig } from "./types/hotreloader";

export class HotReloader extends EventEmitter {
    private config: HotReloaderConfig;
    private childProcess?: ChildProcess;
    private isRunning = false;
    private restartCount = 0;
    private lastRestart = 0;

    constructor(config: Partial<HotReloaderConfig> = {}) {
        super();

        this.config = {
            enabled: true,
            script: process.argv[1] || "index.js",
            args: process.argv.slice(2),
            env: { ...process.env },
            cwd: process.cwd(),
            restartDelay: 500,
            maxRestarts: 10,
            gracefulShutdownTimeout: 5000,
            verbose: false,
            ...config,
        };
    }

    /**
     * Start the hot reloader
     */
    public async start(): Promise<void> {
        if (!this.config.enabled) {
            console.log("Hot reloader disabled");
            return;
        }

        if (this.isRunning) {
            // console.log("Hot reloader already running");
            return;
        }

        try {
            console.log("Starting hot reloader...");
            await this.startChildProcess();
            this.isRunning = true;
            console.log("Hot reloader started");
        } catch (error: any) {
            // console.error("Failed to start hot reloader:", error.message);
            throw error;
        }
    }

    /**
     * Stop the hot reloader
     */
    public async stop(): Promise<void> {
        if (!this.isRunning) return;

        try {
            // console.log("Stopping hot reloader...");

            if (this.childProcess) {
                await this.stopChildProcess();
            }

            this.isRunning = false;
            // console.log("Hot reloader stopped");
        } catch (error: any) {
            console.error("Error stopping hot reloader:", error.message);
        }
    }

    /**
     * Restart the child process (hot reload)
     */
    public async restart(): Promise<void> {
        if (!this.isRunning) {
            console.log("Hot reloader not running, starting...");
            await this.start();
            return;
        }

        // Check restart limits
        const now = Date.now();
        if (now - this.lastRestart < this.config.restartDelay) {
            console.log("Restart too soon, waiting...");
            return;
        }

        if (this.restartCount >= this.config.maxRestarts) {
            console.warn(
                `Maximum restarts (${this.config.maxRestarts}) reached`
            );
            return;
        }

        try {
            // console.log("Hot reloading process...");

            const startTime = Date.now();

            // Stop current process
            if (this.childProcess) {
                await this.stopChildProcess();
            }

            // Wait for restart delay
            await new Promise((resolve) =>
                setTimeout(resolve, this.config.restartDelay)
            );

            // Start new process
            await this.startChildProcess();

            const duration = Date.now() - startTime;
            this.restartCount++;
            this.lastRestart = now;

            this.emit("restart:completed", {
                duration,
                restartCount: this.restartCount,
            });

            console.log(`Process hot reloaded (${duration}ms)`);
        } catch (error: any) {
            this.emit("restart:failed", { error: error.message });
            console.error("Hot reload failed:", error.message);
        }
    }

    /**
     * Start child process
     */
    private async startChildProcess(): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                const runtime = process.execPath.includes("bun")
                    ? "bun"
                    : "node";

                this.childProcess = spawn(
                    runtime,
                    [this.config.script, ...this.config.args],
                    {
                        cwd: this.config.cwd,
                        env: this.config.env,
                        stdio: "inherit",
                        detached: false,
                    }
                );

                this.childProcess.on("spawn", () => {
                    if (this.config.verbose) {
                        console.log(
                            `Child process started (PID: ${this.childProcess?.pid})`
                        );
                    }
                    resolve();
                });

                this.childProcess.on("error", (error) => {
                    console.error("Child process error:", error.message);
                    reject(error);
                });

                this.childProcess.on("exit", (code, signal) => {
                    if (this.config.verbose) {
                        console.log(
                            `Child process exited (code: ${code}, signal: ${signal})`
                        );
                    }

                    this.emit("process:exit", { code, signal });

                    // Auto-restart on unexpected exit
                    if (this.isRunning && code !== 0 && !signal) {
                        console.log("Unexpected exit, restarting...");
                        setTimeout(
                            () => this.restart(),
                            this.config.restartDelay
                        );
                    }
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Stop child process gracefully
     */
    private async stopChildProcess(): Promise<void> {
        if (!this.childProcess) return;

        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                if (this.childProcess) {
                    // console.log('Force killing child process...');
                    this.childProcess.kill("SIGKILL");
                }
                resolve();
            }, this.config.gracefulShutdownTimeout);

            this.childProcess!.on("exit", () => {
                clearTimeout(timeout);
                resolve();
            });

            // Try graceful shutdown first
            if (this.config.verbose) {
                console.log("Sending SIGTERM to child process...");
            }
            this.childProcess!.kill("SIGTERM");
        });
    }

    /**
     * Get hot reloader status
     */
    public getStatus(): {
        isRunning: boolean;
        restartCount: number;
        lastRestart: number;
        childPid?: number;
        config: HotReloaderConfig;
    } {
        return {
            isRunning: this.isRunning,
            restartCount: this.restartCount,
            lastRestart: this.lastRestart,
            childPid: this.childProcess?.pid,
            config: this.config,
        };
    }

    /**
     * Reset restart counter
     */
    public resetRestartCount(): void {
        this.restartCount = 0;
        this.lastRestart = 0;
        // console.log('Restart counter reset');
    }

    /**
     * Update configuration
     */
    public updateConfig(newConfig: Partial<HotReloaderConfig>): void {
        this.config = { ...this.config, ...newConfig };
        this.emit("config:updated", this.config);
    }

    /**
     * Check if process is healthy
     */
    public isHealthy(): boolean {
        return (
            this.isRunning &&
            this.childProcess !== undefined &&
            !this.childProcess.killed &&
            this.restartCount < this.config.maxRestarts
        );
    }
}

export default HotReloader;

