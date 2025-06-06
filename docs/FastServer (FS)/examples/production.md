# Production Setup Examples

## Production-Ready Configuration

### Complete Production Setup

```typescript
import { createServer } from "fortify2-js";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";

const app = createServer({
    env: "production",

    // Server configuration
    server: {
        port: parseInt(process.env.PORT || "8080"),
        host: "0.0.0.0",
        trustProxy: true,
        jsonLimit: "10mb",
        urlEncodedLimit: "10mb",
        autoPortSwitch: {
            enabled: false, // Disable in production
        },
    },

    // Clustering for scalability
    cluster: {
        enabled: true,
        config: {
            workers: "auto",
            autoRestart: true,
            maxRestarts: 5,
            restartDelay: 2000,
            gracefulShutdown: true,
            shutdownTimeout: 30000,

            healthCheck: {
                enabled: true,
                interval: 30000,
                timeout: 5000,
                retries: 3,
            },

            scaling: {
                enabled: true,
                minWorkers: 2,
                maxWorkers: 16,
                scaleUpThreshold: 80,
                scaleDownThreshold: 30,
                scaleUpCooldown: 60000,
                scaleDownCooldown: 300000,
            },
        },
    },

    // Redis cache for production
    cache: {
        enabled: true,
        strategy: "redis",
        redis: {
            host: process.env.REDIS_HOST || "localhost",
            port: parseInt(process.env.REDIS_PORT || "6379"),
            password: process.env.REDIS_PASSWORD,
            db: parseInt(process.env.REDIS_DB || "0"),
            cluster: process.env.REDIS_CLUSTER === "true",
            pool: {
                min: 5,
                max: 20,
                acquireTimeoutMillis: 30000,
                idleTimeoutMillis: 30000,
            },
        },
    },

    // Performance optimization
    performance: {
        optimizationEnabled: true,
        compression: true,
        connectionPooling: true,
        asyncWrite: true,
        prefetch: true,
        requestClassification: true,
        predictivePreloading: true,
        aggressiveCaching: true,
        parallelProcessing: true,
        preCompilerEnabled: true,
        learningPeriod: 60000,
        optimizationThreshold: 1,
        aggressiveOptimization: true,
        cacheWarmupEnabled: true,
        warmupOnStartup: true,
    },

    // Security configuration
    security: {
        encryption: true,
        accessMonitoring: true,
        sanitization: true,
        auditLogging: true,
        cors: true,
        helmet: true,
    },

    // Production logging
    logging: {
        level: "warn",
        components: {
            server: true,
            cache: false,
            cluster: true,
            performance: false,
            fileWatcher: false,
            plugins: false,
            security: true,
            monitoring: true,
            routes: false,
        },
        types: {
            startup: true,
            warnings: true,
            errors: true,
            performance: false,
            debug: false,
            hotReload: false,
            portSwitching: false,
        },
        format: {
            timestamps: true,
            colors: false,
            prefix: true,
            compact: true,
        },
        customLogger: (level, component, message, ...args) => {
            // Send to external logging service (e.g., ELK, Datadog)
            const logEntry = {
                timestamp: new Date().toISOString(),
                level: level.toUpperCase(),
                component,
                message,
                service: "fastserver",
                environment: "production",
                pid: process.pid,
                ...(args.length > 0 && { details: args }),
            };

            // Example: Send to external service
            console.log(JSON.stringify(logEntry));
        },
    },

    // Monitoring and health checks
    monitoring: {
        enabled: true,
        healthChecks: true,
        metrics: true,
        detailed: false,
        alertThresholds: {
            memoryUsage: 85,
            hitRate: 70,
            errorRate: 5,
            latency: 100,
        },
    },
});

// Security middleware
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", "data:", "https:"],
            },
        },
        hsts: {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true,
        },
    })
);

// Compression middleware
app.use(
    compression({
        level: 6,
        threshold: 1024,
        filter: (req, res) => {
            if (req.headers["x-no-compression"]) {
                return false;
            }
            return compression.filter(req, res);
        },
    })
);

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        error: "Too many requests from this IP, please try again later.",
    },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use("/api/", limiter);

// Health check endpoints
app.get("/health", (req, res) => {
    res.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || "1.0.0",
    });
});

app.get("/ready", async (req, res) => {
    try {
        // Check dependencies (database, cache, etc.)
        const cacheStats = await app.getCacheStats();
        const clusterHealth = await app.getClusterHealth();

        const ready = cacheStats.connected && clusterHealth.healthy;

        res.status(ready ? 200 : 503).json({
            ready,
            cache: cacheStats.connected,
            cluster: clusterHealth.healthy,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        res.status(503).json({
            ready: false,
            error: error.message,
            timestamp: new Date().toISOString(),
        });
    }
});

// Metrics endpoint (protected)
app.get("/metrics", async (req, res) => {
    // Add authentication for metrics endpoint
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${process.env.METRICS_TOKEN}`) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    const metrics = {
        performance: await app.getPerformanceStats(),
        cache: await app.getCacheStats(),
        cluster: await app.getClusterMetrics(),
        system: {
            memory: process.memoryUsage(),
            cpu: process.cpuUsage(),
            uptime: process.uptime(),
        },
    };

    res.json(metrics);
});

