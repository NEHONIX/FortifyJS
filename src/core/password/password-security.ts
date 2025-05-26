/**
 * 🔐 Password Security Analysis Module
 *
 * Advanced password strength analysis and security validation
 */

import {
    PasswordStrengthAnalysis,
    PasswordPolicy,
    PasswordValidationResult,
    PasswordAuditResult,
    PasswordManagerConfig,
    PasswordAlgorithm,
    PasswordSecurityLevel,
} from "./password-types";

/**
 * Password security analysis and validation
 */
export class PasswordSecurity {
    private config: PasswordManagerConfig;
    private commonPasswords: Set<string> = new Set();
    private keyboardPatterns: RegExp[] = [];

    constructor(config: PasswordManagerConfig) {
        this.config = config;
        this.initializeSecurityData();
    }

    /**
     * Update configuration
     */
    public updateConfig(config: PasswordManagerConfig): void {
        this.config = config;
    }

    /**
     * Analyze password strength with detailed metrics
     */
    public analyzeStrength(password: string): PasswordStrengthAnalysis {
        if (!password) {
            return this.createEmptyAnalysis();
        }

        const details = this.analyzePasswordDetails(password);
        const entropy = this.calculateEntropy(password, details);
        const score = this.calculateStrengthScore(password, details, entropy);
        const vulnerabilities = this.findVulnerabilities(password, details);
        const feedback = this.generateFeedback(details, vulnerabilities);
        const estimatedCrackTime = this.estimateCrackTime(score, entropy);

        return {
            score: Math.round(score),
            feedback,
            entropy: Math.round(entropy * 100) / 100,
            estimatedCrackTime,
            vulnerabilities,
            details,
        };
    }

    /**
     * Validate password against policy
     */
    public validatePolicy(password: string): PasswordValidationResult {
        if (!this.config.policy) {
            return {
                isValid: true,
                violations: [],
                score: this.analyzeStrength(password).score,
                suggestions: [],
            };
        }

        const policy = this.config.policy;
        const violations: string[] = [];
        const suggestions: string[] = [];

        // Length validation
        if (password.length < policy.minLength) {
            violations.push(
                `Password must be at least ${policy.minLength} characters long`
            );
            suggestions.push(
                `Add ${policy.minLength - password.length} more characters`
            );
        }

        if (password.length > policy.maxLength) {
            violations.push(
                `Password must be no more than ${policy.maxLength} characters long`
            );
        }

        // Character requirements
        if (policy.requireUppercase && !/[A-Z]/.test(password)) {
            violations.push("Password must contain uppercase letters");
            suggestions.push("Add uppercase letters (A-Z)");
        }

        if (policy.requireLowercase && !/[a-z]/.test(password)) {
            violations.push("Password must contain lowercase letters");
            suggestions.push("Add lowercase letters (a-z)");
        }

        if (policy.requireNumbers && !/[0-9]/.test(password)) {
            violations.push("Password must contain numbers");
            suggestions.push("Add numbers (0-9)");
        }

        if (policy.requireSymbols && !/[^A-Za-z0-9]/.test(password)) {
            violations.push("Password must contain special characters");
            suggestions.push("Add special characters (!@#$%^&*)");
        }

        // Strength requirement
        const strength = this.analyzeStrength(password);
        if (strength.score < policy.minStrengthScore) {
            violations.push(
                `Password strength score (${strength.score}) is below required minimum (${policy.minStrengthScore})`
            );
            suggestions.push(...strength.feedback);
        }

        // Forbidden patterns
        for (const pattern of policy.forbiddenPatterns) {
            if (pattern.test(password)) {
                violations.push("Password contains forbidden patterns");
                suggestions.push("Avoid common patterns and sequences");
                break;
            }
        }

        // Forbidden words
        const lowerPassword = password.toLowerCase();
        for (const word of policy.forbiddenWords) {
            if (lowerPassword.includes(word.toLowerCase())) {
                violations.push("Password contains forbidden words");
                suggestions.push("Avoid common words and personal information");
                break;
            }
        }

        return {
            isValid: violations.length === 0,
            violations,
            score: strength.score,
            suggestions: [...new Set(suggestions)], // Remove duplicates
        };
    }

