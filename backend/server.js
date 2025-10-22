const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();

// Logger setup
const logger = require('./config/logger');
const swaggerSpec = require('./config/swagger');

// Force redeploy - v1.0.2
const APP_VERSION = '1.0.2';

// Import routes (they will auto-detect SQLite via database-local.js)
const authRoutes = require('./routes/auth');
const quizRoutes = require('./routes/quiz');
const adminRoutes = require('./routes/admin');
const adminUsersRoutes = require('./routes/admin-users');
const tiktokEventsRoutes = require('./routes/tiktok-events');
const healthRoutes = require('./routes/health');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy - required for Render
app.set('trust proxy', 1);

// Request logging with Morgan
// Skip logging health check endpoint to reduce noise
app.use(morgan('combined', {
    skip: (req) => req.url === '/health',
    stream: {
        write: (message) => logger.info(message.trim())
    }
}));

// Security middleware
app.use(helmet());

// CORS - allow both production and local development
const allowedOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5500',  // Live Server default port
    'http://127.0.0.1:5500',
    'https://otis.soundbites.com'  // Hardcode production URL as fallback
].filter(Boolean); // Remove undefined values

console.log('🔧 CORS Configuration:');
console.log('   Allowed Origins:', allowedOrigins);
console.log('   FRONTEND_URL env:', process.env.FRONTEND_URL);

app.use(cors({
    origin: function(origin, callback) {
        console.log('📡 CORS Request from origin:', origin);

        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) {
            console.log('✅ No origin - allowing');
            return callback(null, true);
        }

        if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
            console.log('✅ Origin allowed:', origin);
            callback(null, true);
        } else {
            console.log('❌ Origin BLOCKED:', origin);
            console.log('   Not in allowed list:', allowedOrigins);
            callback(new Error('Not allowed by CORS'));
        }
    },
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

// Serve static files from the parent directory (where index.html, admin/, app/ are located)
const path = require('path');
const frontendPath = path.join(__dirname, '..');
app.use(express.static(frontendPath));

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'Soundbites API Docs',
    customCss: '.swagger-ui .topbar { display: none }'
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin', adminUsersRoutes);
app.use('/api/tiktok-events', tiktokEventsRoutes);
app.use('/health', healthRoutes);

// Error handling with logging
app.use((err, req, res, next) => {
    // Log error with Winston
    logger.error('Unhandled error:', {
        error: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('user-agent')
    });

    // Send response
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// 404 handler
app.use((req, res) => {
    logger.warn(`404 Not Found: ${req.method} ${req.url}`, {
        ip: req.ip,
        userAgent: req.get('user-agent')
    });
    res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
    logger.info(`🚀 Server running on port ${PORT}`);
    logger.info(`📊 Environment: ${process.env.NODE_ENV}`);
    logger.info(`🔗 Database configured: ${process.env.DATABASE_URL ? 'Yes' : 'No'}`);
    logger.info(`📝 Version: ${APP_VERSION}`);
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV}`);
    console.log(`🔗 Database configured: ${process.env.DATABASE_URL ? 'Yes' : 'No'}`);
}).on('error', (err) => {
    logger.error('❌ Server failed to start:', err);
    console.error('❌ Server failed to start:', err);
    process.exit(1);
});
