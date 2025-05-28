/**
 * 🚀 FortifyJS React Components - Type Definitions
 * Modular type definitions for React components
 */

import { ReactNode } from "react";

/**
 * Security configuration for the application
 */
export interface SecurityConfig {
    /** Default encryption level */
    encryptionLevel?: "basic" | "enhanced" | "military";
    
    /** Default sensitive key patterns */
    defaultSensitiveKeys?: string[];
    
    /** Enable automatic security monitoring */
    enableMonitoring?: boolean;
    
    /** Performance optimization settings */
    performance?: {
        enableCaching?: boolean;
        cacheSize?: number;
        enableLazyLoading?: boolean;
    };
    
    /** Memory management settings */
    memory?: {
        autoCleanup?: boolean;
        cleanupInterval?: number;
        maxMemoryUsage?: number;
    };
    
    /** Development settings */
    development?: {
        enableDebugMode?: boolean;
        logLevel?: "none" | "error" | "warn" | "info" | "debug";
        enablePerformanceMetrics?: boolean;
    };
}

/**
 * Props for SecureProvider component
 */
export interface SecureProviderProps {
    /** Security configuration */
    config: SecurityConfig;
    
    /** Child components */
    children: ReactNode;
    
    /** Optional fallback component for loading */
    fallback?: ReactNode;
    
    /** Optional error boundary */
    onError?: (error: Error, errorInfo: any) => void;
}

/**
 * Props for SecureForm component
 */
export interface SecureFormProps<T = any> {
    /** Initial form values */
    initialValues: T;
    
    /** Form validation schema */
    validationSchema?: Record<keyof T, (value: any) => boolean | string>;
    
    /** Submit handler */
    onSubmit: (values: T) => void | Promise<void>;
    
    /** Change handler */
    onChange?: (values: T) => void;
    
    /** Enable real-time validation */
    enableRealTimeValidation?: boolean;
    
    /** Automatically detect sensitive fields */
    autoDetectSensitive?: boolean;
    
    /** Custom sensitive field patterns */
    sensitivePatterns?: RegExp[];
    
    /** Form className */
    className?: string;
    
    /** Child render function */
    children: (formProps: {
        values: any;
        errors: Record<string, string>;
        touched: Record<string, boolean>;
        isValid: boolean;
        isSubmitting: boolean;
        handleChange: (field: string, value: any) => void;
        handleSubmit: () => void;
        reset: () => void;
    }) => ReactNode;
}

/**
 * Props for SecureInput component
 */
export interface SecureInputProps {
    /** Input name/field */
    name: string;
    
    /** Input type */
    type?: "text" | "password" | "email" | "number" | "tel" | "url";
    
    /** Input value */
    value: any;
    
    /** Change handler */
    onChange: (value: any) => void;
    
    /** Blur handler */
    onBlur?: () => void;
    
    /** Focus handler */
    onFocus?: () => void;
    
    /** Input placeholder */
    placeholder?: string;
    
    /** Whether field is required */
    required?: boolean;
    
    /** Whether field is disabled */
    disabled?: boolean;
    
    /** Whether field is sensitive (auto-encrypted) */
    sensitive?: boolean;
    
    /** Custom validation function */
    validator?: (value: any) => boolean | string;
    
    /** Enable real-time validation */
    enableRealTimeValidation?: boolean;
    
    /** Input className */
    className?: string;
    
    /** Error message */
    error?: string;
    
    /** Whether field has been touched */
    touched?: boolean;
    
    /** Auto-complete attribute */
    autoComplete?: string;
    
    /** Maximum length */
    maxLength?: number;
    
    /** Minimum length */
    minLength?: number;
    
    /** Input pattern (regex) */
    pattern?: string;
}

/**
 * Props for SecureDisplay component
 */
export interface SecureDisplayProps {
    /** Data to display */
    data: any;
    
    /** Whether to mask sensitive data */
    maskSensitive?: boolean;
    
    /** Custom masking character */
    maskChar?: string;
    
    /** Fields to always show (even if sensitive) */
    alwaysShow?: string[];
    
    /** Fields to always hide */
    alwaysHide?: string[];
    
    /** Custom render function for values */
    renderValue?: (key: string, value: any, isSensitive: boolean) => ReactNode;
    
    /** Component className */
    className?: string;
    
    /** Enable copy to clipboard */
    enableCopy?: boolean;
    
    /** Enable export functionality */
    enableExport?: boolean;
}

/**
 * Props for SecureTable component
 */
export interface SecureTableProps<T = any> {
    /** Table data */
    data: T[];
    
    /** Column definitions */
    columns: Array<{
        key: keyof T;
        title: string;
        sensitive?: boolean;
        render?: (value: any, record: T) => ReactNode;
        sortable?: boolean;
        filterable?: boolean;
    }>;
    
    /** Enable row selection */
    enableSelection?: boolean;
    
    /** Selection change handler */
    onSelectionChange?: (selectedRows: T[]) => void;
    
    /** Enable pagination */
    enablePagination?: boolean;
    
    /** Page size */
    pageSize?: number;
    
    /** Enable sorting */
    enableSorting?: boolean;
    
    /** Enable filtering */
    enableFiltering?: boolean;
    
    /** Table className */
    className?: string;
    
    /** Loading state */
    loading?: boolean;
    
    /** Empty state message */
    emptyMessage?: string;
}

/**
 * Context value type for SecurityContext
 */
export interface SecurityContextValue {
    /** Current security configuration */
    config: SecurityConfig;
    
    /** Update security configuration */
    updateConfig: (config: Partial<SecurityConfig>) => void;
    
    /** Get security metrics */
    getMetrics: () => {
        totalOperations: number;
        encryptedOperations: number;
        averageOperationTime: number;
        memoryUsage: number;
    };
    
    /** Enable/disable debug mode */
    setDebugMode: (enabled: boolean) => void;
    
    /** Current debug mode state */
    debugMode: boolean;
    
    /** Register a secure component */
    registerComponent: (componentId: string, metadata: any) => void;
    
    /** Unregister a secure component */
    unregisterComponent: (componentId: string) => void;
    
    /** Get registered components */
    getRegisteredComponents: () => Record<string, any>;
}

/**
 * Error boundary state
 */
export interface ErrorBoundaryState {
    hasError: boolean;
    error?: Error;
    errorInfo?: any;
}

/**
 * Performance monitoring data
 */
export interface PerformanceMetrics {
    componentRenders: number;
    averageRenderTime: number;
    memoryUsage: number;
    operationCounts: Record<string, number>;
    lastUpdate: Date;
}
