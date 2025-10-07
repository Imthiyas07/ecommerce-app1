import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, sparse: true }, // Optional phone for OTP login
    password: { type: String, required: true },
    cartData: { type: Object, default: {} },
    wishlistItems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'product' }],
    isBlocked: { type: Boolean, default: false },
    resetOTP: { type: String },
    resetOTPExpiry: { type: Date },
    resetOTPVerified: { type: Boolean, default: false },
    phoneOTP: { type: String }, // OTP for phone verification
    phoneOTPExpiry: { type: Date },
    profile: {
        phone: { type: String },
        location: { type: String },
        favoriteCategories: [{ type: String }],
        preferredBrands: [{ type: String }],
        budgetRange: { type: String },
        stylePreferences: [{ type: String }],
        recommendationSettings: {
            enabled: { type: Boolean, default: true },
            frequency: { type: String, default: 'weekly' },
            notifications: {
                email: { type: Boolean, default: true },
                sms: { type: Boolean, default: false },
                inApp: { type: Boolean, default: true }
            }
        },
        accessibilitySettings: {
            language: { type: String, default: 'en' },
            darkMode: { type: Boolean, default: false },
            fontSize: { type: String, default: 'medium' }
        },
        privacySettings: {
            dataSharing: { type: Boolean, default: false },
            adPersonalization: { type: Boolean, default: true },
            twoFactorAuth: { type: Boolean, default: false }
        }
    }
}, { minimize: false, timestamps: true })

const userModel = mongoose.models.user || mongoose.model('user',userSchema);

export default userModel
