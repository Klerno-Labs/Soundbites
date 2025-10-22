#!/usr/bin/env node
/**
 * Database Backup Script for PostgreSQL
 *
 * Usage: node scripts/backup-db.js
 *
 * Environment variables required:
 * - DATABASE_URL: PostgreSQL connection string
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const BACKUP_DIR = path.join(__dirname, '..', 'backups');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupFile = path.join(BACKUP_DIR, `soundbites-backup-${timestamp}.sql`);

// Create backups directory if it doesn't exist
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log('✅ Created backups directory');
}

// Extract database connection details from DATABASE_URL
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable not set');
    process.exit(1);
}

console.log(`🔄 Starting database backup...`);
console.log(`📂 Backup file: ${backupFile}`);

// Use pg_dump to create backup
const command = `pg_dump "${databaseUrl}" > "${backupFile}"`;

exec(command, (error, stdout, stderr) => {
    if (error) {
        console.error(`❌ Backup failed: ${error.message}`);
        process.exit(1);
    }

    if (stderr && !stderr.includes('warning')) {
        console.error(`⚠️  Warnings: ${stderr}`);
    }

    const stats = fs.statSync(backupFile);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    console.log(`✅ Backup completed successfully`);
    console.log(`📊 Backup size: ${fileSizeMB} MB`);
    console.log(`📁 Location: ${backupFile}`);

    // Delete old backups (keep last 7 days)
    deleteOldBackups();
});

function deleteOldBackups() {
    const files = fs.readdirSync(BACKUP_DIR);
    const backupFiles = files.filter(f => f.startsWith('soundbites-backup-'));

    if (backupFiles.length > 7) {
        const sortedFiles = backupFiles.sort().reverse();
        const filesToDelete = sortedFiles.slice(7);

        filesToDelete.forEach(file => {
            const filePath = path.join(BACKUP_DIR, file);
            fs.unlinkSync(filePath);
            console.log(`🗑️  Deleted old backup: ${file}`);
        });

        console.log(`✅ Cleanup complete. Kept ${7} most recent backups.`);
    }
}
