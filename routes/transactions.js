
const express = require('express');
const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');

const router = express.Router();

// Require a logged-in user for every transaction route.
// Authentication will be implemented in the next stages.
function requireAuth(req, res, next) {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({
            success: false,
            message: 'Please log in to manage transactions.',
        });
    }

    next();
}

router.use(requireAuth);

// GET /api/transactions
// Return only the logged-in user's transactions.
router.get('/', async (req, res) => {
    try {
        const transactions = await Transaction.find({
            user: req.session.userId,
        }).sort({ date: -1, createdAt: -1 });

        res.json({
            success: true,
            count: transactions.length,
            data: transactions,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Unable to retrieve transactions.',
        });
    }
});

// POST /api/transactions
// Create a transaction belonging to the logged-in user.
router.post('/', async (req, res) => {
    try {
        const { description, type, amount, category, date } = req.body;

        if (
            typeof description !== 'string' ||
            !description.trim() ||
            description.trim().length > 100 ||
            !['income', 'expense'].includes(type) ||
            typeof amount !== 'number' ||
            !Number.isFinite(amount) ||
            amount <= 0 ||
            typeof category !== 'string' ||
            !category.trim() ||
            category.trim().length > 50 ||
            !date ||
            !Number.isFinite(Date.parse(date))
        ) {
            return res.status(400).json({
                success: false,
                message: 'Please provide valid transaction details.',
            });
        }

        const transaction = await Transaction.create({
            user: req.session.userId,
            description: description.trim(),
            type,
            amount,
            category: category.trim(),
            date: new Date(date),
        });

        res.status(201).json({
            success: true,
            message: 'Transaction created successfully.',
            data: transaction,
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Transaction validation failed.',
            });
        }

        res.status(500).json({
            success: false,
            message: 'Unable to create transaction.',
        });
    }
});

// PUT /api/transactions/:id
// Update only a transaction owned by the logged-in user.
router.put('/:id', async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid transaction ID.',
            });
        }

        const { description, type, amount, category, date } = req.body;

        if (
            typeof description !== 'string' ||
            !description.trim() ||
            description.trim().length > 100 ||
            !['income', 'expense'].includes(type) ||
            typeof amount !== 'number' ||
            !Number.isFinite(amount) ||
            amount <= 0 ||
            typeof category !== 'string' ||
            !category.trim() ||
            category.trim().length > 50 ||
            !date ||
            !Number.isFinite(Date.parse(date))
        ) {
            return res.status(400).json({
                success: false,
                message: 'Please provide valid transaction details.',
            });
        }

        const transaction = await Transaction.findOneAndUpdate(
            {
                _id: req.params.id,
                user: req.session.userId,
            },
            {
                description: description.trim(),
                type,
                amount,
                category: category.trim(),
                date: new Date(date),
            },
            {
                new: true,
                runValidators: true,
            }
        );

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found.',
            });
        }

        res.json({
            success: true,
            message: 'Transaction updated successfully.',
            data: transaction,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Unable to update transaction.',
        });
    }
});

// DELETE /api/transactions/:id
// Delete only a transaction owned by the logged-in user.
router.delete('/:id', async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid transaction ID.',
            });
        }

        const transaction = await Transaction.findOneAndDelete({
            _id: req.params.id,
            user: req.session.userId,
        });

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found.',
            });
        }

        res.json({
            success: true,
            message: 'Transaction deleted successfully.',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Unable to delete transaction.',
        });
    }
});

module.exports = router;
