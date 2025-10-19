// Add New Admin User Script
// Usage: node add-admin.js

const readline = require('readline');
const bcrypt = require('bcrypt');
const pool = require('../config/database-local');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function addAdmin() {
    try {
        console.log('\n=== Add New Admin User ===\n');

        const username = await question('Enter username: ');
        if (!username.trim()) {
            console.error('Error: Username is required');
            process.exit(1);
        }

        // Check if username already exists
        const existingUser = await pool.query(
            'SELECT id FROM admin_users WHERE username = $1',
            [username.trim()]
        );

        if (existingUser.rows.length > 0) {
            console.error(`Error: Username "${username}" already exists`);
            process.exit(1);
        }

        const password = await question('Enter password: ');
        if (!password || password.length < 6) {
            console.error('Error: Password must be at least 6 characters');
            process.exit(1);
        }

        const email = await question('Enter email (optional): ');

        // Hash password
        console.log('\nCreating admin user...');
        const passwordHash = await bcrypt.hash(password, 10);

        // Insert into database
        const result = await pool.query(
            'INSERT INTO admin_users (username, password_hash, email) VALUES ($1, $2, $3) RETURNING id, username, email, created_at',
            [username.trim(), passwordHash, email.trim() || null]
        );

        const user = result.rows[0];

        console.log('\n✅ Admin user created successfully!');
        console.log('-----------------------------------');
        console.log('ID:', user.id);
        console.log('Username:', user.username);
        console.log('Email:', user.email || 'Not provided');
        console.log('Created:', user.created_at);
        console.log('-----------------------------------\n');

    } catch (error) {
        console.error('\n❌ Error creating admin user:', error.message);
        process.exit(1);
    } finally {
        rl.close();
        await pool.end();
    }
}

// Run the script
addAdmin();