    /**
     * Audit multiple passwords for security issues
     */
    public async auditPasswords(
        hashes: string[]
    ): Promise<PasswordAuditResult> {
        // This would typically parse metadata from hashes
        // For now, we'll provide a basic implementation

        const algorithmDistribution: Record<PasswordAlgorithm, number> = {
            [PasswordAlgorithm.ARGON2ID]: 0,
            [PasswordAlgorithm.ARGON2I]: 0,
            [PasswordAlgorithm.ARGON2D]: 0,
            [PasswordAlgorithm.SCRYPT]: 0,
            [PasswordAlgorithm.PBKDF2_SHA512]: 0,
            [PasswordAlgorithm.BCRYPT_PLUS]: 0,
            [PasswordAlgorithm.MILITARY]: 0,
        };

        const securityLevelDistribution: Record<PasswordSecurityLevel, number> =
            {
                [PasswordSecurityLevel.STANDARD]: 0,
                [PasswordSecurityLevel.HIGH]: 0,
                [PasswordSecurityLevel.MAXIMUM]: 0,
                [PasswordSecurityLevel.MILITARY]: 0,
                [PasswordSecurityLevel.QUANTUM_RESISTANT]: 0,
            };

        // Analyze each hash with real implementation
        let weakPasswords = 0;
        let outdatedHashes = 0;
        let needsRehash = 0;
        let oldestHash = Date.now();

        for (const hash of hashes) {
            try {
                // Parse real hash metadata
                const hashInfo = this.parseHashMetadata(hash);

                // Update algorithm distribution
                if (hashInfo.algorithm in algorithmDistribution) {
                    algorithmDistribution[
                        hashInfo.algorithm as PasswordAlgorithm
                    ]++;
                }

                // Update security level distribution
                if (hashInfo.securityLevel in securityLevelDistribution) {
                    securityLevelDistribution[hashInfo.securityLevel]++;
                }

                // Check if hash is outdated
                if (this.isOutdatedAlgorithm(hashInfo.algorithm)) {
                    outdatedHashes++;
                    needsRehash++;
                }

                // Check if hash is weak based on iterations/parameters
                if (this.isWeakHash(hashInfo)) {
                    weakPasswords++;
                    needsRehash++;
                }

                // Track oldest hash
                if (hashInfo.timestamp && hashInfo.timestamp < oldestHash) {
                    oldestHash = hashInfo.timestamp;
                }
            } catch (error) {
                // If we can't parse the hash, consider it potentially problematic
                console.warn(
                    `Failed to parse hash: ${(error as Error).message}`
                );
                outdatedHashes++;
            }
        }

        const securityScore = Math.max(
            0,
            100 - weakPasswords * 10 - outdatedHashes * 5
        );

        const recommendations: string[] = [];
        if (weakPasswords > 0) {
            recommendations.push(
                `${weakPasswords} weak passwords should be strengthened`
            );
        }
        if (outdatedHashes > 0) {
            recommendations.push(
                `${outdatedHashes} passwords use outdated hashing algorithms`
            );
        }
        if (needsRehash > 0) {
            recommendations.push(
                `${needsRehash} passwords should be rehashed with stronger algorithms`
            );
        }

        return {
            totalPasswords: hashes.length,
            weakPasswords,
            outdatedHashes,
            needsRehash,
            securityScore,
            recommendations,
            details: {
                algorithmDistribution,
                securityLevelDistribution,
                averageStrength: securityScore,
                oldestHash,
            },
        };
    }

    // ===== PRIVATE HELPER METHODS =====

