const nodemailer = require("nodemailer");
const Sender = require("../models/Sender");

// Add Sender
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

//Get All Sender
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

// Get All Sender Without Pagination
exports.exportSenders = async (req, res) => {
  try {
    const { search } = req.query;

    const queryConditions = {};
    if (search) {
      queryConditions.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const senders = await Sender.find(queryConditions).sort({ sentAt: -1 });

    res.json(senders);
  } catch (error) {
    console.error("Error Exporting Senders:", error.message);
    res.status(500).send(`Error Exporting Senders: ${error.message}`);
  }
};

//Get Sender Details
exports.getSenderById = async (req, res) => {
  const senderId = req.params.id;
  console.log(req.params.id);
  try {
    const sender = await Sender.findById(senderId);

    if (!sender) {
      return res.status(404).send("Sender Not Found");
    }

    res.json(sender);
  } catch (error) {
    console.error("Error Fetching Sender By ID:", error.message);
    res.status(500).send(`Error Fetching Sender By ID: ${error.message}`);
  }
};

//Update Sender
exports.updateSender = async (req, res) => {
  const { name, email } = req.body;
  const senderId = req.params.id;

  try {
    let sender = await Sender.findById(senderId);

    if (!sender) {
      return res.status(404).json({ message: "Sender Not Found" });
    }

    sender.name = name || sender.name;
    sender.email = email || sender.email;
    sender.updatedAt = Date.now();

    await sender.save();

    res.json({
      message: "Sender Updated Successfully",
      data: sender,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//Delete Sender
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
