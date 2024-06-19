const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
require('dotenv').config();

const app = express();

connectDB();

app.use(express.json());
app.use(cors());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/email', require('./routes/email'));

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => console.log(`Server Running On Port:${PORT}`));
