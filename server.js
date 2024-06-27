const express = require("express");
const connectDB = require("./config/db");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();

connectDB();

app.use(express.json());
app.use(cors());

const uploadsDir = path.join(__dirname, "uploads");
app.use("/uploads", express.static(uploadsDir));

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
