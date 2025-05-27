/**
 * Advanced Entropy Analyzer Module
 * Provides sophisticated entropy analysis for SecureString
 */

import { HashEntropy } from "../../../core/hash/hash-entropy";

/**
 * Advanced entropy analysis results
 */
export interface EntropyAnalysisResult {
    shannonEntropy: number;
    minEntropy: number;
    maxEntropy: number;
    compressionRatio: number;
    patternComplexity: number;
    characterDistribution: Record<string, number>;
    bigramEntropy: number;
    trigramEntropy: number;
    predictability: number;
    randomnessScore: number;
    recommendations: string[];
}

/**
 * Pattern analysis results
 */
export interface PatternAnalysisResult {
    repeatingPatterns: Array<{ pattern: string; count: number; positions: number[] }>;
    sequentialPatterns: Array<{ pattern: string; type: 'ascending' | 'descending' }>;
    keyboardPatterns: Array<{ pattern: string; layout: string }>;
    dictionaryWords: Array<{ word: string; position: number; confidence: number }>;
    commonSubstitutions: Array<{ original: string; substituted: string }>;
    overallComplexity: number;
}

/**
 * Advanced entropy analyzer for strings
 */
export class EntropyAnalyzer {
    private static readonly KEYBOARD_PATTERNS = {
        qwerty: [
            'qwertyuiop', 'asdfghjkl', 'zxcvbnm',
            'qwerty', 'asdf', 'zxcv', '123456789', '1234567890'
        ],
        dvorak: [
            'pyfgcrl', 'aoeuidhtns', 'qjkxbmwvz'
        ]
    };

    private static readonly COMMON_WORDS = [
        'password', 'admin', 'user', 'login', 'secret', 'test', 'demo',
        'welcome', 'hello', 'world', 'company', 'system', 'access'
    ];

    /**
     * Performs comprehensive entropy analysis
     */
    static analyzeEntropy(content: string): EntropyAnalysisResult {
        const shannonEntropy = this.calculateShannonEntropy(content);
        const minEntropy = this.calculateMinEntropy(content);
        const maxEntropy = Math.log2(this.getUniqueCharacters(content).length);
        const compressionRatio = this.calculateCompressionRatio(content);
        const characterDistribution = this.getCharacterDistribution(content);
        const bigramEntropy = this.calculateNGramEntropy(content, 2);
        const trigramEntropy = this.calculateNGramEntropy(content, 3);
        const patternComplexity = this.calculatePatternComplexity(content);
        const predictability = this.calculatePredictability(content);
        const randomnessScore = this.calculateRandomnessScore(content);
        const recommendations = this.generateRecommendations(content, shannonEntropy, patternComplexity);

        return {
            shannonEntropy,
            minEntropy,
            maxEntropy,
            compressionRatio,
            patternComplexity,
            characterDistribution,
            bigramEntropy,
            trigramEntropy,
            predictability,
            randomnessScore,
            recommendations,
        };
    }

    /**
     * Analyzes patterns in the string
     */
    static analyzePatterns(content: string): PatternAnalysisResult {
        const repeatingPatterns = this.findRepeatingPatterns(content);
        const sequentialPatterns = this.findSequentialPatterns(content);
        const keyboardPatterns = this.findKeyboardPatterns(content);
        const dictionaryWords = this.findDictionaryWords(content);
        const commonSubstitutions = this.findCommonSubstitutions(content);
        const overallComplexity = this.calculateOverallComplexity(content);

        return {
            repeatingPatterns,
            sequentialPatterns,
            keyboardPatterns,
            dictionaryWords,
            commonSubstitutions,
            overallComplexity,
        };
    }

    /**
     * Calculates Shannon entropy
     */
    private static calculateShannonEntropy(content: string): number {
        const frequencies = this.getCharacterFrequencies(content);
        const length = content.length;
        
        let entropy = 0;
        for (const count of Object.values(frequencies)) {
            const probability = count / length;
            entropy -= probability * Math.log2(probability);
        }
        
        return entropy;
    }

    /**
     * Calculates min-entropy (worst-case entropy)
     */
    private static calculateMinEntropy(content: string): number {
        const frequencies = this.getCharacterFrequencies(content);
        const maxFrequency = Math.max(...Object.values(frequencies));
        const probability = maxFrequency / content.length;
        
        return -Math.log2(probability);
    }

