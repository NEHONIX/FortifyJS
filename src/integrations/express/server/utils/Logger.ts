/**
 * Centralized Logger for FastApi.ts Server
 * Provides granular control over logging output
 */
import { LogLevel, LogComponent, LogType } from "../../types/logger.type";
import { ServerOptions } from "../../types/types";

export class Logger {
    private config: ServerOptions["logging"];
    private static instance: Logger;

    constructor(config?: ServerOptions["logging"]) {
        this.config = {
            enabled: true,
            level: "info",
            components: {
                server: true,
                cache: true,
                cluster: true,
                performance: true,
                fileWatcher: true,
                plugins: true,
                security: true,
                monitoring: true,
                routes: true,
                userApp: true,
                console: false, // Console interception system logs (can be verbose)
            },
            types: {
                startup: true,
                warnings: true,
                errors: true,
                performance: true,
                debug: false,
                hotReload: true,
                portSwitching: true,
            },
            format: {
                timestamps: false,
                colors: true,
                prefix: true,
                compact: false,
            },
            ...config,
        };
    }

    /**
     * Get or create singleton instance
     */
    public static getInstance(config?: ServerOptions["logging"]): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger(config);
        } else if (config) {
            Logger.instance.updateConfig(config);
        }
        return Logger.instance;
    }

    /**
     * Update logger configuration
     */
    public updateConfig(config: ServerOptions["logging"]): void {
        this.config = { ...this.config, ...config };
    }

    /**
     * Check if logging is enabled for a specific component and type
     */
    private shouldLog(
        level: LogLevel,
        component: LogComponent,
        type?: LogType
    ): boolean {
        // Master switch
        if (!this.config?.enabled) return false;

        // Silent mode
        // if (this.config?.level === "silent") return false;

        // Always show errors unless silent
        if (
            level === "error" &&
            this.config?.level &&
            this.config?.level !== "silent"
        )
            return true;

        // Check log level hierarchy
        const levels: LogLevel[] = [
            "error",
            "warn",
            "info",
            "debug",
            "verbose",
        ];
        const currentLevelIndex = levels.indexOf(this.config?.level!);
        const messageLevelIndex = levels.indexOf(level);

        if (messageLevelIndex > currentLevelIndex) return false;

        // Check component-specific settings
        if (
            this.config?.components &&
            this.config?.components[component] === false
        )
            return false;

        // Check type-specific settings
        if (type && this.config?.types && this.config?.types[type] === false)
            return false;

        return true;
    }

    /**
     * Format log message
     */
    private formatMessage(
        level: LogLevel,
        component: LogComponent,
        message: string
    ): string {
        let formatted = message;

        if (this.config?.format?.prefix && !this.config?.format?.compact) {
            const prefix = `[${component.toUpperCase()}]`;
            formatted = `${prefix} ${message}`;
        }

        if (this.config?.format?.timestamps) {
            const timestamp = new Date().toISOString();
            formatted = `${timestamp} ${formatted}`;
        }

        if (
            this.config?.format?.colors &&
            level !== "silent" &&
            typeof process !== "undefined" &&
            process.stdout?.isTTY
        ) {
            const colors = {
                error: "\x1b[31m", // Red
                warn: "\x1b[33m", // Yellow
                info: "\x1b[36m", // Cyan
                debug: "\x1b[35m", // Magenta
                verbose: "\x1b[37m", // White
                reset: "\x1b[0m", // Reset
            };

            const color = colors[level] || colors.info;
            formatted = `${color}${formatted}${colors.reset}`;
        }

        return formatted;
    }

    /**
     * Log a message
     */
    private log(
        level: LogLevel,
        component: LogComponent,
        type: LogType | undefined,
        message: string,
        ...args: any[]
    ): void {
        if (!this.shouldLog(level, component, type)) return;

        if (this.config?.customLogger) {
            this.config?.customLogger(level, component, message, ...args);
            return;
        }

        const formatted = this.formatMessage(level, component, message);

        switch (level) {
            case "error":
                console.error(formatted, ...args);
                break;
            case "warn":
                console.warn(formatted, ...args);
                break;
            default:
                console.log(formatted, ...args);
                break;
        }
    }

    // Public logging methods
    public error(
        component: LogComponent,
        message: string,
        ...args: any[]
    ): void {
        this.log("error", component, "errors", message, ...args);
    }

    public warn(
        component: LogComponent,
        message: string,
        ...args: any[]
    ): void {
        this.log("warn", component, "warnings", message, ...args);
    }

    public info(
        component: LogComponent,
        message: string,
        ...args: any[]
    ): void {
        this.log("info", component, undefined, message, ...args);
    }

    public debug(
        component: LogComponent,
        message: string,
        ...args: any[]
    ): void {
        this.log("debug", component, "debug", message, ...args);
    }

    public startup(
        component: LogComponent,
        message: string,
        ...args: any[]
    ): void {
        this.log("info", component, "startup", message, ...args);
    }

    public performance(
        component: LogComponent,
        message: string,
        ...args: any[]
    ): void {
        this.log("info", component, "performance", message, ...args);
    }

    public hotReload(
        component: LogComponent,
        message: string,
        ...args: any[]
    ): void {
        this.log("info", component, "hotReload", message, ...args);
    }

    public portSwitching(
        component: LogComponent,
        message: string,
        ...args: any[]
    ): void {
        this.log("info", component, "portSwitching", message, ...args);
    }

    public securityWarning(message: string, ...args: any[]): void {
        this.log("warn", "security", "warnings", message, ...args);
    }

    // Utility methods
    public isEnabled(): boolean {
        return this.config?.enabled || false;
    }

    public getLevel(): LogLevel {
        return this.config?.level || "info";
    }

    public isComponentEnabled(component: LogComponent): boolean {
        return this.config?.components?.[component] !== false;
    }

    public isTypeEnabled(type: LogType): boolean {
        return this.config?.types?.[type] !== false;
    }
}

/**
 * Global logger instance
 */
export const logger = Logger.getInstance();

/**
 * Initialize logger with configuration
 */
export function initializeLogger(config?: ServerOptions["logging"]): Logger {
    return Logger.getInstance(config);
}

