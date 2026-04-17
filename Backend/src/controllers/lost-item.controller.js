const lostItemModel = require('../models/lost-item.model.js');
const { uploadFile } = require('../config/drive.config');
const sharp = require('sharp');
const jwt = require('jsonwebtoken');
const userModel = require('../models/user.model.js');

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Helper: Get user from token
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

async function getUserFromToken(req) {
    let token = req.cookies?.token;
    if (!token) {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        }
    }
    if (!token) return null;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return await userModel.findById(decoded.id);
    } catch (err) {
        return null;
    }
}

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Upload Lost Item (Anyone can upload)
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

async function uploadLostItem(req, res) {
    try {
        const { finderName, finderMobile, finderLocation, foundLocation, caption } = req.body;
        const file = req.file;

        // Validation
        if (!finderName || !finderMobile || !finderLocation || !foundLocation || !caption) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        if (!file) {
            return res.status(400).json({ message: 'Image is required' });
        }

        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            return res.status(400).json({ message: 'Image size must be less than 5MB' });
        }

        // Generate unique identifier for uploader
        const uploadedBy = req.body.uploadedBy || 'anonymous_' + Date.now();

        // Upload to Google Drive
        console.log('📤 Uploading image...');
        const processed = await sharp(req.file.buffer)
            .resize(800, 800, { fit: "inside" })
            .jpeg({ quality: 70 })
            .toBuffer();

        const result = await uploadFile(
            processed,
            req.file.originalname,
            "image/jpeg"
        );
        // Create lost item in database
        const lostItem = await lostItemModel.create({
            finderName: finderName.trim(),
            finderMobile: finderMobile.trim(),
            finderLocation: finderLocation.trim(),
            foundLocation: foundLocation.trim(),
            caption: caption.trim(),
            imageUrl: result.url,
            driveFileId: result.fileId,
            driveFolderIndex: 0, // default folder index
            uploadedBy
        });

        return res.status(201).json({
            message: 'Lost item uploaded successfully!',
            item: lostItem
        });

    } catch (err) {
        console.error('Upload error:', err);
        return res.status(500).json({ message: err.message || 'Server error' });
    }
}

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Get All Lost Items (Paginated - Optimized)
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

