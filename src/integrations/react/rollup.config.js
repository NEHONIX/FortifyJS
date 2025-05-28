import typescript from "@rollup/plugin-typescript";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import dts from "rollup-plugin-dts";
import { readFileSync } from "fs";

const pkg = JSON.parse(
    readFileSync(new URL("./package.json", import.meta.url), "utf8")
);

export default [
    // ESM build
    {
        input: "src/index.ts",
        output: {
            file: "dist/index.esm.js",
            format: "es",
            sourcemap: true,
            exports: "named",
        },
        plugins: [
            typescript({
                tsconfig: "./tsconfig.json",
                declaration: false,
                declarationMap: false,
            }),
            resolve({
                preferBuiltins: false,
                browser: true,
            }),
            commonjs(),
        ],
        external: [
            ...Object.keys(pkg.dependencies || {}),
            ...Object.keys(pkg.peerDependencies || {}),
        ],
    },
    // CommonJS build
    {
        input: "src/index.ts",
        output: {
            file: "dist/index.cjs",
            format: "cjs",
            sourcemap: true,
            exports: "auto",
        },
        plugins: [
            typescript({
                tsconfig: "./tsconfig.json",
                declaration: false,
                declarationMap: false,
            }),
            resolve({
                preferBuiltins: false,
                browser: true,
            }),
            commonjs(),
        ],
        external: [
            ...Object.keys(pkg.dependencies || {}),
            ...Object.keys(pkg.peerDependencies || {}),
        ],
    },
    // TypeScript declarations
    {
        input: "src/index.ts",
        output: {
            file: "dist/index.d.ts",
            format: "es",
        },
        plugins: [
            dts({
                exclude: [
                    "**/private/**/*",
                    "**/react/**/*",
                    "**/node_modules/**/*",
                    "**/*.test.ts",
                    "**/*.spec.ts",
                ],
            }),
        ],
        external: ["fortify2-js"],
    },
];
