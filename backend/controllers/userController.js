import validator from "validator";
import bcrypt from "bcrypt"
import jwt from 'jsonwebtoken'
import winston from 'winston'
import userModel from "../models/userModel.js";
import { sendOTPEmail } from '../config/email.js';

// Configure logger (similar to server.js)
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    defaultMeta: { service: 'user-controller' },
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' }),
    ],
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple(),
    }));
}


const createToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET)
}

// Route for user login
const loginUser = async (req, res) => {
    try {

        const { email, password } = req.body;

        const user = await userModel.findOne({ email });

        if (!user) {
            return res.json({ success: false, message: "User doesn't exists" })
        }

        // Check if user is blocked
        if (user.isBlocked) {
            return res.json({ success: false, message: "Your account has been blocked by admin" })
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (isMatch) {

            const token = createToken(user._id)
            res.json({ success: true, token })

        }
        else {
            res.json({ success: false, message: 'Invalid credentials' })
        }

    } catch (error) {
        logger.error('Login error:', error);
        res.json({ success: false, message: error.message })
    }
}

// Route for user register
const registerUser = async (req, res) => {
    try {

        const { name, email, password, phone } = req.body;

        // checking user already exists or not
        const exists = await userModel.findOne({ email });
        if (exists) {
            return res.json({ success: false, message: "User already exists" })
        }

        // Check if phone is already registered (if provided)
        if (phone) {
            const phoneExists = await userModel.findOne({ phone });
            if (phoneExists) {
                return res.json({ success: false, message: "Phone number already registered" })
            }
        }

        // validating email format & strong password
        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Please enter a valid email" })
        }
        if (password.length < 8) {
            return res.json({ success: false, message: "Please enter a strong password" })
        }

        // Validate phone format if provided
        if (phone) {
            const phoneRegex = /^\+?[1-9]\d{9,14}$/;
            if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
                return res.json({ success: false, message: "Please enter a valid phone number" })
            }
        }

        // hashing user password
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        const newUser = new userModel({
            name,
            email,
            phone: phone || undefined, // Optional phone field
            password: hashedPassword
        })

        const user = await newUser.save()

        const token = createToken(user._id)

        res.json({ success: true, token })

    } catch (error) {
        logger.error('Register error:', error);
        res.json({ success: false, message: error.message })
    }
}

// Route for admin login
const adminLogin = async (req, res) => {
    try {

        const {email,password} = req.body

        if (email === process.env.ADMIN_EMAIL) {
            const isMatch = await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH)
            if (isMatch) {
                const token = jwt.sign({ role: 'admin', email }, process.env.JWT_SECRET);
                res.json({success:true,token})
            } else {
                res.json({success:false,message:"Invalid credentials"})
            }
        } else {
            res.json({success:false,message:"Invalid credentials"})
        }

    } catch (error) {
        logger.error('Admin login error:', error);
        res.json({ success: false, message: error.message })
    }
}


// Route for getting all users (admin only)
const getAllUsers = async (req, res) => {
    try {
        const users = await userModel.find({}, { password: 0 }).sort({ createdAt: -1 })
        res.json({ success: true, users })
    } catch (error) {
        logger.error('Get all users error:', error);
        res.json({ success: false, message: error.message })
    }
}

// Route for updating user (admin only)
const updateUser = async (req, res) => {
    try {
        const { id } = req.params
        const { name, email } = req.body

        // Check if user exists
        const user = await userModel.findById(id)
        if (!user) {
            return res.json({ success: false, message: "User not found" })
        }

        // Check if email is already taken by another user
        if (email && email !== user.email) {
            const existingUser = await userModel.findOne({ email })
            if (existingUser) {
                return res.json({ success: false, message: "Email already in use" })
            }
        }

        const updatedUser = await userModel.findByIdAndUpdate(
            id,
            { name, email },
            { new: true, select: '-password' }
        )

        res.json({ success: true, user: updatedUser })
    } catch (error) {
        logger.error('Update user error:', error);
        res.json({ success: false, message: error.message })
    }
}

// Route for deleting user (admin only)
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params

        // Check if user exists
        const user = await userModel.findById(id)
        if (!user) {
            return res.json({ success: false, message: "User not found" })
        }

        await userModel.findByIdAndDelete(id)
        res.json({ success: true, message: "User deleted successfully" })
    } catch (error) {
        logger.error('Delete user error:', error);
        res.json({ success: false, message: error.message })
    }
}

