require('dotenv').config();

const Resource = require('../models/Resource'); // ✅ import Resource model

exports.getMyProfile = async (req, res) => {
  try {
    const user = req.user; // set in auth middleware
    const role = req.userRole;

    // Fetch resources uploaded by this user
    const uploadedResources = await Resource.find({ 'uploadedBy.id': user._id }).sort({ createdAt: -1 });

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        ...(role === 'student' ? { rollNumber: user.rollNumber } : { facultyId: user.facultyId, position: user.position }),
        branch: user.branch,
        profilePictureUrl: user.profilePictureUrl,
        role
      },
      uploadedResources
    });
  } catch (err) {
    console.error('getMyProfile error', err);
    res.status(500).json({ message: 'Server error' });
  }
};
