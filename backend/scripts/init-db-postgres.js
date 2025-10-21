// PostgreSQL Database Initialization Script
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://soundbites:sGrzsLyde4NXM7lGyC8hAfgyl9lM79yz@dpg-d3q5v7c9c44c73cgssbg-a/soundbites_dzq2';

async function initDatabase() {
    const pool = new Pool({
        connectionString: DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        console.log('🔨 Creating PostgreSQL database schema...');

        // Create tables
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

        console.log('✅ Tables created successfully');

        // Check if questions already exist
        const existingQuestions = await pool.query('SELECT COUNT(*) as count FROM questions');
        if (existingQuestions.rows[0].count === '0') {
            console.log('📝 Inserting default questions...');
            
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
            console.log('ℹ️  Questions already exist, skipping insertion');
        }

        // Create admin user (PRODUCTION CREDENTIALS)
        const adminUsername = process.env.ADMIN_USERNAME || 'c.hatfield309@gmail.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'Hearing2025';

        const passwordHash = await bcrypt.hash(adminPassword, 12);

        await pool.query(
            'INSERT INTO admin_users (username, password_hash, email) VALUES ($1, $2, $3) ON CONFLICT (username) DO NOTHING',
            [adminUsername, passwordHash, 'c.hatfield309@gmail.com']
        );

        console.log('✅ Admin user created/verified');
        console.log('🎉 Database initialization complete!');

        await pool.end();
        return { success: true };
    } catch (error) {
        console.error('❌ Database initialization error:', error);
        await pool.end();
        throw error;
    }
}

// Run if called directly
if (require.main === module) {
    initDatabase()
        .then(() => {
            console.log('✅ Initialization successful');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Initialization failed:', error);
            process.exit(1);
        });
}

module.exports = { initDatabase };
