const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['booking_request', 'booking_confirmation', 'booking_cancelled', 'general'],
        default: 'booking_request'
    },
    isRead: {
        type: Boolean,
        default: false
    },
    readAt: Date,
    status: {
        type: String,
        enum: ['sent', 'delivered', 'read'],
        default: 'sent'
    }
}, {
    timestamps: true
});

// Index for faster queries
messageSchema.index({ receiver: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);