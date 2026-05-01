const jwt = require('jsonwebtoken');
const config = require('../config/config');

const auth = (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ success: false, message: 'No authentication token provided' });
        }

        const decoded = jwt.verify(token, config.jwtSecret);
        req.user = decoded; // Should contain user_id, role_id, etc.
        next();
    } catch (error) {
        res.status(401).json({ success: false, message: 'Please authenticate' });
    }
};

const checkRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || req.user.role_id === undefined) {
            return res.status(403).json({ success: false, message: 'Access denied: User role not defined' });
        }
        
        if (!allowedRoles.includes(req.user.role_id)) {
            return res.status(403).json({ success: false, message: 'Access denied: Insufficient privileges' });
        }
        next();
    };
};

module.exports = { auth, checkRole };
