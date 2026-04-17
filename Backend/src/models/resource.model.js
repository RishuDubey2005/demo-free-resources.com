const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
    branch: {
        type: String,
        enum: ['EE', 'ME', 'CE'],
        required: true
    },
    semester: {
        type: Number,
        min: 1,
        max: 8,
        required: true
    },
    subjectCode: {
        type: String,
        required: true,
        trim: true
    },
    subjectName: {
        type: String,
        required: true,
        trim: true
    },
    // Part number auto-assigned: 1, 2, 3...
    partNumber: {
        type: Number,
        default: 1
    },
    driveFileId: {
        type: String,
        required: true
    },
    // Serve via proxy, not direct share link
    fileName: {
        type: String,
        required: true
    },
    fileSize: {
        type: Number  // in bytes, after compression
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    uploaderRole: {
        type: String,
        enum: ['Professor', 'Admin'],
        required: true
    },
    // Pinned = never auto-deleted
    isPinned: {
        type: Boolean,
        default: false
    },
    // Alert sent flag (6 months old)
    alertSent: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

const resourceModel = mongoose.model('resource', resourceSchema);
module.exports = resourceModel;