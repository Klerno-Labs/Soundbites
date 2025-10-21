const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/database-local');
const { loginLimiter, verifyLimiter } = require('../middleware/rate-limit');

const router = express.Router();

// Admin login (with rate limiting)
router.post('/login', loginLimiter, async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        // Accept either username or email
        const loginIdentifier = email || username;

        if (!loginIdentifier || !password) {
            return res.status(400).json({ error: 'Email/Username and password required' });
        }

        // Get user from database by email or username
        // SQLite uses ? placeholders, PostgreSQL uses $1
        const isSQLite = process.env.DATABASE_URL?.startsWith('sqlite:');
        const query = isSQLite
            ? 'SELECT * FROM admin_users WHERE email = ? OR username = ?'
            : 'SELECT * FROM admin_users WHERE email = $1 OR username = $1';
        const params = isSQLite ? [loginIdentifier, loginIdentifier] : [loginIdentifier];

        const result = await pool.query(query, params);

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password_hash);
        
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, username: user.username, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Verify token (check if still valid) - with rate limiting
router.get('/verify', verifyLimiter, async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ valid: false });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        res.json({ valid: true, user: decoded });

    } catch (error) {
        res.status(401).json({ valid: false });
    }
});

// Logout endpoint - clears server session (if using cookies)
router.post('/logout', (req, res) => {
    // If using cookies, clear them
    res.clearCookie('admin_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        domain: process.env.COOKIE_DOMAIN || undefined
    });

    res.json({ success: true, message: 'Logged out successfully' });
});

// Create new admin user (requires valid admin token)
router.post('/create-admin', async (req, res) => {
    try {
        // Verify admin token
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        jwt.verify(token, process.env.JWT_SECRET);

        const { username, password, email } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        // Check if username already exists
        const isSQLite = process.env.DATABASE_URL?.startsWith('sqlite:');
        const checkQuery = isSQLite
            ? 'SELECT id FROM admin_users WHERE username = ?'
            : 'SELECT id FROM admin_users WHERE username = $1';
        const existingUser = await pool.query(checkQuery, [username]);

        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user
        if (isSQLite) {
            // SQLite doesn't support RETURNING, so we insert and then query
            await pool.query(
                'INSERT INTO admin_users (username, password_hash, email) VALUES (?, ?, ?)',
                [username, passwordHash, email || null]
            );
            const result = await pool.query(
                'SELECT id, username, email FROM admin_users WHERE username = ?',
                [username]
            );
            var user = result.rows[0];
        } else {
            const result = await pool.query(
                'INSERT INTO admin_users (username, password_hash, email) VALUES ($1, $2, $3) RETURNING id, username, email',
                [username, passwordHash, email || null]
            );
            var user = result.rows[0];
        }

        res.json({
            success: true,
            message: 'Admin user created successfully',
            user: user
        });

    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token' });
        }
        console.error('Create admin error:', error);
        res.status(500).json({ error: 'Failed to create admin user' });
    }
});

module.exports = router;
