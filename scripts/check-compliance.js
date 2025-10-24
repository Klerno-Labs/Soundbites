#!/usr/bin/env node
/**
 * Pre-Deployment Compliance Check
 * Run: node scripts/check-compliance.js
 *
 * Scans for FDA/DSHEA violations, disease claims, and prohibited language
 */

const fs = require('fs');
const path = require('path');

const BANNED_PHRASES = [
    { pattern: /\btreat(s|ing|ment)?\b/gi, category: 'Medical Claims' },
    { pattern: /\bcure(s|d)?\b/gi, category: 'Medical Claims' },
    { pattern: /\bheal(s|ing)?\b/gi, category: 'Medical Claims' },
    { pattern: /\bprevent(s|ing|ion)?\b/gi, category: 'Medical Claims' },
    { pattern: /\breverses?\b/gi, category: 'Medical Claims' },
    { pattern: /\bdiagnos(e|is|ed|ing)\b/gi, category: 'Medical Diagnosis' },
    { pattern: /\bdisease\b/gi, category: 'Disease Reference' },
    { pattern: /\bclinically proven\b/gi, category: 'Unsubstantiated Claims' },
    { pattern: /\bFDA approved\b/gi, category: 'False FDA Reference' },
    { pattern: /\bhearing loss\b/gi, category: 'Medical Condition' },
    { pattern: /\btinnitus\b/gi, category: 'Medical Condition' },
    { pattern: /\bhearing aid\b/gi, category: 'Medical Device' },
    { pattern: /\bdeafness\b/gi, category: 'Medical Condition' },
    { pattern: /\bhearing damage\b/gi, category: 'Medical Condition' },
    { pattern: /\bhearing impairment\b/gi, category: 'Medical Condition' },
    { pattern: /\bmedical (condition|diagnosis|treatment)\b/gi, category: 'Medical Reference' },
    { pattern: /\bhearing challenges affecting( your)? daily life\b/gi, category: 'Medical Impact' },
    { pattern: /\bhearing difficulties\b/gi, category: 'Medical Terminology' },
    { pattern: /\bhearing health\b/gi, category: 'Medical Terminology' }
];

function scanFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const violations = [];

    BANNED_PHRASES.forEach(({ pattern, category }) => {
        const matches = [...content.matchAll(pattern)];
        matches.forEach(match => {
            const lines = content.split('\n');
            lines.forEach((line, lineNum) => {
                if (line.includes(match[0])) {
                    violations.push({
                        file: filePath,
                        line: lineNum + 1,
                        phrase: match[0],
                        category: category,
                        context: line.trim().substring(0, 80)
                    });
                }
            });
        });
    });

    return violations;
}

function main() {
    const filesToScan = [
        'index.html',
        'app/script.js'
    ];

    let totalViolations = 0;
    const violationsByCategory = {};

    console.log('🔍 SOUNDBITES QUIZ - FDA/DSHEA COMPLIANCE SCAN');
    console.log('=' .repeat(60));
    console.log('');

    filesToScan.forEach(file => {
        if (!fs.existsSync(file)) {
            console.log(`⚠️  ${file}: File not found (skipping)`);
            return;
        }

        const violations = scanFile(file);
        if (violations.length > 0) {
            console.log(`❌ ${file}: ${violations.length} violation(s) found`);
            console.log('');

            violations.forEach(v => {
                console.log(`   [${v.category}]`);
                console.log(`   Line ${v.line}: "${v.phrase}"`);
                console.log(`   Context: ${v.context}`);
                console.log('');

                violationsByCategory[v.category] = (violationsByCategory[v.category] || 0) + 1;
                totalViolations++;
            });
        } else {
            console.log(`✅ ${file}: Clean (no violations)`);
        }
    });

    console.log('');
    console.log('=' .repeat(60));

    if (totalViolations > 0) {
        console.log(`\n⚠️  COMPLIANCE FAILED: ${totalViolations} violation(s) detected\n`);
        console.log('Violations by category:');
        Object.entries(violationsByCategory).forEach(([cat, count]) => {
            console.log(`  • ${cat}: ${count}`);
        });
        console.log('');
        console.log('ACTION REQUIRED:');
        console.log('  1. Review the audit report for compliant rewrites');
        console.log('  2. Update all flagged text to FDA/DSHEA-compliant language');
        console.log('  3. Re-run this check before deployment');
        console.log('');
        process.exit(1);
    } else {
        console.log('\n✅ COMPLIANCE PASSED: All files clean!');
        console.log('');
        console.log('Safe to deploy. No prohibited language detected.');
        console.log('');
        process.exit(0);
    }
}

main();
