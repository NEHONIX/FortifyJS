/**
 * FortifyJS - Optimized CPU Worker Thread
 * Handles real-world CPU-intensive computational tasks
 */

const { parentPort, workerData } = require("worker_threads");
const crypto = require("crypto");
const zlib = require("zlib");
const { promisify } = require("util");

// Import helpers
const {
    quickSort,
    mergeSort,
    heapSort,
    binarySearch,
    applyTransform,
    applyFilter,
    applyReduce,
    aggregateData,
    validateAgainstSchema,
    factorial,
    fibonacci,
    isPrime,
    gcd,
    lcm,
    matrixMultiply,
    parseCSV,
    parseXML,
    findMedian,
    findMode,
    calculateVariance,
    getTypeDistribution,
    findDuplicates,
    textAnalysis,
} = require("../helpers/helpers");

// Promisify compression functions
const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);
const deflate = promisify(zlib.deflate);
const inflate = promisify(zlib.inflate);

// Worker configuration
const WORKER_ID = process.pid;
const MAX_ARRAY_SIZE = 1000000; // 1M elements max for sorting/processing

// Initialize worker
console.log(`CPU Worker ${WORKER_ID} initialized`);

// Task handlers map for optimal performance
const taskHandlers = {
    hash: processHashTask,
    encrypt: processEncryptTask,
    decrypt: processDecryptTask,
    compress: processCompressTask,
    decompress: processDecompressTask,
    sort: processSortTask,
    search: processSearchTask,
    transform: processTransformTask,
    validate: processValidateTask,
    compute: processComputeTask,
    parse: processParseTask,
    analyze: processAnalyzeTask,
};

// Main message handler
parentPort.on("message", async (message) => {
    const startTime = process.hrtime.bigint();

    try {
        const { task } = message;
        const handler = taskHandlers[task.type];

        if (!handler) {
            throw new Error(`Unknown task type: ${task.type}`);
        }

        const result = await handler(task);
        const executionTime =
            Number(process.hrtime.bigint() - startTime) / 1000000; // Convert to ms

        parentPort.postMessage({
            taskId: task.id,
            result,
            executionTime,
            workerId: WORKER_ID,
            success: true,
        });
    } catch (error) {
        const executionTime =
            Number(process.hrtime.bigint() - startTime) / 1000000;

        parentPort.postMessage({
            taskId: message.task?.id || "unknown",
            error: {
                message: error.message,
                stack: error.stack,
                name: error.name,
            },
            executionTime,
            workerId: WORKER_ID,
            success: false,
        });
    }
});

/**
 * Generate cryptographic hashes
 */
async function processHashTask(task) {
    const { data, algorithm = "sha256", encoding = "hex" } = task.data;

    if (!data) {
        throw new Error("Data is required for hash operation");
    }

    const hash = crypto.createHash(algorithm);
    hash.update(typeof data === "string" ? data : JSON.stringify(data));
    const result = hash.digest(encoding);

    return {
        type: "hash",
        algorithm,
        encoding,
        hash: result,
        inputSize: Buffer.byteLength(
            typeof data === "string" ? data : JSON.stringify(data)
        ),
        timestamp: Date.now(),
    };
}

/**
 * Encrypt data using AES
 */
async function processEncryptTask(task) {
    const { data, key, algorithm = "aes-256-gcm" } = task.data;

    if (!data || !key) {
        throw new Error("Data and key are required for encryption");
    }

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(algorithm, key);

    let encrypted = cipher.update(
        typeof data === "string" ? data : JSON.stringify(data),
        "utf8",
        "hex"
    );
    encrypted += cipher.final("hex");

    return {
        type: "encrypt",
        algorithm,
        encrypted,
        iv: iv.toString("hex"),
        timestamp: Date.now(),
    };
}

/**
 * Decrypt data using AES
 */
async function processDecryptTask(task) {
    const { encrypted, key, algorithm = "aes-256-gcm" } = task.data;

    if (!encrypted || !key) {
        throw new Error("Encrypted data and key are required for decryption");
    }

    const decipher = crypto.createDecipher(algorithm, key);

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return {
        type: "decrypt",
        algorithm,
        decrypted,
        timestamp: Date.now(),
    };
}

/**
 * Compress data using various algorithms
 */
