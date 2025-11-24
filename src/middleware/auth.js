const jwt = require('jsonwebtoken');

// JWT Secret - warn if using default in production
const JWT_SECRET = process.env.JWT_SECRET || 'apex_nexus_secret_key_change_in_production';

if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
    console.warn('WARNING: Using default JWT_SECRET in production is insecure! Set JWT_SECRET environment variable.');
}

const authMiddleware = (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ error: 'No authentication token provided' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid authentication token' });
    }
};

module.exports = authMiddleware;
