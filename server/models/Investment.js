const mongoose = require('mongoose');

const investmentHistorySchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const investmentSchema = new mongoose.Schema({
    investorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Investor',
        required: true
    },
    startupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Startup',
        required: true
    },
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    history: [investmentHistorySchema],
    timestamp: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Add index to improve query performance
investmentSchema.index({ investorId: 1, eventId: 1 });
investmentSchema.index({ startupId: 1, eventId: 1 });

module.exports = mongoose.model('Investment', investmentSchema);
