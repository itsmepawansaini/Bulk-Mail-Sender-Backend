const express = require('express');
const router = express.Router();
const emailController = require('../controllers/email');
const authMiddleware = require('../middleware/auth');

router.post('/send', authMiddleware, emailController.sendEmail);

router.get('/sent', authMiddleware, emailController.getSentEmails);

router.get('/emails/:emailId', authMiddleware, emailController.getEmailById);

module.exports = router;
