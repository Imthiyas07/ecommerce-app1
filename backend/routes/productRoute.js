import express from 'express'
import { listProducts, addProduct, removeProduct, singleProduct, updateInventory, bulkUpdateInventory, getLowStockProducts, updateProduct, getProductReviews, addProductReview, updateProductReview, deleteProductReview, getUserReviewForProduct, markReviewHelpful, getAllReviews, adminUpdateReview, adminDeleteReview, adminBulkDeleteReviews } from '../controllers/productController.js'
import upload from '../middleware/multer.js';
import adminAuth from '../middleware/adminAuth.js';

const productRouter = express.Router();

productRouter.post('/add',adminAuth,upload.fields([{name:'image1',maxCount:1},{name:'image2',maxCount:1},{name:'image3',maxCount:1},{name:'image4',maxCount:1}]),addProduct);
productRouter.post('/remove',adminAuth,removeProduct);
productRouter.post('/single',singleProduct);
productRouter.get('/list',listProducts);
productRouter.post('/update-inventory',adminAuth,updateInventory);
productRouter.post('/bulk-update-inventory',adminAuth,bulkUpdateInventory);
productRouter.get('/low-stock',adminAuth,getLowStockProducts);
productRouter.post('/update',adminAuth,upload.fields([{name:'image1',maxCount:1},{name:'image2',maxCount:1},{name:'image3',maxCount:1},{name:'image4',maxCount:1}]),updateProduct);

// Review routes
productRouter.post('/reviews', getProductReviews);
productRouter.post('/add-review', upload.fields([{name:'reviewImage1',maxCount:1},{name:'reviewImage2',maxCount:1},{name:'reviewImage3',maxCount:1}]), addProductReview);
productRouter.post('/update-review', upload.fields([{name:'reviewImage1',maxCount:1},{name:'reviewImage2',maxCount:1},{name:'reviewImage3',maxCount:1}]), updateProductReview);
productRouter.post('/delete-review', deleteProductReview);
productRouter.post('/user-review', getUserReviewForProduct);
productRouter.post('/review-helpful', markReviewHelpful);

// Admin review routes
productRouter.get('/all-reviews', adminAuth, getAllReviews);
productRouter.post('/admin-update-review', adminAuth, adminUpdateReview);
productRouter.post('/admin-delete-review', adminAuth, adminDeleteReview);
productRouter.post('/admin-bulk-delete-reviews', adminAuth, adminBulkDeleteReviews);

export default productRouter
