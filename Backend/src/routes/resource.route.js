const express = require('express');
const multer = require('multer');
const resourceController = require('../controllers/resource.controller.js');
const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 40 * 1024 * 1024 }, // 40MB max
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'), false);
        }
    }
});

// Public (but login required for serve)
router.get('/', resourceController.getResources);
router.get('/subjects', resourceController.getSubjects);
router.get('/serve/:id', resourceController.serveResource);

// Professor / Admin only
router.post('/upload', upload.single('pdf'), resourceController.uploadResource);
router.delete('/delete/:id', resourceController.deleteResource);
router.put('/pin/:id', resourceController.togglePin);
router.get('/alerts', resourceController.getAlerts);

module.exports = router;