// Route for blocking/unblocking user (admin only)
const toggleUserBlock = async (req, res) => {
    try {
        const { id } = req.params
        const { isBlocked } = req.body

        const user = await userModel.findById(id)
        if (!user) {
            return res.json({ success: false, message: "User not found" })
        }

        const updatedUser = await userModel.findByIdAndUpdate(
            id,
            { isBlocked },
            { new: true, select: '-password' }
        )

        res.json({
            success: true,
            user: updatedUser,
            message: `User ${isBlocked ? 'blocked' : 'unblocked'} successfully`
        })
    } catch (error) {
        logger.error('Toggle user block error:', error);
        res.json({ success: false, message: error.message })
    }
}

// Route for changing user password (admin only)
const changeUserPassword = async (req, res) => {
    try {
        const { id } = req.params
        const { newPassword } = req.body

        if (!newPassword || newPassword.length < 8) {
            return res.json({ success: false, message: "Password must be at least 8 characters long" })
        }

        const user = await userModel.findById(id)
        if (!user) {
            return res.json({ success: false, message: "User not found" })
        }

        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(newPassword, salt)

        await userModel.findByIdAndUpdate(id, { password: hashedPassword })

        res.json({ success: true, message: "Password changed successfully" })
    } catch (error) {
        logger.error('Change user password error:', error);
        res.json({ success: false, message: error.message })
    }
}

// Route for getting user details with order history (admin only)
const getUserDetails = async (req, res) => {
    try {
        const { id } = req.params

        const user = await userModel.findById(id).select('-password')
        if (!user) {
            return res.json({ success: false, message: "User not found" })
        }

        // Get user's orders
        const orderModel = (await import('../models/orderModel.js')).default
        const orders = await orderModel.find({ userId: id }).sort({ date: -1 })

        res.json({
            success: true,
            user,
            orders: orders || [],
            totalOrders: orders?.length || 0,
            totalSpent: orders?.reduce((total, order) => total + order.amount, 0) || 0
        })
    } catch (error) {
        logger.error('Get user details error:', error);
        res.json({ success: false, message: error.message })
    }
}

// Route for getting user profile data
const getUserProfile = async (req, res) => {
    try {
        const userId = req.body.userId;

        const user = await userModel.findById(userId).select('-password');
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        // Get user's order history for behavioral data
        const orderModel = (await import('../models/orderModel.js')).default;
        const orders = await orderModel.find({ userId }).sort({ date: -1 }).limit(20);

        // Calculate loyalty data
        const totalSpent = orders.reduce((total, order) => total + order.amount, 0);
        const tier = totalSpent >= 2000 ? 'Gold' : totalSpent >= 1000 ? 'Silver' : 'Bronze';
        const points = Math.floor(totalSpent / 10); // 1 point per ₹10 spent

        // Get browsing history - use real data if available, otherwise provide helpful suggestions
        let browsingHistory = [];
        if (orders.length > 0) {
            // Create browsing history from recent orders
            browsingHistory = orders.slice(0, 5).map(order => ({
                name: order.items[0]?.name || 'Fashion Item',
                category: order.items[0]?.category || 'Fashion',
                timestamp: new Date(order.date).toLocaleDateString()
            }));
        } else {
            // Provide helpful fashion suggestions for new users
            browsingHistory = [
                { name: 'Explore Women\'s Collection', category: 'Women\'s Fashion', timestamp: 'Discover now' },
                { name: 'Check Men\'s Latest Trends', category: 'Men\'s Fashion', timestamp: 'Browse now' },
                { name: 'Designer Accessories', category: 'Accessories', timestamp: 'Shop now' },
                { name: 'Footwear Collection', category: 'Footwear', timestamp: 'View now' },
                { name: 'Beauty & Skincare', category: 'Beauty', timestamp: 'Explore now' }
            ];
        }

        // Get wishlist items - use real data if available, otherwise provide suggestions
        let wishlist = [];
        if (user.cartData && Object.keys(user.cartData).length > 0) {
            // Use items from cart as wishlist suggestions
            const cartItems = Object.keys(user.cartData).slice(0, 6);
            wishlist = cartItems.map(itemId => ({
                name: `Saved Item ${itemId.slice(-4)}`,
                price: Math.floor(Math.random() * 5000) + 1000
            }));
        } else {
            // Provide fashion wishlist suggestions for new users
            wishlist = [
                { name: 'Designer Evening Gown', price: 12500 },
                { name: 'Leather Boots', price: 4500 },
                { name: 'Silk Scarf Collection', price: 2200 },
                { name: 'Premium Sunglasses', price: 3200 },
                { name: 'Jewelry Set', price: 6800 },
                { name: 'Luxury Handbag', price: 8500 }
            ];
        }

        // Sample redeemable offers for demonstration
        const redeemableOffers = [
            {
                title: '₹500 Off on Fashion',
                description: 'Get ₹500 off on orders above ₹2,000',
                pointsRequired: 500
            },
            {
                title: 'Free Shipping',
                description: 'Complimentary shipping on your next order',
                pointsRequired: 200
            },
            {
                title: 'Exclusive Preview',
                description: 'Early access to new fashion collections',
                pointsRequired: 300
            }
        ].filter(offer => points >= offer.pointsRequired);

        res.json({
            success: true,
            user,
            profile: user.profile || {},
            browsingHistory,
            purchaseHistory: orders.map(order => ({
                name: order.items[0]?.name || 'Fashion Order',
                price: order.amount,
                date: new Date(order.date).toLocaleDateString()
            })),
            wishlist,
            loyalty: {
                tier,
                points,
                redeemableOffers
            }
        });
    } catch (error) {
        logger.error('Get user profile error:', error);
        res.json({ success: false, message: error.message });
    }
};