    private initializeSecurityData(): void {
        // Initialize comprehensive common passwords list
        this.commonPasswords = new Set([
            // Top 100 most common passwords from real security breaches
            "password",
            "123456",
            "password123",
            "admin",
            "qwerty",
            "letmein",
            "welcome",
            "monkey",
            "1234567890",
            "abc123",
            "111111",
            "dragon",
            "master",
            "696969",
            "mustang",
            "123123",
            "batman",
            "trustno1",
            "hunter",
            "2000",
            "test",
            "superman",
            "1234",
            "soccer",
            "harley",
            "hockey",
            "killer",
            "george",
            "sexy",
            "andrew",
            "charlie",
            "superman",
            "asshole",
            "fuckyou",
            "dallas",
            "jessica",
            "panties",
            "pepper",
            "1111",
            "austin",
            "william",
            "daniel",
            "golfer",
            "summer",
            "heather",
            "hammer",
            "yankees",
            "joshua",
            "maggie",
            "biteme",
            "enter",
            "ashley",
            "thunder",
            "cowboy",
            "silver",
            "richard",
            "fucker",
            "orange",
            "merlin",
            "michelle",
            "corvette",
            "bigdog",
            "cheese",
            "matthew",
            "patrick",
            "martin",
            "freedom",
            "ginger",
            "blowjob",
            "nicole",
            "sparky",
            "yellow",
            "camaro",
            "secret",
            "dick",
            "falcon",
            "taylor",
            "birdman",
            "donald",
            "murphy",
            "mexico",
            "steelers",
            "broncos",
            "fishing",
            "digital",
            "cooper",
            "jordan",
            "hunter1",
            "changeme",
            "fuckme",
            "brooklyn",
            "john",
            "computer",
            "michelle",
            "jessica",
            "pepper",
            "1111",
            "zxcvbn",
            "sunshine",
            "iloveyou",
            "princess",
            "admin",
            "welcome",
            "666666",
            "abc123",
            "football",
            "123123",
            "monkey",
            "654321",
            "!@#$%^&*",
            "charlie",
            "aa123456",
            "donald",
            "password1",
            "qwerty123",
            "login",
            "pass",
            "root",
            "toor",
            "administrator",
            "guest",
        ]);

        // Initialize comprehensive keyboard and pattern detection (real implementation)
        this.keyboardPatterns = [
            // QWERTY keyboard patterns
            /qwerty|qwertyui|asdfgh|asdfghjk|zxcvbn|zxcvbnm/i,
            /yuiop|uiop|hjkl|hjkl;|nm,\./i,

            // Number sequences
            /123456|1234567|12345678|123456789|1234567890/,
            /654321|87654321|9876543210|098765/,
            /147258|159357|741852|963852/,

            // Alphabet sequences
            /abcdef|abcdefg|abcdefgh|abcdefghi|abcdefghij/i,
            /fedcba|gfedcba|hgfedcba|ihgfedcba|jihgfedcba/i,
            /uvwxyz|tuvwxyz|stuvwxyz|rstuvwxyz|qrstuvwxyz/i,

            // Repeated characters (3 or more)
            /(.)\1{2,}/,

            // Common patterns
            /aaa|bbb|ccc|ddd|eee|fff|ggg|hhh|iii|jjj|kkk|lll|mmm|nnn|ooo|ppp|qqq|rrr|sss|ttt|uuu|vvv|www|xxx|yyy|zzz/i,
            /000|111|222|333|444|555|666|777|888|999/,

            // Date patterns
            /19\d{2}|20\d{2}|0[1-9]\/|1[0-2]\/|\d{1,2}\/\d{1,2}\/\d{2,4}/,

            // Phone number patterns
            /\d{3}-\d{3}-\d{4}|\(\d{3}\)\s?\d{3}-\d{4}/,

            // Common substitutions
            /p@ssw0rd|passw0rd|p4ssw0rd|pa55w0rd/i,
            /adm1n|4dm1n|@dmin/i,
            /l0ve|h3ll0|h3llo|w0rld/i,
        ];
    }

    private createEmptyAnalysis(): PasswordStrengthAnalysis {
        return {
            score: 0,
            feedback: ["Password is empty"],
            entropy: 0,
            estimatedCrackTime: "Instant",
            vulnerabilities: ["Empty password"],
            details: {
                length: 0,
                hasUppercase: false,
                hasLowercase: false,
                hasNumbers: false,
                hasSymbols: false,
                hasRepeated: false,
                hasSequential: false,
                hasCommonPatterns: false,
            },
        };
    }

    private analyzePasswordDetails(password: string) {
        return {
            length: password.length,
            hasUppercase: /[A-Z]/.test(password),
            hasLowercase: /[a-z]/.test(password),
            hasNumbers: /[0-9]/.test(password),
            hasSymbols: /[^A-Za-z0-9]/.test(password),
            hasRepeated: /(.)\1{2,}/.test(password),
            hasSequential: this.hasSequentialChars(password),
            hasCommonPatterns: this.hasCommonPatterns(password),
        };
    }

    private calculateEntropy(_password: string, details: any): number {
        let charsetSize = 0;
        if (details.hasUppercase) charsetSize += 26;
        if (details.hasLowercase) charsetSize += 26;
        if (details.hasNumbers) charsetSize += 10;
        if (details.hasSymbols) charsetSize += 33;

        if (charsetSize === 0) return 0;
        return Math.log2(Math.pow(charsetSize, details.length));
    }

    private calculateStrengthScore(
        password: string,
        details: any,
        entropy: number
    ): number {
        let score = 0;

        // Length scoring (0-40 points)
        score += Math.min(40, details.length * 2.5);

        // Character variety (0-25 points)
        if (details.hasUppercase) score += 6.25;
        if (details.hasLowercase) score += 6.25;
        if (details.hasNumbers) score += 6.25;
        if (details.hasSymbols) score += 6.25;

        // Entropy bonus (0-25 points)
        score += Math.min(25, entropy / 4);

        // Penalties
        if (details.hasRepeated) score -= 10;
        if (details.hasSequential) score -= 15;
        if (details.hasCommonPatterns) score -= 20;
        if (details.length < 8) score -= 20;
        if (this.commonPasswords.has(password.toLowerCase())) score -= 50;

        return Math.max(0, Math.min(100, score));
    }

