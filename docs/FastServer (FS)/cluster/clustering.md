# Clustering

## Overview

FastServer provides intelligent clustering capabilities that automatically scale your application across multiple CPU cores. The clustering system includes health monitoring, automatic restarts, load balancing, and inter-process communication.

## Basic Clustering

### Enable Clustering

```typescript
import { createServer } from "fortify2-js";

const app = createServer({
    cluster: {
        enabled: true,
    },
});
```

### Automatic Worker Count

```typescript
const app = createServer({
    cluster: {
        enabled: true,
        config: {
            workers: "auto", // Uses all available CPU cores
        },
    },
});
```

### Manual Worker Count

```typescript
const app = createServer({
    cluster: {
        enabled: true,
        config: {
            workers: 4, // Specific number of workers
        },
    },
});
```

## Advanced Configuration

### Complete Cluster Configuration

```typescript
const app = createServer({
    cluster: {
        enabled: true,
        config: {
            workers: "auto",
            autoRestart: true,
            maxRestarts: 5,
            restartDelay: 1000,
            gracefulShutdown: true,
            shutdownTimeout: 30000,

            // Health monitoring
            healthCheck: {
                enabled: true,
                interval: 30000, // Check every 30 seconds
                timeout: 5000, // 5 second timeout
                retries: 3, // 3 failed checks before restart
                endpoint: "/health", // Health check endpoint
                expectedStatus: 200,
            },

            // Load balancing
            loadBalancing: {
                strategy: "round-robin", // round-robin, least-connections, ip-hash
                stickySession: false,
                sessionAffinity: "none", // none, ip, cookie
            },

            // Resource limits
            limits: {
                memory: 512, // 512MB per worker
                cpu: 80, // 80% CPU threshold
                requests: 1000, // Max requests per worker
                connections: 100, // Max concurrent connections
            },

            // Scaling configuration
            scaling: {
                enabled: true,
                minWorkers: 2,
                maxWorkers: 8,
                scaleUpThreshold: 80, // Scale up at 80% CPU
                scaleDownThreshold: 30, // Scale down at 30% CPU
                scaleUpCooldown: 60000, // 1 minute cooldown
                scaleDownCooldown: 300000, // 5 minute cooldown
            },
        },
    },
});
```

## Health Monitoring

### Built-in Health Checks

```typescript
cluster: {
    enabled: true,
    config: {
        healthCheck: {
            enabled: true,
            interval: 15000,        // Check every 15 seconds
            timeout: 3000,          // 3 second timeout
            retries: 2,             // 2 failed checks before restart

            // Custom health check function
            customCheck: async (worker) => {
                // Custom health logic
                const memUsage = process.memoryUsage();
                const cpuUsage = process.cpuUsage();

                return {
                    healthy: memUsage.heapUsed < 500 * 1024 * 1024, // < 500MB
                    metrics: {
                        memory: memUsage,
                        cpu: cpuUsage,
                        uptime: process.uptime()
                    }
                };
            }
        }
    }
}
```

### Health Check Endpoint

```typescript
// Automatic health endpoint
app.get("/health", (req, res) => {
    res.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        worker: process.pid,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.version,
    });
});
```

## Inter-Process Communication (IPC)

### Broadcasting Messages

```typescript
// Broadcast to all workers
await app.broadcastToWorkers({
    type: "cache:invalidate",
    pattern: "user:*",
});

// Send to random worker
await app.sendToRandomWorker({
    type: "task:process",
    data: taskData,
});
```

### Handling IPC Messages

```typescript
// In worker process
process.on("message", (message) => {
    switch (message.type) {
        case "cache:invalidate":
            app.invalidateCache(message.pattern);
            break;

        case "config:update":
            updateConfiguration(message.config);
            break;

        case "task:process":
            processTask(message.data);
            break;
    }
});
```

### Secure IPC

```typescript
cluster: {
    enabled: true,
    config: {
        ipc: {
            encryption: true,
            key: process.env.IPC_ENCRYPTION_KEY,
            timeout: 5000,
            maxMessageSize: 1024 * 1024 // 1MB
        }
    }
}
```

## Load Balancing

### Round Robin (Default)

```typescript
cluster: {
    config: {
        loadBalancing: {
            strategy: "round-robin";
        }
    }
}
```

### Least Connections

```typescript
cluster: {
    config: {
        loadBalancing: {
            strategy: 'least-connections',
            connectionTracking: true
        }
    }
}
```

### IP Hash (Session Affinity)

```typescript
cluster: {
    config: {
        loadBalancing: {
            strategy: 'ip-hash',
            stickySession: true,
            sessionAffinity: 'ip'
        }
    }
}
```

## Auto-Scaling

### CPU-Based Scaling

```typescript
cluster: {
    config: {
        scaling: {
            enabled: true,
            minWorkers: 2,
            maxWorkers: 16,

            // Scale based on CPU usage
            scaleUpThreshold: 75,    // Scale up at 75% CPU
            scaleDownThreshold: 25,  // Scale down at 25% CPU

            // Cooldown periods
            scaleUpCooldown: 30000,   // 30 seconds
            scaleDownCooldown: 180000, // 3 minutes

            // Scaling increments
            scaleUpIncrement: 2,      // Add 2 workers at a time
            scaleDownIncrement: 1     // Remove 1 worker at a time
        }
    }
}
```

### Memory-Based Scaling

