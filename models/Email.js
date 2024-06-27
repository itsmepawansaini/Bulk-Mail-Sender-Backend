const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const emailSchema = new Schema({
    fromName: { type: String, required: true },
    fromId: { type: String, required: true },
    to: [{ type: String, required: true }],
    subject: { type: String, required: true },
    body: { type: String, required: true },
    attachments: [{
        filename: { type: String, required: true },
        contentType: { type: String },
        sizeInBytes: { type: Number },
        url: { type: String }
    }],
    sentAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Email', emailSchema);
