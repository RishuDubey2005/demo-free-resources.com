const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema({
    count: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

const visitModel = mongoose.model('visit', visitSchema);
module.exports = visitModel;