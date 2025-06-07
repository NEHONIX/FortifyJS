
export type LogLevel =
    | "silent"
    | "error"
    | "warn"
    | "info"
    | "debug"
    | "verbose";
export type LogComponent =
    | "middleware"
    | "server"
    | "cache"
    | "cluster"
    | "performance"
    | "fileWatcher"
    | "plugins"
    | "security"
    | "monitoring"
    | "routes"
    | "userApp"
    | "typescript"
    | "console"
    | "other"
    | "router";

export type LogType =
    | "startup"
    | "warnings"
    | "errors"
    | "performance"
    | "debug"
    | "hotReload"
    | "portSwitching";
