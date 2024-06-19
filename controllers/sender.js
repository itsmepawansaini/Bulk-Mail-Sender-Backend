const nodemailer = require("nodemailer");
const Sender = require("../models/Sender");

exports.addSender = async (req, res) => {
  const { name, email } = req.body;

  try {
    let sender = await Sender.findOne({ email });

    if (sender) {
      return res.status(400).json({ msg: "Sender Already Exists" });
    }

    await Sender.create({
      name,
      email,
    });

    // await Sender.save();

    res.send(`Sender Added`);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

exports.getSender = async (req, res) => {
  try {
    const senders = await Sender.find().sort({ sentAt: -1 });
    res.json(senders);
  } catch (error) {
    console.error("Error Fetching Sender:", error.message);
    res.status(500).send(`Error Fetching Sender: ${error.message}`);
  }
};
