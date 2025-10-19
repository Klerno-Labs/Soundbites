// Update admin credentials
const bcrypt = require('bcrypt');
const pool = require('../config/database-local');

async function updateAdmin() {
    try {
        console.log('Updating admin credentials...\n');

        const email = 'c.hatfield309@gmail.com';
        const password = 'Hearing2025';
        const username = 'admin'; // Keep username for backward compatibility

        // Hash the password
        const passwordHash = await bcrypt.hash(password, 10);

        // Check if admin user exists
        const checkResult = await pool.query(
            'SELECT id FROM admin_users WHERE username = $1',
            [username]
        );

        if (checkResult.rows.length > 0) {
            // Update existing admin
            await pool.query(
                'UPDATE admin_users SET email = $1, password_hash = $2 WHERE username = $3',
                [email, passwordHash, username]
            );
            console.log('✅ Admin user updated successfully!');
        } else {
            // Create new admin
            await pool.query(
                'INSERT INTO admin_users (username, email, password_hash) VALUES ($1, $2, $3)',
                [username, email, passwordHash]
            );
            console.log('✅ Admin user created successfully!');
        }

        console.log('\n-----------------------------------');
        console.log('Email:', email);
        console.log('Password: Hearing2025');
        console.log('-----------------------------------\n');

    } catch (error) {
        console.error('❌ Error updating admin:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

updateAdmin();
