/**
 * Port Manager - Handles automatic port switching when ports are in use
 */
import { createServer } from 'http';
import { ServerConfig } from '../../types/types';

export interface PortSwitchResult {
    success: boolean;
    port: number;
    originalPort: number;
    attempts: number;
    switched: boolean;
}

export class PortManager {
    private config: ServerConfig['autoPortSwitch'];
    private originalPort: number;

    constructor(originalPort: number, config?: ServerConfig['autoPortSwitch']) {
        this.originalPort = originalPort;
        this.config = {
            enabled: false,
            maxAttempts: 10,
            startPort: originalPort,
            strategy: 'increment',
            ...config
        };
    }

    /**
     * Check if a port is available
     */
    private async isPortAvailable(port: number): Promise<boolean> {
        return new Promise((resolve) => {
            const server = createServer();
            
            server.listen(port, () => {
                server.close(() => resolve(true));
            });
            
            server.on('error', () => resolve(false));
        });
    }

    /**
     * Generate next port based on strategy
     */
    private getNextPort(currentPort: number, attempt: number): number {
        const { strategy, portRange, predefinedPorts } = this.config!;

        switch (strategy) {
            case 'increment':
                return currentPort + attempt;
                
            case 'random':
                if (portRange) {
                    const [min, max] = portRange;
                    return Math.floor(Math.random() * (max - min + 1)) + min;
                }
                return currentPort + Math.floor(Math.random() * 1000) + 1;
                
            case 'predefined':
                if (predefinedPorts && predefinedPorts.length > 0) {
                    return predefinedPorts[attempt % predefinedPorts.length];
                }
                // Fallback to increment if no predefined ports
                return currentPort + attempt;
                
            default:
                return currentPort + attempt;
        }
    }

    /**
     * Validate port number
     */
    private isValidPort(port: number): boolean {
        return port >= 1 && port <= 65535;
    }

    /**
     * Find an available port automatically
     */
    public async findAvailablePort(): Promise<PortSwitchResult> {
        const result: PortSwitchResult = {
            success: false,
            port: this.originalPort,
            originalPort: this.originalPort,
            attempts: 0,
            switched: false
        };

        // If auto port switch is disabled, just check the original port
        if (!this.config?.enabled) {
            const available = await this.isPortAvailable(this.originalPort);
            result.success = available;
            result.attempts = 1;
            return result;
        }

        const { maxAttempts, startPort, portRange } = this.config!;
        let currentPort = startPort || this.originalPort;

        // First, try the original port
        if (await this.isPortAvailable(this.originalPort)) {
            result.success = true;
            result.attempts = 1;
            return result;
        }

        // If original port is not available, start searching
        for (let attempt = 1; attempt <= maxAttempts!; attempt++) {
            currentPort = this.getNextPort(startPort || this.originalPort, attempt);
            
            // Validate port range if specified
            if (portRange) {
                const [min, max] = portRange;
                if (currentPort < min || currentPort > max) {
                    continue;
                }
            }

            // Validate port number
            if (!this.isValidPort(currentPort)) {
                continue;
            }

            result.attempts = attempt + 1;

            if (await this.isPortAvailable(currentPort)) {
                result.success = true;
                result.port = currentPort;
                result.switched = true;

                // Call the callback if provided
                if (this.config?.onPortSwitch) {
                    this.config.onPortSwitch(this.originalPort, currentPort);
                }

                break;
            }
        }

        return result;
    }

    /**
     * Get configuration summary
     */
    public getConfig(): ServerConfig['autoPortSwitch'] {
        return { ...this.config };
    }

    /**
     * Update configuration
     */
    public updateConfig(newConfig: Partial<ServerConfig['autoPortSwitch']>): void {
        this.config = { ...this.config, ...newConfig };
    }
}

/**
 * Utility function to create a PortManager instance
 */
export function createPortManager(
    port: number, 
    config?: ServerConfig['autoPortSwitch']
): PortManager {
    return new PortManager(port, config);
}

/**
 * Quick utility to find an available port
 */
export async function findAvailablePort(
    port: number,
    config?: ServerConfig['autoPortSwitch']
): Promise<PortSwitchResult> {
    const manager = new PortManager(port, config);
    return manager.findAvailablePort();
}