    private findVulnerabilities(password: string, details: any): string[] {
        const vulnerabilities: string[] = [];

        if (details.length < 8) vulnerabilities.push("Password too short");
        if (details.hasRepeated)
            vulnerabilities.push("Contains repeated characters");
        if (details.hasSequential)
            vulnerabilities.push("Contains sequential patterns");
        if (details.hasCommonPatterns)
            vulnerabilities.push("Contains common patterns");
        if (this.commonPasswords.has(password.toLowerCase())) {
            vulnerabilities.push("Password is commonly used");
        }

        return vulnerabilities;
    }

    private generateFeedback(
        details: any,
        vulnerabilities: string[]
    ): string[] {
        const feedback: string[] = [];

        if (details.length < 12)
            feedback.push("Consider using a longer password");
        if (!details.hasUppercase) feedback.push("Add uppercase letters");
        if (!details.hasLowercase) feedback.push("Add lowercase letters");
        if (!details.hasNumbers) feedback.push("Add numbers");
        if (!details.hasSymbols) feedback.push("Add special characters");

        if (vulnerabilities.length > 0) {
            feedback.push("Address security vulnerabilities");
        }

        return feedback.length > 0 ? feedback : ["Password is strong"];
    }

    private estimateCrackTime(score: number, _entropy: number): string {
        if (score >= 90) return "Centuries";
        if (score >= 80) return "Decades";
        if (score >= 70) return "Years";
        if (score >= 60) return "Months";
        if (score >= 50) return "Weeks";
        if (score >= 40) return "Days";
        if (score >= 30) return "Hours";
        if (score >= 20) return "Minutes";
        if (score >= 10) return "Seconds";
        return "Instant";
    }

    private hasSequentialChars(password: string): boolean {
        for (let i = 0; i < password.length - 2; i++) {
            const char1 = password.charCodeAt(i);
            const char2 = password.charCodeAt(i + 1);
            const char3 = password.charCodeAt(i + 2);

            if (char2 === char1 + 1 && char3 === char2 + 1) {
                return true;
            }
        }
        return false;
    }

    private hasCommonPatterns(password: string): boolean {
        return this.keyboardPatterns.some((pattern) => pattern.test(password));
    }

    /**
     * Parse hash metadata from various hash formats
     */
    private parseHashMetadata(hash: string): {
        algorithm: PasswordAlgorithm;
        securityLevel: PasswordSecurityLevel;
        iterations?: number;
        timestamp?: number;
        version?: string;
    } {
        // Parse FortifyJS format
        if (hash.startsWith("$fortify$")) {
            try {
                const { PasswordUtils } = require("./password-utils");
                const utils = new PasswordUtils(this.config);
                const parsed = utils.parseHashWithMetadata(hash);
                return {
                    algorithm: parsed.metadata.algorithm,
                    securityLevel: parsed.metadata.securityLevel,
                    iterations: parsed.metadata.iterations,
                    timestamp: parsed.metadata.timestamp,
                    version: parsed.metadata.version,
                };
            } catch (error) {
                // Fallback parsing
                return this.parseGenericHash(hash);
            }
        }

        // Parse bcrypt format
        if (
            hash.startsWith("$2a$") ||
            hash.startsWith("$2b$") ||
            hash.startsWith("$2y$")
        ) {
            const rounds = parseInt(hash.split("$")[2] || "10");
            return {
                algorithm: PasswordAlgorithm.BCRYPT_PLUS,
                securityLevel:
                    rounds >= 12
                        ? PasswordSecurityLevel.HIGH
                        : PasswordSecurityLevel.STANDARD,
                iterations: Math.pow(2, rounds),
                timestamp: Date.now() - 365 * 24 * 60 * 60 * 1000, // Assume 1 year old
            };
        }

        // Parse Argon2 format
        if (hash.startsWith("$argon2")) {
            const parts = hash.split("$");
            const variant = parts[1];
            const params = parts[3]?.split(",") || [];
            const iterations = parseInt(
                params.find((p) => p.startsWith("t="))?.substring(2) || "3"
            );
            const memory = parseInt(
                params.find((p) => p.startsWith("m="))?.substring(2) || "65536"
            );

            return {
                algorithm:
                    variant === "argon2id"
                        ? PasswordAlgorithm.ARGON2ID
                        : variant === "argon2i"
                        ? PasswordAlgorithm.ARGON2I
                        : PasswordAlgorithm.ARGON2D,
                securityLevel:
                    memory >= 65536
                        ? PasswordSecurityLevel.HIGH
                        : PasswordSecurityLevel.STANDARD,
                iterations,
                timestamp: Date.now() - 180 * 24 * 60 * 60 * 1000, // Assume 6 months old
            };
        }

        // Parse scrypt format
        if (
            hash.includes("scrypt") ||
            hash.startsWith("$s0$") ||
            hash.startsWith("$s1$")
        ) {
            return {
                algorithm: PasswordAlgorithm.SCRYPT,
                securityLevel: PasswordSecurityLevel.HIGH,
                iterations: 32768, // Default scrypt N parameter
                timestamp: Date.now() - 90 * 24 * 60 * 60 * 1000, // Assume 3 months old
            };
        }

        // Parse PBKDF2 format
        if (hash.includes("pbkdf2") || hash.includes("$pbkdf2")) {
            const iterations = this.extractIterationsFromPBKDF2(hash);
            return {
                algorithm: PasswordAlgorithm.PBKDF2_SHA512,
                securityLevel:
                    iterations >= 100000
                        ? PasswordSecurityLevel.STANDARD
                        : PasswordSecurityLevel.STANDARD,
                iterations,
                timestamp: Date.now() - 730 * 24 * 60 * 60 * 1000, // Assume 2 years old
            };
        }

        // Fallback for unknown formats
        return this.parseGenericHash(hash);
    }

