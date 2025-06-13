const mongoose = require('mongoose');

const startupSchema = new mongoose.Schema({
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
    logoUrl: {
        type: String,
        trim: true,
        default: null // Optional field
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Startup', startupSchema);
