const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const emailSchema = new Schema({
    fromName: { type: String, required: true },
    fromId: { type: String, required: true },
    to: [{ type: String, required: true }],
    subject: { type: String, required: true },
    body: { type: String, required: true },
    sentAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Email', emailSchema);
