import userModel from '../models/userModel.js';
import productModel from '../models/productModel.js';

// Add to wishlist
const addToWishlist = async (req, res) => {
    try {
        const { userId, itemId } = req.body;

        const userData = await userModel.findById(userId);
        if (!userData) {
            return res.json({ success: false, message: 'User not found' });
        }

        const productData = await productModel.findById(itemId);
        if (!productData) {
            return res.json({ success: false, message: 'Product not found' });
        }

        // Check if item is already in wishlist
        if (userData.wishlistItems.includes(itemId)) {
            return res.json({ success: false, message: 'Item already in wishlist' });
        }

        // Add to wishlist
        userData.wishlistItems.push(itemId);
        await userData.save();

        res.json({ success: true, message: 'Added to wishlist' });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// Remove from wishlist
const removeFromWishlist = async (req, res) => {
    try {
        const { userId, itemId } = req.body;

        const userData = await userModel.findById(userId);
        if (!userData) {
            return res.json({ success: false, message: 'User not found' });
        }

        // Remove from wishlist
        userData.wishlistItems = userData.wishlistItems.filter(id => id.toString() !== itemId);
        await userData.save();

        res.json({ success: true, message: 'Removed from wishlist' });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// Get user wishlist
const getUserWishlist = async (req, res) => {
    try {
        const { userId } = req.body;

        const userData = await userModel.findById(userId);
        if (!userData) {
            return res.json({ success: false, message: 'User not found' });
        }

        // Get wishlist items with product details
        const wishlistItems = await productModel.find({
            _id: { $in: userData.wishlistItems }
        });

        res.json({ success: true, wishlistData: wishlistItems });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

export {
    addToWishlist,
    removeFromWishlist,
    getUserWishlist
}