// Graceful shutdown handling
const gracefulShutdown = async (signal) => {
    console.log(`Received ${signal}, shutting down gracefully`);

    try {
        // Stop accepting new connections
        await app.stopCluster(true);

        // Close database connections, cleanup resources
        // await database.close();
        // await cache.disconnect();

        console.log("Graceful shutdown completed");
        process.exit(0);
    } catch (error) {
        console.error("Error during shutdown:", error);
        process.exit(1);
    }
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Uncaught exception handling
process.on("uncaughtException", (error) => {
    console.error("Uncaught Exception:", error);
    gracefulShutdown("uncaughtException");
});

process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
    gracefulShutdown("unhandledRejection");
});

export default app;
```

## Docker Production Setup

### Dockerfile

```dockerfile
# Multi-stage build for production
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY src/ ./src/

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S fastserver -u 1001

WORKDIR /app

# Copy built application
COPY --from=builder --chown=fastserver:nodejs /app/dist ./dist
COPY --from=builder --chown=fastserver:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=fastserver:nodejs /app/package*.json ./

# Create logs directory
RUN mkdir -p /app/logs && chown fastserver:nodejs /app/logs

# Switch to non-root user
USER fastserver

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:8080/health', (res) => { \
        process.exit(res.statusCode === 200 ? 0 : 1) \
    }).on('error', () => process.exit(1))"

# Expose port
EXPOSE 8080

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080
ENV CLUSTER_ENABLED=true
ENV CLUSTER_WORKERS=auto

# Start application
CMD ["node", "dist/server.js"]
```

### Docker Compose

```yaml
version: "3.8"

services:
    fastserver:
        build: .
        ports:
            - "8080:8080"
        environment:
            - NODE_ENV=production
            - PORT=8080
            - REDIS_HOST=redis
            - REDIS_PORT=6379
            - REDIS_PASSWORD=${REDIS_PASSWORD}
            - CLUSTER_ENABLED=true
            - CLUSTER_WORKERS=auto
        depends_on:
            - redis
        restart: unless-stopped
        deploy:
            replicas: 3
            resources:
                limits:
                    memory: 512M
                    cpus: "0.5"
                reservations:
                    memory: 256M
                    cpus: "0.25"
        healthcheck:
            test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
            interval: 30s
            timeout: 10s
            retries: 3
            start_period: 40s
        volumes:
            - ./logs:/app/logs
        networks:
            - fastserver-network

    redis:
        image: redis:7-alpine
        command: redis-server --requirepass ${REDIS_PASSWORD}
        environment:
            - REDIS_PASSWORD=${REDIS_PASSWORD}
        volumes:
            - redis-data:/data
        restart: unless-stopped
        networks:
            - fastserver-network

    nginx:
        image: nginx:alpine
        ports:
            - "80:80"
            - "443:443"
        volumes:
            - ./nginx.conf:/etc/nginx/nginx.conf
            - ./ssl:/etc/nginx/ssl
        depends_on:
            - fastserver
        restart: unless-stopped
        networks:
            - fastserver-network

