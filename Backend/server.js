require('dotenv').config();
require("node:dns/promises").setServers(["1.1.1.1", "8.8.8.8"]);
const app = require('./src/app');
const connectDB = require('./src/db/db.js');

connectDB();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);

    // ✅ Auto cleanup every 24 hours (delete old items)
    setInterval(async () => {
        try {
            const lostItemModel = require('./src/models/lost-item.model.js');
            const { moveFileToTrash } = require('./src/config/drive.config.js');

            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            // Delete old unreturned items
            const oldItems = await lostItemModel.find({
                isReturned: false,
                createdAt: { $lt: thirtyDaysAgo }
            });

            for (const item of oldItems) {
                try { await moveFileToTrash(item.driveFileId); } catch (e) {}
                await lostItemModel.findByIdAndDelete(item._id);
            }

            // Delete old returned items from DB
            await lostItemModel.deleteMany({
                isReturned: true,
                returnedAt: { $lt: thirtyDaysAgo }
            });

            if (oldItems.length > 0) {
                console.log(`🗑️ Auto-cleanup: ${oldItems.length} old items deleted`);
            }
        } catch (err) {
            console.error('Auto-cleanup error:', err);
        }
    }, 24 * 60 * 60 * 1000); // Every 24 hours
});