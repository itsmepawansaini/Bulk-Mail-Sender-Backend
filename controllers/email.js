const nodemailer = require("nodemailer");
const Email = require("../models/Email");

exports.sendEmail = async (req, res) => {
  const { to, subject, body } = req.body;

  const recipientsArray = to.split(",").map((email) => email.trim());
  console.log(recipientsArray);

  try {
    let transporter = nodemailer.createTransport({
      host: process.env.SMTP_SERVER,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_ADDRESS,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const from = '"Pawan Saini" <pawan.artistonk@gmail.com>';

    let mailOptions = {
      from,
      bcc: recipientsArray,
      subject,
      text: body,
      replyTo: "hr@artistonk.com",
    };

    await transporter.sendMail(mailOptions);

    await Email.create({
      from,
      to: recipientsArray,
      subject,
      body,
    });

    console.log(`Email Sent Successfully To All Recipients`);
    res.send(`Email Sent Successfully To All Recipients`);
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



