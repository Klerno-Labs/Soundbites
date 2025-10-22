#!/usr/bin/env node
/**
 * Database Restore Script for PostgreSQL
 *
 * Usage: node scripts/restore-db.js <backup-file>
 *
 * Example: node scripts/restore-db.js backups/soundbites-backup-2025-10-21T14-30-00-000Z.sql
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const backupFile = process.argv[2];

if (!backupFile) {
    console.error('❌ Usage: node scripts/restore-db.js <backup-file>');
    console.error('   Example: node scripts/restore-db.js backups/soundbites-backup-2025-10-21.sql');
    process.exit(1);
}

const backupPath = path.isAbsolute(backupFile)
    ? backupFile
    : path.join(__dirname, '..', backupFile);

if (!fs.existsSync(backupPath)) {
    console.error(`❌ Backup file not found: ${backupPath}`);
    process.exit(1);
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable not set');
    process.exit(1);
}

console.log(`⚠️  WARNING: This will OVERWRITE the current database!`);
console.log(`📂 Restoring from: ${backupPath}`);
console.log(`🔄 Starting restore in 5 seconds... (Ctrl+C to cancel)`);

setTimeout(() => {
    const command = `psql "${databaseUrl}" < "${backupPath}"`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`❌ Restore failed: ${error.message}`);
            process.exit(1);
        }

        if (stderr && !stderr.includes('warning')) {
            console.error(`⚠️  Warnings: ${stderr}`);
        }

        console.log(`✅ Database restored successfully from ${backupPath}`);
    });
}, 5000);
