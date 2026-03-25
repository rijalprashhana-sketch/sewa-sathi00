const Booking = require('../models/Booking');
const Message = require('../models/Message');
const User = require('../models/User');

// @desc    Create a new booking
// @route   POST /api/bookings
const createBooking = async (req, res) => {
    try {
        const { workerId, serviceType, bookingDate, address, notes, amount } = req.body;

        if (!workerId || !bookingDate || !address) {
            return res.status(400).json({ success: false, message: 'Worker, date and address are required' });
        }

        // Check if worker exists
        const workerExists = await User.findOne({ _id: workerId, role: 'worker' });
        if (!workerExists) {
            return res.status(400).json({ success: false, message: 'Worker not found' });
        }

        // Create booking — use customerId/workerId to match the Booking schema
        const booking = await Booking.create({
            customerId: req.user._id,
            workerId: workerId,
            serviceId: null,   // optional, no separate Service collection needed
            bookingDate: new Date(bookingDate),
            address: address,
            notes: notes || '',
            amount: amount || workerExists.hourlyRate || 0,
            status: 'pending'
        });

        // Send message notification to worker
        await Message.create({
            booking: booking._id,
            sender: req.user._id,
            receiver: workerId,
            message: `New booking request from ${req.user.name} for ${serviceType || workerExists.profession} on ${new Date(bookingDate).toLocaleDateString('en-NP')}. Address: ${address}. ${notes ? 'Note: ' + notes : ''}`,
            type: 'booking_request',
            status: 'sent'
        });

        res.status(201).json({
            success: true,
            data: booking,
            message: 'Booking request sent to worker successfully!'
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get customer bookings
// @route   GET /api/bookings/customer/:customerId
const getCustomerBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ customerId: req.user._id })
            .populate('workerId', 'name profession phone city')
            .sort('-createdAt');
        res.json({ success: true, data: bookings });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get worker bookings
// @route   GET /api/bookings/worker/:workerId
const getWorkerBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ workerId: req.user._id })
            .populate('customerId', 'name phone city')
            .sort('-createdAt');
        res.json({ success: true, data: bookings });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get worker's messages (notifications)
// @route   GET /api/bookings/messages
const getWorkerMessages = async (req, res) => {
    try {
        const messages = await Message.find({ receiver: req.user._id })
            .populate('sender', 'name phone city')
            .populate('booking')
            .sort('-createdAt');

        await Message.updateMany(
            { receiver: req.user._id, status: 'sent' },
            { status: 'delivered' }
        );

        res.json({ success: true, data: messages });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get customer messages (confirmations)
// @route   GET /api/bookings/customer-messages
const getCustomerMessages = async (req, res) => {
    try {
        const messages = await Message.find({ receiver: req.user._id })
            .populate('sender', 'name profession phone')
            .populate('booking')
            .sort('-createdAt');

        res.json({ success: true, data: messages });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Mark message as read
// @route   PUT /api/bookings/messages/:messageId/read
const markMessageAsRead = async (req, res) => {
    try {
        const message = await Message.findById(req.params.messageId);
        if (!message) return res.status(404).json({ success: false, message: 'Message not found' });
        if (message.receiver.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        message.isRead = true;
        message.readAt = Date.now();
        message.status = 'read';
        await message.save();
        res.json({ success: true, data: message });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update booking status (worker response)
// @route   PUT /api/bookings/:bookingId/status
const updateBookingStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const booking = await Booking.findById(req.params.bookingId)
            .populate('customerId', 'name');

        if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
        if (booking.workerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        booking.status = status;
        await booking.save();

        // Send confirmation/cancellation message to customer
        const msgText = status === 'confirmed'
            ? `Your booking has been confirmed by ${req.user.name}! They will arrive on the scheduled date.`
            : status === 'cancelled'
            ? `Your booking has been declined by ${req.user.name}.`
            : `Your booking status has been updated to: ${status}`;

        await Message.create({
            booking: booking._id,
            sender: req.user._id,
            receiver: booking.customerId._id,
            message: msgText,
            type: status === 'confirmed' ? 'booking_confirmation' : 'booking_cancelled'
        });

        res.json({ success: true, data: booking, message: `Booking ${status} successfully!` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    createBooking,
    getCustomerBookings,
    getWorkerBookings,
    getWorkerMessages,
    getCustomerMessages,
    markMessageAsRead,
    updateBookingStatus
};
