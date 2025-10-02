import { v2 as cloudinary } from "cloudinary"
import productModel from "../models/productModel.js"
import reviewModel from "../models/reviewModel.js"
import orderModel from "../models/orderModel.js"

// function for add product
const addProduct = async (req, res) => {
    try {

        const { name, description, price, category, subCategory, sizes, bestseller, sizeStock, minStock, sku } = req.body

        const image1 = req.files.image1 && req.files.image1[0]
        const image2 = req.files.image2 && req.files.image2[0]
        const image3 = req.files.image3 && req.files.image3[0]
        const image4 = req.files.image4 && req.files.image4[0]

        const images = [image1, image2, image3, image4].filter((item) => item !== undefined)

        let imagesUrl = await Promise.all(
            images.map(async (item) => {
                let result = await cloudinary.uploader.upload(item.path, { resource_type: 'image' });
                return result.secure_url
            })
        )

        // Parse sizeStock and calculate total stock
        const parsedSizeStock = sizeStock ? JSON.parse(sizeStock) : {};
        const totalStock = Object.values(parsedSizeStock).reduce((sum, qty) => sum + (qty || 0), 0);

        const productData = {
            name,
            description,
            category,
            price: Number(price),
            subCategory,
            bestseller: bestseller === "true" ? true : false,
            sizes: JSON.parse(sizes),
            image: imagesUrl,
            date: Date.now(),
            stock: totalStock, // Total stock calculated from sizeStock
            sizeStock: parsedSizeStock,
            minStock: minStock ? Number(minStock) : 5,
            sku: sku || undefined
        }

        console.log(productData);

        const product = new productModel(productData);
        await product.save()

        res.json({ success: true, message: "Product Added" })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// function for list product
const listProducts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const options = {
            page,
            limit,
            sort: { date: -1 }
        };

        const result = await productModel.paginate({}, options);
        res.json({
            success: true,
            products: result.docs,
            totalPages: result.totalPages,
            currentPage: result.page,
            totalProducts: result.totalDocs
        })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// function for removing product
const removeProduct = async (req, res) => {
    try {
        
        await productModel.findByIdAndDelete(req.body.id)
        res.json({success:true,message:"Product Removed"})

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// function for single product info
const singleProduct = async (req, res) => {
    try {

        const { productId } = req.body
        const product = await productModel.findById(productId)
        res.json({success:true,product})

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// function for updating product inventory
const updateInventory = async (req, res) => {
    try {
        const { productId, stock, minStock, sku, isActive } = req.body

        const updateData = {}
        if (stock !== undefined) updateData.stock = Number(stock)
        if (minStock !== undefined) updateData.minStock = Number(minStock)
        if (sku !== undefined) updateData.sku = sku
        if (isActive !== undefined) updateData.isActive = isActive === 'true' || isActive === true

        const product = await productModel.findByIdAndUpdate(productId, updateData, { new: true })

        if (!product) {
            return res.json({ success: false, message: "Product not found" })
        }

        res.json({ success: true, message: "Inventory updated successfully", product })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// function for bulk inventory update
const bulkUpdateInventory = async (req, res) => {
    try {
        const { updates } = req.body // Array of { productId, stock, minStock, sku, isActive }

        const results = []

        for (const update of updates) {
            const { productId, stock, minStock, sku, isActive } = update

            const updateData = {}
            if (stock !== undefined) updateData.stock = Number(stock)
            if (minStock !== undefined) updateData.minStock = Number(minStock)
            if (sku !== undefined) updateData.sku = sku
            if (isActive !== undefined) updateData.isActive = isActive === 'true' || isActive === true

            const product = await productModel.findByIdAndUpdate(productId, updateData, { new: true })
            if (product) {
                results.push({ productId, success: true, product })
            } else {
                results.push({ productId, success: false, message: "Product not found" })
            }
        }

        res.json({ success: true, message: "Bulk inventory update completed", results })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// function for getting low stock products
const getLowStockProducts = async (req, res) => {
    try {
        const products = await productModel.find({
            $expr: { $lte: ["$stock", "$minStock"] },
            isActive: true
        }).sort({ stock: 1 })

        res.json({ success: true, products })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// function for updating product details (including inventory)
const updateProduct = async (req, res) => {
    try {
        const { productId, name, description, price, category, subCategory, sizes, sizeStock, bestseller, minStock, sku, isActive } = req.body

        const updateData = {}
        if (name !== undefined) updateData.name = name
        if (description !== undefined) updateData.description = description
        if (price !== undefined) updateData.price = Number(price)
        if (category !== undefined) updateData.category = category
        if (subCategory !== undefined) updateData.subCategory = subCategory
        if (sizes !== undefined) updateData.sizes = JSON.parse(sizes)
        if (sizeStock !== undefined) {
            const parsedSizeStock = JSON.parse(sizeStock)
            updateData.sizeStock = parsedSizeStock
            // Calculate total stock from sizeStock
            updateData.stock = Object.values(parsedSizeStock).reduce((sum, qty) => sum + (qty || 0), 0)
        }
        if (bestseller !== undefined) updateData.bestseller = bestseller === 'true' || bestseller === true
        if (minStock !== undefined) updateData.minStock = Number(minStock)
        if (sku !== undefined) updateData.sku = sku
        if (isActive !== undefined) updateData.isActive = isActive === 'true' || isActive === true

        const product = await productModel.findByIdAndUpdate(productId, updateData, { new: true })

        if (!product) {
            return res.json({ success: false, message: "Product not found" })
        }

        res.json({ success: true, message: "Product updated successfully", product })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// Helper function to update product rating
const updateProductRating = async (productId) => {
    try {
        const reviews = await reviewModel.find({ productId });
        if (reviews.length === 0) {
            await productModel.findByIdAndUpdate(productId, { rating: 0, reviewCount: 0 });
            return;
        }

        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = totalRating / reviews.length;

        await productModel.findByIdAndUpdate(productId, {
            rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
            reviewCount: reviews.length
        });
    } catch (error) {
        console.log('Error updating product rating:', error);
    }
};

// function for getting product reviews
const getProductReviews = async (req, res) => {
    try {
        const { productId } = req.body;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const reviews = await reviewModel
            .find({ productId })
            .populate('userId', 'name')
            .sort({ date: -1 })
            .limit(limit)
            .skip((page - 1) * limit);

        const totalReviews = await reviewModel.countDocuments({ productId });

        res.json({
            success: true,
            reviews,
            totalReviews,
            currentPage: page,
            totalPages: Math.ceil(totalReviews / limit)
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// function for adding product review
const addProductReview = async (req, res) => {
    try {
        const { userId, productId, rating, comment, recommend } = req.body;

        // Handle image uploads
        const reviewImages = req.files ? Object.keys(req.files).filter(key => key.startsWith('reviewImage')).map(key => req.files[key][0]) : [];
        let imageUrls = [];

        if (reviewImages.length > 0) {
            imageUrls = await Promise.all(
                reviewImages.map(async (image) => {
                    const result = await cloudinary.uploader.upload(image.path, {
                        resource_type: 'image',
                        folder: 'reviews'
                    });
                    return result.secure_url;
                })
            );
        }

        // Check if user has purchased this product (for verified review)
        const hasPurchased = await orderModel.findOne({
            userId: userId.toString(), // Convert to string to match orderModel
            'items._id': productId,
            payment: true
        });

        // Check if user already reviewed this product
        const existingReview = await reviewModel.findOne({ userId, productId });
        if (existingReview) {
            return res.json({ success: false, message: "You have already reviewed this product" });
        }

        const reviewData = {
            userId,
            productId,
            rating: Number(rating),
            comment: comment.trim(),
            images: imageUrls,
            recommend: recommend === 'true' || recommend === true,
            verified: !!hasPurchased,
            date: Date.now()
        };

        const review = new reviewModel(reviewData);
        await review.save();

        // Update product rating
        await updateProductRating(productId);

        res.json({ success: true, message: "Review added successfully", review });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// function for updating product review
const updateProductReview = async (req, res) => {
    try {
        const { reviewId, userId, rating, comment, recommend } = req.body;

        // Handle image uploads for updates
        const reviewImages = req.files ? Object.keys(req.files).filter(key => key.startsWith('reviewImage')).map(key => req.files[key][0]) : [];
        let imageUrls = [];

        if (reviewImages.length > 0) {
            imageUrls = await Promise.all(
                reviewImages.map(async (image) => {
                    const result = await cloudinary.uploader.upload(image.path, {
                        resource_type: 'image',
                        folder: 'reviews'
                    });
                    return result.secure_url;
                })
            );
        }

        const updateData = {
            rating: Number(rating),
            comment: comment.trim(),
            recommend: recommend === 'true' || recommend === true
        };

        // Only add images if new ones were uploaded
        if (imageUrls.length > 0) {
            updateData.images = imageUrls;
        }

        const review = await reviewModel.findOneAndUpdate(
            { _id: reviewId, userId },
            updateData,
            { new: true }
        );

        if (!review) {
            return res.json({ success: false, message: "Review not found or unauthorized" });
        }

        // Update product rating
        await updateProductRating(review.productId);

        res.json({ success: true, message: "Review updated successfully", review });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// function for deleting product review
const deleteProductReview = async (req, res) => {
    try {
        const { reviewId, userId } = req.body;

        const review = await reviewModel.findOneAndDelete({ _id: reviewId, userId });

        if (!review) {
            return res.json({ success: false, message: "Review not found or unauthorized" });
        }

        // Update product rating
        await updateProductRating(review.productId);

        res.json({ success: true, message: "Review deleted successfully" });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// function for checking if user has reviewed a product
const getUserReviewForProduct = async (req, res) => {
    try {
        const { userId, productId } = req.body;

        const review = await reviewModel.findOne({ userId, productId });

        res.json({
            success: true,
            hasReviewed: !!review,
            review: review || null
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// function for marking review as helpful
const markReviewHelpful = async (req, res) => {
    try {
        const { reviewId, userId } = req.body;

        // Check if user already voted for this review
        const review = await reviewModel.findById(reviewId);
        if (!review) {
            return res.json({ success: false, message: "Review not found" });
        }

        if (review.helpfulVotes.includes(userId)) {
            return res.json({ success: false, message: "You have already voted for this review" });
        }

        // Add user to helpful votes and increment count
        const updatedReview = await reviewModel.findByIdAndUpdate(
            reviewId,
            {
                $inc: { helpful: 1 },
                $push: { helpfulVotes: userId }
            },
            { new: true }
        );

        res.json({ success: true, message: "Review marked as helpful", review: updatedReview });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// function for getting all reviews for admin analytics
const getAllReviews = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const search = req.query.search || '';
        const rating = req.query.rating ? parseInt(req.query.rating) : null;
        const reported = req.query.reported === 'true';

        let query = {};

        // Add search filter
        if (search) {
            query.$or = [
                { comment: { $regex: search, $options: 'i' } }
            ];
        }

        // Add rating filter
        if (rating) {
            query.rating = rating;
        }

        // Add reported filter
        if (reported) {
            query.reported = true;
        }

        const reviews = await reviewModel
            .find(query)
            .populate('userId', 'name email')
            .populate('productId', 'name category')
            .sort({ date: -1 })
            .limit(limit)
            .skip((page - 1) * limit);

        const totalReviews = await reviewModel.countDocuments(query);

        // Get rating statistics - simplified to avoid aggregation issues
        const ratingStats = [];
        for (let i = 1; i <= 5; i++) {
            const count = await reviewModel.countDocuments({ ...query, rating: i });
            ratingStats.push({ _id: i, count });
        }

        const totalReviewCount = await reviewModel.countDocuments();
        const reportedCount = await reviewModel.countDocuments({ reported: true });
        const verifiedCount = await reviewModel.countDocuments({ verified: true });

        res.json({
            success: true,
            reviews,
            totalReviews,
            currentPage: page,
            totalPages: Math.ceil(totalReviews / limit),
            stats: {
                total: totalReviewCount,
                reported: reportedCount,
                verified: verifiedCount,
                ratingBreakdown: ratingStats
            }
        });

    } catch (error) {
        console.log('Error in getAllReviews:', error);
        res.json({ success: false, message: error.message });
    }
};

// function for admin to update any review
const adminUpdateReview = async (req, res) => {
    try {
        const { reviewId, rating, comment, recommend, reported } = req.body;

        const updateData = {};
        if (rating !== undefined) updateData.rating = Number(rating);
        if (comment !== undefined) updateData.comment = comment.trim();
        if (recommend !== undefined) updateData.recommend = recommend === 'true' || recommend === true;
        if (reported !== undefined) updateData.reported = reported === 'true' || reported === true;

        const review = await reviewModel.findByIdAndUpdate(reviewId, updateData, { new: true })
            .populate('userId', 'name email')
            .populate('productId', 'name category');

        if (!review) {
            return res.json({ success: false, message: "Review not found" });
        }

        // Update product rating
        await updateProductRating(review.productId);

        res.json({ success: true, message: "Review updated successfully", review });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// function for admin to delete any review
const adminDeleteReview = async (req, res) => {
    try {
        const { reviewId } = req.body;

        const review = await reviewModel.findByIdAndDelete(reviewId);

        if (!review) {
            return res.json({ success: false, message: "Review not found" });
        }

        // Update product rating
        await updateProductRating(review.productId);

        res.json({ success: true, message: "Review deleted successfully" });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// function for admin to bulk delete reviews
const adminBulkDeleteReviews = async (req, res) => {
    try {
        const { reviewIds } = req.body;

        if (!Array.isArray(reviewIds) || reviewIds.length === 0) {
            return res.json({ success: false, message: "Invalid review IDs" });
        }

        const result = await reviewModel.deleteMany({ _id: { $in: reviewIds } });

        // Update ratings for affected products
        const affectedProducts = await reviewModel.distinct('productId', { _id: { $in: reviewIds } });
        for (const productId of affectedProducts) {
            await updateProductRating(productId);
        }

        res.json({
            success: true,
            message: `${result.deletedCount} reviews deleted successfully`,
            deletedCount: result.deletedCount
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

export {
    listProducts,
    addProduct,
    removeProduct,
    singleProduct,
    updateInventory,
    bulkUpdateInventory,
    getLowStockProducts,
    updateProduct,
    getProductReviews,
    addProductReview,
    updateProductReview,
    deleteProductReview,
    getUserReviewForProduct,
    markReviewHelpful,
    getAllReviews,
    adminUpdateReview,
    adminDeleteReview,
    adminBulkDeleteReviews
}
