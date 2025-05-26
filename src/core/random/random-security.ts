/**
 * Random security - Advanced security features and monitoring
 */

import crypto from "crypto";
import { SecurityLevel } from "../../types";
import {
    EntropyQuality,
    SecurityMonitoringResult,
    EntropyAnalysisResult,
    RandomGenerationOptions,
} from "./random-types";
import { RandomEntropy } from "./random-entropy";
import { RandomSources } from "./random-sources";

export class RandomSecurity {
    private static securityAlerts: string[] = [];
    private static lastSecurityCheck: number = Date.now();
    private static threatLevel: "low" | "medium" | "high" | "critical" = "low";

    /**
     * Perform comprehensive security assessment
     * @param data - Data to assess (optional)
     * @returns Security monitoring result
     */
    public static performSecurityAssessment(
        data?: Buffer
    ): SecurityMonitoringResult {
        const timestamp = Date.now();
        const libraryStatus = RandomSources.getLibraryStatus();

        // Analyze entropy if data provided
        let entropyQuality = EntropyQuality.GOOD;
        if (data) {
            entropyQuality = RandomEntropy.assessEntropyQuality(data);
        }

        // Assess threats
        const threats = RandomSecurity.assessThreats(
            libraryStatus,
            entropyQuality
        );

        // Generate recommendations
        const recommendations = RandomSecurity.generateRecommendations(
            threats,
            libraryStatus
        );

        // Determine security level
        const securityLevel = RandomSecurity.determineSecurityLevel(
            threats,
            entropyQuality
        );

        RandomSecurity.lastSecurityCheck = timestamp;

        return {
            entropyQuality,
            securityLevel,
            threats,
            recommendations,
            timestamp,
            bytesGenerated: 0, // This would be filled by the calling class
            reseedCount: 0, // This would be filled by the calling class
            libraryStatus,
        };
    }

    /**
     * Assess current threats
     */
    private static assessThreats(
        libraryStatus: any,
        entropyQuality: EntropyQuality
    ): string[] {
        const threats: string[] = [];

        // Entropy quality threats
        if (entropyQuality === EntropyQuality.POOR) {
            threats.push("Critical: Very low entropy quality detected");
            RandomSecurity.threatLevel = "critical";
        } else if (entropyQuality === EntropyQuality.FAIR) {
            threats.push("Warning: Low entropy quality");
            if (RandomSecurity.threatLevel === "low") {
                RandomSecurity.threatLevel = "medium";
            }
        }

        // Library availability threats
        const availableLibraries =
            Object.values(libraryStatus).filter(Boolean).length;
        if (availableLibraries === 0) {
            threats.push("Critical: No enhanced entropy libraries available");
            RandomSecurity.threatLevel = "critical";
        } else if (availableLibraries < 2) {
            threats.push("Warning: Limited entropy sources available");
            if (RandomSecurity.threatLevel === "low") {
                RandomSecurity.threatLevel = "medium";
            }
        }

        // Hardware entropy threats
        if (!RandomSecurity.isHardwareEntropyAvailable()) {
            threats.push("Warning: Hardware entropy not available");
        }

        // Timing-based threats
        if (RandomSecurity.detectTimingAttackRisk()) {
            threats.push("Medium: Potential timing attack vulnerability");
            if (RandomSecurity.threatLevel === "low") {
                RandomSecurity.threatLevel = "medium";
            }
        }

        return threats;
    }

    /**
     * Generate security recommendations
     */
    private static generateRecommendations(
        threats: string[],
        libraryStatus: any
    ): string[] {
        const recommendations: string[] = [];

        if (threats.some((t) => t.includes("entropy quality"))) {
            recommendations.push(
                "Enable quantum-safe mode for enhanced entropy"
            );
            recommendations.push(
                "Consider reseeding entropy pool more frequently"
            );
        }

        if (threats.some((t) => t.includes("entropy libraries"))) {
            recommendations.push(
                "Install additional entropy libraries (libsodium, secure-random)"
            );
        }

        if (threats.some((t) => t.includes("Hardware entropy"))) {
            recommendations.push("Use hardware security modules if available");
        }

        if (threats.some((t) => t.includes("timing attack"))) {
            recommendations.push("Enable timing-safe operations");
            recommendations.push("Use constant-time algorithms");
        }

        if (threats.length === 0) {
            recommendations.push(
                "Security posture is good - maintain current practices"
            );
        }

        return recommendations;
    }

    /**
     * Determine overall security level
     */
    private static determineSecurityLevel(
        threats: string[],
        entropyQuality: EntropyQuality
    ): SecurityLevel {
        if (threats.some((t) => t.includes("Critical"))) {
            return SecurityLevel.STANDARD;
        }

        if (threats.length > 2 || entropyQuality === EntropyQuality.POOR) {
            return SecurityLevel.HIGH;
        }

        if (threats.length > 0 || entropyQuality === EntropyQuality.FAIR) {
            return SecurityLevel.HIGH;
        }

        if (entropyQuality === EntropyQuality.MILITARY) {
            return SecurityLevel.MAXIMUM;
        }

        return SecurityLevel.HIGH;
    }

    /**
     * Check if hardware entropy is available
     */
    private static isHardwareEntropyAvailable(): boolean {
        try {
            // Check for Web Crypto API
            if (
                typeof crypto !== "undefined" &&
                typeof crypto.getRandomValues === "function"
            ) {
                return true;
            }

            // Check for browser crypto
            if (
                typeof window !== "undefined" &&
                window.crypto &&
                typeof window.crypto.getRandomValues === "function"
            ) {
                return true;
            }

            return false;
        } catch (error) {
            return false;
        }
    }

