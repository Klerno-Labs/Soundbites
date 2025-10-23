#!/usr/bin/env node
/**
 * Complete Production Setup Script
 * Runs database initialization and migrations
 */

const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is required!');
    process.exit(1);
}

async function setupProduction() {
    const pool = new Pool({
        connectionString: DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        console.log('🚀 Starting production setup...\n');

        // STEP 1: Create tables
        console.log('📋 Step 1: Creating database tables...');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS questions (
                id SERIAL PRIMARY KEY,
                question TEXT NOT NULL,
                type VARCHAR(20) NOT NULL CHECK (type IN ('multiple-choice', 'yes-no', 'slider', 'hours-slider')),
                options TEXT,
                weight INTEGER DEFAULT 10,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS results (
                id SERIAL PRIMARY KEY,
                score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
                answers TEXT NOT NULL,
                utm_source VARCHAR(100),
                utm_medium VARCHAR(100),
                utm_campaign VARCHAR(100),
                ip_address VARCHAR(45),
                user_agent TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS leads (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) NOT NULL UNIQUE,
                name VARCHAR(255),
                phone VARCHAR(50),
                result_id INTEGER REFERENCES results(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS admin_users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(100) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                email VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP
            )
        `);

        console.log('✅ Tables created\n');

        // STEP 2: Add role column if it doesn't exist
        console.log('📋 Step 2: Adding role column...');

        const checkColumn = await pool.query(`
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name='admin_users' AND column_name='role'
        `);

        if (checkColumn.rows.length === 0) {
            await pool.query(`
                ALTER TABLE admin_users
                ADD COLUMN role VARCHAR(20) DEFAULT 'admin' CHECK (role IN ('admin', 'editor', 'viewer'))
            `);
            console.log('✅ Role column added');
        } else {
            console.log('ℹ️  Role column already exists');
        }
        console.log('');

        // STEP 3: Insert default questions
        const existingQuestions = await pool.query('SELECT COUNT(*) as count FROM questions');
        if (parseInt(existingQuestions.rows[0].count) === 0) {
            console.log('📋 Step 3: Inserting default questions...');

            const questions = [
                ['Do you find yourself asking people to repeat themselves often?', 'yes-no', '["Yes", "No"]', 10],
                ['How often do you struggle to hear in noisy environments?', 'slider', '{"min": 0, "max": 100, "label": "Never to Always"}', 10],
                ['Do you have difficulty following conversations in groups?', 'yes-no', '["Yes", "No"]', 10],
                ['How frequently do you turn up the TV or radio volume?', 'slider', '{"min": 0, "max": 100, "label": "Never to Always"}', 10],
                ['Do you experience ringing in your ears (tinnitus)?', 'yes-no', '["Yes", "No"]', 10],
                ['How often do you miss phone calls because you didn\'t hear them?', 'slider', '{"min": 0, "max": 100, "label": "Never to Always"}', 10],
                ['Do family members complain that you don\'t hear them?', 'yes-no', '["Yes", "No"]', 10],
                ['How difficult is it to hear in restaurants or at social gatherings?', 'slider', '{"min": 0, "max": 100, "label": "Not Difficult to Very Difficult"}', 10],
                ['Do you avoid social situations because of hearing difficulties?', 'yes-no', '["Yes", "No"]', 10],
                ['How much does hearing difficulty affect your quality of life?', 'slider', '{"min": 0, "max": 100, "label": "Not at All to Significantly"}', 10]
            ];

            for (const q of questions) {
                await pool.query(
                    'INSERT INTO questions (question, type, options, weight) VALUES ($1, $2, $3, $4)',
                    q
                );
            }

            console.log('✅ Default questions inserted');
        } else {
            console.log('ℹ️  Questions already exist, skipping');
        }
        console.log('');

        // STEP 4: Create admin user
        console.log('📋 Step 4: Creating admin user...');
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!adminEmail || !adminPassword) {
            console.error('❌ ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required!');
            console.error('   Set these in your Render dashboard');
            process.exit(1);
        }

        const passwordHash = await bcrypt.hash(adminPassword, 12);

        // Delete existing user with this email and create new one
        await pool.query('DELETE FROM admin_users WHERE email = $1', [adminEmail]);

        await pool.query(
            'INSERT INTO admin_users (username, password_hash, email, role) VALUES ($1, $2, $3, $4)',
            [adminEmail, passwordHash, adminEmail, 'admin']
        );

        console.log(`✅ Admin user created: ${adminEmail}`);
        console.log('');

        console.log('🎉 Production setup complete!');
        console.log('');
        console.log('📝 Summary:');
        console.log('   - Database tables created');
        console.log('   - Role-based access control added');
        console.log('   - Default questions added');
        console.log(`   - Admin user: ${adminEmail}`);
        console.log('');
        console.log('✅ You can now login at: https://otis.soundbites.com/admin/login.html');

        await pool.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Setup failed:', error);
        await pool.end();
        process.exit(1);
    }
}

setupProduction();
