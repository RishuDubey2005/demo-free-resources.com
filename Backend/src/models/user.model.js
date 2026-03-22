const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['Student', 'Professor', 'Admin'],
        default: 'Student'
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    lastSeenNotificationTime: {
        type: Date,
        default: null
    },
    lastVisitedAt: {
        type: Date,
        default: null
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    blockReason: {
        type: String,
        default: null
    },
    blockedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        default: null
    },
    blockedAt: {
        type: Date,
        default: null
    },
    mobile: {
        type: String,
        default: null
    },
    rollNo: {
        type: String,
        default: null
    },
    passingYear: {
        type: Number,
        default: null
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other', null],
        default: null
    }
}, { timestamps: true });

const userModel = mongoose.model('user', userSchema);
module.exports = userModel;
