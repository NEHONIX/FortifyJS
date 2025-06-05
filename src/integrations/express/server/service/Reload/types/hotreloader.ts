export interface HotReloaderConfig {
    enabled: boolean;
    script: string;
    args: string[];
    env: Record<string, string | undefined>;
    cwd: string;
    restartDelay: number;
    maxRestarts: number;
    gracefulShutdownTimeout: number;
    verbose: boolean;
}
