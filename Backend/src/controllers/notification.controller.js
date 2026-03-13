const notificationModel = require('../models/notification.model.js');
const userModel = require('../models/user.model.js');
const jwt = require('jsonwebtoken');

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Helper: Get user from token
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

async function getUserFromToken(req) {
    let token = req.cookies.token;
    
    if (!token) {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        }
    }
    
    if (!token) return null;
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await userModel.findById(decoded.id);
        return user;
    } catch (err) {
        return null;
    }
}

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Create Notification (Admin Only)
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

async function createNotification(req, res) {
    try {
        const user = await getUserFromToken(req);
        
        if (!user || user.role !== 'Admin') {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }
        
        const { message } = req.body;
        
        if (!message || message.trim() === '') {
            return res.status(400).json({ message: 'Message is required' });
        }
        
        const notification = await notificationModel.create({
            message: message.trim(),
            createdBy: user._id
        });
        
        return res.status(201).json({
            message: 'Notification created successfully',
            notification
        });
        
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error' });
    }
}

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Get Notifications (Paginated - 10 per page)
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

async function getNotifications(req, res) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        const notifications = await notificationModel
            .find()
            .sort({ createdAt: -1 }) // Latest first
            .skip(skip)
            .limit(limit)
            .populate('createdBy', 'username');
        
        const total = await notificationModel.countDocuments();
        const hasMore = skip + notifications.length < total;
        
        return res.status(200).json({
            notifications,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalNotifications: total,
                hasMore
            }
        });
        
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error' });
    }
}

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Get Unread Count
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

async function getUnreadCount(req, res) {
    try {
        const user = await getUserFromToken(req);
        
        let count = 0;
        
        if (user && user.lastSeenNotificationTime) {
            // Count notifications created after user's last seen time
            count = await notificationModel.countDocuments({
                createdAt: { $gt: user.lastSeenNotificationTime }
            });
        } else {
            // If user not logged in or never seen, count all notifications
            count = await notificationModel.countDocuments();
        }
        
        return res.status(200).json({ unreadCount: count });
        
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error' });
    }
}

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Mark All As Seen
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

async function markAsSeen(req, res) {
    try {
        const user = await getUserFromToken(req);
        
        if (!user) {
            return res.status(401).json({ message: 'Please login to mark notifications as seen' });
        }
        
        // Update user's lastSeenNotificationTime to now
        await userModel.findByIdAndUpdate(user._id, {
            lastSeenNotificationTime: new Date()
        });
        
        return res.status(200).json({ message: 'Notifications marked as seen' });
        
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error' });
    }
}

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Update Notification (Admin Only)
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

async function updateNotification(req, res) {
    try {
        const user = await getUserFromToken(req);
        
        if (!user || user.role !== 'Admin') {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }
        
        const { id } = req.params;
        const { message } = req.body;
        
        if (!message || message.trim() === '') {
            return res.status(400).json({ message: 'Message is required' });
        }
        
        const notification = await notificationModel.findByIdAndUpdate(
            id,
            { message: message.trim() },
            { new: true }
        );
        
        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }
        
        return res.status(200).json({
            message: 'Notification updated successfully',
            notification
        });
        
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error' });
    }
}

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Delete Notification (Admin Only)
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

async function deleteNotification(req, res) {
    try {
        const user = await getUserFromToken(req);
        
        if (!user || user.role !== 'Admin') {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }
        
        const { id } = req.params;
        
        const notification = await notificationModel.findByIdAndDelete(id);
        
        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }
        
        return res.status(200).json({
            message: 'Notification deleted successfully'
        });
        
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error' });
    }
}

module.exports = {
    createNotification,
    getNotifications,
    getUnreadCount,
    markAsSeen,
    updateNotification,
    deleteNotification
};