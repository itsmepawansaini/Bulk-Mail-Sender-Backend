const express = require('express');
const router = express.Router();
const recipientController = require('../controllers/recipient');
const authMiddleware = require('../middleware/auth');

router.post('/add', authMiddleware, recipientController.addRecipient);

router.get('/all', authMiddleware, recipientController.getRecipient);

module.exports = router;