    /**
     * Detect potential timing attack risks
     */
    private static detectTimingAttackRisk(): boolean {
        // Simple heuristic: if we're in a high-frequency generation scenario
        const now = Date.now();
        const timeSinceLastCheck = now - RandomSecurity.lastSecurityCheck;

        // If security checks are happening very frequently, there might be timing risks
        return timeSinceLastCheck < 100; // Less than 100ms between checks
    }

    /**
     * Monitor for side-channel attacks
     * @param data - Data to monitor
     * @returns Monitoring result
     */
    public static monitorSideChannelAttacks(data: Buffer): {
        riskLevel: "low" | "medium" | "high";
        indicators: string[];
        recommendations: string[];
    } {
        const indicators: string[] = [];
        const recommendations: string[] = [];
        let riskLevel: "low" | "medium" | "high" = "low";

        // Check for patterns that might indicate side-channel attacks

        // 1. Frequency analysis
        const frequency = new Map<number, number>();
        for (const byte of data) {
            frequency.set(byte, (frequency.get(byte) || 0) + 1);
        }

        const maxFreq = Math.max(...frequency.values());
        const expectedFreq = data.length / 256;

        if (maxFreq > expectedFreq * 3) {
            indicators.push("Unusual byte frequency distribution detected");
            riskLevel = "medium";
            recommendations.push("Increase entropy mixing");
        }

        // 2. Timing patterns
        const currentTime = Date.now();
        if (
            RandomSecurity.lastSecurityCheck &&
            currentTime - RandomSecurity.lastSecurityCheck < 10
        ) {
            indicators.push("High-frequency access pattern detected");
            riskLevel = "high";
            recommendations.push("Implement rate limiting");
        }

        // 3. Data size patterns
        if (data.length % 16 === 0 && data.length < 64) {
            indicators.push("Suspicious data size pattern");
            recommendations.push("Use variable-length padding");
        }

        return { riskLevel, indicators, recommendations };
    }

    /**
     * Validate entropy source integrity
     * @param sourceName - Name of entropy source
     * @returns Validation result
     */
    public static validateEntropySourceIntegrity(sourceName: string): {
        valid: boolean;
        confidence: number;
        issues: string[];
    } {
        const issues: string[] = [];
        let confidence = 1.0;

        try {
            // Test the entropy source
            const testResult = RandomSources.testEntropySource(sourceName);

            if (!testResult) {
                issues.push(`Entropy source ${sourceName} failed basic test`);
                confidence = 0.0;
            }

            // Additional integrity checks could be added here
            // For example: statistical tests, known-answer tests, etc.
        } catch (error) {
            issues.push(`Error testing entropy source ${sourceName}: ${error}`);
            confidence = 0.0;
        }

        return {
            valid: issues.length === 0,
            confidence,
            issues,
        };
    }

    /**
     * Generate security report
     * @param includeDetails - Include detailed analysis
     * @returns Comprehensive security report
     */
    public static generateSecurityReport(includeDetails: boolean = false): {
        summary: string;
        threatLevel: string;
        recommendations: string[];
        details?: any;
    } {
        const assessment = RandomSecurity.performSecurityAssessment();

        let summary = "Security assessment completed. ";
        if (assessment.threats.length === 0) {
            summary += "No significant threats detected.";
        } else {
            summary += `${assessment.threats.length} potential issues identified.`;
        }

        const report = {
            summary,
            threatLevel: RandomSecurity.threatLevel,
            recommendations: assessment.recommendations,
        };

        if (includeDetails) {
            (report as any).details = {
                entropyQuality: assessment.entropyQuality,
                securityLevel: assessment.securityLevel,
                threats: assessment.threats,
                libraryStatus: assessment.libraryStatus,
                timestamp: assessment.timestamp,
            };
        }

        return report;
    }

    /**
     * Enable security monitoring
     */
    public static enableSecurityMonitoring(): void {
        // Set up periodic security checks
        setInterval(() => {
            const assessment = RandomSecurity.performSecurityAssessment();

            if (assessment.threats.length > 0) {
                console.warn("Security Alert:", assessment.threats);
                RandomSecurity.securityAlerts.push(...assessment.threats);
            }
        }, 60000); // Check every minute
    }

    /**
     * Get security alerts
     */
    public static getSecurityAlerts(): string[] {
        return [...RandomSecurity.securityAlerts];
    }

    /**
     * Clear security alerts
     */
    public static clearSecurityAlerts(): void {
        RandomSecurity.securityAlerts = [];
    }

    /**
     * Get current threat level
     */
    public static getThreatLevel(): "low" | "medium" | "high" | "critical" {
        return RandomSecurity.threatLevel;
    }

    /**
     * Perform quantum-readiness assessment
     * @returns Quantum readiness report
     */
    public static assessQuantumReadiness(): {
        ready: boolean;
        score: number;
        recommendations: string[];
        algorithms: { name: string; quantumSafe: boolean }[];
    } {
        const algorithms = [
            { name: "AES-256", quantumSafe: false },
            { name: "ChaCha20", quantumSafe: false },
            { name: "Kyber", quantumSafe: true },
            { name: "Dilithium", quantumSafe: true },
        ];

        const quantumSafeCount = algorithms.filter((a) => a.quantumSafe).length;
        const score = (quantumSafeCount / algorithms.length) * 100;
        const ready = score >= 50;

        const recommendations: string[] = [];
        if (!ready) {
            recommendations.push(
                "Implement post-quantum cryptographic algorithms"
            );
            recommendations.push("Enable quantum-safe random generation");
            recommendations.push("Plan migration to quantum-resistant systems");
        }

        return {
            ready,
            score,
            recommendations,
            algorithms,
        };
    }
}

