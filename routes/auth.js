
const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/User');

const router = express.Router();

// Register a new account
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (
            typeof name !== 'string' ||
            !name.trim() ||
            name.trim().length > 80 ||
            typeof email !== 'string' ||
            email.trim().length > 254 ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
            typeof password !== 'string' ||
            password.length < 8 ||
            password.length > 72
        ) {
            return res.status(400).json({
                success: false,
                message: 'Enter a valid name, email, and password of at least 8 characters.',
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const existingUser = await User.findOne({ email: normalizedEmail });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'An account with this email already exists.',
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
        });

        // Establish a session for the new account.
        req.session.regenerate((sessionError) => {
            if (sessionError) {
                return res.status(500).json({
                    success: false,
                    message: 'Account created, but login could not be started. Please log in.',
                });
            }

            req.session.userId = user._id.toString();

            req.session.save((saveError) => {
                if (saveError) {
                    return res.status(500).json({
                        success: false,
                        message: 'Account created, but login could not be started. Please log in.',
                    });
                }

                return res.status(201).json({
                    success: true,
                    message: 'Account created successfully.',
                    user: {
                        id: user._id,
                        name: user.name,
                        email: user.email,
                    },
                });
            });
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'An account with this email already exists.',
            });
        }

        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Please check your registration details.',
            });
        }

        console.error('Registration error:', error.message);

        res.status(500).json({
            success: false,
            message: 'Unable to create your account.',
        });
    }
});

// Log in to an existing account
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (
            typeof email !== 'string' ||
            typeof password !== 'string' ||
            !email.trim() ||
            password.length === 0 ||
            password.length > 72
        ) {
            return res.status(400).json({
                success: false,
                message: 'Enter your email and password.',
            });
        }

        const user = await User.findOne({
            email: email.trim().toLowerCase(),
        }).select('+password');

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.',
            });
        }

        req.session.regenerate((sessionError) => {
            if (sessionError) {
                return res.status(500).json({
                    success: false,
                    message: 'Unable to start your session.',
                });
            }

            req.session.userId = user._id.toString();

            req.session.save((saveError) => {
                if (saveError) {
                    return res.status(500).json({
                        success: false,
                        message: 'Unable to save your session.',
                    });
                }

                return res.json({
                    success: true,
                    message: 'Login successful.',
                    user: {
                        id: user._id,
                        name: user.name,
                        email: user.email,
                    },
                });
            });
        });
    } catch (error) {
        console.error('Login error:', error.message);

        res.status(500).json({
            success: false,
            message: 'Unable to log in.',
        });
    }
});

// Get the currently logged-in user
router.get('/me', async (req, res) => {
    try {
        if (!req.session || !req.session.userId) {
            return res.status(401).json({
                success: false,
                message: 'You are not logged in.',
            });
        }

        const user = await User.findById(req.session.userId);

        if (!user) {
            req.session.destroy(() => { });

            return res.status(401).json({
                success: false,
                message: 'Account not found. Please log in again.',
            });
        }

        res.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Unable to retrieve account information.',
        });
    }
});

// Log out
router.post('/logout', (req, res) => {
    if (!req.session) {
        return res.json({
            success: true,
            message: 'Logged out successfully.',
        });
    }

    req.session.destroy((error) => {
        if (error) {
            return res.status(500).json({
                success: false,
                message: 'Unable to log out.',
            });
        }

        res.clearCookie('connect.sid');

        res.json({
            success: true,
            message: 'Logged out successfully.',
        });
    });
});

module.exports = router;
