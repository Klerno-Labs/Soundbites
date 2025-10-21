const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import routes (they will auto-detect SQLite via database-local.js)
const authRoutes = require('./routes/auth');
const quizRoutes = require('./routes/quiz');
const adminRoutes = require('./routes/admin');
const tiktokEventsRoutes = require('./routes/tiktok-events');
const healthRoutes = require('./routes/health');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy - required for Railway
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root route - API info page
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Soundbites Quiz API</title>
            <style>
                body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; background: #f5f5f5; }
                h1 { color: #c92a76; }
                .endpoint { background: white; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #c92a76; }
                code { background: #f0f0f0; padding: 2px 6px; border-radius: 3px; }
                .status { color: #00b894; font-weight: bold; }
            </style>
        </head>
        <body>
            <h1>🎯 Soundbites Quiz API</h1>
            <p class="status">✅ Backend is running successfully!</p>
            
            <h2>Available Endpoints:</h2>
            
            <div class="endpoint">
                <strong>GET /health</strong><br>
                Check API health status
            </div>
            
            <div class="endpoint">
                <strong>GET /api/quiz/questions</strong><br>
                Get all quiz questions
            </div>
            
            <div class="endpoint">
                <strong>POST /api/quiz/submit</strong><br>
                Submit quiz results
            </div>
            
            <div class="endpoint">
                <strong>POST /api/auth/login</strong><br>
                Admin login
            </div>
            
            <div class="endpoint">
                <strong>GET /api/admin/questions</strong><br>
                Manage questions (requires authentication)
            </div>
            
            <div class="endpoint">
                <strong>GET /api/admin/results</strong><br>
                View quiz results (requires authentication)
            </div>
            
            <p><em>Frontend URL:</em> <a href="https://otis.soundbites.com">https://otis.soundbites.com</a></p>
        </body>
        </html>
    `);
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        database: 'postgresql',
        dbConfigured: !!process.env.DATABASE_URL,
        dbPrefix: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 15) + '...' : 'none'
    });
});

// Database initialization route
app.get('/api/init-database', async (req, res) => {
    try {
        const { initDatabase } = require('./scripts/init-db-postgres');
        await initDatabase();
        res.json({ success: true, message: 'Database initialized successfully' });
    } catch (error) {
        console.error('Database initialization error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/tiktok-events', tiktokEventsRoutes);
app.use('/health', healthRoutes);

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV}`);
    console.log(`🔗 Database configured: ${process.env.DATABASE_URL ? 'Yes' : 'No'}`);
}).on('error', (err) => {
    console.error('❌ Server failed to start:', err);
    process.exit(1);
});
