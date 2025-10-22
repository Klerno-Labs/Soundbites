const jwt = require('jsonwebtoken');
const logger = require('../config/logger');

/**
 * Middleware to verify JWT token
 * Checks HttpOnly cookie first, then Authorization header
 */
function requireAuth(req, res, next) {
    try {
        // Try to get token from HttpOnly cookie first (most secure)
        let token = req.cookies?.admin_token;

        // Fall back to Authorization header for backward compatibility
        if (!token) {
            token = req.headers.authorization?.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Attach user info to request
        next();
    } catch (error) {
        logger.warn('Invalid authentication token', { error: error.message });
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired' });
        }
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

/**
 * Middleware to check if user has required role
 * @param {string|string[]} allowedRoles - Role(s) that can access this route
 */
function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const userRole = req.user.role || 'viewer';

        if (!allowedRoles.includes(userRole)) {
            logger.warn('Unauthorized role access attempt', {
                user: req.user.email,
                userRole,
                requiredRoles: allowedRoles
            });
            return res.status(403).json({
                error: 'Insufficient permissions',
                required: allowedRoles,
                current: userRole
            });
        }

        next();
    };
}

// Legacy export for backward compatibility
const authMiddleware = requireAuth;

module.exports = {
    requireAuth,
    requireRole,
    authMiddleware // Default export
};
module.exports.default = requireAuth;
