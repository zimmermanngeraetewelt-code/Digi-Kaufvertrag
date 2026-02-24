const jwt = require('jsonwebtoken');
const { SECRET } = require('../utils/auth');
const { User } = require('../models');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, SECRET);

            req.user = await User.findByPk(decoded.id);
            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }
            return next();
        } catch (error) {
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: `Role ${req.user.role} is not authorized` });
        }
        next();
    };
};

module.exports = { protect, authorize };