    /**
     * Calculates n-gram entropy
     */
    private static calculateNGramEntropy(content: string, n: number): number {
        if (content.length < n) return 0;
        
        const ngrams: Record<string, number> = {};
        const totalNgrams = content.length - n + 1;
        
        for (let i = 0; i <= content.length - n; i++) {
            const ngram = content.substring(i, i + n);
            ngrams[ngram] = (ngrams[ngram] || 0) + 1;
        }
        
        let entropy = 0;
        for (const count of Object.values(ngrams)) {
            const probability = count / totalNgrams;
            entropy -= probability * Math.log2(probability);
        }
        
        return entropy;
    }

    /**
     * Calculates compression ratio as entropy indicator
     */
    private static calculateCompressionRatio(content: string): number {
        // Simulate compression by counting unique substrings
        const substrings = new Set<string>();
        
        for (let len = 1; len <= Math.min(content.length, 10); len++) {
            for (let i = 0; i <= content.length - len; i++) {
                substrings.add(content.substring(i, i + len));
            }
        }
        
        return substrings.size / content.length;
    }

    /**
     * Calculates pattern complexity
     */
    private static calculatePatternComplexity(content: string): number {
        let complexity = 0;
        
        // Character variety
        const uniqueChars = this.getUniqueCharacters(content);
        complexity += uniqueChars.length / content.length;
        
        // Case variation
        const hasUpper = /[A-Z]/.test(content);
        const hasLower = /[a-z]/.test(content);
        const hasDigits = /\d/.test(content);
        const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(content);
        
        complexity += (Number(hasUpper) + Number(hasLower) + Number(hasDigits) + Number(hasSpecial)) / 4;
        
        // Pattern disruption
        const patterns = this.findRepeatingPatterns(content);
        complexity -= patterns.length / content.length;
        
        return Math.max(0, Math.min(1, complexity));
    }

    /**
     * Calculates predictability score
     */
    private static calculatePredictability(content: string): number {
        let predictability = 0;
        
        // Sequential characters
        let sequential = 0;
        for (let i = 1; i < content.length; i++) {
            const diff = content.charCodeAt(i) - content.charCodeAt(i - 1);
            if (Math.abs(diff) === 1) sequential++;
        }
        predictability += sequential / (content.length - 1);
        
        // Repeated characters
        let repeated = 0;
        for (let i = 1; i < content.length; i++) {
            if (content[i] === content[i - 1]) repeated++;
        }
        predictability += repeated / (content.length - 1);
        
        return Math.min(1, predictability);
    }

    /**
     * Calculates overall randomness score
     */
    private static calculateRandomnessScore(content: string): number {
        const entropy = this.calculateShannonEntropy(content);
        const maxPossibleEntropy = Math.log2(256); // Assuming byte-level entropy
        const normalizedEntropy = entropy / maxPossibleEntropy;
        
        const complexity = this.calculatePatternComplexity(content);
        const predictability = this.calculatePredictability(content);
        
        return (normalizedEntropy + complexity + (1 - predictability)) / 3;
    }
 
