
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },

        description: {
            type: String,
            required: [true, 'Please enter a description.'],
            trim: true,
            maxlength: [100, 'Description cannot exceed 100 characters.'],
        },

        type: {
            type: String,
            required: true,
            enum: ['income', 'expense'],
        },

        amount: {
            type: Number,
            required: [true, 'Please enter an amount.'],
            min: [0.01, 'Amount must be greater than zero.'],
        },

        category: {
            type: String,
            required: [true, 'Please select a category.'],
            trim: true,
            maxlength: 50,
        },

        date: {
            type: Date,
            required: [true, 'Please select a transaction date.'],
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

transactionSchema.index({ user: 1, date: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);
