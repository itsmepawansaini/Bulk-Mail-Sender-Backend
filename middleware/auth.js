const jwt = require('jsonwebtoken');
require('dotenv').config();
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
    const token = req.header('x-auth-token');

    if (!token) {
        return res.status(401).json({ msg: 'Authorization Failed, Token Not Provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = await User.findById(decoded.user.id).select('-password');

        next();
    } catch (err) {
        res.status(401).json({ msg: 'Invalid Token' });
    }
};

module.exports = authMiddleware;
