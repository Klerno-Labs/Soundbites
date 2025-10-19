const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

const dbPath = process.env.DATABASE_URL?.replace('sqlite:', '') || './soundbites.db';

async function initDatabase() {
    const db = new sqlite3.Database(dbPath);

    return new Promise((resolve, reject) => {
        console.log('🔨 Creating SQLite database schema...');

        db.serialize(async () => {
            // Create tables
            db.run(`
                CREATE TABLE IF NOT EXISTS questions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    question TEXT NOT NULL,
                    type VARCHAR(20) NOT NULL CHECK (type IN ('multiple-choice', 'yes-no', 'slider')),
                    options TEXT,
                    weight INTEGER DEFAULT 10,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            db.run(`
                CREATE TABLE IF NOT EXISTS results (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
                    answers TEXT NOT NULL,
                    utm_source VARCHAR(100),
                    utm_medium VARCHAR(100),
                    utm_campaign VARCHAR(100),
                    ip_address VARCHAR(45),
                    user_agent TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            db.run(`
                CREATE TABLE IF NOT EXISTS leads (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    email VARCHAR(255) NOT NULL UNIQUE,
                    name VARCHAR(255),
                    phone VARCHAR(50),
                    result_id INTEGER REFERENCES results(id),
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            db.run(`
                CREATE TABLE IF NOT EXISTS admin_users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username VARCHAR(100) NOT NULL UNIQUE,
                    password_hash VARCHAR(255) NOT NULL,
                    email VARCHAR(255),
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    last_login DATETIME
                )
            `);

            console.log('✅ Tables created successfully');

            // Insert default questions
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

            const stmt = db.prepare('INSERT INTO questions (question, type, options, weight) VALUES (?, ?, ?, ?)');
            questions.forEach(q => stmt.run(q));
            stmt.finalize();

            console.log('✅ Default questions inserted');

            // Create admin user
            const adminUsername = process.env.ADMIN_USERNAME || 'admin';
            const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
            
            bcrypt.hash(adminPassword, 12, (err, passwordHash) => {
                if (err) {
                    console.error('❌ Error hashing password:', err);
                    db.close();
                    reject(err);
                    return;
                }

                db.run(
                    'INSERT OR IGNORE INTO admin_users (username, password_hash, email) VALUES (?, ?, ?)',
                    [adminUsername, passwordHash, 'admin@soundbites.com'],
                    (err) => {
                        if (err) {
                            console.error('❌ Error creating admin user:', err);
                            db.close();
                            reject(err);
                            return;
                        }

                        console.log('✅ Admin user created');
                        console.log(`   Username: ${adminUsername}`);
                        console.log(`   Password: ${adminPassword}`);
                        console.log('   ⚠️  CHANGE THIS PASSWORD IN PRODUCTION!');
                        console.log('\n🎉 Database initialized successfully!');
                        
                        db.close((err) => {
                            if (err) reject(err);
                            else resolve();
                        });
                    }
                );
            });
        });
    });
}

initDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('❌ Initialization failed:', err);
        process.exit(1);
    });
