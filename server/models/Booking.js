const mongoose = require("mongoose");

const BookingSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  workerId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  serviceId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Service', default: null },
  bookingDate:{ type: Date, required: true },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'refunded'], default: 'pending' },
  amount: Number,
  address: String,
  notes: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Booking", BookingSchema);