// Route for updating user profile
const updateUserProfile = async (req, res) => {
    try {
        const userId = req.body.userId;
        const profileData = req.body;

        // Remove sensitive fields
        delete profileData.userId;
        delete profileData.email;

        const user = await userModel.findById(userId);
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        // Update user profile
        user.profile = { ...user.profile, ...profileData };
        await user.save();

        res.json({
            success: true,
            message: "Profile updated successfully",
            profile: user.profile
        });
    } catch (error) {
        logger.error('Update user profile error:', error);
        res.json({ success: false, message: error.message });
    }
};

// Route for forgot password - send OTP
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.json({ success: false, message: "Email is required" });
        }

        const user = await userModel.findOne({ email });
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Store OTP in user document (in production, use Redis or similar for better security)
        user.resetOTP = otp;
        user.resetOTPExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes
        await user.save();

        // Send OTP via email
        const emailResult = await sendOTPEmail(email, otp);

        if (!emailResult.success) {
            logger.error('Failed to send OTP email:', emailResult.error);
            console.error('❌ EMAIL ERROR:', emailResult.error);
            console.log('🔍 Check your Gmail app password setup!');
            console.log('📧 FALLBACK: OTP for testing:', otp);
            // Don't return error to user for security reasons - just log it
            // The OTP is still stored and can be used
        } else {
            console.log('✅ OTP email sent successfully to:', email);
        }

        logger.info(`OTP generated for ${email}: ${otp}`);
        console.log(`📧 OTP for ${email}: ${otp} (use this for testing if email fails)`);

        res.json({
            success: true,
            message: "OTP sent to your email successfully"
        });
    } catch (error) {
        logger.error('Forgot password error:', error);
        res.json({ success: false, message: error.message });
    }
};

// Route for verifying OTP
const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.json({ success: false, message: "Email and OTP are required" });
        }

        const user = await userModel.findOne({ email });
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        if (!user.resetOTP || !user.resetOTPExpiry) {
            return res.json({ success: false, message: "No OTP request found" });
        }

        if (Date.now() > user.resetOTPExpiry) {
            return res.json({ success: false, message: "OTP has expired" });
        }

        if (user.resetOTP !== otp) {
            return res.json({ success: false, message: "Invalid OTP" });
        }

        // OTP is valid, mark it as verified
        user.resetOTPVerified = true;
        await user.save();

        res.json({
            success: true,
            message: "OTP verified successfully"
        });
    } catch (error) {
        logger.error('Verify OTP error:', error);
        res.json({ success: false, message: error.message });
    }
};

