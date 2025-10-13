require('dotenv').config();

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');

// helper to sign JWT token
const signToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// helper to send token as HTTP-only cookie
const createAndSendToken = (res, token, user, statusCode = 200) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'None', // allow frontend to send requests
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  });

  return res.status(statusCode).json({
    message: 'Success',
    user,
  });
};

/* ================= STUDENT ================= */

// Student signup
exports.studentSignup = async (req, res) => {
  try {
    const { rollNumber, name, email, branch, password } = req.body;
    if (!rollNumber || !name || !email || !password)
      return res.status(400).json({ message: 'Required fields missing' });

    if (!validator.isEmail(email))
      return res.status(400).json({ message: 'Invalid email' });

    const existing = await Student.findOne({
      $or: [{ rollNumber }, { email }],
    });
    if (existing)
      return res.status(400).json({ message: 'Student already exists' });

    const hashed = await bcrypt.hash(password, 10);
    const profilePictureUrl = req.file?.location;

    const student = await Student.create({
      rollNumber,
      name,
      email,
      branch,
      password: hashed,
      profilePictureUrl,
    });

    const token = signToken(student._id, 'student');
    createAndSendToken(res, token, {
      id: student._id,
      name: student.name,
      rollNumber: student.rollNumber,
      email: student.email,
      branch: student.branch,
      profilePictureUrl: student.profilePictureUrl,
      role: 'student',
    }, 201);
  } catch (err) {
    console.error('studentSignup error', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Student login
exports.studentLogin = async (req, res) => {
  try {
    const { rollNumber, password } = req.body;
    if (!rollNumber || !password)
      return res.status(400).json({ message: 'Missing credentials' });

    const student = await Student.findOne({ rollNumber });
    if (!student)
      return res.status(401).json({ message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, student.password);
    if (!match)
      return res.status(401).json({ message: 'Invalid credentials' });

    const token = signToken(student._id, 'student');
    createAndSendToken(res, token, {
      id: student._id,
      name: student.name,
      rollNumber: student.rollNumber,
      email: student.email,
      branch: student.branch,
      profilePictureUrl: student.profilePictureUrl,
      role: 'student',
    });
  } catch (err) {
    console.error('studentLogin error', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/* ================= FACULTY ================= */

// Faculty signup
exports.facultySignup = async (req, res) => {
  try {
    const { facultyId, name, email, branch, position, password } = req.body;
    if (!facultyId || !name || !email || !password)
      return res.status(400).json({ message: 'Required fields missing' });

    if (!validator.isEmail(email))
      return res.status(400).json({ message: 'Invalid email' });

    const existing = await Faculty.findOne({ $or: [{ facultyId }, { email }] });
    if (existing)
      return res.status(400).json({ message: 'Faculty already exists' });

    const hashed = await bcrypt.hash(password, 10);
    const profilePictureUrl = req.file?.location;

    const faculty = await Faculty.create({
      facultyId,
      name,
      email,
      branch,
      position,
      password: hashed,
      profilePictureUrl,
    });

    const token = signToken(faculty._id, 'faculty');
    createAndSendToken(res, token, {
      id: faculty._id,
      name: faculty.name,
      facultyId: faculty.facultyId,
      email: faculty.email,
      branch: faculty.branch,
      position: faculty.position,
      profilePictureUrl: faculty.profilePictureUrl,
      role: 'faculty',
    }, 201);
  } catch (err) {
    console.error('facultySignup error', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Faculty login
exports.facultyLogin = async (req, res) => {
  try {
    const { facultyId, password } = req.body;
    if (!facultyId || !password)
      return res.status(400).json({ message: 'Missing credentials' });

    const faculty = await Faculty.findOne({ facultyId });
    if (!faculty)
      return res.status(401).json({ message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, faculty.password);
    if (!match)
      return res.status(401).json({ message: 'Invalid credentials' });

    const token = signToken(faculty._id, 'faculty');
    createAndSendToken(res, token, {
      id: faculty._id,
      name: faculty.name,
      facultyId: faculty.facultyId,
      email: faculty.email,
      branch: faculty.branch,
      position: faculty.position,
      profilePictureUrl: faculty.profilePictureUrl,
      role: 'faculty',
    });
  } catch (err) {
    console.error('facultyLogin error', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/* ================= LOGOUT ================= */

exports.logout = (req, res) => {
  res
    .clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'None',
    })
    .status(200)
    .json({ message: 'Logged out successfully' });
};