    /**
     * Finds repeating patterns
     */
    private static findRepeatingPatterns(content: string): Array<{ pattern: string; count: number; positions: number[] }> {
        const patterns: Record<string, { count: number; positions: number[] }> = {};
        
        for (let len = 2; len <= Math.min(content.length / 2, 10); len++) {
            for (let i = 0; i <= content.length - len; i++) {
                const pattern = content.substring(i, i + len);
                if (!patterns[pattern]) {
                    patterns[pattern] = { count: 0, positions: [] };
                }
                patterns[pattern].count++;
                patterns[pattern].positions.push(i);
            }
        }
        
        return Object.entries(patterns)
            .filter(([, data]) => data.count > 1)
            .map(([pattern, data]) => ({ pattern, ...data }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
    }

    /**
     * Finds sequential patterns
     */
    private static findSequentialPatterns(content: string): Array<{ pattern: string; type: 'ascending' | 'descending' }> {
        const patterns: Array<{ pattern: string; type: 'ascending' | 'descending' }> = [];
        
        for (let len = 3; len <= Math.min(content.length, 8); len++) {
            for (let i = 0; i <= content.length - len; i++) {
                const substring = content.substring(i, i + len);
                if (this.isSequential(substring)) {
                    const type = this.getSequentialType(substring);
                    patterns.push({ pattern: substring, type });
                }
            }
        }
        
        return patterns;
    }

    /**
     * Finds keyboard patterns
     */
    private static findKeyboardPatterns(content: string): Array<{ pattern: string; layout: string }> {
        const patterns: Array<{ pattern: string; layout: string }> = [];
        
        for (const [layout, layoutPatterns] of Object.entries(this.KEYBOARD_PATTERNS)) {
            for (const keyPattern of layoutPatterns) {
                for (let len = 3; len <= keyPattern.length; len++) {
                    for (let i = 0; i <= keyPattern.length - len; i++) {
                        const pattern = keyPattern.substring(i, i + len);
                        if (content.toLowerCase().includes(pattern)) {
                            patterns.push({ pattern, layout });
                        }
                    }
                }
            }
        }
        
        return patterns;
    }

    /**
     * Finds dictionary words
     */
    private static findDictionaryWords(content: string): Array<{ word: string; position: number; confidence: number }> {
        const words: Array<{ word: string; position: number; confidence: number }> = [];
        const lowerContent = content.toLowerCase();
        
        for (const word of this.COMMON_WORDS) {
            let position = lowerContent.indexOf(word);
            while (position !== -1) {
                const confidence = word.length / content.length;
                words.push({ word, position, confidence });
                position = lowerContent.indexOf(word, position + 1);
            }
        }
        
        return words.sort((a, b) => b.confidence - a.confidence);
    }

    /**
     * Finds common substitutions (like @ for a, 3 for e)
     */
    private static findCommonSubstitutions(content: string): Array<{ original: string; substituted: string }> {
        const substitutions = [
            { original: 'a', substituted: '@' },
            { original: 'e', substituted: '3' },
            { original: 'i', substituted: '1' },
            { original: 'o', substituted: '0' },
            { original: 's', substituted: '$' },
            { original: 't', substituted: '7' },
        ];
        
        const found: Array<{ original: string; substituted: string }> = [];
        
        for (const sub of substitutions) {
            if (content.includes(sub.substituted)) {
                found.push(sub);
            }
        }
        
        return found;
    }

    /**
     * Helper methods
     */
    private static getCharacterFrequencies(content: string): Record<string, number> {
        const frequencies: Record<string, number> = {};
        for (const char of content) {
            frequencies[char] = (frequencies[char] || 0) + 1;
        }
        return frequencies;
    }

    private static getCharacterDistribution(content: string): Record<string, number> {
        const frequencies = this.getCharacterFrequencies(content);
        const distribution: Record<string, number> = {};
        
        for (const [char, count] of Object.entries(frequencies)) {
            distribution[char] = count / content.length;
        }
        
        return distribution;
    }

    private static getUniqueCharacters(content: string): string[] {
        return Array.from(new Set(content));
    }

    private static isSequential(str: string): boolean {
        if (str.length < 3) return false;
        
        const ascending = str.split('').every((char, i) => 
            i === 0 || char.charCodeAt(0) === str.charCodeAt(i - 1) + 1
        );
        
        const descending = str.split('').every((char, i) => 
            i === 0 || char.charCodeAt(0) === str.charCodeAt(i - 1) - 1
        );
        
        return ascending || descending;
    }

    private static getSequentialType(str: string): 'ascending' | 'descending' {
        return str.charCodeAt(1) > str.charCodeAt(0) ? 'ascending' : 'descending';
    }

    private static calculateOverallComplexity(content: string): number {
        const entropy = this.calculateShannonEntropy(content);
        const patterns = this.findRepeatingPatterns(content);
        const sequential = this.findSequentialPatterns(content);
        
        let complexity = entropy / Math.log2(256); // Normalize to 0-1
        complexity -= patterns.length / content.length; // Reduce for patterns
        complexity -= sequential.length / content.length; // Reduce for sequences
        
        return Math.max(0, Math.min(1, complexity));
    }

    private static generateRecommendations(content: string, entropy: number, complexity: number): string[] {
        const recommendations: string[] = [];
        
        if (entropy < 3) {
            recommendations.push("Increase character variety to improve entropy");
        }
        
        if (complexity < 0.5) {
            recommendations.push("Reduce predictable patterns");
        }
        
        if (content.length < 12) {
            recommendations.push("Consider increasing length for better security");
        }
        
        if (!/[A-Z]/.test(content)) {
            recommendations.push("Add uppercase letters");
        }
        
        if (!/[a-z]/.test(content)) {
            recommendations.push("Add lowercase letters");
        }
        
        if (!/\d/.test(content)) {
            recommendations.push("Add numbers");
        }
        
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(content)) {
            recommendations.push("Add special characters");
        }
        
        return recommendations;
    }
}
