const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const recipientGroupSchema = new Schema({
  name: String,
  createdAt: { type: Date, default: Date.now }
});

recipientGroupSchema.virtual('recipients', {
  ref: 'Recipient',
  localField: '_id',
  foreignField: 'groups',
  justOne: false,
});

module.exports = mongoose.model('RecipientGroup', recipientGroupSchema);
