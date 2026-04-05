const express = require('express');
const multer = require('multer');
const lostItemController = require('../controllers/lost-item.controller.js');
const router = express.Router();

// Multer config - store in memory (for Drive upload)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    }
});

// Public routes
router.post('/upload', upload.single('image'), lostItemController.uploadLostItem);
router.get('/all', lostItemController.getLostItems);
router.get('/item/:id', lostItemController.getItemById);
router.put('/mark-returned/:id', lostItemController.markAsReturned);
router.get('/unseen-count', lostItemController.getUnseenCount);
router.post('/mark-seen', lostItemController.markItemsSeen);

// Cleanup route
router.delete('/cleanup', lostItemController.autoCleanup);
router.delete('/delete/:id', lostItemController.deleteLostItem); // Admin route to delete an item

module.exports = router;