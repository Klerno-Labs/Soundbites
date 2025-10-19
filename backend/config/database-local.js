// Load environment variables first
require('dotenv').config();

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Use SQLite for local development, PostgreSQL for production
const useSQLite = process.env.DATABASE_URL?.startsWith('sqlite:');

let db;

if (useSQLite) {
    const dbPath = process.env.DATABASE_URL.replace('sqlite:', '');
    db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('❌ SQLite connection error:', err);
            process.exit(-1);
        }
        console.log('✅ SQLite database connected');
    });

    // Promisify SQLite methods for easier use
    db.queryAsync = function(sql, params = []) {
        return new Promise((resolve, reject) => {
            if (sql.trim().toUpperCase().startsWith('SELECT') || 
                sql.trim().toUpperCase().startsWith('INSERT') ||
                sql.trim().toUpperCase().startsWith('UPDATE') ||
                sql.trim().toUpperCase().startsWith('DELETE')) {
                this.all(sql, params, (err, rows) => {
                    if (err) reject(err);
                    else resolve({ rows: rows || [] });
                });
            } else {
                // For CREATE TABLE, etc
                this.exec(sql, (err) => {
                    if (err) reject(err);
                    else resolve({ rows: [] });
                });
            }
        });
    };

    // Export SQLite-compatible interface
    module.exports = {
        query: (sql, params) => db.queryAsync(sql, params),
        connect: () => Promise.resolve({ release: () => {} })
    };
} else {
    // Use PostgreSQL for production
    const { Pool } = require('pg');
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    pool.on('connect', () => {
        console.log('✅ PostgreSQL database connected');
    });

    pool.on('error', (err) => {
        console.error('❌ PostgreSQL connection error:', err);
        process.exit(-1);
    });

    module.exports = pool;
}
