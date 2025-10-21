/**
 * Rate Limiting Middleware
 * Prevents brute-force attacks on auth endpoints
 */

const rateLimit = require('express-rate-limit');

// Strict rate limit for login attempts (5 per 15 min)
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per window
    message: {
        error: 'Too many login attempts. Please try again in 15 minutes.',
        retryAfter: 15 * 60
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Identify by IP + User-Agent to prevent simple bypass
    keyGenerator: (req) => {
        return `${req.ip}-${req.get('user-agent')}`;
    },
    // Skip successful logins from count
    skipSuccessfulRequests: true,
    handler: (req, res) => {
        res.status(429).json({
            error: 'Too many login attempts. Please try again later.',
            retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
        });
    }
});

// Medium rate limit for token verification (30 per minute)
const verifyLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30,
    message: { error: 'Too many requests. Please slow down.' },
    standardHeaders: true,
    legacyHeaders: false
});

// General API rate limit (100 per minute)
const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    message: { error: 'Too many requests. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false
});

module.exports = {
    loginLimiter,
    verifyLimiter,
    apiLimiter
};
