const resourceModel = require('../models/resource.model.js');
const userModel = require('../models/user.model.js');
const { uploadResourcePDF, deleteFile } = require('../config/drive.config.js');
const jwt = require('jsonwebtoken');

// ─── Helper: get user from token ───────────────────────────────
async function getUserFromToken(req) {
    let token = req.cookies?.token;
    if (!token) {
        const auth = req.headers.authorization;
        if (auth && auth.startsWith('Bearer ')) token = auth.split(' ')[1];
    }
    if (!token) return null;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return await userModel.findById(decoded.id);
    } catch { return null; }
}

// ─── Helper: is allowed uploader ───────────────────────────────
function isTestProfessor(email) {
    return email === process.env.TEST_PROFESSOR_EMAIL;
}

function canUpload(user) {
    if (!user) return false;
    if (user.role === 'Admin') return true;
    if (user.role === 'Professor') return true;
    return false;
}

// ─── Upload PDF ──────────────────────────────────────────────────────────────
// POST /api/resources/upload
async function uploadResource(req, res) {
    try {
        const user = await getUserFromToken(req);
        if (!user || !canUpload(user)) {
            return res.status(403).json({ message: 'Access denied. Professor or Admin only.' });
        }
        if (user.isBlocked) return res.status(403).json({ message: 'Your account is blocked.' });

        const { branch, semester, subjectCode, subjectName } = req.body;
        const file = req.file;

        // Validation
        if (!branch || !semester || !subjectCode || !subjectName || !file) {
            return res.status(400).json({ message: 'All fields and file are required.' });
        }
        if (!['EE', 'ME', 'CE'].includes(branch)) {
            return res.status(400).json({ message: 'Invalid branch.' });
        }
        const sem = parseInt(semester);
        if (isNaN(sem) || sem < 1 || sem > 8) {
            return res.status(400).json({ message: 'Semester must be 1-8.' });
        }

        // File size: max 40MB before compression (raw upload)
        if (file.size > 40 * 1024 * 1024) {
            return res.status(400).json({ 
                message: 'File too large (max 40MB). Please compress your PDF first. Try: ilovepdf.com or smallpdf.com' 
            });
        }

        // ── Branch restriction for Professors ──
        if (user.role === 'Professor') {
            const emailMatch = user.email.match(/\.([a-z]{2})@nitp\.ac\.in$/i);
            const profBranch = emailMatch ? emailMatch[1].toUpperCase() : null;
            const isTestProf = user.email === process.env.TEST_PROFESSOR_EMAIL;

            if (!isTestProf && profBranch && profBranch !== branch) {
                return res.status(403).json({
                    message: `❌ Access denied. You can only upload resources for your branch (${profBranch}).`
                });
            }
        }

        // Professor upload limit: 10 PDFs per semester per 6 months
        if (user.role === 'Professor') {
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
            const count = await resourceModel.countDocuments({
                uploadedBy: user._id,
                branch,
                semester: sem,
                createdAt: { $gte: sixMonthsAgo }
            });
            if (count >= 10) {
                return res.status(429).json({ 
                    message: `Upload limit reached: max 10 PDFs per semester per 6 months. You have uploaded ${count}.` 
                });
            }
        }

        // Auto-assign part number
        const existingCount = await resourceModel.countDocuments({
            branch,
            semester: sem,
            subjectCode: subjectCode.trim()
        });
        const partNumber = existingCount + 1;

        // Generate file name
        const safeName = subjectCode.replace(/[^a-zA-Z0-9]/g, '_');
        const fileName = `${branch}_sem${sem}_${safeName}_part${partNumber}_${Date.now()}.pdf`;

        // Upload to Drive (branch-specific folder)
        const { fileId } = await uploadResourcePDF(file.buffer, fileName, branch);

        // Save to MongoDB
        const resource = await resourceModel.create({
            branch,
            semester: sem,
            subjectCode: subjectCode.trim(),
            subjectName: subjectName.trim(),
            partNumber,
            driveFileId: fileId,
            fileName,
            fileSize: file.size,
            uploadedBy: user._id,
            uploaderRole: user.role
        });

        return res.status(201).json({ 
            message: `PDF uploaded as Part-${partNumber} successfully!`, 
            resource 
        });

    } catch (err) {
        console.error('Resource upload error:', err);
        return res.status(500).json({ message: err.message || 'Server error' });
    }
}

