import { fObject, fString, Random } from "fortify2-js";

const data = fString("performance-test");

const benchmark = await data.benchmarkOperation(
    async () => await Random.getRandomBytes(32),
    "SHA-256 Hash",
    10000
);
console.log(benchmark.operationsPerSecond);
