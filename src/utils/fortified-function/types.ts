/**
 * FortifyJS - Fortified Function Types
 * Type definitions for the fortified function system
 */

import { SecureBuffer } from "../../security";

export interface FortifiedFunctionOptions {
    // Security Options
    autoEncrypt?: boolean;
    secureParameters?: (string | number)[];
    memoryWipeDelay?: number;
    stackTraceProtection?: boolean;

    // Performance Options
    memoize?: boolean;
    timeout?: number;
    retries?: number;
    maxRetryDelay?: number;

    // Monitoring Options
    auditLog?: boolean;
    performanceTracking?: boolean;
    debugMode?: boolean;

    // Memory Management
    memoryPool?: boolean;
    maxMemoryUsage?: number;
    autoCleanup?: boolean;
}

export interface FunctionStats {
    executionCount: number;
    totalExecutionTime: number;
    averageExecutionTime: number;
    memoryUsage: number;
    cacheHits: number;
    cacheMisses: number;
    errorCount: number;
    lastExecuted: Date;
    securityEvents: number;
}

export interface AuditEntry {
    timestamp: Date;
    executionId: string;
    parametersHash: string;
    executionTime: number;
    memoryUsage: number;
    success: boolean;
    errorMessage?: string;
    securityFlags: string[];
}

export interface SecureExecutionContext {
    executionId: string;
    encryptedParameters: Map<string, string>;
    secureBuffers: Map<string, SecureBuffer>;
    startTime: number;
    memorySnapshot: number;
    auditEntry: AuditEntry;
}

export interface ExecutionEvent {
    executionId: string;
    timestamp: Date;
    type: "start" | "success" | "error" | "timeout" | "retry";
    data?: any;
}

export interface CacheEntry<R> {
    result: R;
    timestamp: number;
    accessCount: number;
    lastAccessed: Date;
}

export interface SecurityFlags {
    encrypted: boolean;
    audited: boolean;
    memoryManaged: boolean;
    stackProtected: boolean;
}

