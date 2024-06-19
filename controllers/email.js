const nodemailer = require("nodemailer");
const Email = require("../models/Email");

exports.sendEmail = async (req, res) => {
  const { fromName, fromId, replyto, to, subject, body } = req.body;

  const recipientsArray = to.split(",").map((email) => email.trim());

  try {
    const { name, email } = req.user;

    let transporter = nodemailer.createTransport({
      host: process.env.SMTP_SERVER,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_ADDRESS,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    let mailOptions = {
      from: `"${fromName}" <${fromId}>`,
      bcc: recipientsArray,
      subject,
      text: body,
      replyTo: replyto,
    };

    await transporter.sendMail(mailOptions);

    await Email.create({
      fromName: fromName,
      fromId: fromId,
      to: recipientsArray,
      subject,
      body,
    });

    console.log(`Email Sent Successfully To`,recipientsArray.length);
    res.send(`Sent Successfully`);
  } catch (error) {
    console.error("Error Sending Email:", error.message);
    res.status(500).send(`Error Sending Email: ${error.message}`);
  }
};



exports.getSentEmails = async (req, res) => {
  try {
    const emails = await Email.find().sort({ sentAt: -1 });
    res.json(emails);
  } catch (error) {
    console.error("Error Fetching Emails:", error.message);
    res.status(500).send(`Error Fetching Emails: ${error.message}`);
  }
};



