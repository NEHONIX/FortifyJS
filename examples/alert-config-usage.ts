/**
 * Example usage of the different AlertConfig types after resolving naming conflicts
 */

import type{ 
    CoreAlertConfig, 
    PerformanceAlertConfig, 
    MonitoringAlertConfig 
} from '../src/integrations/express/types/types';

// Core AlertConfig - Simple alert configuration
const coreAlert: CoreAlertConfig = {
    metric: 'memory_usage',
    threshold: 0.85,
    action: 'webhook',
    target: 'https://alerts.example.com/webhook',
    cooldown: 300000 // 5 minutes
};

// Performance AlertConfig - Performance-specific alerts
const performanceAlert: PerformanceAlertConfig = {
    metric: 'response_time',
    threshold: 1000, // 1 second
    action: 'log',
    target: 'performance.log',
    cooldown: 600000 // 10 minutes
};

// Monitoring AlertConfig - Advanced monitoring with conditions and actions
const monitoringAlert: MonitoringAlertConfig = {
    name: 'high-memory-usage',
    description: 'Alert when memory usage exceeds 85%',
    condition: {
        metric: 'memory.percentage',
        operator: '>',
        threshold: 0.85,
        duration: 300000 // 5 minutes
    },
    actions: [
        {
            type: 'webhook',
            target: 'https://alerts.example.com/webhook',
            payload: {
                severity: 'warning',
                service: 'fortifyjs-server'
            }
        },
        {
            type: 'email',
            target: 'admin@example.com',
            subject: 'High Memory Usage Alert'
        }
    ],
    cooldown: 900000, // 15 minutes
    enabled: true
};

console.log('Alert configurations created successfully!');
console.log('Core Alert:', coreAlert);
console.log('Performance Alert:', performanceAlert);
console.log('Monitoring Alert:', monitoringAlert);
