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

    const groupsWithRecipients = await Promise.all(
      groups.map(async (group) => {
        const totalRecipients = await Recipient.countDocuments({
          groups: group._id,
        });

        const populatedGroup = await RecipientGroup.findById(group._id)
          .populate({
            path: 'recipients',
            select: '_id name email createdAt',
          })
          .exec();

        return {
          _id: group._id,
          name: group.name,
          createdAt: group.createdAt,
          totalRecipients,
          recipients: populatedGroup.recipients,
        };
      })
    );

    res.json(groupsWithRecipients);
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
      groups: recipientGroupId,
    });

    if (recipientCount > 0) {
      return res.status(400).json({ message: "Cannot delete group with recipients" });
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
  const { recipientIds, groupId } = req.body;

  try {
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ message: "Invalid Group ID" });
    }

    const group = await RecipientGroup.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Recipient Group not found" });
    }

    const invalidRecipientIds = recipientIds.filter(
      (id) => !mongoose.Types.ObjectId.isValid(id)
    );
    if (invalidRecipientIds.length > 0) {
      return res.status(400).json({ message: "Invalid Recipient ID(s)" });
    }

    const recipients = await Recipient.find({ _id: { $in: recipientIds } });
    const validRecipientIds = recipients.map((recipient) =>
      recipient._id.toString()
    );

    const notFoundRecipientIds = recipientIds.filter(
      (id) => !validRecipientIds.includes(id)
    );
    if (notFoundRecipientIds.length > 0) {
      return res
        .status(404)
        .json({
          message: `Recipient(s) not found for IDs: ${notFoundRecipientIds.join(
            ", "
          )}`,
        });
    }

    recipients.forEach((recipient) => {
      if (!recipient.groups.includes(groupId)) {
        recipient.groups.push(groupId);
      }
    });

    await Promise.all(recipients.map((recipient) => recipient.save()));

    res.json({ message: "Recipients added to group successfully", recipients });
  } catch (error) {
    console.error("Error adding recipients to group:", error.message);
    res.status(500).send(`Server Error: ${error.message}`);
  }
};

//Update Recipient Group
exports.updateRecipientGroup = async (req, res) => {
  const { name } = req.body;
  const recipientgroupId = req.params.id;

  try {
    let recipientgroup = await RecipientGroup.findById(recipientgroupId);

    if (!recipientgroup) {
      return res.status(404).json({ message: "Recipient Group Not Found" });
    }

    recipientgroup.name = name || recipientgroup.name;
    recipientgroup.updatedAt = Date.now();

    await recipientgroup.save();

    res.json({
      message: "Recipient Group Updated Successfully",
      data: recipientgroup,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//Remove Recipient From Group
exports.removeRecipientFromGroup = async (req, res) => {
  const { groupId, recipientId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(groupId) || !mongoose.Types.ObjectId.isValid(recipientId)) {
    return res.status(400).json({ message: "Invalid Group ID or Recipient ID" });
  }

  try {
    const recipientGroup = await RecipientGroup.findById(groupId);
    if (!recipientGroup) {
      return res.status(404).json({ message: "Recipient Group not found" });
    }

    const recipient = await Recipient.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: "Recipient not found" });
    }

    if (!recipient.groups.includes(groupId)) {
      return res.status(400).json({ message: "Recipient is not in this group" });
    }

    recipient.groups = recipient.groups.filter(group => group.toString() !== groupId);
    await recipient.save();

    res.json({ message: "Recipient removed from group successfully", recipient });
  } catch (error) {
    console.error("Error removing recipient from group:", error.message);
    res.status(500).json({ error: "Server Error" });
  }
};