import express from 'express';
import { loginUser, registerUser, adminLogin, getAllUsers, updateUser, deleteUser, toggleUserBlock, changeUserPassword, getUserDetails, getUserProfile, updateUserProfile, forgotPassword, verifyOTP, resetPassword, googleAuth, sendPhoneOTP, verifyPhoneOTP } from '../controllers/userController.js';
import adminAuth from '../middleware/adminAuth.js';
import authUser from '../middleware/auth.js';

const userRouter = express.Router();

userRouter.post('/register', registerUser)
userRouter.post('/login', loginUser)
userRouter.post('/admin', adminLogin)
userRouter.post('/forgot-password', forgotPassword)
userRouter.post('/verify-otp', verifyOTP)
userRouter.post('/reset-password', resetPassword)
userRouter.post('/profile', authUser, getUserProfile)
userRouter.post('/update-profile', authUser, updateUserProfile)

// Social login routes
userRouter.get('/auth/google', googleAuth)
userRouter.post('/send-phone-otp', sendPhoneOTP)
userRouter.post('/verify-phone-otp', verifyPhoneOTP)

// Admin only routes
userRouter.get('/list', adminAuth, getAllUsers)
userRouter.put('/update/:id', adminAuth, updateUser)
userRouter.delete('/delete/:id', adminAuth, deleteUser)
userRouter.put('/toggle-block/:id', adminAuth, toggleUserBlock)
userRouter.put('/change-password/:id', adminAuth, changeUserPassword)
userRouter.get('/details/:id', adminAuth, getUserDetails)

export default userRouter;