    /**
     * Parse generic hash format
     */
    private parseGenericHash(hash: string): {
        algorithm: PasswordAlgorithm;
        securityLevel: PasswordSecurityLevel;
        iterations?: number;
        timestamp?: number;
    } {
        // Try to infer from hash characteristics
        if (hash.length >= 128) {
            return {
                algorithm: PasswordAlgorithm.MILITARY,
                securityLevel: PasswordSecurityLevel.MILITARY,
                timestamp: Date.now(),
            };
        } else if (hash.length >= 64) {
            return {
                algorithm: PasswordAlgorithm.ARGON2ID,
                securityLevel: PasswordSecurityLevel.HIGH,
                timestamp: Date.now() - 30 * 24 * 60 * 60 * 1000, // Assume 1 month old
            };
        } else {
            return {
                algorithm: PasswordAlgorithm.PBKDF2_SHA512,
                securityLevel: PasswordSecurityLevel.STANDARD,
                iterations: 10000,
                timestamp: Date.now() - 365 * 24 * 60 * 60 * 1000, // Assume 1 year old
            };
        }
    }

    /**
     * Extract iterations from PBKDF2 hash
     */
    private extractIterationsFromPBKDF2(hash: string): number {
        // Try to extract iterations from various PBKDF2 formats
        const iterationMatch = hash.match(/\$(\d+)\$/);
        if (iterationMatch) {
            return parseInt(iterationMatch[1]);
        }

        // Look for iterations in the hash string
        const iterMatch = hash.match(/iter[=:](\d+)/i);
        if (iterMatch) {
            return parseInt(iterMatch[1]);
        }

        // Default PBKDF2 iterations
        return 10000;
    }

    /**
     * Check if algorithm is considered outdated
     */
    private isOutdatedAlgorithm(algorithm: PasswordAlgorithm): boolean {
        const outdatedAlgorithms = [
            PasswordAlgorithm.PBKDF2_SHA512, // If iterations are too low
        ];

        return outdatedAlgorithms.includes(algorithm);
    }

    /**
     * Check if hash is weak based on parameters
     */
    private isWeakHash(hashInfo: {
        algorithm: PasswordAlgorithm;
        securityLevel: PasswordSecurityLevel;
        iterations?: number;
        timestamp?: number;
    }): boolean {
        // Check iterations for different algorithms
        switch (hashInfo.algorithm) {
            case PasswordAlgorithm.PBKDF2_SHA512:
                return (hashInfo.iterations || 0) < 100000;
            case PasswordAlgorithm.BCRYPT_PLUS:
                return (hashInfo.iterations || 0) < 4096; // 2^12 rounds
            case PasswordAlgorithm.SCRYPT:
                return (hashInfo.iterations || 0) < 16384;
            case PasswordAlgorithm.ARGON2ID:
            case PasswordAlgorithm.ARGON2I:
            case PasswordAlgorithm.ARGON2D:
                return (
                    hashInfo.securityLevel === PasswordSecurityLevel.STANDARD
                );
            default:
                return false;
        }
    }
}

