require('dotenv').config();
const jwt = require('jsonwebtoken');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies.token; // ✅ read token from cookie
    if (!token) return res.status(401).json({ message: 'Not authenticated' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { id, role } = decoded;

    let user;
    if (role === 'student') {
      user = await Student.findById(id).select('-password');
    } else if (role === 'faculty') {
      user = await Faculty.findById(id).select('-password');
    }

    if (!user) return res.status(401).json({ message: 'User not found' });

    req.user = user;
    req.userRole = role;
    next();
  } catch (err) {
    console.error('authMiddleware error', err);
    res.status(401).json({ message: 'Authentication failed' });
  }
};

module.exports = authMiddleware;
