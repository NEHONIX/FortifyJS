# Component System

## Overview

FastServer uses a modular component architecture that separates concerns and enables maintainable, testable code. Each component is responsible for a specific aspect of server functionality and can be configured independently.

## Component Architecture

```
UltraFastServer
├── CacheManager          # Multi-tier caching system
├── ClusterManager        # Process clustering and scaling
├── PerformanceManager    # Performance optimization
├── PluginManager         # Plugin system management
├── MiddlewareManager     # Middleware orchestration
├── RouteManager          # Route handling and optimization
├── MonitoringManager     # Health monitoring and metrics
└── FileWatcherManager    # Hot reload and file watching
```

## Core Components

### CacheManager

Manages multi-tier caching with support for memory, Redis, and hybrid strategies.

**Location**: `src/integrations/express/server/components/fastapi/CacheManager.ts`

**Responsibilities**:
- Cache strategy selection and configuration
- UFSIMC (Ultra-Fast Secure In-Memory Cache) management
- Redis adapter and connection pooling
- Cache warming and preloading
- Cache invalidation and cleanup

**Key Methods**:
```typescript
class CacheManager {
    async initializeCache(): Promise<void>
    getCache(): SecureCacheAdapter
    getCacheStats(): Promise<CacheStats>
    warmUpCache(data: CacheWarmupData[]): Promise<void>
    invalidateCache(pattern: string): Promise<void>
    cleanup(): Promise<void>
}
```

**Configuration**:
```typescript
cache: {
    enabled: true,
    strategy: "hybrid",
    memory: {
        maxSize: 100,
        algorithm: "lru"
    },
    redis: {
        host: "localhost",
        port: 6379,
        pool: { min: 5, max: 20 }
    }
}
```

### ClusterManager

Handles multi-process clustering with intelligent worker management.

**Location**: `src/integrations/express/server/components/fastapi/ClusterManager.ts`

**Responsibilities**:
- Worker process spawning and management
- Health monitoring and auto-restart
- Load balancing and request distribution
- Inter-process communication (IPC)
- Auto-scaling based on metrics

**Key Methods**:
```typescript
class ClusterManager {
    async startCluster(): Promise<void>
    async scaleUp(count?: number): Promise<void>
    async scaleDown(count?: number): Promise<void>
    async getClusterMetrics(): Promise<ClusterMetrics>
    async broadcastToWorkers(message: any): Promise<void>
    setupClusterEventHandlers(): void
}
```

**Configuration**:
```typescript
cluster: {
    enabled: true,
    config: {
        workers: 'auto',
        autoRestart: true,
        healthCheck: {
            enabled: true,
            interval: 30000
        },
        scaling: {
            enabled: true,
            minWorkers: 2,
            maxWorkers: 16
        }
    }
}
```

### PerformanceManager

Optimizes request processing through various performance enhancement techniques.

**Location**: `src/integrations/express/server/components/fastapi/PerformanceManager.ts`

**Responsibilities**:
- Request pre-compilation and optimization
- Execution prediction and classification
- Performance profiling and monitoring
- Cache warming strategies
- Parallel processing coordination

**Key Methods**:
```typescript
class PerformanceManager {
    initializeOptimization(): Promise<void>
    getRequestPreCompiler(): RequestPreCompiler
    getExecutionPredictor(): ExecutionPredictor
    getPerformanceStats(): Promise<PerformanceStats>
    optimizeRoute(path: string, method: string): Promise<void>
}
```

**Configuration**:
```typescript
performance: {
    optimizationEnabled: true,
    preCompilerEnabled: true,
    learningPeriod: 60000,
    aggressiveOptimization: true,
    parallelProcessing: true
}
```

### PluginManager

Provides extensible plugin architecture for custom functionality.

**Location**: `src/integrations/express/server/components/fastapi/PluginManager.ts`

**Responsibilities**:
- Plugin discovery and registration
- Plugin lifecycle management
- Dependency resolution
- Event-driven plugin communication
- Built-in plugin initialization

