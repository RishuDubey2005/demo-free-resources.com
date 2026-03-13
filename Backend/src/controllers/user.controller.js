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
// Helper: Extract branch from email
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

function getBranchFromEmail(email) {
    if (!email) return null;
    
    const match = email.match(/\.([a-z]{2})@nitp\.ac\.in$/i);
    if (match) {
        const branch = match[1].toLowerCase();
        if (["ee", "me", "ce"].includes(branch)) return branch.toUpperCase();
    }
    
    return null;
}

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Get All Users (Admin Only) - Paginated with Filters
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

async function getUsers(req, res) {
    try {
        const admin = await getUserFromToken(req);
        
        if (!admin || admin.role !== 'Admin') {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }
        
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        // Build filter query
        let filter = { role: { $ne: 'Admin' } }; // Exclude admin from list
        
        // Search by email or username
        const search = req.query.search;
        if (search && search.trim() !== '') {
            filter.$or = [
                { email: { $regex: search, $options: 'i' } },
                { username: { $regex: search, $options: 'i' } }
            ];
        }
        
        // Filter by branch
        const branch = req.query.branch;
        if (branch && branch.trim() !== '') {
            filter.email = { $regex: `\\.${branch.toLowerCase()}@nitp\\.ac\\.in$`, $options: 'i' };
        }
        
        // Filter by role
        const role = req.query.role;
        if (role && role.trim() !== '' && role !== 'all') {
            filter.role = role;
        }
        
        // Filter by blocked status
        const blocked = req.query.blocked;
        if (blocked === 'true') {
            filter.isBlocked = true;
        } else if (blocked === 'false') {
            filter.isBlocked = false;
        }
        
        // Filter by registration date (before or on this date)
        const beforeDate = req.query.beforeDate;
        if (beforeDate) {
            filter.createdAt = { $lte: new Date(beforeDate + 'T23:59:59.999Z') };
        }
        
        // Filter by registration date (after or on this date)
        const afterDate = req.query.afterDate;
        if (afterDate) {
            if (filter.createdAt) {
                filter.createdAt.$gte = new Date(afterDate + 'T00:00:00.000Z');
            } else {
                filter.createdAt = { $gte: new Date(afterDate + 'T00:00:00.000Z') };
            }
        }
        
        const users = await userModel
            .find(filter)
            .select('-password') // Exclude password
            .sort({ createdAt: -1 }) // Latest first
            .skip(skip)
            .limit(limit)
            .populate('blockedBy', 'username email');
        
        const total = await userModel.countDocuments(filter);
        const hasMore = skip + users.length < total;
        
        // Add branch info to each user
        const usersWithBranch = users.map(user => {
            const userObj = user.toObject();
            userObj.branch = getBranchFromEmail(user.email);
            return userObj;
        });
        
        return res.status(200).json({
            users: usersWithBranch,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalUsers: total,
                hasMore
            }
        });
        
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error' });
    }
}

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Get Single User Details (Admin Only)
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

async function getUserById(req, res) {
    try {
        const admin = await getUserFromToken(req);
        
        if (!admin || admin.role !== 'Admin') {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }
        
        const { id } = req.params;
        
        const user = await userModel
            .findById(id)
            .select('-password')
            .populate('blockedBy', 'username email');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        const userObj = user.toObject();
        userObj.branch = getBranchFromEmail(user.email);
        
        return res.status(200).json({ user: userObj });
        
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error' });
    }
}

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Block User (Admin Only)
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

async function blockUser(req, res) {
    try {
        const admin = await getUserFromToken(req);
        
        if (!admin || admin.role !== 'Admin') {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }
        
        const { id } = req.params;
        const { reason } = req.body;
        
        const user = await userModel.findById(id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        if (user.role === 'Admin') {
            return res.status(403).json({ message: 'Cannot block an admin' });
        }
        
        if (user.isBlocked) {
            return res.status(400).json({ message: 'User is already blocked' });
        }
        
        user.isBlocked = true;
        user.blockReason = reason || 'Blocked by administrator';
        user.blockedBy = admin._id;
        user.blockedAt = new Date();
        
        await user.save();
        
        return res.status(200).json({
            message: `User ${user.username} has been blocked`,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                isBlocked: user.isBlocked
            }
        });
        
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error' });
    }
}

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Unblock User (Admin Only)
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

async function unblockUser(req, res) {
    try {
        const admin = await getUserFromToken(req);
        
        if (!admin || admin.role !== 'Admin') {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }
        
        const { id } = req.params;
        
        const user = await userModel.findById(id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        if (!user.isBlocked) {
            return res.status(400).json({ message: 'User is not blocked' });
        }
        
        user.isBlocked = false;
        user.blockReason = null;
        user.blockedBy = null;
        user.blockedAt = null;
        
        await user.save();
        
        return res.status(200).json({
            message: `User ${user.username} has been unblocked`,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                isBlocked: user.isBlocked
            }
        });
        
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error' });
    }
}

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Delete User Permanently (Admin Only)
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

async function deleteUser(req, res) {
    try {
        const admin = await getUserFromToken(req);
        
        if (!admin || admin.role !== 'Admin') {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }
        
        const { id } = req.params;
        
        const user = await userModel.findById(id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        if (user.role === 'Admin') {
            return res.status(403).json({ message: 'Cannot delete an admin' });
        }
        
        await userModel.findByIdAndDelete(id);
        
        return res.status(200).json({
            message: `User ${user.username} has been permanently deleted`
        });
        
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error' });
    }
}

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Check if Current User is Blocked
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

async function checkBlockStatus(req, res) {
    try {
        const user = await getUserFromToken(req);
        
        if (!user) {
            return res.status(200).json({ isBlocked: false, isLoggedIn: false });
        }
        
        return res.status(200).json({
            isBlocked: user.isBlocked,
            isLoggedIn: true,
            blockReason: user.blockReason || null
        });
        
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error' });
    }
}

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Get User Statistics (Admin Only)
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

async function getUserStats(req, res) {
    try {
        const admin = await getUserFromToken(req);
        
        if (!admin || admin.role !== 'Admin') {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }
        
        const totalUsers = await userModel.countDocuments({ role: { $ne: 'Admin' } });
        const totalStudents = await userModel.countDocuments({ role: 'Student' });
        const totalProfessors = await userModel.countDocuments({ role: 'Professor' });
        const blockedUsers = await userModel.countDocuments({ isBlocked: true });
        const verifiedUsers = await userModel.countDocuments({ isVerified: true, role: { $ne: 'Admin' } });
        
        // Branch-wise count
        const eeUsers = await userModel.countDocuments({ 
            email: { $regex: '\\.ee@nitp\\.ac\\.in$', $options: 'i' } 
        });
        const meUsers = await userModel.countDocuments({ 
            email: { $regex: '\\.me@nitp\\.ac\\.in$', $options: 'i' } 
        });
        const ceUsers = await userModel.countDocuments({ 
            email: { $regex: '\\.ce@nitp\\.ac\\.in$', $options: 'i' } 
        });
        
        // Today's registrations
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayRegistrations = await userModel.countDocuments({
            createdAt: { $gte: today },
            role: { $ne: 'Admin' }
        });
        
        return res.status(200).json({
            totalUsers,
            totalStudents,
            totalProfessors,
            blockedUsers,
            verifiedUsers,
            branchWise: {
                ee: eeUsers,
                me: meUsers,
                ce: ceUsers
            },
            todayRegistrations
        });
        
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error' });
    }
}

module.exports = {
    getUsers,
    getUserById,
    blockUser,
    unblockUser,
    deleteUser,
    checkBlockStatus,
    getUserStats
};