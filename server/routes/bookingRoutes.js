const express = require('express');
const router = express.Router();
const {
    createBooking,
    getCustomerBookings,
    getWorkerBookings,
    getWorkerMessages,
    getCustomerMessages,
    markMessageAsRead,
    updateBookingStatus
} = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');

// All booking routes are protected
router.use(protect);

// Customer routes
router.post('/', createBooking);
router.get('/my', getCustomerBookings);
router.get('/customer-messages', getCustomerMessages);

// Worker routes
router.get('/worker-bookings', getWorkerBookings);
router.get('/messages', getWorkerMessages);
router.put('/messages/:messageId/read', markMessageAsRead);
router.put('/:bookingId/status', updateBookingStatus);

module.exports = router;
