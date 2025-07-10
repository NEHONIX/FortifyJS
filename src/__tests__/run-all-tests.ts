/**
 * FortifyJS Test Suite Runner
 * Runs all test files and provides a comprehensive test report
 */

import { spawn } from "child_process";
import { join } from "path";

console.log("🧪 FortifyJS Comprehensive Test Suite");
console.log("=====================================");

interface TestResult {
    name: string;
    passed: boolean;
    duration: number;
    output: string;
    error?: string;
}

// List of all test files to run
const testFiles = [
    "server-creation.test.ts",
    "rate-limiting.test.ts",
    "cors.test.ts",
    "security.test.ts",
    "integration.test.ts",
];

async function runSingleTest(testFile: string): Promise<TestResult> {
    const startTime = Date.now();
    const testPath = join(__dirname, testFile);

    console.log(`\n🔬 Running ${testFile}...`);

    return new Promise((resolve) => {
        const child = spawn("bun", ["run", testPath], {
            stdio: ["pipe", "pipe", "pipe"],
            cwd: process.cwd(),
        });

        let output = "";
        let errorOutput = "";

        child.stdout?.on("data", (data) => {
            const text = data.toString();
            output += text;
            // Show real-time output
            process.stdout.write(text);
        });

        child.stderr?.on("data", (data) => {
            const text = data.toString();
            errorOutput += text;
            process.stderr.write(text);
        });

        child.on("close", (code) => {
            const duration = Date.now() - startTime;
            const passed = code === 0;

            resolve({
                name: testFile,
                passed,
                duration,
                output,
                error: passed ? undefined : errorOutput,
            });
        });

        child.on("error", (error) => {
            const duration = Date.now() - startTime;
            resolve({
                name: testFile,
                passed: false,
                duration,
                output,
                error: error.message,
            });
        });
    });
}

async function runAllTests(): Promise<void> {
    const results: TestResult[] = [];
    const startTime = Date.now();

    console.log(`📋 Running ${testFiles.length} test suites...\n`);

    // Run tests sequentially to avoid port conflicts
    for (const testFile of testFiles) {
        try {
            const result = await runSingleTest(testFile);
            results.push(result);

            if (result.passed) {
                console.log(`✅ ${testFile} - PASSED (${result.duration}ms)`);
            } else {
                console.log(`❌ ${testFile} - FAILED (${result.duration}ms)`);
            }

            // Wait between tests to ensure cleanup
            await new Promise((resolve) => setTimeout(resolve, 1000));
        } catch (error) {
            console.error(`💥 Error running ${testFile}:`, error);
            results.push({
                name: testFile,
                passed: false,
                duration: 0,
                output: "",
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }

    // Generate test report
    const totalDuration = Date.now() - startTime;
    const passedTests = results.filter((r) => r.passed);
    const failedTests = results.filter((r) => !r.passed);

    console.log("\n" + "=".repeat(50));
    console.log("📊 TEST SUITE SUMMARY");
    console.log("=".repeat(50));
    console.log(`Total Tests: ${results.length}`);
    console.log(`✅ Passed: ${passedTests.length}`);
    console.log(`❌ Failed: ${failedTests.length}`);
    console.log(`⏱️  Total Duration: ${totalDuration}ms`);
    console.log(
        `📈 Success Rate: ${Math.round(
            (passedTests.length / results.length) * 100
        )}%`
    );

    if (failedTests.length > 0) {
        console.log("\n❌ FAILED TESTS:");
        failedTests.forEach((test) => {
            console.log(`  • ${test.name}`);
            if (test.error) {
                console.log(`    Error: ${test.error}`);
            }
        });
    }

    if (passedTests.length > 0) {
        console.log("\n✅ PASSED TESTS:");
        passedTests.forEach((test) => {
            console.log(`  • ${test.name} (${test.duration}ms)`);
        });
    }

    console.log("\n" + "=".repeat(50));

    if (failedTests.length === 0) {
        console.log("🎉 ALL TESTS PASSED! FortifyJS is working correctly!");
        process.exit(0);
    } else {
        console.log("💥 SOME TESTS FAILED! Please check the errors above.");
        process.exit(1);
    }
}

// Handle process termination
process.on("SIGINT", () => {
    console.log("\n⚠️  Test suite interrupted by user");
    process.exit(1);
});

process.on("SIGTERM", () => {
    console.log("\n⚠️  Test suite terminated");
    process.exit(1);
});

// Run the test suite
runAllTests().catch((error) => {
    console.error("💥 Fatal error running test suite:", error);
    process.exit(1);
});

