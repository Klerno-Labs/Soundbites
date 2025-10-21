/**
 * Health Check & Monitoring Endpoints
 */

const express = require('express');
const router = express.Router();
const pool = require('../config/database-local');

/**
 * GET /health
 * Basic health check
 */
router.get('/', async (req, res) => {
    const startTime = Date.now();

    try {
        // Check database connection
        await pool.query('SELECT 1');

        const uptime = process.uptime();
        const responseTime = Date.now() - startTime;

        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: Math.floor(uptime),
            responseTime: `${responseTime}ms`,
            environment: process.env.NODE_ENV || 'development',
            database: 'connected'
        });
    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: 'Database connection failed',
            database: 'disconnected'
        });
    }
});

/**
 * GET /health/ready
 * Readiness probe (for Kubernetes/load balancers)
 */
router.get('/ready', async (req, res) => {
    try {
        // Check database
        await pool.query('SELECT 1');

        // Check required env vars
        const required = ['DATABASE_URL', 'JWT_SECRET'];
        const missing = required.filter(v => !process.env[v]);

        if (missing.length > 0) {
            return res.status(503).json({
                ready: false,
                reason: 'Missing required environment variables'
            });
        }

        res.json({ ready: true });
    } catch (error) {
        res.status(503).json({
            ready: false,
            reason: error.message
        });
    }
});

/**
 * GET /health/live
 * Liveness probe (for Kubernetes)
 */
router.get('/live', (req, res) => {
    res.json({ alive: true });
});

/**
 * GET /health/metrics
 * Basic metrics
 */
router.get('/metrics', (req, res) => {
    const mem = process.memoryUsage();

    res.json({
        uptime: process.uptime(),
        memory: {
            rss: `${Math.round(mem.rss / 1024 / 1024)}MB`,
            heapUsed: `${Math.round(mem.heapUsed / 1024 / 1024)}MB`,
            heapTotal: `${Math.round(mem.heapTotal / 1024 / 1024)}MB`
        },
        cpu: process.cpuUsage(),
        nodeVersion: process.version,
        platform: process.platform
    });
});

module.exports = router;
