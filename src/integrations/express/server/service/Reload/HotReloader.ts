/**
 * Hot Reloader for True Process Restart
 * Enables real hot reload by restarting the entire process
 */

import { spawn, ChildProcess } from "child_process";
import { EventEmitter } from "events";
import { existsSync } from "fs";
import { join } from "path";
import { HotReloaderConfig } from "./types/hotreloader";
import { DEFAULT_FW_CONFIG } from "../../const/FileWatcher.config";

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
            maxRestarts: DEFAULT_FW_CONFIG.maxRestarts,
            gracefulShutdownTimeout: 5000,
            verbose: false,
            typescript: {
                enabled: true,
                runner: "auto",
                runnerArgs: [],
                fallbackToNode: true,
                autoDetectRunner: true,
            },
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
            console.log("Hot reloader already running");
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
            console.log("Hot reloading process...");

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
     * Check if a TypeScript runner is available
     */
    private isRunnerAvailable(runner: string): boolean {
        try {
            const { execSync } = require("child_process");
            execSync(`${runner} --version`, { stdio: "ignore" });
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Auto-detect the best available TypeScript runner
     */
    private detectTypeScriptRunner(): string {
        const runners = ["tsx", "bun", "ts-node"];

        for (const runner of runners) {
            if (this.isRunnerAvailable(runner)) {
                if (this.config.verbose) {
                    console.log(
                        `🎯 Auto-detected TypeScript runner: ${runner}`
                    );
                }
                return runner;
            }
        }

        if (this.config.verbose) {
            console.log("⚠️ No TypeScript runner found, falling back to node");
        }
        return "node";
    }

    /**
     * Check if the script is a TypeScript file
     */
    private isTypeScriptFile(script: string): boolean {
        return script.endsWith(".ts") || script.endsWith(".tsx");
    }

    /**
     * Get the appropriate runtime and arguments for the script
     */
    private getRuntimeConfig(): { runtime: string; args: string[] } {
        const isTS = this.isTypeScriptFile(this.config.script);
        const tsConfig = this.config.typescript;

        // If TypeScript is disabled or not a TS file, use default behavior
        if (!tsConfig?.enabled || !isTS) {
            const runtime = process.execPath.includes("bun") ? "bun" : "node";
            return {
                runtime,
                args: [this.config.script, ...this.config.args],
            };
        }

        let runner = tsConfig.runner || "auto";

        // Auto-detect runner if needed
        if (runner === "auto" && tsConfig.autoDetectRunner) {
            runner = this.detectTypeScriptRunner();
        }

        // Handle specific runners
        switch (runner) {
            case "tsx":
                return {
                    runtime: "tsx",
                    args: [
                        ...(tsConfig.runnerArgs || []),
                        this.config.script,
                        ...this.config.args,
                    ],
                };

            case "ts-node":
                return {
                    runtime: "ts-node",
                    args: [
                        ...(tsConfig.runnerArgs || []),
                        this.config.script,
                        ...this.config.args,
                    ],
                };

            case "bun":
                return {
                    runtime: "bun",
                    args: [
                        "run",
                        ...(tsConfig.runnerArgs || []),
                        this.config.script,
                        ...this.config.args,
                    ],
                };

            case "node":
                return {
                    runtime: "node",
                    args: [this.config.script, ...this.config.args],
                };

            default:
                // Custom runner
                return {
                    runtime: runner,
                    args: [
                        ...(tsConfig.runnerArgs || []),
                        this.config.script,
                        ...this.config.args,
                    ],
                };
        }
    }

    /**
     * Start child process
     */
    private async startChildProcess(): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                const { runtime, args } = this.getRuntimeConfig();

                if (this.config.verbose) {
                    console.log(
                        `🚀 Starting process with: ${runtime} ${args.join(" ")}`
                    );
                }

                this.childProcess = spawn(runtime, args, {
                    cwd: this.config.cwd,
                    env: this.config.env,
                    stdio: "inherit",
                    detached: false,
                });

                this.childProcess.on("spawn", () => {
                    if (this.config.verbose) {
                        console.log(
                            `Child process started (PID: ${this.childProcess?.pid})`
                        );
                    }
                    resolve();
                });

                this.childProcess.on("error", (error) => {
                    // Handle TypeScript runner not found error
                    if (
                        error.message.includes("ENOENT") &&
                        this.isTypeScriptFile(this.config.script)
                    ) {
                        const tsConfig = this.config.typescript;
                        if (tsConfig?.fallbackToNode) {
                            console.warn(
                                `⚠️ TypeScript runner failed, falling back to node (this will likely fail for .ts files)`
                            );
                            console.warn(
                                `💡 Install a TypeScript runner: npm install -g tsx`
                            );

                            // Retry with node
                            this.childProcess = spawn(
                                "node",
                                [this.config.script, ...this.config.args],
                                {
                                    cwd: this.config.cwd,
                                    env: this.config.env,
                                    stdio: "inherit",
                                    detached: false,
                                }
                            );
                            return;
                        }
                    }

                    console.error("Child process error:", error.message);

                    // Provide helpful error messages for common issues
                    if (error.message.includes("ENOENT")) {
                        const { runtime } = this.getRuntimeConfig();
                        console.error(
                            `❌ Runtime '${runtime}' not found. Please install it:`
                        );

                        switch (runtime) {
                            case "tsx":
                                console.error(`   npm install -g tsx`);
                                break;
                            case "ts-node":
                                console.error(`   npm install -g ts-node`);
                                break;
                            case "bun":
                                console.error(
                                    `   Visit: https://bun.sh/docs/installation`
                                );
                                break;
                            default:
                                console.error(
                                    `   Make sure '${runtime}' is installed and available in PATH`
                                );
                        }
                    }

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

