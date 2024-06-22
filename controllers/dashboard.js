const express = require("express");
const router = express.Router();
const Mail = require("../models/Email");
const Sender = require("../models/Sender");
const Recipient = require("../models/Recipient");
const RecipientGroup = require("../models/RecipientGroup");

exports.getStats = async (req, res) => {
  try {
    const totalMails = await Mail.countDocuments();
    const totalSenders = await Sender.countDocuments();
    const totalRecipients = await Recipient.countDocuments();
    const totalRecipientsGroup = await RecipientGroup.countDocuments();

    res.json({
      totalMails,
      totalSenders,
      totalRecipients,
      totalRecipientsGroup,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};
