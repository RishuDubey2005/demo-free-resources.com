const mongoose = require('mongoose');

const lostItemSchema = new mongoose.Schema({
    finderName: {
        type: String,
        required: true,
        trim: true
    },
    finderMobile: {
        type: String,
        required: true,
        trim: true
    },
    finderLocation: {
        type: String,
        required: true,
        trim: true
    },
    foundLocation: {
        type: String,
        required: true,
        trim: true
    },
    caption: {
        type: String,
        required: true,
        trim: true
    },
    // Google Drive file info
    driveFileId: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String,
        required: true
    },
    driveFolderIndex: {
        type: Number,
        required: true
    },
    // Return status
    isReturned: {
        type: Boolean,
        default: false
    },
    returnedToName: {
        type: String,
        default: null
    },
    returnedToDepartment: {
        type: String,
        default: null
    },
    returnedToContact: {
        type: String,
        default: null
    },
    returnedAt: {
        type: Date,
        default: null
    },
    // Uploader identifier
    uploadedBy: {
        type: String,
        required: true
    },
    // Track if seen by users
    seenBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    }]
}, { timestamps: true });

const lostItemModel = mongoose.model('lostitem', lostItemSchema);
module.exports = lostItemModel;