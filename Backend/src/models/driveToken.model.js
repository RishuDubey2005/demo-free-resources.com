const mongoose = require('mongoose');

const driveTokenSchema = new mongoose.Schema({
    label: {
        type: String,
        enum: ['LOST', 'EE', 'ME', 'CE'],
        required: true,
        unique: true
    },
    refreshToken: {
        type: String,
        required: true
    },
    lastChecked: {
        type: Date,
        default: null
    },
    lastStatus: {
        type: String,
        enum: ['active', 'expired', 'error', 'unknown'],
        default: 'unknown'
    },
    lastError: {
        type: String,
        default: null
    }
}, { timestamps: true });

const driveTokenModel = mongoose.model('drivetoken', driveTokenSchema);
module.exports = driveTokenModel;