const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    name:         { type: String,  required: true },
    email:        { type: String,  required: true, unique: true, lowercase: true },
    password:     { type: String,  required: true, select: false },
    role:         { type: String,  enum: ['customer','worker'], default: 'customer' },
    phone:        { type: String,  required: true },
    city:         { type: String,  default: '' },
    profession:   { type: String },
    category:     { type: String },   // service category key: plumbing, electrical, health, etc.
    experience:   { type: Number },
    hourlyRate:   { type: Number },
    isAvailable:  { type: Boolean, default: true },
    skills:       [{ type: String }],
    rating:       { type: Number,  default: 0 },
    completedJobs:{ type: Number,  default: 0 },
    location:     { type: String },
    createdAt:    { type: Date,    default: Date.now }
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Compare passwords
UserSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
