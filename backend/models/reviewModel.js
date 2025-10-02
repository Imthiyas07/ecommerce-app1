import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'product', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true, maxLength: 1000 },
    images: [{ type: String }], // Optional review images
    recommend: { type: Boolean, default: true }, // User recommends this product
    verified: { type: Boolean, default: false }, // Verified purchase
    helpful: { type: Number, default: 0 }, // Helpful votes
    helpfulVotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'user' }], // Users who voted helpful
    reported: { type: Boolean, default: false }, // Reported for moderation
    date: { type: Number, required: true }
});

// Compound index to ensure one review per user per product
reviewSchema.index({ userId: 1, productId: 1 }, { unique: true });

const reviewModel = mongoose.models.review || mongoose.model("review", reviewSchema);

export default reviewModel;
