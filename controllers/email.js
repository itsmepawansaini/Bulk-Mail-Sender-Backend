const nodemailer = require("nodemailer");
const multer = require("multer");
const Email = require("../models/Email");
const upload = require("../upload");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_SERVER,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_ADDRESS,
    pass: process.env.EMAIL_PASSWORD,
  },
});

exports.sendEmail = async (req, res) => {
  upload.single("attachment")(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      console.error("Multer error:", err);
      return res.status(500).send(`Error uploading file: ${err.message}`);
    } else if (err) {
      console.error("Error:", err);
      return res.status(500).send(`Something went wrong: ${err.message}`);
    }

    const { fromName, fromId, replyto, to, subject, body } = req.body;
    const recipientsArray = to.split(",").map((email) => email.trim());

    try {
      let mailOptions = {
        from: `"${fromName}" <${fromId}>`,
        bcc: recipientsArray,
        subject,
        text: body,
        replyTo: replyto,
      };

      let fileUrl = null;
      if (req.file) {
        mailOptions.attachments = [
          {
            filename: req.file.originalname,
            path: req.file.path,
          },
        ];
        fileUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
      }

      await transporter.sendMail(mailOptions);

      const newEmail = new Email({
        fromName,
        fromId,
        to: recipientsArray,
        subject,
        body,
        attachments: req.file
          ? [
              {
                filename: req.file.originalname,
                contentType: req.file.mimetype,
                sizeInBytes: req.file.size,
                path: req.file.path,
                url: fileUrl,  // Ensure fileUrl is saved in the database
              },
            ]
          : [],
      });

      await newEmail.save();

      console.log(`Email Sent Successfully to ${recipientsArray.length} recipients`);
      res.status(200).json({ message: "Email sent successfully", fileUrl: fileUrl });
    } catch (error) {
      console.error("Error Sending Email:", error.message);
      res.status(500).send(`Error Sending Email: ${error.message}`);
    }
  });
};


exports.getSentEmails = async (req, res) => {
  try {
    let { search, count, page } = req.query;
    count = parseInt(count) || 10;
    page = parseInt(page) || 1;

    const queryConditions = {};
    if (search) {
      queryConditions.$or = [
        { fromName: { $regex: search, $options: "i" } },
        { fromId: { $regex: search, $options: "i" } },
        { subject: { $regex: search, $options: "i" } },
      ];
    }

    const totalCount = await Email.countDocuments(queryConditions);

    const emails = await Email.find(queryConditions)
      .select("-attachments")
      .sort({ sentAt: -1 })
      .skip((page - 1) * count)
      .limit(count);

    res.json({
      totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / count),
      emails,
    });
  } catch (error) {
    console.error("Error Fetching Emails:", error.message);
    res.status(500).send(`Error Fetching Emails: ${error.message}`);
  }
};

exports.getEmailById = async (req, res) => {
  const { emailId } = req.params;
  const { includeAttachments } = req.query;

  try {
    const email = await Email.findById(emailId);

    if (!email) {
      return res.status(404).send("Email Not Found");
    }

    if (includeAttachments === "true") {
      const emailWithAttachments = email.toObject();
      emailWithAttachments.attachments = email.attachments.map((att) => {
        const attachmentWithUrl = {
          ...att.toObject(),
          url: att.url || `${req.protocol}://${req.get("host")}/uploads/${att.filename}`,
        };
        console.log("Attachment with URL:", attachmentWithUrl);
        return attachmentWithUrl;
      });
      return res.json(emailWithAttachments);
    }

    res.json(email);
  } catch (error) {
    console.error("Error Fetching Email By ID:", error.message);
    res.status(500).send(`Error Fetching Email By ID: ${error.message}`);
  }
};