async function processCompressTask(task) {
    const { data, algorithm = "gzip", level = 6 } = task.data;

    if (!data) {
        throw new Error("Data is required for compression");
    }

    const input = Buffer.from(
        typeof data === "string" ? data : JSON.stringify(data)
    );
    let compressed;

    switch (algorithm) {
        case "gzip":
            compressed = await gzip(input, { level });
            break;
        case "deflate":
            compressed = await deflate(input, { level });
            break;
        default:
            throw new Error(`Unsupported compression algorithm: ${algorithm}`);
    }

    const compressionRatio = (1 - compressed.length / input.length) * 100;

    return {
        type: "compress",
        algorithm,
        originalSize: input.length,
        compressedSize: compressed.length,
        compressionRatio: Math.round(compressionRatio * 100) / 100,
        compressed: compressed.toString("base64"),
        timestamp: Date.now(),
    };
}

/**
 * Decompress data
 */
async function processDecompressTask(task) {
    const { compressed, algorithm = "gzip" } = task.data;

    if (!compressed) {
        throw new Error("Compressed data is required for decompression");
    }

    const input = Buffer.from(compressed, "base64");
    let decompressed;

    switch (algorithm) {
        case "gzip":
            decompressed = await gunzip(input);
            break;
        case "deflate":
            decompressed = await inflate(input);
            break;
        default:
            throw new Error(
                `Unsupported decompression algorithm: ${algorithm}`
            );
    }

    return {
        type: "decompress",
        algorithm,
        compressedSize: input.length,
        decompressedSize: decompressed.length,
        decompressed: decompressed.toString("utf8"),
        timestamp: Date.now(),
    };
}

/**
 * Sort large arrays with different algorithms
 */
async function processSortTask(task) {
    const { data, algorithm = "quicksort", order = "asc" } = task.data;

    if (!Array.isArray(data)) {
        throw new Error("Data must be an array for sorting");
    }

    if (data.length > MAX_ARRAY_SIZE) {
        throw new Error(
            `Array too large: ${data.length} (max: ${MAX_ARRAY_SIZE})`
        );
    }

    const startTime = process.hrtime.bigint();
    let sorted;

    switch (algorithm) {
        case "quicksort":
            sorted = quickSort([...data], order);
            break;
        case "mergesort":
            sorted = mergeSort([...data], order);
            break;
        case "heapsort":
            sorted = heapSort([...data], order);
            break;
        case "native":
        default:
            sorted = [...data].sort((a, b) => {
                if (order === "desc") return b - a;
                return a - b;
            });
            break;
    }

    const sortTime = Number(process.hrtime.bigint() - startTime) / 1000000;

    return {
        type: "sort",
        algorithm,
        order,
        originalLength: data.length,
        sorted,
        sortTime,
        timestamp: Date.now(),
    };
}

/**
 * Search in large datasets
 */
async function processSearchTask(task) {
    const {
        data,
        query,
        algorithm = "binary",
        caseSensitive = false,
    } = task.data;

    if (!data || query === undefined) {
        throw new Error("Data and query are required for search");
    }

    let results = [];
    const startTime = process.hrtime.bigint();

    if (Array.isArray(data)) {
        switch (algorithm) {
            case "binary":
                const index = binarySearch(data, query);
                if (index !== -1) results = [{ index, value: data[index] }];
                break;
            case "linear":
            default:
                results = data
                    .map((item, index) => ({ item, index }))
                    .filter(({ item }) => {
                        const itemStr = String(item);
                        const queryStr = String(query);
                        return caseSensitive
                            ? itemStr.includes(queryStr)
                            : itemStr
                                  .toLowerCase()
                                  .includes(queryStr.toLowerCase());
                    });
                break;
        }
    } else if (typeof data === "string") {
        const searchStr = caseSensitive ? data : data.toLowerCase();
        const queryStr = caseSensitive
            ? String(query)
            : String(query).toLowerCase();
        let index = searchStr.indexOf(queryStr);

        while (index !== -1) {
            results.push({
                index,
                match: data.substring(index, index + queryStr.length),
            });
            index = searchStr.indexOf(queryStr, index + 1);
        }
    }

    const searchTime = Number(process.hrtime.bigint() - startTime) / 1000000;

    return {
        type: "search",
        algorithm,
        query,
        resultsCount: results.length,
        results: results.slice(0, 100), // Limit results to prevent memory issues
        searchTime,
        timestamp: Date.now(),
    };
}

/**
 * Transform data using various operations
 */
