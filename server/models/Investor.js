const mongoose = require('mongoose');

const investorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    remainingBudget: {
        type: Number,
        required: true,
        min: 0
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Investor', investorSchema);