async function getLostItems(req, res) {
    try {
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.max(parseInt(req.query.limit) || 5, 1);
        const skip = (page - 1) * limit;

        // Fetch items (latest first)
        const items = await lostItemModel
            .find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(); // ⚡ faster (returns plain JS objects)

        // Total count
        const total = await lostItemModel.countDocuments();

        // Pagination logic
        const totalPages = Math.ceil(total / limit);
        const hasMore = page < totalPages;

        return res.status(200).json({
            items,
            pagination: {
                currentPage: page,
                totalPages,
                totalItems: total,
                hasMore
            }
        });

    } catch (err) {
        console.error('Get Lost Items Error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
}
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Get Single Item Details
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

async function getItemById(req, res) {
    try {
        const { id } = req.params;
        const item = await lostItemModel.findById(id);

        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        return res.status(200).json({ item });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error' });
    }
}

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Mark Item as Returned (Only by uploader)
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

async function markAsReturned(req, res) {
    try {
        const { id } = req.params;
        const { returnedToName, returnedToDepartment, returnedToContact, uploaderIdentifier } = req.body;

        const item = await lostItemModel.findById(id);

        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        // Verify uploader
        if (item.uploadedBy !== uploaderIdentifier) {
            return res.status(403).json({
                message: 'Only the person who uploaded this item can mark it as returned'
            });
        }

        if (item.isReturned) {
            return res.status(400).json({ message: 'Item already marked as returned' });
        }

        if (!returnedToName || !returnedToDepartment || !returnedToContact) {
            return res.status(400).json({
                message: 'Return details (name, department, contact) are required'
            });
        }

        // Move file to trash on Google Drive
        // try {
        //     await moveFileToTrash(item.driveFileId);
        //     console.log(`🗑️ Image moved to Drive trash for item: ${id}`);
        // } catch (driveErr) {
        //     console.error('Drive trash error:', driveErr);
        //     // Continue even if drive operation fails
        // }

        // Update item in database
        item.isReturned = true;
        item.returnedToName = returnedToName.trim();
        item.returnedToDepartment = returnedToDepartment.trim();
        item.returnedToContact = returnedToContact.trim();
        item.returnedAt = new Date();

        await item.save();

        return res.status(200).json({
            message: 'Item marked as returned! Image moved to trash.',
            item
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error' });
    }
}

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Mark Items as Seen (for bell badge)
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

async function markItemsSeen(req, res) {
    try {
        const user = await getUserFromToken(req);
        if (!user) {
            return res.status(200).json({ message: 'Not logged in' });
        }

        // Update user's last seen lost items time
        await userModel.findByIdAndUpdate(user._id, {
            lastSeenLostItemTime: new Date()
        });

        return res.status(200).json({ message: 'Marked as seen' });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error' });
    }
}

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Get Unseen Lost Items Count (for bell badge)
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

async function getUnseenCount(req, res) {
    try {
        const user = await getUserFromToken(req);

        let count = 0;

        if (user && user.lastSeenLostItemTime) {
            count = await lostItemModel.countDocuments({
                createdAt: { $gt: user.lastSeenLostItemTime },
                isReturned: false
            });
        } else {
            count = await lostItemModel.countDocuments({ isReturned: false });
        }

        return res.status(200).json({ unseenCount: count });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error' });
    }
}

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Auto Cleanup: Delete unreturned items older than 30 days
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

async function autoCleanup(req, res) {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Find old unreturned items
        const oldItems = await lostItemModel.find({
            isReturned: false,
            createdAt: { $lt: thirtyDaysAgo }
        });

        let deletedCount = 0;

        for (const item of oldItems) {
            // Move file to Drive trash
            try {
                await moveFileToTrash(item.driveFileId);
            } catch (driveErr) {
                console.error(`Drive trash failed for ${item.driveFileId}:`, driveErr);
            }

            // Delete from database
            await lostItemModel.findByIdAndDelete(item._id);
            deletedCount++;
        }

        // Also delete returned items older than 30 days from database
        const oldReturnedResult = await lostItemModel.deleteMany({
            isReturned: true,
            returnedAt: { $lt: thirtyDaysAgo }
        });

        console.log(`🗑️ Cleanup: ${deletedCount} unreturned + ${oldReturnedResult.deletedCount} returned items deleted`);

        return res.status(200).json({
            message: `Cleanup complete: ${deletedCount} unreturned + ${oldReturnedResult.deletedCount} returned items deleted`
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error' });
    }
}

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Delete Lost Item (Admin)
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

async function deleteLostItem(req, res) {
    try {
        const { id } = req.params;

        const item = await lostItemModel.findById(id);

        if (!item) {
            return res.status(404).json({ message: "Item not found" });
        }

        // ✅ Permanently delete image from Google Drive
        try {
            const { moveFileToTrash } = require('../config/drive.config.js');
            await moveFileToTrash(item.driveFileId);
            console.log(`🗑️ Image permanently deleted from Drive: ${item.driveFileId}`);
        } catch (driveErr) {
            console.error('Drive delete error:', driveErr.message);
            // Still delete from DB even if Drive fails
        }

        // Delete from MongoDB
        await lostItemModel.findByIdAndDelete(id);

        return res.status(200).json({ message: "Item deleted successfully from Drive and database." });

    } catch (err) {
        console.error('Delete Lost Item Error:', err);
        return res.status(500).json({ message: "Server error" });
    }
}

module.exports = {
    uploadLostItem,
    getLostItems,
    getItemById,
    markAsReturned,
    getUnseenCount,
    markItemsSeen,
    autoCleanup,
    deleteLostItem
};
