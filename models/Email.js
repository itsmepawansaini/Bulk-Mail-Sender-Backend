const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const emailSchema = new Schema({
    from: { type: String, required: true },
    to: [{ type: String, required: true }],
    subject: { type: String, required: true },
    body: { type: String, required: true },
    sentAt: { type: Date, default: Date.now }//i want to identify all the mail that are sent in one request 
});

module.exports = mongoose.model('Email', emailSchema);
