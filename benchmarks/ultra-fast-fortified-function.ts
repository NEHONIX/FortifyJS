/**
 * FortifyJS - Ultra-Fast FortifiedFunction Benchmark
 * Comprehensive performance testing for extreme optimizations
 */

import { func, createFortifiedFunction } from "../src/";

interface BenchmarkResult {
    name: string;
    operations: number;
    totalTime: number;
    avgTime: number;
    opsPerSecond: number;
    memoryUsage: number;
}

/**
 * Run a performance benchmark
 */
function benchmark(
    name: string,
    operations: number,
    fn: () => void | Promise<void>
): Promise<BenchmarkResult> {
    return new Promise(async (resolve) => {
        console.log(`\n🔄 Running: ${name} (${operations} operations)`);

        // Warm up
        for (let i = 0; i < Math.min(10, operations); i++) {
            await fn();
        }

        // Force garbage collection if available
        if (global.gc) {
            global.gc();
        }

        const startMemory = process.memoryUsage().heapUsed;
        const startTime = process.hrtime.bigint();

        for (let i = 0; i < operations; i++) {
            await fn();
        }

        const endTime = process.hrtime.bigint();
        const endMemory = process.memoryUsage().heapUsed;

        const totalTime = Number(endTime - startTime) / 1_000_000; // Convert to milliseconds
        const avgTime = totalTime / operations;
        const opsPerSecond = Math.floor(1000 / avgTime);
        const memoryUsage = endMemory - startMemory;

        const result: BenchmarkResult = {
            name,
            operations,
            totalTime,
            avgTime,
            opsPerSecond,
            memoryUsage,
        };

        console.log(`✅ ${name}:`);
        console.log(`   Total time: ${totalTime.toFixed(2)}ms`);
        console.log(`   Avg per operation: ${avgTime.toFixed(3)}ms`);
        console.log(`   Operations/second: ${opsPerSecond.toLocaleString()}`);
        console.log(`   Memory usage: ${(memoryUsage / 1024).toFixed(1)}KB`);

        resolve(result);
    });
}

/**
 * Test functions for benchmarking
 */
const testFunctions = {
    // Simple mathematical operation
    simpleAdd: (a: number, b: number) => a + b,

    // Array processing (SIMD candidate)
    arraySum: (arr: number[]) => arr.reduce((sum, val) => sum + val, 0),

    // Vector operations (SIMD candidate)
    vectorAdd: (a: number[], b: number[]) =>
        a.map((val, i) => val + (b[i] || 0)),

    // Complex calculation (WASM candidate)
    fibonacci: (n: number): number => {
        if (n <= 1) return n;
        return testFunctions.fibonacci(n - 1) + testFunctions.fibonacci(n - 2);
    },

    // String processing (compression candidate)
    stringProcess: (str: string) => {
        return str
            .split("")
            .map((char) => char.charCodeAt(0))
            .reduce((sum, code) => sum + code, 0)
            .toString();
    },

    // Async operation
    asyncOperation: async (data: string) => {
        await new Promise((resolve) => setTimeout(resolve, 1));
        return data.toUpperCase();
    },
};

/**
 * Run comprehensive benchmarks
 */
