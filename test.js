const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON and URL-encoded form bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Multer configuration for handling file uploads
const storage = multer.memoryStorage(); // Example using memory storage
const upload = multer({ storage }); // Initialize multer

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_SERVER || 'smtp-relay.brevo.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_ADDRESS || '709e7d001@smtp-brevo.com',
    pass: process.env.EMAIL_PASSWORD || 'dJLE2SImqO6rYc0R'
  }
});

// API endpoint to send email with attachments
app.post('/send-email', upload.single('attachment'), (req, res) => {
  const { to, subject, text } = req.body;

  if (!to || !subject || !text) {
    return res.status(400).send('Missing required fields: to, subject, text');
  }

  const mailOptions = {
    from: process.env.EMAIL_ADDRESS || '709e7d001@smtp-brevo.com',
    to,
    subject,
    text
  };

  if (req.file) {
    // If there is an attachment, add it to mailOptions
    mailOptions.attachments = [{
      filename: req.file.originalname,
      content: req.file.buffer
    }];
  }

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
      res.status(500).send('Failed to send email');
    } else {
      console.log('Email sent: ' + info.response);
      res.status(200).send('Email sent successfully');
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