**Key Methods**:
```typescript
class PluginManager {
    async registerPlugin(plugin: Plugin): Promise<void>
    async unregisterPlugin(pluginId: string): Promise<void>
    getPlugin(pluginId: string): Plugin | undefined
    getAllPlugins(): Plugin[]
    async initializeBuiltinPlugins(): Promise<void>
}
```

**Built-in Plugins**:
- JWT Authentication Plugin
- Response Time Tracking Plugin
- Smart Caching Plugin
- Security Headers Plugin

### MiddlewareManager

Orchestrates middleware registration and execution order.

**Location**: `src/integrations/express/server/components/fastapi/MiddlewareManager.ts`

**Responsibilities**:
- Middleware registration and ordering
- Security middleware configuration
- Performance middleware setup
- Error handling middleware
- Custom middleware integration

**Key Methods**:
```typescript
class MiddlewareManager {
    setupSecurityMiddleware(): void
    setupPerformanceMiddleware(): void
    setupErrorHandling(): void
    addCustomMiddleware(middleware: Middleware): void
}
```

### RouteManager

Handles route registration, optimization, and caching integration.

**Location**: `src/integrations/express/server/components/fastapi/RouteManager.ts`

**Responsibilities**:
- HTTP method registration with caching
- Route optimization and pre-compilation
- Cache integration for routes
- Route template management
- Performance monitoring per route

**Key Methods**:
```typescript
class RouteManager {
    addMethods(): void
    registerRouteTemplate(template: OptimizedRoute): void
    unregisterRouteTemplate(route: string, method?: string): void
    getRouteStats(): Promise<RouteStats>
}
```

### MonitoringManager

Provides health monitoring, metrics collection, and alerting.

**Location**: `src/integrations/express/server/components/fastapi/MonitoringManager.ts`

**Responsibilities**:
- Health check endpoint management
- Metrics collection and aggregation
- Performance monitoring
- Alert threshold management
- External monitoring integration

**Key Methods**:
```typescript
class MonitoringManager {
    addMonitoringEndpoints(): void
    startHealthMonitoring(): void
    getHealthStatus(): Promise<HealthStatus>
    getMetrics(): Promise<Metrics>
    setAlertThresholds(thresholds: AlertThresholds): void
}
```

### FileWatcherManager

Manages file watching and hot reload functionality.

**Location**: `src/integrations/express/server/components/fastapi/FileWatcherManager.ts`

**Responsibilities**:
- File system monitoring
- Hot reload coordination
- Development server management
- Change detection and filtering
- Graceful restart handling

**Key Methods**:
```typescript
class FileWatcherManager {
    initializeFileWatcher(): Promise<void>
    getHotReloader(): HotReloader | null
    isInMainProcess(): boolean
    startWatching(): Promise<void>
    stopWatching(): Promise<void>
}
```

## Component Lifecycle

### Initialization Order

1. **Logger Initialization**: Set up logging system first
2. **Component Creation**: Create all component instances
3. **Dependency Injection**: Inject dependencies between components
4. **Component Initialization**: Initialize components in dependency order
5. **Service Registration**: Register services and endpoints
6. **Server Startup**: Start the actual server

### Dependency Graph

```
Logger
├── CacheManager
├── PerformanceManager
│   └── CacheManager (dependency)
├── ClusterManager
├── PluginManager
│   └── CacheManager (dependency)
├── MiddlewareManager
├── RouteManager
│   ├── CacheManager (dependency)
│   └── PerformanceManager (dependency)
├── MonitoringManager
│   ├── CacheManager (dependency)
│   ├── ClusterManager (dependency)
│   └── PerformanceManager (dependency)
└── FileWatcherManager
```

### Component Communication

Components communicate through:

1. **Direct Method Calls**: For synchronous operations
2. **Event Emitters**: For asynchronous notifications
3. **Shared State**: Through the main server instance
4. **IPC Messages**: For cluster communication

```typescript
// Example: Component communication
class PerformanceManager {
    constructor(
        private cacheManager: CacheManager,
        private logger: Logger
    ) {}
    
    async optimizeRoute(path: string) {
        // Use cache manager
        await this.cacheManager.warmUpCache([...]);
        
        // Emit event for other components
        this.emit('route:optimized', { path });
        
        // Log the operation
        this.logger.info('performance', `Route optimized: ${path}`);
    }
}
```

