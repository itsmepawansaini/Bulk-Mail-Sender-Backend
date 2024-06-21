const mongoose = require('mongoose');

const RecipientSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  createdAt: { type: Date, default: Date.now },
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'RecipientGroup' }
});

module.exports = mongoose.model('Recipient', RecipientSchema);
