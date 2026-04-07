const mongoose = require('mongoose');

const aiUsageSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    date: {
        type: String,  // "YYYY-MM-DD"
        required: true
    },
    count: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

// Unique per user per day
aiUsageSchema.index({ userId: 1, date: 1 }, { unique: true });

const aiUsageModel = mongoose.model('aiusage', aiUsageSchema);
module.exports = aiUsageModel;