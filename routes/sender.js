const express = require('express');
const router = express.Router();
const senderController = require('../controllers/sender');
const authMiddleware = require('../middleware/auth');

router.post('/add', authMiddleware, senderController.addSender);

router.get('/all', authMiddleware, senderController.getSender);

router.delete('/delete/:id', authMiddleware, senderController.deleteSender);

router.put('/update/:id', authMiddleware, senderController.updateSender);

router.get('/details/:id', authMiddleware, senderController.getSenderById);

module.exports = router;