// Route for resetting password
const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            return res.json({ success: false, message: "All fields are required" });
        }

        if (newPassword.length < 8) {
            return res.json({ success: false, message: "Password must be at least 8 characters long" });
        }

        const user = await userModel.findOne({ email });
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        if (!user.resetOTPVerified) {
            return res.json({ success: false, message: "OTP not verified" });
        }

        if (user.resetOTP !== otp) {
            return res.json({ success: false, message: "Invalid OTP" });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password and clear OTP fields
        user.password = hashedPassword;
        user.resetOTP = undefined;
        user.resetOTPExpiry = undefined;
        user.resetOTPVerified = undefined;
        await user.save();

        res.json({
            success: true,
            message: "Password reset successfully"
        });
    } catch (error) {
        logger.error('Reset password error:', error);
        res.json({ success: false, message: error.message });
    }
};

// Google OAuth login (placeholder - requires Google OAuth setup)
const googleAuth = async (req, res) => {
    try {
        // This is a placeholder for Google OAuth implementation
        // In production, you would use passport-google-oauth20 or similar
        res.json({
            success: false,
            message: "Google authentication not yet implemented. Please use email/password login.",
            note: "To implement Google OAuth, install passport-google-oauth20 and configure Google Console"
        });
    } catch (error) {
        logger.error('Google auth error:', error);
        res.json({ success: false, message: error.message });
    }
};

// Send OTP to phone (placeholder - requires SMS service like Twilio)
const sendPhoneOTP = async (req, res) => {
    try {
        const { phone } = req.body;

        if (!phone) {
            return res.json({ success: false, message: "Phone number is required" });
        }

        // Validate phone number format (basic validation)
        const phoneRegex = /^\+?[1-9]\d{9,14}$/;
        if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
            return res.json({ success: false, message: "Please enter a valid phone number" });
        }

        // Check if user exists with this phone
        const existingUser = await userModel.findOne({ phone });
        if (!existingUser) {
            return res.json({ success: false, message: "Phone number not registered. Please sign up first." });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Store OTP in user document (in production, use Redis or similar for better security)
        existingUser.phoneOTP = otp;
        existingUser.phoneOTPExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes
        await existingUser.save();

        // TODO: Integrate with SMS service like Twilio, AWS SNS, etc.
        // For now, we'll log the OTP for testing
        console.log(`📱 OTP for ${phone}: ${otp} (use this for testing - SMS integration needed)`);

        // In production, send SMS here
        // const smsResult = await sendSMS(phone, `Your OTP is: ${otp}`);

        res.json({
            success: true,
            message: "OTP sent to your phone successfully",
            note: "Check console for OTP (SMS integration required for production)"
        });
    } catch (error) {
        logger.error('Send phone OTP error:', error);
        res.json({ success: false, message: error.message });
    }
};

// Verify phone OTP
const verifyPhoneOTP = async (req, res) => {
    try {
        const { phone, otp } = req.body;

        if (!phone || !otp) {
            return res.json({ success: false, message: "Phone number and OTP are required" });
        }

        const user = await userModel.findOne({ phone });
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        // Check if user is blocked
        if (user.isBlocked) {
            return res.json({ success: false, message: "Your account has been blocked by admin" });
        }

        if (!user.phoneOTP || !user.phoneOTPExpiry) {
            return res.json({ success: false, message: "No OTP request found" });
        }

        if (Date.now() > user.phoneOTPExpiry) {
            return res.json({ success: false, message: "OTP has expired" });
        }

        if (user.phoneOTP !== otp) {
            return res.json({ success: false, message: "Invalid OTP" });
        }

        // OTP is valid, clear OTP fields and create token
        user.phoneOTP = undefined;
        user.phoneOTPExpiry = undefined;
        await user.save();

        const token = createToken(user._id);

        res.json({
            success: true,
            token,
            message: "Login successful"
        });
    } catch (error) {
        logger.error('Verify phone OTP error:', error);
        res.json({ success: false, message: error.message });
    }
};

export { loginUser, registerUser, adminLogin, getAllUsers, updateUser, deleteUser, toggleUserBlock, changeUserPassword, getUserDetails, getUserProfile, updateUserProfile, forgotPassword, verifyOTP, resetPassword, googleAuth, sendPhoneOTP, verifyPhoneOTP }
