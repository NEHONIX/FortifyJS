/**
 * FortifyJS Server Startup Script
 * 
 * This script starts the FortifyJS server with the specified options.
 */

import { FortifyJSServer } from './index';

// Parse command line arguments
const args = process.argv.slice(2);
const options: any = {
    port: 3000,
    host: 'localhost',
    enableHttp: true,
    enableWebSockets: true,
    authToken: '',
    corsOrigins: ['*'],
    logRequests: true
};

// Parse arguments
for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--port' || arg === '-p') {
        options.port = parseInt(args[++i], 10);
    } else if (arg === '--host' || arg === '-h') {
        options.host = args[++i];
    } else if (arg === '--no-http') {
        options.enableHttp = false;
    } else if (arg === '--no-ws') {
        options.enableWebSockets = false;
    } else if (arg === '--auth-token' || arg === '-a') {
        options.authToken = args[++i];
    } else if (arg === '--cors') {
        options.corsOrigins = args[++i].split(',');
    } else if (arg === '--no-log') {
        options.logRequests = false;
    } else if (arg === '--help') {
        console.log(`
FortifyJS Server

Usage: node start.js [options]

Options:
  --port, -p <port>       Port to listen on (default: 3000)
  --host, -h <host>       Host to listen on (default: localhost)
  --no-http               Disable HTTP server
  --no-ws                 Disable WebSocket server
  --auth-token, -a <token> Authentication token (default: random)
  --cors <origins>        Comma-separated list of allowed CORS origins (default: *)
  --no-log                Disable request logging
  --help                  Show this help message
`);
        process.exit(0);
    }
}

// Create and start server
const server = new FortifyJSServer(options);

server.start().catch((error) => {
    console.error('Error starting server:', error);
    process.exit(1);
});

// Handle process termination
process.on('SIGINT', () => {
    console.log('Received SIGINT. Shutting down server...');
    server.stop().then(() => {
        process.exit(0);
    }).catch((error) => {
        console.error('Error stopping server:', error);
        process.exit(1);
    });
});

process.on('SIGTERM', () => {
    console.log('Received SIGTERM. Shutting down server...');
    server.stop().then(() => {
        process.exit(0);
    }).catch((error) => {
        console.error('Error stopping server:', error);
        process.exit(1);
    });
});
