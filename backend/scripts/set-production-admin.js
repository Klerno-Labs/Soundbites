// Clean and set production admin credentials
// Removes all admin users and creates a single admin with specified credentials

const { Client } = require('pg');
const bcrypt = require('bcrypt');

// Production PostgreSQL connection
const connectionString = 'postgresql://soundbites:sGrzsLyde4NXM7lGyC8hAfgyl9lM79yz@dpg-d3q5v7c9c44c73cgssbg-a.oregon-postgres.render.com/soundbites_dzq2';

async function updateProductionCredentials() {
    const client = new Client({
        connectionString,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        console.log('Connecting to production database...\n');
        await client.connect();
        console.log('✅ Connected to production PostgreSQL\n');

        // Delete all existing admin users
        console.log('Removing all existing admin users...');
        const deleteResult = await client.query('DELETE FROM admin_users');
        console.log(`✅ Removed ${deleteResult.rowCount} admin user(s)\n`);

        // Hash the new password
        console.log('Creating new admin user...');
        const passwordHash = await bcrypt.hash('Hearing2025', 10);

        // Insert the new admin user
        const result = await client.query(
            'INSERT INTO admin_users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, created_at',
            ['admin', 'c.hatfield309@gmail.com', passwordHash]
        );

        const user = result.rows[0];

        console.log('✅ Admin user created successfully!\n');
        console.log('═══════════════════════════════════════');
        console.log('  PRODUCTION ADMIN CREDENTIALS');
        console.log('═══════════════════════════════════════');
        console.log('ID:       ', user.id);
        console.log('Username: ', user.username);
        console.log('Email:    ', 'c.hatfield309@gmail.com');
        console.log('Password: ', 'Hearing2025');
        console.log('Created:  ', user.created_at);
        console.log('═══════════════════════════════════════\n');

        console.log('✅ All done! You can now login with:');
        console.log('   Email: c.hatfield309@gmail.com');
        console.log('   Password: Hearing2025\n');

    } catch (error) {
        console.error('❌ Error updating production credentials:', error.message);
        process.exit(1);
    } finally {
        await client.end();
        process.exit(0);
    }
}

updateProductionCredentials();
