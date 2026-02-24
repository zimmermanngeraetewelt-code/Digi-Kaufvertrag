const express = require('express');
const router = express.Router();
const { User } = require('../models');
const { generateToken, hashPassword, comparePassword } = require('../utils/auth');
const { protect, authorize } = require('../middleware/auth');

// @desc    Auth user & get token
// @route   POST /api/auth/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    console.log(`Login attempt for: ${email}`);

    try {
        const user = await User.findOne({ where: { email } });

        if (!user) {
            console.log(`User not found: ${email}`);
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const isMatch = await comparePassword(password, user.passwordHash);
        if (isMatch) {
            console.log(`Login successful for: ${email}`);
            res.json({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                defaultSignature: user.defaultSignature,
                token: generateToken(user),
            });
        } else {
            console.log(`Invalid password for: ${email}`);
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error(`Login error: ${error.message}`);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Register a new user (Restricted to Admin)
// @route   POST /api/auth/register
router.post('/register', protect, authorize('Admin'), async (req, res) => {
    const { name, email, password, role } = req.body;

    try {
        const userExists = await User.findOne({ where: { email } });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const passwordHash = await hashPassword(password);

        const user = await User.create({
            name,
            email,
            passwordHash,
            role: role || 'Technician',
        });

        if (user) {
            res.status(201).json({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get all users
// @route   GET /api/auth/users
router.get('/users', protect, authorize('Admin'), async (req, res) => {
    try {
        const users = await User.findAll({ attributes: { exclude: ['passwordHash'] } });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Delete a user
// @route   DELETE /api/auth/users/:id
router.delete('/users/:id', protect, authorize('Admin'), async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (user) {
            await user.destroy();
            res.json({ message: 'User removed' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update default signature
// @route   PUT /api/auth/signature
router.put('/signature', protect, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);
        if (user) {
            user.defaultSignature = req.body.signature;
            await user.save();
            res.json({ message: 'Signature updated', defaultSignature: user.defaultSignature });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
