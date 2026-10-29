
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please enter your name.'],
            trim: true,
            maxlength: [80, 'Name cannot exceed 80 characters.'],
        },

        email: {
            type: String,
            required: [true, 'Please enter your email address.'],
            unique: true,
            lowercase: true,
            trim: true,
            maxlength: 254,
            match: [
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                'Please enter a valid email address.',
            ],
        },

        password: {
            type: String,
            required: [true, 'Please enter a password.'],
            minlength: [8, 'Password must contain at least 8 characters.'],
            select: false,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('User', userSchema);
