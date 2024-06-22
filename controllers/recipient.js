const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const nodemailer = require("nodemailer");
const Recipient = require("../models/Recipient");
const RecipientGroup = require("../models/RecipientGroup");
const mongoose = require("mongoose");

// Add Recipient
exports.addRecipient = async (req, res) => {
  const { name, email, groups } = req.body;
  console.log({ name, email, groups });

  try {
    let recipient = await Recipient.findOne({ email });

    if (
      !Array.isArray(groups) ||
      !groups.every(mongoose.Types.ObjectId.isValid)
    ) {
      return res.status(400).json({ msg: "Invalid Group IDs" });
    }

    const validGroups = await RecipientGroup.find({ _id: { $in: groups } });

    if (validGroups.length !== groups.length) {
      return res.status(400).json({ msg: "One or More Groups Not Found" });
    }

    if (recipient) {
      const newGroups = groups.filter(
        (groupId) => !recipient.groups.includes(groupId)
      );

      if (newGroups.length === 0) {
        return res
          .status(400)
          .json({ msg: "Recipient Already in These Groups" });
      }

      recipient.groups.push(...newGroups);
      await recipient.save();
    } else {
      recipient = new Recipient({
        name,
        email,
        groups,
      });

      await recipient.save();
    }

    res.send("Recipient Added");
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

//Get All Recipients
exports.getRecipients = async (req, res) => {
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

    const totalCount = await Recipient.countDocuments(queryConditions);

    const recipients = await Recipient.find(queryConditions)
      .populate("groups", "name")
      .sort({ createdAt: -1 })
      .skip((page - 1) * count)
      .limit(count);

    res.json({
      totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / count),
      recipients,
    });
  } catch (error) {
    console.error("Error Fetching Recipients:", error.message);
    res.status(500).send(`Error Fetching Recipients: ${error.message}`);
  }
};

//Update Recipient
exports.updateRecipient = async (req, res) => {
  const { id } = req.params;
  const { name, email, groups } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid Recipient ID" });
  }

  try {
    if (
      groups &&
      (!Array.isArray(groups) || !groups.every(mongoose.Types.ObjectId.isValid))
    ) {
      return res.status(400).json({ message: "Invalid group IDs" });
    }

    const recipient = await Recipient.findById(id);

    if (!recipient) {
      return res.status(404).json({ message: "Recipient Not Found" });
    }

    recipient.name = name || recipient.name;
    recipient.email = email || recipient.email;

    if (groups) {
      recipient.groups = groups;
    }

    recipient.updatedAt = Date.now();

    await recipient.save();

    res.json({ message: "Recipient Updated Successfully", recipient });
  } catch (error) {
    console.error("Error Updating Recipient:", error.message);
    res.status(500).send(`Error Updating Recipient: ${error.message}`);
  }
};

//Add Recipient Group
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

//Get All Recipient Groups
exports.getAllGroups = async (req, res) => {
  try {
    const groups = await RecipientGroup.find().sort({ createdAt: -1 });
    const groupsWithRecipientCount = await Promise.all(
      groups.map(async (group) => {
        const totalRecipients = await Recipient.countDocuments({
          group: group._id,
        });
        return {
          ...group.toObject(),
          totalRecipients,
        };
      })
    );

    res.json(groupsWithRecipientCount);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

//Get Recipients By Group Id
exports.getRecipientsByGroupId = async (req, res) => {
  const { groupId } = req.params;

  try {
    const group = await RecipientGroup.findById(groupId);

    if (!group) {
      return res.status(404).json({ msg: "Group Not Found" });
    }

    const recipients = await Recipient.find({ group: groupId }).populate(
      "group",
      "name"
    );

    res.json(recipients);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

//Upload Recipients Via CSV
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
      .on("data", (data) => {
        results.push(data);
      })
      .on("end", async () => {
        try {
          for (const row of results) {
            const { name, email } = row;
            let recipient = await Recipient.findOne({ email });

            if (!recipient) {
              await Recipient.create({
                name,
                email,
                group: group._id,
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

//Delete Recipient
exports.deleteRecipient = async (req, res) => {
  const RecipientId = req.params.id;
  console.log(RecipientId.id);

  try {
    const recipient = await Recipient.findById(RecipientId);

    if (!recipient) {
      return res.status(404).json({ message: "Recipient Not Found" });
    }

    await Recipient.deleteOne({ _id: RecipientId });

    res.json({ message: "Recipient Deleted Successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//Delete Recipient Group
exports.deleteRecipientGroup = async (req, res) => {
  const recipientGroupId = req.params.id;
  console.log(recipientGroupId);

  if (!mongoose.Types.ObjectId.isValid(recipientGroupId)) {
    return res.status(400).json({ message: "Invalid Recipient Group ID" });
  }

  try {
    const recipientGroup = await RecipientGroup.findById(recipientGroupId);

    if (!recipientGroup) {
      return res.status(404).json({ message: "Recipient Group Not Found" });
    }

    const recipientCount = await Recipient.countDocuments({
      group: recipientGroupId,
    });

    if (recipientCount > 0) {
      return res.json({ message: "You Cannot Delete Group With Recipients" });
    }

    await RecipientGroup.deleteOne({ _id: recipientGroupId });

    res.json({ message: "Recipient Group Deleted Successfully" });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: error.message });
  }
};

// Add Recipient To Group
exports.addRecipientToGroup = async (req, res) => {
  const { recipientId, groupId } = req.body;

  try {
    if (!mongoose.Types.ObjectId.isValid(recipientId) || !mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ message: "Invalid Recipient ID or Group ID" });
    }

    const recipient = await Recipient.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: "Recipient not found" });
    }

    const group = await RecipientGroup.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Recipient Group not found" });
    }

    if (recipient.groups.includes(groupId)) {
      return res.status(400).json({ message: "Recipient already in this group" });
    }

    recipient.groups.push(groupId);
    await recipient.save();

    res.json({ message: "Recipient added to group successfully", recipient });
  } catch (error) {
    console.error("Error adding recipient to group:", error.message);
    res.status(500).send(`Server Error: ${error.message}`);
  }
};

