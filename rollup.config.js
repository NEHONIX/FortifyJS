import typescript from "@rollup/plugin-typescript";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import dts from "rollup-plugin-dts";
import { readFileSync } from "fs";

const pkg = JSON.parse(
    readFileSync(new URL("./package.json", import.meta.url), "utf8")
);

export default [
    // ESM build - Modular output
    {
        input: "src/index.ts",
        output: {
            dir: "dist/esm",
            format: "es",
            sourcemap: true,
            exports: "named",
            preserveModules: true, // Keep modular structure
            preserveModulesRoot: "src", // Preserve src structure
        },
        plugins: [
            resolve({
                preferBuiltins: true, // Prefer Node.js built-ins
            }),
            commonjs(),
            json(),
            typescript({
                tsconfig: "./tsconfig.json",
                declaration: false, // We'll generate declarations separately
                declarationMap: false, // Disable declaration maps
                outDir: undefined, // Let Rollup handle output directory
                exclude: [
                    "/private/**",
                    "**/private/*",
                    "src/integrations/react/**/*",
                    "**/private/**/*",
                    "**/node_modules/**/*",
                    "**/*.test.ts",
                    "**/*.spec.ts",
                ],
            }),
        ],
        external: [
            ...Object.keys(pkg.dependencies || {}),
            ...Object.keys(pkg.peerDependencies || {}),
            // Add Node.js built-ins
            "crypto",
            "fs",
            "path",
            "os",
            "http",
            "https",
            "events",
            "stream",
            "buffer",
            "util",
        ],
    },
    // CommonJS build - Modular output
    {
        input: "src/index.ts",
        output: {
            dir: "dist/cjs",
            format: "cjs",
            sourcemap: true,
            exports: "auto",
            esModule: false,
            preserveModules: true, // Keep modular structure
            preserveModulesRoot: "src", // Preserve src structure
        },
        plugins: [
            resolve({
                preferBuiltins: true, // Prefer Node.js built-ins
            }),
            commonjs(),
            json(),
            typescript({
                tsconfig: "./tsconfig.json",
                declaration: false, // Prevent duplicate declarations
                declarationMap: false, // Disable declaration maps
                outDir: undefined, // Let Rollup handle output directory
                exclude: [
                    "/private/**",
                    "**/private/*",
                    "src/integrations/react/**/*",
                    "**/private/**/*",
                    "**/node_modules/**/*",
                    "**/*.test.ts",
                    "**/*.spec.ts",
                ],
            }),
        ],
        external: [
            ...Object.keys(pkg.dependencies || {}),
            ...Object.keys(pkg.peerDependencies || {}),
            // Add Node.js built-ins
            "crypto",
            "fs",
            "path",
            "os",
            "http",
            "https",
            "events",
            "stream",
            "buffer",
            "util",
        ],
    },
    // TypeScript declarations
    {
        input: "src/index.ts",
        output: {
            file: "dist/index.d.ts",
            format: "es",
        },
        plugins: [dts()],
        external: ["nehonix-uri-processor"],
    },
];