volumes:
    redis-data:

networks:
    fastserver-network:
        driver: bridge
```

## Kubernetes Deployment

### Deployment Configuration

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
    name: fastserver
    labels:
        app: fastserver
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
                      - name: NODE_ENV
                        value: "production"
                      - name: PORT
                        value: "8080"
                      - name: REDIS_HOST
                        value: "redis-service"
                      - name: REDIS_PASSWORD
                        valueFrom:
                            secretKeyRef:
                                name: redis-secret
                                key: password
                      - name: CLUSTER_ENABLED
                        value: "true"
                      - name: CLUSTER_WORKERS
                        value: "2"
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
                      timeoutSeconds: 5
                      failureThreshold: 3
                  readinessProbe:
                      httpGet:
                          path: /ready
                          port: 8080
                      initialDelaySeconds: 5
                      periodSeconds: 5
                      timeoutSeconds: 3
                      failureThreshold: 3
                  volumeMounts:
                      - name: logs
                        mountPath: /app/logs
            volumes:
                - name: logs
                  emptyDir: {}
---
apiVersion: v1
kind: Service
metadata:
    name: fastserver-service
spec:
    selector:
        app: fastserver
    ports:
        - protocol: TCP
          port: 80
          targetPort: 8080
    type: ClusterIP
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
    name: fastserver-ingress
    annotations:
        kubernetes.io/ingress.class: nginx
        cert-manager.io/cluster-issuer: letsencrypt-prod
        nginx.ingress.kubernetes.io/rate-limit: "100"
spec:
    tls:
        - hosts:
              - api.yourdomain.com
          secretName: fastserver-tls
    rules:
        - host: api.yourdomain.com
          http:
              paths:
                  - path: /
                    pathType: Prefix
                    backend:
                        service:
                            name: fastserver-service
                            port:
                                number: 80
```

## Load Balancer Configuration

### Nginx Configuration

```nginx
upstream fastserver {
    least_conn;
    server fastserver-1:8080 max_fails=3 fail_timeout=30s;
    server fastserver-2:8080 max_fails=3 fail_timeout=30s;
    server fastserver-3:8080 max_fails=3 fail_timeout=30s;
}

server {
    listen 80;
    server_name api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;

    # Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    location / {
        proxy_pass http://fastserver;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    location /health {
        proxy_pass http://fastserver;
        access_log off;
    }
}
```

## Monitoring Setup

### Prometheus Configuration

```yaml
# prometheus.yml
global:
    scrape_interval: 15s

scrape_configs:
    - job_name: "fastserver"
      static_configs:
          - targets: ["fastserver:8080"]
      metrics_path: "/metrics"
      bearer_token: "your-metrics-token"
      scrape_interval: 30s
```

### Grafana Dashboard

```json
{
    "dashboard": {
        "title": "FastServer Metrics",
        "panels": [
            {
                "title": "Response Time",
                "type": "graph",
                "targets": [
                    {
                        "expr": "fastserver_response_time_avg",
                        "legendFormat": "Average Response Time"
                    }
                ]
            },
            {
                "title": "Throughput",
                "type": "graph",
                "targets": [
                    {
                        "expr": "rate(fastserver_requests_total[5m])",
                        "legendFormat": "Requests per Second"
                    }
                ]
            },
            {
                "title": "Cache Hit Rate",
                "type": "singlestat",
                "targets": [
                    {
                        "expr": "fastserver_cache_hit_rate",
                        "legendFormat": "Cache Hit Rate"
                    }
                ]
            }
        ]
    }
}
```
