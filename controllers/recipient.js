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
    let { search, count, page } = req.query;
    count = parseInt(count) || 10;
    page = parseInt(page) || 1;

    const queryConditions = {};
    if (search) {
      queryConditions.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const totalCount = await Recipient.countDocuments(queryConditions);

    const recipients = await Recipient.find(queryConditions)
      .sort({ createdAt: 1 })
      .skip((page - 1) * count)
      .limit(count);

    res.json({
      totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / count),
      recipients
    });
  } catch (error) {
    console.error("Error Fetching Recipient:", error.message);
    res.status(500).send(`Error Fetching Recipient: ${error.message}`);
  }
};


