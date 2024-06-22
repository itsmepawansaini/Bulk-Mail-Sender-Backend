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

    res.send(`Sender Added`);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

exports.getSender = async (req, res) => {
  try {
    let { search, count, page } = req.query;
    count = parseInt(count) || 10;
    page = parseInt(page) || 1;

    const queryConditions = {};
    if (search) {
      queryConditions.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const totalCount = await Sender.countDocuments(queryConditions);

    const senders = await Sender.find(queryConditions)
      .sort({ sentAt: -1 })
      .skip((page - 1) * count)
      .limit(count);

    res.json({
      totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / count),
      senders,
    });
  } catch (error) {
    console.error("Error Fetching Sender:", error.message);
    res.status(500).send(`Error Fetching Sender: ${error.message}`);
  }
};

exports.deleteSender = async (req, res) => {
  const senderId = req.params.id;
  console.log(senderId.id);

  try {
    const sender = await Sender.findById(senderId);

    if (!sender) {
      return res.status(404).json({ message: "Sender Not Found" });
    }

    await Sender.deleteOne({ _id: senderId });

    res.json({ message: "Sender Deleted Successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
