export default {
    preset: "ts-jest",
    testEnvironment: "node",
    extensionsToTreatAsEsm: [".ts"],
    testMatch: ["**/__tests__/**/*.test.ts", "**/tests/**/*.test.ts"],
    collectCoverageFrom: [
        "src/**/*.ts",
        "!src/**/*.d.ts",
        "!src/**/__tests__/**",
    ],
    coverageThreshold: {
        global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80,
        },
    },
    coverageReporters: ["text", "lcov"],
    transform: {
        "^.+\\.tsx?$": [
            "ts-jest",
            {
                tsconfig: "tsconfig.json",
                useESM: true,
            },
        ],
    },
    // Force Jest to exit after all tests complete
    forceExit: true,
    // Set a timeout for tests
    testTimeout: 10000,
};
