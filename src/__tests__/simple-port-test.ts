import { createServer as createHttpServer } from "http";
import { createServer } from "../integrations/express/ServerFactory";

console.log("🧪 Simple Port Binding Test");
console.log("===========================");

async function testPortBinding() {
    const testPort = 8098;
    
    console.log(`\n1️⃣ Testing raw HTTP server port binding on ${testPort}...`);
    
    // Test 1: Create a raw HTTP server
    const rawServer = createHttpServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: "Raw HTTP server", port: testPort }));
    });
    
    await new Promise<void>((resolve, reject) => {
        rawServer.listen(testPort, "localhost", () => {
            console.log(`✅ Raw HTTP server started on localhost:${testPort}`);
            resolve();
        });
        rawServer.on('error', reject);
    });
    
    // Test 2: Try to create another raw HTTP server on the same port
    console.log(`\n2️⃣ Testing port conflict with another raw HTTP server...`);
    
    const conflictServer = createHttpServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: "Conflict server", port: testPort }));
    });
    
    try {
        await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error("Timeout"));
            }, 2000);
            
            conflictServer.listen(testPort, "localhost", () => {
                clearTimeout(timeout);
                console.log(`❌ Conflict server should NOT have started!`);
                resolve();
            });
            
            conflictServer.on('error', (err: any) => {
                clearTimeout(timeout);
                if (err.code === 'EADDRINUSE') {
                    console.log(`✅ Correctly detected port conflict: ${err.code}`);
                    resolve();
                } else {
                    reject(err);
                }
            });
        });
    } catch (err) {
        console.log(`✅ Port conflict detected: ${err}`);
    }
    
    // Test 3: Now test with FortifyJS server
    console.log(`\n3️⃣ Testing FortifyJS server on same port...`);
    
    const fortifyServer = createServer({
        server: {
            autoPortSwitch: {
                enabled: true,
                maxAttempts: 3,
                strategy: "increment",
                onPortSwitch(originalPort, newPort) {
                    console.log(`🔄 FortifyJS port switch: ${originalPort} → ${newPort}`);
                },
            },
        },
        logging: { enabled: true, level: "debug" }
    });
    
    fortifyServer.get("/fortify", (req, res) => {
        res.json({ 
            message: "FortifyJS server", 
            port: fortifyServer.getPort(),
            originalPort: testPort
        });
    });
    
    try {
        await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error("FortifyJS server start timeout"));
            }, 10000);
            
            fortifyServer.start(testPort, () => {
                clearTimeout(timeout);
                console.log(`✅ FortifyJS server started on port ${fortifyServer.getPort()}`);
                resolve();
            });
        });
        
        // Test the servers
        console.log(`\n4️⃣ Testing server responses...`);
        const http = require('http');
        
        // Test raw server
        try {
            const response1 = await new Promise<string>((resolve, reject) => {
                const req = http.request({
                    hostname: 'localhost',
                    port: testPort,
                    path: '/',
                    method: 'GET'
                }, (res: any) => {
                    let data = '';
                    res.on('data', (chunk: any) => data += chunk);
                    res.on('end', () => resolve(data));
                });
                req.on('error', reject);
                req.end();
            });
            console.log("📡 Raw server response:", JSON.parse(response1));
        } catch (err) {
            console.log("❌ Raw server test failed:", err);
        }
        
        // Test FortifyJS server
        try {
            const response2 = await new Promise<string>((resolve, reject) => {
                const req = http.request({
                    hostname: 'localhost',
                    port: fortifyServer.getPort(),
                    path: '/fortify',
                    method: 'GET'
                }, (res: any) => {
                    let data = '';
                    res.on('data', (chunk: any) => data += chunk);
                    res.on('end', () => resolve(data));
                });
                req.on('error', reject);
                req.end();
            });
            console.log("📡 FortifyJS server response:", JSON.parse(response2));
        } catch (err) {
            console.log("❌ FortifyJS server test failed:", err);
        }
        
    } catch (error) {
        console.error("❌ FortifyJS server test failed:", error);
    }
    
    // Cleanup
    rawServer.close();
    setTimeout(() => {
        process.exit(0);
    }, 2000);
}

// Run the test
testPortBinding().catch(err => {
    console.error("❌ Test failed:", err);
    process.exit(1);
});

// Handle cleanup
process.on('SIGINT', () => {
    console.log("\n🧹 Cleaning up...");
    process.exit(0);
});
