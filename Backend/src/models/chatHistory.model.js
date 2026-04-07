const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    role: { type: String, enum: ['user', 'model'] },
    text: { type: String }
}, { _id: false });

const chatHistorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
        unique: true
    },
    messages: [messageSchema],
    // TTL index: MongoDB auto-deletes after 3 hours
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 3*60*60 * 1000),
        index: { expires: 0 }
    }
}, { timestamps: true });

const chatHistoryModel = mongoose.model('chathistory', chatHistorySchema);
module.exports = chatHistoryModel;