const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const senderSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Sender', senderSchema);
