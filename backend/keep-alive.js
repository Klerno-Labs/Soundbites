/**
 * Keep-Alive Service for Render Free Tier
 * Prevents backend from sleeping by pinging health endpoint every 14 minutes
 * Render free tier sleeps after 15 minutes of inactivity
 */

const https = require('https');

const BACKEND_URL = process.env.BACKEND_URL || 'https://soundbites-quiz-backend.onrender.com';
const PING_INTERVAL = 14 * 60 * 1000; // 14 minutes (before 15 min sleep threshold)

function ping() {
    const url = `${BACKEND_URL}/health`;
    const startTime = Date.now();

    https.get(url, (res) => {
        const duration = Date.now() - startTime;
        let data = '';

        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
            if (res.statusCode === 200) {
                console.log(`✅ [${new Date().toISOString()}] Keep-alive ping successful (${duration}ms)`);
                console.log(`   Response:`, data.substring(0, 100));
            } else {
                console.error(`❌ [${new Date().toISOString()}] Ping failed with status ${res.statusCode}`);
            }
        });
    }).on('error', (err) => {
        console.error(`❌ [${new Date().toISOString()}] Ping error:`, err.message);
    });
}

// Initial ping
console.log(`🚀 Keep-Alive Service Started`);
console.log(`   Target: ${BACKEND_URL}`);
console.log(`   Interval: ${PING_INTERVAL / 60000} minutes`);
ping();

// Schedule regular pings
setInterval(ping, PING_INTERVAL);

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Keep-Alive Service shutting down...');
    process.exit(0);
});
