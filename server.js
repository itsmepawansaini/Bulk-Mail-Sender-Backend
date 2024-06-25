const express = require("express");
const connectDB = require("./config/db");
// const cors = require("cors");
require("dotenv").config();
const path = require("path");
const fs = require("fs");

const app = express();

// Connect to database
connectDB();

// Middleware to parse JSON
app.use(express.json());

// Enable CORS for all origins
// app.use(cors());

const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Routes
app.get("/", (req, res) => {
  res.send("This is The Backend Server");
});

app.use("/api/auth", require("./routes/auth"));
app.use("/api/email", require("./routes/email"));
app.use("/api/sender", require("./routes/sender"));
app.use("/api/recipient", require("./routes/recipient"));
app.use("/api/dashboard", require("./routes/dashboard"));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server Running On Port: ${PORT}`));