```typescript
cluster: {
    config: {
        scaling: {
            enabled: true,
            strategy: 'memory',
            memoryThreshold: 80,     // Scale at 80% memory usage
            memoryTarget: 60         // Target 60% memory usage
        }
    }
}
```

### Request-Based Scaling

```typescript
cluster: {
    config: {
        scaling: {
            enabled: true,
            strategy: 'requests',
            requestsPerWorker: 100,  // Max 100 concurrent requests per worker
            responseTimeThreshold: 500 // Scale if response time > 500ms
        }
    }
}
```

## Cluster Management API

### Manual Scaling

```typescript
// Scale up
await app.scaleUp(2); // Add 2 workers

// Scale down
await app.scaleDown(1); // Remove 1 worker

// Auto scale
await app.autoScale(); // Trigger auto-scaling logic

// Get optimal worker count
const optimal = await app.getOptimalWorkerCount();
```

### Cluster Information

```typescript
// Get all workers
const workers = app.getAllWorkers();

// Get cluster metrics
const metrics = await app.getClusterMetrics();
console.log({
    totalWorkers: metrics.totalWorkers,
    activeWorkers: metrics.activeWorkers,
    totalRequests: metrics.totalRequests,
    averageResponseTime: metrics.averageResponseTime,
    memoryUsage: metrics.memoryUsage,
    cpuUsage: metrics.cpuUsage,
});

// Get cluster health
const health = await app.getClusterHealth();
console.log({
    healthy: health.healthy,
    unhealthyWorkers: health.unhealthyWorkers,
    lastHealthCheck: health.lastHealthCheck,
});
```

### Cluster Operations

```typescript
// Restart entire cluster
await app.restartCluster();

// Graceful shutdown
await app.stopCluster(true);

// Force shutdown
await app.stopCluster(false);
```

## Production Deployment

### Docker Configuration

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .

# Set cluster configuration
ENV CLUSTER_ENABLED=true
ENV CLUSTER_WORKERS=auto
ENV CLUSTER_AUTO_RESTART=true

EXPOSE 8080

CMD ["node", "dist/server.js"]
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
    name: fastserver-app
spec:
    replicas: 3
    selector:
        matchLabels:
            app: fastserver
    template:
        metadata:
            labels:
                app: fastserver
        spec:
            containers:
                - name: fastserver
                  image: your-registry/fastserver:latest
                  ports:
                      - containerPort: 8080
                  env:
                      - name: CLUSTER_ENABLED
                        value: "true"
                      - name: CLUSTER_WORKERS
                        value: "2" # Limit workers in container
                  resources:
                      requests:
                          memory: "256Mi"
                          cpu: "250m"
                      limits:
                          memory: "512Mi"
                          cpu: "500m"
                  livenessProbe:
                      httpGet:
                          path: /health
                          port: 8080
                      initialDelaySeconds: 30
                      periodSeconds: 10
                  readinessProbe:
                      httpGet:
                          path: /ready
                          port: 8080
                      initialDelaySeconds: 5
                      periodSeconds: 5
```

### Process Manager (PM2)

```javascript
// ecosystem.config.js
module.exports = {
    apps: [
        {
            name: "fastserver",
            script: "dist/server.js",
            instances: "max", // Use all CPU cores
            exec_mode: "cluster",
            env: {
                NODE_ENV: "production",
                CLUSTER_ENABLED: "false", // Let PM2 handle clustering
                PORT: 8080,
            },
            max_memory_restart: "1G",
            error_file: "./logs/err.log",
            out_file: "./logs/out.log",
            log_file: "./logs/combined.log",
            time: true,
        },
    ],
};
```

## Monitoring and Observability

### Cluster Metrics

```typescript
// Enable cluster monitoring
cluster: {
    config: {
        monitoring: {
            enabled: true,
            metricsInterval: 30000,  // Collect metrics every 30 seconds
            exportMetrics: true,     // Export to monitoring system

            // Custom metrics collector
            customMetrics: async (workers) => {
                return {
                    totalMemory: workers.reduce((sum, w) => sum + w.memoryUsage, 0),
                    totalCpu: workers.reduce((sum, w) => sum + w.cpuUsage, 0),
                    totalRequests: workers.reduce((sum, w) => sum + w.requestCount, 0)
                };
            }
        }
    }
}
```

### Logging Integration

```typescript
cluster: {
    config: {
        logging: {
            enabled: true,
            level: 'info',
            includeWorkerLogs: true,
            logRotation: true,
            maxLogSize: '10MB',
            maxLogFiles: 5
        }
    }
}
```

## Best Practices

### Resource Management

```typescript
// Set appropriate resource limits
cluster: {
    config: {
        limits: {
            memory: 512,        // 512MB per worker
            cpu: 80,            // 80% CPU threshold
            requests: 1000,     // Max requests per worker
            connections: 100    // Max concurrent connections
        }
    }
}
```

### Graceful Shutdown

```typescript
// Handle shutdown signals
process.on("SIGTERM", async () => {
    console.log("Received SIGTERM, shutting down gracefully");
    await app.stopCluster(true);
    process.exit(0);
});

process.on("SIGINT", async () => {
    console.log("Received SIGINT, shutting down gracefully");
    await app.stopCluster(true);
    process.exit(0);
});
```

### Error Handling

```typescript
// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
    console.error("Uncaught Exception:", error);
    // Graceful shutdown
    app.stopCluster(true).then(() => process.exit(1));
});

process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
    // Graceful shutdown
    app.stopCluster(true).then(() => process.exit(1));
});
```
