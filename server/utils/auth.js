const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const SECRET = process.env.JWT_SECRET || 'supersecretkey';

const generateToken = (user) => {
    return jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        SECRET,
        { expiresIn: '24h' }
    );
};

const hashPassword = async (password) => {
    return await bcrypt.hash(password, 10);
};

const comparePassword = async (password, hashed) => {
    return await bcrypt.compare(password, hashed);
};

module.exports = {
    generateToken,
    hashPassword,
    comparePassword,
    SECRET
};
