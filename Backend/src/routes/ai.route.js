const express = require('express');
const aiController = require('../controllers/ai.controller.js');
const router = express.Router();

router.post('/chat', aiController.chat);
router.get('/history', aiController.getHistory);
router.delete('/history', aiController.clearHistory);

module.exports = router;