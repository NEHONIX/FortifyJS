// XSS and SQL Injection Detection Patterns
// Patterns for input validation, WAF rules, or security scanning

// SQL Injection Patterns
const sqlPatterns = [
    // Basic SQL Keywords
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|MERGE|TRUNCATE|REPLACE)\b)/i,

    // SQL Comments
    /(--|\/\*|\*\/|#)/,

    // Union-based injection
    /(\bUNION\s+(ALL\s+)?SELECT\b)/i,
    /(\bUNION\s+\w+\s+SELECT\b)/i,

    // Boolean-based injection
    /(\b(OR|AND)\s+\d+\s*[=<>!]+\s*\d+)/i,
    /(\b(OR|AND)\s+['"]\w*['"]\s*[=<>!]+\s*['"]\w*['"])/i,
    /(\b(OR|AND)\s+\d+\s*(=|!=|<>)\s*\d+)/i,

    // Time-based injection
    /(\bSLEEP\s*\(\s*\d+\s*\))/i,
    /(\bWAITFOR\s+DELAY\b)/i,
    /(\bBENCHMARK\s*\()/i,
    /(\bPG_SLEEP\s*\()/i,

    // Stacked queries
    /;\s*(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER)/i,

    // Information schema queries
    /(\bINFORMATION_SCHEMA\b)/i,
    /(\bSYSOBJECTS\b)/i,
    /(\bSYSCOLUMNS\b)/i,
    /(\bMSYSOBJECTS\b)/i,

    // Database-specific functions
    /(\b(VERSION|USER|DATABASE|SCHEMA)\s*\(\s*\))/i,
    /(\b@@(VERSION|USER|SERVERNAME)\b)/i,
    /(\bCONCAT\s*\()/i,
    /(\bGROUP_CONCAT\s*\()/i,
    /(\bCAST\s*\()/i,
    /(\bCONVERT\s*\()/i,

    // Hex encoding
    /(0x[0-9A-Fa-f]+)/,

    // SQL string functions
    /(\bSUBSTRING\s*\()/i,
    /(\bCHAR\s*\()/i,
    /(\bASCII\s*\()/i,
    /(\bLEN\s*\()/i,
    /(\bLENGTH\s*\()/i,

    // Conditional statements
    /(\bCASE\s+WHEN\b)/i,
    /(\bIF\s*\()/i,
    /(\bIFNULL\s*\()/i,
    /(\bCOALESCE\s*\()/i,

    // SQL operators and wildcards
    /(\bLIKE\s+['"][%_])/i,
    /(\bREGEXP\b)/i,
    /(\bRLIKE\b)/i,

    // Advanced injection techniques
    /(\bINTO\s+OUTFILE\b)/i,
    /(\bINTO\s+DUMPFILE\b)/i,
    /(\bLOAD_FILE\s*\()/i,
    /(\bxp_cmdshell\b)/i,
    /(\bsp_executesql\b)/i,

    // Blind injection patterns
    /(\bEXISTS\s*\(\s*SELECT\b)/i,
    /(\b(SELECT\s+)?(COUNT|MAX|MIN|SUM|AVG)\s*\()/i,
];

// XSS (Cross-Site Scripting) Patterns
const xssPatterns = [
    // Script tags
    /<script[^>]*>.*?<\/script>/gi,
    /<script[^>]*>/gi,
    /<\/script>/gi,

    // JavaScript protocol
    /javascript:/gi,
    /j\s*a\s*v\s*a\s*s\s*c\s*r\s*i\s*p\s*t\s*:/gi,

    // Event handlers
    /\bon\w+\s*=/gi,
    /\bon(load|error|click|mouseover|focus|blur|change|submit)\s*=/gi,

    // Dangerous HTML tags
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /<iframe[^>]*>/gi,
    /<object[^>]*>.*?<\/object>/gi,
    /<object[^>]*>/gi,
    /<embed[^>]*>/gi,
    /<applet[^>]*>.*?<\/applet>/gi,
    /<form[^>]*>/gi,
    /<input[^>]*>/gi,
    /<link[^>]*>/gi,
    /<meta[^>]*>/gi,
    /<base[^>]*>/gi,

    // Dangerous JavaScript functions
    /eval\s*\(/gi,
    /setTimeout\s*\(/gi,
    /setInterval\s*\(/gi,
    /Function\s*\(/gi,
    /execScript\s*\(/gi,

    // CSS expressions (IE)
    /expression\s*\(/gi,
    /-moz-binding/gi,
    /behavior\s*:/gi,

    // Data URIs
    /data\s*:\s*text\/html/gi,
    /data\s*:\s*application\/javascript/gi,
    /data\s*:\s*text\/javascript/gi,

    // VBScript
    /vbscript:/gi,
    /v\s*b\s*s\s*c\s*r\s*i\s*p\s*t\s*:/gi,

    // Import statements
    /@import/gi,
    /import\s*\(/gi,

    // SVG-based XSS
    /<svg[^>]*>.*?<\/svg>/gi,
    /<svg[^>]*>/gi,
    /<foreignObject[^>]*>/gi,
    /<use[^>]*>/gi,
    /<image[^>]*>/gi,
    /<animate[^>]*>/gi,
    /<animateTransform[^>]*>/gi,

    // HTML5 form attributes
    /formaction\s*=/gi,
    /form\s*=/gi,

    // DOM manipulation
    /document\.(write|writeln|createElement|getElementById)/gi,
    /window\.(location|open|eval)/gi,
    /innerHTML\s*=/gi,
    /outerHTML\s*=/gi,

    // Encoded variations
    /&#[xX]?[0-9a-fA-F]+;/g,
    /%[0-9a-fA-F]{2}/g,
    /&lt;script&gt;/gi,
    /&lt;\/script&gt;/gi,

    // CSS injection
    /url\s*\(\s*javascript:/gi,
    /url\s*\(\s*data:/gi,
    /@charset/gi,

    // Template injection
    /\{\{.*?\}\}/g,
    /\$\{.*?\}/g,
    /<%.*?%>/g,

    // Angular-specific
    /ng-[a-z-]+/gi,
    /\[\[.*?\]\]/g,

    // React-specific
    /dangerouslySetInnerHTML/gi,

    // Additional dangerous patterns
    /<style[^>]*>.*?<\/style>/gi,
    /<title[^>]*>.*?<\/title>/gi,
    /<body[^>]*>/gi,
    /<html[^>]*>/gi,
    /<head[^>]*>/gi,

    // Protocol handlers
    /mailto:/gi,
    /tel:/gi,
    /ftp:/gi,
    /file:/gi,

    // Obfuscation techniques
    /String\.fromCharCode/gi,
    /unescape\s*\(/gi,
    /escape\s*\(/gi,
    /decodeURI\s*\(/gi,
    /decodeURIComponent\s*\(/gi,
    /encodeURI\s*\(/gi,
    /encodeURIComponent\s*\(/gi,

    // CDATA sections
    /<!\[CDATA\[.*?\]\]>/gi,

    // XML processing instructions
    /<\?xml[^>]*\?>/gi,
    /<\?php[^>]*\?>/gi,

    // Server-side includes
    /<!--#(include|exec|config|set)/gi,
];

// Patterns for specific contexts
const contexts = {
    // LDAP Injection
    ldap: [/[\(\)\|\&]/, /\*(?![a-zA-Z0-9])/, /[\x00-\x1f\x7f-\x9f]/],

    // XML Injection
    xml: [/<!\[CDATA\[/gi, /<!DOCTYPE/gi, /<!ENTITY/gi, /<\?xml/gi],

    // Command Injection
    command: [
        /[;&|`$(){}]/,
        /\b(cat|ls|pwd|whoami|id|uname|wget|curl|nc|netcat|sh|bash|cmd|powershell)\b/i,
        /\.\.\//,
        /~\//,
    ],

    // Path Traversal
    pathTraversal: [/\.\.\//, /\.\./],

    // NoSQL Injection
    nosql: [
        /\$where/gi,
        /\$ne/gi,
        /\$gt/gi,
        /\$lt/gi,
        /\$regex/gi,
        /\$or/gi,
        /\$and/gi,
    ],
};

export { sqlPatterns, xssPatterns, contexts };
