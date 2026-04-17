const express = require('express');
const notificationController = require('../controllers/notification.controller.js');
const router = express.Router();

// Public routes
router.get('/', notificationController.getNotifications);
router.get('/unread-count', notificationController.getUnreadCount);

// Protected routes (requires login)
router.post('/mark-seen', notificationController.markAsSeen);

// Admin only routes
router.post('/create', notificationController.createNotification);
router.put('/update/:id', notificationController.updateNotification);
router.delete('/delete/:id', notificationController.deleteNotification);

module.exports = router;