const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const nodemailer = require("nodemailer");
const Recipient = require("../models/Recipient");
const RecipientGroup = require("../models/RecipientGroup");

exports.addRecipient = async (req, res) => {
  const { name, email, groupId } = req.body;

  try {
    let recipient = await Recipient.findOne({ email });

    if (recipient) {
      return res.status(400).json({ msg: "Recipient Already Exists" });
    }

    let group = await RecipientGroup.findById(groupId);

    if (!group) {
      return res.status(400).json({ msg: "Group Not Found" });
    }

    await Recipient.create({
      name,
      email,
      group: group._id
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
      .populate('group', 'name') 
      .sort({ createdAt: -1 })
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

exports.addRecipientGroup = async (req, res) => {
  const { name } = req.body;

  try {
    let group = await RecipientGroup.findOne({ name });

    if (group) {
      return res.status(400).json({ msg: "Group Already Exists" });
    }

    group = await RecipientGroup.create({ name });

    res.json(group);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

exports.getAllGroups = async (req, res) => {
  try {
    const groups = await RecipientGroup.find().sort({ createdAt: -1 });
    const groupsWithRecipientCount = await Promise.all(
      groups.map(async (group) => {
        const totalRecipients = await Recipient.countDocuments({ group: group._id });
        return {
          ...group.toObject(),
          totalRecipients
        };
      })
    );

    res.json(groupsWithRecipientCount);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};


exports.getRecipientsByGroupId = async (req, res) => {
  const { groupId } = req.params;

  try {
    const group = await RecipientGroup.findById(groupId);

    if (!group) {
      return res.status(404).json({ msg: "Group Not Found" });
    }

    const recipients = await Recipient.find({ group: groupId }).populate('group', 'name');

    res.json(recipients);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

exports.uploadRecipients = async (req, res) => {
  const { groupId } = req.body;

  try {
    const group = await RecipientGroup.findById(groupId);

    if (!group) {
      return res.status(400).json({ msg: "Group Not Found" });
    }

    if (!req.file) {
      return res.status(400).json({ msg: "No File Uploaded" });
    }

    const results = [];

    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data) => {
        results.push(data);
      })
      .on('end', async () => {
        try {
          for (const row of results) {
            const { name, email } = row;
            let recipient = await Recipient.findOne({ email });

            if (!recipient) {
              await Recipient.create({
                name,
                email,
                group: group._id
              });
            }
          }

          fs.unlinkSync(req.file.path);

          res.send("Recipients Uploaded Successfully");
        } catch (err) {
          console.error(err.message);
          res.status(500).send("Server Error");
        }
      });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};
