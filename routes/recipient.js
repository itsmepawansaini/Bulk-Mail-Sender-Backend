const express = require('express');
const router = express.Router();
const recipientController = require('../controllers/recipient');
const upload = require('../config/multer');
const authMiddleware = require('../middleware/auth');

router.post('/add', authMiddleware, recipientController.addRecipient);

router.get('/all', authMiddleware, recipientController.getRecipients);

router.post('/group', authMiddleware, recipientController.addRecipientGroup);

router.post('/addRecipientToGroup', authMiddleware, recipientController.addRecipientToGroup);

router.get('/groups', authMiddleware,  recipientController.getAllGroups);

router.get('/group/:groupId', authMiddleware, recipientController.getRecipientsByGroupId);

router.post('/upload', upload.single('file'), authMiddleware, recipientController.uploadRecipients);

router.delete('/delete/:id', authMiddleware, recipientController.deleteRecipient);

router.delete('/groupdelete/:id', authMiddleware, recipientController.deleteRecipientGroup);

router.put('/update/:id', authMiddleware, recipientController.updateRecipient);

router.put('/updategroup/:id', authMiddleware, recipientController.updateRecipientGroup);

router.get('/export', authMiddleware, recipientController.exportRecipients);

router.get('/exportgroups', authMiddleware, recipientController.exportRecipientGroups);

module.exports = router;
