#!/usr/bin/env node
/**
 * Migration: Add role-based access control to admin_users
 *
 * Adds 'role' column to admin_users table
 * Roles: 'admin', 'editor', 'viewer'
 */

const pool = require('../config/database-local');

async function migrate() {
    try {
        console.log('🔄 Adding role column to admin_users table...');

        const isSQLite = process.env.DATABASE_URL?.startsWith('sqlite:') || !process.env.DATABASE_URL;

        if (isSQLite) {
            // SQLite: Check if column exists by querying table info
            const checkResult = await pool.query(`PRAGMA table_info(admin_users)`, []);
            const hasRole = checkResult.rows.some(col => col.name === 'role');

            if (hasRole) {
                console.log('ℹ️  Role column already exists, skipping migration');
                process.exit(0);
            }

            // SQLite: Add column with default value
            await pool.query(`
                ALTER TABLE admin_users ADD COLUMN role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'editor', 'viewer'))
            `, []);

            console.log('✅ Role column added successfully (SQLite)');

        } else {
            // PostgreSQL
            const checkColumn = await pool.query(`
                SELECT column_name
                FROM information_schema.columns
                WHERE table_name='admin_users' AND column_name='role'
            `);

            if (checkColumn.rows.length > 0) {
                console.log('ℹ️  Role column already exists, skipping migration');
                process.exit(0);
            }

            await pool.query(`
                ALTER TABLE admin_users
                ADD COLUMN role VARCHAR(20) DEFAULT 'admin' CHECK (role IN ('admin', 'editor', 'viewer'))
            `);

            await pool.query(`
                UPDATE admin_users SET role = 'admin' WHERE role IS NULL
            `);

            console.log('✅ Role column added successfully (PostgreSQL)');
        }

        console.log('   Roles: admin, editor, viewer');
        console.log('   All existing users set to "admin" role');

        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

migrate();