async function processTransformTask(task) {
    const { data, operation, params = {} } = task.data;

    if (!data) {
        throw new Error("Data is required for transformation");
    }

    let result;

    switch (operation) {
        case "map":
            if (!Array.isArray(data))
                throw new Error("Map operation requires array data");
            result = data.map((item) => applyTransform(item, params.transform));
            break;
        case "filter":
            if (!Array.isArray(data))
                throw new Error("Filter operation requires array data");
            result = data.filter((item) => applyFilter(item, params.condition));
            break;
        case "reduce":
            if (!Array.isArray(data))
                throw new Error("Reduce operation requires array data");
            result = data.reduce(
                (acc, item) => applyReduce(acc, item, params.reducer),
                params.initial || 0
            );
            break;
        case "aggregate":
            result = aggregateData(data, params);
            break;
        default:
            throw new Error(`Unknown transform operation: ${operation}`);
    }

    return {
        type: "transform",
        operation,
        originalSize: Array.isArray(data) ? data.length : 1,
        resultSize: Array.isArray(result) ? result.length : 1,
        result,
        timestamp: Date.now(),
    };
}

/**
 * Validate complex data structures
 */
async function processValidateTask(task) {
    const { data, schema, strict = false } = task.data;

    if (!data || !schema) {
        throw new Error("Data and schema are required for validation");
    }

    const errors = [];
    const warnings = [];

    const isValid = validateAgainstSchema(
        data,
        schema,
        errors,
        warnings,
        strict
    );

    return {
        type: "validate",
        isValid,
        errors,
        warnings,
        strict,
        timestamp: Date.now(),
    };
}

/**
 * Perform mathematical computations
 */
async function processComputeTask(task) {
    const { operation, operands, precision = 10 } = task.data;

    if (!operation || !operands) {
        throw new Error("Operation and operands are required for computation");
    }

    let result;

    switch (operation) {
        case "factorial":
            result = factorial(operands[0]);
            break;
        case "fibonacci":
            result = fibonacci(operands[0]);
            break;
        case "prime":
            result = isPrime(operands[0]);
            break;
        case "gcd":
            result = gcd(operands[0], operands[1]);
            break;
        case "lcm":
            result = lcm(operands[0], operands[1]);
            break;
        case "matrix_multiply":
            result = matrixMultiply(operands[0], operands[1]);
            break;
        default:
            throw new Error(`Unknown computation operation: ${operation}`);
    }

    return {
        type: "compute",
        operation,
        operands,
        result,
        timestamp: Date.now(),
    };
}

/**
 * Parse various data formats
 */
async function processParseTask(task) {
    const { data, format, options = {} } = task.data;

    if (!data) {
        throw new Error("Data is required for parsing");
    }

    let parsed;
    let metadata = {};

    switch (format) {
        case "json":
            parsed = JSON.parse(data);
            metadata.size = Buffer.byteLength(data);
            break;
        case "csv":
            parsed = parseCSV(data, options);
            metadata.rows = parsed.length;
            metadata.columns = parsed[0] ? Object.keys(parsed[0]).length : 0;
            break;
        case "xml":
            parsed = parseXML(data);
            break;
        case "url":
            parsed = new URL(data);
            break;
        default:
            throw new Error(`Unsupported parse format: ${format}`);
    }

    return {
        type: "parse",
        format,
        parsed,
        metadata,
        timestamp: Date.now(),
    };
}

/**
 * Analyze data patterns and statistics
 */
async function processAnalyzeTask(task) {
    const { data, analysisType = "basic" } = task.data;

    if (!data) {
        throw new Error("Data is required for analysis");
    }

    let analysis = {};

    if (Array.isArray(data) && data.every((x) => typeof x === "number")) {
        // Numerical analysis
        analysis = {
            count: data.length,
            sum: data.reduce((a, b) => a + b, 0),
            mean: data.reduce((a, b) => a + b, 0) / data.length,
            median: findMedian([...data].sort((a, b) => a - b)),
            mode: findMode(data),
            min: Math.min(...data),
            max: Math.max(...data),
            variance: calculateVariance(data),
            standardDeviation: Math.sqrt(calculateVariance(data)),
        };
    } else if (Array.isArray(data)) {
        // General array analysis
        analysis = {
            count: data.length,
            uniqueCount: new Set(data).size,
            types: getTypeDistribution(data),
            duplicates: findDuplicates(data),
        };
    } else if (typeof data === "string") {
        // Text analysis
        analysis = textAnalysis(data);
    }

    return {
        type: "analyze",
        analysisType,
        analysis,
        timestamp: Date.now(),
    };
}

// Graceful shutdown handlers
const shutdown = (signal) => {
    console.log(
        `CPU Worker ${WORKER_ID} received ${signal}, shutting down gracefully`
    );
    process.exit(0);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
    console.error(`CPU Worker ${WORKER_ID} uncaught exception:`, error);
    process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
    console.error(
        `CPU Worker ${WORKER_ID} unhandled rejection at:`,
        promise,
        "reason:",
        reason
    );
    process.exit(1);
});

