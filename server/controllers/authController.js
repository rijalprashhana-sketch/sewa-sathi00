const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

// @desc    Register a new user (customer or worker)
// @route   POST /api/auth/register
const registerUser = async (req, res) => {
    try {
        const { 
            name, 
            email, 
            password, 
            phone,
            city,
            role,
            // Worker specific fields
            profession,
            category,
            experience,
            hourlyRate,
            skills,
            location 
        } = req.body;

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ 
                success: false, 
                message: 'User already exists with this email' 
            });
        }

        // Create user object based on role
        const userData = {
            name,
            email,
            password,
            phone,
            role: role || 'customer',
            city: city || '',
            location: location || ''
        };

        // Add worker-specific fields if role is worker
        if (role === 'worker') {
            if (!profession || !category) {
                return res.status(400).json({
                    success: false,
                    message: 'Please provide profession and service category for worker'
                });
            }
            userData.profession = profession;
            userData.category   = category;
            userData.experience = parseInt(experience) || 0;
            userData.hourlyRate = parseFloat(hourlyRate) || 0;
            userData.skills     = skills || [];
        }

        // Create user
        const user = await User.create(userData);

        if (user) {
            // Remove password from response
            const userResponse = user.toObject();
            delete userResponse.password;

            res.status(201).json({
                success: true,
                data: {
                    user: userResponse,
                    token: generateToken(user._id, user.role)
                },
                message: `${role === 'worker' ? 'Worker' : 'Customer'} registered successfully!`
            });
        }
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check for user email and include password field
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid email or password' 
            });
        }

        // Check password
        const isPasswordMatch = await user.comparePassword(password);

        if (!isPasswordMatch) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid email or password' 
            });
        }

        // Remove password from response
        const userResponse = user.toObject();
        delete userResponse.password;

        res.json({
            success: true,
            data: {
                user: userResponse,
                token: generateToken(user._id, user.role)
            },
            message: 'Login successful!'
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// @desc    Get current user profile
// @route   GET /api/auth/profile
const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

module.exports = {
    registerUser,
    loginUser,
    getProfile
}; 
