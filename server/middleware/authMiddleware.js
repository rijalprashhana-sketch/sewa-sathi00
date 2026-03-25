const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from token
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                return res.status(401).json({ 
                    success: false, 
                    message: 'User not found' 
                });
            }

            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ 
                success: false, 
                message: 'Not authorized' 
            });
        }
    }

    if (!token) {
        res.status(401).json({ 
            success: false, 
            message: 'Not authorized, no token' 
        });
    }
};

// Role-based authorization
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Role ${req.user.role} is not authorized to access this resource`
            });
        }
        next();
    };
};

module.exports = { protect, authorize };