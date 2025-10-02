import express from 'express';
import { addToWishlist, removeFromWishlist, getUserWishlist } from '../controllers/wishlistController.js';
import authMiddleware from '../middleware/auth.js';

const wishlistRouter = express.Router();

wishlistRouter.post('/add', authMiddleware, addToWishlist);
wishlistRouter.post('/remove', authMiddleware, removeFromWishlist);
wishlistRouter.post('/get', authMiddleware, getUserWishlist);

export default wishlistRouter;
