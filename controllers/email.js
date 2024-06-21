const nodemailer = require("nodemailer");
const multer = require("multer");
const Email = require("../models/Email");

const storage = multer.memoryStorage();
const upload = multer({ storage });

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_SERVER || "smtp-relay.brevo.com",
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_ADDRESS || "709e7d001@smtp-brevo.com",
    pass: process.env.EMAIL_PASSWORD || "dJLE2SImqO6rYc0R",
  },
});

exports.sendEmail = async (req, res) => {
  upload.single('attachment')(req, res, async (err) => {
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

      if (req.file) {
        mailOptions.attachments = [
          {
            filename: req.file.originalname,
            content: req.file.buffer,
          },
        ];
      }

      await transporter.sendMail(mailOptions);

      await Email.create({
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
              },
            ]
          : [],
      });

      console.log(
        `Email Sent Successfully to ${recipientsArray.length} recipients`
      );
      res.status(200).send("Email sent successfully");
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
        { fromName: { $regex: search, $options: 'i' } }, 
        { fromId: { $regex: search, $options: 'i' } }, 
        { subject: { $regex: search, $options: 'i' } }
      ];
    }

    const totalCount = await Email.countDocuments(queryConditions);

    const emails = await Email.find(queryConditions)
      .sort({ sentAt: -1 })
      .skip((page - 1) * count)
      .limit(count);

    res.json({
      totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / count),
      emails
    });
  } catch (error) {
    console.error("Error Fetching Emails:", error.message);
    res.status(500).send(`Error Fetching Emails: ${error.message}`);
  }
};




