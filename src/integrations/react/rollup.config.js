/**
 * Rollup Configuration for @fortifyjs/react
 * Builds the React integration package
 */

import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";
import dts from "rollup-plugin-dts";

const isProduction = process.env.NODE_ENV === "production";

// External dependencies that should not be bundled
const external = [
    "react",
    "react-dom",
    "fortify2-js",
    // Also treat relative imports to main package as external
    /^\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/security/,
    /^\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/types/,
    /^\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/utils/,
];

// Base configuration
const baseConfig = {
    input: "src/index.ts",
    external,
    plugins: [
        resolve({
            browser: true,
            preferBuiltins: false,
        }),
        commonjs(),
        typescript({
            tsconfig: "./tsconfig.json",
            declaration: false, // We'll generate declarations separately
            declarationMap: false,
        }),
    ],
};

// ESM build
const esmConfig = {
    ...baseConfig,
    output: {
        file: "dist/index.esm.js",
        format: "es",
        sourcemap: true,
    },
    plugins: [
        ...baseConfig.plugins,
        isProduction &&
            terser({
                compress: {
                    drop_console: true,
                    drop_debugger: true,
                },
                mangle: {
                    reserved: [
                        "useSecureState",
                        "useSecureObject",
                        "SecureProvider",
                    ],
                },
            }),
    ].filter(Boolean),
};

// CommonJS build
const cjsConfig = {
    ...baseConfig,
    output: {
        file: "dist/index.cjs",
        format: "cjs",
        sourcemap: true,
        exports: "named",
    },
    plugins: [
        ...baseConfig.plugins,
        isProduction &&
            terser({
                compress: {
                    drop_console: true,
                    drop_debugger: true,
                },
                mangle: {
                    reserved: [
                        "useSecureState",
                        "useSecureObject",
                        "SecureProvider",
                    ],
                },
            }),
    ].filter(Boolean),
};

// TypeScript declarations
const dtsConfig = {
    input: "index.ts",
    external,
    output: {
        file: "dist/index.d.ts",
        format: "es",
    },
    plugins: [
        dts({
            tsconfig: "./tsconfig.json",
        }),
    ],
};

export default [esmConfig, cjsConfig, dtsConfig];

