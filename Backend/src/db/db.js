const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const userModel = require('../models/user.model.js');

async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const chatHistoryModel = require('../models/chatHistory.model.js');
        await chatHistoryModel.createIndexes();
        console.log("✅ Chat history TTL index ensured");
        console.log("Connected to Database Successfully ✅✅✅✅");

        // Seed Admin if not exists
        await seedAdmin();
    }
    catch (err) {
        console.error("Error connecting to Database:", err);
    }
}

async function seedAdmin() {
    try {
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;
        const adminUsername = process.env.ADMIN_USERNAME;
        const adminRole = process.env.ADMIN_ROLE;

        // Validate env variables
        if (!adminEmail || !adminPassword || !adminUsername || !adminRole) {
            console.log("⚠️  Admin credentials not found in .env - Skipping admin seed");
            return;
        }

        const existingAdmin = await userModel.findOne({ email: adminEmail });

        if (!existingAdmin) {
            const hashedPassword = await bcrypt.hash(adminPassword, 10);

            await userModel.create({
                username: adminUsername,
                email: adminEmail,
                password: hashedPassword,
                role: adminRole
            });

            console.log("✅ Admin account created successfully!");
        } else {
            console.log("✅ Admin account already exists");
        }
    } catch (err) {
        console.error("Error seeding admin:", err);
    }
}

module.exports = connectDB;