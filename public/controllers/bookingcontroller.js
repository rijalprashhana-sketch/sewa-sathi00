const Booking = require('../models/Booking');
const Message = require('../models/Message');
const User = require('../models/User');

// @desc    Create a new booking
// @route   POST /api/bookings
const createBooking = async (req, res) => {
    try {
        const {
            worker,
            service,
            date,
            timeSlot,
            location,
            amount,
            description
        } = req.body;

        // Check if worker exists and is available
        const workerExists = await User.findOne({ 
            _id: worker, 
            role: 'worker',
            isAvailable: true 
        });

        if (!workerExists) {
            return res.status(400).json({
                success: false,
                message: 'Worker not found or not available'
            });
        }

        // Create booking
        const booking = await Booking.create({
            customer: req.user.id, // From auth middleware
            worker,
            service,
            date,
            timeSlot,
            location,
            amount,
            description,
            status: 'pending'
        });

        // Populate booking details
        const populatedBooking = await Booking.findById(booking._id)
            .populate('customer', 'name email phone')
            .populate('worker', 'name profession phone')
            .populate('service', 'name');

        // Send message notification to worker
        const message = await Message.create({
            booking: booking._id,
            sender: req.user.id,
            receiver: worker,
            message: `New booking request for ${populatedBooking.service.name} on ${new Date(date).toLocaleDateString()}`,
            type: 'booking_request',
            status: 'sent'
        });

        // Emit socket event for real-time notification (if using socket.io)
        // io.to(worker).emit('new_booking_request', { booking: populatedBooking, message });

        res.status(201).json({
            success: true,
            data: {
                booking: populatedBooking,
                notification: message
            },
            message: 'Booking request sent to worker successfully!'
        });

    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// @desc    Get worker's messages (notifications)
// @route   GET /api/bookings/messages
const getWorkerMessages = async (req, res) => {
    try {
        const messages = await Message.find({ 
            receiver: req.user.id,
            type: 'booking_request'
        })
        .populate('sender', 'name')
        .populate({
            path: 'booking',
            populate: [
                { path: 'service', select: 'name' },
                { path: 'customer', select: 'name phone location' }
            ]
        })
        .sort('-createdAt');

        // Mark messages as delivered
        await Message.updateMany(
            { receiver: req.user.id, status: 'sent' },
            { status: 'delivered' }
        );

        res.json({
            success: true,
            data: messages
        });

    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// @desc    Mark message as read
// @route   PUT /api/bookings/messages/:messageId/read
const markMessageAsRead = async (req, res) => {
    try {
        const message = await Message.findById(req.params.messageId);

        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }

        // Check if the message belongs to the user
        if (message.receiver.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to access this message'
            });
        }

        message.isRead = true;
        message.readAt = Date.now();
        message.status = 'read';
        await message.save();

        res.json({
            success: true,
            data: message,
            message: 'Message marked as read'
        });

    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// @desc    Update booking status (worker response)
// @route   PUT /api/bookings/:bookingId/status
const updateBookingStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const booking = await Booking.findById(req.params.bookingId);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Check if worker owns this booking
        if (booking.worker.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized'
            });
        }

        booking.status = status;
        await booking.save();

        // Send confirmation message to customer
        if (status === 'confirmed') {
            await Message.create({
                booking: booking._id,
                sender: req.user.id,
                receiver: booking.customer,
                message: `Your booking has been confirmed!`,
                type: 'booking_confirmation'
            });
        }

        res.json({
            success: true,
            data: booking,
            message: `Booking ${status} successfully!`
        });

    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

module.exports = {
    createBooking,
    getWorkerMessages,
    markMessageAsRead,
    updateBookingStatus
};