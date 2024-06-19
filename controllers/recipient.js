const nodemailer = require("nodemailer");
const Recipient = require("../models/Recipient");

exports.addRecipient = async (req, res) => {
  const { name, email } = req.body;

  try {
    let recipient = await Recipient.findOne({ email });

    if (recipient) {
      return res.status(400).json({ msg: "Recipient Already Exists" });
    }

    await Recipient.create({
      name,
      email,
    });

    res.send(`Recipient Added`);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

exports.getRecipient = async (req, res) => {
  try {
    const recipients = await Recipient.find().sort({ sentAt: -1 });
    res.json(recipients);
  } catch (error) {
    console.error("Error Fetching Recipient:", error.message);
    res.status(500).send(`Error Fetching Recipient: ${error.message}`);
  }
};
