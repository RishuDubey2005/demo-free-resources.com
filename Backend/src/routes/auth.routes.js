const express = require('express');
const authController = require('../controllers/auth.controller.js');
const router = express.Router();

router.post('/send-otp', authController.sendOtp);
router.post('/register', authController.registerUser);
router.post('/login', authController.loginUser);
router.post('/logout', authController.logoutUser);
router.get('/count', authController.getUserCount);
router.get('/me', authController.getMe);

// Forgot Password Routes
router.post('/forgot-password/send-otp', authController.sendForgotPasswordOtp);
router.post('/forgot-password/verify-otp', authController.verifyForgotPasswordOtp);
router.post('/forgot-password/reset', authController.resetPassword);
// Update Profile Route
router.put('/update-profile', authController.updateProfile);
// Visit count routes
router.get('/visits', authController.getVisitCount);
router.post('/visits/increment', authController.incrementVisit);

module.exports = router;