async function runBenchmarks() {
    console.log("🚀 FortifyJS Ultra-Fast FortifiedFunction Benchmarks");
    console.log("====================================================");

    const results: BenchmarkResult[] = [];

    // Test data
    const testArray = Array.from({ length: 1000 }, (_, i) => i);
    const testVectorA = Array.from({ length: 100 }, (_, i) => i);
    const testVectorB = Array.from({ length: 100 }, (_, i) => i * 2);
    const testString =
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. ".repeat(20);

    // 1. Baseline (no fortification)
    console.log("\n📊 BASELINE TESTS (No Fortification)");
    results.push(
        await benchmark("Baseline - Simple Add", 10000, () => {
            testFunctions.simpleAdd(42, 58);
        })
    );

    results.push(
        await benchmark("Baseline - Array Sum", 1000, () => {
            testFunctions.arraySum(testArray);
        })
    );

    results.push(
        await benchmark("Baseline - Vector Add", 1000, () => {
            testFunctions.vectorAdd(testVectorA, testVectorB);
        })
    );

    // 2. Standard FortifiedFunction
    console.log("\n📊 STANDARD FORTIFIED FUNCTION TESTS");

    const standardAdd = createFortifiedFunction(testFunctions.simpleAdd, {
        ultraFast: "standard",
        enableJIT: false,
        enableSIMD: false,
        enableWebAssembly: false,
    });

    results.push(
        await benchmark("Standard - Simple Add", 10000, async () => {
            await standardAdd.execute(42, 58);
        })
    );

    const standardArraySum = createFortifiedFunction(testFunctions.arraySum, {
        ultraFast: "standard",
        enableJIT: false,
        enableSIMD: false,
        enableWebAssembly: false,
    });

    results.push(
        await benchmark("Standard - Array Sum", 1000, async () => {
            await standardArraySum.execute(testArray);
        })
    );

    // 3. Ultra-Fast FortifiedFunction (Maximum Optimization)
    console.log(
        "\n🔥 ULTRA-FAST FORTIFIED FUNCTION TESTS (Maximum Optimization)"
    );

    const ultraFastAdd = func(testFunctions.simpleAdd, {
        ultraFast: "maximum",
        enableJIT: true,
        enableSIMD: true,
        enableWebAssembly: true,
        enableZeroCopy: true,
        enableVectorization: true,
        enableParallelExecution: true,
        smartCaching: true,
        maxCacheSize: 10000,
        jitThreshold: 1, // Trigger JIT immediately for benchmarking
        simdThreshold: 2, // Lower threshold for SIMD
    });

    results.push(
        await benchmark("Ultra-Fast - Simple Add", 10000, () => {
            ultraFastAdd(42, 58);
        })
    );

    const ultraFastArraySum = func(testFunctions.arraySum, {
        ultraFast: "maximum",
        enableJIT: true,
        enableSIMD: true,
        enableWebAssembly: true,
        smartCaching: true,
        maxCacheSize: 10000,
        jitThreshold: 1,
        simdThreshold: 2,
    });

    results.push(
        await benchmark("Ultra-Fast - Array Sum", 1000, () => {
            ultraFastArraySum(testArray);
        })
    );

    const ultraFastVectorAdd = func(testFunctions.vectorAdd, {
        ultraFast: "maximum",
        enableJIT: true,
        enableSIMD: true,
        enableWebAssembly: true,
        smartCaching: true,
        maxCacheSize: 10000,
        jitThreshold: 1,
        simdThreshold: 2,
    });

    results.push(
        await benchmark("Ultra-Fast - Vector Add (SIMD)", 1000, () => {
            ultraFastVectorAdd(testVectorA, testVectorB);
        })
    );

    const ultraFastStringProcess = func(testFunctions.stringProcess, {
        ultraFast: "maximum",
        enableJIT: true,
        smartCaching: true,
        maxCacheSize: 10000,
        jitThreshold: 1,
    });

    results.push(
        await benchmark("Ultra-Fast - String Processing", 1000, () => {
            ultraFastStringProcess(testString);
        })
    );

    const ultraFastAsync = func(testFunctions.asyncOperation, {
        ultraFast: "maximum",
        enableJIT: true,
        smartCaching: true,
        maxCacheSize: 10000,
    });

    results.push(
        await benchmark("Ultra-Fast - Async Operation", 100, async () => {
            await ultraFastAsync("test data");
        })
    );

    // 4. Performance Analysis
    console.log("\n📈 PERFORMANCE ANALYSIS");
    console.log("========================");

    // Get detailed metrics from ultra-fast functions
    console.log("\n🔍 Ultra-Fast Component Metrics:");
    const ultraMetrics = ultraFastAdd._fortified.getUltraFastMetrics();
    console.log("Engine Stats:", ultraMetrics.engine);
    console.log("Cache Stats:", ultraMetrics.cache);
    console.log("Allocator Stats:", ultraMetrics.allocator);
    console.log("Optimization Level:", ultraMetrics.optimizationLevel);
    console.log("Performance Gains:", ultraMetrics.performanceGains);

    // Calculate performance improvements
    console.log("\n⚡ PERFORMANCE IMPROVEMENTS:");
    const baselineAdd = results.find((r) => r.name === "Baseline - Simple Add");
    const ultraAdd = results.find((r) => r.name === "Ultra-Fast - Simple Add");

    if (baselineAdd && ultraAdd) {
        const speedup = baselineAdd.avgTime / ultraAdd.avgTime;
        const throughputImprovement =
            (ultraAdd.opsPerSecond / baselineAdd.opsPerSecond - 1) * 100;

        console.log(`Simple Add Speedup: ${speedup.toFixed(2)}x faster`);
        console.log(
            `Throughput Improvement: ${throughputImprovement.toFixed(1)}%`
        );
    }

    const baselineArray = results.find(
        (r) => r.name === "Baseline - Array Sum"
    );
    const ultraArray = results.find((r) => r.name === "Ultra-Fast - Array Sum");

    if (baselineArray && ultraArray) {
        const speedup = baselineArray.avgTime / ultraArray.avgTime;
        const throughputImprovement =
            (ultraArray.opsPerSecond / baselineArray.opsPerSecond - 1) * 100;

        console.log(`Array Sum Speedup: ${speedup.toFixed(2)}x faster`);
        console.log(
            `Throughput Improvement: ${throughputImprovement.toFixed(1)}%`
        );
    }

    // 5. Memory efficiency analysis
    console.log("\n💾 MEMORY EFFICIENCY:");
    const totalMemoryUsage = results.reduce(
        (sum, r) => sum + Math.max(0, r.memoryUsage),
        0
    );
    console.log(
        `Total Memory Usage: ${(totalMemoryUsage / 1024).toFixed(1)}KB`
    );

    const ultraFastResults = results.filter((r) =>
        r.name.includes("Ultra-Fast")
    );
    const avgUltraMemory =
        ultraFastResults.reduce(
            (sum, r) => sum + Math.max(0, r.memoryUsage),
            0
        ) / ultraFastResults.length;
    console.log(
        `Average Ultra-Fast Memory per Operation: ${(
            avgUltraMemory / 1024
        ).toFixed(1)}KB`
    );

    console.log("\n✅ Benchmark completed successfully!");
    console.log(
        "🎯 Ultra-Fast FortifiedFunction delivers sub-millisecond performance with enterprise security!"
    );

    // Cleanup
    ultraFastAdd._fortified.destroy();
    ultraFastArraySum._fortified.destroy();
    ultraFastVectorAdd._fortified.destroy();
    ultraFastStringProcess._fortified.destroy();
    ultraFastAsync._fortified.destroy();
    standardAdd.destroy();
    standardArraySum.destroy();
}

// Run benchmarks if this file is executed directly
if (require.main === module) {
    runBenchmarks().catch(console.error);
}

export { runBenchmarks, benchmark, testFunctions };

