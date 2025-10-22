const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../config/database-local');
const { requireAuth, requireRole } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const logger = require('../config/logger');

const router = express.Router();

// Validation rules for user creation/update
const userValidationRules = [
    body('email').isEmail().normalizeEmail(),
    body('username').trim().isLength({ min: 3, max: 50 }),
    body('role').optional().isIn(['admin', 'editor', 'viewer'])
];

const passwordValidationRules = [
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
];

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all admin users
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of admin users
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.get('/users', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        const isSQLite = process.env.DATABASE_URL?.startsWith('sqlite:');
        const query = 'SELECT id, username, email, role, created_at FROM admin_users ORDER BY created_at DESC';

        const result = await pool.query(query, []);

        logger.info('Admin users list retrieved', {
            requestedBy: req.user.email,
            userCount: result.rows.length
        });

        res.json({
            success: true,
            users: result.rows
        });

    } catch (error) {
        logger.error('Error fetching admin users', { error: error.message });
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

/**
 * @swagger
 * /api/admin/users:
 *   post:
 *     summary: Create new admin user
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [admin, editor, viewer]
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.post('/users', requireAuth, requireRole('admin'), [...userValidationRules, ...passwordValidationRules], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, email, password, role } = req.body;

        // Check if user already exists
        const isSQLite = process.env.DATABASE_URL?.startsWith('sqlite:');
        const checkQuery = isSQLite
            ? 'SELECT id FROM admin_users WHERE email = ? OR username = ?'
            : 'SELECT id FROM admin_users WHERE email = $1 OR username = $2';
        const checkParams = isSQLite ? [email, username] : [email, username];

        const existingUser = await pool.query(checkQuery, checkParams);

        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'User with this email or username already exists' });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user
        let newUser;
        if (isSQLite) {
            await pool.query(
                'INSERT INTO admin_users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
                [username, email, passwordHash, role || 'viewer']
            );
            const result = await pool.query(
                'SELECT id, username, email, role, created_at FROM admin_users WHERE email = ?',
                [email]
            );
            newUser = result.rows[0];
        } else {
            const result = await pool.query(
                'INSERT INTO admin_users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role, created_at',
                [username, email, passwordHash, role || 'viewer']
            );
            newUser = result.rows[0];
        }

        logger.info('New admin user created', {
            createdBy: req.user.email,
            newUser: { id: newUser.id, username: newUser.username, email: newUser.email, role: newUser.role }
        });

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            user: newUser
        });

    } catch (error) {
        logger.error('Error creating admin user', { error: error.message });
        res.status(500).json({ error: 'Failed to create user' });
    }
});

/**
 * @swagger
 * /api/admin/users/{id}:
 *   put:
 *     summary: Update admin user
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [admin, editor, viewer]
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: User not found
 */
router.put('/users/:id', requireAuth, requireRole('admin'), userValidationRules, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id } = req.params;
        const { username, email, password, role } = req.body;

        // Check if user exists
        const isSQLite = process.env.DATABASE_URL?.startsWith('sqlite:');
        const checkQuery = isSQLite
            ? 'SELECT id FROM admin_users WHERE id = ?'
            : 'SELECT id FROM admin_users WHERE id = $1';

        const existingUser = await pool.query(checkQuery, [id]);

        if (existingUser.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Prevent users from removing their own admin role
        if (parseInt(id) === req.user.id && role && role !== 'admin') {
            return res.status(400).json({ error: 'You cannot remove your own admin role' });
        }

        // Build update query dynamically
        let updateFields = [];
        let updateValues = [];
        let paramIndex = 1;

        if (username) {
            updateFields.push(isSQLite ? `username = ?` : `username = $${paramIndex++}`);
            updateValues.push(username);
        }
        if (email) {
            updateFields.push(isSQLite ? `email = ?` : `email = $${paramIndex++}`);
            updateValues.push(email);
        }
        if (password) {
            const passwordHash = await bcrypt.hash(password, 10);
            updateFields.push(isSQLite ? `password_hash = ?` : `password_hash = $${paramIndex++}`);
            updateValues.push(passwordHash);
        }
        if (role) {
            updateFields.push(isSQLite ? `role = ?` : `role = $${paramIndex++}`);
            updateValues.push(role);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        // Add id to params
        updateValues.push(id);

        const updateQuery = isSQLite
            ? `UPDATE admin_users SET ${updateFields.join(', ')} WHERE id = ?`
            : `UPDATE admin_users SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`;

        await pool.query(updateQuery, updateValues);

        // Fetch updated user
        const selectQuery = isSQLite
            ? 'SELECT id, username, email, role, created_at FROM admin_users WHERE id = ?'
            : 'SELECT id, username, email, role, created_at FROM admin_users WHERE id = $1';

        const result = await pool.query(selectQuery, [id]);
        const updatedUser = result.rows[0];

        logger.info('Admin user updated', {
            updatedBy: req.user.email,
            updatedUser: { id: updatedUser.id, username: updatedUser.username, email: updatedUser.email, role: updatedUser.role }
        });

        res.json({
            success: true,
            message: 'User updated successfully',
            user: updatedUser
        });

    } catch (error) {
        logger.error('Error updating admin user', { error: error.message });
        res.status(500).json({ error: 'Failed to update user' });
    }
});

/**
 * @swagger
 * /api/admin/users/{id}:
 *   delete:
 *     summary: Delete admin user
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       400:
 *         description: Cannot delete own account
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: User not found
 */
router.delete('/users/:id', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        const { id } = req.params;

        // Prevent users from deleting themselves
        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ error: 'You cannot delete your own account' });
        }

        // Check if user exists
        const isSQLite = process.env.DATABASE_URL?.startsWith('sqlite:');
        const checkQuery = isSQLite
            ? 'SELECT id, username, email FROM admin_users WHERE id = ?'
            : 'SELECT id, username, email FROM admin_users WHERE id = $1';

        const existingUser = await pool.query(checkQuery, [id]);

        if (existingUser.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userToDelete = existingUser.rows[0];

        // Delete user
        const deleteQuery = isSQLite
            ? 'DELETE FROM admin_users WHERE id = ?'
            : 'DELETE FROM admin_users WHERE id = $1';

        await pool.query(deleteQuery, [id]);

        logger.warn('Admin user deleted', {
            deletedBy: req.user.email,
            deletedUser: { id: userToDelete.id, username: userToDelete.username, email: userToDelete.email }
        });

        res.json({
            success: true,
            message: 'User deleted successfully'
        });

    } catch (error) {
        logger.error('Error deleting admin user', { error: error.message });
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

module.exports = router;
