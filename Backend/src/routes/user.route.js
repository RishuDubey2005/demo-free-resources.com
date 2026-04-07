const express = require('express');
const userController = require('../controllers/user.controller.js');
const router = express.Router();

// Public route - check if current user is blocked
router.get('/check-block-status', userController.checkBlockStatus);

// Admin only routes
router.get('/all', userController.getUsers);
router.get('/stats', userController.getUserStats);
router.get('/:id', userController.getUserById);
router.post('/block/:id', userController.blockUser);
router.post('/unblock/:id', userController.unblockUser);
router.delete('/delete/:id', userController.deleteUser);

module.exports = router;