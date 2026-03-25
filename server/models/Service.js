const mongoose = require("mongoose");

const ServiceSchema = new mongoose.Schema({
  serviceName: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  price: { 
    type: Number, 
    required: true 
  },
  workerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  workerName: String,
  category: {
    type: String,
    enum: ['plumbing', 'electrical', 'painting', 'cleaning', 'carpentry', 'other'],
    default: 'other'
  },
  duration: Number,
  rating: {
    type: Number,
    default: 0
  },
  reviews: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: Number,
    comment: String,
    date: { type: Date, default: Date.now }
  }],
  available: {
    type: Boolean,
    default: true
  }
});

module.exports = mongoose.model("Service", ServiceSchema);