## Component Configuration

### Individual Component Configuration

Each component can be configured independently:

```typescript
const app = createServer({
    // Cache component configuration
    cache: {
        enabled: true,
        strategy: "hybrid",
        memory: { maxSize: 100 },
        redis: { host: "localhost" }
    },
    
    // Cluster component configuration
    cluster: {
        enabled: true,
        config: {
            workers: 4,
            autoRestart: true
        }
    },
    
    // Performance component configuration
    performance: {
        optimizationEnabled: true,
        preCompilerEnabled: true
    }
});
```

### Component Dependencies

Components declare their dependencies explicitly:

```typescript
class RouteManager {
    constructor(
        private app: UltraFastApp,
        private cacheManager: CacheManager,
        private performanceManager: PerformanceManager,
        private logger: Logger
    ) {
        // Component initialization
    }
}
```

### Component Factory

The main server acts as a component factory:

```typescript
class UltraFastServer {
    private initializeComponents(): void {
        // Create components with dependencies
        this.cacheManager = new CacheManager(this.options.cache, this.logger);
        this.performanceManager = new PerformanceManager(
            this.options.performance,
            this.cacheManager,
            this.logger
        );
        this.routeManager = new RouteManager(
            this.app,
            this.cacheManager,
            this.performanceManager,
            this.logger
        );
        // ... other components
    }
}
```

## Component Extension

### Creating Custom Components

```typescript
interface CustomComponent {
    initialize(): Promise<void>;
    cleanup(): Promise<void>;
    getStats(): Promise<any>;
}

class CustomAnalyticsComponent implements CustomComponent {
    constructor(
        private options: AnalyticsOptions,
        private logger: Logger
    ) {}
    
    async initialize(): Promise<void> {
        this.logger.startup('analytics', 'Initializing analytics component');
        // Component initialization logic
    }
    
    async cleanup(): Promise<void> {
        // Cleanup logic
    }
    
    async getStats(): Promise<AnalyticsStats> {
        // Return component statistics
        return {
            eventsProcessed: this.eventsProcessed,
            averageProcessingTime: this.averageProcessingTime
        };
    }
}
```

### Component Registration

```typescript
// Extend the server with custom components
class ExtendedFastServer extends UltraFastServer {
    private analyticsComponent: CustomAnalyticsComponent;
    
    protected initializeComponents(): void {
        super.initializeComponents();
        
        // Add custom component
        this.analyticsComponent = new CustomAnalyticsComponent(
            this.options.analytics,
            this.logger
        );
    }
    
    protected async initializeAllComponents(): Promise<void> {
        await super.initializeAllComponents();
        
        // Initialize custom component
        await this.analyticsComponent.initialize();
    }
}
```

## Component Testing

### Unit Testing Components

```typescript
describe('CacheManager', () => {
    let cacheManager: CacheManager;
    let mockLogger: jest.Mocked<Logger>;
    
    beforeEach(() => {
        mockLogger = createMockLogger();
        cacheManager = new CacheManager({
            enabled: true,
            strategy: 'memory'
        }, mockLogger);
    });
    
    test('should initialize cache successfully', async () => {
        await cacheManager.initializeCache();
        
        expect(cacheManager.getCache()).toBeDefined();
        expect(mockLogger.startup).toHaveBeenCalledWith(
            'cache',
            expect.stringContaining('initialized')
        );
    });
});
```

### Integration Testing

```typescript
describe('Component Integration', () => {
    let server: UltraFastServer;
    
    beforeEach(() => {
        server = new UltraFastServer({
            cache: { enabled: true },
            performance: { optimizationEnabled: true }
        });
    });
    
    test('should integrate cache and performance components', async () => {
        const cache = server.getCacheManager();
        const performance = server.getPerformanceManager();
        
        // Test component interaction
        await performance.optimizeRoute('/test');
        const stats = await cache.getCacheStats();
        
        expect(stats.warmedRoutes).toContain('/test');
    });
});
```
