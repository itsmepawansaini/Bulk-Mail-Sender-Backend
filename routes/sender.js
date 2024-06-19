const express = require('express');
const router = express.Router();
const senderController = require('../controllers/sender');
const authMiddleware = require('../middleware/auth');

router.post('/add', authMiddleware, senderController.addSender);

router.get('/all', authMiddleware, senderController.getSender);

module.exports = router;