// ─── Get Resources (filtered) ──────────────────────────────────────────────
// GET /api/resources?branch=EE&semester=1&subjectCode=CS16105&page=1&limit=10
async function getResources(req, res) {
    try {
        const { branch, semester, subjectCode, uploadedBy, page = 1, limit = 10 } = req.query;
        const filter = {};
        if (branch) filter.branch = branch;
        if (semester) filter.semester = parseInt(semester);
        if (subjectCode) filter.subjectCode = subjectCode;
        if (uploadedBy) filter.uploadedBy = uploadedBy;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const resources = await resourceModel
            .find(filter)
            .sort({ subjectCode: 1, partNumber: 1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('uploadedBy', 'username email')
            .lean();

        const total = await resourceModel.countDocuments(filter);

        return res.status(200).json({
            resources,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit)),
                total,
                hasMore: skip + resources.length < total
            }
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error' });
    }
}

// ─── Serve PDF via proxy (no direct Drive link exposed) ───────────────────
// GET /api/resources/serve/:id
async function serveResource(req, res) {
    try {
        let user = await getUserFromToken(req);
        if (!user && req.query.token) {
            try {
                const decoded = jwt.verify(req.query.token, process.env.JWT_SECRET);
                user = await userModel.findById(decoded.id);
            } catch(e) {}
        }
        if (!user) return res.status(401).json({ message: 'Login required to access resources.' });

        const resource = await resourceModel.findById(req.params.id);
        if (!resource) return res.status(404).json({ message: 'Resource not found.' });

        const { getFileStream } = require('../config/drive.config.js');
        const stream = await getFileStream(resource.driveFileId, resource.branch);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${resource.fileName}"`);
        stream.pipe(res);

    } catch (err) {
        console.error('Serve resource error:', err);
        return res.status(500).json({ message: 'Could not fetch file.' });
    }
}

// ─── Delete Resource ───────────────────────────────────────────────────────
// DELETE /api/resources/delete/:id
async function deleteResource(req, res) {
    try {
        const user = await getUserFromToken(req);
        if (!user || !canUpload(user)) {
            return res.status(403).json({ message: 'Access denied.' });
        }

        const resource = await resourceModel.findById(req.params.id);
        if (!resource) return res.status(404).json({ message: 'Resource not found.' });

        // Professor can only delete their own uploads in their own branch
        if (user.role === 'Professor') {
            if (resource.uploadedBy.toString() !== user._id.toString()) {
                return res.status(403).json({ message: 'You can only delete your own uploads.' });
            }
            const emailMatch = user.email.match(/\.([a-z]{2})@nitp\.ac\.in$/i);
            const profBranch = emailMatch ? emailMatch[1].toUpperCase() : null;
            const isTestProf = user.email === process.env.TEST_PROFESSOR_EMAIL;

            if (!isTestProf && profBranch && profBranch !== resource.branch) {
                return res.status(403).json({
                    message: `❌ Access denied. You can only manage resources for your branch (${profBranch}).`
                });
            }
        }

        // Delete from Drive
        try {
            await deleteFile(resource.driveFileId, resource.branch);
        } catch (driveErr) {
            console.error('Drive delete error (continuing):', driveErr.message);
        }

        // Delete from MongoDB
        await resourceModel.findByIdAndDelete(req.params.id);

        // Re-number remaining parts for same subject
        const remaining = await resourceModel
            .find({ branch: resource.branch, semester: resource.semester, subjectCode: resource.subjectCode })
            .sort({ partNumber: 1 });
        for (let i = 0; i < remaining.length; i++) {
            remaining[i].partNumber = i + 1;
            await remaining[i].save();
        }

        return res.status(200).json({ message: 'Resource deleted successfully.' });

    } catch (err) {
        console.error('Delete resource error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
}

// ─── Toggle Pin ────────────────────────────────────────────────────────────
// PUT /api/resources/pin/:id
async function togglePin(req, res) {
    try {
        const user = await getUserFromToken(req);
        if (!user || !canUpload(user)) return res.status(403).json({ message: 'Access denied.' });

        const resource = await resourceModel.findById(req.params.id);
        if (!resource) return res.status(404).json({ message: 'Resource not found.' });

        if (user.role === 'Professor' && resource.uploadedBy.toString() !== user._id.toString()) {
            return res.status(403).json({ message: 'You can only pin your own uploads.' });
        }

        resource.isPinned = !resource.isPinned;
        resource.alertSent = false; // reset alert if re-pinned
        await resource.save();

        return res.status(200).json({ 
            message: resource.isPinned ? '📌 Pinned! Will not be auto-deleted.' : '📌 Unpinned.',
            isPinned: resource.isPinned
        });
    } catch (err) {
        return res.status(500).json({ message: 'Server error' });
    }
}

// ─── Get 6-month-old alert list (for profile page) ────────────────────────
// GET /api/resources/alerts
async function getAlerts(req, res) {
    try {
        const user = await getUserFromToken(req);
        if (!user || !canUpload(user)) return res.status(403).json({ message: 'Access denied.' });

        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const filter = {
            createdAt: { $lt: sixMonthsAgo },
            isPinned: false
        };
        if (user.role === 'Professor') filter.uploadedBy = user._id;

        const oldResources = await resourceModel.find(filter)
            .populate('uploadedBy', 'username email')
            .lean();

        return res.status(200).json({ alerts: oldResources });
    } catch (err) {
        return res.status(500).json({ message: 'Server error' });
    }
}

// ─── Get subjects list for a branch+semester (for filter dropdown) ─────────
// GET /api/resources/subjects?branch=EE&semester=1
async function getSubjects(req, res) {
    try {
        const { branch, semester } = req.query;
        if (!branch || !semester) return res.status(400).json({ message: 'Branch and semester required.' });

        const subjects = await resourceModel.distinct('subjectCode', {
            branch,
            semester: parseInt(semester)
        });

        // Get subject names too
        const details = await resourceModel
            .find({ branch, semester: parseInt(semester) })
            .select('subjectCode subjectName')
            .lean();

        const map = {};
        details.forEach(d => { map[d.subjectCode] = d.subjectName; });

        return res.status(200).json({
            subjects: subjects.map(code => ({ code, name: map[code] || code }))
        });
    } catch (err) {
        return res.status(500).json({ message: 'Server error' });
    }
}

module.exports = {
    uploadResource,
    getResources,
    serveResource,
    deleteResource,
    togglePin,
    getAlerts,
    getSubjects
};